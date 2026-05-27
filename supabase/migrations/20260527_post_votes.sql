-- Add votes column to community_posts
alter table public.community_posts add column if not exists votes integer not null default 0;

-- Create post_votes table for upvote/downvote tracking
create table if not exists public.post_votes (
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.community_posts(id) on delete cascade not null,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

alter table public.post_votes enable row level security;

create policy "Anyone can read post votes"
on public.post_votes for select
using (true);

create policy "Users can vote on posts"
on public.post_votes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can change their vote"
on public.post_votes for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can remove their vote"
on public.post_votes for delete
to authenticated
using (auth.uid() = user_id);

-- Trigger to keep votes count in sync
create or replace function public.sync_post_votes_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts set votes = votes + new.vote where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_posts set votes = votes - old.vote where id = old.post_id;
    return old;
  elsif tg_op = 'UPDATE' then
    update public.community_posts set votes = votes - old.vote + new.vote where id = new.post_id;
    return new;
  end if;
  return null;
end;
$$;

create trigger trg_sync_post_votes
after insert or delete or update on public.post_votes
for each row execute function public.sync_post_votes_count();
