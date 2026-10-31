-- The Nutrition Guide (2026-10-31, Sean: "build the Nutrition Guide"; the Guide the listing Guide tab names for Nutrition & Supplements,
-- Physicians and Health Experts, playbook ve-listing-guide-tab). Page guides/nutrition-guide.html, script guide-scripts/nutrition-guide.js,
-- Theo narrating in text. $11 or 1,100 points like every Guide. Its members-only text (the other seven nutrients, the plate, what to look
-- for in a supplement) is ve_guides.content_html, written by the one-time function from the session, never kept in this repo (the
-- Restaurant Guide's rule). Run through a one-time function (the connector holds writes). Safe to run twice.

-- 1. The Guide's row: published so ve-guide-unlock sells and opens it; the page stays noindex and off the catalog until Sean launches it.
insert into ve_guides (title, slug, description, cost_lesars, published, access_rule, sort_order)
select 'The Nutrition Guide', 'nutrition-guide',
       'What a Vegan plate needs, nutrient by nutrient: B12, protein, iron, calcium, vitamin D, omega-3s, iodine and zinc, how much, where to get it from food and when to supplement, with our physicians and health experts on the podcast and the experts in our Directory.',
       1100, true, 'points', 8
where not exists (select 1 from ve_guides where slug = 'nutrition-guide');

-- 2. Sean's own copy, to review it before launch.
insert into ve_guide_purchases (member_id, guide_id, lesars_spent, paid_with)
select '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, g.id, 0, 'comp' from ve_guides g where g.slug = 'nutrition-guide'
on conflict (member_id, guide_id) do nothing;

-- 3. (Run by the one-time function only, from the session) update ve_guides set content_html = '<script id="nt-data">...' where slug = 'nutrition-guide';
