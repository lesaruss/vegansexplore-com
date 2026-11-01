-- Products > Nutrition & Supplements, second round (Sean, 2026-11-01: "go ahead with the second round"). Same rule as the first
-- (20261101_nutrition_supplements_brands.sql): the whole line Vegan, checked by web search. Added: Sprout Living (Certified Vegan
-- proteins), Your Super (organic plant superfood mixes, B Corp), Nested Naturals (a Vegan supplement company), ALOHA (all products
-- certified Vegan, B Corp), Form Nutrition (UK, plant-based protein and supplements, B Corp). Sakara Life, already listed under Meal
-- Prep, also shows here (its supplements are all Vegan). Left out: MaryRuth's (three skincare products use beeswax), Naturade (not
-- confirmed beyond its VeganSmart line), Navitas Organics (superfood foods more than supplements; still quarantined from the import).
with b(slug, name, specialty, website, tagline, description, kinds) as (values
 ('sprout-living', 'Sprout Living', 'Organic plant protein and superfoods', 'https://sproutliving.com', 'Organic plant protein and superfoods',
  'Epic Protein, organic plant protein with superfoods, and Simple seed proteins from pumpkin and more. Certified Organic, Certified Vegan and kosher.', array['protein']),
 ('your-super', 'Your Super', 'Organic superfood mixes', 'https://yoursuper.com', 'Organic superfood mixes',
  'Organic, plant-based superfood mixes with nothing added: Super Green, Skinny Protein, Muscle Power, Golden Mellow, Moon Balance, Plant Collagen and more. A B Corp.', array['protein']),
 ('nested-naturals', 'Nested Naturals', 'Vegan supplements', 'https://nestednaturals.com', 'Clean, Vegan supplements',
  'Vegan supplement company: Super Greens, magnesium glycinate, choline, Luna sleep and more, in Vegan capsules, non-GMO and third-party tested.', '{}'::text[]),
 ('aloha', 'ALOHA', 'Organic plant protein bars and powders', 'https://aloha.com', 'Organic plant-based protein',
  'Organic plant-based protein bars, powders and drinks, every product certified Vegan and USDA Organic, from a Certified B Corp. Bars use brown rice and pumpkin seed protein.', array['protein']),
 ('form-nutrition', 'Form Nutrition', 'Plant protein and supplements', 'https://formnutrition.com', 'Plant-based performance nutrition',
  'UK brand founded in 2017: plant protein from organic pea, brown rice and pumpkin seed, Peakblend complete meals, creatine and more. The first protein brand to become a B Corp in the UK.', array['protein'])
)
insert into public.listings (name, slug, category, specialty, description, tagline, location, website, status, vegan_status,
  communities, product_kinds, crawl_source, tenant_id, initials, details)
select b.name, b.slug, 'Nutrition & Supplements', b.specialty, b.description, b.tagline, 'Online', b.website, 'approved', 'fully_vegan',
  '{}'::text[], b.kinds, 'admin', '00000000-0000-4000-a000-000000000002', upper(left(b.name, 1)),
  jsonb_build_object('added_by_hand', true, 'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
    'text', 'Added 2026-11-01 to Nutrition & Supplements (second round): a whole-Vegan supplement brand, checked by web search.')))
from b
where not exists (select 1 from public.listings l where l.slug = b.slug);

insert into public.ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'extra_categories', to_jsonb(extra_categories), to_jsonb(extra_categories || array['Nutrition & Supplements']), '{"by":"Logan"}'::jsonb
from public.listings where slug = 'sakara-life' and status = 'approved' and not ('Nutrition & Supplements' = any(extra_categories));
update public.listings set extra_categories = extra_categories || array['Nutrition & Supplements']
where slug = 'sakara-life' and status = 'approved' and not ('Nutrition & Supplements' = any(extra_categories));
