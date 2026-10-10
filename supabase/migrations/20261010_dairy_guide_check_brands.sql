-- The Dairy Guide's 20 "Check" brands, settled 2026-10-10 (Sean: "then the Check brands"). Each checked against a
-- 2025-2026 source: the brand's own live site (opened in a browser), dated retailer listings, or dated news.
-- In (11): Almond Breeze milk (every flavor but Hint of Honey; vitamin D2), Pacific Foods almond and coconut milk,
-- Elmhurst oat and cashew creamers, Miyoko's Cheddar cheese spread, Panacheeza, Wayfare sour cream, 365 coconut yogurt,
-- So Delicious coconut yogurt, Cocojune, So Delicious coconut and cashew pints.
-- Out: Big Mountain feta (Canada only), Milkadamia butter (discontinued), Elmhurst almond creamer (none; only a barista
-- milk), Daiya feta (not in Daiya's US range), Wayfare yogurt (not in Wayfare's range), Nature's Fynd (now a B2B
-- company), NotMilk (NotCo's US site is now B2B), JD's Vegan (site last updated 2022, Walmart unavailable), So Delicious
-- soy yogurt (discontinued), and, with no 2025-2026 retail evidence and dead or expired sites, Peaceful Rebel feta,
-- Spero cream cheese and ForA:Butter (foodservice). A later source can bring any of them back.
-- Adding a dairy_guide entry runs ve_products_sync (product pages and store aisles fill themselves).

-- New brand listings (Food Brands, the same shape as the Guide's other brands).
insert into public.listings (name, slug, tags, color, status, category, specialty, website, initials, location, description,
  crawl_source, vegan_status, address_country, tenant_id, business_status, details)
select v.name, v.slug, array['vegan-dairy-guide', v.tag], '#1f5f22', 'approved', 'Food Brands', 'Food Brands', v.website, v.initials, '',
  v.descr || ' Listed in The Vegan Dairy Guide (checked October 2026).', 'vegan-dairy-guide', v.vstatus, 'US',
  '00000000-0000-4000-a000-000000000001', 'OPERATIONAL',
  jsonb_build_object('source', 'vegan-dairy-guide', 'checked', '2026-10', 'approved_at', '2026-10-10', 'approved_for', 'vegan-dairy-guide',
    'dairy_guide', v.dg)
from (values
  ('Almond Breeze', 'almond-breeze', 'dairy-free-milk', 'https://www.bluediamond.com/brand/almond-breeze', 'AB', 'vegan_options',
   'Dairy-free milk. Made from: Almonds. Where to buy: Walmart, HEB, Giant, ShopRite.',
   '[{"cat":"Milk","base":"Almonds","note":"Every flavor except Hint of Honey; vitamin D2","where":"Walmart, HEB, Giant, ShopRite"}]'::jsonb),
  ('Pacific Foods', 'pacific-foods', 'dairy-free-milk', 'https://www.pacificfoods.com/', 'PF', 'vegan_options',
   'Dairy-free milk. Made from: Almond, coconut, hazelnut. Where to buy: Walmart, Kroger, Vitacost.',
   '[{"cat":"Milk","base":"Almond, coconut, hazelnut","note":"Organic plant-based beverages","where":"Walmart, Kroger, Vitacost"}]'::jsonb)
) v(name, slug, tag, website, initials, vstatus, descr, dg)
where not exists (select 1 from public.listings l where l.slug = v.slug);

-- Elmhurst, Cocojune and Panacheeza were already in listings as empty, unlisted (quarantined) imports with no city:
-- the same brands, so they become the Guide's listings instead of duplicates. Elmhurst's South Florida copy
-- (elmhurst-soflo) stays unlisted.
update public.listings l set
  name = v.name, slug = v.newslug, tags = array['vegan-dairy-guide', v.tag], color = '#1f5f22', status = 'approved',
  category = 'Food Brands', specialty = 'Food Brands', website = v.website, initials = v.initials,
  description = v.descr || ' Listed in The Vegan Dairy Guide (checked October 2026).', crawl_source = 'vegan-dairy-guide',
  vegan_status = 'fully_vegan', address_country = 'US', business_status = 'OPERATIONAL',
  details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('source', 'vegan-dairy-guide', 'checked', '2026-10',
    'approved_at', '2026-10-10', 'approved_for', 'vegan-dairy-guide', 'dairy_guide', v.dg)
from (values
  ('elmhurst', 'elmhurst', 'Elmhurst 1925', 'dairy-free-coffee-creamer', 'https://www.elmhurst1925.com/', 'E',
   'Dairy-free coffee creamer. Made from: Oats, cashews. Where to buy: brand site, natural grocers.',
   '[{"cat":"Coffee Creamer","base":"Oats, cashews","note":"Oat and cashew creamers","where":"Brand site, natural grocers"}]'::jsonb),
  ('panacheeza', 'panacheeza', 'Panacheeza', 'dairy-free-parmesan', 'https://panacheeza.com/', 'P',
   'Dairy-free parmesan. Made from: Cashews, nutritional yeast. Where to buy: brand site, Amazon.',
   '[{"cat":"Parmesan","base":"Cashews, nutritional yeast","note":"Sold online","where":"Brand site, Amazon"}]'::jsonb),
  ('cocojune_organic', 'cocojune', 'Cocojune', 'dairy-free-yogurt', 'https://cocojune.com/', 'C',
   'Dairy-free yogurt. Made from: Coconut. Where to buy: ShopRite, Target, Costco, Whole Foods.',
   '[{"cat":"Yogurt","base":"Coconut","note":"Cultured coconut yogurt","where":"ShopRite, Target, Costco, Whole Foods"}]'::jsonb)
) v(oldslug, newslug, name, tag, website, initials, descr, dg)
where l.slug = v.oldslug and l.status = 'quarantined' and l.address_city is null and l.address_state is null;

-- New Guide entries on brands already in the Guide (one row per brand; a category it already has is skipped).
update public.listings l set
  details = jsonb_set(l.details, '{dairy_guide}', coalesce(l.details->'dairy_guide', '[]'::jsonb) || coalesce((
    select jsonb_agg(e) from jsonb_array_elements(v.entries) e
    where not exists (select 1 from jsonb_array_elements(coalesce(l.details->'dairy_guide', '[]'::jsonb)) x where x->>'cat' = e->>'cat')), '[]'::jsonb)),
  tags = (select array_agg(distinct t) from unnest(l.tags || v.tags) t)
from (values
  ('so-delicious', '[{"cat":"Yogurt","base":"Coconut milk","note":"Coconut line; the soy yogurt ended","where":"Walmart, Kroger, Whole Foods"},
                    {"cat":"Ice Cream","base":"Coconut, cashew","note":"Coconut and cashew pints","where":"Stop & Shop, Giant"}]'::jsonb,
   array['dairy-free-yogurt', 'dairy-free-ice-cream']),
  ('365-by-whole-foods', '[{"cat":"Yogurt","base":"Coconut","note":"Unsweetened Original and Vanilla","where":"Whole Foods"}]'::jsonb, array['dairy-free-yogurt']),
  ('miyokos', '[{"cat":"Cheese Spreads","base":"Cashews","note":"Cheddar spread","where":"Miyoko''s store finder"}]'::jsonb, array['dairy-free-cheese-spreads']),
  ('wayfare', '[{"cat":"Sour Cream","base":"White beans, oats","note":"Dairy-free sour cream","where":"HEB"}]'::jsonb, array['dairy-free-sour-cream'])
) v(slug, entries, tags)
where l.slug = v.slug;
