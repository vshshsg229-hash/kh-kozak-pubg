-- KH么Kozak Battle Hub Supabase schema
-- Run this entire file in Supabase Dashboard -> SQL Editor -> New query.
create table if not exists public.hub_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 3 and 20),
  coins integer not null default 0 check (coins >= 0),
  points integer not null default 0 check (points >= 0),
  xp integer not null default 0 check (xp >= 0),
  played integer not null default 0 check (played >= 0),
  games jsonb not null default '{}'::jsonb,
  last_daily_bonus_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hub_profiles_leaderboard_idx on public.hub_profiles(points desc, xp desc, played desc);
create table if not exists public.hub_game_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null,
  game text not null,
  coins integer not null,
  points integer not null,
  xp integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);
create index if not exists hub_game_events_user_date_idx on public.hub_game_events(user_id, created_at desc);

create or replace function public.hub_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_name text;
begin
  chosen_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), 'Player' || substr(new.id::text, 1, 6));
  chosen_name := left(regexp_replace(chosen_name, '[<>]', '', 'g'), 20);
  if char_length(chosen_name) < 3 then chosen_name := 'Player' || substr(new.id::text, 1, 6); end if;
  insert into public.hub_profiles(id, username)
  values (new.id, chosen_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_hub on auth.users;
create trigger on_auth_user_created_hub
  after insert on auth.users
  for each row execute procedure public.hub_handle_new_user();

alter table public.hub_profiles enable row level security;
alter table public.hub_game_events enable row level security;
-- The Edge Function uses the service-role key server-side. No public client policies
-- are granted here, so clients cannot edit coins/rewards or profiles directly.
revoke all on public.hub_profiles from anon, authenticated;
revoke all on public.hub_game_events from anon, authenticated;
grant select, insert, update, delete on public.hub_profiles to service_role;
grant select, insert, update, delete on public.hub_game_events to service_role;
