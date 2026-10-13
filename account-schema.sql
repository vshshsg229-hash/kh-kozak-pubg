-- KH么Kozak Gaming Hub 4.1 — run this in Supabase SQL Editor.
-- Row Level Security ensures each signed-in player can access only their own save.
create table if not exists public.kozak_player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.kozak_player_saves enable row level security;

drop policy if exists "Players can read their own save" on public.kozak_player_saves;
create policy "Players can read their own save"
  on public.kozak_player_saves for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Players can create their own save" on public.kozak_player_saves;
create policy "Players can create their own save"
  on public.kozak_player_saves for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players can update their own save" on public.kozak_player_saves;
create policy "Players can update their own save"
  on public.kozak_player_saves for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.kozak_player_saves to authenticated;
