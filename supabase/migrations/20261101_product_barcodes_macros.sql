-- Products: barcodes, macros, votes within the brand, and product picks in recipes (Sean, 2026-11-01: "a tab where they can scan
-- an item... it should take them to its profile... each product to be able to click on, see the nutrition value, which supermarkets
-- carry it. And for people to be able to vote for it within the brand... those products can then be pulled into... cookbook and
-- recipe"; then "Could we also list the macros of the item?").
--
-- * ve_product_barcodes: one row per barcode (GTIN, 14 digits, zero padded), the product line it belongs to, the item's own name and
--   its Nutrition Facts per serving (the same shape as ve_products.nutrition) and macros. Filled 2026-11-01 from USDA FoodData
--   Central Branded Foods (every record of each brand, matched to our product line by kind, nothing with milk, cream, whey, casein,
--   egg or honey in its ingredients), source 'usda'. A member's scan of an unknown barcode adds a 'pending' row (source 'member',
--   with what Open Food Facts said) that the team approves in Depot > Venues > Barcodes.
-- * ve_products.macros: {serving, cal, protein, carbs, fat, fiber, sugar, sodium, item, fdc} for the line's representative item
--   (plain, original or unsweetened first), the numbers the tiles, sorts and recipe totals read.
-- * ve_product_votes: one vote per member per product; counts and ranks show only on the brand's page.
-- * recipes.ingredient_types: the product type each ingredient line calls for (null where none), and ve_recipe_picks: a member's
--   chosen product for a line of a recipe, so their copy shows it with its picture, Buy link and macros.

create table if not exists ve_product_barcodes (
  gtin text primary key check (gtin ~ '^[0-9]{14}$'),
  product_id uuid references ve_products(id) on delete cascade,
  brand_listing_id uuid references listings(id) on delete set null,
  name text not null,
  nutrition jsonb,
  macros jsonb,
  ingredients text,
  image_url text,
  fdc_id text,
  source text not null default 'usda' check (source in ('usda', 'off', 'member', 'team')),
  status text not null default 'live' check (status in ('live', 'pending', 'rejected')),
  added_by uuid,
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
create index if not exists ve_product_barcodes_product on ve_product_barcodes (product_id) where status = 'live';
alter table ve_product_barcodes enable row level security;

alter table ve_products add column if not exists macros jsonb;

create table if not exists ve_product_votes (
  product_id uuid not null references ve_products(id) on delete cascade,
  member_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (product_id, member_id)
);
alter table ve_product_votes enable row level security;

alter table recipes add column if not exists ingredient_types jsonb;

create table if not exists ve_recipe_picks (
  member_id uuid not null,
  recipe_id uuid not null,
  line int not null check (line >= 0 and line < 200),
  product_id uuid not null references ve_products(id) on delete cascade,
  gtin text references ve_product_barcodes(gtin) on delete set null,
  created_at timestamptz not null default now(),
  primary key (member_id, recipe_id, line)
);
alter table ve_recipe_picks enable row level security;

create or replace function ve_gtin(p text) returns text language sql immutable as $$
  select case when length(regexp_replace(coalesce(p, ''), '\D', '', 'g')) between 8 and 14
    then lpad(regexp_replace(p, '\D', '', 'g'), 14, '0') end
$$;

-- FDA label rounding (21 CFR 101.9).
create or replace function ve_nf_round(kind text, v numeric) returns numeric language sql immutable as $$
  select trim_scale(case when v is null then null
    when kind = 'cal' then case when v < 5 then 0 when v <= 50 then round(v / 5) * 5 else round(v / 10) * 10 end
    when kind = 'fat' then case when v < 0.5 then 0 when v < 5 then round(v * 2) / 2 else round(v) end
    when kind = 'g' then case when v < 0.5 then 0 else round(v) end
    when kind = 'mg' then case when v < 5 then 0 when v <= 140 then round(v / 5) * 5 else round(v / 10) * 10 end
    else round(v, 1) end)
$$;

-- Nutrition Facts per serving from a USDA search record's foodNutrients (per 100 g or 100 mL) and its serving.
create or replace function ve_usda_label(nutrients jsonb, serving numeric, unit text, household text, product text, fdc text)
returns jsonb language plpgsql immutable as $$
declare f numeric; n jsonb := '{}'::jsonb; r jsonb; v numeric; s text; rows jsonb := '[]'::jsonb; cal numeric;
  u text := case when unit ~* '^(ml|mlt)$' then 'mL' else 'g' end;
begin
  if serving is null or serving <= 0 or nutrients is null then return null; end if;
  f := serving / 100.0;
  for r in select * from jsonb_array_elements(nutrients) loop
    v := (r->>'value')::numeric;
    if v is null then continue; end if;
    case (r->>'nutrientId')::int
      when 1008 then if coalesce(r->>'unitName','KCAL') ~* 'kcal' then n := n || jsonb_build_object('cal', v * f); end if;
      when 1003 then n := n || jsonb_build_object('protein', v * f);
      when 1004 then n := n || jsonb_build_object('fat', v * f);
      when 1005 then n := n || jsonb_build_object('carbs', v * f);
      when 1079 then n := n || jsonb_build_object('fiber', v * f);
      when 2000 then n := n || jsonb_build_object('sugar', v * f);
      when 1235 then n := n || jsonb_build_object('added', v * f);
      when 1093 then n := n || jsonb_build_object('sodium', v * f);
      when 1258 then n := n || jsonb_build_object('sat', v * f);
      when 1257 then n := n || jsonb_build_object('trans', v * f);
      when 1253 then n := n || jsonb_build_object('chol', v * f);
      when 1087 then n := n || jsonb_build_object('calcium', v * f);
      when 1089 then n := n || jsonb_build_object('iron', v * f);
      when 1092 then n := n || jsonb_build_object('potassium', v * f);
      when 1114 then n := n || jsonb_build_object('vitd', v * f);
      else null;
    end case;
  end loop;
  if not (n ? 'cal' and n ? 'protein' and n ? 'fat' and n ? 'carbs') then return null; end if;
  cal := ve_nf_round('cal', (n->>'cal')::numeric);
  s := coalesce(nullif(trim(household), '') || ' (' || trim(to_char(serving, 'FM999990.##')) || u || ')', trim(to_char(serving, 'FM999990.##')) || u);
  -- rows: [label, amount, %DV, indent(1)/sub-sub(2), bold, protein-last]
  rows := rows || jsonb_build_array(jsonb_build_array('Total Fat', ve_nf_round('fat', (n->>'fat')::numeric) || 'g', round(ve_nf_round('fat', (n->>'fat')::numeric) / 78 * 100) || '%', 0, 1));
  if n ? 'sat' then rows := rows || jsonb_build_array(jsonb_build_array('Saturated Fat', ve_nf_round('fat', (n->>'sat')::numeric) || 'g', round(ve_nf_round('fat', (n->>'sat')::numeric) / 20 * 100) || '%', 1)); end if;
  if n ? 'trans' then rows := rows || jsonb_build_array(jsonb_build_array('Trans Fat', ve_nf_round('fat', (n->>'trans')::numeric) || 'g', '', 1)); end if;
  if n ? 'chol' then rows := rows || jsonb_build_array(jsonb_build_array('Cholesterol', ve_nf_round('mg', (n->>'chol')::numeric) || 'mg', round(ve_nf_round('mg', (n->>'chol')::numeric) / 300 * 100) || '%', 0, 1)); end if;
  if n ? 'sodium' then rows := rows || jsonb_build_array(jsonb_build_array('Sodium', ve_nf_round('mg', (n->>'sodium')::numeric) || 'mg', round(ve_nf_round('mg', (n->>'sodium')::numeric) / 2300 * 100) || '%', 0, 1)); end if;
  rows := rows || jsonb_build_array(jsonb_build_array('Total Carbohydrate', ve_nf_round('g', (n->>'carbs')::numeric) || 'g', round(ve_nf_round('g', (n->>'carbs')::numeric) / 275 * 100) || '%', 0, 1));
  if n ? 'fiber' then rows := rows || jsonb_build_array(jsonb_build_array('Dietary Fiber', ve_nf_round('g', (n->>'fiber')::numeric) || 'g', round(ve_nf_round('g', (n->>'fiber')::numeric) / 28 * 100) || '%', 1)); end if;
  if n ? 'sugar' then rows := rows || jsonb_build_array(jsonb_build_array('Total Sugars', ve_nf_round('g', (n->>'sugar')::numeric) || 'g', '', 1)); end if;
  if n ? 'added' then rows := rows || jsonb_build_array(jsonb_build_array('Includes ' || ve_nf_round('g', (n->>'added')::numeric) || 'g Added Sugars', '', round(ve_nf_round('g', (n->>'added')::numeric) / 50 * 100) || '%', 2)); end if;
  rows := rows || jsonb_build_array(jsonb_build_array('Protein', ve_nf_round('g', (n->>'protein')::numeric) || 'g', '', 0, 1, 1));
  if n ? 'vitd' then rows := rows || jsonb_build_array(jsonb_build_array('Vitamin D', trim_scale(round((n->>'vitd')::numeric, 1)) || 'mcg', round((n->>'vitd')::numeric / 20 * 100) || '%')); end if;
  if n ? 'calcium' then rows := rows || jsonb_build_array(jsonb_build_array('Calcium', round((n->>'calcium')::numeric) || 'mg', round((n->>'calcium')::numeric / 1300 * 100) || '%')); end if;
  if n ? 'iron' then rows := rows || jsonb_build_array(jsonb_build_array('Iron', trim_scale(round((n->>'iron')::numeric, 1)) || 'mg', round((n->>'iron')::numeric / 18 * 100) || '%')); end if;
  if n ? 'potassium' then rows := rows || jsonb_build_array(jsonb_build_array('Potassium', round((n->>'potassium')::numeric) || 'mg', round((n->>'potassium')::numeric / 4700 * 100) || '%')); end if;
  return jsonb_build_object('cal', cal, 'rows', rows, 'serving', s, 'product', product, 'fdc', fdc,
    'macros', jsonb_strip_nulls(jsonb_build_object('serving', s, 'cal', cal,
      'protein', ve_nf_round('g', (n->>'protein')::numeric), 'carbs', ve_nf_round('g', (n->>'carbs')::numeric),
      'fat', ve_nf_round('fat', (n->>'fat')::numeric), 'fiber', ve_nf_round('g', (n->>'fiber')::numeric),
      'sugar', ve_nf_round('g', (n->>'sugar')::numeric), 'sodium', ve_nf_round('mg', (n->>'sodium')::numeric),
      'item', product, 'fdc', fdc)));
end $$;

-- Macros from a Nutrition Facts object we already hold (ve_products.nutrition, variants[].nutrition).
create or replace function ve_nf_macros(nf jsonb) returns jsonb language sql immutable as $$
  with r as (select x->>0 k, nullif(regexp_replace(x->>1, '[^0-9.]', '', 'g'), '')::numeric v from jsonb_array_elements(coalesce(nf->'rows', '[]'::jsonb)) x)
  select case when nf is null or nf->'cal' is null then null else jsonb_strip_nulls(jsonb_build_object('serving', nf->>'serving', 'cal', (nf->>'cal')::numeric,
    'protein', (select v from r where k = 'Protein' limit 1), 'carbs', (select v from r where k = 'Total Carbohydrate' limit 1),
    'fat', (select v from r where k = 'Total Fat' limit 1), 'fiber', (select v from r where k = 'Dietary Fiber' limit 1),
    'sugar', (select v from r where k = 'Total Sugars' limit 1), 'sodium', (select v from r where k = 'Sodium' limit 1),
    'item', nf->>'product', 'fdc', nf->>'fdc')) end
$$;

-- What a scan finds: the barcode's own item, its product line and brand. Pending and rejected rows say so.
create or replace function ve_barcode_lookup(p_code text) returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce((select jsonb_build_object('found', true, 'gtin', b.gtin, 'status', b.status, 'name', b.name, 'nutrition', b.nutrition,
      'macros', b.macros, 'ingredients', b.ingredients, 'image_url', b.image_url, 'source', b.source,
      'product', (select jsonb_build_object('id', p.id, 'slug', p.slug, 'name', p.name, 'product_type', p.product_type, 'image_url', p.image_url) from ve_products p where p.id = b.product_id),
      'brand', (select jsonb_build_object('id', l.id, 'slug', l.slug, 'name', l.name, 'logo_url', l.logo_url) from listings l where l.id = coalesce(b.brand_listing_id, (select brand_listing_id from ve_products where id = b.product_id))))
    from ve_product_barcodes b where b.gtin = ve_gtin(p_code) and b.status <> 'rejected'), jsonb_build_object('found', false, 'gtin', ve_gtin(p_code)))
$$;

revoke all on function ve_barcode_lookup(text) from public;
grant execute on function ve_barcode_lookup(text) to anon, authenticated, service_role;
