-- Outreach home rebuild (Sean, 2026-11-10 BOSS audit, "build it"): every send belongs to a campaign card. ThanksLiving's two groups and the
-- always-on welcome and orientation notes become campaigns (programs) so the home shows four campaigns, not 28 rows. Applied 2026-11-10.
insert into ve_campaign_programs (slug, name, goal, start_on, end_on, status, note) values
 ('thanksliving-menus-2026', 'ThanksLiving menus', 'Restaurants send their holiday menus for the Holiday Guide.', '2026-11-10', '2026-11-26', 'live', 'Groups: 100% Vegan places, plant-based options.'),
 ('always-on', 'Always on: welcome and orientation', 'Each person gets these the day they join and as they earn a path badge.', '2026-11-08', '2027-12-31', 'live', 'Welcome to the community, the welcome by path drafts and the six orientations.')
on conflict (slug) do nothing;
update ve_outreach_campaigns set program_slug = 'thanksliving-menus-2026' where slug in ('thanksliving-2026-vegan','thanksliving-2026-plant');
update ve_outreach_campaigns set program_slug = 'always-on' where slug like 'welcome-%' or slug like 'orientation-%';
