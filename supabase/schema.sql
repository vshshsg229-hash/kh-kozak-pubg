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

-- Verified paid Elite entitlement; only trusted payment webhooks/admin operations may set this.
alter table public.hub_profiles add column if not exists elite_verified boolean not null default false;
alter table public.hub_profiles add column if not exists elite_expires_at timestamptz;

create table if not exists public.hub_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null check (plan_id in ('supporter','elite','legend')),
  amount integer not null check (amount in (9900,24900,49900)),
  reference uuid not null unique,
  invoice_id text unique,
  status text not null default 'pending' check (status in ('pending','created','processing','hold','success','failure','reversed','expired','failed','paid','unknown')),
  provider_event jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists hub_payment_orders_user_date_idx on public.hub_payment_orders(user_id, created_at desc);
alter table public.hub_payment_orders enable row level security;
revoke all on public.hub_payment_orders from anon, authenticated;
grant select, insert, update, delete on public.hub_payment_orders to service_role;

create or replace function public.hub_fulfill_payment(p_invoice_id text, p_amount integer, p_ccy integer, p_provider_event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.hub_payment_orders%rowtype;
  v_profile public.hub_profiles%rowtype;
  v_expires timestamptz;
  v_days integer;
  v_items text[];
begin
  select * into v_order from public.hub_payment_orders where invoice_id=p_invoice_id for update;
  if not found then return jsonb_build_object('error','order_not_found'); end if;
  if v_order.status='paid' then return jsonb_build_object('ok',true,'duplicate',true,'user_id',v_order.user_id); end if;
  if v_order.amount<>p_amount or p_ccy<>980 then return jsonb_build_object('error','amount_mismatch'); end if;
  v_days := case v_order.plan_id when 'supporter' then 30 when 'elite' then 90 when 'legend' then 365 else 0 end;
  if v_days=0 then return jsonb_build_object('error','invalid_plan'); end if;
  select * into v_profile from public.hub_profiles where id=v_order.user_id for update;
  if not found then return jsonb_build_object('error','profile_not_found'); end if;
  v_expires := greatest(coalesce(v_profile.elite_expires_at,now()),now()) + make_interval(days => v_days);
  update public.hub_profiles set elite_verified=true,elite_expires_at=v_expires,updated_at=now() where id=v_order.user_id;
  v_items := case v_order.plan_id
    when 'supporter' then array['title_pathfinder','frame_crimson']
    when 'elite' then array['title_ace','frame_crimson','skin_shadow','weapon_ember','badge_ace']
    else array['title_loot','banner_ember','skin_commander','weapon_ice','avatar_commander','badge_ace']
  end;
  insert into public.hub_inventory(user_id,item_id)
  select v_order.user_id, unnest(v_items)
  on conflict (user_id,item_id) do nothing;
  update public.hub_payment_orders set status='paid',paid_at=now(),provider_event=p_provider_event where id=v_order.id;
  return jsonb_build_object('ok',true,'duplicate',false,'user_id',v_order.user_id,'plan_id',v_order.plan_id,'expires_at',v_expires);
end;
$$;
revoke all on function public.hub_fulfill_payment(text,integer,integer,jsonb) from public, anon, authenticated;
grant execute on function public.hub_fulfill_payment(text,integer,integer,jsonb) to service_role;


create table if not exists public.hub_premium_ideas (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 100),
  body text not null check (char_length(body) between 20 and 1200),
  status text not null default 'new' check (status in ('new','reviewing','planned','done','declined')),
  created_at timestamptz not null default now()
);
create index if not exists hub_premium_ideas_user_date_idx on public.hub_premium_ideas(user_id, created_at desc);
alter table public.hub_premium_ideas enable row level security;
revoke all on public.hub_premium_ideas from anon, authenticated;
grant select, insert, update, delete on public.hub_premium_ideas to service_role;
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


-- Telegram linking, daily claims, and admin support (safe to run after the base schema).
create table if not exists public.hub_telegram_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  telegram_user_id bigint not null unique,
  chat_id bigint not null,
  username text,
  linked_at timestamptz not null default now()
);
create index if not exists hub_telegram_links_chat_idx on public.hub_telegram_links(chat_id);
create table if not exists public.hub_telegram_link_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists hub_telegram_link_codes_expiry_idx on public.hub_telegram_link_codes(expires_at);
create table if not exists public.hub_telegram_daily_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_date date not null default current_date,
  coins integer not null default 25,
  points integer not null default 20,
  xp integer not null default 20,
  created_at timestamptz not null default now(),
  primary key (user_id, claim_date)
);
alter table public.hub_telegram_links enable row level security;
alter table public.hub_telegram_link_codes enable row level security;
alter table public.hub_telegram_daily_claims enable row level security;
revoke all on public.hub_telegram_links from anon, authenticated;
revoke all on public.hub_telegram_link_codes from anon, authenticated;
revoke all on public.hub_telegram_daily_claims from anon, authenticated;
grant select, insert, update, delete on public.hub_telegram_links to service_role;
grant select, insert, update, delete on public.hub_telegram_link_codes to service_role;
grant select, insert, update, delete on public.hub_telegram_daily_claims to service_role;

create or replace function public.hub_claim_telegram_daily(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.hub_profiles%rowtype;
  v_rows integer;
begin
  select * into v_profile from public.hub_profiles where id = p_user_id for update;
  if not found then return jsonb_build_object('error', 'profile_not_found'); end if;

  insert into public.hub_telegram_daily_claims(user_id, claim_date)
  values (p_user_id, current_date)
  on conflict (user_id, claim_date) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return jsonb_build_object('already_claimed', true, 'user', to_jsonb(v_profile));
  end if;

  update public.hub_profiles set
    coins = coins + 25,
    points = points + 20,
    xp = xp + 20,
    updated_at = now()
  where id = p_user_id
  returning * into v_profile;

  return jsonb_build_object(
    'already_claimed', false,
    'reward', jsonb_build_object('coins', 25, 'points', 20, 'xp', 20),
    'user', to_jsonb(v_profile)
  );
end;
$$;
revoke all on function public.hub_claim_telegram_daily(uuid) from public, anon, authenticated;
grant execute on function public.hub_claim_telegram_daily(uuid) to service_role;


-- Server-authoritative store inventory and achievements for online accounts.
create table if not exists public.hub_shop_catalog (
  item_id text primary key,
  item_name text not null,
  item_kind text not null check (item_kind in ('title','frame','avatar','theme','badge','banner','boost','case','skin','weaponSkin','helmet','vest','backpack')),
  cost integer not null check (cost >= 0),
  rarity text not null default 'COMMON',
  daily_order integer unique,
  active boolean not null default true,
  required_level integer not null default 1
);
alter table public.hub_shop_catalog add column if not exists required_level integer not null default 1;
alter table public.hub_shop_catalog drop constraint if exists hub_shop_catalog_item_kind_check;
alter table public.hub_shop_catalog add constraint hub_shop_catalog_item_kind_check check (item_kind in ('title','frame','avatar','theme','badge','banner','boost','case','skin','weaponSkin','helmet','vest','backpack'));
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


-- Keep cosmetic equipment synchronized across devices for online profiles.
alter table public.hub_profiles
  add column if not exists equipped_title text,
  add column if not exists equipped_frame text,
  add column if not exists equipped_avatar text,
  add column if not exists equipped_theme text,
  add column if not exists equipped_badge text,
  add column if not exists equipped_banner text,
  add column if not exists equipped_skin text,
  add column if not exists equipped_weapon_skin text,
  add column if not exists equipped_helmet text,
  add column if not exists equipped_vest text,
  add column if not exists equipped_backpack text;

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
  if not found or v_item.item_kind not in ('title','frame','avatar','theme','badge','banner','skin','weaponSkin','helmet','vest','backpack') then
    return jsonb_build_object('error','item_not_equipable');
  end if;
  if not exists(select 1 from public.hub_inventory where user_id=p_user_id and item_id=p_item_id) then
    if coalesce(v_item.required_level,1) > floor(coalesce(v_profile.xp,0)::numeric/100)::integer+1 then
      return jsonb_build_object('error','not_owned');
    end if;
    insert into public.hub_inventory(user_id,item_id) values(p_user_id,p_item_id) on conflict do nothing;
  end if;

  if v_item.item_kind='title' then v_current:=v_profile.equipped_title;
  elsif v_item.item_kind='frame' then v_current:=v_profile.equipped_frame;
  elsif v_item.item_kind='avatar' then v_current:=v_profile.equipped_avatar;
  elsif v_item.item_kind='theme' then v_current:=v_profile.equipped_theme;
  elsif v_item.item_kind='badge' then v_current:=v_profile.equipped_badge;
  elsif v_item.item_kind='banner' then v_current:=v_profile.equipped_banner;
  elsif v_item.item_kind='skin' then v_current:=v_profile.equipped_skin;
  elsif v_item.item_kind='helmet' then v_current:=v_profile.equipped_helmet;
  elsif v_item.item_kind='vest' then v_current:=v_profile.equipped_vest;
  elsif v_item.item_kind='backpack' then v_current:=v_profile.equipped_backpack;
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
    equipped_helmet=case when v_item.item_kind='helmet' then case when v_current=p_item_id then null else p_item_id end else equipped_helmet end,
    equipped_vest=case when v_item.item_kind='vest' then case when v_current=p_item_id then null else p_item_id end else equipped_vest end,
    equipped_backpack=case when v_item.item_kind='backpack' then case when v_current=p_item_id then null else p_item_id end else equipped_backpack end,
    updated_at=now()
  where id=p_user_id returning * into v_profile;
  return jsonb_build_object('user',to_jsonb(v_profile),'item_id',p_item_id);
end;
$$;
revoke all on function public.hub_equip_item(uuid,text) from public, anon, authenticated;
grant execute on function public.hub_equip_item(uuid,text) to service_role;


-- Player community: friend requests and private messages. All access is mediated by hub-api.
create table if not exists public.hub_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hub_friendships_not_self check (requester_id <> addressee_id),
  constraint hub_friendships_pair_unique unique (requester_id, addressee_id)
);
create index if not exists hub_friendships_addressee_status_idx on public.hub_friendships(addressee_id, status, updated_at desc);
create index if not exists hub_friendships_requester_status_idx on public.hub_friendships(requester_id, status, updated_at desc);
alter table public.hub_friendships enable row level security;
revoke all on public.hub_friendships from anon, authenticated;
grant select, insert, update, delete on public.hub_friendships to service_role;

create table if not exists public.hub_chat_messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  constraint hub_chat_messages_not_self check (sender_id <> recipient_id)
);
create index if not exists hub_chat_messages_conversation_idx on public.hub_chat_messages(sender_id, recipient_id, created_at desc);
alter table public.hub_chat_messages enable row level security;
revoke all on public.hub_chat_messages from anon, authenticated;
grant select, insert, delete on public.hub_chat_messages to service_role;



-- KH Battle Hub fighter equipment catalog additions.
insert into public.hub_shop_catalog(item_id,item_name,item_kind,cost,rarity,daily_order,required_level) values
('skin_neon','NEON VIPER','skin',500,'EPIC',null,1),
('weapon_carbon','M416 CARBON BLACK','weaponSkin',350,'RARE',null,1),
('helmet_raven','RAVEN HELMET','helmet',250,'RARE',null,1),
('pack_pulse','PULSE BACKPACK','backpack',400,'EPIC',null,1),
('helmet_scout','ШОЛОМ РОЗВІДНИКА','helmet',250,'RARE',null,2),
('vest_titan','БРОНЕЖИЛЕТ TITAN','vest',300,'RARE',null,3),
('pack_phantom','РЮКЗАК PHANTOM','backpack',400,'EPIC',null,5),
('skin_urban','Urban Ghost','skin',28000,'LEGENDARY',null,2),
('weapon_ember','M416 Ember Core','weaponSkin',48000,'LEGENDARY',null,4),
('skin_shadow','Shadow Ops','skin',65000,'LEGENDARY',null,6),
('weapon_ice','M416 Cryo Steel','weaponSkin',90000,'LEGENDARY',null,8),
('skin_commander','Gold Commander','skin',120000,'LEGENDARY',null,10),
on conflict(item_id) do update set item_name=excluded.item_name,item_kind=excluded.item_kind,cost=excluded.cost,rarity=excluded.rarity,required_level=excluded.required_level,active=true;
