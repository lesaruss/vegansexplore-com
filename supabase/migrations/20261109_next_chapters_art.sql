-- ve-chapter-rankings: each place on "Where should we go next?" keeps its art, ready for the day it opens (Sean, 2026-11-09:
-- "create them so that we're ready for when we do launch... one vertical, one horizontal, and... the square one from the vertical").
-- Files in the repo: /communities/next/<slug>/vertical.jpg (1440 x 1920), wide.jpg (1920 x 1080), square.jpg (1200 x 1200, cut from
-- the vertical). Full-size originals in storage: vegan-media/media/communities/next-<slug>/vertical-original.png and wide-original.png.
-- Made in Higgsfield (nano_banana_pro) with the South Florida banner as the style reference; no people, words or logos.
alter table public.ve_next_chapters add column if not exists art jsonb;

update public.ve_next_chapters set art = jsonb_build_object(
  'vertical', '/communities/next/' || slug || '/vertical.jpg',
  'wide',     '/communities/next/' || slug || '/wide.jpg',
  'square',   '/communities/next/' || slug || '/square.jpg',
  'vertical_original', 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/communities/next-' || slug || '/vertical-original.png',
  'wide_original',     'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/communities/next-' || slug || '/wide-original.png',
  'made', '2026-11-09')
where slug in ('oregon','las-vegas','phoenix','houston','north-carolina','austin','dublin','caribbean','new-zealand','japan','seattle','san-francisco');
