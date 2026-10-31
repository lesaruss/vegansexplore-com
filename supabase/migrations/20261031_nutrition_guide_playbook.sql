-- The Nutrition Guide playbook (ve-nutrition-guide): the build record and the launch steps left, 2026-10-31.
insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-nutrition-guide', 'vegans-explore', 'Logan', 'decision', 'text',
$b$BUILD RECORD, 2026-10-31 (Logan). Sean: "build the Nutrition Guide", then "lines are good, launch the Nutrition Guide" (Theo's lines approved). BUILT, NOT LAUNCHED YET.

WHAT IS BUILT (merged to main, commits bb71780 and 79421bb):
- guides/nutrition-guide.html and guide-scripts/nutrition-guide.js, the Nonprofit Guide's shell. Theo narrates on the right (text lines, no recordings). noindex, off the catalog.
- Tabs: Overview; Nutrients one per view (#/nutrients/<id>: B12, protein, iron, calcium, vitamin D, omega-3s, iodine, zinc; why it matters, how much by who, where to get it, supplements, Theo's tip, This week kept in nt_checks, sources, an episode); B12 is the free example; Your plate (Harvard's Healthy Eating Plate made Vegan); Supplements (Directory's Nutrition & Supplements brands open, the buying checklist for members); Experts (People > Physicians and Health Experts, Services > Health Professionals by chapter); Pulse (16 episodes in PULSE_PICKS played in place); My list (ve-cookbook fix, episode, listing); Get access.
- Every number checked against the NIH Office of Dietary Supplements, The Vegan Society, Harvard's Nutrition Source and the Academy of Nutrition and Dietetics' position paper. Not medical advice line on every page.
- Members' content (seven nutrients, the plate, the supplement checklist) is ve_guides.content_html (<script id="nt-data">), never in the repo. Public part is #nt-public in the page.
- ve_guides row nutrition-guide: published, $11 or 1,100 points, sort 8; Sean holds a comp copy (migration 20261031_nutrition_guide.sql). ve-cookbook GUIDES includes nutrition-guide (deployed from bb71780).

LAUNCH STEPS LEFT (in order):
1. Banner public/guides/nutrition-guide.jpg: Higgsfield nano_banana_pro from Theo's square art (VE_GUIDE_ART.theo in public/footer.js), the locked banner style: 800 x 500, white background, Theo alone, waist up, Vegans Explore tee, smiling, holding what the Guide is about (a plate of greens and beans, a B12 bottle with no words), every finger in frame, no words. JPEG about 80, under 150 KB.
2. Catalog card in public/ve-guide-catalog.js (after the Nonprofit Guide; label Nutrition, tag New, banner, href /guides/nutrition-guide, see all).
3. Guide tab: add 'nutrition-guide' to GUIDES in public/ve-guide-tab.js (tab 'Nutrition Guide', guide 'Theo', paid true, href, banner). MAP already names it for Nutrition & Supplements, Physicians and Health Experts and falls back to Dairy until it is in GUIDES.
4. guides/nutrition-guide.html: remove noindex, og:image to the banner.
5. api/sitemap.js GUIDES: add 'nutrition-guide'.
6. Launch migration 20261031_nutrition_guide_launch.sql (like 20261029_nonprofit_guide_launch.sql): a playbook row "Launched" here and a stream_events row. Run through the once-function if the connector holds it.
7. CLAUDE.md: The Nutrition Guide section to Launched.
8. Commit as Sean A. Russell <contact@lesaruss.com>, merge to main, verify live: the page indexed, the card on /guides, a Physicians listing's Guide tab showing the Nutrition Guide, the right column's house banner not repeating it.$b$
where not exists (select 1 from playbook_records where slug='ve-nutrition-guide' and body like 'BUILD RECORD, 2026-10-31%');
