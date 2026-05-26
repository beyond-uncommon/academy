-- ─── Community Posts ────────────────────────────────────────────
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  type text not null default 'discussion' check (type in ('question', 'discussion', 'tip', 'showcase')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.community_posts enable row level security;

drop policy if exists "Anyone can read community posts" on public.community_posts;
create policy "Anyone can read community posts"
  on public.community_posts for select
  to authenticated
  using (true);

drop policy if exists "Users can create community posts" on public.community_posts;
create policy "Users can create community posts"
  on public.community_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own community posts" on public.community_posts;
create policy "Users can update own community posts"
  on public.community_posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own community posts" on public.community_posts;
create policy "Users can delete own community posts"
  on public.community_posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── Post Likes ─────────────────────────────────────────────────
create table if not exists public.post_likes (
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.community_posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

alter table public.post_likes enable row level security;

drop policy if exists "Anyone can read post likes" on public.post_likes;
create policy "Anyone can read post likes"
  on public.post_likes for select
  to authenticated
  using (true);

drop policy if exists "Users can manage own post likes" on public.post_likes;
create policy "Users can manage own post likes"
  on public.post_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove own post likes" on public.post_likes;
create policy "Users can remove own post likes"
  on public.post_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── Extend lesson_comments to also support community posts ──
alter table public.lesson_comments add column if not exists post_id uuid references public.community_posts(id) on delete cascade;

create index if not exists idx_comments_post on public.lesson_comments(post_id);
