-- Events from Sean's screenshots (Sean, 2026-11-10: "merge it and add the events"), added through ve_event_intake as the team
-- ('admin', approved at once, author Sean's member), the same way as 20261108_holiday_sanctuary_events.sql. Each one's link is the
-- organizer's own page; the dates and times are from the organizer's own flyer. Safe to run twice: ve_event_intake skips a title
-- already on the calendar for that day. Left out: Tampa Bay VegFest (already listed), Vegan Wellness Retreats (organizer not verified).
select ve_event_intake(e, 'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', true) from (values
 (jsonb_build_object('title', 'Vegan Social Club: Dope Vegan Lunch in Boynton Beach',
   'description', 'Vegan Social Club meets for lunch at Dope Vegan''s Boynton Beach spot at Oceanfront Park. Everyone buys their own meal; bring beach clothes if you want to stay and swim after.',
   'starts_at', '2026-11-15T12:00:00-05:00', 'ends_at', '2026-11-15T14:00:00-05:00', 'location_name', 'Dope Vegan, Oceanfront Park',
   'city', 'Boynton Beach', 'state', 'FL', 'country', 'US', 'category', 'social',
   'organizer_name', 'Vegan Social Club', 'organizer_url', 'https://www.instagram.com/vegansocialclubsoflo/',
   'ticket_url', 'https://www.instagram.com/vegansocialclubsoflo/')),
 (jsonb_build_object('title', 'Food Revolution Network: Free Nutrition and Lifestyle Coaching Workshop',
   'description', 'A free three-part online workshop on plant-based nutrition and lifestyle coaching from Food Revolution Network, November 17 to 19. The last session introduces their paid coaching certificate.',
   'starts_at', '2026-11-17T12:00:00-05:00', 'ends_at', '2026-11-19T23:00:00-05:00', 'time_set', false, 'event_type', 'virtual',
   'virtual_url', 'https://certificate.foodrevolution.org/workshop/', 'category', 'workshop',
   'organizer_name', 'Food Revolution Network', 'organizer_url', 'https://foodrevolution.org',
   'ticket_url', 'https://certificate.foodrevolution.org/workshop/')),
 (jsonb_build_object('title', 'Free Vegan Roast Giveaway at Philadelphia City Hall',
   'description', 'Revolution Philadelphia hands out free Vegan roasts for ThanksLiving (Thanksgiving) at City Hall, facing Love Park, sponsored by PETA. Come early; they go fast.',
   'starts_at', '2026-11-21T12:00:00-05:00', 'location_name', 'City Hall, facing Love Park', 'address', '1400 John F Kennedy Blvd',
   'city', 'Philadelphia', 'state', 'PA', 'country', 'US', 'category', 'activism',
   'organizer_name', 'Revolution Philadelphia', 'organizer_url', 'https://www.instagram.com/revolution_philadelphia/',
   'ticket_url', 'https://www.instagram.com/revolution_philadelphia/')),
 (jsonb_build_object('title', 'DC Vegan ThanksLiving Prix Fixe Dinner',
   'description', 'A ThanksLiving prix fixe dinner at DC Vegan: a Vegan turkey plate, a Wellington hand pie and a budino for dessert. Prix fixe only, reservation required.',
   'starts_at', '2026-11-22T18:00:00-05:00', 'location_name', 'DC Vegan', 'city', 'Washington', 'state', 'DC', 'country', 'US', 'category', 'food',
   'host_listing_id', 'b18026b9-01b7-45c5-a84e-b6cb84c561cf', 'organizer_name', 'DC Vegan', 'organizer_url', 'https://dcvegan.com',
   'ticket_url', 'https://dcvegan.com')),
 (jsonb_build_object('title', 'Vegans in Clermont Friendsgiving Potluck Party',
   'description', 'A free Vegan potluck on Thanksgiving Day in Historic Downtown Clermont. Space is limited, so RSVP with Vegans in Clermont.',
   'starts_at', '2026-11-26T17:00:00-05:00', 'location_name', 'Historic Downtown Clermont', 'city', 'Clermont', 'state', 'FL', 'country', 'US',
   'category', 'meetup', 'organizer_name', 'Vegans in Clermont', 'organizer_url', 'https://www.instagram.com/vegansinclermont/',
   'ticket_url', 'https://www.instagram.com/vegansinclermont/')),
 (jsonb_build_object('title', 'Vegan Social Club Holiday Party and Potluck',
   'description', 'Vegan Social Club''s second holiday party: bring a holiday dish, a gift for the white elephant swap and your ugliest sweater. RSVP by December 17.',
   'starts_at', '2026-12-19T18:00:00-05:00', 'city', 'West Palm Beach', 'state', 'FL', 'country', 'US', 'category', 'social',
   'organizer_name', 'Vegan Social Club', 'organizer_url', 'https://www.instagram.com/vegansocialclubsoflo/',
   'ticket_url', 'https://www.instagram.com/vegansocialclubsoflo/'))
) v(e);
