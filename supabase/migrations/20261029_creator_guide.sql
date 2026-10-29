-- The Creator Guide (Sean 2026-10-29, canon canon-ve-ambassadors-talent-shop, playbook ve-ambassadors-talent-shop): the Nonprofit
-- Guide's pattern for Vegan content creators, from Sean's Canva Vegan Content Creator Survival Guide (DAGx86FyHyw). River narrates.
-- $11 or 1,100 points like every Guide; an active Ambassador has it through ve-guide-unlock (via 'ambassador').
-- content_html (tips 2 to 10, `<script id="cg-data">`) is members-only and is written from the build session, never kept in the repo.
insert into public.ve_guides (title, slug, description, cover_url, cost_lesars, published, sort_order, access_rule, content_html)
select 'The Creator Guide', 'creator-guide',
  'Ten moves to go from hobbyist to professional Vegan creator, each with a real creator doing it and three action items, the creators and channels in our Directory, our creator episodes, and your next step as an Ambassador. With River as your Guide.',
  null, 1100, true, 7, 'points', ''
where not exists (select 1 from public.ve_guides where slug = 'creator-guide');
