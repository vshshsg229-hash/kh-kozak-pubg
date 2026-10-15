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
