-- The Dairy Guide, round 2 (Sean, 2026-10-10: "I want this dairy guide to be ready because we can literally push this out
-- to get people to log in right now"). Everything votable for Guide members, a square picture beside every item
-- (photorealistic, labelled illustrative until real photos replace them), a shopping list on every recipe, and a gallery of
-- members' own photos of what they made (photos only, no written reviews; Sean approves each in Depot > Cookbook).

-- Pictures. photo_illustrative marks a generated picture, so the page can say so until a real photo replaces it.
alter table public.recipes add column if not exists photo_illustrative boolean not null default false;
update public.recipes r set photo_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/guides/dairy/r-' || r.slug || '.jpg',
  photo_illustrative = true
where r.slug in ('maya-banana-ice-cream', 'maya-homemade-buttermilk', 'maya-homemade-cheese-sauce', 'maya-homemade-cream-cheese',
  'maya-homemade-evaporated-milk', 'maya-homemade-ghee', 'maya-homemade-heavy-cream', 'maya-homemade-parmesan', 'maya-homemade-ricotta',
  'maya-homemade-sour-cream', 'maya-homemade-sweetened-condensed-milk', 'maya-homemade-whipped-cream', 'maya-nut-milk')
  and r.photo_url is null;

-- Maya's recipes carried only their steps; the shopping list needs what goes in (taken from the steps).
update public.recipes r set ingredients = v.ing
from (values
  ('maya-banana-ice-cream', '["Frozen ripe bananas", "Frozen fruit of your choice", "A few pitted dates", "Plant milk", "1 tbsp vanilla extract", "Mulberries, to top"]'::jsonb),
  ('maya-homemade-buttermilk', '["1 tbsp lemon juice or vinegar", "Soy milk, to the 1-cup line"]'::jsonb),
  ('maya-homemade-cheese-sauce', '["2 cups boiled potato", "1 cup boiled carrot", "1/2 cup water", "1/2 cup nutritional yeast", "2 tbsp oil", "1 tbsp lemon juice", "1 tsp salt"]'::jsonb),
  ('maya-homemade-cream-cheese', '["1 1/2 cups soaked cashews", "2 tbsp lemon juice", "2 tsp cider vinegar", "1 tsp refined coconut oil"]'::jsonb),
  ('maya-homemade-evaporated-milk', '["Plant milk"]'::jsonb),
  ('maya-homemade-ghee', '["Refined coconut oil", "Turmeric", "Salt", "A pinch of asafoetida"]'::jsonb),
  ('maya-homemade-heavy-cream', '["1 cup soaked raw cashews", "3/4 to 1 cup water"]'::jsonb),
  ('maya-homemade-parmesan', '["3/4 cup raw cashews", "3 tbsp nutritional yeast", "3/4 tsp salt", "1/4 tsp garlic powder"]'::jsonb),
  ('maya-homemade-ricotta', '["12 oz firm tofu", "3 tbsp lemon juice", "3 tbsp nutritional yeast", "1/2 tsp garlic powder", "Salt and pepper"]'::jsonb),
  ('maya-homemade-sour-cream', '["1 cup soaked cashews", "2 tbsp lemon juice", "2 tsp cider vinegar", "1/2 tsp salt", "1/3 cup water"]'::jsonb),
  ('maya-homemade-sweetened-condensed-milk', '["1 can full-fat coconut milk", "Sugar"]'::jsonb),
  ('maya-homemade-whipped-cream', '["1 can full-fat coconut milk", "Or: aquafaba, the liquid from a can of chickpeas", "A pinch of cream of tartar"]'::jsonb),
  ('maya-homemade-yogurt', '["4 cups plain soy milk", "A starter: probiotic powder or a few spoons of live plant yogurt"]'::jsonb),
  ('maya-nut-milk', '["1 cup raw nuts", "4 cups fresh filtered water"]'::jsonb)
) v(slug, ing)
where r.slug = v.slug and coalesce(jsonb_array_length(r.ingredients), 0) = 0;

-- Who counts as a Guide member: anyone who owns the Guide (ve_guide_purchases). A Guide's recipes are tagged with its
-- short slug (vegan-dairy-guide); the Guide itself has two ve_guides rows (vegan-dairy-guide, vegan-dairy-guide-site).
create or replace function public.ve_owns_guide(p_member uuid, p_guide text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from ve_guide_purchases p join ve_guides g on g.id = p.guide_id
                 where p.member_id = p_member and (g.slug = p_guide or g.slug = p_guide || '-site'));
$$;
revoke all on function public.ve_owns_guide(uuid, text) from public, anon, authenticated;

-- Votes on anything in a Guide that is not a recipe, a brand or a cookbook (those have their own): swaps and episodes.
create table if not exists public.ve_guide_votes (
  guide_slug text not null,
  kind text not null check (kind in ('swap', 'episode')),
  item_key text not null,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (guide_slug, kind, item_key, member_id)
);
alter table public.ve_guide_votes enable row level security;

-- Members' photos of a recipe they made. Pending until Sean approves it in Depot > Cookbook; only live ones are shown.
create table if not exists public.recipe_photos (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  path text not null,
  status text not null default 'uploading' check (status in ('uploading', 'pending', 'live', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
create index if not exists recipe_photos_recipe on public.recipe_photos (recipe_id, status);
alter table public.recipe_photos enable row level security;
