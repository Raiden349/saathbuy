create table public.auctions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 120),
  description text,
  image_url text,
  starting_price int not null check (starting_price > 0),
  min_bid_increment int not null default 1 check (min_bid_increment > 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'live' check (status in ('live', 'ended', 'cancelled')),
  top_bid_points int not null default 0 check (top_bid_points >= 0),
  top_bidder_id uuid references public.profiles(id),
  bid_count int not null default 0 check (bid_count >= 0),
  winner_id uuid references public.profiles(id),
  final_price int,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (top_bid_points < starting_price),
  check (final_price is null or final_price between 1 and starting_price)
);

create table public.auction_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  points int not null check (points > 0),
  status text not null default 'leading' check (status in ('leading', 'outbid', 'won', 'lost')),
  created_at timestamptz not null default now()
);

alter table public.points_ledger add column auction_id uuid references public.auctions(id) on delete set null;
alter table public.points_ledger drop constraint if exists points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check
  check (reason in ('earned', 'redeemed', 'refund', 'bonus', 'auction_bid', 'auction_refund'));

create index auctions_live_ends_idx on public.auctions (status, ends_at);
create index auction_bids_auction_created_idx on public.auction_bids (auction_id, created_at desc);
create index auction_bids_user_created_idx on public.auction_bids (user_id, created_at desc);
create index points_ledger_auction_idx on public.points_ledger (auction_id, created_at desc);

alter table public.auctions enable row level security;
alter table public.auction_bids enable row level security;

revoke all on public.auctions, public.auction_bids from anon, authenticated;
grant select on public.auctions to anon, authenticated;
grant select on public.auction_bids to authenticated;
grant all on public.auctions, public.auction_bids to service_role;
create policy "auctions public read" on public.auctions
for select to anon, authenticated using (true);
create policy "auction bids own or admin read" on public.auction_bids
for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

create or replace function public.create_auction(
  p_title text,
  p_description text,
  p_image_url text,
  p_starting_price int,
  p_min_bid_increment int,
  p_ends_at timestamptz
)
returns public.auctions
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.auctions%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception using message = 'Admin access is required.', errcode = '42501';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 2 and 120
    or p_starting_price is null or p_starting_price < 2
    or p_min_bid_increment is null or p_min_bid_increment < 1
    or p_ends_at is null or p_ends_at <= clock_timestamp() then
    raise exception using message = 'Check the auction title, starting price, bid step, and closing time.', errcode = '22023';
  end if;
  insert into public.auctions (title, description, image_url, starting_price, min_bid_increment, ends_at, created_by)
  values (btrim(p_title), nullif(btrim(p_description), ''), nullif(btrim(p_image_url), ''), p_starting_price, p_min_bid_increment, p_ends_at, auth.uid())
  returning * into result;
  return result;
end;
$$;

create or replace function public.bid_on_auction(p_auction uuid, p_points int)
returns public.auctions
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  auction_row public.auctions%rowtype;
  bidder_balance int;
  leader_balance int;
  previous_points int := 0;
  minimum_points int;
begin
  if current_user_id is null then
    raise exception using message = 'Sign in before placing a bid.', errcode = '28000';
  end if;
  select * into auction_row from public.auctions where id = p_auction for update;
  if not found then
    raise exception using message = 'This auction could not be found.', errcode = 'P0002';
  end if;
  if auction_row.status <> 'live' or clock_timestamp() >= auction_row.ends_at then
    raise exception using message = 'This auction has ended. Refresh the page to see the result.', errcode = 'P0001';
  end if;

  minimum_points := auction_row.top_bid_points + auction_row.min_bid_increment;
  if p_points is null or p_points < minimum_points or p_points >= auction_row.starting_price then
    raise exception using message = format('Your bid must be at least %s points and less than the starting price.', minimum_points), errcode = '22023';
  end if;

  -- Lock both profiles in the same order to prevent simultaneous auctions deadlocking.
  perform profile.id
  from public.profiles as profile
  where profile.id = any(array[current_user_id, auction_row.top_bidder_id])
  order by profile.id
  for update;

  select points_balance into bidder_balance from public.profiles where id = current_user_id;
  if bidder_balance is null then
    raise exception using message = 'Your profile is not ready yet.', errcode = 'P0001';
  end if;

  if auction_row.top_bidder_id = current_user_id then
    previous_points := auction_row.top_bid_points;
  elsif auction_row.top_bidder_id is not null then
    select points_balance into leader_balance from public.profiles where id = auction_row.top_bidder_id;
    if leader_balance is null then
      raise exception using message = 'The current leader profile could not be found.', errcode = 'P0001';
    end if;
    update public.profiles set points_balance = points_balance + auction_row.top_bid_points where id = auction_row.top_bidder_id;
    insert into public.points_ledger (user_id, delta, reason, auction_id)
    values (auction_row.top_bidder_id, auction_row.top_bid_points, 'auction_refund', auction_row.id);
  end if;

  if auction_row.top_bidder_id is not null then
    update public.auction_bids set status = 'outbid'
    where auction_id = auction_row.id and status = 'leading';
  end if;

  if bidder_balance + previous_points < p_points then
    raise exception using message = format('You have %s available points for this bid.', bidder_balance + previous_points), errcode = '22023';
  end if;

  update public.profiles set points_balance = points_balance + previous_points - p_points where id = current_user_id;
  if previous_points > 0 then
    insert into public.points_ledger (user_id, delta, reason, auction_id)
    values (current_user_id, previous_points, 'auction_refund', auction_row.id);
  end if;
  insert into public.points_ledger (user_id, delta, reason, auction_id)
  values (current_user_id, -p_points, 'auction_bid', auction_row.id);
  insert into public.auction_bids (auction_id, user_id, points, status)
  values (auction_row.id, current_user_id, p_points, 'leading');

  update public.auctions
  set top_bid_points = p_points,
      top_bidder_id = current_user_id,
      bid_count = bid_count + 1
  where id = auction_row.id
  returning * into auction_row;
  return auction_row;
end;
$$;

create or replace function public.settle_expired_auctions()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  auction_row public.auctions%rowtype;
  settled_count int := 0;
begin
  for auction_row in
    select * from public.auctions
    where status = 'live' and ends_at <= clock_timestamp()
    order by ends_at
    for update skip locked
  loop
    update public.auctions
    set status = 'ended',
        winner_id = auction_row.top_bidder_id,
        final_price = case when auction_row.top_bidder_id is null then null else auction_row.starting_price - auction_row.top_bid_points end
    where id = auction_row.id;
    if auction_row.top_bidder_id is not null then
      update public.auction_bids set status = 'lost'
      where auction_id = auction_row.id and status = 'outbid';
      update public.auction_bids set status = 'won'
      where auction_id = auction_row.id and status = 'leading';
    end if;
    settled_count := settled_count + 1;
  end loop;
  return settled_count;
end;
$$;

revoke all on public.auction_bids from anon, authenticated;
grant select on public.auction_bids to authenticated;
revoke all on function public.create_auction(text, text, text, int, int, timestamptz) from public;
revoke all on function public.bid_on_auction(uuid, int) from public;
revoke all on function public.settle_expired_auctions() from public;
grant execute on function public.create_auction(text, text, text, int, int, timestamptz) to authenticated;
grant execute on function public.bid_on_auction(uuid, int) to authenticated;
grant execute on function public.settle_expired_auctions() to anon, authenticated, service_role;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'auctions'
  ) then
    alter publication supabase_realtime add table public.auctions;
  end if;
end;
$$;
