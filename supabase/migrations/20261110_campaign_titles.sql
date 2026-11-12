-- Sean, 2026-11-10: "It's written like a sentence... To me, it's a title. And not a very succinct title at that." Campaign, part and group
-- names are short Title Case titles. Applied 2026-11-10.
update ve_campaign_programs set name = v.n, part_name = v.p from (values
 ('holiday-launch-2026','Holiday Guide Launch','Founding Member Invite'),
 ('thanksliving-menus-2026','ThanksLiving Menus','ThanksLiving Menus'),
 ('gift-guide-2026','Holiday Gift Guide: Featured Brands','Gift Guide Brands'),
 ('founding-cohort-1','Founding Cohort 1',null),
 ('always-on','Always On: Welcome and Orientation',null)
) v(s,n,p) where slug = v.s;
update ve_outreach_campaigns set name = v.n from (values
 ('holiday-launch-registered','Holiday Launch: Registered Members'),('holiday-launch-business','Holiday Launch: Businesses and Partners'),
 ('holiday-launch-creator','Holiday Launch: Creators and Media'),('holiday-launch-foodie-fest','Holiday Launch: Vegan Foodie Fest Miami'),
 ('holiday-launch-explore','Holiday Launch: Everyone Else'),('thanksliving-2026-plant','ThanksLiving 2026: Plant-Based Options'),
 ('thanksliving-2026-vegan','ThanksLiving 2026: 100% Vegan Places'),('honest-cuban-comment-2026-11','ThanksLiving 2026: Honest Cuban by VCC'),
 ('gift-guide-2026-selected','Gift Guide 2026: You Were Picked'),('gift-guide-2026-claimed','Gift Guide 2026: After They Claim'),
 ('holiday-guide-2026-kosher','Featured: Kosher Places'),('holiday-guide-2026-menus','Featured: Holiday Menus'),
 ('founding-cohort-1-2026-11','Founding Cohort 1: The Invitation'),('founding-cohort-1-wed-clicked','Founding Cohort 1: Follow-Up, Clicked'),
 ('founding-cohort-1-wed-opened','Founding Cohort 1: Follow-Up, Opened'),('founding-cohort-1-wed-quiet','Founding Cohort 1: Follow-Up, No Open'),
 ('orientation-business','Orientation: Business Path'),('orientation-creator','Orientation: Creator Path'),('orientation-events','Orientation: Event Host Path'),
 ('orientation-explorer','Orientation: Explorer'),('orientation-nonprofit','Orientation: Nonprofit Path'),('orientation-restaurant','Orientation: Restaurant Path'),
 ('welcome-community','Welcome: Everyone Who Joins'),('welcome-business','Welcome: Businesses'),('welcome-creator','Welcome: Creators'),('welcome-events','Welcome: Event Hosts'),
 ('welcome-group-leader','Welcome: Group Leaders'),('welcome-nonprofit','Welcome: Nonprofits'),('welcome-restaurant','Welcome: Restaurants')
) v(s,n) where slug = v.s;
