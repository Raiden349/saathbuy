create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  department text,
  student_type text check (student_type in ('hostel', 'commuter')),
  is_admin boolean not null default false,
  points_balance int not null default 0 check (points_balance >= 0),
  free_fee_credits int not null default 0,
  streak_weeks int not null default 0,
  last_join_week text,
  created_at timestamptz not null default now()
);

create table public.pickup_points (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  active boolean not null default true
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  image_url text,
  category text,
  retail_price int not null check (retail_price > 0),
  tiers jsonb not null,
  max_qty_per_user int not null default 3,
  deadline timestamptz not null,
  pickup_point_id uuid references public.pickup_points(id),
  pickup_time timestamptz,
  status text not null default 'open'
    check (status in ('open', 'confirmed', 'failed', 'delivered', 'completed')),
  joiner_count int not null default 0,
  final_tier text,
  final_price int,
  sponsor_name text,
  created_at timestamptz not null default now()
);

create table public.deal_costs (
  deal_id uuid primary key references public.deals(id) on delete cascade,
  wholesale_cost int not null
);

create table public.deal_joins (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  qty int not null check (qty between 1 and 10),
  points_redeemed int not null default 0 check (points_redeemed % 100 = 0),
  service_fee int not null default 20,
  payment_method text not null check (payment_method in ('cash_at_pickup', 'wallet')),
  wallet_reference text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  status text not null default 'joined'
    check (status in ('joined', 'cancelled', 'collected', 'failed')),
  referred_by uuid references public.profiles(id),
  amount_due int,
  collected_at timestamptz,
  created_at timestamptz not null default now(),
  unique (deal_id, user_id)
);

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('earned', 'redeemed', 'refund', 'bonus')),
  join_id uuid references public.deal_joins(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.deal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.request_votes (
  request_id uuid references public.deal_requests(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (request_id, user_id)
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index deals_status_deadline_idx on public.deals (status, deadline);
create index deal_joins_user_status_idx on public.deal_joins (user_id, status);
create index points_ledger_user_created_idx on public.points_ledger (user_id, created_at desc);
create index deal_requests_created_idx on public.deal_requests (created_at desc);
create index request_votes_request_idx on public.request_votes (request_id);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin
  );
$$;

create or replace function public.refresh_joiner_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_deal uuid := coalesce(new.deal_id, old.deal_id);
begin
  update public.deals
  set joiner_count = (
    select count(*)::int
    from public.deal_joins
    where deal_id = affected_deal and status in ('joined', 'collected')
  )
  where id = affected_deal;
  return null;
end;
$$;

create trigger trg_joiner_count
after insert or update or delete on public.deal_joins
for each row execute function public.refresh_joiner_count();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_student_type text := new.raw_user_meta_data ->> 'student_type';
begin
  insert into public.profiles (id, full_name, department, student_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'department', ''),
    case when requested_student_type in ('hostel', 'commuter') then requested_student_type else null end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.join_deal(
  p_deal uuid,
  p_qty int,
  p_points int,
  p_method text,
  p_wallet_ref text,
  p_referrer uuid
)
returns public.deal_joins
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  deal_row public.deals%rowtype;
  profile_row public.profiles%rowtype;
  join_row public.deal_joins%rowtype;
  prior_join public.deal_joins%rowtype;
  current_week text := to_char(now() at time zone 'Asia/Karachi', 'IYYY-"W"IW');
  previous_week text := to_char((now() at time zone 'Asia/Karachi')::date - 7, 'IYYY-"W"IW');
  new_streak int;
  new_credits int;
  fee int := 20;
  clean_wallet_ref text;
begin
  if current_user_id is null then
    raise exception using message = 'Sign in before joining a deal.', errcode = '28000';
  end if;
  if p_qty is null or p_qty < 1 then
    raise exception using message = 'Choose at least one pack.', errcode = '22023';
  end if;
  if p_points is null or p_points < 0 or p_points % 100 <> 0 then
    raise exception using message = 'Redeem points in blocks of 100.', errcode = '22023';
  end if;
  if p_method is null or p_method not in ('cash_at_pickup', 'wallet') then
    raise exception using message = 'Choose cash at pickup or wallet.', errcode = '22023';
  end if;
  clean_wallet_ref := nullif(btrim(p_wallet_ref), '');
  if p_method = 'wallet' and clean_wallet_ref is null then
    raise exception using message = 'Enter the transaction ID from your JazzCash or Easypaisa receipt.', errcode = '22023';
  end if;
  if p_method = 'cash_at_pickup' then
    clean_wallet_ref := null;
  end if;

  select * into deal_row from public.deals where id = p_deal for update;
  if not found then
    raise exception using message = 'This deal could not be found.', errcode = 'P0002';
  end if;
  if deal_row.status <> 'open' or clock_timestamp() >= deal_row.deadline then
    raise exception using message = 'This deal ended. Pick another open deal.', errcode = 'P0001';
  end if;
  if p_qty > deal_row.max_qty_per_user then
    raise exception using message = format('You can join with up to %s packs on this deal.', deal_row.max_qty_per_user), errcode = '22023';
  end if;

  select * into profile_row from public.profiles where id = current_user_id for update;
  if not found then
    raise exception using message = 'Your student profile is not ready yet.', errcode = 'P0001';
  end if;
  if p_points > profile_row.points_balance then
    raise exception using message = format('You have %s points. Redeem %s or fewer.', profile_row.points_balance, profile_row.points_balance - profile_row.points_balance % 100), errcode = '22023';
  end if;

  select * into prior_join
  from public.deal_joins
  where deal_id = p_deal and user_id = current_user_id
  for update;
  if found and prior_join.status <> 'cancelled' then
    raise exception using message = 'You already joined this deal.', errcode = '23505';
  end if;

  if profile_row.free_fee_credits > 0 then
    fee := 0;
  end if;

  new_streak := profile_row.streak_weeks;
  new_credits := profile_row.free_fee_credits - case when fee = 0 then 1 else 0 end;
  if profile_row.last_join_week is distinct from current_week then
    if profile_row.last_join_week = previous_week then
      new_streak := profile_row.streak_weeks + 1;
    else
      new_streak := 1;
    end if;
    if new_streak >= 3 then
      new_streak := 0;
      new_credits := new_credits + 1;
    end if;
  end if;

  if found then
    update public.deal_joins
    set qty = p_qty,
        points_redeemed = p_points,
        service_fee = fee,
        payment_method = p_method,
        wallet_reference = clean_wallet_ref,
        payment_status = 'pending',
        status = 'joined',
        referred_by = case when p_referrer = current_user_id then null else p_referrer end,
        amount_due = null,
        collected_at = null,
        created_at = now()
    where id = prior_join.id
    returning * into join_row;
  else
    insert into public.deal_joins (
      deal_id, user_id, qty, points_redeemed, service_fee,
      payment_method, wallet_reference, referred_by
    ) values (
      p_deal, current_user_id, p_qty, p_points, fee,
      p_method, clean_wallet_ref,
      case when p_referrer = current_user_id then null else p_referrer end
    ) returning * into join_row;
  end if;

  update public.profiles
  set points_balance = points_balance - p_points,
      free_fee_credits = new_credits,
      streak_weeks = new_streak,
      last_join_week = current_week
  where id = current_user_id;

  if p_points > 0 then
    insert into public.points_ledger (user_id, delta, reason, join_id)
    values (current_user_id, -p_points, 'redeemed', join_row.id);
  end if;

  return join_row;
end;
$$;

create or replace function public.cancel_join(p_join uuid)
returns public.deal_joins
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  deal_id_value uuid;
  deal_row public.deals%rowtype;
  join_row public.deal_joins%rowtype;
begin
  if current_user_id is null then
    raise exception using message = 'Sign in before cancelling a spot.', errcode = '28000';
  end if;
  select deal_id into deal_id_value from public.deal_joins where id = p_join;
  if not found then
    raise exception using message = 'This join could not be found.', errcode = 'P0002';
  end if;
  select * into deal_row from public.deals where id = deal_id_value for update;
  select * into join_row from public.deal_joins where id = p_join for update;
  if join_row.user_id <> current_user_id then
    raise exception using message = 'You can only cancel your own spot.', errcode = '42501';
  end if;
  if join_row.status <> 'joined' or deal_row.status <> 'open' or clock_timestamp() >= deal_row.deadline then
    raise exception using message = 'This deal has ended. Your spot can no longer be cancelled.', errcode = 'P0001';
  end if;

  update public.deal_joins set status = 'cancelled' where id = p_join returning * into join_row;
  if join_row.points_redeemed > 0 then
    update public.profiles
    set points_balance = points_balance + join_row.points_redeemed
    where id = current_user_id;
    insert into public.points_ledger (user_id, delta, reason, join_id)
    values (current_user_id, join_row.points_redeemed, 'refund', join_row.id);
  end if;
  return join_row;
end;
$$;

create or replace function public.close_expired_deals()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  deal_row public.deals%rowtype;
  join_row public.deal_joins%rowtype;
  target_joiners int;
  selected_tier text;
  selected_price int;
  closed_count int := 0;
begin
  for deal_row in
    select * from public.deals
    where status = 'open' and deadline <= clock_timestamp()
    order by deadline
    for update skip locked
  loop
    select min((tier_data ->> 'min_joiners')::int)
    into target_joiners
    from jsonb_array_elements(deal_row.tiers) as tier_rows(tier_data);

    select tier_data ->> 'name', (tier_data ->> 'price')::int
    into selected_tier, selected_price
    from jsonb_array_elements(deal_row.tiers) as tier_rows(tier_data)
    where (tier_data ->> 'min_joiners')::int <= deal_row.joiner_count
    order by (tier_data ->> 'min_joiners')::int desc
    limit 1;

    if deal_row.joiner_count >= coalesce(target_joiners, 0) and selected_price is not null then
      update public.deals
      set status = 'confirmed', final_tier = selected_tier, final_price = selected_price
      where id = deal_row.id;

      update public.deal_joins
      set amount_due = greatest(0, selected_price * qty - (points_redeemed / 100) * 50) + service_fee
      where deal_id = deal_row.id and status = 'joined';
    else
      update public.deals set status = 'failed', final_tier = null, final_price = null
      where id = deal_row.id;

      for join_row in
        select * from public.deal_joins
        where deal_id = deal_row.id and status = 'joined'
        for update
      loop
        update public.deal_joins set status = 'failed', amount_due = null where id = join_row.id;
        if join_row.points_redeemed > 0 then
          update public.profiles
          set points_balance = points_balance + join_row.points_redeemed
          where id = join_row.user_id;
          insert into public.points_ledger (user_id, delta, reason, join_id)
          values (join_row.user_id, join_row.points_redeemed, 'refund', join_row.id);
        end if;
      end loop;
    end if;
    closed_count := closed_count + 1;
  end loop;
  return closed_count;
end;
$$;

create or replace function public.mark_delivered(p_deal uuid)
returns public.deals
language plpgsql
security definer
set search_path = ''
as $$
declare
  deal_row public.deals%rowtype;
begin
  if not public.is_admin() then
    raise exception using message = 'Admin access is required.', errcode = '42501';
  end if;
  update public.deals set status = 'delivered'
  where id = p_deal and status = 'confirmed'
  returning * into deal_row;
  if not found then
    raise exception using message = 'Only a confirmed deal can be marked delivered.', errcode = 'P0001';
  end if;
  return deal_row;
end;
$$;

create or replace function public.collect_join(p_join uuid)
returns public.deal_joins
language plpgsql
security definer
set search_path = ''
as $$
declare
  join_deal_id uuid;
  deal_row public.deals%rowtype;
  join_row public.deal_joins%rowtype;
  points_earned int;
begin
  if not public.is_admin() then
    raise exception using message = 'Admin access is required.', errcode = '42501';
  end if;
  select deal_id into join_deal_id from public.deal_joins where id = p_join;
  if not found then
    raise exception using message = 'This join could not be found.', errcode = 'P0002';
  end if;
  select * into deal_row from public.deals where id = join_deal_id for update;
  select * into join_row from public.deal_joins where id = p_join for update;
  if deal_row.status <> 'delivered' or join_row.status <> 'joined' or join_row.amount_due is null then
    raise exception using message = 'This join is not ready for pickup.', errcode = 'P0001';
  end if;

  update public.deal_joins
  set status = 'collected', payment_status = 'paid', collected_at = now()
  where id = p_join
  returning * into join_row;

  points_earned := greatest(0, floor((join_row.amount_due - join_row.service_fee)::numeric / 10)::int);
  if points_earned > 0 then
    update public.profiles set points_balance = points_balance + points_earned where id = join_row.user_id;
    insert into public.points_ledger (user_id, delta, reason, join_id)
    values (join_row.user_id, points_earned, 'earned', join_row.id);
  end if;

  if not exists (
    select 1 from public.deal_joins where deal_id = join_deal_id and status = 'joined'
  ) then
    update public.deals set status = 'completed' where id = join_deal_id and status = 'delivered';
  end if;
  return join_row;
end;
$$;

alter table public.profiles enable row level security;
alter table public.pickup_points enable row level security;
alter table public.deals enable row level security;
alter table public.deal_costs enable row level security;
alter table public.deal_joins enable row level security;
alter table public.points_ledger enable row level security;
alter table public.deal_requests enable row level security;
alter table public.request_votes enable row level security;
alter table public.push_subscriptions enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.pickup_points, public.deals to authenticated;
grant select on public.pickup_points, public.deals to anon;
grant select, insert, update, delete on public.deal_costs to authenticated;
grant select on public.deal_joins, public.points_ledger to authenticated;
grant select, insert on public.deal_requests to authenticated;
grant select, insert, delete on public.request_votes, public.push_subscriptions to authenticated;
grant all on public.profiles, public.pickup_points, public.deals, public.deal_costs,
  public.deal_joins, public.points_ledger, public.deal_requests, public.request_votes,
  public.push_subscriptions to service_role;

revoke all on public.profiles, public.deal_costs, public.deal_joins,
  public.points_ledger, public.deal_requests, public.request_votes,
  public.push_subscriptions from anon;
revoke insert, delete on public.profiles from anon, authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name, department, student_type) on public.profiles to authenticated;
revoke insert, update, delete on public.deal_joins from anon, authenticated;
revoke insert, update, delete on public.points_ledger from anon, authenticated;
revoke update, delete on public.deal_requests from anon, authenticated;
revoke update on public.request_votes, public.push_subscriptions from anon, authenticated;
revoke insert, update, delete on public.request_votes from anon;
revoke insert, update, delete on public.push_subscriptions from anon;

create policy "profiles select own or admin" on public.profiles
for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "profiles update own" on public.profiles
for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "pickup points public read" on public.pickup_points
for select to anon, authenticated using (true);
create policy "pickup points admin insert" on public.pickup_points
for insert to authenticated with check (public.is_admin());
create policy "pickup points admin update" on public.pickup_points
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "pickup points admin delete" on public.pickup_points
for delete to authenticated using (public.is_admin());

create policy "deals public read" on public.deals
for select to anon, authenticated using (true);
create policy "deals admin insert" on public.deals
for insert to authenticated with check (public.is_admin());
create policy "deals admin update" on public.deals
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "deals admin delete" on public.deals
for delete to authenticated using (public.is_admin());

create policy "deal costs admin read" on public.deal_costs
for select to authenticated using (public.is_admin());
create policy "deal costs admin insert" on public.deal_costs
for insert to authenticated with check (public.is_admin());
create policy "deal costs admin update" on public.deal_costs
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "deal costs admin delete" on public.deal_costs
for delete to authenticated using (public.is_admin());

create policy "deal joins own or admin read" on public.deal_joins
for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

create policy "points ledger own read" on public.points_ledger
for select to authenticated using (user_id = (select auth.uid()));

create policy "deal requests authenticated read" on public.deal_requests
for select to authenticated using (true);
create policy "deal requests own insert" on public.deal_requests
for insert to authenticated with check (user_id = (select auth.uid()));

create policy "request votes authenticated read" on public.request_votes
for select to authenticated using (true);
create policy "request votes own insert" on public.request_votes
for insert to authenticated with check (user_id = (select auth.uid()));
create policy "request votes own delete" on public.request_votes
for delete to authenticated using (user_id = (select auth.uid()));

create policy "push subscriptions own read" on public.push_subscriptions
for select to authenticated using (user_id = (select auth.uid()));
create policy "push subscriptions own insert" on public.push_subscriptions
for insert to authenticated with check (user_id = (select auth.uid()));
create policy "push subscriptions own delete" on public.push_subscriptions
for delete to authenticated using (user_id = (select auth.uid()));

revoke all on function public.is_admin() from public;
revoke all on function public.refresh_joiner_count() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.join_deal(uuid, int, int, text, text, uuid) from public;
revoke all on function public.cancel_join(uuid) from public;
revoke all on function public.close_expired_deals() from public;
revoke all on function public.mark_delivered(uuid) from public;
revoke all on function public.collect_join(uuid) from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.join_deal(uuid, int, int, text, text, uuid) to authenticated;
grant execute on function public.cancel_join(uuid) to authenticated;
grant execute on function public.close_expired_deals() to anon, authenticated, service_role;
grant execute on function public.mark_delivered(uuid) to authenticated;
grant execute on function public.collect_join(uuid) to authenticated;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise exception 'The supabase_realtime publication is missing. Enable Realtime for a table in Database > Publications, then rerun this migration.';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'deals'
  ) then
    alter publication supabase_realtime add table public.deals;
  end if;
end;
$$;
