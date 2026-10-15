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
revoke all on public.hub_profiles from anon, authenticated;revoke all on public.hub_game_events from anon, authenticated;
grant select, insert, update, delete on public.hub_profiles to service_role;
grant select, insert, update, delete on public.hub_game_events to service_role;
