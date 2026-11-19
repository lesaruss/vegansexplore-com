-- Founding Members: Community Groups (Sean, 2026-11-19: "I want to stagger our email blasts on Meetup... Broward today and then regroup to
-- do the other ones on the other days"). A program in HQ Outreach > Campaigns with the three Meetup blasts as dated steps (Broward Nov 19,
-- Palm Beach Nov 23, Miami Nov 25), one tracked link per group, all landing on /hello?b=meetup. Applied 2026-11-19 through the connector.
insert into ve_links (code, destination, label, tags, channel, initiative_slug, active) values
('mu-blast-broward','https://vegansexplore.com/hello?b=meetup','Meetup blast: Vegans Explore Broward (Nov 19)', array['meetup','meetup-blast','broward','founding-member-series'],'social','founding-groups-2026',true),
('mu-blast-palm-beach','https://vegansexplore.com/hello?b=meetup','Meetup blast: Vegans Explore Palm Beach (Nov 23)', array['meetup','meetup-blast','palm-beach','founding-member-series'],'social','founding-groups-2026',true),
('mu-blast-miami','https://vegansexplore.com/hello?b=meetup','Meetup blast: Vegans Explore Miami (Nov 25)', array['meetup','meetup-blast','miami','founding-member-series'],'social','founding-groups-2026',true),
('tr-vimeo','https://vegansexplore.com/passport?guide=welcome&from=trailer','Trailer description: Vimeo', array['trailer','vimeo'],'social','trailer-2026',true),
('tr-youtube','https://vegansexplore.com/passport?guide=welcome&from=trailer','Trailer description: YouTube', array['trailer','youtube'],'social','trailer-2026',true),
('tr-facebook','https://vegansexplore.com/passport?guide=welcome&from=trailer','Trailer post: Facebook', array['trailer','facebook'],'social','trailer-2026',true),
('mu-broward','https://vegansexplore.com/hello?b=meetup','Meetup group About: Vegans Explore Broward', array['meetup','meetup-about','broward'],'social','meetup-groups',true),
('mu-palm-beach','https://vegansexplore.com/hello?b=meetup','Meetup group About: Vegans Explore Palm Beach', array['meetup','meetup-about','palm-beach'],'social','meetup-groups',true),
('mu-miami','https://vegansexplore.com/hello?b=meetup','Meetup group About: Vegans Explore Miami', array['meetup','meetup-about','miami'],'social','meetup-groups',true)
on conflict (code) do nothing;
insert into ve_campaign_programs (slug, name, goal, start_on, end_on, status, note) values
('founding-groups-2026','Founding Members: Community Groups','Bring the people in our Meetup, Facebook and WhatsApp groups onto the platform as Founding Members before January 1, 2027, with "This time, it''s built" and Sean''s landing note (/hello?b=<group>).','2026-11-19','2026-12-31','live','Sean, 2026-11-19: stagger the Meetup blasts, Broward today, Palm Beach Monday, Miami Wednesday, regrouping between each.')
on conflict (slug) do nothing;
-- Steps 1 to 4 (Broward approved with its message, Palm Beach and Miami draft, the landing page live) were inserted the same day; see the
-- program in HQ for the message text.
