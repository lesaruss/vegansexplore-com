-- canon-ve-front-of-house v16 (Sean, 2026-11-13, "Go ahead" on Logan's plan): Vegans Explore advertises, LESARUSS.ai sells.
-- Applied through the connector; kept here as the record. Safe to run once (version guard).
update knowledge_records set body = jsonb_set(body, '{sales_route_v16}', jsonb_build_object(
 'rule','Vegans Explore advertises; LESARUSS.ai sells. Vegans Explore focuses on promotion and small marketing services that lead up to managed services; Site, Managed and the services on the shopping list (photos, video, social, PR) are sold, priced and billed by LESARUSS.ai (LESARUSS Inc.). Every buy or sign-up button on Vegans Explore goes to LESARUSS.ai.',
 'shop','One clear shopping list on LESARUSS.ai (the talent shop, one price list for every brand): each item its price, what you get, a real example (photography shows the Green Leaf Kitchen photos), and Buy. Sell first, fill the back room with talent as demand comes.',
 'talent','Start finding photographers now: a paid job on the Opportunities board and a city-by-city list. Outreach stays paused; drafts go to Sean first.',
 'quote','We are routing them to LESARUSS.ai and not trying to offer services through Vegans Explore. Vegans Explore does enough... managed services, that is a completely LESARUSS AI thing. So the pricing should be governed by that. But we should have a clear shopping list.',
 'locked_by','Sean, 2026-11-13 ("Go ahead" on Logan''s plan)',
 'not_built','pricing_v9 Prices and checkout still live in the Vegans Explore Stripe account and on vegansexplore.com (closed to owners); move them to LESARUSS.ai.')),
 version = version + 1, updated_at = now(), updated_by = 'Logan', change_summary = 'sales_route_v16: Vegans Explore advertises, LESARUSS.ai sells (Sean 2026-11-13)'
where slug = 'canon-ve-front-of-house' and version = 15;
