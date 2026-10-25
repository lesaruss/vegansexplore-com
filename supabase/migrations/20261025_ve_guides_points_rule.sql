-- Pricing, points and levels (Sean locked 2026-10-25, playbook ve-pricing-points-passport), the data side.
-- Step "guides": the paid Guides move from credits to $11 or 1,100 points. Run only once the Guide pages and ve-guide-unlock
-- that understand the points rule are live, so a buy button is never broken in between.
-- Step "words": what the Guides tell members (ve-guide-platform-facts, guide_kb_answers) and canon-ve-guide-pricing.

-- step: guides
update public.ve_guides set access_rule = 'points', cost_lesars = 1100 where access_rule = 'credit';

-- step: words
update public.knowledge_records set
 body = jsonb_set(body, '{facts}', to_jsonb(
   replace(replace(replace(replace(body->>'facts',
   $a$It is the Passport: it comes with 1 Guide credit, voting in the Directory and a dashboard to build your Vegan world with our tools. People can give more if they want to help build faster. Money never becomes points: points are earned. After joining, members buy only what they want: Guide credits, merchandise and event tickets.$a$,
   $b$It is the Passport: it comes with 1,100 welcome points (one Guide's worth, to spend on a Guide or anything else points do), voting in the Directory and a dashboard to build your Vegan world with our tools. People can give more if they want to help build faster. $11 is the price of admission: any purchase of $11 or more (a Guide, a tour ticket) also makes someone a member, without the welcome points. Points are never bought. After joining, members buy only what they want: Guides, merchandise and event tickets.$b$),
   $a$- Guides: each Guide is 1 Guide credit, and Guide credits are $11 each (Buy Guide credits on the dashboard). The Founding Membership comes with a credit, so joining unlocks a first Guide of your choice.$a$,
   $b$- Guides: each paid Guide is $11, or 1,100 points. Anyone with a free account can buy one, and buying it makes them a member. The Passport's 1,100 welcome points cover a first Guide of your choice.$b$),
   $a$Points pay for talking with your Guide (4 points a message), and 2,500 points become 1 Guide credit. Guides never cost points directly.$a$,
   $b$Every purchase also earns a 25-point thank-you. Points unlock a Guide (1,100), pay for talking with your Guide (4 points a message), and can be contributed to a business or nonprofit on its Directory page as a boost. Lifetime points set your level: Level 1, Level 2 from 2,500, Level 3 from 10,000; spending or contributing points never lowers your level.$b$),
   $a$- Passport: the Passport is the $11 one-time Founding Membership, not a monthly plan. It comes with 1 Guide credit, never points. There is no monthly Passport to offer.$a$,
   $b$- Passport: the Passport is the $11 one-time Founding Membership, not a monthly plan, and it comes with 1,100 welcome points. There is no monthly Passport and there are no Guide credits.$b$))),
 version = version + 1, updated_at = now(), updated_by = 'Logan',
 change_summary = 'Sean, 2026-10-25 (playbook ve-pricing-points-passport): $11 is the price of admission; Guides $11 or 1,100 points; the Passport with 1,100 welcome points; 25-point thank-you per purchase; points never bought; levels on lifetime points; credits retired.'
where slug = 've-guide-platform-facts' and body->>'facts' like '%Guide credits are $11 each%';

update public.guide_kb_answers a set answer = v.answer, updated_at = now()
from (values
  ('How many points do I start with?', $x$The Passport ($11, one time) comes with 1,100 welcome points: enough for a Guide, or use them any way points work. After that you earn points by taking part: Bounties, competitions and what you do in the community.$x$),
  ('What is Passport?', $x$Passport is your $11, one-time Founding Membership: it never renews. It comes with 1,100 welcome points (one Guide's worth), voting in the Directory and your dashboard to build your Vegan world. After that you buy only what you want: Guides, merchandise and event tickets.$x$),
  ('What do I get as a member?', $x$Members get their Passport and 1,100 welcome points, vote in the Directory, post and reply on the Community Board, see members' contact details, and get their own dashboard with a Guide. Points come from taking part, and lifetime points move you up through Level 1, 2 and 3.$x$),
  ('Can I give more than $11?', $x$Yes. When you join you can pick $11, $25, $50, $111 or another amount, if you want to help us build faster. Any amount brings your Passport and your 1,100 welcome points.$x$),
  ('Can I buy points packages?', $x$No. Points are never bought: they come from joining, taking part (Bounties, competitions, the community) and a small thank-you on every purchase. If you want a Guide now, it is $11.$x$),
  ('How can I add points with money?', $x$Points cannot be bought. Each purchase gives a 25-point thank-you, and the rest come from taking part: Bounties, competitions and community activity. A Guide is $11, or 1,100 points.$x$),
  ('Can I contribute again after I join?', $x$Yes. Active members have a Contribute button on the dashboard for $11 or more, to help us build faster, and it comes with a 25-point thank-you. It is a contribution to our community, not a tax-deductible donation.$x$)
) as v(question, answer)
where a.question = v.question and a.status in ('live', 'draft');

update public.knowledge_records set
 body = body || jsonb_build_object(
   'rule', $r$$11 is the price of admission: any purchase of $11 or more (the Passport, a Guide, a tour ticket, merchandise) makes the buyer a member. Every paid Guide is $11 or 1,100 points, and a Guide a member unlocks is theirs to keep. The Passport ($11, one time, never renews) comes with 1,100 welcome points; joining through another purchase gets the membership and that purchase, without welcome points. Every purchase earns a flat 25-point thank-you. Points are only given, never bought. Lifetime points (member_points.total_points) set the level: Level 1, Level 2 from 2,500, Level 3 from 10,000; spending or contributing points never lowers a level. Members can contribute points to a business or nonprofit on its listing as a boost, never money. Guide chat costs 4 points a message. Free Guides (the Welcome Guide and the Partner Guide) are open to everyone. There are no Guide credits and no monthly Passport.$r$,
   'why', $w$Sean, 2026-10-25: "Why can't we just say the guides are $11, whether you're a member or not, and you just purchase the guide?... $11 is the price of becoming a part of our community... the points are used to level them up... I think they get X amount of points in order to purchase a guide or use it in other ways." Credits were a third currency to learn; points that are given, never bought, carry the flexibility without a cash rate.$w$,
   'built', $b$2026-10-25: migrations 20261025_ve_points_levels_admission.sql (ve_points_grant, ve_purchase_thanks, ve_member_admit, ve_guide_purchase_paid admits and thanks, ve_member_level, ve_listing_contribute, ve_listing_points; trg_ve_founding_credit dropped) and 20261025_ve_guides_points_rule.sql (Guides to access_rule points at 1,100). ve-stripe-webhook gives the Passport's 1,100 welcome points and the 25-point thank-you; ve-guide-unlock sells a points-rule Guide for $11 and retires buy_credits; ve-tours admits and thanks a tour buyer. The Passport page is the Passport Guide.$b$,
   'supersedes', 'v4 (Guide credits, 2026-10-10 and the morning of 2026-10-25), replaced by the playbook ve-pricing-points-passport, locked by Sean 2026-10-25.'),
 version = version + 1, updated_at = now(), updated_by = 'Logan',
 change_summary = 'Sean locked 2026-10-25 (playbook ve-pricing-points-passport): credits retired; Guides $11 or 1,100 points; Passport with 1,100 welcome points; $11 admission on any purchase; 25-point thank-you; levels on lifetime points.'
where slug = 'canon-ve-guide-pricing' and body->>'rule' not like '$11 is the price of admission%';
