-- The Guide tab on every listing is built and live (Sean, 2026-10-31: "hand it to Logan, build it"; merged to main the same day).
-- Canon canon-ve-listing-guide-tab to v2 with what was built; a build record row in the playbook ve-listing-guide-tab; and the one
-- tracking row left from proving ve_promo_track (visitor logan-test-gt-0001) removed. Safe to run twice.
update public.knowledge_records
set version = 2, updated_by = 'logan', updated_at = now(),
    change_summary = 'Built and live 2026-10-31 (Logan): public/ve-guide-tab.js, loadGuideTab in directory/listing.html.',
    body = body || jsonb_build_object(
      'status', 'Built and live 2026-10-31, merged to main and checked on the live site (restaurant, nonprofit, group, creator).',
      'built', 'public/ve-guide-tab.js: VEGuideTab.pick and mount, GUIDES and MAP in that file. loadGuideTab in directory/listing.html loads it after the page shows, adds the tab before Partner Dashboard, then draws the right column banner without the tab''s Guide. Not on LESARUSS.ai. Ownership from ve-guide-unlock status. A main category with no Guide reads the extra categories (Brooke Sellers, Athletes and Content Creators, gets the Creator Guide). ?tab=guide opens it.',
      'tracking_built', 've_promo_events, promo gt-<guide slug>, steps view and click, cta tab, with the listing; read with ve_promo_funnel. No Depot view yet.')
where slug = 'canon-ve-listing-guide-tab' and version < 2;

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-listing-guide-tab', 'vegans-explore', 'Logan',
  'BUILD RECORD, 2026-10-31 (Logan). Built and live, merged to main. public/ve-guide-tab.js (VEGuideTab.pick, VEGuideTab.mount; GUIDES and MAP are the one table, a new Guide is one row) draws a short squeeze page in a tab named for the Guide, before Partner Dashboard, for everyone: banner, one line, what is inside, price or Free, Open the Guide in the same window; owners of the Guide (ve-guide-unlock status) see In your Guides and Open your Guide. A food place''s owner and super admins also get the Vegan Restaurant Guide card. loadGuideTab in directory/listing.html loads it after the page shows, then draws the right column house banner, which never repeats the tab''s Guide. Not on LESARUSS.ai; a demo shows it without counting. Views and clicks: ve_promo_events promo gt-<guide slug>, cta tab, per listing. Checked live on Love Life Cafe, Be An Animal Hero, Vegan Club RVA and Keegan Kuhn. Not yet: a Depot view of the tab''s numbers, and the Nutrition Guide (Nutrition, physicians and health experts show the Dairy Guide until it exists).',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-listing-guide-tab' and body like 'BUILD RECORD, 2026-10-31%');

delete from public.ve_promo_events where visitor = 'logan-test-gt-0001';
