-- KH么Kozak Battle Hub: player community migration
-- Run this in Supabase SQL Editor if the main schema was applied before this feature.
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
