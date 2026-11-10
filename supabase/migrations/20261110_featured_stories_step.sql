-- ve-holiday-guide: step 1 of Featured in the Holiday Guide is written: 42 story frames (scripts/featured-stories/render.js), one per
-- featured place with Instagram or a name to search, in vegan-media/media/holiday/featured-stories/ (one zip, each file named for the
-- place's listing slug). Safe to run twice.
update public.ve_campaign_program_steps set status = 'draft',
  body = 'Post one story per place and tag them (their handle is on the frame). Download all 42: https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/holiday/featured-stories/holiday-guide-featured-stories-v1.zip (each file is named for the place). Add a link sticker to vegansexplore.com/guides/holiday-guide. Saie, Finchberry and Conscious Step show their name only: search them when you tag. Post the tag before the DM, so the DM lands warm.'
where program_slug = 'gift-guide-2026' and n = 1;

-- The stories' link sticker is a tracked link (CLAUDE.md, Tracked links).
insert into ve_links (code, destination, initiative_slug, tags, channel) values ('hg-stories', 'https://vegansexplore.com/guides/holiday-guide', 'gift-guide-2026', array['gift-guide-2026','holiday-guide','instagram-story'], 'social') on conflict (code) do nothing;
update ve_campaign_program_steps set body = replace(body, 'Add a link sticker to vegansexplore.com/guides/holiday-guide.', 'Add a link sticker to vegansexplore.com/go/hg-stories (the Holiday Guide, tracked).') where program_slug = 'gift-guide-2026' and n = 1;
