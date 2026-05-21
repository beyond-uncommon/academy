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
  gender text,
  age integer,
  innovation_hub text,
  onboarding_completed boolean default false,
  skill_level text check (skill_level in ('beginner', 'intermediate', 'advanced')),
  recommended_path text,
  learning_goals text[],
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

-- ─── Quizzes / Assessments ─────────────────────────────────────
-- Supports lesson, module, course, and standalone assessment types
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  type text not null default 'lesson' check (type in ('lesson', 'module', 'course', 'standalone')),
  xp_base integer default 100,
  xp_bonus_80 integer default 50,
  xp_bonus_100 integer default 100,
  time_limit_minutes integer,       -- null = untimed
  passing_score_pct integer default 80,
  max_attempts integer default 0,   -- 0 = unlimited
  instructions text,
  is_published boolean default true,
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
  started_at timestamptz,
  completed_at timestamptz default now(),
  time_spent_seconds integer,
  answers jsonb,                      -- user's actual answers for review
  passed boolean,
  attempt_number integer default 1
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

-- ─── Skill Assessment Questions ───────────────────────────────
create table public.skill_assessment_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  category text not null,
  options jsonb not null,
  correct_answer integer not null,
  skill_weight integer default 1,
  order_index integer not null
);

-- Seed skill assessment questions
insert into public.skill_assessment_questions (question, category, options, correct_answer, skill_weight, order_index) values
('How familiar are you with Figma?', 'tools', '[{"text": "Never heard of it", "score": 0}, {"text": "Seen it but never used", "score": 1}, {"text": "Can do basic layouts", "score": 2}, {"text": "Comfortable with components & auto-layout", "score": 3}, {"text": "Advanced: variables, prototyping, teams", "score": 4}]', 0, 2, 1),
('Have you ever designed a user interface?', 'experience', '[{"text": "No, never", "score": 0}, {"text": "A few simple sketches", "score": 1}, {"text": "Digital designs for personal projects", "score": 2}, {"text": "Designed for work or clients", "score": 3}, {"text": "Professional UI designer", "score": 4}]', 0, 2, 2),
('What is a user persona?', 'knowledge', '[{"text": "No idea", "score": 0}, {"text": "Heard the term but cant explain", "score": 1}, {"text": "Know its a fictional user representation", "score": 2}, {"text": "Can create and use personas in projects", "score": 3}, {"text": "Expert: can teach others", "score": 4}]', 0, 1, 3),
('Have you conducted user research?', 'research', '[{"text": "No", "score": 0}, {"text": "Informal conversations with friends", "score": 1}, {"text": "Conducted 1-2 user interviews", "score": 2}, {"text": "Regularly run usability tests", "score": 3}, {"text": "Expert in research methods", "score": 4}]', 0, 1, 4),
('How do you approach design problems?', 'process', '[{"text": "Just start designing", "score": 0}, {"text": "Look at what others have done", "score": 1}, {"text": "Follow a basic process (sketch, design, test)", "score": 2}, {"text": "Use research and iteration", "score": 3}, {"text": "Full design thinking process", "score": 4}]', 0, 1, 5);

-- Learning goals (for onboarding)
create table public.learning_goals (
  id text primary key,
  label text not null,
  description text,
  icon text,
  target_courses text[]
);

insert into public.learning_goals (id, label, description, icon, target_courses) values
('ui_fundamentals', 'Master UI Basics', 'Learn core principles of visual design', 'palette', '["crash-course"]'),
('figma_pro', 'Become Figma Pro', 'Master Figma from basics to advanced', 'pen-tool', '["crash-course", "specialization-1"]'),
('ux_research', 'UX Research Skills', 'Learn user research and testing', 'search', '["specialization-1"]'),
('portfolio_ready', 'Build Portfolio', 'Create case studies for job applications', 'briefcase', '["crash-course", "specialization-1"]'),
('freelance', 'Freelance Ready', 'Learn to find and retain clients', 'dollar-sign', '["specialization-2"]');

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

-- ─── Assessment RLS ──────────────────────────────────────────
alter table public.quizzes enable row level security;
create policy "quizzes_published_read" on public.quizzes
  for select using (
    is_published = true
    or auth.uid() in (select id from public.profiles where role = 'admin')
  );

alter table public.quiz_questions enable row level security;
create policy "quiz_questions_published_read" on public.quiz_questions
  for select using (
    exists (
      select 1 from public.quizzes
      where quizzes.id = quiz_questions.quiz_id
      and (quizzes.is_published = true
        or auth.uid() in (select id from public.profiles where role = 'admin'))
    )
  );

alter table public.user_quiz_attempts enable row level security;
create policy "user_quiz_attempts_self" on public.user_quiz_attempts
  for all using (auth.uid() = user_id);

create policy "user_quiz_attempts_admin_read" on public.user_quiz_attempts
  for select using (
    auth.uid() in (select id from public.profiles where role = 'admin')
  );

-- ─── Assessment helper functions ─────────────────────────────
create or replace function public.get_assessment_status(p_user_id uuid, p_quiz_id uuid)
returns table (
  attempt_count bigint,
  best_score integer,
  has_passed boolean,
  last_attempt_id uuid
) language plpgsql security definer as $$
begin
  return query
  select
    count(*)::bigint as attempt_count,
    coalesce(max(ua.score_pct), 0) as best_score,
    bool_or(coalesce(ua.passed, false)) as has_passed,
    (select ua2.id from public.user_quiz_attempts ua2
     where ua2.user_id = p_user_id and ua2.quiz_id = p_quiz_id
     order by ua2.completed_at desc nulls last limit 1) as last_attempt_id
  from public.user_quiz_attempts ua
  where ua.user_id = p_user_id and ua.quiz_id = p_quiz_id;
end;
$$;

create or replace function public.can_retake_assessment(p_user_id uuid, p_quiz_id uuid)
returns table (
  can_retake boolean,
  attempts_used bigint,
  max_attempts integer,
  has_passed boolean
) language plpgsql security definer as $$
declare
  v_max_attempts integer;
  v_passed boolean;
begin
  select q.max_attempts into v_max_attempts
  from public.quizzes q where q.id = p_quiz_id;

  select bool_or(coalesce(ua.passed, false)) into v_passed
  from public.user_quiz_attempts ua
  where ua.user_id = p_user_id and ua.quiz_id = p_quiz_id;

  return query
  select
    case
      when coalesce(v_passed, false) then false
      when v_max_attempts = 0 then true
      else (
        select count(*) < v_max_attempts
        from public.user_quiz_attempts
        where user_id = p_user_id and quiz_id = p_quiz_id
      )
    end as can_retake,
    (select count(*)::bigint from public.user_quiz_attempts
     where user_id = p_user_id and quiz_id = p_quiz_id) as attempts_used,
    v_max_attempts as max_attempts,
    coalesce(v_passed, false) as has_passed;
end;
$$;

-- ─── Notifications ─────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in (
    'lesson_completed',
    'quiz_passed',
    'quiz_failed',
    'project_approved',
    'project_reviewed',
    'badge_earned',
    'streak_at_risk',
    'module_unlocked',
    'course_completed',
    'assessment_ready',
    'xp_milestone',
    'peer_feedback',
    'admin_message'
  )),
  title text not null,
  body text,
  link text,
  metadata jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id, is_read) where not is_read;

alter table public.notifications enable row level security;

create policy "Users can read own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can mark own notifications as read"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_metadata jsonb default null
) returns void as $$
begin
  insert into public.notifications (user_id, type, title, body, link, metadata)
  values (p_user_id, p_type, p_title, p_body, p_link, p_metadata);
end;
$$ language plpgsql security definer;

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

-- ─── Activity Log ──────────────────────────────────────────────
create table if not exists public.user_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  event_type text not null check (event_type in (
    'lesson_view',
    'lesson_complete',
    'quiz_attempt',
    'quiz_pass',
    'quiz_fail',
    'project_submit',
    'project_approved',
    'login',
    'streak_update'
  )),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_activity_log_user on public.user_activity_log(user_id, created_at desc);
create index if not exists idx_activity_log_weekly on public.user_activity_log(user_id, created_at) where created_at > now() - interval '7 days';

alter table public.user_activity_log enable row level security;

create policy "Users can read own activity"
  on public.user_activity_log for select
  to authenticated
  using (auth.uid() = user_id);

create policy "System can insert activity"
  on public.user_activity_log for insert
  to authenticated
  with check (auth.uid() = user_id);

create or replace function public.get_weekly_activity(p_user_id uuid)
returns table (day text, label text, count bigint) as $$
declare
  day_names text[] := array['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  day_labels text[] := array['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
begin
  return query
  with week_days as (
    select
      lower(trim(to_char(d, 'day'))) as day_name,
      to_char(d, 'Dy') as day_label
    from generate_series(
      date_trunc('week', now()::date),
      date_trunc('week', now()::date) + interval '6 days',
      interval '1 day'
    ) as d
  ),
  daily_counts as (
    select
      lower(trim(to_char(created_at, 'day'))) as day_name,
      count(*)::bigint as cnt
    from public.user_activity_log
    where user_id = p_user_id
      and created_at >= date_trunc('week', now())
    group by lower(trim(to_char(created_at, 'day')))
  )
  select
    w.day_name as day,
    w.day_label as label,
    coalesce(d.cnt, 0) as count
  from week_days w
  left join daily_counts d on w.day_name = d.day_name
  order by array_position(day_names, w.day_name);
end;
$$ language plpgsql security definer;

-- ─── Full-Text Search Indexes ─────────────────────────────────
create index if not exists idx_courses_title_search on public.courses using gin(to_tsvector('english', coalesce(title, '')));
create index if not exists idx_courses_desc_search on public.courses using gin(to_tsvector('english', coalesce(description, '')));
create index if not exists idx_lessons_title_search on public.lessons using gin(to_tsvector('english', coalesce(title, '')));
create index if not exists idx_profiles_name_search on public.profiles using gin(to_tsvector('english', coalesce(full_name, '')));
create index if not exists idx_profiles_bio_search on public.profiles using gin(to_tsvector('english', coalesce(bio, '')));

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

-- Extend lesson_comments to also support project submissions
alter table public.lesson_comments alter column lesson_id drop not null;
alter table public.lesson_comments add column if not exists submission_id uuid references public.project_submissions(id) on delete cascade;

create index if not exists idx_comments_submission on public.lesson_comments(submission_id);
