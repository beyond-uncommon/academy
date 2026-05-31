create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date,
  event_time text,
  event_type text check (event_type in ('workshop', 'ama', 'social', 'other')),
  is_recurring boolean default false,
  registration_url text,
  is_published boolean default false,
  created_at timestamptz default now(),
  created_by uuid references public.profiles(id)
);

alter table public.events enable row level security;

create policy "Events are viewable by all authenticated users"
  on public.events for select
  to authenticated
  using (is_published = true);

create policy "Admins can manage events"
  on public.events for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
