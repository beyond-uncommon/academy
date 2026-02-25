-- =============================================================
-- Academy Platform – Supabase Database Schema
-- Run this in your Supabase SQL editor or via supabase db push
-- =============================================================

-- ─── Profiles (extends Supabase auth.users) ───────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  role text default 'learner' check (role in ('learner', 'admin')),
  created_at timestamptz default now()
);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Courses ──────────────────────────────────────────────────
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  type text check (type in ('crash_course', 'specialization')),
  phase integer,
  thumbnail_url text,
  is_published boolean default false,
  created_at timestamptz default now()
);

-- ─── Modules ──────────────────────────────────────────────────
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  order_index integer not null,
  skill_node_id text,
  xp_available integer default 0,
  created_at timestamptz default now()
);

-- ─── Skill Tree Nodes (defined before lessons for FK) ─────────
create table public.skill_tree_nodes (
  id text primary key,
  label text not null,
  module_id uuid references public.modules(id),
  prerequisite_node_id text references public.skill_tree_nodes(id),
  position_x integer,
  position_y integer
);

-- ─── Lessons ──────────────────────────────────────────────────
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules(id) on delete cascade,
  title text not null,
  order_index integer not null,
  type text check (type in ('video', 'text', 'interactive', 'project')),
  content jsonb,
  xp_reward integer default 50,
  duration_minutes integer,
  is_published boolean default false,
  created_at timestamptz default now()
);

-- ─── Quizzes ──────────────────────────────────────────────────
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  title text not null,
  xp_base integer default 100,
  xp_bonus_80 integer default 50,
  xp_bonus_100 integer default 100,
  created_at timestamptz default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.quizzes(id) on delete cascade,
  question text not null,
  options jsonb not null,
  explanation text,
  order_index integer not null
);

-- ─── User Progress ────────────────────────────────────────────
create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  completed boolean default false,
  completed_at timestamptz,
  xp_earned integer default 0,
  unique(user_id, lesson_id)
);

create table public.user_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  quiz_id uuid references public.quizzes(id) on delete cascade,
  score_pct integer,
  xp_earned integer,
  completed_at timestamptz default now()
);

-- ─── XP Ledger ───────────────────────────────────────────────
create table public.user_xp (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  total_xp integer default 0,
  weekly_xp integer default 0,
  rank text default 'beginner' check (rank in ('beginner','explorer','practitioner','designer','master')),
  updated_at timestamptz default now()
);

-- RPC: Award XP and update rank
create or replace function public.award_xp(p_user_id uuid, p_xp integer)
returns void as $$
declare
  v_total integer;
begin
  insert into public.user_xp (user_id, total_xp, weekly_xp)
  values (p_user_id, p_xp, p_xp)
  on conflict (user_id) do update
    set total_xp = user_xp.total_xp + p_xp,
        weekly_xp = user_xp.weekly_xp + p_xp,
        updated_at = now();

  select total_xp into v_total from public.user_xp where user_id = p_user_id;

  update public.user_xp
  set rank = case
    when v_total >= 10000 then 'master'
    when v_total >= 5000  then 'designer'
    when v_total >= 2000  then 'practitioner'
    when v_total >= 500   then 'explorer'
    else 'beginner'
  end
  where user_id = p_user_id;
end;
$$ language plpgsql security definer;

-- ─── Badges ───────────────────────────────────────────────────
create table public.badges (
  id text primary key,
  name text not null,
  description text,
  icon_url text,
  rarity text check (rarity in ('common','uncommon','rare','epic','legendary')),
  xp_bonus integer default 0
);

create table public.user_badges (
  user_id uuid references public.profiles(id) on delete cascade,
  badge_id text references public.badges(id),
  earned_at timestamptz default now(),
  primary key (user_id, badge_id)
);

-- ─── Streaks ──────────────────────────────────────────────────
create table public.user_streaks (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_activity_date date,
  updated_at timestamptz default now()
);

-- ─── User Skill Tree Progress ─────────────────────────────────
create table public.user_skill_tree (
  user_id uuid references public.profiles(id) on delete cascade,
  node_id text references public.skill_tree_nodes(id),
  status text default 'locked' check (status in ('locked','in_progress','completed')),
  progress_pct integer default 0,
  updated_at timestamptz default now(),
  primary key (user_id, node_id)
);

-- ─── Project Submissions ──────────────────────────────────────
create table public.project_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id),
  submission_url text,
  notes text,
  score integer,
  xp_earned integer default 0,
  status text default 'pending' check (status in ('pending','reviewed','approved')),
  submitted_at timestamptz default now()
);

-- =============================================================
-- Row Level Security (RLS)
-- =============================================================

alter table public.profiles enable row level security;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

alter table public.user_progress enable row level security;
create policy "progress_self" on public.user_progress
  using (auth.uid() = user_id);

alter table public.user_xp enable row level security;
create policy "xp_self" on public.user_xp
  using (auth.uid() = user_id);

alter table public.user_badges enable row level security;
create policy "badges_self" on public.user_badges
  using (auth.uid() = user_id);

alter table public.user_streaks enable row level security;
create policy "streaks_self" on public.user_streaks
  using (auth.uid() = user_id);

alter table public.user_skill_tree enable row level security;
create policy "skill_tree_self" on public.user_skill_tree
  using (auth.uid() = user_id);

alter table public.project_submissions enable row level security;
create policy "submissions_self" on public.project_submissions
  using (auth.uid() = user_id);

-- Courses & Lessons: published = public read
alter table public.courses enable row level security;
create policy "courses_published_read" on public.courses
  for select using (is_published = true);

alter table public.lessons enable row level security;
create policy "lessons_published_read" on public.lessons
  for select using (is_published = true);

-- Badges: public read
alter table public.badges enable row level security;
create policy "badges_public_read" on public.badges
  for select using (true);

-- Skill tree nodes: public read
alter table public.skill_tree_nodes enable row level security;
create policy "nodes_public_read" on public.skill_tree_nodes
  for select using (true);
