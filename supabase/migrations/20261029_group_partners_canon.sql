-- Group Partners (LOCKED by Sean 2026-10-29: "lock it, go with your defaults"). Concept session with V; canon canon-ve-group-partners,
-- playbook ve-group-partners. Nothing is built yet: this records the decision.
insert into public.knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary, body)
select 'canon-ve-group-partners',
  'Vegans Explore Group Partners: social groups host on Vegans Explore and earn 20% up to 50% (LOCKED by Sean 2026-10-29)',
  'decisions', 'partners', 'active', 'sar', false, 50,
  array['vegans-explore','groups','partners','affiliate','events','ticketing'], 1, 'v', 'v',
  'Locked with V''s defaults (Sean: "lock it, go with your defaults").',
  jsonb_build_object(
    'rule', 'A Group Partner is a community group (its Directory listing, Community > Groups: social clubs, meetup and potluck groups) that hosts its community and events on Vegans Explore and brings us members. The group is the partner; one organizer is the lead on the account. The same structure runs our own communities later.',
    'name', 'Group Partners, beside Nonprofit Partners and Ambassadors. Never "Community Partner" (a retired listing term).',
    'lead', 'A complimentary Founding Membership for the organizer when the group says yes; their own standing (level, link, points) is unchanged, as with Nonprofit Partners.',
    'group_gets', 'A community page (its members, its events, its board), events on its page and the calendar with its history, our ads driving people to it, featured community status, preferential bounties, and anyone anywhere can join it (a member in California can join a South Florida group).',
    'commission', 'A share of every $11 Passport (and Guide) bought through the group''s link, by lifetime members brought in: 20% to start, 25% at 25, 30% at 75, 35% at 150, 40% at 300, 45% at 600, 50% at 1,000 (the cap). A new rate applies to joins from the day it is reached, never back-paid. At 50% we keep about $4.90 a member after card fees.',
    'tickets', 'Our fee is 5% of each paid ticket, free events free, card processing passed to the buyer, and the group may pass our 5% to the buyer too. The rest of the ticket goes to the group. Reasoning (2026 rates): Eventbrite 3.7% + $1.79 plus 2.9% processing, Luma free plan 5%, Posh 10% + $0.99, Partiful reported about 10% + $2 (by Luma, a competitor; Partiful does not publish it). Sean''s first idea was 2%; 5% still undercuts where these groups are now. As a group climbs, its commission rises; the ticket fee stays 5%.',
    'guest_pass', 'A non-member may attend one of a group''s free events; from their second event they join with the $11 Passport. Paid-ticket events need the Passport from the start.',
    'exclusivity', 'Every group is listed with its events whatever it does. Hosting its events exclusively on Vegans Explore and sharing its link is the condition for the commission ladder, featured status, our ads and preferential bounties; it is earned into, not the price of being listed.',
    'payouts', 'Paid to the group after a W-9 (the organizer''s when the group has no entity) once $25 is ready, held 30 days for refunds (the affiliate defaults). Worded as referral earnings; shared posts say the group earns when you join (FTC).',
    'prototype', 'The Vegan Social Club (South Florida, vegan-social-club-south-florida) first; Philly Vegan Social Club second.',
    'build', 'Our own ticketing (Stripe Connect payouts to each group, ticket types, refunds, check-in; today members-only tickets only link out), the group community page (members, board), the guest pass, the commission ladder on the affiliate engine (ve_affiliate_earn), the invitation (Depot > People, like Nonprofit Partners), the policy text and the Guides'' facts.',
    'not_decided', 'Whether lifetime counts reset; what featured placement and the ad support include; ticket refund rules.',
    'playbook', 've-group-partners')
where not exists (select 1 from public.knowledge_records where slug = 'canon-ve-group-partners');

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-group-partners', 'vegans-explore', 'V',
  'Locked by Sean 2026-10-29 ("lock it, go with your defaults"). Group Partners: a community group hosts its community and events on Vegans Explore and brings us members. Its organizer is comped a Founding Membership. Commission on Passports and Guides bought through its link: 20%, then 25 / 30 / 35 / 40 / 45 / 50% at 25 / 75 / 150 / 300 / 600 / 1,000 lifetime members (from the day reached, never back-paid). Tickets: our fee 5% (free events free, processing passed to the buyer, the group may pass our fee on), the rest to the group. Guest pass: one free event as a non-member, the Passport from the second. Exclusivity is earned into: it unlocks the ladder, featured status, our ads and preferential bounties; every group stays listed regardless. Payouts after a W-9 at $25, 30-day hold. Prototype: the Vegan Social Club (South Florida), then Philly Vegan Social Club. Canon canon-ve-group-partners.',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-group-partners' and kind = 'decision');
