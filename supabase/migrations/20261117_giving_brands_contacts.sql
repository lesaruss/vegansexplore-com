-- 11 Days of Giving brand list: emails found, contacts filed, the draft campaign filled (run 2026-11-17 through ve-once-giving-brands,
-- the connector held the write). Nothing sends until Sean approves giving-2026-brands in HQ Outreach.
with r as (select b.listing_id, (r.content)::jsonb j from ve_giving_brand_list b join net._http_response r on r.id=b.contact_request where r.content ~ '^\s*\{' and r.status_code = 200),
e as (select listing_id, (select array_agg(distinct lower(m[1])) from regexp_matches(coalesce(j->>'text','') || ' ' || coalesce((j->'links')::text,''), '([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})', 'g') m
   where lower(m[1]) !~ '(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.svg|sentry|wixpress|example\.com|domain\.com|godaddy|yourname|email\.com|@2x|shopify\.com)') ems from r)
update ve_giving_brand_list b set found_emails = e.ems, updated_at = now() from e where e.listing_id = b.listing_id and e.ems is not null;
update ve_giving_brand_list b set best_email = coalesce(
   (select o.email from ve_outreach_contacts o where o.listing_id = b.listing_id limit 1),
   b.email_on_file,
   (select x from unnest(b.found_emails) x order by
      case when x ~ '^(partner|collab|sponsor|marketing|pr|press|media|wholesale|sales)' then 0 when x ~ '^(hello|hi|info|contact|team|support)' then 1 else 2 end,
      case when b.website is not null and position(split_part(x,'@',2) in lower(b.website)) > 0 then 0 else 1 end limit 1)), updated_at = now();
insert into ve_outreach_contacts (listing_id, community_slug, email, segment, status, email_source, name_confirmed)
select b.listing_id, 'brands', b.best_email, 'brand', 'not_sent', 'website', false
from ve_giving_brand_list b
where b.best_email is not null and not exists (select 1 from ve_outreach_contacts o where o.listing_id = b.listing_id);
insert into ve_outreach_campaign_members (campaign_slug, listing_id, step, send_status)
select 'giving-2026-brands', d.listing_id, 0, 'waiting'
from (select distinct on (lower(o.email)) o.listing_id, o.email from ve_outreach_contacts o join ve_giving_brand_list b on b.listing_id = o.listing_id
      where o.status not in ('opted_out','held') and lower(o.email) not in (select lower(email) from ve_opted_out_people where email is not null)
      order by lower(o.email), b.name) d
where not exists (select 1 from ve_outreach_campaign_members m where m.campaign_slug = 'giving-2026-brands' and m.listing_id = d.listing_id and m.removed_at is null);
-- Pruned after review: an address on our own domain (Planted Table), a parent company's hiring inbox (Silk), a cafe inbox (Follow Your Heart).
update ve_outreach_campaign_members m set removed_at = now(), stop_reason = 'Wrong inbox found on the website (Logan, 2026-11-17)'
 from ve_outreach_contacts o where o.listing_id = m.listing_id and m.campaign_slug = 'giving-2026-brands' and m.removed_at is null
  and lower(o.email) in ('priya.sharma@vegansexplore.com', 'danone.ta@danone.com', 'marketcafe@followyourheart.com');
update ve_outreach_contacts set status = 'held', stop_reason = 'Wrong inbox found on the website (Logan, 2026-11-17)'
 where email_source = 'website' and lower(email) in ('priya.sharma@vegansexplore.com', 'danone.ta@danone.com', 'marketcafe@followyourheart.com');
