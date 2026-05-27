-- Enable RLS on modules table and add policies
alter table public.modules enable row level security;

-- All authenticated users can read modules (for published courses)
create policy "modules_read_all"
    on public.modules
    for select
    to authenticated
    using (true);

-- Only admins can insert/update/delete modules
create policy "modules_admin_insert"
    on public.modules
    for insert
    to authenticated
    with check (
        auth.uid() in (select id from public.profiles where role = 'admin')
    );

create policy "modules_admin_update"
    on public.modules
    for update
    to authenticated
    using (
        auth.uid() in (select id from public.profiles where role = 'admin')
    );

create policy "modules_admin_delete"
    on public.modules
    for delete
    to authenticated
    using (
        auth.uid() in (select id from public.profiles where role = 'admin')
    );
