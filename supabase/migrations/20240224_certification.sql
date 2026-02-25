-- ─── Certificates ─────────────────────────────────────────────
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id),
  certificate_id text unique not null, -- Human readable ID e.g. ACAD-2024-XXXX
  issued_at timestamptz default now(),
  metadata jsonb, -- Professional stats at time of graduation
  unique(user_id, course_id)
);

-- Add graduation flag to profiles for quick UI checks
alter table public.profiles add column if not exists has_graduated boolean default false;

-- RLS for certificates
alter table public.certificates enable row level security;
create policy "certificates_read_all" on public.certificates
  for select using (true); -- Publicly verifiable
