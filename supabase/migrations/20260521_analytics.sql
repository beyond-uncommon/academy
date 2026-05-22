-- ─── Activity Log for Learner Analytics ──────────────────────
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

alter table public.user_activity_log enable row level security;

drop policy if exists "Users can read own activity" on public.user_activity_log;
create policy "Users can read own activity"
  on public.user_activity_log for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "System can insert activity" on public.user_activity_log;
create policy "System can insert activity"
  on public.user_activity_log for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ─── Weekly Activity Helper ────────────────────────────────────
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
