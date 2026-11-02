-- Plant Based in the Burbz on YouTube (Sean, 2026-11-02: "let's put their YouTube channel on their page and then add them to the
-- YouTube channel as well. So that way there's something going on their page"). The channel (@plantbasedintheburbz,
-- UCAVWcSJuljtLinsZMWZ3Nfw, read through ve-youtube resolve: 3 videos, the latest 2023-11-30) becomes a YouTube listing, and the
-- show's profile, the channel and Paige Parsons Roache share the family plantbased-in-the-burbs, so each page has the others as tabs
-- (loadFamily). The show's profile gets its YouTube and Instagram. Idempotent.
insert into public.listings (name, slug, category, specialty, description, status, website, location, initials, crawl_source, communities,
  vegan_status, youtube, instagram, logo_url, details)
select 'Plant Based in the Burbz (YouTube)', 'plantbased-in-the-burbz-youtube', 'YouTube', '',
  'Sherri Johnson and Paige Parsons Roache''s channel: Let''s Chat interviews with people in the Vegan movement, like Gwenna Hunter of Vegans of LA and its Vegan food bank, and plant-based cooking, from oyster mushrooms to taco bites on stage at SoCal VegFest.',
  'approved', '', 'Online', 'P', 'youtube', array['all'], null, 'https://www.youtube.com/@plantbasedintheburbz', '@plantbasedintheburbz',
  'https://yt3.ggpht.com/LCuJJdzjwchmoc2yKqJHLNuA1ELA_JzkYAL8Nkwq9mJW126TAAfst2nz08RF1GTSA6z_LTxF=s800-c-k-c0x00ffffff-no-rj',
  jsonb_build_object('youtube_channel_id', 'UCAVWcSJuljtLinsZMWZ3Nfw', 'logo_source', 'admin', 'youtube_added', '2026-11-02', 'family', 'plantbased-in-the-burbs')
where not exists (select 1 from public.listings where slug = 'plantbased-in-the-burbz-youtube');

update public.listings set youtube = 'https://www.youtube.com/@plantbasedintheburbz', instagram = coalesce(nullif(instagram, ''), '@plantbasedintheburbz'),
  details = details || jsonb_build_object('family', 'plantbased-in-the-burbs'), updated_at = now()
where slug = 'plantbased-in-the-burbs';

update public.listings set youtube = 'https://www.youtube.com/@plantbasedintheburbz',
  details = details || jsonb_build_object('family', 'plantbased-in-the-burbs'), updated_at = now()
where slug = 'paige-parsons-roache';
