-- Every Passport holder is a Vegan Explorer (Sean, 2026-10-28: "Vegan Explorers can be the name for our community members in
-- general. So everyone is a Vegan Explorer that has a passport"). It was an applied-for volunteer role; its eight city openings were
-- already closed (opportunities.is_active false). The Guides' facts and saved answers now say so. Safe to run twice.

update public.knowledge_records
set body = jsonb_set(body, '{facts}', to_jsonb(replace(replace(body->>'facts',
      'with Vegan Explorers (volunteers) helping.',
      'with its Vegan Explorers helping (every Passport holder is a Vegan Explorer).'),
      'Vegan Explorers are volunteers who earn points, levels and perks.',
      'Every Passport holder is a Vegan Explorer, with nothing to apply for; Explorers earn points, levels and perks.'))),
    updated_at = now()
where slug = 've-guide-platform-facts' and body->>'facts' like '%Vegan Explorers (volunteers)%';

update public.guide_kb_answers set answer = 'Every Passport holder is a Vegan Explorer: a member of the Vegans Explore community who explores their city, votes, checks in and helps the Directory grow. There is nothing to apply for.', updated_at = now()
where id = '313dc6a9-491c-4a84-a5bb-e2f38bc46dc8';
update public.guide_kb_answers set answer = 'Community Managers, yes: it is gig work, paid as the community in their city grows. Vegan Explorers are every Passport holder, and they earn points, levels and perks.', updated_at = now()
where id = '6ba89120-e2d7-4b1b-b827-2a5ff1329f7d';
update public.guide_kb_answers set answer = 'Every Passport holder is a Vegan Explorer. Members find open roles under Opportunities on their dashboard, and each city is led by a Community Manager (gig work, paid as the community grows).', updated_at = now()
where id = '26757593-46ca-43d8-847a-1118c5c858b2';
