-- Verified Elite entitlement, secure Monobank payment orders, and premium ideas inbox.
alter table public.hub_profiles add column if not exists elite_verified boolean not null default false;
alter table public.hub_profiles add column if not exists elite_expires_at timestamptz;

create table if not exists public.hub_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null check (plan_id in ('supporter','elite','legend')),
  amount integer not null check (amount in (9900,24900,49900)),
  reference uuid not null unique,
  invoice_id text unique,
  status text not null default 'pending' check (status in ('pending','processing','success','failure','expired','failed','paid','unknown')),
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
