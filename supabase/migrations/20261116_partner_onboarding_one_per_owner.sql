-- One welcome series per owner, not per location (playbook ve-claims-onboarding, 2026-11-16). Next Level Veggie Grill's six approved
-- locations each started the Day 2 / 7 / 21 series from Sean, so marketing@nextlevelvg.com got six copies of "Let's make Next Level
-- Veggie Grill's page yours" at 9:00 AM Eastern on Nov 16. The five extra rows were stopped by hand (step 3, no next send) the same
-- morning. From now on, a location approved for an owner whose series is already running (or ran in the last 30 days) joins it
-- quietly: status onboarding, step 3, nothing more sent for it.
CREATE OR REPLACE FUNCTION public.ve_partner_onboarding_from_claim()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare city text; cm uuid; owner_has_series boolean;
begin
  if coalesce(new.test, false) then return new; end if;
  if new.status in ('submitted', 'approved') and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    city := ve_listing_city(new.listing_id);
    insert into ve_partner_onboarding (listing_id, claim_id, member_id, tier, contact_name, contact_email, community_slug, submitted_at)
    values (new.listing_id, new.id, new.member_id, new.tier, new.contact_name, new.contact_email, city, coalesce(new.paid_at, now()))
    on conflict (listing_id) do update set claim_id = excluded.claim_id, member_id = excluded.member_id, tier = excluded.tier,
      contact_name = excluded.contact_name, contact_email = excluded.contact_email,
      status = case when ve_partner_onboarding.status = 'closed' then 'waiting' else ve_partner_onboarding.status end, updated_at = now();
  end if;
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    select community_slug into city from ve_partner_onboarding where listing_id = new.listing_id;
    select id into cm from members where ve_role = 'community_manager' and home_community = city order by created_at limit 1;
    select exists (select 1 from ve_partner_onboarding o where o.listing_id <> new.listing_id
      and lower(o.contact_email) = lower(new.contact_email) and o.status = 'onboarding' and o.approved_at > now() - interval '30 days') into owner_has_series;
    if owner_has_series then
      update ve_partner_onboarding set status = 'onboarding', approved_at = now(), step = 3, next_send_at = null,
        route_to = case when cm is null then 'sean' else 'community_manager' end, assigned_member_id = cm, updated_at = now()
      where listing_id = new.listing_id and status in ('waiting', 'closed');
    else
      update ve_partner_onboarding set status = 'onboarding', approved_at = now(), step = 0,
        next_send_at = ve_weekday_morning(now(), (select day_after from ve_onboarding_templates where step = 1)),
        route_to = case when cm is null then 'sean' else 'community_manager' end, assigned_member_id = cm, updated_at = now()
      where listing_id = new.listing_id and status in ('waiting', 'closed');
    end if;
  elsif new.status = 'rejected' and tg_op = 'UPDATE' and old.status is distinct from 'rejected' then
    update ve_partner_onboarding set status = 'closed', updated_at = now() where listing_id = new.listing_id and status = 'waiting' and claim_id = new.id;
  end if;
  return new;
end $function$;

-- Applied by hand 2026-11-16 before this file: the five duplicate Next Level Veggie Grill rows (Burbank, Long Beach, Los Angeles x2,
-- Tustin) set to step 3, next_send_at null; Pasadena keeps the series.
