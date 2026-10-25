-- What the Guides say about joining, credits and points (Sean, 2026-10-25). The $11, one time, is the Passport and comes
-- with 1 Guide credit, never points; Guide credits are $11 each; points are only earned (Bounties, competitions, activity);
-- no monthly Passport; businesses get advertising, sponsorships and marketing services as members.
-- ve-guide-platform-facts is copied into every Guide's behavior_rules by its trigger; guide_kb_answers are the free answers.

update public.knowledge_records set
 body = jsonb_set(body, '{facts}', to_jsonb(
   replace(replace(replace(replace(replace(body->>'facts',
   $a$People can give more if they want to help build faster. Every dollar becomes 100 points, so $11 starts someone with 1,100 points.$a$,
   $b$It is the Passport: it comes with 1 Guide credit, voting in the Directory and a dashboard to build your Vegan world with our tools. People can give more if they want to help build faster. Money never becomes points: points are earned. After joining, members buy only what they want: Guide credits, merchandise and event tickets.$b$),
   $a$- Guides: each Guide is $11 or 1 Guide credit, and the Founding Membership comes with a credit, so joining unlocks a first Guide of your choice.$a$,
   $b$- Guides: each Guide is 1 Guide credit, and Guide credits are $11 each (Buy Guide credits on the dashboard). The Founding Membership comes with a credit, so joining unlocks a first Guide of your choice.$b$),
   $a$- Points: points pay for talking with your Guide (4 points a message), and 2,500 points become 1 Guide credit. Guides never cost points directly.$a$,
   $b$- Points: points are only earned, never bought, from a growing list of activities that keep the community active: Bounties, competitions and campaigns, and taking part in the community and on the site. Ways to earn include: complete your onboarding (100), complete your profile details (250), refer a friend who joins (111), join a community (25), comment on the Daily Pulse (10), vote on a listing (5), save a listing (3), log in each day (2). Points pay for talking with your Guide (4 points a message), and 2,500 points become 1 Guide credit. Guides never cost points directly.$b$),
   $a$ Ways to earn: complete your onboarding (100), complete your profile details (250), refer a friend who joins (111), join a community (25), comment on the Daily Pulse (10), vote on a listing (5), save a listing (3), log in each day (2). Chatting with your Guide uses a few points from a monthly allowance.$a$,
   $b$ Businesses come in at the same $11 and get advertising, sponsorships and marketing services that are only for members.$b$),
   $a$- Passport: an optional upgrade on top of the Founding Membership, $11 a month or $111 a year. It adds a Guide credit every month (unused credits roll over, up to three) plus 1,100 points for every month paid, or 13,200 points for a year paid up front, and Passport members choose their Guide.$a$,
   $b$- Passport: the Passport is the $11 one-time Founding Membership, not a monthly plan. It comes with 1 Guide credit, never points. There is no monthly Passport to offer.$b$))),
 version = version + 1, updated_at = now(), updated_by = 'Logan',
 change_summary = 'Sean, 2026-10-25: the $11 one time is the Passport with 1 Guide credit, no points; Guide credits are $11 each; points are only earned (Bounties, competitions, activity); no monthly Passport; businesses get advertising, sponsorships and marketing services as members.'
where slug = 've-guide-platform-facts';

update public.guide_kb_answers a set answer = v.answer, updated_at = now()
from (values
  ('How many points do I start with?', $x$None to start: points are earned by taking part, through Bounties, competitions and what you do in the community and on the site. Your $11, one time, is your Passport, and it comes with your first Guide credit.$x$),
  ('How many Guide messages do I get each month?', $x$Quick answers are always free. Asking your Guide directly is 4 points a message, from your points. You earn points by taking part: Bounties, competitions and what you do in the community and on the site.$x$),
  ('What is Passport?', $x$Passport is your $11, one-time Founding Membership: it never renews. It comes with your first Guide credit, voting in the Directory and your dashboard to build your Vegan world with our tools. After that you buy only what you want: Guide credits ($11 each), merchandise and event tickets.$x$),
  ('What do I get as a member?', $x$Members get their Passport and first Guide credit, vote in the Directory, post and reply on the Community Board, see members' contact details, and get their own dashboard with a Guide to help them build their Vegan world. Points come from taking part: Bounties, competitions and community activity.$x$),
  ('Can I give more than $11?', $x$Yes. When you join you can pick $11, $25, $50, $111 or another amount, if you want to help us build faster. Any amount brings your Passport and your first Guide credit.$x$),
  ('Can I buy points packages?', $x$No. Points are earned by taking part: Bounties, competitions and what you do in the community and on the site. If you want a Guide now, Guide credits are $11 each from your dashboard.$x$),
  ('How can I add points with money?', $x$Points cannot be bought: they are earned through Bounties, competitions and community activity. What you can buy is Guide credits, $11 each from your dashboard, and one credit unlocks any Guide.$x$),
  ('Can I contribute again after I join?', $x$Yes. Active members have a Contribute button on the dashboard for $11 or more, to help us build faster. It does not add points, which come from taking part. It is a contribution to our community, not a tax-deductible donation.$x$),
  ('What happens when I run out of Guide messages?', $x$Quick answers stay free, so keep asking. To keep asking your Guide directly, earn more points by taking part: Bounties, competitions and the Community Board. You can also tap Ask a person.$x$),
  ('How much does it cost to chat with my Guide?', $x$Quick answers like this one are free. Asking your Guide directly uses 4 points a message, and you earn points by taking part.$x$)
) as v(question, answer)
where a.question = v.question and a.status in ('live', 'draft');
