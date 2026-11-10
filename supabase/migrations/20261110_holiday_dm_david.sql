-- Holiday Guide to David Schwartzberg, organizer of South Florida Vegans (Facebook group), by Messenger (Sean, 2026-11-10: "let's plug him
-- in... put it under the holiday campaign... so we can track it too"). His own tracked link and a DM row in Founding Member Invite.
insert into ve_links (code, tags, label, active, channel, destination, initiative_slug, recipient_name)
values ('holiday-david-sfv', array['holiday-launch-2026','holiday-guide','group-organizer','south-florida-vegans'], 'Holiday Guide: Sean to David Schwartzberg (South Florida Vegans, Facebook group) by Messenger', true, 'dm', '/guides/holiday-guide', 'holiday-launch-2026', 'David Schwartzberg')
on conflict (code) do nothing;
insert into ve_campaign_dms (program_slug, channel, handle, opener, status, note, sort)
select 'holiday-launch-2026', 'facebook', 'David Schwartzberg',
'Hey David! Here''s the Holiday Guide I mentioned: recipes for the whole table, plant-based roasts at the store, holiday menus near you, and ways to give back this season. It''s free, so please share it with South Florida Vegans:

vegansexplore.com/go/holiday-david-sfv

And if anyone wants in early, becoming a Founding Member of Vegans Explore is free until January 1. Happy ThanksLiving!',
'to_send', 'Organizer of South Florida Vegans (Facebook group). He asked for the Holiday Guide. Clicks from his link count under holiday-david-sfv.', 1
where not exists (select 1 from ve_campaign_dms where program_slug = 'holiday-launch-2026' and handle = 'David Schwartzberg');

-- Sean, 2026-11-10: "he put it as a post on his board. We didn't actually communicate about the holiday guide, so this would be my first
-- outreach to him." First-contact wording: who Sean is, the post, the Guide, an easy invitation to share.
update ve_campaign_dms set opener =
'Hi David! It''s Sean from SoFlo Vegans and Vegans Explore. I saw your post in South Florida Vegans and thought this might help: we just put out a free Holiday Guide with recipes for the whole table, plant-based roasts at the store, holiday menus near you, and ways to give back this season.

vegansexplore.com/go/holiday-david-sfv

Feel free to share it with the group if it''s useful. Happy ThanksLiving!',
note = 'Organizer of South Florida Vegans (Facebook group). First outreach: he posted on his group''s board asking for something like this; we have not talked about the Guide. Clicks from his link count under holiday-david-sfv.'
where program_slug = 'holiday-launch-2026' and handle = 'David Schwartzberg';
