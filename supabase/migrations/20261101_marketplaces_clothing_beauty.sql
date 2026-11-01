-- Products: Vegan marketplaces, then Clothing and Beauty (Sean, 2026-11-01: "add the Vegan marketplaces, then do Clothing and
-- Beauty"). Same rule as Nutrition & Supplements: a brand or store goes in only when its whole line is Vegan. Checked 2026-11-01 by
-- web search (the session cannot open brand sites).
-- Marketplaces: Vegan America (the US all-plant-based marketplace Sean named), Vegan Essentials (online since 1997), Alternative
-- Stores (UK, bought by Heather Mills in 2024), and Vegancuts (promoted from the import). Left out: PlantX (no sign it still trades),
-- The Vegan Kind (closed 2022), Immaculate Vegan (already listed, marked closed; PitchBook: out of business 2026-03-31).
-- Clothing: NAE, Vegetarian Shoes, Save The Duck, Angela Roi, Doshi, Plant Faced Clothing. Left out: Will's Vegan Store (closed),
-- Brave GentleMan (no current sign of trading found), Stella McCartney and Veja (not fully Vegan).
-- Beauty: e.l.f. Cosmetics (promoted from the import), Milk Makeup, KVD Beauty, Youth To The People, Acure, Lime Crime, Jecca Blac.
-- Left out: Hourglass (the date it went fully Vegan is unconfirmed), INIKA (reports of beeswax), Versed and OSEA (not confirmed).
-- Online brands: location Online, no chapters (Products shows no place on the card). Logos come from the logo sweep.

with b(slug, name, category, specialty, website, tagline, description) as (values
 ('vegan-america', 'Vegan America', 'Marketplaces', 'All plant-based online marketplace', 'https://vegan-america.com',
  'The 100% plant-based marketplace',
  'A US online marketplace that is 100% plant-based: food, cosmetics and fashion from big Vegan brands and small independents in one store, with member savings and reward points.'),
 ('vegan-essentials', 'Vegan Essentials', 'Marketplaces', 'Vegan online store since 1997', 'https://veganessentials.com',
  'Everything Vegan, online since 1997',
  'One of the longest running all-Vegan online stores, since 1997: groceries, cheese and meat alternatives, vitamins, personal care and more, all Vegan.'),
 ('alternative-stores', 'Alternative Stores', 'Marketplaces', 'Vegan online supermarket, UK', 'https://alternativestores.com',
  'The UK''s all-Vegan online store',
  'An all-Vegan online store from the UK: snacks, drinks, cheese and butter alternatives, chocolate, pet food, footwear and clothing. Twice voted Best Vegan Store at the Vegan Awards.'),
 ('nae-vegan-shoes', 'NAE Vegan Shoes', 'Clothing and Fashion', 'Vegan shoes and bags from Portugal', 'https://nae-vegan.com',
  'No Animal Exploitation, since 2008',
  'NAE stands for No Animal Exploitation. Vegan shoes, bags and accessories made in audited factories in Portugal since 2008, PETA-approved Vegan.'),
 ('vegetarian-shoes', 'Vegetarian Shoes', 'Clothing and Fashion', 'Vegan footwear since 1990', 'https://vegetarian-shoes.co.uk',
  'Vegan footwear since 1990',
  'Brighton shoemaker making Vegan boots, shoes, sandals, belts and bags since 1990. Every shoe is Vegan, despite the name, chosen when the word Vegan was less known.'),
 ('save-the-duck', 'Save The Duck', 'Clothing and Fashion', 'Animal-free outerwear', 'https://savetheduck.com',
  '100% animal-free outerwear',
  'Italian outerwear brand that is 100% animal free: no down, fur, leather, wool or silk. A B Corp, and PETA''s 2019 Company of the Year.'),
 ('angela-roi', 'Angela Roi', 'Clothing and Fashion', 'Vegan handbags', 'https://angelaroi.com',
  'Vegan handbags, made fairly',
  'Fully Vegan handbag brand making classic purses, totes and crossbodies from Vegan leather, with fair labor standards and a donation from each sale by color.'),
 ('doshi', 'Doshi', 'Clothing and Fashion', 'Vegan bags, wallets and belts', 'https://doshi.shop',
  'Vegan accessories, glue to thread',
  'California brand making bags, wallets, belts and backpacks that are 100% Vegan, down to the glue, thread and hardware. PETA-approved.'),
 ('plant-faced-clothing', 'Plant Faced Clothing', 'Clothing and Fashion', 'Vegan streetwear, London', 'https://plantfacedclothing.com',
  'Vegan streetwear from London',
  'Independent London streetwear label, 100% Vegan and ethical: tees, hoodies, caps and socks, screen printed in London.'),
 ('milk-makeup', 'Milk Makeup', 'Beauty and Personal Care', 'Vegan makeup', 'https://milkmakeup.com',
  'Fully Vegan makeup',
  'New York makeup brand that went fully Vegan in 2018, taking out beeswax, lanolin and carmine. Known for its sticks, primers and mascara.'),
 ('kvd-beauty', 'KVD Beauty', 'Beauty and Personal Care', 'Vegan makeup', 'https://kvdbeauty.com',
  '100% Vegan makeup',
  'Makeup brand relaunched in 2018 as 100% Vegan and cruelty-free: foundation, liner, lipstick and more. Owned by LVMH, which is not cruelty-free as a group.'),
 ('youth-to-the-people', 'Youth To The People', 'Beauty and Personal Care', 'Vegan skincare', 'https://youthtothepeople.com',
  'Vegan superfood skincare',
  'California skincare brand whose every formula is Vegan and cruelty-free, made with superfood extracts. Part of L''Oreal since 2021.'),
 ('acure', 'Acure', 'Beauty and Personal Care', 'Vegan skin, hair and body care', 'https://acure.com',
  '100% Vegan skin, hair and body',
  'Affordable skin, hair and body care that is 100% Vegan and cruelty-free, after the few beeswax products were reformulated.'),
 ('lime-crime', 'Lime Crime', 'Beauty and Personal Care', 'Vegan makeup and hair color', 'https://limecrime.com',
  'Bold Vegan makeup',
  'Makeup and hair color in bold shades, made entirely without animal ingredients and cruelty-free.'),
 ('jecca-blac', 'Jecca Blac', 'Beauty and Personal Care', 'Vegan, genderless makeup', 'https://jeccablac.com',
  'Genderless Vegan makeup',
  'UK makeup brand that is genderless and 100% Vegan, made for every face.')
)
insert into public.listings (name, slug, category, specialty, description, tagline, location, website, status, vegan_status,
  communities, crawl_source, tenant_id, initials, details)
select b.name, b.slug, b.category, b.specialty, b.description, b.tagline, 'Online', b.website, 'approved', 'fully_vegan',
  '{}'::text[], 'admin', '00000000-0000-4000-a000-000000000002', upper(left(b.name, 1)),
  jsonb_build_object('added_by_hand', true, 'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
    'text', 'Added 2026-11-01 to ' || b.category || ': a whole-Vegan brand or store, checked by web search.')))
from b
where not exists (select 1 from public.listings l where l.slug = b.slug and l.status = 'approved');

-- Promote the two the import left quarantined (no second copy).
update public.listings set name = 'Vegancuts', category = 'Marketplaces', specialty = 'Vegan boxes and shop',
  description = 'US Vegan subscription boxes and shop, in business for more than 15 years: a monthly beauty box of cruelty-free Vegan products from indie and well-known brands, and snacks.',
  tagline = 'Vegan boxes and finds', location = 'Online', website = 'https://vegancuts.com', status = 'approved', vegan_status = 'fully_vegan',
  communities = '{}', crawl_source = coalesce(crawl_source, 'admin'), tenant_id = '00000000-0000-4000-a000-000000000002', initials = 'V',
  details = coalesce(details, '{}'::jsonb) || jsonb_build_object('added_by_hand', true, 'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
    'text', 'Listed 2026-11-01 from the import (it was quarantined): a whole-Vegan store, checked by web search.')))
where slug = 'vegancuts' and status = 'quarantined';

update public.listings set name = 'e.l.f. Cosmetics', category = 'Beauty and Personal Care', specialty = 'Vegan makeup and skincare',
  description = 'Affordable makeup and skincare that is 100% Vegan and cruelty-free worldwide, Leaping Bunny certified, with synthetic brushes and lashes.',
  tagline = '100% Vegan, worldwide', location = 'Online', website = 'https://elfcosmetics.com', status = 'approved', vegan_status = 'fully_vegan',
  communities = '{}', crawl_source = coalesce(crawl_source, 'admin'), tenant_id = '00000000-0000-4000-a000-000000000002', initials = 'E',
  details = coalesce(details, '{}'::jsonb) || jsonb_build_object('added_by_hand', true, 'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
    'text', 'Listed 2026-11-01 from the import (it was quarantined): a whole-Vegan brand, checked by web search.')))
where slug = 'elfcosmetics' and status = 'quarantined';
