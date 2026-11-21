-- 2026-11-21, Sean: "go ahead, schedule the reel". An's Spotlight reel (reel-v4, locked 2026-11-19) as a Vegans Explore reel slot, Tue Nov 24,
-- 12:00 PM Eastern, Instagram and Facebook, with the caption Sean approved on her featured page. Approved as Sean through ve-social, which
-- pushed it to Metricool (post 436792013). If An says yes on her page, her handle is added as a collaborator before it posts. Safe to run twice.
insert into ve_links (code, label, destination, initiative_slug, tags, channel, active)
select 'spotlight-an-reel', 'Spotlight reel: An, Sen Saigon (Ep 147)', 'https://vegansexplore.com/directory/sen-saigon', 'podcast-spotlight', array['podcast-spotlight','ep147','sen-saigon','reel'], 'social', true
where not exists (select 1 from ve_links where code='spotlight-an-reel');

insert into ve_social_slots (brand_slug, slot_at, channels, kind, title, caption, links, assets, status, manual_steps, batch, proposed_by)
select 'vegans-explore', '2026-11-24 17:00:00+00', array['instagram','facebook'], 'reel', 'Spotlight: An of Sen Saigon (Ep 147)',
$c$No Vegan pho in New York? An opened her own.

An grew up in Vietnam. When she went Vegan, she couldn't find the food she grew up on anywhere in the city, so she made it herself. Today Sen Saigon is a fully Vegan Vietnamese restaurant on East Broadway in the Lower East Side.

Hear An's story on episode 147 of the Vegans Explore Podcast, and find Sen Saigon in the Vegans Explore Directory. Link in bio.

#VegansExplore #VeganNYC #VeganVietnamese #VeganPho #LowerEastSide #NYCVegan #VeganFood$c$,
  array['https://vegansexplore.com/go/spotlight-an-reel'],
  jsonb_build_array(
    jsonb_build_object('type','video','w',1080,'h',1920,'url','https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/podcast/spotlight/an-sen-saigon/reel-v4.mp4'),
    jsonb_build_object('type','cover','w',1080,'h',1920,'url','https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/podcast/spotlight/an-sen-saigon/cover-v1.jpg')),
  'proposed',
  'Podcast Spotlight reel (locked by Sean 2026-11-19); caption approved with An''s featured page (locked 2026-11-21). The time matches what her page and Monday''s email promise. The reel carries its own audio: leave the Instagram song empty. If An says yes on her page, add her handle as a collaborator before it posts (ve_featured_pages.collab_handle for sen-saigon-e509ca).',
  'podcast-spotlight', 'Logan'
where not exists (select 1 from ve_social_slots where title='Spotlight: An of Sen Saigon (Ep 147)');
-- Then: ve-social { action: 'approve', id, as_member: Sean } -> status scheduled, metricool_post_id 436792013.
