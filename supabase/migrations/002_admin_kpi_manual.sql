create table public.kpi_manual (
  id int primary key default 1 check (id = 1),
  instagram_engagement int not null default 0 check (instagram_engagement >= 0),
  sponsor_leads int not null default 0 check (sponsor_leads >= 0),
  updated_at timestamptz not null default now()
);

insert into public.kpi_manual (id) values (1) on conflict (id) do nothing;

alter table public.kpi_manual enable row level security;
grant select, insert, update on public.kpi_manual to authenticated;
revoke all on public.kpi_manual from anon;

create policy "manual KPI admin read" on public.kpi_manual
for select to authenticated using (public.is_admin());
create policy "manual KPI admin insert" on public.kpi_manual
for insert to authenticated with check (public.is_admin());
create policy "manual KPI admin update" on public.kpi_manual
for update to authenticated using (public.is_admin()) with check (public.is_admin());
