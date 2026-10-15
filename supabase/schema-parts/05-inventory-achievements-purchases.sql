-- Give every existing and new profile a basic field uniform and starter rifle finish.
insert into public.hub_inventory(user_id,item_id) select id,'skin_recruit' from auth.users on conflict (user_id,item_id) do nothing;
insert into public.hub_inventory(user_id,item_id) select id,'weapon_olive' from auth.users on conflict (user_id,item_id) do nothing;

create or replace function public.hub_refresh_achievements(p_user_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.hub_profiles%rowtype;
  v_owned integer;
  v_modes integer;
  v_daily integer;
  v_daily_shop integer;
  v_telegram boolean;
begin
  select * into v_profile from public.hub_profiles where id=p_user_id;
  if not found then return array[]::text[]; end if;
  select count(*)::integer into v_owned from public.hub_inventory where user_id=p_user_id;
  select count(*)::integer into v_modes from jsonb_each_text(coalesce(v_profile.games,'{}'::jsonb)) g where g.value::integer > 0;
  select count(*)::integer into v_daily from public.hub_telegram_daily_claims where user_id=p_user_id;
  select count(*)::integer into v_daily_shop from public.hub_daily_shop_purchases where user_id=p_user_id;
  select exists(select 1 from public.hub_telegram_links where user_id=p_user_id) into v_telegram;
  if v_profile.played >= 1 then insert into public.hub_achievements(user_id,achievement_id) values(p_user_id,'first_game') on conflict do nothing; end if;
  if v_profile.played >= 5 then insert into public.hub_achievements(user_id,achievement_id) values(p_user_id,'five_games') on conflict do nothing; end if;
  if v_profile.coins >= 100 then insert into public.hub_achievements(user_id,achievement_id) values(p_user_id,'coin_collector') on conflict do nothing; end if;
  if coalesce((v_profile.games->>'quiz')::integer,0) >= 1 then insert into public.hub_achievements(user_id,achievement_id) values(p_user_id,'quiz_master') on conflict do nothing; end if;
  if v_owned >= 1 then insert into public.hub_achievements(user_id,achievement_id) values(p_user_id,'collector') on conflict do nothing; end if;
  if coalesce((v_profile.games->>'arena')::integer,0) >= 1 then insert into public.hub_achievements(user_id,achievement_id) values(p_user_id,'arena_survivor') on conflict do nothing; end if;
  if v_profile.points >= 650 then insert into public.hub_achievements(user_id,achievement_id) values(p_user_id,'rank_gold') on conflict do nothing; end if;
  if v_profile.played >= 25 then insert into public.hub_achievements(user_id,achievement_id) values(p_user_id,'veteran_25') on conflict do nothing; end if;
  if v_owned >= 3 then insert into public.hub_achievements(user_id,achievement_id) values(p_user_id,'collector_3') on conflict do nothing; end if;
  if v_modes >= 5 then insert into public.hub_achievements(user_id,achievement_id) values(p_user_id,'all_modes') on conflict do nothing; end if;
  if v_daily >= 1 then insert into public.hub_achievements(user_id,achievement_id) values(p_user_id,'first_drop') on conflict do nothing; end if;
  if v_daily_shop >= 1 then insert into public.hub_achievements(user_id,achievement_id) values(p_user_id,'daily_buyer') on conflict do nothing; end if;
  if v_telegram then insert into public.hub_achievements(user_id,achievement_id) values(p_user_id,'telegram_linked') on conflict do nothing; end if;
  return array(select achievement_id from public.hub_achievements where user_id=p_user_id order by achievement_id);
end;
$$;
revoke all on function public.hub_refresh_achievements(uuid) from public, anon, authenticated;
grant execute on function public.hub_refresh_achievements(uuid) to service_role;

create or replace function public.hub_purchase_item(p_user_id uuid, p_item_id text, p_daily boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.hub_profiles%rowtype;
  v_item public.hub_shop_catalog%rowtype;
  v_won public.hub_shop_catalog%rowtype;
  v_price integer;
  v_daily_seed integer;
  v_daily_count integer;
  v_offer_a integer;
  v_offer_b integer;
  v_offer_c integer;
begin
  select * into v_profile from public.hub_profiles where id=p_user_id for update;
  if not found then return jsonb_build_object('error','profile_not_found'); end if;
  select * into v_item from public.hub_shop_catalog where item_id=p_item_id and active=true;
  if not found then return jsonb_build_object('error','item_not_found'); end if;

  v_price := v_item.cost;
  if p_daily then
    if v_item.daily_order is null then return jsonb_build_object('error','daily_offer_invalid'); end if;
    select count(*)::integer into v_daily_count from public.hub_shop_catalog where active=true and daily_order is not null;
    v_daily_seed := to_char(current_date,'YYYYMMDD')::integer;
    v_offer_a := v_daily_seed % v_daily_count;
    v_offer_b := (v_daily_seed + 5) % v_daily_count;
    v_offer_c := (v_daily_seed + 11) % v_daily_count;
    if v_item.daily_order not in (v_offer_a,v_offer_b,v_offer_c) then return jsonb_build_object('error','daily_offer_invalid'); end if;
    if exists(select 1 from public.hub_daily_shop_purchases where user_id=p_user_id and claim_date=current_date and item_id=p_item_id) then
      return jsonb_build_object('error','daily_already_bought');
    end if;
    v_price := floor(v_item.cost * 0.75)::integer;
  end if;

  if v_item.item_kind in ('title','frame','avatar','theme','badge','banner','skin','weaponSkin','helmet','vest','backpack') and exists(select 1 from public.hub_inventory where user_id=p_user_id and item_id=p_item_id) then
    return jsonb_build_object('error','already_owned');
  end if;
  if v_profile.coins < v_price then return jsonb_build_object('error','insufficient_coins'); end if;

  if v_item.item_kind='case' then
    select * into v_won from public.hub_shop_catalog c
    where c.active=true and c.item_kind in ('title','frame','avatar','theme','badge','banner','skin','weaponSkin','helmet','vest','backpack')
      and not exists(select 1 from public.hub_inventory i where i.user_id=p_user_id and i.item_id=c.item_id)
    order by random() limit 1;
    if not found then return jsonb_build_object('error','collection_complete'); end if;
    insert into public.hub_inventory(user_id,item_id) values(p_user_id,v_won.item_id) on conflict do nothing;
  elsif v_item.item_kind in ('title','frame','avatar','theme','badge','banner','skin','weaponSkin','helmet','vest','backpack') then
    insert into public.hub_inventory(user_id,item_id) values(p_user_id,p_item_id);
  end if;

  update public.hub_profiles set
    coins=coins-v_price,
    xp=xp+case when v_item.item_kind='boost' then 100 else 0 end,
    updated_at=now()
  where id=p_user_id returning * into v_profile;

  if p_daily then
    insert into public.hub_daily_shop_purchases(user_id,claim_date,item_id) values(p_user_id,current_date,p_item_id);
  end if;

  return jsonb_build_object(
    'user',to_jsonb(v_profile),
    'item_id',p_item_id,
    'item_kind',v_item.item_kind,
    'won_item_id',case when v_item.item_kind='case' then v_won.item_id else null end,
    'cost',v_price,
    'daily',p_daily
  );
end;
$$;
revoke all on function public.hub_purchase_item(uuid,text,boolean) from public, anon, authenticated;
grant execute on function public.hub_purchase_item(uuid,text,boolean) to service_role;
