-- The last product lines with no macros, and fairer servings (2026-11-01, after 20261101_product_off_fill.sql).
-- * Country Crock Plant Butter (olive oil), Daiya Plain Cream Cheeze and Field Roast Chao shreds had only incomplete USDA records
--   (Euromonitor entries missing protein or carbs, one at 2,730 calories per 100 g), so they come from Open Food Facts.
-- * An Open Food Facts item with no serving on record uses the FDA reference amount for its kind (21 CFR 101.12, the amount US labels
--   are built on): butter 1 Tbsp (14g), cream cheese 2 Tbsp (30g), cheese and feta 30g, grated parmesan 2 tsp (5g). The first pass had
--   shown Parma!, Parmela shreds and Follow Your Heart feta per 100 g, which sorted them far above everything else.
-- * Natural Bliss took its Hazelnut item, whose USDA record says 4g protein in a tablespoon (impossible); it now takes the Vanilla Oat one.
-- Response ids are the Open Food Facts searches read through pg_net on 2026-11-01.

create or replace function ve_off_label(n jsonb, serving_q numeric, serving_txt text, product text, code text, ref_g numeric default null, ref_txt text default null)
returns jsonb language plpgsql immutable as $$
declare per boolean := serving_q is not null and serving_q > 0; f numeric; s text; rows jsonb := '[]'::jsonb; cal numeric;
begin
  if n is null or n->>'energy-kcal_100g' is null then return null; end if;
  f := case when per then serving_q / 100.0 when ref_g is not null then ref_g / 100.0 else 1 end;
  s := case when per then coalesce(nullif(trim(serving_txt), ''), trim(to_char(serving_q, 'FM99990.##')) || 'g')
            when ref_g is not null then coalesce(ref_txt, trim(to_char(ref_g, 'FM99990.##')) || 'g') else '100g' end;
  cal := ve_nf_round('cal', (n->>'energy-kcal_100g')::numeric * f);
  rows := rows || jsonb_build_array(jsonb_build_array('Total Fat', ve_nf_round('fat', coalesce((n->>'fat_100g')::numeric, 0) * f) || 'g', '', 0, 1));
  if n ? 'saturated-fat_100g' then rows := rows || jsonb_build_array(jsonb_build_array('Saturated Fat', ve_nf_round('fat', (n->>'saturated-fat_100g')::numeric * f) || 'g', '', 1)); end if;
  if n ? 'sodium_100g' then rows := rows || jsonb_build_array(jsonb_build_array('Sodium', ve_nf_round('mg', (n->>'sodium_100g')::numeric * 1000 * f) || 'mg', '', 0, 1)); end if;
  rows := rows || jsonb_build_array(jsonb_build_array('Total Carbohydrate', ve_nf_round('g', coalesce((n->>'carbohydrates_100g')::numeric, 0) * f) || 'g', '', 0, 1));
  if n ? 'fiber_100g' then rows := rows || jsonb_build_array(jsonb_build_array('Dietary Fiber', ve_nf_round('g', (n->>'fiber_100g')::numeric * f) || 'g', '', 1)); end if;
  if n ? 'sugars_100g' then rows := rows || jsonb_build_array(jsonb_build_array('Total Sugars', ve_nf_round('g', (n->>'sugars_100g')::numeric * f) || 'g', '', 1)); end if;
  rows := rows || jsonb_build_array(jsonb_build_array('Protein', ve_nf_round('g', coalesce((n->>'proteins_100g')::numeric, 0) * f) || 'g', '', 0, 1, 1));
  return jsonb_build_object('cal', cal, 'rows', rows, 'serving', s, 'product', product, 'off', code,
    'macros', jsonb_strip_nulls(jsonb_build_object('serving', s, 'cal', cal,
      'protein', ve_nf_round('g', coalesce((n->>'proteins_100g')::numeric, 0) * f), 'carbs', ve_nf_round('g', coalesce((n->>'carbohydrates_100g')::numeric, 0) * f),
      'fat', ve_nf_round('fat', coalesce((n->>'fat_100g')::numeric, 0) * f),
      'fiber', ve_nf_round('g', (n->>'fiber_100g')::numeric * f), 'sugar', ve_nf_round('g', (n->>'sugars_100g')::numeric * f),
      'sodium', ve_nf_round('mg', (n->>'sodium_100g')::numeric * 1000 * f), 'item', product)));
end $$;
drop function if exists ve_off_label(jsonb, numeric, text, text, text);

with picks(slug, resp, code, name_re, ref_g, ref_txt) as (values
  ('country-crock-plant-butter-butter', 257615, '0027400800313', null, 14, '1 Tbsp (14g)'),
  ('daiya-cream-cheese', 257623, '0871459001173', null, 30, '2 Tbsp (30g)'),
  ('field-roast-chao-shredded-cheese', 257617, '0005031706747', null, 30, '30g'),
  ('parma-parmesan', 257588, '0860002880907', null, 5, '2 tsp (5g)'),
  ('parmela-creamery-shredded-cheese', 257590, '0857751008003', null, 30, '30g'),
  ('follow-your-heart-feta', 257579, null, 'feta crumble', 30, '30g')),
items as (
  select distinct on (k.slug) k.*, p
  from picks k join net._http_response r on r.id = k.resp,
    jsonb_array_elements(coalesce((r.content::jsonb)->'products', (r.content::jsonb)->'hits')) p
  where (k.code is not null and p->>'code' = k.code) or (k.name_re is not null and coalesce(p->>'product_name_en', p->>'product_name') ~* k.name_re)
  order by k.slug),
lab as (
  select i.slug, i.p, pr.id product_id, pr.brand_listing_id,
    coalesce(nullif(i.p->>'product_name_en', ''), i.p->>'product_name') nm,
    ve_off_label(i.p->'nutriments', nullif(i.p->>'serving_quantity', '')::numeric, i.p->>'serving_size',
      coalesce(nullif(i.p->>'product_name_en', ''), i.p->>'product_name'), i.p->>'code', i.ref_g, i.ref_txt) lbl
  from items i join ve_products pr on pr.slug = i.slug),
ins as (
  insert into ve_product_barcodes (gtin, product_id, brand_listing_id, name, nutrition, macros, ingredients, source, status, note)
  select ve_gtin(p->>'code'), product_id, brand_listing_id, nm, lbl - 'macros', lbl->'macros',
    coalesce(p->>'ingredients_text_en', p->>'ingredients_text'), 'off', 'live', 'Open Food Facts ' || (p->>'code')
  from lab where lbl is not null and ve_gtin(p->>'code') is not null
  on conflict (gtin) do update set nutrition = excluded.nutrition, macros = excluded.macros
    where ve_product_barcodes.source = 'off' or ve_product_barcodes.macros is null
  returning gtin)
update ve_products pr set nutrition = lab.lbl - 'macros', macros = lab.lbl->'macros',
  nutrition_source = 'Open Food Facts, product ' || (lab.p->>'code') || ', as its contributors entered the package (CC BY-SA)' ||
    case when nullif(lab.p->>'serving_quantity', '') is null then '; serving is the FDA reference amount' else '' end
from lab where lab.product_id = pr.id and lab.lbl is not null
  and (pr.macros is null or coalesce(pr.nutrition_source, '') like 'Open Food Facts%');

update ve_products p set nutrition = b.nutrition, macros = b.macros,
  nutrition_source = 'USDA FoodData Central, Branded Foods, FDC ' || b.fdc_id || ', as the brand reported it'
from ve_product_barcodes b where p.slug = 'natural-bliss-plant-based-coffee-creamer' and b.fdc_id = '2755948' and b.nutrition is not null;
