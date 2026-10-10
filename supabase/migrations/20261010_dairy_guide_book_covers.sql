-- Cookbook covers for the last seven Dairy Guide books (Sean, 2026-10-10: "finish the pictures"). Each is the publisher's
-- own cover, or the retailer's cover image where the publisher's page had none, copied into our storage as an 800 x 800
-- square (the cover centered on cream), the same as the first five. The Directory and the Guide both show it.
update public.listings l set logo_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/books/' || l.slug || '.jpg',
  details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('cover_source', v.src, 'cover_checked', '2026-10-10')
from (values
  ('artisan-vegan-cheese-by-miyoko-schinner', 'publisher: bookpubco.com'),
  ('the-cheese-trap-by-neal-d-barnard-md', 'publisher: hachettebookgroup.com'),
  ('the-vegan-creamery-by-miyoko-schinner', 'retailer cover image, ISBN 9780593836071'),
  ('the-vegan-dairy-cookbook-by-marleen-visser', 'publisher: skyhorsepublishing.com'),
  ('the-oat-milk-cookbook-by-kim-lutz', 'retailer cover image, ISBN 9781454938187'),
  ('vegan-dairy-by-emelie-holm', 'retailer cover image, ISBN 9781911641247'),
  ('the-vegan-dairy-by-catherine-atkinson', 'retailer cover image, ISBN 9780754834861')
) v(slug, src)
where l.slug = v.slug and l.status = 'approved' and l.category = 'Books';
