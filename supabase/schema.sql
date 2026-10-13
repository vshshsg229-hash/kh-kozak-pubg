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


-- Atomic reward transaction: locks the profile row and records the event in one DB transaction.
create or replace function public.hub_finish_game(
  p_user_id uuid, p_event_id uuid, p_game text,
  p_base_coins integer, p_base_points integer, p_base_xp integer
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.hub_profiles%rowtype;
  v_exists boolean;
  v_count integer;
  v_first_today boolean;
  v_coins integer;
  v_points integer;
  v_xp integer;
  v_bonus jsonb;
begin
  select * into v_profile from public.hub_profiles where id = p_user_id for update;
  if not found then return jsonb_build_object('error', 'profile_not_found'); end if;

  select exists(
    select 1 from public.hub_game_events
    where user_id = p_user_id and event_id = p_event_id
  ) into v_exists;
  if v_exists then
    return jsonb_build_object(
      'duplicate', true,
      'reward', jsonb_build_object('coins', 0, 'points', 0, 'xp', 0),
      'user', to_jsonb(v_profile)
    );
  end if;

  select count(*)::integer into v_count from public.hub_game_events
  where user_id = p_user_id and created_at >= date_trunc('day', now());
  if v_count >= 40 then return jsonb_build_object('error', 'daily_limit'); end if;

  v_first_today := v_profile.last_daily_bonus_date is distinct from current_date;
  v_coins := p_base_coins + case when v_first_today then 15 else 0 end;
  v_points := p_base_points + case when v_first_today then 10 else 0 end;
  v_xp := p_base_xp + case when v_first_today then 10 else 0 end;
  v_bonus := case when v_first_today
    then jsonb_build_object('coins', 15, 'points', 10, 'xp', 10)
    else 'null'::jsonb end;

  update public.hub_profiles set
    coins = coins + v_coins,
    points = points + v_points,
    xp = xp + v_xp,
    played = played + 1,
    games = jsonb_set(
      coalesce(games, '{}'::jsonb),
      array[p_game],
      to_jsonb(coalesce((games ->> p_game)::integer, 0) + 1),
      true
    ),
    last_daily_bonus_date = case when v_first_today then current_date else last_daily_bonus_date end,
    updated_at = now()
  where id = p_user_id
  returning * into v_profile;

  insert into public.hub_game_events(user_id, event_id, game, coins, points, xp)
  values (p_user_id, p_event_id, p_game, v_coins, v_points, v_xp);

  return jsonb_build_object(
    'duplicate', false,
    'reward', jsonb_build_object('coins', v_coins, 'points', v_points, 'xp', v_xp),
    'dailyBonus', v_bonus,
    'user', to_jsonb(v_profile)
  );
end;
$$;
revoke all on function public.hub_finish_game(uuid, uuid, text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.hub_finish_game(uuid, uuid, text, integer, integer, integer) to service_role;
