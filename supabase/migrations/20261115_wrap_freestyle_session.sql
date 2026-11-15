-- Wrap-up, 2026-11-15 freestyle session (Logan): playbook decision rows, canon for the locked phone navigation and the
-- "what Sean hands over goes live" rule, a handed_off checkpoint and a stream event. Safe to run twice.
insert into playbook_records (slug, brand_slug, author, body, source, kind)
select v.slug, 'vegans-explore', 'Logan Russell', v.body, 'text', 'decision'
from (values
 ('ve-mobile-app', $b$ve-mobile-app 2026-11-15: the website on phones now matches the app. LIVE: public/ve-app-shell.js (Back beside the logo and a picture viewer when opened from the home screen; Get the app in the menu); the app's bottom bar (Home, Explore, Menu raised, Saves, Profile) on every page at 860 px and under; Menu opens a sheet of tiles, four across like an iPhone (LOCKED, Sean: "Lock it in and build it"); super admins get Depot and BrandDesk tiles (Sean: "the only reason I've been going to the depot is to access Brand Desk"); Dashboard's tile is a gauge; Profile opens My Account; no hamburger on phones. Next: app 1.0.1 in Color Block with the same Menu (new chat; TestFlight still shows the old look; iOS 1.0.0 (13) sent to review 2026-11-08).$b$),
 ('ve-brand-kit', $b$ve-brand-kit 2026-11-15: BrandDesk > Brand kit > Social kit is usable (profiles per platform, files at exact size, story highlight covers, 11 tracked profile links, Save to Photos); the member dashboard's own parts moved to Color Block (the 2026-11-13 sweep had missed them); the homepage got a play button and five new door pictures in the Guide scene recipe (Sean: "approved, take it live"), with asset packs in all five shapes at vegan-media/media/home/doors/. Maya and Theo drawn from their original references per canon looks_locked_v1 after the first drafts used the retired squares.$b$),
 ('ve-directory-navigation', $b$ve-directory-navigation 2026-11-15: a local food business with no street address (Restaurants, Bakeries & Cafes, Food Trucks, Vendors, Catering) never shows in every chapter (Sean: "online doesn't necessarily mean that they serve nationwide"); Add a listing's Online asks which chapters it serves; an empty logo square is said out loud. Five leaked listings moved; Blondies to South Florida.$b$),
 ('ve-holiday-guide', $b$ve-holiday-guide 2026-11-15: Menus We Found batch 3 from Ideas 111526: eight menus live, five new listings, The People's Harvest event. Sean: "I don't know why you're asking me to approve them. I gave them to you." Rule since (CLAUDE.md): what Sean hands over goes live, listings included.$b$),
 ('ve-member-account', $b$ve-member-account 2026-11-15: My Account rebuilt (Sean: "a my accounts page that should show their purchases, that should do their password, all of that"): details, Change my password by emailed link, Purchases from ve-account / ve_member_purchases, Privacy, Sign out; Profile in the phone bar opens it. Not yet seen signed in as Sean.$b$)
) v(slug, body)
where not exists (select 1 from playbook_records p where p.slug = v.slug and p.body = v.body);

insert into knowledge_records (slug, title, category, status, version, owner, created_by, updated_by, always_load, tags, body)
select 'canon-ve-phone-navigation', 'Vegans Explore on phones: the app''s bottom bar and the tile Menu (LOCKED 2026-11-15)', 'brand', 'active', 1, 'sar', 'logan', 'logan', false,
  array['vegans-explore', 'navigation', 'mobile'],
  jsonb_build_object(
    'rule', 'On phones (860 px and under) every Vegans Explore page with the site nav carries the app''s bottom bar in the app''s order: Home, Explore, Menu (raised, brand green), Saves, Profile. Menu opens a sheet of tiles four across: the sections in their section colors (Directory, Events, Daily Pulse, Media, Guides, Communities, Passport), then Depot and BrandDesk for super admins, Dashboard (a gauge icon), Add a place, Get the app (not in the app), Log in or Log out. Profile opens My Account. No hamburger on phones. Opened from the home screen, a Back button sits beside the logo and pictures open in a viewer, never a bare page. The app copies the same Menu.',
    'authority', 'Sean, 2026-11-15: "go, build the bottom menu"; "Lock it in and build it" (the tile Menu, from the mock beside the Directory); "get rid of my saves, put the depot where my saves is, put Brand Desk after that"; "That''s what I would expect to see when you click profile."',
    'code', 'public/ve-app-shell.js (tileMenu, TABS), loaded by public/nav.js',
    'history', 'docs/history/app.md')
where not exists (select 1 from knowledge_records where slug = 'canon-ve-phone-navigation');

insert into knowledge_records (slug, title, category, status, version, owner, created_by, updated_by, always_load, tags, body)
select 'canon-ve-sean-handover-goes-live', 'What Sean hands over goes live (2026-11-15)', 'operations', 'active', 1, 'sar', 'logan', 'logan', false,
  array['vegans-explore', 'workflow'],
  jsonb_build_object(
    'rule', 'Menus, events, places or listings Sean gives Logan (screenshots, links, an Ideas folder) are created and published by Logan, listings included, never queued back to him for approval. The pending review is only for what members or the team find on their own.',
    'authority', 'Sean, 2026-11-15: "I don''t know why you''re asking me to approve them. I gave them to you. And why aren''t you just creating the listings like you''ve created all the other listings? Why all of a sudden I have to intervene and be a middleman?"',
    'where', 'CLAUDE.md standing rules; docs/history/guides-holiday.md')
where not exists (select 1 from knowledge_records where slug = 'canon-ve-sean-handover-goes-live');

insert into brief_checkpoints (brand_slug, station, account, status, summary, files_touched, next_step, session_label, open_items, handoff_url)
select 'vegans-explore', 'cloud', 'lesaruss', 'handed_off',
  'VE freestyle, 2026-11-15 (Logan). Live: local Online businesses stay in their chapters; Ideas 111526 holiday menus and five listings; Add a listing asks chapters for Online; BrandDesk Social kit (HQ main 75f6fa4 and after); phones get the app''s bottom bar, a tile Menu (locked), Back and a picture viewer in the home-screen app; dashboard chips fixed, loading line, Color Block, Shortcuts; votes are vouches with Undo (884 became 711, playbook ve-vouch-points); My Account rebuilt (ve-account); homepage play button and five new door pictures with asset packs. All on main; nothing unmerged.',
  '["public/ve-region-directory.js","public/ve-app-shell.js","public/nav.js","public/ve-votes.js","public/ve-look.css","account.html","index.html","dashboard/center-console.html","admin/depot/directory-review.html","supabase/functions/ve-votes/index.ts","supabase/functions/ve-account/index.ts","supabase/functions/ve-discover/index.ts","supabase/migrations/20261115_*.sql","lesaruss-hq: components/newhq/KitSheet.tsx, components/newhq/doorCss.ts"]'::jsonb,
  'New chat on ve-mobile-app: app 1.0.1 in Color Block with the tile Menu (prompt in the handoff).',
  've-freestyle-phone-nav-account-homepage',
  '["Logan: app 1.0.1 in Color Block (new chat, ve-mobile-app)","Logan: ve-vouch-points builds (point costs and cap, give flow, business wallet, outside-supporter count)","Not proven signed in as Sean: Social kit, My Account, dashboard fixes"]'::jsonb,
  'https://github.com/lesaruss/vegansexplore-com/blob/main/docs/handoff/2026-11-15-ve-freestyle-phone-nav-account-homepage.md'
where not exists (select 1 from brief_checkpoints where session_label = 've-freestyle-phone-nav-account-homepage');

insert into stream_events (owner, station, summary, keywords, status, context_link)
select 'logan', 'vegans-explore', 'Freestyle session wrapped: phone bottom bar and tile Menu, My Account, vouches with Undo, dashboard in Color Block, Social kit, homepage doors; all live on main.',
  array['phone-navigation', 'my-account', 'vouches', 'homepage', 'branddesk-social-kit'], 'completed',
  'https://github.com/lesaruss/vegansexplore-com/blob/main/docs/handoff/2026-11-15-ve-freestyle-phone-nav-account-homepage.md'
where not exists (select 1 from stream_events where summary like 'Freestyle session wrapped: phone bottom bar%');
