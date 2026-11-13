-- Outreach wording fixes (Sean, 2026-11-13: "go with your defaults, fix them all"; the audit docs/audits/2026-11-13-outreach-wording.md).
-- Only the words of paused and draft campaigns change; nothing is resumed or approved here. Each replace leaves the text as it was if its
-- phrase is already gone, so this is safe to run twice.

-- 3. The creator invitation: membership is free for everyone (canon-ve-door-guides v12), never "on us".
update ve_outreach_campaign_emails set body = replace(body, 'Your membership is on us, and it''s ready for you.', 'Your membership is free, and it''s ready for you.'), updated_at = now()
  where campaign_slug = 'creator-invitation' and step = 1;   -- creator-welcome-keya is finished (sent), left as sent

-- 4. The plant-based ThanksLiving email: a business that is not Vegan offers plant-based (Pre-Vegan) options (Writing rule).
update ve_outreach_campaign_emails set body = replace(replace(body,
    'many want a plant-based option they can order', 'many want a plant-based (Pre-Vegan) option they can order'),
    'we feature them as your plant-based holiday menu', 'we feature them as your plant-based (Pre-Vegan) holiday menu'), updated_at = now()
  where campaign_slug = 'thanksliving-2026-plant' and step = 1;

-- 2. The December giveaway vault is not built: out of the four Gift Guide and Featured drafts, with the "first pick" line that leaned on it.
update ve_outreach_campaign_emails set subject = 'Two ways in for December, {business}', body = $b$Hi {first_name},

Thank you for claiming {business} on Vegans Explore. Your page is yours now, and your gift is in the Holiday Gift Guide. Here are two ways to do more with it this December.

1. Your spot in the Holiday Guide. Tell us about a holiday bundle, a gift set or a discount code, and we will add it to your gift card.

2. The Daily Pulse. Our team is writing about Vegan holiday gifts this season. Reply with the story behind your product, and we may feature {business}.

You can see your page here:
{link}

The Vegans Explore team$b$, updated_at = now()
  where campaign_slug = 'gift-guide-2026-claimed' and step = 1;
update ve_outreach_campaign_emails set body = replace(body, 'Brands that claim by Friday, November 20 get first pick of a few things we are planning for December.',
    'Once you claim it, you can update your gift card yourself, and you will hear first about new ways in as they open.'), updated_at = now()
  where campaign_slug = 'gift-guide-2026-selected' and step = 1;
update ve_outreach_campaign_emails set body = replace(body, 'Claiming your page is free. Businesses that claim by Friday, November 20 get first pick of a few things we are planning for December.',
    'Claiming your page is free, and you will hear first about new ways in as they open.'), updated_at = now()
  where campaign_slug = 'holiday-guide-2026-kosher' and step = 1;
update ve_outreach_campaign_emails set body = replace(body, 'Claiming your page is free, and from there you can manage your menu yourself. Businesses that claim by Friday, November 20 get first pick of a few things we are planning for December.',
    'Claiming your page is free, and from there you can manage your menu yourself and see new ways in as they open.'), updated_at = now()
  where campaign_slug = 'holiday-guide-2026-menus' and step = 1;

-- 1. The Holiday Launch and the Founding Cohort follow-ups: the holidays lead, true before and after ThanksLiving (paused since 2026-11-11).
update ve_outreach_campaign_emails set body = replace(body,
    'For ThanksLiving on Thursday, November 26, our Holiday Guide is ready: recipes, holiday menus from Vegan places as they come in, and ways to give back.',
    'For the holidays, our Holiday Guide is ready: the Gift Guide, holiday menus from Vegan places, recipes for the whole table, and ways to give back.'), updated_at = now()
  where campaign_slug like 'holiday-launch-%' and step = 1;
update ve_outreach_campaign_emails set subject = 'The Holiday Guide is open, {first_name}', body = replace(replace(body,
    'With ThanksLiving two weeks out, we just opened the Holiday Guide.', 'With the holidays coming up, the Holiday Guide is open.'),
    'Theo walks you through it: recipes for the whole table,', 'Theo walks you through it: the Gift Guide, recipes for the whole table,'), updated_at = now()
  where campaign_slug = 'founding-cohort-1-wed-clicked' and step = 1;
update ve_outreach_campaign_emails set subject = 'Something for your holiday table', body = replace(body, ' ThanksLiving is Thursday, November 26.', ''), updated_at = now()
  where campaign_slug = 'founding-cohort-1-wed-opened' and step = 1;
update ve_outreach_campaign_emails set subject = 'Planning your holiday table?', body = replace(body,
    'ThanksLiving is Thursday, November 26, and we just opened a free Holiday Guide for it:', 'The holidays are coming, and our free Holiday Guide is open:'), updated_at = now()
  where campaign_slug = 'founding-cohort-1-wed-quiet' and step = 1;

-- 5. Orientation: each path from its Guide (the roster, canon-ve-guide-roster), the restaurant path to the business dashboard, the nonprofit
--    path not seasonal.
update ve_outreach_campaign_emails e set body = regexp_replace(e.body, '\n\nThe Vegans Explore team\s*$', E'\n\n' || g.sig), updated_at = now()
  from (values ('orientation-business', E'Maya\nThe Pre-Vegan Guide at Vegans Explore'), ('orientation-creator', E'Kai\nThe Creator Guide at Vegans Explore'),
    ('orientation-events', E'River\nThe Going Out Guide at Vegans Explore'), ('orientation-nonprofit', E'Dani\nThe Causes Guide at Vegans Explore'),
    ('orientation-restaurant', E'Liz\nThe Explorer, Vegans Explore'), ('orientation-explorer', E'Liz\nThe Explorer, Vegans Explore')) g(slug, sig)
  where e.campaign_slug = g.slug;
update ve_outreach_campaign_emails set body = replace(body, 'Your business dashboard shows who viewed your page and what they did next.',
    'Then your business dashboard opens (Dashboard, at the top of any page), and I walk you through Getting started: who viewed your page, what they did next, and posts made for you to share.'), updated_at = now()
  where campaign_slug = 'orientation-restaurant' and step = 1;
update ve_outreach_campaign_emails set body = replace(body, 'Our Holiday Guide has a Give back section that sends people to the organizations in our Directory, straight to each one''s own donation page.',
    'Our Guides send people to the organizations in our Directory, straight to each one''s own donation page, starting with the Holiday Guide''s Give back.'), updated_at = now()
  where campaign_slug = 'orientation-nonprofit' and step = 3;

-- 6. Welcome drafts: the creator kit and the group dashboard exist now.
update ve_outreach_campaign_emails set body = replace(body, 'Graphics and short videos you can share as an official creator are coming soon.',
    'Graphics and a short video made for you come with the creator dashboard, which we open for creators one at a time.'), updated_at = now()
  where campaign_slug = 'welcome-creator' and step = 1;
update ve_outreach_campaign_emails set body = replace(body, 'A path made just for group leaders is coming soon, and you''ll be among the first to hear.',
    'Once your group''s page is claimed, your dashboard opens: your page, your events, ways in for groups and your numbers, in one place.'), updated_at = now()
  where campaign_slug = 'welcome-group-leader' and step = 1;
