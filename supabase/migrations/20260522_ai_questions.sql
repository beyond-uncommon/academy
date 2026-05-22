-- ─── AI-Generated Questions Support ───────────────────────────
-- Add draft workflow and tracking to quiz_questions

alter table public.quiz_questions
    add column if not exists is_draft boolean default false;

alter table public.quiz_questions
    add column if not exists generated_by text default 'admin' check (generated_by in ('admin', 'ai'));
