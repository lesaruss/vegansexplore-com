-- Two things Sean signed off on 2026-10-28 ("go, and fix the volunteer wording too"). Each statement is safe to run twice.
-- 1. Canon: levels are the affiliate ladder (canon-ve-guide-pricing; migration 20261028_affiliate_levels.sql).
-- 2. Community Managers are gig work, paid as the community grows, never volunteers (Sean, 2026-10-27: "we're for profit and we
--    intend to pay them. More like gig work"). The database copies of the old wording: the Community Manager roles, the Guides'
--    facts and the saved answers. Vegan Explorers stay volunteers; no amount of pay is ever quoted.

update public.knowledge_records set
  body = body || jsonb_build_object(
    'levels', 'Level 1 for every member; Level 2 from 2,500 lifetime points; Level 3 from 10,000 (Sean confirmed 2026-10-25); Level 4 from 25,000 (added 2026-10-28 with the affiliate ladder; 25,000 is Logan''s default, Sean''s to change). A level the team sets (members.level_override) is the least a member has. Lifetime points never go down. Thresholds live in ve_affiliate_levels.',
    'affiliate', 'Sean, 2026-10-28: levels are the affiliate ladder. Level 1: the link earns 111 points when a friend becomes a member. Level 2: 20% of the Passport bought through the link. Level 3: 25%, and Guides bought with money open too. Level 4: 30%, the maximum. Sean may start someone at Level 2 or higher. A member can route all commissions to a nonprofit, rescue or sanctuary in the Directory, given in their name. Defaults Logan set (Sean to confirm): commission on the $11 price only; purchases by someone who joined with the link within 12 months; 30-day hold; paid at $25 ready after a W-9; never on own purchases. Built: migration 20261028_affiliate_levels.sql, ve-affiliate, /dashboard/levels, Depot > Ambassadors > Commissions. Not shown to members until Sean launches it (ve_site_settings affiliate_program.live).'),
  version = version + 1,
  change_summary = 'Sean 2026-10-28: levels become the affiliate ladder (20/25/30%), Level 4 added, commissions can go to a nonprofit.',
  updated_by = 'logan', updated_at = now()
where slug = 'canon-ve-guide-pricing' and not (body ? 'affiliate');

update public.opportunities
set description = replace(description, 'lead your chapter as a volunteer, with a path to Community Coordinator',
                                        'lead your chapter as gig work, paid as the community grows, with a path to Community Coordinator')
where title = 'Community Manager' and description like '%lead your chapter as a volunteer%';

update public.knowledge_records
set body = jsonb_set(body, '{facts}', to_jsonb(replace(replace(body->>'facts',
      'each city is built by a volunteer Community Manager who knows the local scene, with Vegan Explorers (also volunteers) helping.',
      'each city is built by a Community Manager who knows the local scene (gig work, paid as the community grows), with Vegan Explorers (volunteers) helping.'),
      'If asked, Community Managers and Explorers are volunteers and are not paid. Never offer pay, stipends or commissions.',
      'If asked: Community Managers are gig work, paid as the community in their city grows, never volunteers; never quote an amount. Vegan Explorers are volunteers who earn points, levels and perks. Never offer pay, stipends or commissions beyond that.'))),
    updated_at = now()
where slug = 've-guide-platform-facts' and body->>'facts' like '%built by a volunteer Community Manager%';

update public.guide_kb_answers set answer = 'Members find open roles under Opportunities on their dashboard. Each city is built by a Community Manager (gig work, paid as the community grows) with Vegan Explorers helping.', updated_at = now()
where id = '26757593-46ca-43d8-847a-1118c5c858b2';
update public.guide_kb_answers set answer = 'A Community Manager knows the local scene and builds their city''s community on Vegans Explore, with Vegan Explorers helping. It is gig work, paid as the community grows.', updated_at = now()
where id = '79ce2714-751e-4b64-a06d-5a0f6126a940';
update public.guide_kb_answers set answer = 'Community Managers, yes: it is gig work, paid as the community in their city grows. Vegan Explorers are volunteers who earn points, levels and perks.', updated_at = now()
where id = '6ba89120-e2d7-4b1b-b827-2a5ff1329f7d';
update public.guide_kb_answers set answer = 'Apply on the Community Manager page. It is gig work, paid as the community grows, and the team reviews every application.', updated_at = now()
where id = '31f27569-debe-477e-bcca-f0acefd4d1a5';
