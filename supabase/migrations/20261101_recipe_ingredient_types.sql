-- Recipe ingredients tagged with the product type they call for (Sean, 2026-11-01: "If the ingredient calls for coffee creamer...
-- people will be able to pick and choose which coffee creamer they want"). recipes.ingredient_types is one entry per ingredient line
-- (a ve_products.product_type, or null), set by trigger whenever a recipe's ingredients change, so a recipe approved in Depot >
-- Cookbook is tagged on its own. The live barcodes are public to read, the way ve_products is.

create or replace function ve_ingredient_type(line text) returns text language sql immutable as $$
  select case
    when line is null or line ~* 'cream of tartar|nut butter|peanut butter|almond butter|cashew butter|cocoa butter|apple butter|sunflower butter|seed butter|butter beans?|buttermilk'
      and line !~* '\m(vegan|plant) butter' then null
    when line ~* 'creamer' then 'Coffee Creamer'
    when line ~* 'cream cheese' then 'Cream Cheese'
    when line ~* 'sour cream' then 'Sour Cream'
    when line ~* 'ice cream|frozen dessert' then 'Ice Cream'
    when line ~* 'yogh?urt' then 'Yogurt'
    when line ~* 'parmesan|\mparm\M' then 'Parmesan'
    when line ~* '\mfeta\M' then 'Feta'
    when line ~* 'cheese slices?|sliced (vegan |plant[- ]based |dairy[- ]free )?cheese' then 'Cheese Slices'
    when line ~* 'shredded|shreds|mozzarella|cheddar' then 'Shredded Cheese'
    when line ~* 'cheese spread|spreadable cheese' then 'Cheese Spreads'
    when line ~* '\mbutter\M' then 'Butter'
    when line ~* '\mmilk\M' and line !~* '\mcan\M|canned|full[- ]fat|condensed|evaporated|powder|coconut cream' then 'Milk'
  end
$$;

create or replace function ve_recipe_ingredient_types(ingredients jsonb) returns jsonb language sql immutable as $$
  select case when jsonb_typeof(ingredients) <> 'array' then null else
    (select jsonb_agg(to_jsonb(ve_ingredient_type(case when jsonb_typeof(x) = 'string' then x #>> '{}' else x->>'name' end)) order by o)
     from jsonb_array_elements(ingredients) with ordinality t(x, o)) end
$$;

create or replace function ve_recipe_tag_types() returns trigger language plpgsql as $$
begin
  new.ingredient_types := ve_recipe_ingredient_types(new.ingredients);
  return new;
end $$;

drop trigger if exists trg_ve_recipe_tag_types on recipes;
create trigger trg_ve_recipe_tag_types before insert or update of ingredients on recipes
  for each row execute function ve_recipe_tag_types();

update recipes set ingredient_types = ve_recipe_ingredient_types(ingredients);

drop policy if exists "public read live" on ve_product_barcodes;
create policy "public read live" on ve_product_barcodes for select using (status = 'live');
