-- The brands marked Permanently closed, checked 2026-11-01 (Sean: "check the other brands marked closed too"), each against its own
-- website read through pg_net, and a search:
--   Calypso Bites: calypsobites.com is a live store (prices, Add to cart) -> open again.
--   Rhythm Superfoods: rhythmsuperfoods.com now serves an unrelated streaming site; no news since 2017 -> stays closed, the dead
--     website link is cleared so the listing never sends anyone there.
--   Sweet Earth Foods: sweetearthfoods.com refuses (403); VegNews reports the brand is nowhere to be found under Nestle -> stays closed.
--   Immaculate Vegan (closed by Sean 2026-10-25), NadaMoo!, Parma!, Om Sweet Home, Vlendedful (Sean, 2026-11-01) stay closed.
update listings set business_status = 'OPERATIONAL', updated_at = now(),
  details = coalesce(details, '{}'::jsonb) || jsonb_build_object('reopened_at', now(), 'reopened_why', 'Its store calypsobites.com was live on 2026-11-01')
where slug = 'calypso-bites' and business_status = 'CLOSED_PERMANENTLY';
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'business_status', '"CLOSED_PERMANENTLY"'::jsonb, '"OPERATIONAL"'::jsonb, '{"by":"logan","why":"calypsobites.com live and selling, 2026-11-01"}'::jsonb
from listings l where slug = 'calypso-bites' and not exists (select 1 from ve_listing_edits e where e.listing_id = l.id and e.field = 'business_status' and e.new_value = '"OPERATIONAL"'::jsonb);
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'website', to_jsonb(website), 'null'::jsonb, '{"by":"logan","why":"the domain now serves an unrelated site, 2026-11-01"}'::jsonb
from listings where slug = 'rhythm-superfoods' and website ilike '%rhythmsuperfoods.com%';
update listings set website = null, updated_at = now(),
  details = coalesce(details, '{}'::jsonb) || jsonb_build_object('closed_note', 'Its website now serves an unrelated site (checked 2026-11-01)')
where slug = 'rhythm-superfoods' and website ilike '%rhythmsuperfoods.com%';
