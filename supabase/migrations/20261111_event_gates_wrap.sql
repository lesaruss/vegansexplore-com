-- Wrap-up of the event gates session (Sean, 2026-11-11: "wrap up"). Canon, playbook decisions, checkpoint, stream event.
-- Safe to run twice (each insert guarded).

insert into public.knowledge_records (slug, title, category, subcategory, body, status, owner, always_load, load_priority, tags, version, change_summary, created_by, updated_by)
select 'canon-ve-event-gates', 'Vegans Explore events: the gates and supporting organizations', 'operations', 'canonical',
  jsonb_build_object(
    'rule', 'Waiting events the crawl, a flyer or the team brought in go live on their own once they pass the gates; nobody approves them one by one. Members'' own submissions still wait for a person (default, Sean''s to change).',
    'sean', 'Sean, 2026-11-11: "If they are still active, if they have a link to register, it hasn''t been canceled, it''s not duplicated, I would say we can roll with it." And: "If we have an organization that is also hosting their meetup, let''s put it underneath that listing... it''s almost like a referral."',
    'duplicates', 'Same local day plus the same link, or a near-same name in one city or by one organizer. The same organizer twice is folded (turned down as Duplicate of). Two organizations: the official one is the event and the other is a supporting organization under it (status supporting, dupe_of), shown on the event page with its Directory link and its own Register with them link, and kept on its own Directory page.',
    'official', 've_event_official_pick: the organizer the other title names, then the organizer''s own site over a ticketing page over a group post (Meetup, Partiful, Facebook, Instagram), then a Directory listing, then the live one.',
    'page_check', 'The official page is read (JSON-LD first, else Claude): shows the event -> live; cancelled -> off; gone (404 or 410 on two checks) -> turned down; loads without the event, postponed or unreadable -> held for a person, asked again daily. A page that loads is never enough on its own to turn an event down (neoncrm portals build in the browser).',
    'tools', 'Depot > Events: select many, Approve / Turn down; Supporting (Make this the main one, Not the same event); Held. Edge function ve-event-check (gate, holds, not_dupes, support_swap), cron ve-event-gate every 15 minutes.',
    'not_built', 'A paying sponsor hiding its supporters (Sean: "we''re not there yet").',
    'record', 'docs/history/events.md; migrations 20261111_event_gates.sql, 20261111_event_supporters.sql'),
  'active', 'sar', false, 30, array['vegans-explore', 'events', 'gates', 'duplicates', 'supporters', 'canon'], 1,
  'v1: the event gates and supporting organizations (Sean, 2026-11-11).', 'logan', 'logan'
where not exists (select 1 from public.knowledge_records where slug = 'canon-ve-event-gates');

insert into public.playbook_records (slug, brand_slug, author, kind, source, body)
select 've-events-platform', 'vegans-explore', 'Logan', 'decision', 'text', b from (values
  ('Event gates (Sean, 2026-11-11): "I am not going through all 122 of these... why can''t we just approve them? Can we put in some gates?" "If they are still active, if they have a link to register, it hasn''t been canceled, it''s not duplicated, I would say we can roll with it." Built and live: ve-event-check gate, cron every 15 minutes; members'' own events still wait for a person (Logan''s default). The 122 all went through: most live, about 30 repeats came down, 2 held (neoncrm pages). Canon canon-ve-event-gates.'),
  ('Select many (Sean, 2026-11-11: "select multiple and then have an action that I can choose to approve it, to, you know, turn it down"): Depot > Events checkboxes, Select all shown, Approve / Turn down for the selection, live.'),
  ('Supporting organizations (Sean, 2026-11-11): "If we have an organization that is also hosting their meetup, let''s put it underneath that listing... they can see, click on it and see their listing... it''s almost like a referral." "Unless Polar Springs is a sponsor... But we''re not there yet." Built and live: the official one is the event, the other a supporter under it, Register with them; Depot Supporting view. Sponsor exception not built.'),
  ('Georgia VegFest duplicate (Sean: "I just never got around to having you remove them"): the Atlanta Veggie Eats Meetup copy came down as a duplicate of the official Farm of the Free listing, 2026-11-11. Merged to main on Sean''s word: "Yeah, you can go ahead and merge these updates."'),
  ('Two wrong calls caught and fixed the same morning: a neoncrm event page read as gone and the event turned down (now held, never turned down on a page that loads); Poplar Spring''s own event put under the Veg Society of DC Meetup post naming it (now the pairwise official pick). Both events put right.')
) v(b)
where not exists (select 1 from public.playbook_records where slug = 've-events-platform' and body = v.b);

insert into public.brief_checkpoints (brand_slug, station, account, status, session_label, summary, files_touched, next_step, open_items, handoff_url)
select 'vegans-explore', 'vegans-explore', 'logan', 'handed_off', 'event-gates-and-supporters',
  'Event gates live (auto-approve crawl events whose official page checks out; fold same-organizer repeats; two organizations become one event with a supporting organization and Register with them); Depot > Events select-many, Supporting and Held; the 122 waiting events all gated; Georgia VegFest Meetup copy removed. All on main (c7ec2b5 and the wrap commit).',
  '["supabase/functions/ve-event-check/index.ts", "supabase/functions/ve-events/index.ts", "public/ve-events.js", "directory/listing.html", "admin/depot/events.html", "supabase/migrations/20261111_event_gates.sql", "supabase/migrations/20261111_event_supporters.sql", "docs/history/events.md"]'::jsonb,
  'Nothing open in this task. Sean: look at Depot > Events > Held (2) when convenient.',
  '["Held: Cooking with Chef Carole, Plant Powered Dinner Social in Astoria (neoncrm pages)", "Members'' own submissions through the gates? default no", "Sponsor hides supporters: not built", "Depot bulk/Supporting/Held views not yet seen by Sean signed in"]'::jsonb,
  'https://github.com/lesaruss/vegansexplore-com/blob/main/docs/handoff/2026-11-11-event-gates-and-supporters.md'
where not exists (select 1 from public.brief_checkpoints where session_label = 'event-gates-and-supporters');

insert into public.stream_events (owner, station, task_id, summary, keywords, status, context_link)
select 'Logan', 'vegans-explore', 've-events-platform',
  'Event gates and supporting organizations live: 122 waiting events gated (most live, about 30 repeats folded, 2 held), Meetup copies shown under the official event with Register with them, Depot select-many.',
  array['events', 'gates', 'duplicates', 'supporters', 'depot'], 'completed',
  'https://github.com/lesaruss/vegansexplore-com/blob/main/docs/handoff/2026-11-11-event-gates-and-supporters.md'
where not exists (select 1 from public.stream_events where task_id = 've-events-platform' and summary like 'Event gates and supporting organizations live%');
