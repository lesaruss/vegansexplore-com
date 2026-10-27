-- Services trimmed (Sean, 2026-10-27: "under services, we have too many things... get rid of AI automation, web and development,
-- content creation, branding and creative assets and business operations... marketing and growth as a catch-all... animal care...
-- health professionals, so like doctors, dentists, and that could have its own sub menu").
-- The two Vegan businesses in the removed sub-sections move to Marketing & Growth. The SaaS tools still filed there are tagged
-- lesaruss-ai-directory-candidate, never show on Vegans Explore, and keep their categories for the LESARUSS AI directory.
-- Health Professionals takes the doctor and the nutritionists (details.health_type); the supplement brands filed under
-- Health and Wellness go to Food > Nutrition & Supplements, where supplement brands are listed.
-- Each change is a ve_listing_edits row. Safe to run twice.
with moves(name, cat, htype) as (values
  ('Nadia Flores Design', 'Marketing & Growth', null),
  ('Zara Osei Media', 'Marketing & Growth', null),
  ('Mariselis Rosa-Sanchez, MD', 'Health Professionals', 'doctor'),
  ('Nourish Plant-Based Living', 'Health Professionals', 'dietitian'),
  ('Complement', 'Nutrition & Supplements', null),
  ('Garden of Life', 'Nutrition & Supplements', null),
  ('Happy Viking', 'Nutrition & Supplements', null),
  ('PlantBuilt', 'Nutrition & Supplements', null)),
hit as (
  select l.id, l.category old_cat, m.cat, m.htype from listings l join moves m on m.name = l.name
  where l.status = 'approved' and l.category is distinct from m.cat),
ed as (
  insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
  select id, 'category', to_jsonb(old_cat), to_jsonb(cat), '{"by":"logan","why":"services trimmed 2026-10-27"}'::jsonb from hit returning 1)
update listings l set category = h.cat,
  details = case when h.htype is null then l.details else coalesce(l.details, '{}'::jsonb) || jsonb_build_object('health_type', h.htype) end,
  updated_at = now()
from hit h where l.id = h.id;
