-- Local Food and Products (LOCKED by Sean 2026-11-01: "lock it"). Concept session with V; canon canon-ve-local-food-products,
-- playbook ve-local-food-products. Records the decision; the build follows.
insert into public.knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary, body)
select 'canon-ve-local-food-products',
  'Vegans Explore Directory: Local Food is what is here, Products is what you can buy anywhere (LOCKED by Sean 2026-11-01)',
  'decisions', 'interface', 'active', 'sar', false, 50,
  array['vegans-explore','directory','navigation','food','products','brands'], 1, 'v', 'v',
  'Locked with V''s defaults (Sean: "lock it").',
  jsonb_build_object(
    'why', 'Sean: "Why are we putting restaurants above everybody else? They should see everything and then filter for what they want." Food opened on Restaurants only because Food Brands, sold everywhere, sat in Food and would flood All with brands that are not local to the chapter. Products is the section our sponsors and bigger brands see themselves in, and local brands that ship or have a product line stand on the same footing there.',
    'rename', 'Food becomes Local Food: what is here, in the picked location ("Local Food · South Florida"). National grocery chains stay under Markets in Local Food: a store in the chapter is here.',
    'move', 'Food Brands (shown in Products as Food & Drink) and Nutrition & Supplements move from Food to Products. The stored category values stay "Food Brands" and "Nutrition & Supplements", so no listing data changes, only the section they sit under. Products: All, Food & Drink, Nutrition & Supplements, Fitness & Athletics, Clothing & Fashion, Beauty & Personal Care, E-Commerce & Marketplaces.',
    'all_first', 'Every section opens on All. Replaces the 2026-10-26 rule (first sub-section first, All last), which existed only because of Food Brands. Community already did this.',
    'local_food_location', 'In Local Food the location applies to every listing; no brand exceptions remain there.',
    'products_location', 'Products opens on every location. Location is an optional filter: Sells at gains Near me (Anywhere, Near me, Markets & events, Online & stores), which brings the location back for local shops with a storefront.',
    'both_shelves', 'A local business with a product line keeps its local main category and adds Food Brands under Also show it under, so it shows in Local Food and in Products. A brand that vends keeps Vendors as an extra category and shows under Local Food > Vendors with the location (existing vendsAt).',
    'knock_on', 'Products wears the All cities ad pair (the national sponsor real estate); Local Food the chapter''s pair. The Guide tab map (Food Brands to the Dairy Guide) is unchanged. Vetting goes by main category and never covered brands, unchanged. Change the section lists together (CAT_MAP, CAT_CONFIG, LOC_SECTIONS, SUB_FILTERS in ve-region-directory.js; SECTIONS in ve-listing-admin.js; KINDS in Directory review; CATEGORIES in ve-claims and ve-discover; LISTING_CATEGORIES in ve-outreach; FOOD_CATS in directory/listing.html; CATS in claim.html). Old ?tab=food&sub=food-brands links land on Products. LESARUSS.ai shares the component; check both sites.',
    'playbook', 've-local-food-products')
where not exists (select 1 from public.knowledge_records where slug = 'canon-ve-local-food-products');

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-local-food-products', 'vegans-explore', 'V',
  'Locked by Sean 2026-11-01 ("lock it"). Food becomes Local Food and opens on All: everything in the picked location, filtered from there. Food Brands (as Food & Drink) and Nutrition & Supplements move to Products, where national brands, sponsors and local brands with a product line sit side by side; stored categories unchanged. Every section opens on All (replacing All last). Products opens on every location; Sells at gains Near me for local shops. A local business with a product line adds Food Brands as an extra category to show in both. Products wears the All cities ad pair, Local Food the chapter''s. Guide tab map and vetting unchanged. Old food-brands links land on Products. Canon canon-ve-local-food-products. Next: Logan builds.',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-local-food-products' and kind = 'decision');
