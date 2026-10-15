-- Server-authoritative store inventory and achievements for online accounts.
create table if not exists public.hub_shop_catalog (
  item_id text primary key,
  item_name text not null,
  item_kind text not null check (item_kind in ('title','frame','avatar','theme','badge','banner','boost','case','skin','weaponSkin')),
  cost integer not null check (cost >= 0),
  rarity text not null default 'COMMON',
  daily_order integer unique,
  active boolean not null default true
);
alter table public.hub_shop_catalog drop constraint if exists hub_shop_catalog_item_kind_check;
alter table public.hub_shop_catalog add constraint hub_shop_catalog_item_kind_check check (item_kind in ('title','frame','avatar','theme','badge','banner','boost','case','skin','weaponSkin'));
create table if not exists public.hub_inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.hub_shop_catalog(item_id),
  purchased_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
create table if not exists public.hub_daily_shop_purchases (
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_date date not null default current_date,
  item_id text not null references public.hub_shop_catalog(item_id),
  purchased_at timestamptz not null default now(),
  primary key (user_id, claim_date, item_id)
);
create table if not exists public.hub_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);
alter table public.hub_shop_catalog enable row level security;
alter table public.hub_inventory enable row level security;
alter table public.hub_daily_shop_purchases enable row level security;
alter table public.hub_achievements enable row level security;
revoke all on public.hub_shop_catalog from anon, authenticated;
revoke all on public.hub_inventory from anon, authenticated;
revoke all on public.hub_daily_shop_purchases from anon, authenticated;
revoke all on public.hub_achievements from anon, authenticated;
grant select, insert, update, delete on public.hub_shop_catalog to service_role;
grant select, insert, update, delete on public.hub_inventory to service_role;
grant select, insert, update, delete on public.hub_daily_shop_purchases to service_role;
grant select, insert, update, delete on public.hub_achievements to service_role;

insert into public.hub_shop_catalog(item_id,item_name,item_kind,cost,rarity,daily_order) values
('title_shadow','Тінь Ерангелю','title',2500,'RARE',0),
('frame_neon','Неонова рамка','frame',3000,'RARE',1),
('theme_gold','Золота тактика','theme',5500,'EPIC',2),
('badge_sniper','Знак снайпера','badge',3500,'EPIC',3),
('banner_legend','Банер «Легенда»','banner',9000,'LEGENDARY',4),
('title_loot','Король луту','title',15000,'LEGENDARY',5),
('badge_veteran','Ветеран хабу','badge',2000,'RARE',6),
('frame_steel','Сталева рамка','frame',1800,'COMMON',7),
('title_raider','Рейдер','title',1800,'COMMON',8),
('boost_xp','XP-бустер +100','boost',1500,'EPIC',null),
('supply_case','Сезонний кейс','case',2500,'EPIC',null),
('title_ace','ACE мисливець','title',12000,'LEGENDARY',9),
('avatar_royal','Аватар «Королівський шолом»','avatar',4500,'EPIC',10),
('avatar_phantom','Аватар «Фантом»','avatar',6000,'EPIC',11),
('avatar_frost','Аватар «Мороз»','avatar',6000,'EPIC',12),
('avatar_commander','Аватар «Командир»','avatar',12000,'LEGENDARY',13),
('frame_crimson','Багряна рамка','frame',4500,'EPIC',14),
('title_pathfinder','Слідопит','title',7000,'RARE',15),
('badge_ace','Знак ACE','badge',15000,'LEGENDARY',16),
('theme_ice','Крижана операція','theme',6500,'EPIC',17),
('banner_ember','Банер «Жар бою»','banner',18000,'LEGENDARY',18),
('avatar_recon','Аватар «Розвідник»','avatar',4000,'RARE',19),
('skin_recruit','Рекрут — польова форма','skin',12000,'EPIC',null),
('skin_urban','Urban Ghost','skin',28000,'LEGENDARY',null),
('skin_shadow','Shadow Ops','skin',65000,'LEGENDARY',null),
('skin_commander','Gold Commander','skin',120000,'LEGENDARY',null),
('weapon_olive','M416 · Olive Tactical','weaponSkin',18000,'EPIC',null),
('weapon_ember','M416 · Ember Core','weaponSkin',48000,'LEGENDARY',null),
('weapon_ice','M416 · Cryo Steel','weaponSkin',90000,'LEGENDARY',null)
on conflict (item_id) do update set
  item_name=excluded.item_name,item_kind=excluded.item_kind,cost=excluded.cost,
  rarity=excluded.rarity,daily_order=excluded.daily_order,active=true;

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

  if v_item.item_kind in ('title','frame','avatar','theme','badge','banner','skin','weaponSkin') and exists(select 1 from public.hub_inventory where user_id=p_user_id and item_id=p_item_id) then
    return jsonb_build_object('error','already_owned');
  end if;
  if v_profile.coins < v_price then return jsonb_build_object('error','insufficient_coins'); end if;

  if v_item.item_kind='case' then
    select * into v_won from public.hub_shop_catalog c
    where c.active=true and c.item_kind in ('title','frame','avatar','theme','badge','banner','skin','weaponSkin')
      and not exists(select 1 from public.hub_inventory i where i.user_id=p_user_id and i.item_id=c.item_id)
    order by random() limit 1;
    if not found then return jsonb_build_object('error','collection_complete'); end if;
    insert into public.hub_inventory(user_id,item_id) values(p_user_id,v_won.item_id) on conflict do nothing;
  elsif v_item.item_kind in ('title','frame','avatar','theme','badge','banner','skin','weaponSkin') then
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


-- Keep cosmetic equipment synchronized across devices for online profiles.
alter table public.hub_profiles
  add column if not exists equipped_title text,
  add column if not exists equipped_frame text,
  add column if not exists equipped_avatar text,
  add column if not exists equipped_theme text,
  add column if not exists equipped_badge text,
  add column if not exists equipped_banner text,
  add column if not exists equipped_skin text,
  add column if not exists equipped_weapon_skin text;

create or replace function public.hub_equip_item(p_user_id uuid, p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.hub_profiles%rowtype;
  v_item public.hub_shop_catalog%rowtype;
  v_current text;
begin
  select * into v_profile from public.hub_profiles where id=p_user_id for update;
  if not found then return jsonb_build_object('error','profile_not_found'); end if;
  select * into v_item from public.hub_shop_catalog where item_id=p_item_id and active=true;
  if not found or v_item.item_kind not in ('title','frame','avatar','theme','badge','banner','skin','weaponSkin') then
    return jsonb_build_object('error','item_not_equipable');
  end if;
  if not exists(select 1 from public.hub_inventory where user_id=p_user_id and item_id=p_item_id) then
    return jsonb_build_object('error','not_owned');
  end if;

  if v_item.item_kind='title' then v_current:=v_profile.equipped_title;  elsif v_item.item_kind='frame' then v_current:=v_profile.equipped_frame;
  elsif v_item.item_kind='avatar' then v_current:=v_profile.equipped_avatar;
  elsif v_item.item_kind='theme' then v_current:=v_profile.equipped_theme;
  elsif v_item.item_kind='badge' then v_current:=v_profile.equipped_badge;
  elsif v_item.item_kind='banner' then v_current:=v_profile.equipped_banner;
  elsif v_item.item_kind='skin' then v_current:=v_profile.equipped_skin;
  else v_current:=v_profile.equipped_weapon_skin;
  end if;

  update public.hub_profiles set
    equipped_title=case when v_item.item_kind='title' then case when v_current=p_item_id then null else p_item_id end else equipped_title end,
    equipped_frame=case when v_item.item_kind='frame' then case when v_current=p_item_id then null else p_item_id end else equipped_frame end,
    equipped_avatar=case when v_item.item_kind='avatar' then case when v_current=p_item_id then null else p_item_id end else equipped_avatar end,
    equipped_theme=case when v_item.item_kind='theme' then case when v_current=p_item_id then null else p_item_id end else equipped_theme end,
    equipped_badge=case when v_item.item_kind='badge' then case when v_current=p_item_id then null else p_item_id end else equipped_badge end,
    equipped_banner=case when v_item.item_kind='banner' then case when v_current=p_item_id then null else p_item_id end else equipped_banner end,
    equipped_skin=case when v_item.item_kind='skin' then case when v_current=p_item_id then null else p_item_id end else equipped_skin end,
    equipped_weapon_skin=case when v_item.item_kind='weaponSkin' then case when v_current=p_item_id then null else p_item_id end else equipped_weapon_skin end,
    updated_at=now()
  where id=p_user_id returning * into v_profile;
  return jsonb_build_object('user',to_jsonb(v_profile),'item_id',p_item_id);
end;
$$;
revoke all on function public.hub_equip_item(uuid,text) from public, anon, authenticated;
grant execute on function public.hub_equip_item(uuid,text) to service_role;
