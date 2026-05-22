-- ─── Full-Text Search Indexes ─────────────────────────────────
create index if not exists idx_courses_title_search on public.courses using gin(to_tsvector('english'::regconfig, coalesce(title, '')));
create index if not exists idx_courses_desc_search on public.courses using gin(to_tsvector('english'::regconfig, coalesce(description, '')));
create index if not exists idx_lessons_title_search on public.lessons using gin(to_tsvector('english'::regconfig, coalesce(title, '')));
create index if not exists idx_profiles_name_search on public.profiles using gin(to_tsvector('english'::regconfig, coalesce(full_name, '')));
create index if not exists idx_profiles_bio_search on public.profiles using gin(to_tsvector('english'::regconfig, coalesce(bio, '')));
