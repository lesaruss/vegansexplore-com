-- vegans-explore-initiative-business-certification: B3, the Pre-Vegan Restaurant Guide (2026-11-05, Logan).
-- Sean, 2026-11-05: a free Guide opened by finishing its survey; an optional $11 contribution at the end with the usual
-- 1,100 welcome points (no double points). A door Guide (canon-ve-door-guides): ve-guide-unlock opens it for any active member.
-- Not launched: published stays false and the survey stays inactive until Sean turns them on.
insert into ve_guides (slug, title, description, cost_lesars, published, access_rule, door, survey_slug, sort_order)
values ('pre-vegan-restaurant-guide', 'The Pre-Vegan Restaurant Guide',
  'For restaurants that serve meat and plant-based dishes: what Pre-Vegan Certification checks, the eight gates, and a free, private readiness check.',
  1100, false, 'points', true, 'pre-vegan-assessment', 20)
on conflict (slug) do update set title = excluded.title, description = excluded.description, door = true, survey_slug = 'pre-vegan-assessment';

-- The survey sends finishers to this Guide and, being a door, makes them a member (admits). Still inactive.
update ve_surveys set guide_slug = 'pre-vegan-restaurant-guide', admits = true, active = false where slug = 'pre-vegan-assessment';
