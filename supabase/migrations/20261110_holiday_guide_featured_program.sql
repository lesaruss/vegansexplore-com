-- ve-holiday-guide: everyone the Holiday Guide features hears about it, each spotlighting what we feature (Sean, 2026-11-10: "I want
-- everybody that's mentioned in this holiday guide to be on this mailing list. And we just spotlight what we're showcasing. And that
-- honestly should be for all of our guides, but we start with holiday guide"). The Gift Guide program becomes "Featured in the Holiday
-- Guide": one group per kind of feature (Gift Guide brands, restaurants with holiday menus, Kosher Places), each its own email, and the
-- people with no published email in its DMs (warm opener first, the link once they reply). Raw Chef Carla, with no email, gets one DM
-- for both her menu and SoFlo Vegans Podcast episode 112 (Wed Nov 11, Liz's segment). Every group is a draft: nothing sends until Sean
-- presses Start. Emails were read from each place's own site (ve-outreach find_emails, 2026-11-10). Safe to run twice.

update public.ve_campaign_programs set name = 'Featured in the Holiday Guide',
  goal = 'Everyone the Holiday Guide features hears about it, with what we feature: the Gift Guide''s brands, the restaurants with holiday menus and the Kosher Places. Each can update what we show and claim their page free by Friday, November 20.',
  note = 'One group per kind of feature, each its own email; whoever has no published email is in DMs to send. The first program for a Guide''s features: every Guide gets one (Sean, 2026-11-10).'
where slug = 'gift-guide-2026';

insert into public.ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, audience, email_count, daily_pace, sender_brand, link_path, program_slug, start_on)
values
  ('holiday-guide-2026-menus', 'Featured: restaurants with holiday menus', 'business', '{}', false,
   'The places whose holiday menus are live in the Holiday Guide: your menu is in, here it is, tell us what to fix or add (an order link, an order-by date), claim free. Playbook ve-holiday-guide.',
   'draft', 'door', 1, 20, 'vegans-explore', '/directory/{slug}', 'gift-guide-2026', date '2026-11-11'),
  ('holiday-guide-2026-kosher', 'Featured: Kosher Places', 'business', '{}', false,
   'The places in the Holiday Guide''s Kosher Places (Hanukkah): you are in, tell us if anything is wrong, send a Hanukkah menu, claim free. Playbook ve-holiday-guide.',
   'draft', 'door', 1, 20, 'vegans-explore', '/directory/{slug}', 'gift-guide-2026', date '2026-11-11')
on conflict (slug) do nothing;

insert into public.ve_outreach_campaign_emails (campaign_slug, step, day_offset, subject, body) values
  ('holiday-guide-2026-menus', 1, 0, '{business} is in our Holiday Guide',
'Hi {first_name},

Good news: your holiday menu is in the Vegans Explore Holiday Guide, a free guide that helps people find Vegan holiday menus near them. Our team checked it and it is live, with your dishes and your page in our Directory:
{link}

Is anything out of date, or do you have a direct order link or an order-by date to add? Just reply and we will update it.

Claiming your page is free, and from there you can manage your menu yourself. Businesses that claim by Friday, November 20 get first pick of a few things we are planning for December.

Thank you for feeding our community this season.

The Vegans Explore team'),
  ('holiday-guide-2026-kosher', 1, 0, '{business} is in our Holiday Guide''s Kosher Places',
'Hi {first_name},

Good news: {business} is in Kosher Places, part of the free Vegans Explore Holiday Guide for Hanukkah. It helps people who keep kosher find Vegan and plant-based places, and it links to your page in our Directory:
{link}

If we have anything wrong, or your certification has changed, just reply and we will fix it. Cooking something for Hanukkah? Reply with your holiday menu and we will add it to the guide.

Claiming your page is free. Businesses that claim by Friday, November 20 get first pick of a few things we are planning for December.

Happy Hanukkah from the Vegans Explore team.')
on conflict do nothing;

-- Members: every featured place with a contact.
insert into public.ve_outreach_campaign_members (campaign_slug, listing_id, step, send_status)
select 'holiday-guide-2026-menus', x.listing_id, 0, 'waiting' from (
  select listing_id from public.ve_holiday_menus where status = 'live'
  union select listing_id from public.ve_holiday_menu_tips where status = 'live' and listing_id is not null) x
where exists (select 1 from public.ve_outreach_contacts c where c.listing_id = x.listing_id)
  and not exists (select 1 from public.ve_outreach_campaign_members m where m.campaign_slug = 'holiday-guide-2026-menus' and m.listing_id = x.listing_id);
insert into public.ve_outreach_campaign_members (campaign_slug, listing_id, step, send_status)
select 'holiday-guide-2026-kosher', l.id, 0, 'waiting' from public.listings l
where l.status = 'approved' and 'kosher' = any(coalesce(l.tags, '{}'))
  and exists (select 1 from public.ve_outreach_contacts c where c.listing_id = l.id)
  and not exists (select 1 from public.ve_outreach_campaign_members m where m.campaign_slug = 'holiday-guide-2026-kosher' and m.listing_id = l.id)
  and not exists (select 1 from public.ve_outreach_campaign_members m where m.campaign_slug = 'holiday-guide-2026-menus' and m.listing_id = l.id);

-- The trail: the two new emails join the program's steps.
insert into public.ve_campaign_program_steps (program_slug, n, day_offset, kind, channel, title, who, outreach_campaign, outreach_step, url, body, status) values
 ('gift-guide-2026', 7, 0, 'email', 'email', 'Your menu is in: the email', 'Restaurants with a holiday menu', 'holiday-guide-2026-menus', 1, null, null, 'draft'),
 ('gift-guide-2026', 8, 0, 'email', 'email', 'You are in Kosher Places: the email', 'The Kosher Places', 'holiday-guide-2026-kosher', 1, null, null, 'draft')
on conflict (program_slug, n) do nothing;
update public.ve_campaign_program_steps set title = 'Story: the Holiday Guide, tagging who we feature', who = 'Everyone featured' where program_slug = 'gift-guide-2026' and n = 1;
update public.ve_campaign_program_steps set who = 'Everyone featured with no published email' where program_slug = 'gift-guide-2026' and n = 3;

-- A personal tracked link for each DM (the click names them): their page in the Directory.
insert into public.ve_links (code, destination, initiative_slug, tags, channel)
select 'hg-' || l.slug, 'https://vegansexplore.com/directory/' || l.slug, 'gift-guide-2026', array['gift-guide-2026', 'holiday-guide', 'instagram-dm', l.slug], 'dm'
from public.listings l where l.slug in ('black-rican-vegan', 'la-llamita-vegana', 'rawchefcarla', 'anixi', 'bunniecakes', 'erin-mckennas-bakery', 'pow-pow-franklin-square', 'sentir-vegan-mexican-restaurant')
on conflict (code) do nothing;

-- The DMs: the featured places with Instagram and no published email (Nanas A Vegan, Pucker Up and Dikla Delicious have neither: reach
-- them by phone or Facebook). Raw Chef Carla's covers her menu and the podcast.
insert into public.ve_campaign_dms (program_slug, listing_id, handle, opener, follow_up, nudge, sort)
select 'gift-guide-2026', l.id, x.handle, x.opener,
  replace(x.follow_up, '{link}', 'vegansexplore.com/go/hg-' || l.slug), replace(x.nudge, '{link}', 'vegansexplore.com/go/hg-' || l.slug), x.sort
from (values
  ('rawchefcarla', 'rawchefcarla', 5,
   'Hi Carla! Two pieces of good news: your Pumpkin Chocolate cake is in the Vegans Explore Holiday Guide''s ThanksLiving menus 🎃🍫, and Liz features you on this Wednesday''s SoFlo Vegans Podcast. Can I send you the links?',
   'Here you go: your page with the menu is {link}, and the episode is on the SoFlo Vegans Podcast this Wednesday, November 11. Do you have an order link and an order-by date for the cake? Send them and we''ll add them, so people can order right from the guide. Claiming your page is free too.',
   'Hi again, Carla! Just making sure you saw your spot in our Holiday Guide: {link}. Happy ThanksLiving from the Vegans Explore team.'),
  ('black-rican-vegan', 'blackricanvegan', 50,
   'Hi Black Rican Vegan team! Your holiday menu is in the Vegans Explore Holiday Guide 🎉 Thank you for feeding our community. Can I send you the link to it?',
   'Here it is: {link}. Is anything out of date, or do you have an order link or an order-by date to add? Reply and we''ll update it. Claiming your page is free, and businesses that claim by Friday, November 20 get first pick of a few things we''re planning for December.',
   'Hi again! Just making sure you saw your menu in our Holiday Guide: {link}. Happy holidays from the Vegans Explore team.'),
  ('la-llamita-vegana', 'alex.giel', 60,
   'Hi! La Llamita Vegana''s holiday menu is in the Vegans Explore Holiday Guide 🎉 Thank you for feeding our community. Can I send you the link to it?',
   'Here it is: {link}. Is anything out of date, or do you have an order link or an order-by date to add? Reply and we''ll update it. Claiming your page is free, and businesses that claim by Friday, November 20 get first pick of a few things we''re planning for December.',
   'Hi again! Just making sure you saw your menu in our Holiday Guide: {link}. Happy holidays from the Vegans Explore team.'),
  ('anixi', 'anixinyc', 70,
   'Hi Anixi team! You''re in Kosher Places in the Vegans Explore Holiday Guide for Hanukkah 🕎 Thank you for what you make. Can I send you the link to your spot?',
   'Here it is: {link}. If we have anything wrong, or your certification has changed, reply and we''ll fix it. Cooking something for Hanukkah? Send your menu and we''ll add it. Claiming your page is free, and businesses that claim by Friday, November 20 get first pick of a few things we''re planning for December.',
   'Hi again! Just making sure you saw your spot in our Holiday Guide: {link}. Happy Hanukkah from the Vegans Explore team.'),
  ('bunniecakes', 'msbunniecakes', 80,
   'Hi BunnieCakes! You''re in Kosher Places in the Vegans Explore Holiday Guide for Hanukkah 🕎 Thank you for what you bake. Can I send you the link to your spot?',
   'Here it is: {link}. If we have anything wrong, or your certification has changed, reply and we''ll fix it. Baking something for Hanukkah? Send your menu and we''ll add it. Claiming your page is free, and businesses that claim by Friday, November 20 get first pick of a few things we''re planning for December.',
   'Hi again! Just making sure you saw your spot in our Holiday Guide: {link}. Happy Hanukkah from the Vegans Explore team.'),
  ('erin-mckennas-bakery', 'erinmckennasbakery', 90,
   'Hi Erin McKenna''s team! Your bakeries are in Kosher Places in the Vegans Explore Holiday Guide for Hanukkah 🕎 Thank you for what you bake. Can I send you the link?',
   'Here it is: {link}. If we have anything wrong, or your certification has changed, reply and we''ll fix it. Baking something for Hanukkah? Send your menu and we''ll add it. Claiming your page is free, and businesses that claim by Friday, November 20 get first pick of a few things we''re planning for December.',
   'Hi again! Just making sure you saw your spot in our Holiday Guide: {link}. Happy Hanukkah from the Vegans Explore team.'),
  ('pow-pow-franklin-square', 'eatpowpow', 100,
   'Hi Pow Pow team! You''re in Kosher Places in the Vegans Explore Holiday Guide for Hanukkah 🕎 Thank you for what you make. Can I send you the link to your spot?',
   'Here it is: {link}. If we have anything wrong, or your certification has changed, reply and we''ll fix it. Cooking something for Hanukkah? Send your menu and we''ll add it. Claiming your page is free, and businesses that claim by Friday, November 20 get first pick of a few things we''re planning for December.',
   'Hi again! Just making sure you saw your spot in our Holiday Guide: {link}. Happy Hanukkah from the Vegans Explore team.'),
  ('sentir-vegan-mexican-restaurant', 'sentirnyc', 110,
   'Hi Sentir team! You''re in Kosher Places in the Vegans Explore Holiday Guide for Hanukkah 🕎 Thank you for what you make. Can I send you the link to your spot?',
   'Here it is: {link}. If we have anything wrong, or your certification has changed, reply and we''ll fix it. Cooking something for Hanukkah? Send your menu and we''ll add it. Claiming your page is free, and businesses that claim by Friday, November 20 get first pick of a few things we''re planning for December.',
   'Hi again! Just making sure you saw your spot in our Holiday Guide: {link}. Happy Hanukkah from the Vegans Explore team.')
) x(slug, handle, sort, opener, follow_up, nudge)
join public.listings l on l.slug = x.slug and l.status = 'approved'
on conflict (program_slug, listing_id, channel) do nothing;
