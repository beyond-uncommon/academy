-- ─── Project Likes ────────────────────────────────────────────
create table if not exists public.project_likes (
  user_id uuid references public.profiles(id) on delete cascade,
  submission_id uuid references public.project_submissions(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, submission_id)
);

alter table public.project_likes enable row level security;

create policy "Anyone can read likes"
  on public.project_likes for select
  to authenticated
  using (true);

create policy "Users can manage own likes"
  on public.project_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove own likes"
  on public.project_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── Extend lesson_comments to also support project submissions ─
alter table public.lesson_comments alter column lesson_id drop not null;
alter table public.lesson_comments add column if not exists submission_id uuid references public.project_submissions(id) on delete cascade;

create index if not exists idx_comments_submission on public.lesson_comments(submission_id);
