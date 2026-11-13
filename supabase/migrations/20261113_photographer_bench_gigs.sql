-- 2026-11-13: two paid photographer jobs on the Opportunities board (Gig Board), Fort Lauderdale (South Florida chapter) and
-- Philadelphia first. Sean, 2026-11-13: "if somebody wants to purchase photography... we should be reaching out from now to find
-- those people" (canon canon-ve-front-of-house v16 sales_route_v16, talent). The shop sells photos (lesaruss.ai/shop/photos); these
-- jobs build the bench that shoots them. Pay uses the photographer-gig defaults in ve-bounties (SHOOT_DEFAULTS): a $75 paid trial of
-- three dishes shot to the standard, then each booked shoot paid at the rate the photographer quotes. Safe to run twice.
insert into public.ve_bounties (community_slug, kind, gig_kind, apply_mode, asks, title, brief, deliverable, points, slots, cash_cents,
  partner_name, status, apply_by, claims_close_at, due_at, audition_prompt, example_url, remote)
select c.slug, 'photos', 'photo', 'apply', array['pitch','examples','rate','trial'],
  'Food photographer: ' || c.city || ' (paid)',
  'LESARUSS.ai, the marketing company behind Vegans Explore, is building a bench of food photographers in ' || c.city || '. ' ||
  'Restaurants and food businesses book photo shoots through us: up to 8 dishes and the space, every photo to one standard (the same surface, angle and light for every dish, plated the way it leaves the kitchen, delivered full size at 4:5, 1:1 and 16:9). ' ||
  'Apply with a short pitch, two or three links to your food work, and your rate for a shoot like that. We pick a few for a paid trial: three dishes we name, shot to the standard ($75). ' ||
  'Pass it and you join the bench: we book you for shoots in ' || c.city || ', paid at your agreed rate, and the photos go to the client with copyright assigned. See the standard: https://vegansexplore.com/business/sample/shoot',
  'A pitch, two or three examples and your rate; if picked, three trial photos shot to the standard', 250, 6, 7500,
  'LESARUSS.ai', 'open', timestamptz '2026-12-04 23:59:00-05', timestamptz '2026-12-04 23:59:00-05', timestamptz '2026-12-18 23:59:00-05',
  'A paid trial ($75): three dishes we name, shot to the standard on the shot list. Send the link to the folder.',
  'https://vegansexplore.com/business/sample/shoot', false
from (values ('south-florida', 'Fort Lauderdale'), ('philadelphia', 'Philadelphia')) as c(slug, city)
where not exists (select 1 from public.ve_bounties b where b.title = 'Food photographer: ' || c.city || ' (paid)' and b.status <> 'canceled');
