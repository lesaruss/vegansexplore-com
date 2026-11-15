-- Sean, 2026-11-15: "at this point, I think we shift to how to Christmas, and then the secondary is we still have a few days if you want to
-- submit for Thanksgiving... the push is more of for Christmas, and then once they show interest, then when they land and claim, then they get
-- information about the 11 days of giving." Christmas Menus, copied from ThanksLiving Menus (thanksliving-menus-2026, the template): the same
-- two groups (100% Vegan places, places with plant-based (Pre-Vegan) options), the same people (the 89 places that got the ThanksLiving ask;
-- none has a Christmas menu yet), the same menu form opened on Christmas. Christmas menus close at the end of Monday, December 14
-- (ve_holidays.submit_close 2026-12-15 05:00 UTC); ThanksLiving at the end of Wednesday, November 18 (the secondary line). DRAFTS: not
-- approved and emails not locked, so nothing sends until Sean approves in HQ. 11 Days of Giving rides after the claim, once it is built and
-- locked (playbook ve-holiday-guide 2026-11-13), never in this email. Safe to run twice.
insert into public.ve_campaign_programs (slug, name, goal, start_on, end_on, status, note, parent_slug, part_name, sort)
values ('christmas-menus-2026', 'Christmas Menus',
  'Restaurants send their Christmas menus for the Holiday Guide (the push), with a last call for ThanksLiving menus (the secondary). Once they claim, their dashboard shows 11 Days of Giving.',
  '2026-11-17', '2026-12-14', 'draft', 'Groups: 100% Vegan places, plant-based options. Copied from ThanksLiving Menus. Sean, 2026-11-15.',
  'holiday-launch-2026', 'Christmas Menus', 3)
on conflict (slug) do nothing;

insert into public.ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace,
  sender_brand, link_path, program_slug)
values
 ('christmas-2026-vegan', 'Christmas 2026: 100% Vegan Places', 'restaurant', '{}', true,
  'The Christmas menu note, version A (100% Vegan), with a last call for ThanksLiving. From the team. Christmas menus close end of Mon Dec 14. Playbook ve-holiday-guide. Sean, 2026-11-15: "the push is more of for Christmas".',
  'draft', '2026-11-17', '{}', 'door', 1, 60, 'vegans-explore', '/business/holiday-menu?listing={slug}&holiday=christmas', 'christmas-menus-2026'),
 ('christmas-2026-plant', 'Christmas 2026: Plant-Based Options', 'restaurant', '{}', false,
  'The Christmas menu note, version B (places with plant-based options), with a last call for ThanksLiving. From the team. Christmas menus close end of Mon Dec 14. Playbook ve-holiday-guide. Sean, 2026-11-15: "the push is more of for Christmas".',
  'draft', '2026-11-17', '{}', 'door', 1, 60, 'vegans-explore', '/business/holiday-menu?listing={slug}&holiday=christmas', 'christmas-menus-2026')
on conflict (slug) do nothing;

insert into public.ve_outreach_campaign_emails (campaign_slug, step, day_offset, subject, body)
values
 ('christmas-2026-vegan', 1, 0, 'Feature your Christmas menu on Vegans Explore',
  E'Hi {first_name},\n\nPeople{in_city} are already planning Christmas dinner, and a lot of them would rather order it from a place like {business} than cook it all themselves.\n\nOur free Holiday Guide puts Vegan holiday menus in front of them, chapter by chapter. Send us your Christmas menu (what you''re making, your order-by date and your hours on the day) and we feature {business} in it, 100% Vegan places first.\n\nIt takes a few minutes. You can type your dishes, add photos, or drop a photo or PDF of your menu and we read it for you:\n{link}\n\nChristmas menus close at the end of Monday, December 14. Cooking for ThanksLiving too? There is still time: ThanksLiving menus close at the end of Wednesday, November 18, and the same link takes both (pick the holiday at the top).\n\nMembership is free with a short survey, and claiming your page is free for members.\n\nThank you for feeding our community.\n\nThe Vegans Explore team'),
 ('christmas-2026-plant', 1, 0, 'Feature your plant-based Christmas menu on Vegans Explore',
  E'Hi {first_name},\n\nPeople{in_city} are planning Christmas dinner, and many want a plant-based (Pre-Vegan) option they can order rather than cook.\n\nOur free Holiday Guide shows holiday menus from places near them, chapter by chapter. If {business} is offering plant-based dishes for Christmas, send them to us (what you''re making, your order-by date and your hours on the day) and we feature them as your plant-based (Pre-Vegan) holiday menu.\n\nIt takes a few minutes. You can type your dishes, add photos, or drop a photo or PDF of your menu and we pick out the plant-based dishes for you:\n{link}\n\nChristmas menus close at the end of Monday, December 14. Offering plant-based dishes for ThanksLiving too? There is still time: ThanksLiving menus close at the end of Wednesday, November 18, and the same link takes both (pick the holiday at the top).\n\nMembership is free with a short survey, and claiming your page is free for members.\n\nThank you for making room at the table.\n\nThe Vegans Explore team')
on conflict do nothing;

-- The same people as ThanksLiving, group for group, minus any place that has sent a Christmas menu since.
insert into public.ve_outreach_campaign_members (campaign_slug, listing_id, step, send_status)
select replace(m.campaign_slug, 'thanksliving-', 'christmas-'), m.listing_id, 0, 'waiting'
  from public.ve_outreach_campaign_members m
 where m.campaign_slug in ('thanksliving-2026-vegan', 'thanksliving-2026-plant') and m.removed_at is null
   and not exists (select 1 from public.ve_holiday_menus h where h.listing_id = m.listing_id and h.holiday_slug = 'christmas')
   and not exists (select 1 from public.ve_outreach_campaign_members x where x.campaign_slug = replace(m.campaign_slug, 'thanksliving-', 'christmas-')
                   and x.listing_id = m.listing_id and x.removed_at is null);
