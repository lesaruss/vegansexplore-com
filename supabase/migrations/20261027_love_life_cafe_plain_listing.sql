-- Love Life Cafe goes back to a plain listing (Sean, 2026-10-27: "let's remove the VE Verify from Love Life Cafe. We're no
-- longer really doing that... it has served its purpose of using it as a template... And then that also means removing the
-- partner dashboard"). It was the model listing: Sean's own account held it as owner and it carried a comped VE Verified year
-- (ve_verified_memberships, source manual, 2026-09-27). The sample business at /business/sample (no database row) is the
-- model now. Nothing is deleted: the membership is canceled with a note, and trg_ve_verified_sync clears the listing's tier.
-- Unclaimed, it follows every unclaimed place: its 51 hand-entered menu items, 4 videos and 1 Pulse post stay in their tables
-- but stop showing (they show for a claimed listing), and its Menu tab links out to menu_crawl_url.
-- Safe to run twice.

update ve_verified_memberships
   set status = 'canceled', canceled_at = coalesce(canceled_at, now()), cancel_at_period_end = false, updated_at = now(),
       notes = notes || ' Canceled by Sean 2026-10-27: VE Verified retired; the sample business at /business/sample is the model listing now.'
 where listing_id = '630dbf6f-e9ea-4218-b560-ee9448276df9' and status <> 'canceled';

update listings
   set ve_verified = false, ve_verified_tier = null, ve_verified_until = null,
       owner_member_id = null, claimed_by_member_id = null, claim_status = 'unclaimed',
       details = coalesce(details, '{}'::jsonb) || jsonb_build_object('admin_notes', coalesce(details->'admin_notes', '[]'::jsonb) ||
         jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note', 'text',
           'No longer the model listing (Sean, 2026-10-27): VE Verified canceled, and Sean''s account no longer owns or claims it. Its menu items, videos and post are kept for when the business claims it.')))
 where id = '630dbf6f-e9ea-4218-b560-ee9448276df9'
   and (ve_verified or ve_verified_tier is not null or owner_member_id is not null or claimed_by_member_id is not null);
