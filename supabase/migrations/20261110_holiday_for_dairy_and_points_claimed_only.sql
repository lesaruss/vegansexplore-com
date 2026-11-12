-- Sean, 2026-11-10.
-- 1. "Wherever there's a dairy guide, let's put the holiday guide... come Christmas, the holiday guide is going to go on hiatus until
--    Valentine's Day." The Dairy Guide's ad-rail slots move to the Holiday Guide's ad-rail campaign (except the Washington DC hub's
--    landscape slot: its skyscraper is already the Holiday Guide, and one page never runs the same ad twice), and the listing house
--    banner gets a Holiday Guide campaign in the Dairy Guide's place (public/ve-promo.js GUIDE_ADS, tracked link ve-guide-holiday).
--    After Christmas: move the slots back to 7b1c4f2e-...14001 and set it and 13002 active again.
-- 2. "Only businesses that claim their listing can receive points... remove that feature until they've claimed... that becomes a perk
--    for them." Points already given (Dina's from John) stay; new gifts need a claimed listing.

update ad_campaign_placements cp set campaign_id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14008'
 where cp.campaign_id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14001'
   and cp.placement_id not in (select id from ad_placements where slot_id = 've-washington-dc-hub-landscape-1');

insert into ad_campaigns (id, campaign_name, sponsor_name, campaign_type, creative_url, click_through_url, start_date, status, notes, sponsor_campaign_id)
values ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a13005', 'Vegans Explore - The Holiday Guide (house banner)', 'Vegans Explore', 'house',
  'https://vegansexplore.com/public/guides/holiday/theo-thanksliving.jpg', 'https://vegansexplore.com/go/ve-guide-holiday', '2026-11-10', 'active',
  'Animated card, public/ve-promo.js GUIDE_ADS. Sean, 2026-11-10: in the Dairy Guide''s place until Christmas.', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001')
on conflict (id) do nothing;
insert into ad_campaign_placements (campaign_id, placement_id)
select '7b1c4f2e-1a10-4d2e-9a51-0c0de5a13005', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a12001'
where not exists (select 1 from ad_campaign_placements where campaign_id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a13005' and placement_id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a12001');
update ad_campaigns set status = 'paused' where id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a13002';

CREATE OR REPLACE FUNCTION public.ve_listing_contribute(p_member uuid, p_listing uuid, p_points integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare m members; total integer;
begin
  if p_points is null or p_points < 1 or p_points > 10000 then return jsonb_build_object('error', 'bad_amount'); end if;
  select * into m from members where id = p_member for update;
  if m.id is null then return jsonb_build_object('error', 'member_not_found'); end if;
  if m.membership_status is distinct from 'active' then return jsonb_build_object('error', 'payment_required'); end if;
  if not exists (select 1 from listings where id = p_listing and status = 'approved') then return jsonb_build_object('error', 'listing_not_found'); end if;
  -- Points go only to a claimed listing (Sean, 2026-11-10): receiving points is a perk of claiming.
  if not exists (select 1 from listings where id = p_listing and claimed_by_member_id is not null) then return jsonb_build_object('error', 'not_claimed'); end if;
  if coalesce(m.lesars_balance, 0) < p_points then return jsonb_build_object('error', 'not_enough_points', 'balance', coalesce(m.lesars_balance, 0)); end if;
  update members set lesars_balance = lesars_balance - p_points where id = p_member;
  perform apply_member_points_delta(p_member, -p_points);
  insert into points_ledger (member_id, delta, reason, ref_id) values (p_member, -p_points, 'points_contribution', 'listing:' || p_listing);
  insert into ve_listing_point_contributions (listing_id, member_id, points) values (p_listing, p_member, p_points);
  select coalesce(sum(points), 0) into total from ve_listing_point_contributions where listing_id = p_listing;
  return jsonb_build_object('ok', true, 'balance', m.lesars_balance - p_points, 'listing_total', total);
end $function$;
