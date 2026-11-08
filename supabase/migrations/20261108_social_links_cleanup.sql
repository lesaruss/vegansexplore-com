-- ve-feedback: Instagram and Facebook buttons on listings (Sean, 2026-11-08: "Facebook opens the plain Facebook page and Instagram
-- a broken page"). The page built correct links; the stored values were the problem. Scan of every approved listing (table
-- ve_social_link_checks, run 'social-2026-11-08'): Instagram through Apify's profile scraper (885 handles, twice for the misses),
-- Facebook through Apify's pages scraper. A value that does not exist, or is not the business's account, comes off the listing
-- (the button then does not show); the old value is kept in details.social_removed and each change is a ve_listing_edits row.
-- Applied through the Supabase connector on 2026-11-08; this file records it.

-- Scan tables (service role only): ve_social_link_checks, ve_social_scan_ig.

-- 1. Instagram: accounts Instagram says do not exist, "@rsrc.php" (a piece of static.cdninstagram.com/rsrc.php/... read off
--    a website), "@accounts", and "fish_defender," (trailing comma, the account exists).
with bad as (
  select l.id, l.instagram, case when s.err is not null then 'Instagram says this account does not exist (checked twice, 2026-11-08)'
    else 'Not an Instagram account' end why
  from listings l join ve_social_link_checks c on c.listing_id=l.id and c.network='instagram' and c.run='social-2026-11-08'
  join ve_social_scan_ig s on s.username=c.url
  where l.status='approved' and s.err='not_found'
), ins as (
  insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
  select id, 'instagram', to_jsonb(instagram), 'null'::jsonb, jsonb_build_object('where','cleanup','why',why,'by','logan','playbook','ve-feedback') from bad returning listing_id
)
update listings l set instagram = null,
  details = coalesce(l.details,'{}'::jsonb) || jsonb_build_object('social_removed', coalesce(l.details->'social_removed','{}'::jsonb)
    || jsonb_build_object('instagram', jsonb_build_object('value', b.instagram, 'why', b.why, 'at', now())))
from bad b where b.id=l.id;

insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'instagram', to_jsonb(instagram), to_jsonb('@fish_defender'::text), '{"where":"cleanup","why":"trailing comma","by":"logan","playbook":"ve-feedback"}'
from listings where instagram = 'fish_defender,';
update listings set instagram = '@fish_defender' where instagram = 'fish_defender,';

-- 2. Facebook: system pages read off website footers (16 /docs, 5 /login, /help, /2008, facebook.com/facebook.com,
--    facebook.com/www.facebook.com), 25 listings; and Blue Moon Cafe's trailing text.
with bad as (select id, facebook from listings where status='approved' and facebook ~* '^https?://(www\.)?facebook\.com/(docs|login|help|2008|external-redirect|facebook\.com|www\.facebook\.com)/?$'),
ins as (insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
  select id, 'facebook', to_jsonb(facebook), 'null'::jsonb, '{"where":"cleanup","why":"A Facebook system page, not the business (read off a website footer)","by":"logan","playbook":"ve-feedback"}' from bad returning 1)
update listings l set facebook=null, details = coalesce(l.details,'{}'::jsonb) || jsonb_build_object('social_removed', coalesce(l.details->'social_removed','{}'::jsonb)
    || jsonb_build_object('facebook', jsonb_build_object('value', b.facebook, 'why', 'A Facebook system page, not the business', 'at', now())))
from bad b where b.id=l.id;

with b as (select id, facebook from listings where facebook like 'https://www.facebook.com/bluemooncafe@%'),
i as (insert into ve_listing_edits (listing_id, field, old_value, new_value, meta) select id,'facebook',to_jsonb(facebook),to_jsonb('https://www.facebook.com/bluemooncafe'::text),'{"where":"cleanup","why":"trailing text after the page name","by":"logan","playbook":"ve-feedback"}' from b returning 1)
update listings l set facebook='https://www.facebook.com/bluemooncafe' from b where b.id=l.id;
