-- The Meatless Muscle Cookbook's picture: its flat cover on an iPad on a kitchen counter (Sean, 2026-10-30: the angled, cut-off
-- cover "looks sloppy"; the iPad idea "so it doesn't look like it's just a horizontal thing slapped in a vertical frame"; approved
-- "They both work"). The cover is the cookbook's own Canva design, composited onto a Higgsfield kitchen scene; the same picture
-- runs on meatlessmuscle.com (assets/img/cookbook-ipad-tall.jpg, the 16:9 one on her Media page). The old one is kept in
-- details.logo_replaced. Safe to run twice.
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'logo', to_jsonb(logo_url),
  to_jsonb('https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/books/meatless-muscle-cookbook-ipad.jpg'::text),
  jsonb_build_object('by', 'logan', 'why', 'Sean 2026-10-30: the cover on an iPad on a kitchen counter, approved')
from listings where slug = 'meatless-muscle-cookbook-by-brooke-sellers' and logo_url not like '%meatless-muscle-cookbook-ipad.jpg';

update listings set
  details = details || jsonb_build_object('logo_replaced', logo_url, 'logo_source', 'admin', 'logo_checked', '2026-10-30'),
  logo_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/books/meatless-muscle-cookbook-ipad.jpg',
  updated_at = now()
where slug = 'meatless-muscle-cookbook-by-brooke-sellers' and logo_url not like '%meatless-muscle-cookbook-ipad.jpg';
