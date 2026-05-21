-- =============================================================
-- Assessment Quiz System Migration
-- Adds formal timed assessments with passing requirements
-- =============================================================

-- ─── Extend quizzes for assessment features ───────────────────
alter table public.quizzes
  add column if not exists type text not null default 'lesson'
    check (type in ('lesson', 'module', 'course', 'standalone')),
  add column if not exists course_id uuid references public.courses(id) on delete cascade,
  add column if not exists time_limit_minutes integer,
  add column if not exists passing_score_pct integer default 80,
  add column if not exists max_attempts integer default 0, -- 0 = unlimited
  add column if not exists instructions text,
  add column if not exists is_published boolean default true;

-- ─── Extend user_quiz_attempts for timed assessment tracking ─
alter table public.user_quiz_attempts
  add column if not exists started_at timestamptz,
  add column if not exists time_spent_seconds integer,
  add column if not exists answers jsonb, -- stores user's actual answers for review
  add column if not exists passed boolean,
  add column if not exists attempt_number integer default 1;

-- ─── Enable RLS on quiz tables ───────────────────────────────
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.user_quiz_attempts enable row level security;

-- ─── RLS policies for quizzes ────────────────────────────────
create policy "quizzes_published_read" on public.quizzes
  for select using (
    is_published = true
    or auth.uid() in (select id from public.profiles where role = 'admin')
  );

create policy "quiz_questions_published_read" on public.quiz_questions
  for select using (
    exists (
      select 1 from public.quizzes
      where quizzes.id = quiz_questions.quiz_id
      and (quizzes.is_published = true
        or auth.uid() in (select id from public.profiles where role = 'admin'))
    )
  );

create policy "user_quiz_attempts_self" on public.user_quiz_attempts
  for all using (auth.uid() = user_id);

create policy "user_quiz_attempts_admin_read" on public.user_quiz_attempts
  for select using (
    auth.uid() in (select id from public.profiles where role = 'admin')
  );

-- ─── Function: Get user's current assessment status ──────────
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

-- ─── Function: Check if user can retake an assessment ────────
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
