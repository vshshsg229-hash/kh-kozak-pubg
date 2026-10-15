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
