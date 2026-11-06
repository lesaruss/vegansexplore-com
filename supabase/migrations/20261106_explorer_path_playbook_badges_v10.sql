-- ve-explorer-path: Explorer path playbook and badges (Sean, 2026-11-06: "lock it", concept session with V).
-- Adds to canon-ve-door-guides (v9 -> v10, key explorer_badges_v10) and canon-ve-group-partners (v4 -> v5).
-- Builds on explorer_path_v7 (locked the same morning in the ve-outreach chat); where this session's answers
-- differ from v7, v7 stands unless Sean overrides (the review gate is the one open point, see review_gate).
-- Safe to run twice: each update checks that its key is not there yet; inserts check for an existing row.

update knowledge_records
set body = body || jsonb_build_object('explorer_badges_v10', jsonb_build_object(
  'locked', 'Sean, 2026-11-06: "lock it", in the ve-explorer-path concept session with V.',
  'playbook', 've-explorer-path (the Explorer build moves here from ve-outreach)',
  'survey', 'The Explorer survey is the light one; there is no 31-question survey on the path. Deeper questions live in each path Guide''s intake, asked only when someone goes deeper. Explorer gathers enough to reach out with something of value, to suggest paths (even to someone who never picks one) and to suggest Guides. Paths are suggested, never assigned; a badge comes only from finishing that path''s intake.',
  'toughest_thing', 'One optional open question: "What is one of the toughest things you are dealing with on your Vegan journey?" Its answer suggests a Guide (giving up dairy: the Dairy Guide; places to eat: the Directory). A person reads the answers; Claude may group them; a monthly list of what people ask for sits beside the search question queue and feeds new Guides, podcast topics and guests, and social posts. No content is generated from it automatically. Default for its points: 35, taken from "what would make it worth it" (75 to 40), so Explorer still totals 250.',
  'review_gate', 'Open: v7 (locked earlier the same day) admits straight in with the abuse watch as the guard. In this session Sean accepted a person''s review on Explorer before Logan surfaced v7. v7 stands until Sean decides.',
  'badge_look', 'Badges are cut from the Pre-Vegan Certification stamp: a round ring, a mark in the middle, the dashed stamp card. The path name curves over the top and "Vegans Explore" under the bottom, both reading upright. One color per path (option B); Explorer keeps the stamp green. Badges never use the certification''s wording or its Certified pill. Reference mock: https://claude.ai/artifact/QwQRB9sMGVk7GJKB4Whgiz',
  'badge_list', 'Explorer; Registered creator; Registered event host; Registered restaurant owner; Registered nonprofit; Registered business (Pre-Vegan Business Guide); Group leader (once its intake is on ve_surveys); Ambassador (invitation only). Topic Guides earn no badge. A new badge comes only with a new path intake.',
  'display', 'Profile wall: earned (with date), Under review, and paths not started dimmed with Preview this path; Ambassador dimmed shows By invitation. Profile header: a bigger picture, the name to its right, badge pills under it in up to two rows. Directory and People cards: the main badge on the corner of the picture, the others as small seals under the name, each with its name on hover or tap. The main badge is never shown twice. Members set their main badge; until they do it is the path finished most recently. Explorer is never a main badge and never on cards (everyone has it); it shows on the profile wall.',
  'approval', 'Path badges are given on finishing the intake, with a person able to take one back. Ambassador is invitation only. A Restaurant or Nonprofit badge links to a Directory listing only once the claim is approved.',
  'unlocks', 'Each badge opens its path Guide, 250 points (intakes stack, so several badges reach Level 2 sooner), that path''s opportunities and that path''s own bounties. Follow-ups go by badge (a member can stop any path''s emails); a path previewed but not finished gets one nudge, never a series. Opportunities keep their own applications and are never promised. Not now: badge discounts or perks, badge-only events, badge tiers.'
)),
  version = version + 1,
  change_summary = 'v10 (2026-11-06): ve-explorer-path playbook; badge look (certification stamp, a color per path, main badge, Explorer off cards), toughest-thing question and content loop, per-path bounties, listing link after the claim. Review gate open (v7 straight-in stands).',
  updated_by = 'Logan', updated_at = now()
where slug = 'canon-ve-door-guides' and not (body ? 'explorer_badges_v10');

update knowledge_records
set body = body || jsonb_build_object(
  'guest_pass', 'Retired by v5 (Sean, 2026-11-06): with the free Explorer survey there is no barrier left for it to lower. Anyone without a membership takes Explorer and RSVPs as a member. Free events stay free; paid tickets are 5% to us, card processing on the buyer, the host may pass our 5% on. The guest pass checkout and emails stay on until the Explorer door is live, then are switched off.',
  'exclusivity', 'Retired by v5 (Sean, 2026-11-06: "how do we govern that? It might turn people away"): no exclusivity rule. Ticketing is open to any group. The Group leader badge goes to any organizer who finishes the intake. The commission ladder climbs on members brought in; featured status, our ads and preferential bounties go to the groups most active here (default: a monthly ranking per chapter of events held here, tickets sold and members brought in, shown on the group''s own dashboard). Our job is to make using anything else not make sense.',
  'v5_history', 'Before v5: a non-member could attend one free event on a guest pass, then join with the $11; hosting exclusively on Vegans Explore was the condition for the ladder, featured status, ads and bounties.'),
  version = version + 1,
  change_summary = 'v5 (2026-11-06): guest pass retired once the Explorer door is live; no exclusivity rule, perks earned by activity here.',
  updated_by = 'Logan', updated_at = now()
where slug = 'canon-ve-group-partners' and not (body ? 'v5_history');

insert into ve_playbook_index (slug, brand_slug, title, goal, status, stage, next_action, owner, due_on, priority, updated_at)
select 've-explorer-path', 'vegans-explore', 'Explorer path and badges',
  'Everyone comes in through the Explorer path (about 5 minutes), then collects path badges that open each Guide, its opportunities and its bounties.',
  'waiting_on_sean',
  'Locked 2026-11-06 (canon-ve-door-guides v10 on top of v7, group partners v5). v7 step 1 (Explorer re-weight) built. Review gate open.',
  'Sean: Explorer review gate (v7 straight-in, or a person reads it first). Then Logan: v7 build steps 2 to 9 with the v10 badge look, starting with Explorer tagged as the shared questions.',
  'Sean', null, 45, now()
where not exists (select 1 from ve_playbook_index where slug = 've-explorer-path');

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-explorer-path', 'vegans-explore', 'Logan', 'decision', 'text',
  've-explorer-path: Explorer path and badges locked (Sean, 2026-11-06, "lock it", concept session with V). Builds on canon-ve-door-guides v7 (locked that morning in ve-outreach, record 9e75b622) and v8; written as v10, plus canon-ve-group-partners v5. Q1: the Explorer survey is the light one, no 31-question survey on the path, deeper questions in each Guide intake; Explorer suggests paths and Guides; new optional question "toughest thing on your Vegan journey" feeds Guide picks and a monthly content list read by a person (default 35 points from "worth it" 75 to 40). Q2: badges styled on the Pre-Vegan Certification stamp, upright ring text, a color per path, Explorer stamp green; list Explorer, Registered creator, event host, restaurant owner, nonprofit, business, Group leader, Ambassador; main badge set by the member (default most recent), never shown twice, Explorer off cards; hover names. Mock https://claude.ai/artifact/QwQRB9sMGVk7GJKB4Whgiz. Q3: path badges on finishing, take-back by a person; Ambassador by invitation; Restaurant and Nonprofit link to a listing after the claim. OPEN: Explorer review gate. Sean accepted a person''s review here before v7''s straight-in (abuse watch as guard) was surfaced; v7 stands until Sean decides. Q4: each badge opens its Guide, 250 points (stacking), its opportunities and its own bounties; follow-ups by badge; one nudge for a previewed path; no badge perks, events or tiers yet. Group Partners: guest pass retired once Explorer is live; no exclusivity, perks by activity. Filed elsewhere: booth program and event scavenger hunt to ve-events-guide; event delivery and colleges parked in the Blueprint; Elle Jimenez and Vegans in Clermont to ve-outreach. Migration 20261106_explorer_path_playbook_badges_v10.sql.'
where not exists (select 1 from playbook_records where slug = 've-explorer-path' and body like 've-explorer-path: Explorer path and badges locked%');

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-events-guide', 'vegans-explore', 'Logan', 'decision', 'text',
  've-events-guide: booth program and event scavenger hunt (IDEA from Sean, 2026-11-06, ve-explorer-path chat; not locked). Booth: a kit in storage, a chapter Community Manager as keeper paid $150 an event, one person walking every booth to sign vendors up, sponsor giveaways at our table, signing up (Explorer) as part of the giveaway. Scavenger hunt: start and end at our booth, a QR per vendor table scanned in order, each giving a clue to the next; a wrong scan says so, a right one lights the vendor complete; questions about each business; bonus for a purchase; finishing earns the bag and a raffle entry, the winner told in the app and the prize (for example a meal at a vendor) shown on their phone. Logan''s notes: extend ve-hunt (the Passport Challenge: QR stops, stamps, badge, flags); purchase proof by the vendor typing a booth PIN on the member''s phone (the Vault''s PIN pattern); the winner''s contact goes to the vendor only with an unticked yes (partner-window rule). Possible pilot: New Year''s Eve, if we have an event. Needs its own lock.'
where not exists (select 1 from playbook_records where slug = 've-events-guide' and body like 've-events-guide: booth program and event scavenger hunt%');

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-outreach', 'vegans-explore', 'Logan', 'decision', 'text',
  've-outreach: Elle Jimenez and Vegans in Clermont (Sean, 2026-11-06, ve-explorer-path chat). Sean wants to speak with Elle about putting Vegans in Clermont on the platform and working together to make it what she wants, as the first community that makes Vegans Explore its home. Draft a personal message from Sean for his approval; no exclusivity ask (canon-ve-group-partners v5). The Explorer build moved to its own playbook, ve-explorer-path.'
where not exists (select 1 from playbook_records where slug = 've-outreach' and body like 've-outreach: Elle Jimenez and Vegans in Clermont%');

insert into blueprint_ideas (brand_slug, title, detail, source, source_ref, submitted_by, status, suggested_playbook, suggest_reason, suggested_at, sorted_by, sorted_at, reason)
select 'vegans-explore', 'Event food delivery (vegan.express folded in)',
  'Sean, 2026-11-06: restaurants offer delivery through our network of runners at 10% instead of 30% plus delivery; at events (a VegFest) runners work 4-hour shifts paid hourly, the first to accept picks up and delivers to where the person is, no cash, money held for the day and paid out through Stripe Connect, a cap with a wait message when no runners are free. The predecessor to a Vegan delivery app. Needs an event partner and an audience first. Logan: driver pay and employment rules, Connect payouts not yet proven, food handling and live location make it its own playbook.',
  'playbook', 've-explorer-path', 'Logan', 'parked', null,
  'Its own future playbook; parked until an event partner and an audience.', now(), 'Sean', now(), 'Parked by Sean in the ve-explorer-path lock; not for New Year''s Eve.'
where not exists (select 1 from blueprint_ideas where title = 'Event food delivery (vegan.express folded in)');

insert into blueprint_ideas (brand_slug, title, detail, source, source_ref, submitted_by, status, suggested_playbook, suggest_reason, suggested_at, sorted_by, sorted_at, reason)
select 'vegans-explore', 'Colleges',
  'Sean, 2026-11-06: a college side we have not talked about; students may be the most keen to activate. Possibly its own path and badge later (students running campus chapters).',
  'playbook', 've-explorer-path', 'Logan', 'parked', 've-explorer-path',
  'A candidate path and badge once the Explorer path ships.', now(), 'Sean', now(), 'Parked by Sean in the ve-explorer-path lock; revisit after Explorer ships.'
where not exists (select 1 from blueprint_ideas where title = 'Colleges' and brand_slug = 'vegans-explore');

update blueprint_ideas
set status = 'own_playbook', target_playbook = 've-explorer-path', sorted_by = 'Sean', sorted_at = now(),
    reason = 'Locked 2026-11-06 as its own playbook, ve-explorer-path (canon-ve-door-guides v10).', updated_at = now()
where id = '60e6b5f8-a6b2-45c3-b69a-ddbca9a0db44' and coalesce(target_playbook, '') <> 've-explorer-path';

insert into stream_events (timestamp, owner, station, summary, keywords, status, context_link)
select now(), 'Logan', 'vegans-explore', 've-explorer-path: Explorer path and badges locked (canon-ve-door-guides v10, canon-ve-group-partners v5); review gate open for Sean.',
  array['ve-explorer-path','canon','badges'], 'completed', 'https://claude.ai/artifact/QwQRB9sMGVk7GJKB4Whgiz'
where not exists (select 1 from stream_events where summary like 've-explorer-path: Explorer path and badges locked%');

-- Sean, 2026-11-06 (same session): "I agree. Let's go with what you just said." The review gate closes on v7's straight-in.
update knowledge_records
set body = jsonb_set(body, '{explorer_badges_v10,review_gate}', to_jsonb('Decided (Sean, 2026-11-06): v7 stands. Finishing Explorer admits at once, no person check, so the paths page opens in the same sitting; the abuse watch is the guard and voiding, suspending or banning stays Sean''s call. The explorer survey''s reviewed flag is to be turned off when the build reaches v7 step 3.'::text)),
  change_summary = change_summary || ' Review gate decided: v7 straight-in.',
  updated_at = now()
where slug = 'canon-ve-door-guides' and body #>> '{explorer_badges_v10,review_gate}' like 'Open:%';

update ve_playbook_index
set status = 'building', owner = 'Logan',
  stage = 'Locked 2026-11-06 (canon-ve-door-guides v10 on top of v7, group partners v5). v7 step 1 (Explorer re-weight) built. Review gate decided: straight-in.',
  next_action = 'Logan: v7 step 2, tag Explorer''s questions as the shared questions; then step 3 (Welcome ends in Explorer, straight-in admission, reviewed flag off, toughest-thing question added at 35 points). Badge look from the v10 mock at step 6.',
  updated_at = now()
where slug = 've-explorer-path' and status = 'waiting_on_sean';

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-explorer-path', 'vegans-explore', 'Logan', 'decision', 'text',
  've-explorer-path: review gate decided (Sean, 2026-11-06: "I agree. Let''s go with what you just said."). Explorer admits straight in on finishing, as canon v7 says; the abuse watch is the guard. The explorer survey''s reviewed flag comes off at v7 step 3. Playbook status Building, owner Logan, next v7 step 2.'
where not exists (select 1 from playbook_records where slug = 've-explorer-path' and body like 've-explorer-path: review gate decided%');
