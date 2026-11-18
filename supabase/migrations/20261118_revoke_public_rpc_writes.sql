-- 2026-11-18 sweep (Sean: "see if there's any pending items... on the security side"). Supabase's advisor lists these SECURITY DEFINER
-- functions as callable by anyone with the public key through /rest/v1/rpc. Each writes, none checks who is calling, and several take the
-- member or admin id as an argument (ve_vault_bid could bid any member's points, ve_pc_slot_approve could approve a slot as any admin,
-- ve_survey_door_admit could admit any member). Their only callers are edge functions (service role), other SECURITY DEFINER functions
-- (run as the owner) and cron, so public execute is removed. The tracking calls the site makes from the browser (ve_listing_track,
-- ve_promo_track, ve_referral_visit) stay public. Safe to run twice.
do $$
declare f text;
begin
  foreach f in array array[
    've_supermarket_guide_sync()', 've_survey_door_admit(uuid)', 've_survey_door_start(uuid)', 've_vault_bid(uuid, uuid, integer)',
    've_event_support_swap(uuid)', 've_event_attach_supporter(uuid, uuid)', 've_pc_slot_approve(uuid, uuid)',
    've_event_support_release(uuid)', 've_search_feed_refresh()']
  loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
