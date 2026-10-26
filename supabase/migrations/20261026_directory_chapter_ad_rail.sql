-- The Directory's ad rail (Sean, 2026-10-26): three-fourths listings, one-fourth two 300 x 250 banners.
-- A city uses its hub's two landscape slots (page /communities/<slug>), so the same banners run through the
-- chapter; All cities uses this pair. Applied 2026-10-26 through the Supabase connector.
insert into ad_placements (brand_slug, site_name, site_url, page_name, page_slug, slot_id, slot_position, dimensions, estimated_monthly_views, status, notes)
select 'vegans-explore','VEGANS EXPLORE','https://vegansexplore.com','Directory - All cities','/directory', s, 'sticky-sidebar','300x250',0,'active',
 'Directory rail when All cities is picked (/directory and the dashboard Directory tab), public/ve-ad-rail.js chapter rail, Sean 2026-10-26.'
from unnest(array['ve-directory-landscape-1','ve-directory-landscape-2']) s
where not exists (select 1 from ad_placements where page_slug = '/directory' and slot_id = s);

update ad_placements set notes = coalesce(notes, '') || ' | 2026-10-26: also the chapter rail on /directory and the dashboard Directory tab when this city is picked (Sean: same banners throughout the chapter).'
where page_slug like '/communities/%' and slot_id like '%-landscape-_' and coalesce(notes, '') not like '%chapter rail%';
