-- KH么Kozak Battle Hub v16.13: online inventory support for all fighter slots.
-- Run this migration in Supabase SQL Editor before using the new online shop items.
alter table public.hub_profiles
  add column if not exists equipped_helmet text,
  add column if not exists equipped_backpack text;

alter table public.hub_shop_catalog drop constraint if exists hub_shop_catalog_item_kind_check;
alter table public.hub_shop_catalog add constraint hub_shop_catalog_item_kind_check
  check (item_kind in ('title','frame','avatar','theme','badge','banner','boost','case','skin','weaponSkin','helmet','backpack'));

insert into public.hub_shop_catalog(item_id,item_name,item_kind,cost,rarity,daily_order) values
('skin_neon','NEON VIPER','skin',500,'EPIC',null),
('weapon_carbon','M416 CARBON BLACK','weaponSkin',350,'RARE',null),
('helmet_raven','RAVEN HELMET','helmet',250,'RARE',null),
('pack_pulse','PULSE BACKPACK','backpack',400,'EPIC',null)
on conflict(item_id) do update set item_name=excluded.item_name,item_kind=excluded.item_kind,cost=excluded.cost,rarity=excluded.rarity,active=true;

create or replace function public.hub_equip_item(p_user_id uuid, p_item_id text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_profile public.hub_profiles%rowtype;
  v_item public.hub_shop_catalog%rowtype;
  v_current text;
begin
  select * into v_profile from public.hub_profiles where id=p_user_id for update;
  if not found then return jsonb_build_object('error','profile_not_found'); end if;
  select * into v_item from public.hub_shop_catalog where item_id=p_item_id and active=true;
  if not found or v_item.item_kind not in ('title','frame','avatar','theme','badge','banner','skin','weaponSkin','helmet','backpack') then
    return jsonb_build_object('error','item_not_equipable');
  end if;
  if not exists(select 1 from public.hub_inventory where user_id=p_user_id and item_id=p_item_id) then
    return jsonb_build_object('error','not_owned');
  end if;
  if v_item.item_kind='title' then v_current:=v_profile.equipped_title;
  elsif v_item.item_kind='frame' then v_current:=v_profile.equipped_frame;
  elsif v_item.item_kind='avatar' then v_current:=v_profile.equipped_avatar;
  elsif v_item.item_kind='theme' then v_current:=v_profile.equipped_theme;
  elsif v_item.item_kind='badge' then v_current:=v_profile.equipped_badge;
  elsif v_item.item_kind='banner' then v_current:=v_profile.equipped_banner;
  elsif v_item.item_kind='skin' then v_current:=v_profile.equipped_skin;
  elsif v_item.item_kind='helmet' then v_current:=v_profile.equipped_helmet;
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
    equipped_backpack=case when v_item.item_kind='backpack' then case when v_current=p_item_id then null else p_item_id end else equipped_backpack end,
    updated_at=now()
  where id=p_user_id returning * into v_profile;
  return jsonb_build_object('user',to_jsonb(v_profile),'item_id',p_item_id);
end;
$$;
revoke all on function public.hub_equip_item(uuid,text) from public, anon, authenticated;
grant execute on function public.hub_equip_item(uuid,text) to service_role;
