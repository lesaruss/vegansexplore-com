-- The Vegan Restaurant Guide's address is /guides/vegan-restaurant-guide (Sean, 2026-10-31: "let's use this opportunity to change
-- the URL because we haven't really sold anything yet... it really shouldn't be referenced anywhere. And anywhere that it is referenced,
-- take the time and fix it"). The only purchase is Sean's own (July, points) and is tied to the Guide's id, so nothing breaks.
-- The old address redirects (vercel.json); the page and script files were renamed. The banner was copied to
-- vegan-media/media/guides/banners/vegan-restaurant-guide.jpg (the old file stays for anything outside our reach).
-- Left as history: mock_pages and uke_index (the retired mock surface), brief_checkpoints, ve_archive_raw_content, the archived
-- briefing stage-ve-guides-1007, ve_analytics_cache (it refreshes) and earlier migrations.
update public.ve_guides set slug = 'vegan-restaurant-guide' where slug = 'vegan-restaurant-survival-guide';
update public.ve_links set destination = replace(destination, 'vegan-restaurant-survival-guide', 'vegan-restaurant-guide'),
  tags = array_replace(tags, 'vegan-restaurant-survival-guide', 'vegan-restaurant-guide') where code = 've-guide-restaurant';
update public.ad_campaigns set creative_url = replace(creative_url, 'vegan-restaurant-survival-guide', 'vegan-restaurant-guide')
  where creative_url like '%vegan-restaurant-survival-guide%';
update public.ve_dashboard_cards set cta_url = replace(cta_url, 'vegan-restaurant-survival-guide', 'vegan-restaurant-guide')
  where cta_url like '%vegan-restaurant-survival-guide%';
update public.playbook_records set body = replace(replace(body, 'vegan-restaurant-survival-guide', 'vegan-restaurant-guide'), 'Vegan Restaurant Survival Guide', 'Vegan Restaurant Guide')
  where body like '%vegan-restaurant-survival-guide%';
update public.briefings set content = replace(replace(content, 'vegan-restaurant-survival-guide', 'vegan-restaurant-guide'), 'Vegan Restaurant Survival Guide', 'Vegan Restaurant Guide')
  where slug = 'vegans-explore-guides' and content like '%vegan-restaurant-survival-guide%';
update public.vault_content set slug = 'vegan-restaurant-guide', title = 'Vegan Restaurant Guide' where slug = 'vegan-restaurant-survival-guide';
