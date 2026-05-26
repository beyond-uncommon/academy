-- Add missing columns from original schema.sql to public.profiles
alter table public.profiles
    add column if not exists onboarding_completed boolean default false,
    add column if not exists gender text,
    add column if not exists age integer,
    add column if not exists innovation_hub text,
    add column if not exists skill_level text check (skill_level in ('beginner', 'intermediate', 'advanced')),
    add column if not exists recommended_path text,
    add column if not exists learning_goals text[];
