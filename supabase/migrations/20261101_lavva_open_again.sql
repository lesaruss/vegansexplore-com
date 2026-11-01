-- Lavva was marked Permanently closed on 2026-10-25 (no note, no edit row; most likely Google's status for a place). Its own
-- store, lovvelavva.com, was up and selling on 2026-11-01 (read through pg_net), so it is open again, logged in ve_listing_edits.
-- Parma! (eatparma.com no longer resolves) and NadaMoo! (nadamoo.com reads "Opening Soon", no shop) stay closed.
update listings set business_status = 'OPERATIONAL', updated_at = now(),
  details = coalesce(details, '{}'::jsonb) || jsonb_build_object('reopened_at', now(), 'reopened_why', 'Its store lovvelavva.com was live on 2026-11-01')
where slug = 'lavva' and business_status = 'CLOSED_PERMANENTLY';
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'business_status', '"CLOSED_PERMANENTLY"'::jsonb, '"OPERATIONAL"'::jsonb, '{"by":"logan","why":"lovvelavva.com live and selling, 2026-11-01"}'::jsonb
from listings where slug = 'lavva' and not exists (
  select 1 from ve_listing_edits e join listings l2 on l2.id = e.listing_id where l2.slug = 'lavva' and e.field = 'business_status' and e.new_value = '"OPERATIONAL"'::jsonb);
