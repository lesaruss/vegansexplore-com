-- Five product lines USDA FoodData Central does not carry, filled from Open Food Facts (CC BY-SA, as its contributors entered the
-- package), 2026-11-01. Each item was picked by its barcode from an Open Food Facts search read through pg_net (net._http_response
-- ids below): Oatly Oatmilk Creamer Sweet & Creamy, Follow Your Heart Dairy Free Feta Crumbles, Parma! Vegan Parmesan, Parmela Creamery
-- Mozzarella Style Shreds and Wicked Kitchen mint ice cream. An item with no serving on its package is labeled per 100 g, never a
-- serving we made up.
-- Still with no public numbers: 365 by Whole Foods coconut yogurt and cheese slices, Om Sweet Home, Vlendedful and Panacheeza (on neither
-- USDA nor Open Food Facts). They show "Macros not added yet" until the team adds them or a member scans one.

create or replace function ve_off_label(n jsonb, serving_q numeric, serving_txt text, product text, code text)
returns jsonb language plpgsql immutable as $$
declare per boolean := serving_q is not null and serving_q > 0; f numeric; s text; rows jsonb := '[]'::jsonb; cal numeric;

begin
  if n is null or n->>'energy-kcal_100g' is null then return null; end if;
  f := case when per then serving_q / 100.0 else 1 end;
  s := case when per then coalesce(nullif(trim(serving_txt), ''), trim(to_char(serving_q, 'FM99990.##')) || 'g') else '100g' end;
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

with picks(slug, resp, code, name_re) as (values
  ('oatly-coffee-creamer', 257561, '0190646631536', null),
  ('follow-your-heart-feta', 257579, null, 'feta crumble'),
  ('parma-parmesan', 257588, '0860002880907', null),
  ('parmela-creamery-shredded-cheese', 257590, '0857751008003', null),
  ('wickedkitchenfood-ice-cream', 257589, '0850023690609', null)),
items as (
  select distinct on (k.slug) k.slug, p
  from picks k join net._http_response r on r.id = k.resp,
    jsonb_array_elements(coalesce((r.content::jsonb)->'products', (r.content::jsonb)->'hits')) p
  where (k.code is not null and p->>'code' = k.code) or (k.name_re is not null and coalesce(p->>'product_name_en', p->>'product_name') ~* k.name_re)
  order by k.slug),
lab as (
  select i.slug, i.p, pr.id product_id, pr.brand_listing_id,
    coalesce(nullif(i.p->>'product_name_en', ''), i.p->>'product_name') nm,
    ve_off_label(i.p->'nutriments', nullif(i.p->>'serving_quantity', '')::numeric, i.p->>'serving_size',
      coalesce(nullif(i.p->>'product_name_en', ''), i.p->>'product_name'), i.p->>'code') lbl
  from items i join ve_products pr on pr.slug = i.slug),
ins as (
  insert into ve_product_barcodes (gtin, product_id, brand_listing_id, name, nutrition, macros, ingredients, source, status, note)
  select ve_gtin(p->>'code'), product_id, brand_listing_id, nm, lbl - 'macros', lbl->'macros',
    coalesce(p->>'ingredients_text_en', p->>'ingredients_text'), 'off', 'live', 'Open Food Facts ' || (p->>'code')
  from lab where lbl is not null and ve_gtin(p->>'code') is not null
  on conflict (gtin) do update set nutrition = coalesce(ve_product_barcodes.nutrition, excluded.nutrition), macros = coalesce(ve_product_barcodes.macros, excluded.macros)
  returning gtin)
update ve_products pr set nutrition = coalesce(pr.nutrition, lab.lbl - 'macros'), macros = lab.lbl->'macros',
  nutrition_source = coalesce(pr.nutrition_source, 'Open Food Facts, product ' || (lab.p->>'code') || ', as its contributors entered the package (CC BY-SA)')
from lab where lab.product_id = pr.id and pr.macros is null and lab.lbl is not null;
