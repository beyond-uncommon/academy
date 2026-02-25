-- ─── Leaderboard: allow authenticated users to read all profiles & XP ─────────

-- Profiles: allow all authenticated users to read any profile
create policy "profiles_read_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

-- user_xp: allow all authenticated users to read any row
create policy "xp_read_authenticated" on public.user_xp
  for select using (auth.role() = 'authenticated');

-- user_streaks: allow all authenticated users to read any row (for leaderboard streak display)
create policy "streaks_read_authenticated" on public.user_streaks
  for select using (auth.role() = 'authenticated');
