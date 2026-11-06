-- ve-outreach: Explorer path and badges, LOCKED by Sean 2026-11-06 ("lock it").
-- canon-ve-door-guides v7 (key explorer_path_v7), a new canon canon-ve-voice-hero-guide,
-- the playbook record and the ve_playbook_index row. Nothing is built by this file; the build is queued.
-- Safe to run twice.

update knowledge_records
set version = 7,
    body = body || jsonb_build_object('explorer_path_v7', jsonb_build_object(
      'locked', 'Sean, 2026-11-06: "lock it", in the ve-outreach chat, after Logan restated the idea (record 5f3ce432) and Sean''s two rounds of answers.',
      'everyone', 'Explorer is everyone''s door and everyone''s path. Part 1: the Welcome tour (about 3 minutes) plus the short Explorer survey (about 2 minutes), about 5 minutes in all. Finishing it makes them a member and gives the Explorer badge. It replaces the 31-question profile survey and its person-review gate as the free door; the 31 questions become Build your profile, filled in over time and paid per answer as now.',
      'straight_in', 'Finishing Explorer admits them at once (no person check), so the next page can open. The abuse watch (canon-ve-abuse-watch: fast surveys, referral bursts, shared browsers) is the guard; voiding, suspending or banning stays Sean''s call. Replaces v6''s "a person checks it before it admits".',
      'paths_page', 'The page after Explorer lists every path as a card to preview and start: Creator, Restaurant, Event host, Nonprofit, Business (the Pre-Vegan Business Guide), and Group leader once its intake exists. The answer to "Do you run any of these?" orders the cards; it never hides one. People pick their own paths and can take several; we never pick a path for them.',
      'part_2', 'The path Guides are part 2. Their intakes and Overviews are about the path only; what Vegans Explore is was covered by Explorer. A path Guide opens only after Explorer. The Guide catalog shows a path as locked to anyone without the Explorer badge ("Starts after Explorer") and nothing links them straight in. If someone reaches a path Guide anyway, Explorer opens inside that Guide as its first step and they carry on there, never sent away. With the badge, that first step shows as done ("You''ve got your Explorer badge, so you''re in. Now let''s talk about what you''re building as a creator.") and they go straight to the path''s intake. Lines are drafts for Sean.',
      'core_questions', 'Explorer''s questions are the shared questions (ve_shared_questions, v6 step 3): tagged with shared keys so every path intake starts after them.',
      'points', 'Every survey totals 250 points for answering everything. Required questions are few and worth less; optional and open questions are worth more, weighted by how useful the answer is to us, so leaving questions out earns less. Explorer: chapter 15, Vegan journey 15, Do you run any of these 20 (required, 50); what brings you 30, what you want more of 35, how to hear from us 15, a place, person or group to add 45, in your own words what would make it worth it 75 (optional, 200). Add to "Do you run any of these": I organize a group or community; Another kind of business.',
      'badges', 'Explorer (everyone, at the door); then one per path intake, keeping v6''s names: Registered creator, Registered restaurant owner, Registered event host, Registered nonprofit, Registered business; Group leader later (the Group Partner application moves onto ve_surveys first). Ambassador stays invitation only; Founding Member stays by date (before midnight Eastern 2027-01-01). Path badges are given automatically on finishing the intake; only Ambassador needs a person. Anything that pays money keeps its own check (for example the paid-work checklist), never the badge alone.',
      'unlocks', 'A badge opens that path''s Guide and its opportunities: Creator the Gig Board applications; Event host the event claim and the sponsorship application; Restaurant owner Passport Challenge stops and the BrandDesk path; Nonprofit consideration as a Nonprofit Partner. Each badge is a tag on the person''s profile (ve_person_tags) so follow-ups and campaigns can target it. Never promise money.',
      'existing_members', 'Members who joined before this (12 on 2026-11-06) take Explorer too; the badge is earned, not given.',
      'topic_guides', 'The $11 or 1,100-point topic Guides (Dairy, Nutrition, Airport, Stadium & Arena, Theme Park, Supermarket) are not gated on Explorer.',
      'outreach', 'One invitation for everyone: invite them to take 5 minutes, see what is new, answer a short survey and they are in, Founding Member before January 1; then they choose their path. No per-person door or campaign is picked. A restaurant version opens on their work ("running a restaurant is not an easy task... delicious Vegan food") and goes to Explorer on the business''s personal tracked link, then their Restaurant path with their business filled in. The Restaurant door''s Day 0, 4 and 10 drafts are rewritten to this. Voice: canon-ve-voice-hero-guide. Every email waits for Sean''s approval.',
      'build_order', '1 Explorer points re-weighted and the two options added. 2 Explorer tagged as the shared questions. 3 the Welcome ends in Explorer; straight-in admission. 4 the paths page. 5 path Guides gated with Explorer inline. 6 badges on profiles and as person tags. 7 the 31 questions as Build your profile. 8 the invitation and the restaurant version, as drafts. 9 policies, the Guides'' facts, saved answers. Queued behind the current ve-outreach work (Checking in''s Monday sends, the Hot Lab meetings merge).',
      'playbook', 've-outreach'
    )),
    change_summary = 'v7 (2026-11-06): Explorer is everyone''s door and path; straight in with the abuse watch as guard; paths page; path Guides gated on Explorer with Explorer inline; 250 points weighted toward optional answers; badges and unlocks; one invitation; existing members take Explorer.',
    updated_by = 'logan',
    updated_at = now()
where slug = 'canon-ve-door-guides' and version < 7;

insert into knowledge_records (slug, title, category, subcategory, body, status, owner, always_load, load_priority, tags, version, change_summary, created_by, updated_by)
select 'canon-ve-voice-hero-guide',
  'Vegans Explore voice: they are the hero, we are the guide (LOCKED by Sean 2026-11-06)',
  'decisions', 'brand',
  jsonb_build_object(
    'rule', 'Everything we write to the community makes the reader the hero and Vegans Explore the guide. Open on what they do and what it means to the community; we invite them to take the leap and level up; we never ask them to come along on our journey or support us.',
    'why', 'Sean, 2026-11-06: "whatever we write to people, we need to make them vision themselves as the hero and us as the guide getting them to there... We''re asking them to come along this journey with us and support us versus us inviting them to take the leap into adventure to level up... That should always be the voice of what we''re saying to the community. It''s about them."',
    'do', jsonb_build_array('Lead with their contribution (e.g. "We know running a restaurant is not an easy task, and we truly appreciate that you are giving our community delicious Vegan food").', 'Say what opens for them, and what they choose.', 'Keep "we" for what we built for them and how we help.'),
    'dont', jsonb_build_array('Open on our launch, our news or our needs.', 'Ask them to support us or join our journey.', 'Make Vegans Explore the subject of the first sentence.'),
    'applies', 'Emails, invitations, Guide lines, page copy, social posts and scripts, on Vegans Explore and every LESARUSS brand that speaks to a community.',
    'playbook', 've-outreach'
  ),
  'active', 'sar', true, 40, array['vegans-explore','voice','copy','outreach'], 1,
  'v1 (2026-11-06): locked by Sean in the ve-outreach chat.', 'logan', 'logan'
where not exists (select 1 from knowledge_records where slug = 'canon-ve-voice-hero-guide');

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-outreach', 'vegans-explore', 'logan', 'decision', 'text',
  've-outreach: Explorer path and badges LOCKED by Sean 2026-11-06 ("lock it"). canon-ve-door-guides v7 (explorer_path_v7) and new canon-ve-voice-hero-guide. Explorer is everyone''s door and path (Welcome plus 8-question survey, about 5 minutes); finishing admits at once, the abuse watch is the guard (replaces the person check and the 31-question gate; the 31 become Build your profile). After Explorer, a paths page; path Guides open only after Explorer, locked in the catalog, and Explorer opens inside any path Guide reached early; done shows as a completed first step. Every survey 250 points for everything, required few and worth less, optional worth more (Explorer weights in canon). Badges: Explorer; Registered creator, restaurant owner, event host, nonprofit, business; Group leader later; Ambassador invitation only. One invitation for everyone plus a restaurant version, written with them as the hero. Existing members take Explorer too; topic Guides not gated. Build queued behind Checking in''s Monday sends and the Hot Lab merge. Migration 20261106_explorer_path_v7_canon.sql.'
where not exists (select 1 from playbook_records where slug = 've-outreach' and body like 've-outreach: Explorer path and badges LOCKED%');

update ve_playbook_index
set stage = 'Checking in approved (15 go Mon Nov 9); Hot Lab meetings on an HQ branch; Explorer path locked (canon-ve-door-guides v7), build queued.',
    next_action = 'Sean: say go to merge Hot Lab meetings; upload the Instagram export. Logan: Mon Nov 9 after 9:45 AM ET confirm Checking in''s 15 sends; after go, merge HQ and prove the first profile meeting; then build Explorer v7 step 1 (re-weight points, add the two options).',
    updated_at = now()
where slug = 've-outreach';
