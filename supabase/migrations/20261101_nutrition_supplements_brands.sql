-- Products > Nutrition & Supplements: Vegan supplement brands (Sean, 2026-11-01: "Let's fill up nutrition and supplements...
-- protein powders... pills... creatine... All the brands that are vegan. Things like B12").
-- Rule: a brand goes in only when its whole line is Vegan (a brand that also sells whey, fish oil or animal collagen is left
-- out). Checked 2026-11-01 by web search (the session cannot open brand sites): Huel (Vegan Society audited, "All Huel
-- products are 100% vegan"), Vega (vegan certified), Deva (Vegan Society registered), Vivo Life (Vegan Society certified),
-- Sunwarrior, KOS, Ora Organic (Certified Vegan), Nuzest, Future Kind, Truvani, PlantFusion, Vedge Nutrition, Ritual,
-- Amazing Grass. Left out: Naturelo (some products only vegetarian), Momentous, Naked, Onnit, Transparent Labs, XWERKS
-- (they sell whey). Online brands: location Online (they read Online on the card and show in every chapter). Logos come from the logo sweep (Directory review > Logos).
-- Garden of Life sells fish oil and bovine and fish collagen, so it is Vegan options, not 100% Vegan, and its description
-- no longer calls it a Vegan brand.

with b(slug, name, specialty, website, instagram, tagline, description, kinds) as (values
 ('vega', 'Vega', 'Plant-based protein and sports nutrition', 'https://myvega.com', null,
  'Plant-based protein and performance nutrition',
  'Plant-based protein powders and sports nutrition, mostly pea based with hemp, pumpkin seed and sunflower in some blends. Vegan certified, Non-GMO Project Verified and a B Corp, including a Protein + Creatine.', array['protein']),
 ('sunwarrior', 'Sunwarrior', 'Plant-based protein and superfoods', 'https://sunwarrior.com', null,
  'Plant-based protein and superfoods',
  'Plant-based protein powders, greens, electrolytes, superfood blends and plant-based collagen builders. The whole line is Vegan, dairy free and soy free.', array['protein']),
 ('kos', 'KOS', 'Organic plant protein and superfoods', 'https://kos.com', null,
  'Organic plant protein and superfoods',
  'Southern California brand, founded in 2017, making USDA Organic plant protein from pea, flax, quinoa, pumpkin and chia, plus super greens, spirulina, digestive enzymes and Smart Creatine.', array['protein']),
 ('ora-organic', 'Ora Organic', 'Organic Vegan supplements', 'https://ora.organic', null,
  'Organic, plant-based supplements',
  'Austin brand making USDA Organic, Certified Vegan supplements: plant protein, greens, probiotics, vitamins and a plant-based collagen booster. Always plant-based.', array['protein']),
 ('nuzest', 'Nuzest', 'Pea protein and greens', 'https://nuzest.com', null,
  'Clean pea protein and greens',
  'Clean Lean Protein made from European golden pea protein isolate, plus Good Green Vitality and Good Green Stuff greens blends and Kids Good Stuff. Dairy, gluten and soy free, sold in more than 25 countries.', array['protein']),
 ('huel', 'Huel', 'Nutritionally complete meals and protein', 'https://huel.com', null,
  'Nutritionally complete food, all Vegan',
  'Nutritionally complete powdered meals, ready-to-drink shakes, hot meals, bars, Daily Greens and Complete Protein. Every product is Vegan, independently audited by The Vegan Society.', array['protein']),
 ('future-kind', 'Future Kind', 'Vegan vitamins and supplements', 'https://futurekind.com', null,
  'Supplements made for Vegans',
  'Supplements made only for Vegans: multivitamins, B12, D3, iron, algae omega-3 (DHA and EPA), protein and an animal-free collagen booster.', '{}'::text[]),
 ('deva-nutrition', 'Deva Nutrition', 'Vegan vitamins and B12', 'https://devanutrition.com', null,
  'Vegan vitamins since the start',
  'Vegan multivitamins, B12 (methylcobalamin, fast-dissolve), iron-free and prenatal formulas and more, registered with The Vegan Society.', '{}'::text[]),
 ('vivo-life', 'Vivo Life', 'Plant protein, creatine and vitamins', 'https://vivolife.com', null,
  'Plant-based nutrition from the UK',
  'UK brand founded in 2014: plant proteins from pea, hemp and pumpkin, micronised creatine monohydrate certified by The Vegan Society, B12, a multinutrient and an algae omega-3.', array['protein']),
 ('truvani', 'Truvani', 'Organic plant protein', 'https://truvani.com', null,
  'Organic plant-based protein',
  'USDA Organic plant protein powder from pea, pumpkin seed and chia, in flavors from vanilla chai to chocolate peanut butter. Vegan, dairy free, soy free and gluten free.', array['protein']),
 ('ritual', 'Ritual', 'Vegan multivitamins and protein', 'https://ritual.com', null,
  'Traceable Vegan vitamins',
  'Multivitamins for women, men, teens and pregnancy, with omega-3 DHA from microalgae, and Essential Protein from organic pea. All products are Vegan.', array['protein']),
 ('amazing-grass', 'Amazing Grass', 'Greens and superfood powders', 'https://amazinggrass.com', null,
  'Greens and superfood blends',
  'Greens Blend superfood powders, Super Greens capsules, antioxidant, detox and kids blends. Vegan, with flavors that are organic and kosher pareve.', '{}'::text[])
)
insert into public.listings (name, slug, category, specialty, description, tagline, location, website, instagram, status, vegan_status,
  communities, product_kinds, crawl_source, tenant_id, initials, details)
select b.name, b.slug, 'Nutrition & Supplements', b.specialty, b.description, b.tagline, 'Online', b.website, b.instagram, 'approved', 'fully_vegan',
  '{}'::text[], b.kinds, 'admin', '00000000-0000-4000-a000-000000000002', upper(left(b.name, 1)),
  jsonb_build_object('added_by_hand', true, 'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
    'text', 'Added 2026-11-01 to Nutrition & Supplements: a whole-Vegan supplement brand, checked by web search.')))
from b
where not exists (select 1 from public.listings l where l.slug = b.slug and l.status = 'approved');

-- Promote the two the June import left quarantined (no second copy).
update public.listings set name = 'PlantFusion', category = 'Nutrition & Supplements', specialty = 'Plant-based protein and supplements',
  description = 'New Jersey brand, founded in 2009: Complete Plant Protein, organic proteins, meal replacements, plant-based collagen builders and vitamins. Every powder is Vegan and allergen free.',
  tagline = 'Plant-based protein, allergen free', location = 'Online', website = 'https://plantfusion.com', status = 'approved',
  vegan_status = 'fully_vegan', communities = '{}', product_kinds = array['protein'], crawl_source = coalesce(crawl_source, 'admin'),
  tenant_id = '00000000-0000-4000-a000-000000000002', initials = 'P',
  details = coalesce(details, '{}'::jsonb) || jsonb_build_object('added_by_hand', true, 'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
    'text', 'Listed 2026-11-01 from the import (it was quarantined): a whole-Vegan supplement brand, checked by web search.')))
where slug = 'plant-fusion' and status = 'quarantined';

update public.listings set name = 'Vedge Nutrition', category = 'Nutrition & Supplements', specialty = 'Plant-based sports nutrition',
  description = 'Plant-based performance supplements: organic plant protein, Vegan collagen and Creatine+, creatine monohydrate with a mushroom blend and electrolytes. Certified Vegan and organic ingredients, third-party tested.',
  tagline = 'Plant-based performance', location = 'Online', website = 'https://vedgenutrition.com', status = 'approved',
  vegan_status = 'fully_vegan', communities = '{}', product_kinds = array['protein'], crawl_source = coalesce(crawl_source, 'admin'),
  tenant_id = '00000000-0000-4000-a000-000000000002', initials = 'V',
  details = coalesce(details, '{}'::jsonb) || jsonb_build_object('added_by_hand', true, 'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
    'text', 'Listed 2026-11-01 from the import (it was quarantined): a whole-Vegan supplement brand, checked by web search.')))
where slug = 'vedgenutrition' and status = 'quarantined';

-- Garden of Life: not a whole-Vegan brand.
insert into public.ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'vegan_status', to_jsonb(vegan_status), '"vegan_options"'::jsonb, '{"by":"Logan","why":"sells fish oil and animal collagen"}'::jsonb
from public.listings where slug = 'garden-of-life' and status = 'approved' and vegan_status = 'fully_vegan';
insert into public.ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'description', to_jsonb(description), to_jsonb('Supplement brand with a large Vegan range: plant protein powders, vitamins, probiotics, algae omega-3 and an organic plant collagen builder. Some products are not Vegan (fish oil, bovine and fish collagen), so check the label.'::text), '{"by":"Logan"}'::jsonb
from public.listings where slug = 'garden-of-life' and status = 'approved' and description like 'Certified Vegan supplement brand%';
update public.listings set vegan_status = 'vegan_options',
  description = 'Supplement brand with a large Vegan range: plant protein powders, vitamins, probiotics, algae omega-3 and an organic plant collagen builder. Some products are not Vegan (fish oil, bovine and fish collagen), so check the label.'
where slug = 'garden-of-life' and status = 'approved';
