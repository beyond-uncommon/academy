-- Add unique constraint so upsert works correctly
alter table public.project_submissions
    add constraint project_submissions_user_lesson_unique
        unique (user_id, lesson_id);
