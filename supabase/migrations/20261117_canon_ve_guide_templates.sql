-- Sean, 2026-11-17: lock the shared Guide frame and two templates (Finder, Handbook). Supersedes canon-guide-mobile-card.
insert into knowledge_records (slug,title,category,subcategory,body,status,owner,always_load,load_priority,tags,version,change_summary,created_by,updated_by)
select 'canon-ve-guide-templates','Vegans Explore Guides: one frame, two templates (Finder and Handbook)','brand','canonical',
jsonb_build_object(
 'quote','Yes, I want to lock it in... I agree that even if some guides are better than the others, they all need to be uniformed, or we''ll never be able to keep track of them at the rate that we''re creating them.',
 'locked_by','Sean','locked_at','2026-11-17',
 'rule', jsonb_build_array(
  '1. Every Vegans Explore Guide is ONE shared frame plus ONE of TWO bodies, Finder or Handbook. No third template; a new need is a setting on one of the two, brought to Sean first.',
  '2. The frame, same on every Guide: site nav and footer; the Guide bar (Guides pink) with the Guide name, a one-line join, and ONE way to move: the Contents button opening a numbered panel of every part (Overview first, date or one-line purpose, You are here), in place, never a box that scrolls inside itself; page head (eyebrow, title, one line); the Guide appears once (square picture framed from the top, one line, Play only when pressed); one orange action per view; full width. Frame CSS lives only in /public/ve-guide-frame.css.',
  '3. FINDER body (the visitor came to find something near them): search (City or ZIP, Near me, Search), a one-sentence true answer of what is there, answer chips in plain words as filters (an empty filter shows the honest empty state, never a dead 0), one list mixing kinds, one card per chain, date chips with the day itself highlighted, That is everything posted so far, Coming rows, the business doorway.',
  '4. HANDBOOK body (the visitor came to learn): the part''s pieces as rows, a Start here orange action, a Next part link at the bottom (no numbered pager). HANDBOOK WITH PROGRESS is a setting: Done / Not yet per row, Your progress N of M, Continue.',
  '5. The template is chosen per part: a Finder Guide may have Handbook parts (Vegan Dairy: Brands is Finder, Swaps is Handbook).',
  '6. Phones (Sean, 2026-11-17): tiles and rows keep the desktop layout. Picture or number left, text in the middle, buttons and tags on the right; the text in the middle gives (wraps, a little smaller), never the buttons dropping below.',
  '7. Rollout batch by batch, each with a before and after content inventory (scripts/guide-audit.js) proving every part, item and link is still listed, then a manual review by Sean.'),
 'where', jsonb_build_object(
  'finder', jsonb_build_array('Holiday','Airport','Stadium & Arena','Theme Park','Supermarket','Vegan Dairy'),
  'handbook', jsonb_build_array('Nutrition','Food Photographer','Vegan Events','Vegan Activism','Creator','Nonprofit','Welcome','Taste'),
  'handbook_progress', jsonb_build_array('Pre-Vegan Business','Pre-Vegan Restaurant','Vegan Restaurant'),
  'references', jsonb_build_array('/mocks/guide-templates/finder/','/mocks/guide-templates/handbook/','/mocks/guide-templates/handbook/?v=progress','mocks/guide-templates/BRIEF.md')),
 'supersedes','canon-guide-mobile-card'),
'active','sar',true,14,array['vegans-explore','guides','templates','canon','look'],1,'Locked the two Guide templates and the phone row rule','logan','logan'
where not exists (select 1 from knowledge_records where slug='canon-ve-guide-templates');

update knowledge_records set status='superseded',
  superseded_by=(select id from knowledge_records where slug='canon-ve-guide-templates'),
  updated_at=now(), updated_by='logan', change_summary='Replaced by the shared frame and two templates (Sean, 2026-11-17)'
where slug='canon-guide-mobile-card' and status<>'superseded';
