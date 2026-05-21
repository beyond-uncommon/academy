-- ─── Lesson Comments / Discussion ─────────────────────────────
create table if not exists public.lesson_comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.lesson_comments(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_lesson_comments_lesson on public.lesson_comments(lesson_id, created_at);
create index if not exists idx_lesson_comments_parent on public.lesson_comments(parent_id);

alter table public.lesson_comments enable row level security;

create policy "Anyone can read comments"
  on public.lesson_comments for select
  to authenticated
  using (true);

create policy "Users can create comments"
  on public.lesson_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.lesson_comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.lesson_comments for delete
  to authenticated
  using (auth.uid() = user_id);
