-- ─── Instructor Role ──────────────────────────────────────────
do $$ begin
    -- Drop the existing check constraint (may be system-named)
    if exists (
        select 1 from pg_constraint
        where conrelid = 'public.profiles'::regclass
        and conname like '%role%'
        and contype = 'c'
    ) then
        execute (
            select 'alter table public.profiles drop constraint ' || conname
            from pg_constraint
            where conrelid = 'public.profiles'::regclass
            and conname like '%role%'
            and contype = 'c'
            limit 1
        );
    end if;
end $$;

alter table public.profiles
    add constraint profiles_role_check
        check (role in ('learner', 'admin', 'instructor'));
