-- Playbook ve-local-food-products: BUILD RECORD, 2026-11-01 (Logan), so the Products work can be picked up in a new chat.
insert into public.playbook_records (slug, brand_slug, author, source, kind, body)
select 've-local-food-products', (select brand_slug from public.playbook_records where slug = 've-local-food-products' limit 1),
  'Logan', 'text', 'decision',
$body$BUILD RECORD, 2026-11-01 (Logan). Local Food and Products, built and filled. Full detail: CLAUDE.md in lesaruss/vegansexplore-com, section "Local Food and Products". Last commit fe79cb2 (main and claude/zen-darwin-3x17hh).

1. BUILT AND LIVE. Food is Local Food and opens on All, following the picked location. Food Brands (shown as Food & Drink) and Nutrition & Supplements live in Products, which opens on every location; Sells at has Near me. Every section opens on All. No place on a Products card (its label is its shelf). The Type filter has no Online choice. Supermarket chains show only under Markets (switch: All markets, Local markets, Supermarkets) and only in chapters where they have stores.

2. PRODUCTS TRIMMED (Sean). Fitness and Athletics left the menu (Switch4Good on hold as Nonprofits). E-Commerce & Marketplaces became Marketplaces, Vegan marketplaces only. Amazon, Etsy, Instacart, Fiverr and Lemon Squeezy went to LESARUSS.ai only (tag lesaruss-ai-directory-candidate). The name stays Products (Sean).

3. FILLED, whole-Vegan brands only, checked by web search. Live counts at the close: Food & Drink 81 (Meal Prep & Delivery 7), Nutrition & Supplements 22, Clothing 10, Beauty 12, Marketplaces 5.
- Marketplaces: V Collective, Vegan America, Vegan Essentials, Alternative Stores, Vegancuts.
- Clothing: NAE, Vegetarian Shoes, Save The Duck, Angela Roi, Doshi, Plant Faced Clothing. Beauty: e.l.f., Milk Makeup, KVD Beauty, Youth To The People, Acure, Lime Crime, Jecca Blac.
- Food & Drink round: Beyond Meat, Field Roast, Gardein, HIPPEAS, Koia, Partake, Abe's, Navitas Organics (promoted from the June import), Konscious Foods, Simply Eggless, Crackd (new); four brands given types.
- Impossible Foods listed on Sean's word, its description saying it tested its heme on rats in 2017 for the FDA.
- Noize open again. Immaculate Vegan marked Permanently closed.
- Left out: PlantX, The Vegan Kind, Will's Vegan Store, Hourglass, INIKA, Versed, OSEA, Good Catch, Sophie's Kitchen, Upton's Naturals, Lightlife.

4. MEAL PREP & DELIVERY. A product kind, meals, under Food & Drink, with a switch on that shelf (All food & drink, Meal Prep & Delivery). The five Local Food Meal Prep listings were national shippers and moved here (Purple Carrot, Sakara Life, Splendid Spoon; Mosaic Foods and Trifecta Nutrition as Vegan options), Daily Harvest added. Local Food > Meal Prep is for local meal preppers. Note: those five carry the LESARUSS tenant id from an old import; the Directory does not filter by tenant, so they show.

5. GOOGLE COSTS (Sean: "monitor and cap"). Every Places call is metered (ve_google_usage) and capped (ve_site_settings google_budget: 40 searches and 40 details a day, background 60%, $15 a month, Logan's defaults). Depot > Analytics > Google costs. Before any scan over about 200 calls, give Sean the count and cost and wait for his go. The real October bill was $13.80.

6. SCHEDULED, 2026-11-02 (this chat's scheduled tasks):
- 08:05 UTC, Central Florida Publix import, the last Publix area (supermarket work itself moved to another chat).
- 08:40 UTC, the local meal prep search: step 1 searches, step 2 inserts (scripts/meal-prep-search/), migration 20261102_meal_prep_search.sql, then essentials and menus queued.

7. NEXT. Report the meal prep search by chapter. Check the logo sweep picked up the new brands. A Local Food scan in thin chapters needs a cost estimate and Sean's go. More Products rounds (Nutrition, Clothing, Beauty) when Sean asks. LESARUSS.ai's /directory still lacks sectionMenu and location.$body$
where not exists (select 1 from public.playbook_records where slug = 've-local-food-products' and body like 'BUILD RECORD, 2026-11-01%');
