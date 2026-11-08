-- ve-demo-showroom and ve-front-of-house: Sean's answers, 2026-11-08. Applied through the connector. Safe to run once (inserts).
-- 1. Community page: points unlock rewards the owner sets (a coupon, a giveaway), not money off at checkout. A Rewards section of
--    items, limited quantity or first come first served; we suggest rewards. 2. The restaurant's club is a Guide on Vegans Explore,
--    so customers flow between the restaurant and the community (no stored value, no rolling credit). 3. The Community Manager's
--    one-time onboarding fee on BrandDesk Site is $150 per client.
insert into playbook_records (slug, brand_slug, author, kind, source, body) values
('ve-demo-showroom', 'vegans-explore', 'Logan', 'decision', 'text',
 to_jsonb('ve-demo-showroom: Community page decided (Sean, 2026-11-08: "maybe the points just unlock a coupon or a giveaway or something, and the owner can set what that is... take it out of the checkout... a section where they can choose different items that may be first come, first serve or limited quantity. The club is essentially just another guide going into Vegans Explore"). Rewards: members spend points to unlock a reward the owner sets (a free item, a coupon, a giveaway, a seat at an event), each with a points price and a quantity, first come first served; we suggest rewards; never cash, never at checkout. The club is a Guide on Vegans Explore (no paid club, no rolling credit, so no stored value). Check-ins every two weeks: not answered, held. Built first in the sample site only.'::text)),
('ve-front-of-house', 'vegans-explore', 'Logan', 'decision', 'text',
 to_jsonb('ve-front-of-house: Community Manager onboarding fee on BrandDesk Site set at $150 per client, paid once (Sean, 2026-11-08: "The 150 works for me for the setup"). Completes pricing_v9; next is the pricing build (Stripe, /business/managed, the pitch page, /business, the agreement, the Guides facts).'::text));
update knowledge_records set version = 10, updated_at = now(), updated_by = 'logan',
 change_summary = 'v10 2026-11-08: Community Manager onboarding fee on Site set at $150 per client (Sean). Community page on managed sites: points unlock owner-set rewards (limited, first come), never money off at checkout; the club is a Guide on Vegans Explore.',
 body = jsonb_set(body, '{pricing_v9,community_manager_pay}', to_jsonb('On Site: a one-time onboarding fee of $150 per client (Sean, 2026-11-08), not $250 a month.'::text))
        || jsonb_build_object('community_page_v10', jsonb_build_object(
   'locked_by', 'Sean, 2026-11-08',
   'rewards', 'Members spend Vegans Explore points to unlock rewards the owner sets (a free item, a coupon, a giveaway, a seat at an event). Each reward has a points price and a quantity, first come first served. We suggest rewards. Never cash, never money off at checkout.',
   'club', 'The restaurant club is a Guide on Vegans Explore, so customers flow between the restaurant and the community. No paid club and no rolling credit (no stored value).',
   'not_built', 'Live rewards (a table, redemption, the owner setting them on their dashboard); only the sample site shows it.'))
 where slug = 'canon-ve-front-of-house' and status = 'active';
