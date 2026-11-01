-- The 20 product lines with no macros (Sean, 2026-11-01: "fill in the 18 missing products too"; there were 20).
-- The first fill (20261101_product_barcodes_macros.sql) dropped every item whose ingredients read "<nut> milk (...)", so Ben & Jerry's,
-- Mauna Loa, Milkadamia and others matched nothing, and a brand named "Creamery" read as coffee creamer. This pass re-read USDA
-- FoodData Central (every record of each brand, plus searches for the 20) on 2026-11-01 through pg_net (responses in
-- net._http_response, tagged in the scratch table ve_usda_brand2) and matches them again:
--   * an ingredient that is plain milk or cream at the start of the list, or whey, casein, lactose, egg, honey, gelatin, milk
--     protein and the like, rules an item out; "almond milk (water, almonds)" no longer does
--   * the brand's own name is taken out before reading the kind ("Parmela Creamery")
--   * "ice dream" is ice cream (Wicked Kitchen)
-- New barcodes are added (an existing one is left alone), and a line with no macros takes them from its plain or original item.
-- Lines USDA does not have are filled from Open Food Facts in 20261101_product_off_fill.sql.

create or replace function ve_usda_type(d text) returns text language sql immutable as $$
  select case
    when d ~* 'cream ?cheese|whipped.*spread' then 'Cream Cheese'
    when d ~* 'sour cream|\msour\M' then 'Sour Cream'
    when d ~* 'creamer\M|half ?& ?half|half and half' then 'Coffee Creamer'
    when d ~* 'yogh?urt|skyr' then 'Yogurt'
    when d ~* 'frozen dessert|ice ?cream|ice dream|non-?dairy frozen|\mpint\M|sandwich|\mbars?\M|\mcone' then 'Ice Cream'
    when d ~* 'parm' then 'Parmesan'
    when d ~* 'feta' then 'Feta'
    when d ~* 'shred' then 'Shredded Cheese'
    when d ~* 'slice' then 'Cheese Slices'
    when d ~* 'butter' and d !~* 'peanut|almond butter|nut butter|cashew butter|sunflower|cocoa butter' then 'Butter'
    when d ~* 'ricotta|spread|\mdip\M|chive|wheel|round|herb|nutcheese|nut cheese' then 'Cheese Spreads'
    when d ~* 'milk|beverage|drink|oatmilk|barista' then 'Milk'
  end $$;

with c as (
  select distinct on (f->>'fdcId', b.brand_listing_id) b.brand_listing_id, f->>'fdcId' fdc_id, f->>'description' descr, f->>'brandName' brand_name,
    f->>'brandOwner' brand_owner, f->>'gtinUpc' gtin, nullif(f->>'servingSize','')::numeric serving, f->>'servingSizeUnit' unit,
    f->>'householdServingFullText' household, f->>'ingredients' ingredients, f->>'publishedDate' published, f->'foodNutrients' nutrients,
    f->>'marketCountry' country
  from ve_usda_brand2 b join net._http_response r on r.id = b.req and r.status_code = 200 and left(r.content, 1) = '{',
    jsonb_array_elements((r.content::jsonb)->'foods') f),
m as (
  select c.*, p.id product_id, p.brand_listing_id pbrand,
    case when c.descr = upper(c.descr) then initcap(lower(c.descr)) else c.descr end nice
  from c join listings l on l.id = c.brand_listing_id
  join ve_products p on p.brand_listing_id = l.id and p.product_type = ve_usda_type(regexp_replace(c.descr, 'creamery', '', 'gi'))
  where coalesce(c.country, 'United States') ilike 'united states'
    and (coalesce(c.brand_name, '') || ' ' || coalesce(c.brand_owner, '') || ' ' || c.descr) ~* regexp_replace(split_part(regexp_replace(l.name, '[^A-Za-z0-9 ]', '', 'g'), ' ', 1), 's$', '')
    and length(coalesce(c.ingredients, '')) > 5
    and c.ingredients !~* '\m(whey|casein|caseinate|lactose|milkfat|milk fat|butterfat|buttermilk|egg yolks?|eggs?|honey|gelatin|nonfat dry milk|dry milk|skim milk|whole milk|nonfat milk|non-fat milk|milk protein|creamery)\M'
    and c.ingredients !~* '(^|[,(:;\[]\s*)(ingredients:?\s*)?(pasteurized |organic |cultured |fresh )*(milk|cream)\s*([,(;.\[]|$)'
    and c.descr !~* 'popcorn|vegenaise|dressing|sauce|aioli|mayo|crackers|mac (&|and) cheese|pizza\M|curry|burrito|bowl'
    and (l.name not in ('Ben & Jerry''s Non-Dairy', 'Breyers Non-Dairy', 'Jeni''s Dairy-Free', 'Boursin Dairy-Free', 'Natural Bliss Plant-Based', 'Siggi''s Plant-Based', '365 by Whole Foods')
         or c.descr ~* 'non-?dairy|dairy[- ]free|plant[- ]based|vegan|oat|almond|coconut')),
lab as (select m.*, ve_usda_label(m.nutrients, m.serving, m.unit, m.household, m.nice, m.fdc_id) lbl from m)
insert into ve_product_barcodes (gtin, product_id, brand_listing_id, name, nutrition, macros, ingredients, fdc_id, source, status)
select distinct on (ve_gtin(gtin)) ve_gtin(gtin), product_id, pbrand, nice,
  case when lbl is null then null else jsonb_set(lbl - 'macros', '{serving}', to_jsonb(ve_fix_serving(lbl->>'serving'))) end,
  case when lbl is null then null else jsonb_set(lbl->'macros', '{serving}', to_jsonb(ve_fix_serving(lbl->'macros'->>'serving'))) end,
  ingredients, fdc_id, 'usda', 'live'
from lab where ve_gtin(gtin) is not null
order by ve_gtin(gtin), published desc nulls last
on conflict (gtin) do nothing;

with rep as (
  select distinct on (b.product_id) b.product_id, b.nutrition, b.macros, b.fdc_id
  from ve_product_barcodes b join ve_products p on p.id = b.product_id
  where p.macros is null and b.status = 'live' and b.nutrition is not null and b.name !~* 'culinary|cooking|canned|mini cup|sundae|barista'
  order by b.product_id, (b.name ~* left(lower(split_part(coalesce(p.made_from, ''), ',', 1)), 5)) desc,
    (b.name ~* 'original') desc, (b.name ~* 'plain') desc, (b.name ~* 'unsweetened') desc, (b.name ~* 'vanilla') desc, length(b.name), b.gtin)
update ve_products p set nutrition = coalesce(p.nutrition, rep.nutrition), macros = rep.macros,
  nutrition_source = coalesce(p.nutrition_source, 'USDA FoodData Central, Branded Foods, FDC ' || rep.fdc_id || ', as the brand reported it')
from rep where rep.product_id = p.id;
