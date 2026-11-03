-- ve-guides: the Guides playbook (Sean, 2026-11-03: "we don't have a new playbook for every single guide... we focus on one,
-- and then we go from there."). One playbook for every Guide, the Nutrition Guide under it. Safe to run twice.
insert into ve_playbook_index (slug, brand_slug, title, goal, status, stage, next_action, owner, due_on, priority)
select 've-guides', 'vegans-explore', 'Guides',
 $b$Every Vegans Explore Guide is built, launched and kept current from one place, one Guide at a time, from one recipe.$b$,
 'building',
 $b$Created 2026-11-03. Live Guides: Dairy, Vegan Restaurant, Stadium and Arena, Airport, Nonprofit, Creator, Nutrition and Events. Sixteen Coming soon cards wait in the queue (the Supermarket Guide is built and parked). No Guide is pinned yet.$b$,
 $b$Logan reads the other playbooks and brings Sean a recommendation on which fold into ve-guides; nothing is folded until Sean says.$b$,
 'Logan', null, 5
where not exists (select 1 from ve_playbook_index where slug = 've-guides');

update ve_playbook_index set status = 'done', owner = 'Logan',
 stage = $b$Launched 2026-10-31. Folded into ve-guides as a task 2026-11-03.$b$,
 next_action = $b$None. Sean's two open calls (record Theo's lines, his hearing aid) are in the ve-guides queue.$b$,
 updated_at = now()
where slug = 've-nutrition-guide' and stage not like '%Folded into ve-guides%';

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-guides', 'vegans-explore', 'Logan', 'decision', 'text',
$b$ve-guides: the Guides playbook, how it works (created 2026-11-03).

Sean, 2026-11-03: "we don't have a new playbook for every single guide... as long as I manage the context, we can keep that link open, knowing that we're not going to have three guides working at the same time. We focus on one, and then we go from there." At wrap up: create ve-guides, put the Nutrition Guide under it, and make one task a look at the other playbooks to see what can fold in.

Sean first proposed putting this in ve-pathways. Logan recommended a separate playbook: Pathways is about people and campaigns and has its own next action (Sean picks the first campaign), and the Guide work waits on that foundation, so one playbook cannot be both the blocker and the container. Sean agreed.

HOW IT WORKS
- One playbook for every Guide. A new Guide idea is a queue item here, never a new playbook.
- One Guide pinned at a time. A second Guide's open items go back to the queue.
- Each Guide is one decision record named "ve-guides: <Guide>". A folded playbook keeps its own records as history.
- The recipe is docs/guides/BUILD-A-GUIDE.md plus the launch steps in the Nutrition record (queue item 3 brings the recipe up to date).
- Guides feed the Pathways, not the other way round. Door Guides (ve-door-guides) is where the two meet.
- The Coming soon Guides wait for the functional work (the ve-pathways foundation). Queue item 4 names the gate.
- A Guide is bigger than a tweak, so it never goes in ve-feedback.

THE QUEUE, in order
1. Logan: read the other playbooks and bring Sean a recommendation on which fold into ve-guides (candidates: ve-events-guide, ve-door-guides, ve-supermarket-guide, ve-venue-guides, the Guide parts of ve-nonprofit-partners; ve-nutrition-guide is already folded). Fold nothing until Sean says. A fold sets the old row to Done ("Folded into ve-guides") and moves its open items here. Known drift: the ve-events-guide row says "Built, not launched" but the Guide is live (indexed, in the sitemap), so fix its row when it folds.
2. Sean: the two Nutrition Guide calls (see "ve-guides: Nutrition Guide").
3. Logan: bring docs/guides/BUILD-A-GUIDE.md up to date. It still says $11 or 1 Guide credit (access_rule 'credit'; credits are retired, a Guide is $11 or 1,100 points) and a white-background banner (the rule since 2026-11-01 is the Guide in a scene). Add the door Guide survey gate and the launch steps from the Nutrition record.
4. Sean and Logan: name the gate, what "functional work done" means before the Coming soon Guides start. Logan proposes it after item 1.
5. Logan: the Coming soon Guides, one at a time, in the order of their Notify me sign-ups (member_interest, guide-waitlist-<slug>): vegan-meat-alternatives, entrepreneur, prevegan, seasonedvegan, supermarket-guide (built, parked until a supermarket sponsors), vegan-on-a-budget, meal-prep, eating-out, kids-and-family, vegan-athlete, vegan-baking, vegan-holidays, vegan-pets, beauty-and-fashion, vegan-dating, vegan-abroad.$b$
where not exists (select 1 from playbook_records where slug = 've-guides' and body like 've-guides: the Guides playbook, how it works%');

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-guides', 'vegans-explore', 'Logan', 'decision', 'text',
$b$ve-guides: Nutrition Guide (under this playbook; its history stays under ve-nutrition-guide).

STATE: Launched and live 2026-10-31, checked again 2026-11-03 (the page, the card on /guides, the Guide tab on Physicians, Health Experts and Nutrition & Supplements listings, the animated ad card in four slots). Banner: Theo in a sunlit kitchen, the scene style. On main as 3948553.

OPEN
1. Sean: record Theo's lines in his voice (aFyw0oiXW7dzKF4o7woX, approved 2026-10-30)? They are text only today, like River, Nori and Dani. If yes: el-media tts two at a time, check each with stt, spell "Veegan", then CLIPS in guide-scripts/nutrition-guide.js.
2. Sean: does Theo wear his hearing aid? His older portrait (public/guides/theo.jpg) has one on his left ear; his roster profile description does not list it and none of the launch art draws it. If yes, redo the banner and the market scene with it.
3. Logan: the banner file is 800 x 500; the 2026-11-01 rule is 1200 x 750, JPEG quality 82. The source is vegan-media/media/communities/nutrition-guide-scene-c.png (2752 wide). Recrop it, then bump ?v= on its references (the catalog card, GUIDES in public/ve-guide-tab.js, the ad's first scene in ads/guides/guide.html).

THE LAUNCH STEPS THAT WORKED (for the recipe)
1. Banner public/guides/<slug>.jpg, the Guide in a scene. 2. Catalog card in public/ve-guide-catalog.js. 3. The Guide in GUIDES of public/ve-guide-tab.js (its categories are in MAP there). 4. The page: noindex off, og:image the banner. 5. api/sitemap.js GUIDES. 6. The animated ad card: a G entry in ads/guides/guide.html, scenes in public/guides/<name>/, an ad_campaigns row under the ve-house-banners sponsor, its ve_links /go/ link and ad_campaign_placements for the slots it takes. 7. A launch migration (playbook row, stream_events). 8. CLAUDE.md, then merge and check live: the page, the card, a listing's Guide tab, the ad in a slot. The build session cannot reach Higgsfield's image host: copy results into our storage with ve-off-lookup save, called from the database through pg_net so the admin token stays server side.$b$
where not exists (select 1 from playbook_records where slug = 've-guides' and body like 've-guides: Nutrition Guide%');

insert into knowledge_records (slug, title, category, subcategory, body, owner, tags, created_by, updated_by, change_summary)
select 'canon-ve-guides-playbook',
 $b$Vegans Explore Guides: one playbook (ve-guides), one Guide at a time (Sean, 2026-11-03)$b$,
 'decisions', 'playbooks',
 $j${"rule": "One playbook, ve-guides, holds every Vegans Explore Guide. One Guide is pinned at a time. A new Guide idea is a queue item, never a new playbook.",
 "why": "Sean, 2026-11-03: 'we don't have a new playbook for every single guide... we focus on one, and then we go from there.'",
 "how": ["Each Guide is one decision record named 've-guides: <Guide>'", "A second Guide's open items return to the queue", "The Coming soon Guides wait for the ve-pathways foundation; the gate is named in the playbook queue", "Queue order is the Notify me sign-ups (member_interest, guide-waitlist-<slug>)", "Guides feed the Pathways; ve-door-guides is where the two meet", "A Guide is bigger than a tweak, so it never goes in ve-feedback"],
 "playbook": "ve-guides",
 "recipe": "docs/guides/BUILD-A-GUIDE.md"}$j$::jsonb,
 (select owner from knowledge_records where slug = 'canon-wrap-up-standard'),
 array['vegans-explore', 'guides', 'playbook'], 'logan', 'logan', 'Created 2026-11-03'
where not exists (select 1 from knowledge_records where slug = 'canon-ve-guides-playbook');

insert into brief_checkpoints (brand_slug, station, account, status, summary, files_touched, next_step, session_label, open_items, handoff_url)
select 'vegans-explore', 'cloud', 'logan', 'handed_off',
 $b$ve-guides: the Guides playbook created (index row, two records, canon), the Nutrition Guide folded under it. The Nutrition Guide is live and verified; its two open calls (record Theo's lines, his hearing aid) and a banner recrop are in the queue. On branch claude/hopeful-gauss-3dtyd3; the handoff doc is not merged to main.$b$,
 $j$["docs/handoff/2026-11-03-ve-guides.md", "CLAUDE.md", "supabase/migrations/20261103_ve_guides_playbook.sql", "ve_playbook_index (ve-guides added, ve-nutrition-guide folded)", "playbook_records ve-guides (2 rows)", "knowledge_records canon-ve-guides-playbook"]$j$::jsonb,
 $b$Logan reads the other playbooks and brings Sean a recommendation on which fold into ve-guides; nothing folds until Sean says.$b$,
 've-guides-playbook-2026-11-03',
 $j$["ve-guides: fold-review recommendation to Sean", "ve-guides: Sean's two Nutrition calls (record Theo's lines, his hearing aid)", "ve-guides: recrop the Nutrition banner to 1200 x 750", "ve-guides: bring BUILD-A-GUIDE.md up to date", "ve-guides: name the gate with Sean", "ve-guides: merge the branch to main (Sean says when)"]$j$::jsonb,
 'https://github.com/lesaruss/vegansexplore-com/blob/claude/hopeful-gauss-3dtyd3/docs/handoff/2026-11-03-ve-guides.md'
where not exists (select 1 from brief_checkpoints where session_label = 've-guides-playbook-2026-11-03');

insert into stream_events (owner, station, summary, keywords, status, context_link)
select 'logan', 'vegans-explore', $b$VEGANS EXPLORE: ve-guides: playbook created. One playbook for every Guide, one pinned at a time; the Nutrition Guide is folded under it; the first task is the fold review of the other playbooks.$b$, array['vegans-explore', 'guides', 'playbook', 'wrap-up'], 'completed', 've-guides-playbook-created-2026-11-03'
where not exists (select 1 from stream_events where context_link = 've-guides-playbook-created-2026-11-03');
