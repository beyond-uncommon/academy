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

-- Enable RLS
alter table public.notifications enable row level security;

-- Users can read & update their own notifications; system inserts via service role
create policy "Users can read own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can mark own notifications as read"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Helper function to create a notification ─────────────────
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
