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
