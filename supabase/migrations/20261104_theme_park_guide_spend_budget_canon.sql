-- ve-theme-park-guide and ve-spend-budget: concept locked by Sean 2026-11-04 ("lock it").
-- Records only (canon, playbook index, playbook decisions). No schema change: the theme_park venue kind comes with the build.

insert into knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary, body)
values (
 'canon-ve-theme-park-guide',
 'Vegans Explore: the Vegan Theme Park Guide, venue Guide on the stadium engine (LOCKED by Sean 2026-11-04, playbook ve-theme-park-guide)',
 'decisions', 'guides', 'active', 'sar', false, 50,
 array['vegans-explore','guides','theme-parks','venues','points','community-verification'], 1, 'v', 'v',
 'Concept locked by Sean 2026-11-04: "lock it". Nothing built.',
 $j${
 "rule": "One Guide for every theme park, on the venue Guides' engine (ve-venues): a park is a venue, each restaurant a spot with a pin, each dish an item labelled Vegan, Vegan on request or Ask before you order with a source and a last-confirmed date. Reports, first-to-confirm bounties and the 35-day stale rule are reused.",
 "why": "Sean: 'Theme park guide. A growing number of different theme parks, starting with the most popular... put pins where the restaurants are... whatever restaurant they're in, they can do the location thing, put where they are on the map and see the distance.'",
 "name": "The Vegan Theme Park Guide. Park names appear only as plain text, with a not-affiliated line. No park logos or characters anywhere.",
 "price": "$11 or 1,100 points, one Guide covering every park, one park free as the example (Magic Kingdom). The Guide grows after purchase, as the stadium Guide does.",
 "narrator": "River (venue Guides each have their own: River stadiums, Nori airports, Pascal supermarkets). Dani is the alternative since Kids and Family is hers. Lines are text drafts for Sean.",
 "venue_kind": "A new ve_venues kind theme_park on the same engine (the kind check allows only stadium, arena, airport, supermarket today); a resort label (Walt Disney World, Universal Orlando) for browsing only.",
 "map": "Our own schematic, never the park's map art (copyrighted). Parks are outdoors, so GPS works: a you-are-here dot with an accuracy ring and a distance to each restaurant, in feet and miles, as straight line times about 1.3 and labelled about N on foot. Not turn-by-turn. Accuracy drops under canopies and indoors and the page shows it.",
 "radius": "Location-check radius is set per park from the farthest pin plus 100 m (ve_venues.radius_m accepts 50 to 5000), never one default. Rough guesses: Magic Kingdom about 700 m, EPCOT about 1,000 m, until the pins exist.",
 "votes": "Members (Guide owners) vote on restaurants and dishes inside the Guide through ve_guide_votes (new kinds for park spot and park item). They are not Directory listings. Rankings show inside the park only.",
 "menus": "Vegan and Vegan-on-request items only, with a link out to the park's own full menu. Not the full menu: copy risk, stale in weeks, and not what the Vegan visitor needs.",
 "sources": "No crawler on park sites until their terms are checked (not read yet). Meanwhile read published menus and articles one by one; keep item names and the park's own plant-based marker, each with a source link and date. Never copy descriptions or photos. Never inferred. Member reports are the ground truth.",
 "pictures": "Dish pictures come from approved member reports. No generated pictures of named park dishes (it misrepresents the real item; about 2 credits each, about 360 credits a park). Until a real photo, the leaf tile; a first-to-photograph bounty fills them. Our Guides only, in our illustration style, in the Vegans Explore Tee or store clothing.",
 "freshness": "Menus change fast: the existing 35-day stale rule and last-confirmed labels.",
 "parks": "Wave 1 (Central Florida, Tampa Bay is inside the chapter): Magic Kingdom, EPCOT, Animal Kingdom, Hollywood Studios, Universal Studios Florida, Islands of Adventure. Later: SeaWorld, Busch Gardens Tampa, LEGOLAND Florida, then other chapters. Pilot is Magic Kingdom (free park) to prove pin quality before the rest.",
 "google": "Pilot about 95 calls (about 25 searches plus 70 details), about $2.75 at list price. Wave 1 about 570 calls, about $16 at list price. Estimates until the pilot. Runs under canon-ve-spend-budget: a quote that is a ceiling, inside the monthly cap. Real risk: Google may have poor in-park coverage and snap pins to the park centre; OpenStreetMap (free, ODbL attribution) to be tested from an edge function, since the build session cannot reach Overpass.",
 "sponsors": "Not now. The Supermarket rule applies: no approach to a park or third-party restaurant until one is paid.",
 "build_order": ["0. ve-spend-budget step 1 (hard stop, caps, ledger) so the pilot runs under the cap", "1. Migration: theme_park kind, a GUIDES entry in ve-venues, an unpublished ve_guides row, free-park flag", "2. Pilot import for Magic Kingdom, pins checked by eye, a Google quote first", "3. Page copied from guides/stadium-arena-guide.html and guide-scripts/stadium-arena-guide.js plus a GPS park map (new VEParkMap)", "4. Menu sourcing with citations and dates", "5. Reports, bounties and votes on the existing engine", "6. Waves 2 and 3, no further ask while the quote fits the cap", "7. Launch per docs/guides/BUILD-A-GUIDE.md"],
 "template_gate": "Copy guides/stadium-arena-guide.html and guide-scripts/stadium-arena-guide.js; never build from a blank file.",
 "owner_after_lock": "Logan"
 }$j$::jsonb
);

insert into knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary, body)
values (
 'canon-ve-spend-budget',
 'Vegans Explore: a monthly budget for outside costs, quotes that are ceilings, and a weekly report (LOCKED by Sean 2026-11-04, playbook ve-spend-budget)',
 'decisions', 'finance', 'active', 'sar', false, 50,
 array['vegans-explore','costs','google','budget','insights','branddesk'], 1, 'v', 'v',
 'Locked by Sean 2026-11-04. Replaces the Ask-before-a-scan-over-200-calls habit with standing approval inside a cap.',
 $j${
 "rule": "Outside costs have a monthly budget Sean sets, a quote for every scan that is a ceiling, and a weekly report. Sean: 'I don't want to have an open checkbook... I need that certainty. I need a budget for these things.'",
 "google_cap": "$50 a month for Google, a hard stop, from 2026-11-04. Sean raises it when things move faster. Counted at list price (conservative: the free tier of 1,000 searches and 1,000 details a month is unverified, so counting at list stops early, not late). Month to date at 2026-11-04: 258 searches and 147 details, about $14.00 at list.",
 "approval": "Standing approval: Logan runs any Google scan whose quote fits what is left under the cap, without asking, and reports it weekly. A scan that would cross the cap stops and asks. This replaces the 2026-11-01 rule to ask before any scan over about 200 calls.",
 "quote": "Every scan is quoted with a ceiling in calls and list-price dollars and is built to stop at that ceiling in code, so the quote is the maximum, not an estimate.",
 "speed": "The slow part was the daily background caps (40 searches and 40 details), not the budget. Raise them (a start: about 120 and 100), let approved one-time scans run in one night outside the daily cap, keep the monthly cap as the binding stop. Google's own limit is 500 text searches a day across the project.",
 "ledger": "Per paid service: budget, spent, approved but not yet run, left. Nothing runs past left without a new yes. Google is metered today (ve_google_usage, ve_site_settings google_budget; the monthly budget is shown, not enforced, as far as the notes say: verify). Apify ($29 Starter plan plus overage), Higgsfield credits, ElevenLabs, Metricool and Claude reads inside edge functions are unmetered: added to the ledger as Sean gives plan prices or invoices. Google's own bill (Cloud Billing > Reports, Places API) is the real number.",
 "weekly_report": "A snapshot every Sunday 6 PM Eastern, one row a week: spend by job (calls and list-price cost), the week against the week before, month to date against the cap, approved-but-not-yet-run work, and what it brought in (listings added, venues pinned). Emailed to Sean from our own sender (default on, Sean can switch it off).",
 "where": "BrandDesk > a brand > Insights > Web in HQ (lesaruss/lesaruss-hq: components/branddesk/WebRoom.tsx and InsightsRoom.tsx, shared insightsKit tiles, line and tables, /api/branddesk/insights), as a Costs module. Exact placement confirmed when built.",
 "build_order": ["1. Enforce the hard stop, raise the daily caps, add the ledger, update CLAUDE.md's Google costs rule (small; the only step that blocks ve-theme-park-guide)", "2. Weekly snapshot table and the Sunday job", "3. BrandDesk Costs module in HQ plus the Sunday email", "4. Add Apify and Higgsfield usage once Sean gives plan prices"],
 "owner_after_lock": "Logan"
 }$j$::jsonb
);

insert into ve_playbook_index (slug, brand_slug, title, goal, status, stage, next_action, owner, priority)
values
('ve-theme-park-guide','vegans-explore','The Vegan Theme Park Guide',
 'Anyone planning or standing in a theme park finds where the Vegan food is and how far it is, kept accurate by members.',
 'building',
 'Concept locked 2026-11-04 (canon-ve-theme-park-guide). Nothing built. Magic Kingdom is the free park and the pilot; wave 1 is six Central Florida parks.',
 'Logan: after ve-spend-budget step 1, migrate the theme_park venue kind, then run the Magic Kingdom pilot import (about 95 Google calls, about $2.75 at list) and show Sean the pins.',
 'Logan', 3),
('ve-spend-budget','vegans-explore','Outside-cost budget and weekly spend report',
 'Sean always knows what outside services cost: a monthly cap, quotes that are ceilings, and a weekly report in BrandDesk.',
 'building',
 'Locked 2026-11-04 (canon-ve-spend-budget). Google cap $50 a month, hard stop, standing approval inside it. Nothing built; Google is metered, other services are not.',
 'Logan: step 1, enforce the $50 hard stop, raise the daily caps, add the ledger and update the CLAUDE.md Google costs rule. Sean: send plan prices (Apify, Higgsfield, ElevenLabs, Metricool) for the ledger.',
 'Logan', 3);

insert into playbook_records (slug, brand_slug, author, kind, body) values
('ve-theme-park-guide','vegans-explore','Logan','decision',
 've-theme-park-guide: concept locked by Sean 2026-11-04 ("lock it"), after a concept session with V. One Guide for every theme park on the venue Guides'' engine; park = venue, restaurant = spot with a pin, dish = item (Vegan / Vegan on request / Ask before you order, sourced and dated). Own schematic map with GPS you-are-here and distance (straight line x 1.3, labelled), radius set per park. Votes on spots and dishes inside the Guide, not Directory listings. Vegan items only with a link to the full menu. No crawler on park sites until terms are checked; no park logos, characters or generated pictures of named dishes. $11 or 1,100 points, Magic Kingdom free. River narrates. New theme_park kind. No sponsors now. Wave 1: Magic Kingdom, EPCOT, Animal Kingdom, Hollywood Studios, Universal Studios Florida, Islands of Adventure; pilot Magic Kingdom (about 95 Google calls, about $2.75 at list; wave 1 about $16). Canon: canon-ve-theme-park-guide. Nothing built.'),
('ve-theme-park-guide','vegans-explore','Logan','decision',
 've-theme-park-guide: build order. 0 ve-spend-budget step 1; 1 migration (theme_park kind, GUIDES entry, unpublished ve_guides row, free-park flag); 2 Magic Kingdom pilot import; 3 page copied from stadium-arena-guide plus GPS park map; 4 menu sourcing; 5 reports, bounties, votes; 6 waves 2 and 3; 7 launch. Open for later: OpenStreetMap as a free pin source (edge function must test it, ODbL attribution), park terms of use, Dani as narrator instead of River.'),
('ve-spend-budget','vegans-explore','Logan','decision',
 've-spend-budget: locked by Sean 2026-11-04. Google cap $50 a month, a hard stop (list-price basis), raised by Sean when things move faster. Standing approval for any Google scan whose quote (a ceiling, enforced in code) fits what is left; a scan that would cross the cap asks. Replaces the ask-over-200-calls rule. Raise the daily caps for speed. Weekly report every Sunday 6 PM Eastern, emailed and shown as a Costs module in BrandDesk > Insights > Web in HQ. Month to date 2026-11-04: 258 searches + 147 details, about $14.00 at list; real bill is in Google Cloud Billing. Apify, Higgsfield, ElevenLabs, Metricool and Claude reads are unmetered until Sean gives plan prices. Canon: canon-ve-spend-budget.'),
('ve-spend-budget','vegans-explore','Logan','decision',
 've-spend-budget: build order. 1 hard stop + daily caps + ledger + CLAUDE.md rule (blocks ve-theme-park-guide); 2 weekly snapshot table + Sunday job; 3 BrandDesk Costs module (lesaruss-hq WebRoom/InsightsRoom, insightsKit) + Sunday email; 4 add Apify and Higgsfield usage. Check first: is google_budget.monthly_budget_usd enforced anywhere or only displayed.');

insert into brief_checkpoints (brand_slug, station, account, status, summary, next_step, session_label, open_items)
values ('vegans-explore','claude-code-cloud','logan','handed_off',
 've-theme-park-guide: concept locked by Sean 2026-11-04 (canon-ve-theme-park-guide, index row, two playbook records). ve-spend-budget: Google $50 a month hard stop, standing approval inside it, weekly report in BrandDesk Insights > Web (canon-ve-spend-budget, index row, two records). Nothing built; no schema change.',
 've-spend-budget step 1 (hard stop, daily caps, ledger, CLAUDE.md rule), then ve-theme-park-guide migration and the Magic Kingdom pilot.',
 've-theme-park-guide + ve-spend-budget: concept lock 2026-11-04',
 '["ve-spend-budget: Sean sends plan prices for Apify, Higgsfield, ElevenLabs, Metricool","ve-spend-budget: check whether google_budget.monthly_budget_usd is enforced","ve-theme-park-guide: test OpenStreetMap coverage from an edge function; check park terms of use"]'::jsonb);

insert into stream_events (owner, station, session_id, summary, keywords, status)
values ('logan','vegans-explore','ve-theme-park-guide-concept-2026-11-04',
 've-theme-park-guide: concept locked by Sean 2026-11-04; ve-spend-budget: Google $50 a month hard stop with standing approval and a weekly Sunday report in BrandDesk Insights > Web, locked the same session. Canon, index rows and playbook records filed; nothing built.',
 array['ve-theme-park-guide','ve-spend-budget','concept-lock','vegans-explore'],'completed');
