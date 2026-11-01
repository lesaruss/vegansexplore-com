-- Labels from the brands' own websites (Sean, 2026-11-01: "add the last 5 from the brands' own websites"), read through pg_net.
-- * 365 by Whole Foods Non-Dairy Cheddar Slices: wholefoodsmarket.com/product/365-by-whole-foods-market-nondairy-cheddar-slices-8-oz-b07fwcr1vl,
--   per 1 slice (23g): 70 cal, fat 5g (sat 4g), sodium 230mg, carbs 6g, fiber 0g, sugars 0g, protein 0g.
-- * 365 by Whole Foods Nondairy Almondmilk Yogurt, Unsweetened Plain:
--   wholefoodsmarket.com/product/365-by-whole-foods-market-nondairy-almondmilk-yogurt-unsweetened-plain-32-oz-b07rc7wwyx, per 3/4 cup (170g):
--   160 cal, fat 13g (sat 1g), sodium 10mg, carbs 9g, fiber 2g, sugars 1g, protein 5g. Whole Foods sells no 365 coconut yogurt; its
--   nondairy yogurt is almond milk, so the Dairy Guide's entry (and so the product's made_from) is corrected from Coconut.
-- * Panacheeza Original, panacheeza.com/products/panacheeza-original, per 1 Tbsp: 50 cal, protein 2g; the page gives fat (4%) and
--   carbohydrate (1%) only as % Daily Value, so they are 3g each from the FDA Daily Values (78g, 275g), said so in the source line.
-- Not filled: Om Sweet Home (no website found; omsweethome.com does not answer) and Vlendedful (vlendedful.com no longer resolves; no label
-- published anywhere we could find). Both may no longer be trading: worth a look in Directory review.

update listings set details = jsonb_set(details, '{dairy_guide}', (
    select jsonb_agg(case when e->>'cat' = 'Yogurt' then e || '{"base":"Almond milk","note":"Unsweetened Plain and Vanilla"}'::jsonb else e end)
    from jsonb_array_elements(details->'dairy_guide') e))
where name = '365 by Whole Foods' and jsonb_typeof(details->'dairy_guide') = 'array';

with labels(slug, nf, src) as (values
  ('365-by-whole-foods-cheese-slices', '{"cal":70,"serving":"1 slice (23g)","product":"365 Non-Dairy Cheddar Slices","rows":[["Total Fat","5g","6%",0,1],["Saturated Fat","4g","20%",1],["Cholesterol","0mg","0%",0,1],["Sodium","230mg","10%",0,1],["Total Carbohydrate","6g","2%",0,1],["Dietary Fiber","0g","0%",1],["Total Sugars","0g","",1],["Protein","0g","",0,1,1],["Calcium","0mg","0%"],["Iron","0mg","0%"]]}'::jsonb,
   'Whole Foods Market''s product page for 365 Non-Dairy Cheddar Slices'),
  ('365-by-whole-foods-yogurt', '{"cal":160,"serving":"3/4 cup (170g)","product":"365 Nondairy Almondmilk Yogurt, Unsweetened Plain","rows":[["Total Fat","13g","17%",0,1],["Saturated Fat","1g","5%",1],["Trans Fat","0g","",1],["Cholesterol","0mg","0%",0,1],["Sodium","10mg","0%",0,1],["Total Carbohydrate","9g","3%",0,1],["Dietary Fiber","2g","7%",1],["Total Sugars","1g","",1],["Protein","5g","",0,1,1],["Calcium","60mg","4%"],["Iron","0.8mg","4%"]]}'::jsonb,
   'Whole Foods Market''s product page for 365 Nondairy Almondmilk Yogurt, Unsweetened Plain'),
  ('panacheeza-parmesan', '{"cal":50,"serving":"1 Tbsp","product":"Panacheeza Original","rows":[["Total Fat","3g","4%",0,1],["Cholesterol","0mg","0%",0,1],["Total Carbohydrate","3g","1%",0,1],["Protein","2g","",0,1,1]]}'::jsonb,
   'Panacheeza''s product page (fat and carbohydrate worked out from the % Daily Value it gives)'))
update ve_products p set nutrition = l.nf, macros = ve_nf_macros(l.nf), nutrition_source = l.src,
  made_from = case when p.slug = '365-by-whole-foods-yogurt' then 'Almond milk' else p.made_from end
from labels l where p.slug = l.slug;
