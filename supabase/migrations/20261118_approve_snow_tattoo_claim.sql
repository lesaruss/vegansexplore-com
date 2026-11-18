-- Sean, 2026-11-18: "approve it" (Snow Tattoo, New York, an application to be listed, claim 1c527a2d, submitted 2026-11-16, untouched until
-- the sweep). The same as ve-claims admin_review approve: the claim's text is rewritten in the third person first (canon-ve-third-person;
-- it spoke to the reader), the listing goes live with its owner, the claim is approved with Sean as reviewer, and Liz's approval email is
-- queued in the claims-approved-liz campaign with lizApprovalEmail's single-location words (no logo, so no Find us post to wait for).
-- Safe to run twice.
begin;
update ve_listing_claims set proposed = jsonb_set(proposed, '{description}', to_jsonb(
  'Snow Tattoo creates custom, hand-illustrated fine line tattoos, intricate dotwork and delicate scar cover-up art in a tranquil, appointment-only studio in New York City. Founded by fine artist and fine line tattoo specialist Sarah Gaugler, the studio offers a serene, one-on-one atmosphere, trauma-informed care, and only 100% Vegan, toxic-free, hypoallergenic inks. Each session begins with on-the-spot illustration drawn together with the client, shaped to their body and story. First-time visitors often start with one of Sarah''s signature fine line pieces, such as organic florals, celestial motifs or an intentional scar transformation designed to flow with the skin.'::text)),
  updated_at = now()
where id = '1c527a2d-04ab-477a-be10-a1ce5cea428c' and status = 'submitted';

update listings l set
  claim_status = 'verified', claimed_by_member_id = c.member_id, owner_member_id = c.member_id, updated_at = now(),
  ve_contact_name = c.contact_name, ve_contact_email = c.contact_email, ve_contact_phone = nullif(c.contact_phone, ''),
  tagline = coalesce(nullif(c.proposed->>'tagline', ''), l.tagline),
  description = coalesce(nullif(c.proposed->>'description', ''), l.description),
  website = coalesce(nullif(c.proposed->>'website', ''), l.website),
  phone = coalesce(nullif(c.proposed->>'phone', ''), l.phone),
  instagram = coalesce(nullif(c.proposed->>'instagram', ''), l.instagram),
  status = 'approved', tags = array['ve-application-approved']
from ve_listing_claims c where c.id = '1c527a2d-04ab-477a-be10-a1ce5cea428c' and c.status = 'submitted' and l.id = c.listing_id;

insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, step, send_status, stop_reason, personal_emails, personal_note, personal_at)
select 'claims-approved-liz', lower(trim(c.contact_email)), c.contact_name, 0, 'waiting', null,
  jsonb_build_object('1', jsonb_build_object(
    'subject', 'Snow Tattoo is approved and yours on Vegans Explore',
    'body', 'Hi Sarah, Liz here. Your Snow Tattoo page on Vegans Explore is approved, and it''s yours to run. Your words are already on it.' || E'\n\n' ||
      'Sign in and your dashboard opens right away. I''ll walk you through a few quick steps to make the page your own.' || E'\n\n' ||
      'Open your dashboard:' || E'\n' || '{link}' || E'\n\n' ||
      'We launch January 1, and you''re one of our founding businesses. Tell us what would make it better: there''s a Feedback button on every page.' || E'\n\n' ||
      'Liz' || E'\n' || 'The Explorer, Vegans Explore')),
  'listings: ' || c.listing_id, now()
from ve_listing_claims c where c.id = '1c527a2d-04ab-477a-be10-a1ce5cea428c' and c.status = 'submitted'
  and not exists (select 1 from ve_outreach_campaign_members m where m.campaign_slug = 'claims-approved-liz' and m.person_key = lower(trim(c.contact_email)) and m.removed_at is null);

update ve_listing_claims set status = 'approved', review_note = 'Approved by Sean, 2026-11-18.', reviewed_by = '72712a4a-ea0e-4ef4-a29e-d382496ef8da', reviewed_at = now(), updated_at = now()
where id = '1c527a2d-04ab-477a-be10-a1ce5cea428c' and status = 'submitted';
commit;
