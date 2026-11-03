-- ve-feedback: Sean's ongoing spot-check playbook (Sean, 2026-11-03). Applied through the Supabase connector.
-- One index row (Watching, Logan, nothing open) and three decision records: how it works, item 1 (dashboard Insights), item 2 (Depot to the bottom).
insert into ve_playbook_index (slug, brand_slug, title, goal, status, stage, next_action, owner, due_on, priority)
values ('ve-feedback','vegans-explore','Feedback',
 'Sean''s ongoing spot-check list: small look-and-feel and functionality tweaks he finds while using the site, worked one at a time until the queue is empty. Open-ended: Watching with nothing open is its resting state.',
 'watching',
 'Opened 2026-11-03. Items 1 and 2 (the dashboard Insights block and the Depot move) are live on main, c905155, confirmed in the live page; Sean has not yet looked at real numbers.',
 'Sean opens the live dashboard and checks that the Web, Social and SEO tabs show real numbers and that See full insights opens the right Depot pages. Then Logan pulls the next open item.',
 'Logan', null, 30)
on conflict (slug) do nothing;
-- The three playbook_records rows (kind decision, author Logan) hold the full text; see the table, slug ve-feedback.
-- Canon: knowledge_records canon-ve-feedback-playbook (category operations, subcategory playbooks, version 1).
