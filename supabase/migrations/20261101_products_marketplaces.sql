-- Products trimmed (Sean, 2026-11-01): "I moved most of what was in fitness and athletics... over to services. So we can remove
-- that category. And e-commerce and marketplaces, let's just change it to marketplaces and remove Instacart, Etsy, Amazon,
-- Fiverr... and Lemon Squeezy... those listings would probably be better served on LESARUSS.ai. We're looking for more vegan
-- marketplaces." Marketplaces is for Vegan marketplaces (V Collective first).
-- 1. E-Commerce & Marketplaces becomes Marketplaces on Vegans Explore.
insert into public.ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'category', to_jsonb(category), '"Marketplaces"'::jsonb, '{"by":"Logan","why":"E-Commerce & Marketplaces renamed Marketplaces (Sean, 2026-11-01)"}'::jsonb
from public.listings where slug = 'v-collective' and category = 'E-Commerce & Marketplaces';
update public.listings set category = 'Marketplaces' where slug = 'v-collective' and category = 'E-Commerce & Marketplaces';

-- 2. The five general platforms go to the LESARUSS.ai Directory only (the candidate tag hides them here; their category stays,
-- which is LESARUSS.ai's). Amazon and Instacart keep their Vegan aisles by direct link.
insert into public.ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'tags', to_jsonb(tags), to_jsonb(array_append(tags, 'lesaruss-ai-directory-candidate')), '{"by":"Logan","why":"moved to LESARUSS.ai (Sean, 2026-11-01)"}'::jsonb
from public.listings where slug in ('amazon-com','etsy','instacart','fiverr','lemon-squeezy') and status = 'approved'
  and not ('lesaruss-ai-directory-candidate' = any(tags));
update public.listings set tags = array_append(tags, 'lesaruss-ai-directory-candidate')
where slug in ('amazon-com','etsy','instacart','fiverr','lemon-squeezy') and status = 'approved'
  and not ('lesaruss-ai-directory-candidate' = any(coalesce(tags, '{}')));

-- 3. Fitness and Athletics left the menu. Its one open row, Switch4Good (on hold for review), is a nonprofit.
insert into public.ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'category', to_jsonb(category), '"Nonprofits"'::jsonb, '{"by":"Logan","why":"Fitness and Athletics retired (Sean, 2026-11-01)"}'::jsonb
from public.listings where slug = 'switch4good' and category = 'Fitness and Athletics';
update public.listings set category = 'Nonprofits', vegan_status = null where slug = 'switch4good' and category = 'Fitness and Athletics';
