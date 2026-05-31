-- ─── Web Push Subscriptions ───────────────────────────────────
create table if not exists public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    endpoint text not null,
    p256dh_key text not null,
    auth_key text not null,
    user_agent text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create unique index if not exists idx_push_subscriptions_user_endpoint
    on public.push_subscriptions(user_id, endpoint);

create index if not exists idx_push_subscriptions_user_id
    on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can insert own push subscriptions" on public.push_subscriptions;
create policy "Users can insert own push subscriptions"
    on public.push_subscriptions for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "Users can read own push subscriptions" on public.push_subscriptions;
create policy "Users can read own push subscriptions"
    on public.push_subscriptions for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;
create policy "Users can update own push subscriptions"
    on public.push_subscriptions for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own push subscriptions" on public.push_subscriptions;
create policy "Users can delete own push subscriptions"
    on public.push_subscriptions for delete
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "Admins can read all push subscriptions" on public.push_subscriptions;
create policy "Admins can read all push subscriptions"
    on public.push_subscriptions for select
    to authenticated
    using (exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    ));
