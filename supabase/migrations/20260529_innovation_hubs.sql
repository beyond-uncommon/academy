-- Innovation hubs table – admin-managed list of hub names
create table public.innovation_hubs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.innovation_hubs enable row level security;

-- Anyone authenticated can read active hubs (needed for onboarding)
create policy "hubs_read" on public.innovation_hubs
  for select using (auth.role() = 'authenticated');

-- Only admins can insert/update/delete
create policy "hubs_admin_write" on public.innovation_hubs
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Seed initial hubs
insert into public.innovation_hubs (name) values
  ('Vincent Bohlen Innovation Hub'),
  ('Dzivarasekwa Innovation Hub'),
  ('Mufakose Innovation Hub'),
  ('Kambuzuma Innovation Hub'),
  ('Warren Park Innovation Hub'),
  ('Nicki Kesler Innovation Hub'),
  ('Nedbank Innovation Hub'),
  ('Jafuta Innovation Hub'),
  ('Painted Dog Conservation Innovation Hub');
