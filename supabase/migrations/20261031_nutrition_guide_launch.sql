-- The Nutrition Guide launches (Sean, 2026-10-31: "lines are good, launch the Nutrition Guide"). The page is indexed, its card is in
-- the Guide catalog (label Nutrition, after the Airport Guide), it is the Guide tab on Nutrition & Supplements, Physicians and Health
-- Experts listings (in place of the Dairy Guide), and it is in the sitemap. The ve_guides row was published at build; this keeps it
-- so. Safe to run twice.
update public.ve_guides set published = true where slug = 'nutrition-guide' and published is distinct from true;
insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-nutrition-guide','vegans-explore','Logan','decision','text',$v$Launched 2026-10-31 (Sean: "lines are good, launch the Nutrition Guide"). Banner public/guides/nutrition-guide.jpg (Theo in a sunlit kitchen in the black tee with a Vegan plate and an unlabeled supplement bottle: the Guide in a scene, not on white; Higgsfield, picked by Sean (C) before it went in. Plus its animated card in ads/guides/guide.html, campaign 0c0de5a14007, /go/ve-guide-nutrition, four hub slots taken from the Dairy Guide); its card in the Guide catalog (label Nutrition, B12 free); 'nutrition-guide' in GUIDES of public/ve-guide-tab.js, so Nutrition & Supplements, Physicians and Health Experts listings show it on their Guide tab; noindex off and og:image the banner; in the sitemap. $11 or 1,100 points. Still open: Theo's lines are text (no recordings).$v$
where not exists (select 1 from playbook_records where slug='ve-nutrition-guide' and author='Logan' and body like 'Launched 2026-10-31%');
insert into stream_events (owner, station, summary, keywords, status, context_link)
select 'logan','vegans-explore','VEGANS EXPLORE: Nutrition Guide launched (/guides/nutrition-guide indexed, card in the Guide catalog, Guide tab on Nutrition & Supplements, Physicians and Health Experts listings, sitemap).', array['vegans-explore','nutrition','guides','launch'], 'completed', 've-nutrition-guide-launched'
where not exists (select 1 from stream_events where context_link='ve-nutrition-guide-launched');
