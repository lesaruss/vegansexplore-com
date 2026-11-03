-- People, campaigns and the three doors (LOCKED by Sean 2026-11-03: "we can lock it"). Canon canon-ve-people-campaigns-doors; write-up
-- docs/proposals/people-campaigns-doors.md. Extends canon-ve-pathways. Nothing is built yet except the member card's Take back.
insert into public.knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary, body)
select 'canon-ve-people-campaigns-doors',
  'Vegans Explore: three doors (Pulse subscriber, survey, $11), the Welcome as the one free guide, and campaigns on people (LOCKED by Sean 2026-11-03)',
  'decisions', 'product', 'active', 'sar', false, 50,
  array['vegans-explore','passport','welcome','taster','pulse','campaigns','pathways','outreach'], 1, 'logan', 'logan',
  'Locked by Sean: "we can lock it". Three doors, no comps, the Taster retired into one Welcome, the Pulse subscription first, campaigns on the people engine.',
  jsonb_build_object(
    'why', 'Sean: "people don''t have to pay to get in, but they do have to show some effort, which has been my issue the whole time"; "either your time or your money to get in"; the Pulse subscribe is "a low cost" way in for non-members; campaigns as "one place, almost like a brand desk".',
    'doors', jsonb_build_array(
      'Subscriber: an email, the Daily Pulse for the cities they pick, free.',
      'Time: the comprehensive survey (Your profile), membership and full access, 250 points (the survey''s own), more points only from bounties.',
      'Money: the $11 Passport, membership and full access, 1,100 points.'),
    'no_comps', 'No comps. Sean may give bonus points by hand from a member''s profile (Give points, Take back).',
    'founding_open_question', 'Whether the survey door earns Founding Member is not decided (Sean''s words were unclear). Default: no, Founding Member only by paying before 2027-01-01.',
    'welcome', 'The Welcome, the Passport and the Taste merge into one Welcome: always free and public, explains how to use Vegans Explore, kept current, the visitor chooses what to learn, and it ends with the two paths (time or $11). The Taster account type goes away; ve_tasters, /guides/taste and the Taster emails keep working until the Welcome ships. Pulse subscribers get no Taster sequence.',
    'pulse_subscribe', 'Subscribe box on every Pulse page and article, plus an exit pop-up on desktop only, once per visitor per 30 days, never on a first page view or on phones. One or more cities, daily by default, weekly optional, preferences page, double opt-in, London unticked explicit tick, one-click unsubscribe. A short issue: top five stories with two lines each, then From Vegans Explore (where a campaign is promoted through ve_pulse_features), one ask; a gentle line offering the two membership doors every few issues. Skip a city with no news. Reuses the Taster record with source pulse-subscribe.',
    'people_model', jsonb_build_object(
      'profile', 'One page per person: who they are, groups, every email, click and action, notes, Give and Take back points.',
      'group', 'A stakeholder bucket; a rule puts people in (for example a banner click) or Sean does by hand.',
      'campaign', 'A goal with tracks; each track has an audience, an email sequence and a guide page the link opens.',
      'entry', 'A person enters a campaign''s sorting only on a real action. Keep the source (banner, Pulse, email, form) and the stage (Noticed, Interested, Committed). No numeric scores. A signed-out banner click lands on a page with a one-line tell me more email, which makes the person.',
      'sequence', 'Default Day 0, Day 3, Day 7, last note Day 14; stops on any action or unsubscribe; editable per track and applies to anyone who has not reached that step.',
      'calendar', 'A two-week plan approved once; Sean can pull anyone any day; nothing leaves without his approval of that day''s list.',
      'audience', 'Published emails only from the Directory, city by city, never guessed; London business addresses only.',
      'home', 'A campaign lives in BrandDesk under Vegans Explore with Overview, People, Assets, Messages, Playbook and Results; BrandDesk''s Plan tab is renamed Playbook.'),
    'first_campaign', 'When Sean picks one: the Plant-Based Showcase at the Miami Dolphins game (Nov 29, 2026).',
    'build_order', jsonb_build_array('Pulse subscribe', 'the people sender (pick and draft, status and campaign table, week view)', 'the survey door', 'the updated Welcome', 'profiles with groups', 'campaign homes in BrandDesk'),
    'playbook', 've-pathways')
where not exists (select 1 from public.knowledge_records where slug = 'canon-ve-people-campaigns-doors');

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-pathways', 'vegans-explore', 'Logan',
  'UPDATE 2026-11-03 (Sean: "we can lock it"; canon canon-ve-people-campaigns-doors): Pathways now sits under campaigns on people. Three doors (Pulse subscriber, survey, $11), no comps, the Taster retired into one Welcome. A person enters a campaign on a real action, with a source and a stage (Noticed, Interested, Committed). Default follow-up Day 0, 3, 7, 14, editable per track. Two-week calendar approved once. Campaign homes live in BrandDesk, whose Plan tab is renamed Playbook. Build order: Pulse subscribe, the people sender, the survey door, the updated Welcome, profiles with groups, campaign homes. Write-up docs/proposals/people-campaigns-doors.md. Nothing built yet except the member card (Take back points, clickable rows).',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-pathways' and body like 'UPDATE 2026-11-03%');

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-pricing-points-passport', 'vegans-explore', 'Logan',
  'UPDATE 2026-11-03 (Sean: "we can lock it"; canon canon-ve-people-campaigns-doors): the free way in is the survey, not the three challenges. Two membership doors: the survey (membership, full access, 250 points) or the $11 (membership, full access, 1,100 points); a third, free Pulse subscription is not a membership. No comps; bonus points by hand from a profile. The Taster account type and the Taste merge into one free Welcome (also the Passport). Open: whether the survey door earns Founding Member (default no). The challenges stay in place until Sean says; Founding Member still closes at midnight Eastern on 2027-01-01.',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-pricing-points-passport' and body like 'UPDATE 2026-11-03%');
