-- Sean, 2026-11-12: "I approve both businesses" (playbook ve-claims-onboarding). The same as ve-claims admin_review approve for each of
-- the 7 submitted claims (Chaska 1, Next Level Veggie Grill 6): the listing gets its owner and the claim's third-person text, the claim is
-- approved with Sean as reviewer, other waiting claims on the same listing are turned down. Tustin (new location) is published too.
-- No email is sent here: Liz's congratulations email goes out separately once Sean approves its words.
begin;
with sean as (select id from members where is_superadmin = true and lower(email) = 'contact@lesaruss.com' limit 1),
c as (
  select c.* from ve_listing_claims c join listings l on l.id = c.listing_id
  where c.status = 'submitted' and l.slug in ('chaska','veggie-grill','next-level-veggie-grill','next-level-veggie-grill-burbank-d55b',
    'next-level-veggie-grill-long-beach-b4fc','next-level-veggie-grill-los-angeles-9f8d','next-level-veggie-grill-tustin')
),
upd as (
  update listings l set
    claim_status = 'verified', claimed_by_member_id = c.member_id, owner_member_id = c.member_id, updated_at = now(),
    ve_contact_name = c.contact_name, ve_contact_email = c.contact_email, ve_contact_phone = nullif(c.contact_phone, ''),
    tagline = coalesce(nullif(c.proposed->>'tagline', ''), l.tagline),
    description = coalesce(nullif(c.proposed->>'description', ''), l.description),
    website = coalesce(nullif(c.proposed->>'website', ''), l.website),
    phone = coalesce(nullif(c.proposed->>'phone', ''), l.phone),
    instagram = coalesce(nullif(c.proposed->>'instagram', ''), l.instagram),
    vegan_status = coalesce(nullif(c.proposed->>'vegan_status', ''), l.vegan_status),
    status = case when l.slug = 'next-level-veggie-grill-tustin' then 'approved' else l.status end
  from c where l.id = c.listing_id
  returning l.slug
),
rej as (
  update ve_listing_claims o set status = 'rejected', review_note = 'Another claim for this listing was approved.', reviewed_by = (select id from sean), reviewed_at = now(), updated_at = now()
  from c where o.listing_id = c.listing_id and o.id <> c.id and o.status in ('awaiting_contribution', 'submitted')
  returning o.id
)
update ve_listing_claims x set status = 'approved', review_note = 'Approved by Sean, 2026-11-12.', reviewed_by = (select id from sean), reviewed_at = now(), updated_at = now()
from c where x.id = c.id;
commit;

-- Tustin had no logo: the chain's own (already in vegan-media).
update listings set logo_url = (select logo_url from listings where slug = 'next-level-veggie-grill'), updated_at = now()
where slug = 'next-level-veggie-grill-tustin' and logo_url is null;
