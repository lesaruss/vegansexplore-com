-- House ads on the brand kit's ad template (Sean, 2026-11-11: "Fix the banners"). Applied 2026-11-11.
--
-- The Humble Cabbage still images in the second 300 x 250 of each chapter pair (ad-assets seed/humble-cabbage/300x250-*.jpg) have
-- Shop now, the Humble Cabbage tag and River's speech box baked on top of the art, and Dani's and Pascal's heads cut by the top edge.
-- They break the hard block (no words on a picture, no face cut). Each campaign moves to the HTML5 ad /ads/humble-cabbage/ve-tee.html,
-- rebuilt on the kit's template (words in the peach block, each person whole in a white frame of their picture's own shape, the logo
-- and Shop now in the white bar), with ?c= picking who opens it. There is no clean drawing of June or Dani in the tee, so their slots
-- open on another person until one is drawn. The tracked /go/ links (click_through_url) are unchanged.
--
-- The Guide rail campaigns (ads/guides/guide.html?g=...) keep their creative_url: the file itself was rebuilt on the template.
-- Safe to run twice: each update matches the old image, so a second run changes nothing.

with plan(id, old_image, creative) as (values
  -- seed image                                                                 new creative
  ('f57a1fb6-c8f9-44b1-a4e5-a8bd07de56a3'::uuid, '300x250-river.jpg',           'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=river'),  -- New York
  ('83f733a2-e116-4cab-b9d7-5722336f4a04'::uuid, '300x250-river.jpg',           'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=river'),  -- Directory all cities, Supermarket Guide
  ('b2b018e8-8889-4ec1-b187-26fc065f2b54'::uuid, '300x250-river.jpg',           'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=river'),  -- Virginia
  ('ea13d6ec-7d1d-469c-9e22-0f4133f9be98'::uuid, '300x250-maya.jpg',            'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=maya'),   -- Atlanta
  ('c149b057-00e4-4918-a3af-53de0d246ae7'::uuid, '300x250-maya.jpg',            'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=maya'),   -- Delaware
  ('88514f06-69ba-4bb3-80f8-56ffa398dc56'::uuid, '300x250-nori.jpg',            'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=nori'),   -- South Florida
  ('dc8d7e57-d64a-4fc6-a609-39ad21e8d70a'::uuid, '300x250-nori.jpg',            'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=nori'),   -- North Florida
  ('4733f62e-489d-48e2-a449-7170267d445b'::uuid, '300x250-nori.jpg',            'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=nori'),   -- London
  ('a64c92cc-ce64-47a1-b34e-ecb869e6fcc4'::uuid, '300x250-pascal.jpg',          'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=pascal'), -- Maryland
  ('5ac7dce5-c566-446c-8313-932161f75fbf'::uuid, '300x250-duo-maya-nori.jpg',   'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=maya'),   -- Los Angeles (Maya, then Nori)
  ('8fb3cf74-6fe3-4666-ac14-3bb2bf5cace7'::uuid, '300x250-duo-pascal-june.jpg', 'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=pascal'), -- Washington DC (no June drawing)
  ('67e325d6-08cc-4d6b-97a8-4ed5b9ad5daa'::uuid, '300x250-dani.jpg',            'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=pascal'), -- Central Florida (no Dani drawing)
  ('ed2598c2-9002-4714-9da2-01b898f7f1be'::uuid, '300x250-june.jpg',            'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=river'),  -- West Virginia (no June drawing)
  ('26c70b14-510d-4f8f-9fe0-eb32d32dca1f'::uuid, '300x250-june.jpg',            'https://vegansexplore.com/ads/humble-cabbage/ve-tee.html?c=maya')    -- Philadelphia (no June drawing)
)
update ad_campaigns c
set creative_url = p.creative,
    notes = concat_ws(E'\n', nullif(c.notes, ''), '2026-11-11: moved from the still ' || p.old_image || ' (words and buttons baked on the art) to the kit-template HTML5 ad.')
from plan p
where c.id = p.id
  and c.creative_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/ad-assets/seed/humble-cabbage/' || p.old_image;

-- The stills stay in storage and in ad_assets for their history, set aside so nobody picks them again.
update ad_assets
set status = 'archived'
where storage_path like 'seed/humble-cabbage/300x%'
  and status = 'active';

-- Check (read only): every active campaign that still serves a still image from the seed folder. Expect no rows.
-- select id, campaign_name, creative_url from ad_campaigns
--  where status = 'active' and creative_url like '%/ad-assets/seed/humble-cabbage/%';
