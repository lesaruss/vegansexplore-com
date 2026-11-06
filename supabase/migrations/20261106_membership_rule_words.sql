-- ve-events-guide: step 9 of the membership rule, the Guides' facts and saved answers (canon-ve-door-guides v6 membership_rule_v6;
-- wording approved by Sean 2026-11-06, docs/proposals/membership-rule-wording-steps-3-9.md, the same words as /policies#membership).
-- Each replace() changes one known sentence and leaves the rest as it is. Safe to run twice.

update public.knowledge_records set body = jsonb_set(body, '{facts}', to_jsonb(
  replace(replace(replace(replace(body ->> 'facts',
  'There is a second way in that costs nothing: finish the whole profile survey and membership opens, with the survey''s 250 points instead of the 1,100 welcome points.',
  'There is a second way in that costs nothing: take a survey, the short Explorer survey on vegansexplore.com/passport (a person on our team checks it before it admits) or the survey for one of our business Guides (Restaurant, Events, Creator, Nonprofit), each worth up to 250 points instead of the 1,100 welcome points.'),
  '- Guides: each paid Guide is $11, or 1,100 points. Anyone signed in can buy one, and buying it makes them a member. The Passport''s 1,100 welcome points cover a first Guide of your choice.',
  '- Guides: our topic Guides (Dairy, Nutrition, Airport, Stadium & Arena, Theme Park, Supermarket) are $11 or 1,100 points for members; the Passport''s 1,100 welcome points cover a first one. A business Guide (Restaurant, Events, Creator, Nonprofit) opens when you finish its survey, members included, never with $11 or points, and each one finished adds a Registered badge to your profile (Registered restaurant, Registered event host, Registered creator, Registered nonprofit) and up to 250 points.'),
  'Anyone who becomes a member before then, by paying the $11 or by finishing the whole profile survey, is a Founding Member for good',
  'Anyone who becomes a member before then, by paying the $11 or by finishing a survey, is a Founding Member for good'),
  'The survey is free: membership opens when the whole profile is answered, with the survey''s own 250 points.',
  'The survey is free: the short Explorer survey, checked by a person on our team, or a business Guide''s survey, each with up to 250 points.')))
where slug = 've-guide-platform-facts';

update public.guide_kb_answers set answer = v.a, updated_at = now()
from (values
 ('How do I join?', 'Make your account, then choose how to come in: the $11 Passport, one time, with 1,100 points, or a free survey, the short Explorer survey or the survey for one of our business Guides (Restaurant, Events, Creator, Nonprofit), each worth up to 250 points. A person on our team checks the Explorer survey before it admits you.'),
 ('How many points does a guide cost?', 'Our topic Guides (Dairy, Nutrition, Airport, Stadium & Arena, Theme Park, Supermarket) are $11 or 1,100 points for members, and yours to keep. A business Guide (Restaurant, Events, Creator, Nonprofit) opens when you finish its survey, members included, with up to 250 points. The Welcome Guide and the Partner Guide are free.'),
 ('How much does it cost to join?', 'The Passport is $11, one time, and it never renews. If you would rather give your time, a survey opens the same membership at no cost: the short Explorer survey or a business Guide''s survey, each worth up to 250 points. You can give more if you want to help us build faster.'),
 ('Is Vegans Explore free?', 'Looking around is free for everyone. Taking part, like posting and replying on the Community Board, voting and reaching members directly, comes with membership. There are two ways in, and both give the same membership: the $11 Passport, one time, with 1,100 points, or a free survey, the short Explorer survey or the survey for one of our business Guides, each worth up to 250 points.'),
 ('What is a Founding Member?', 'A Founding Member is anyone who becomes a member before midnight Eastern on January 1, 2027, whether they pay the $11 or finish a survey. Founding Member stays on your profile for good. Founding Members help fund what we are building and help decide what it becomes.'),
 ('When can I become a Founding Member?', 'Founding Membership closes at midnight Eastern on January 1, 2027. Become a member before then, by paying the $11 or by finishing a survey, and Founding Member stays on your profile for good. After that the $11 is the Passport: the same membership and 1,100 points, without the Founding Member mark.'),
 ('Why is there no free membership?', 'You can look around the Directory, the Pulse, the communities and the Board without an account. Taking part is for members, and there are two ways to become one: give a little time with a survey (the short Explorer survey, or the survey for one of our business Guides), or give $11, one time. Both open the same membership. The $11 comes with more points.')
) v(q, a)
where guide_kb_answers.question = v.q and guide_kb_answers.status = 'live';

-- The Events and Restaurant intakes pay up to 250 since step 2 (2026-11-06); their intros still said 100.
update public.ve_surveys set intro = replace(intro, 'it earns 100 points', 'it earns up to 250 points') where slug in ('vegan-events-guide', 'vegan-restaurant-guide');
