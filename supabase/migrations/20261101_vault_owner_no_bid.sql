-- Owners never bid on their own place's cards (canon-ve-earn-your-passport: owners earn nothing at their own place). Safe to run twice.
create or replace function public.ve_vault_bid(p_member uuid, p_card uuid, p_points int)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare c ve_vault_cards; m members; cfg jsonb; mine int; top int;
begin
  select * into m from members where id = p_member;
  if m.id is null or m.membership_status is distinct from 'active' then return jsonb_build_object('error', 'members_only'); end if;
  select * into c from ve_vault_cards where id = p_card for update;
  if not found or c.status <> 'available' or now() < c.opens_at or now() >= c.auction_ends_at then return jsonb_build_object('error', 'not_open'); end if;
  if exists (select 1 from listings where id = c.listing_id and (owner_member_id = p_member or claimed_by_member_id = p_member))
     or exists (select 1 from ve_pc_slots where id = c.slot_id and member_id = p_member) then
    return jsonb_build_object('error', 'own_place'); end if;
  select value into cfg from ve_site_settings where key = 'passport_challenge';
  if p_points is null or p_points < coalesce((cfg->>'min_bid')::int, 100) then return jsonb_build_object('error', 'min_bid', 'min', coalesce((cfg->>'min_bid')::int, 100)); end if;
  if coalesce(m.lesars_balance, 0) < p_points then return jsonb_build_object('error', 'not_enough_points', 'balance', coalesce(m.lesars_balance, 0)); end if;
  select points into mine from ve_vault_bids where card_id = p_card and member_id = p_member;
  if mine is not null and p_points <= mine then return jsonb_build_object('error', 'raise_it', 'yours', mine); end if;
  insert into ve_vault_bids (card_id, member_id, points) values (p_card, p_member, p_points)
  on conflict (card_id, member_id) do update set points = excluded.points, updated_at = now();
  select max(points) into top from ve_vault_bids where card_id = p_card;
  return jsonb_build_object('ok', true, 'yours', p_points, 'top', top, 'leading', p_points >= top);
end $function$;
