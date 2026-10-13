-- KH么Kozak Gaming Hub 4.6 — global mini-game leaderboard
-- Run once in the same Supabase project configured by supabase-config.js.
-- Requires Authentication > Sign-In Providers > Anonymous Sign-Ins enabled.

create table if not exists public.kozak_arcade_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default 'Гравець' check (char_length(nickname) between 2 and 24),
  scores jsonb not null default '{}'::jsonb,
  total_points integer not null default 0 check (total_points >= 0),
  updated_at timestamptz not null default now()
);
create index if not exists kozak_arcade_scores_rank_idx
  on public.kozak_arcade_scores (total_points desc, updated_at desc);
alter table public.kozak_arcade_scores enable row level security;
drop policy if exists "Players can view global arcade scores" on public.kozak_arcade_scores;
create policy "Players can view global arcade scores"
  on public.kozak_arcade_scores for select to authenticated using (true);
drop policy if exists "Players can publish their own arcade score" on public.kozak_arcade_scores;
create policy "Players can publish their own arcade score"
  on public.kozak_arcade_scores for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Players can update their own arcade score" on public.kozak_arcade_scores;
create policy "Players can update their own arcade score"
  on public.kozak_arcade_scores for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.kozak_arcade_scores to authenticated;
notify pgrst, 'reload schema';
