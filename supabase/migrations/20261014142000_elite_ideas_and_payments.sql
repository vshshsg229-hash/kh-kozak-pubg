-- KH Battle Hub Elite, premium ideas, payment orders and skin-aware online inventory.
alter table public.hub_profiles add column if not exists elite_verified boolean not null default false;
alter table public.hub_profiles add column if not exists elite_expires_at timestamptz;
alter table public.hub_profiles add column if not exists equipped_skin text;
alter table public.hub_profiles add column if not exists equipped_weapon_skin text;

alter table public.hub_shop_catalog drop constraint if exists hub_shop_catalog_item_kind_check;
alter table public.hub_shop_catalog add constraint hub_shop_catalog_item_kind_check check (item_kind in ('title','frame','avatar','theme','badge','banner','boost','case','skin','weaponSkin'));

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
