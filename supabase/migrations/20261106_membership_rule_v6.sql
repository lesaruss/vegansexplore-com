-- ve-events-guide: the membership rule (LOCKED by Sean 2026-11-06, "lock it"). Canon canon-ve-door-guides v6 and
-- canon-ve-people-campaigns-doors v5; each business Guide's intake survey pays 250 points (was 100). Playbooks ve-events-guide,
-- ve-pathways, ve-pricing-points-passport. Safe to run twice.

update public.knowledge_records
set version = 6, updated_by = 'logan', updated_at = now(),
    change_summary = 'v6 membership rule (Sean 2026-11-06, "lock it"): in by any Guide survey or the $11; topic Guides bought; business Guides opened by their intake, members included; one survey system with shared answers; Registered badges; the Explorer survey.',
    body = body || jsonb_build_object('membership_rule_v6', jsonb_build_object(
      'locked', 'Sean, 2026-11-06: "lock it", after Logan''s restated draft v6 and Sean''s answers the same day.',
      'ways_in', 'A visitor becomes a member by finishing any Guide survey (250 points) or paying the $11, one time (never "a month"). After the $11 we prompt them to take a survey for 250 points; it is not required.',
      'topic_guides', 'Dairy, Nutrition, Airport, Stadium & Arena, Theme Park and Supermarket are $11 or 1,100 points for a member. No survey route. The Supermarket Guide stays free while a supermarket sponsorship is active (canon-ve-supermarket-guide).',
      'business_guides', 'Restaurant, Creator, Events and Nonprofit (later the Pre-Vegan Business Guide, built in its own chat) are opened by finishing that Guide''s intake, for anyone, members included. Sean: "those door guides are there to get people into other opportunities... they still need to do the intake so we can tailor the opportunities to them." Replaces v3''s "a door Guide opens for any active member".',
      'one_system', 'Every Guide''s intake runs on the same survey system (ve_surveys). Creator and Nonprofit move onto it; no Guide does it differently. Sean: "let the best system win."',
      'shared_answers', 'A question shared across Guides (city, how Vegan, what they do, their links) is asked once and filled in on every later intake; they answer only what is new to that Guide, can change anything, and the newest answer wins everywhere.',
      'badges', 'Finishing an intake shows on their profile as a pill: Registered creator, Registered restaurant owner, Registered event host, Registered nonprofit. One badge per intake; the intake''s role answer shows as small text under it.',
      'points', 'Each intake pays 250 points; doing several stacks (Sean: "it''s on them... I want them to get to level 2").',
      'explorer_survey', 'The general survey becomes the short Explorer survey on the Welcome (/passport, which is the Passport): what you can do on Vegans Explore and which doors fit you, about 8 questions, 250 points, a person checks it before it admits. The 31-question profile stays the member''s profile, paying per answer as now.',
      'pre_vegan', 'The Pre-Vegan Business Guide and its pre-vegan-assessment survey are worked in another chat; not touched here.',
      'after', 'After that, members are guided toward giving their time or money in exchange for our services and promotion.',
      'build_order', '1 canon (this). 2 intakes to 250. 3 the shared question bank and auto-fill. 4 Creator and Nonprofit onto the shared system. 5 members see the intake before a business Guide opens. 6 the Registered badges. 7 the Explorer survey and the prompt after the $11. 8 claim emails point hosts to the event survey. 9 policies, the Guides'' facts, saved answers. Wording people read goes to Sean first.'))
where slug = 'canon-ve-door-guides' and version < 6;

update public.knowledge_records
set version = 5, updated_by = 'logan', updated_at = now(),
    change_summary = 'v5: the survey door is any Guide survey or the Explorer survey; business Guides open by their intake; see canon-ve-door-guides membership_rule_v6.',
    body = body || jsonb_build_object('UPDATE_2026_11_06_MEMBERSHIP_RULE',
      'Locked by Sean 2026-11-06. The doors are: the Daily Pulse subscription (not a membership), finishing any Guide survey or the Explorer survey (membership, 250 points), and the $11 one time (membership, 1,100 points, then a prompt to take a survey). Topic Guides are $11 or 1,100 points for members; business Guides open by their intake for anyone, members included; intakes share answers and each earns a Registered badge. Full rule: canon-ve-door-guides membership_rule_v6.')
where slug = 'canon-ve-people-campaigns-doors' and version < 5;

-- Each business intake pays 250 (2.5 times every question; the restaurant survey's two 5-point questions become 12 and 13).
update public.ve_survey_questions set points = (points * 5) / 2
where survey_slug = 'vegan-events-guide' and (select sum(points) from public.ve_survey_questions where survey_slug = 'vegan-events-guide') = 100;

update public.ve_survey_questions set points = case id when 'r_proud' then 12 when 'r_recommend' then 13 else (points * 5) / 2 end
where survey_slug = 'vegan-restaurant-guide' and (select sum(points) from public.ve_survey_questions where survey_slug = 'vegan-restaurant-guide') = 100;

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-events-guide', 'vegans-explore', 'logan',
  've-events-guide: membership rule locked (Sean 2026-11-06, "lock it"). In by any Guide survey (250) or the $11 one time (then a survey prompt). Topic Guides $11 or 1,100 points for members, no survey route (Supermarket free while sponsored). Business Guides (Restaurant, Creator, Events, Nonprofit; Pre-Vegan Business later, other chat) open by their intake for anyone, members included, replacing "open to any active member". One survey system for every Guide (Creator and Nonprofit move onto ve_surveys); shared answers fill in, newest wins; a Registered badge per intake; 250 per intake, stacking. The general survey becomes the short Explorer survey on the Welcome (/passport), person-checked. Done today: canon-ve-door-guides v6, canon-ve-people-campaigns-doors v5, the Events and Restaurant intakes now pay 250. Next: shared question bank and auto-fill, then Creator and Nonprofit onto it.',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-events-guide' and body like 've-events-guide: membership rule locked%');

insert into public.stream_events (owner, station, summary, keywords, status)
select 'logan', 'vegans-explore',
  've-events-guide: membership rule locked by Sean (canon-ve-door-guides v6, canon-ve-people-campaigns-doors v5); Events and Restaurant intakes pay 250 points.',
  array['ve-events-guide','membership','canon','door-guides'], 'completed'
where not exists (select 1 from public.stream_events where summary like 've-events-guide: membership rule locked by Sean%');
