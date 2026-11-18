-- Wrap-up, 2026-11-17 freestyle session (Logan): playbook decision rows, canon for holiday hours and the Social tab, a handed_off
-- checkpoint and a stream event. Safe to run twice.
insert into playbook_records (slug, brand_slug, author, body, source, kind)
select v.slug, 'vegans-explore', 'Logan Russell', v.body, 'text', 'decision'
from (values
 ('ve-mobile-app', $b$ve-mobile-app 2026-11-17: Share shows in the phone top bar on every page (Sean: "I can't even copy a link on the web app"; confirmed on his phone). The home-screen app has its own pull to refresh (Sean: "I find myself having to close out the whole website just to see new updates"), ve-app-shell.js v8. main 6e36e59.$b$),
 ('ve-holiday-guide', $b$ve-holiday-guide 2026-11-17: Ideas 111726 live (The Green Table Wesley Chapel and its Game Night, ART BASIL at Aguacate, Brunch @ Night, Seasoned Green and its ThanksLiving menu; Love Life Cafe's Thanksgiving package from Sean's PDF). Holiday hours built (Sean: "Let's build the holiday hours feature now"; then "set it up just like the other one... one of those little toggle things"; "Okay, that looks good"): ve_holiday_hours by day, Needs you on the business dashboard, Regular hours / Holiday hours on the listing page, ve-holiday v15.$b$),
 ('ve-claims-onboarding', $b$ve-claims-onboarding 2026-11-17: claim follow-ups with personal tracked links (claim-rawchefcarla, claim-earthypicks, claim-sensaigon), each opening the claim form with the listing filled in. Sean: every reply to a business is a chance to ask them to claim, with the link fitted in naturally. Sen Saigon: Sean wants An Nguyễn Hawks as an early New York partner in 2027, no call pushed. Spotlight on the Social tab is a claim benefit (owners paste up to six post links).$b$),
 ('ve-social-studio', $b$ve-social-studio 2026-11-17: the Social tab is theirs (Sean: "It's a lot of us on there, and she probably just wants to showcase her stuff"; "go"; "I feel good about that"): Spotlight (the owner's picks) first, their top posts, then Featured on Vegans Explore at most three, last 12 months, no roundups. ve-listing-posts v6 owner_spotlight.$b$)
) v(slug, body)
where not exists (select 1 from playbook_records p where p.slug = v.slug and p.body = v.body);

insert into knowledge_records (slug, title, category, status, version, owner, created_by, updated_by, always_load, tags, body)
select 'canon-ve-holiday-hours', 'Holiday hours: asked of the business, shown beside regular hours (2026-11-17)', 'brand', 'active', 1, 'sar', 'logan', 'logan', false,
  array['vegans-explore', 'business-dashboard', 'listings', 'holidays'],
  jsonb_build_object(
    'rule', 'A claimed business (food listings) is asked on its dashboard Home, under Needs you, for each holiday in the next 21 days that asks (ve_holidays.asks_hours; Hanukkah and Kwanzaa do not): Staying the same, or the days and hours that change. Answering closes the row; it goes live at once. The listing page shows one Hours section with a Regular hours / Holiday hours toggle (the Events Upcoming/Past toggle), the holiday side a day-and-hours table like the weekly one. Hours Sean hands over are set by the team.',
    'authority', 'Sean, 2026-11-17: "If they haven''t indicated holiday hours, and they can just check staying the same, and then it''ll close off"; "Let''s build the holiday hours feature now"; "It''s all mushed together... Can''t we set it up just like the other one?... one of those little toggle things"; "Okay, that looks good."',
    'code', 'business-dashboard.html (HH, drawHolidayHours), directory/listing.html (loadHolidayHours), supabase/functions/ve-holiday (hours_mine, hours_save)',
    'history', 'docs/history/guides-holiday.md')
where not exists (select 1 from knowledge_records where slug = 'canon-ve-holiday-hours');

insert into knowledge_records (slug, title, category, status, version, owner, created_by, updated_by, always_load, tags, body)
select 'canon-ve-social-tab-theirs', 'The Social tab is the business''s, with Spotlight (2026-11-17)', 'brand', 'active', 1, 'sar', 'logan', 'logan', false,
  array['vegans-explore', 'listings', 'social'],
  jsonb_build_object(
    'rule', 'A listing''s Social tab shows, in order: Spotlight (up to six of the owner''s own Instagram, TikTok or YouTube posts, pasted as links in Edit your page > Social, shown as the posts themselves, three across, two when narrower, one on phones), their top posts, then Featured on Vegans Explore: at most three of our posts, from the last 12 months, about them only (a roundup that tags more than three other accounts stays on our channels). No qualifying post: no tab. Our old posts are kept in the database, not shown.',
    'authority', 'Sean, 2026-11-17: "It''s a lot of us on there, and she probably just wants to showcase her stuff... Maybe we should just be focusing on new campaigns and then making that more a showcase for their stuff"; "go"; "I feel good about that. And when people claim it... give them suggestions on what to pick to spotlight... as simple as them putting the URL in there and then it''s showing up as a 3 column on the page or a 2 column if it''s too big."',
    'code', 'directory/listing.html (loadSocialTab, spotHtml, oeSocial), supabase/functions/ve-listing-posts (owner_spotlight), listings.spotlight_posts',
    'history', 'docs/history/social.md')
where not exists (select 1 from knowledge_records where slug = 'canon-ve-social-tab-theirs');

insert into brief_checkpoints (brand_slug, station, account, status, summary, files_touched, next_step, session_label, open_items, handoff_url)
select 'vegans-explore', 'cloud', 'lesaruss', 'handed_off',
  'VE freestyle, 2026-11-17 (Logan). Live: Share on phones; pull to refresh in the home-screen app; inbox swept with claim links (Carla, Earthy Picks, Sen Saigon); Ideas 111726 and Love Life Thanksgiving; holiday hours (dashboard Needs you, listing toggle, ve-holiday v15); the Social tab is theirs; Spotlight (ve-listing-posts v6). All on main.',
  '["public/nav.js","public/ve-app-shell.js","business-dashboard.html","directory/listing.html","supabase/functions/ve-holiday/index.ts","supabase/functions/ve-listing-posts/index.ts","supabase/migrations/20261117_*.sql","docs/history/interface.md","docs/history/guides-holiday.md","docs/history/social.md"]'::jsonb,
  'Sean tests Spotlight and holiday hours signed in on a page he owns; then pick the next playbook.',
  've-freestyle-share-holiday-hours-social-spotlight',
  '["Sean: test Spotlight (Edit your page > Social) and holiday hours signed in on a page he owns","Not proven: Instagram and TikTok embeds drawing (build session cannot reach Instagram)","Parked: email nudge for unanswered holiday hours","Waiting: An Nguyễn Hawks (Sen Saigon) reply; early New York partner in 2027"]'::jsonb,
  'https://github.com/lesaruss/vegansexplore-com/blob/main/docs/handoff/2026-11-17-ve-freestyle-share-holiday-hours-social-spotlight.md'
where not exists (select 1 from brief_checkpoints where session_label = 've-freestyle-share-holiday-hours-social-spotlight');

insert into stream_events (owner, station, summary, keywords, status, context_link)
select 'logan', 'vegans-explore', 'Freestyle session wrapped 2026-11-17: Share on phones, pull to refresh, holiday hours, the Social tab is theirs, Spotlight; inbox and Ideas 111726 processed; all live on main.',
  array['share', 'pull-to-refresh', 'holiday-hours', 'social-tab', 'spotlight', 'claims'], 'completed',
  'https://github.com/lesaruss/vegansexplore-com/blob/main/docs/handoff/2026-11-17-ve-freestyle-share-holiday-hours-social-spotlight.md'
where not exists (select 1 from stream_events where summary like 'Freestyle session wrapped 2026-11-17%');
