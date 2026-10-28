-- Vegan Foodie Fest Miami vendors to Ready to list (Sean, 2026-10-28: the case study links each vendor to its page).
-- Source: the booth sheet in Sean's Drive (Partner Sheet - Vegan Foodie Fest, OFFICIAL VENDOR LIST) and Sean's vendor list.
-- Each clean copy waits in Business outreach > New places with the guessed category in its note; How Vegan stays Sean's pick.
-- Duplicate import copies are merged into the clean one (rejected with details.merged_into), never deleted. Nothing goes live.

-- Duplicate import copies merged into the clean one.
with d(id, keep) as (values
  ('31aab806-6929-406c-b3f1-305a9a100311'::uuid, 'c4b9a7cf-17b9-430e-b2ca-d4ac634d32b1'::uuid),
  ('886affd9-19eb-4a30-9b4f-0d4e5d603cb4', 'cabf2c02-f0ba-475a-b509-0475aa0c8faf'),
  ('d0284d97-ccbe-45cb-9a0d-a9cf55f9a7f9', '07facba1-1490-4050-9255-dc60fdb83398'),
  ('de2f4c6d-f060-4b1c-8f64-09a0ec96f619', 'c8509a42-f15e-4e2a-b134-0076385fdf6c'),
  ('75eb2e68-c41f-4b40-89c1-94b6b16adc64', 'c8509a42-f15e-4e2a-b134-0076385fdf6c')
), m as (
  update public.listings l set status = 'rejected', updated_at = now(),
    details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('merged_into', d.keep, 'merged_at', now(), 'status_before_merge', l.status)
  from d where l.id = d.id and l.status = 'quarantined' returning l.id
)
update public.ve_backlog_checks b set decision = 'hidden', decided_at = now()
from d where b.listing_id = d.id and b.decision is null;

with v(id, name, ig, community, verdict, reason) as (values
  ('df75b918-7f9e-4778-b3ef-779d94c2906e'::uuid, 'Altro Foods', 'altrofoodusa', 'central-florida', 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (booth A8, came from Tampa). Logan''s guess: Food Brands.'),
  ('cabf2c02-f0ba-475a-b509-0475aa0c8faf', 'Shena''s Confections', 'shenasconfections', 'south-florida', 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (booth A2, desserts). Logan''s guess: Vendors.'),
  ('07facba1-1490-4050-9255-dc60fdb83398', 'Vutchery', 'vutchery', 'south-florida', 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (booth A6, products). Logan''s guess: Food Brands.'),
  ('bf4a26f7-a289-4e13-9067-813525434c7d', 'Zero Degrees', 'zerodegreesfoodtruck', 'south-florida', 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (food truck C19, desserts). Logan''s guess: Food Trucks.'),
  ('c8509a42-f15e-4e2a-b134-0076385fdf6c', 'The Corn Soup King', 'thecornsoupking', 'south-florida', 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (booth B14). Logan''s guess: Vendors.'),
  ('dd9749fa-88af-4042-bcdb-3310173895d1', 'Elite Fusion Catering', 'elitefusioncatering', 'south-florida', 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (booth B15). Logan''s guess: Catering.'),
  ('8e0a52bb-b246-4285-97af-74ed4f3356fc', 'Manka', 'mankafood', 'south-florida', 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (booth A5). Logan''s guess: Vendors.'),
  ('ba6251d4-0577-4e38-9c35-f7e762121887', 'Moss Be Good', 'mossbegood', 'south-florida', 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (booth B16, sea moss products). Logan''s guess: Nutrition & Supplements.'),
  ('8ad5583c-eb49-4964-81bc-5ddb3e7b9d85', 'Naranja Piña Gelato', 'naranjapinagelato', 'south-florida', 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (food truck C21). Google lists it as an ice cream shop, so it may not be all Vegan. Logan''s guess: Food Trucks.'),
  ('4e0675fc-bd10-4681-b14f-c0d4d82e27cb', 'Oatrageous', 'drinkoatrageous', null, 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (booth A3, oat milk liqueur). Logan''s guess: Food Brands.'),
  ('084cfd1a-de93-4116-8d1c-b14448e2137b', 'Sacred Vedic Arts', 'sacredvedicarts', 'south-florida', 'list', 'At Vegan Foodie Fest Miami, Feb 23, 2025 (booth B17). Instagram calls it a community center. Logan''s guess: Health and Wellness.'),
  ('02cbc749-041f-42a3-901f-ce4f22f89375', 'So Krazy Vegan', 'thekrazyvegan', 'south-florida', 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (food truck C20). Logan''s guess: Food Trucks.'),
  ('7d84b042-6203-4965-b364-1ef3bb9be600', 'Tropical Silver', 'tropicalsilver20', 'south-florida', 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (food truck C22). Logan''s guess: Food Trucks.'),
  ('b2563f3f-801a-42cc-9c24-2f8e8b421f31', 'Troups Vegan-Pescatarian Trap', 'troups_veganpescatariantrap', 'south-florida', 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (booth B18). Logan''s guess: Vendors.'),
  ('1aae3990-9f5e-4864-bde9-4c7c213bb305', 'West Indies Peppa Sauce', 'shopwips', 'central-florida', 'list', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (booth A7, came from Orlando). Logan''s guess: Food Brands.'),
  ('c4b9a7cf-17b9-430e-b2ca-d4ac634d32b1', 'Queen''s Vegan Creperie', 'queensvegancreperie', 'south-florida', 'check', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (booth A1), but no Instagram post since March 2025: check it is still running. Logan''s guess: Vendors.'),
  ('f8f5e50e-b539-4538-8c61-55c4535e42be', 'Fish Are Friends', 'fafvegansushi', 'south-florida', 'check', 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (booth A4, Vegan sushi), but @fafvegansushi no longer exists: check for a new name before listing. Logan''s guess: Vendors.')
), upd as (
  update public.listings l set name = v.name, instagram = v.ig, ig_handle = v.ig, initials = upper(left(v.name, 1)), updated_at = now(),
    details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('foodie_fest', jsonb_build_object('event', 'Vegan Foodie Fest Miami', 'date', '2025-02-23', 'source', 'booth sheet'))
  from v where l.id = v.id and l.status = 'quarantined' returning l.id
)
update public.ve_backlog_checks b set verdict = v.verdict, reason = v.reason, community_slug = v.community, stage = 'done', checked_at = now()
from v where b.listing_id = v.id and b.decision is null;

-- Two vendors on the booth sheet with no listing yet.
insert into public.listings (name, category, specialty, description, status, website, location, address_city, address_state, initials, crawl_source, details)
select x.name, 'Uncategorized', '', '', 'quarantined', '', 'Miami, FL', 'Miami', 'FL', upper(left(x.name, 1)), 'paste',
  jsonb_build_object('foodie_fest', jsonb_build_object('event', 'Vegan Foodie Fest Miami', 'date', '2025-02-23', 'source', 'booth sheet'))
from (values ('Camisetas Miami'), ('Ethnikos Plantisserie')) x(name)
where not exists (select 1 from public.listings l where l.name ilike x.name and l.status in ('approved', 'quarantined'));

insert into public.ve_backlog_checks (listing_id, track, stage, verdict, reason, community_slug, checked_at)
select l.id, 'google', 'done', 'check',
  case l.name when 'Camisetas Miami' then 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (a late booth, shirts). No Instagram or website on the booth sheet: find them first. Logan''s guess: Clothing and Fashion.'
    else 'Vendor at Vegan Foodie Fest Miami, Feb 23, 2025 (a late booth). No Instagram or website on the booth sheet: find them first. Logan''s guess: Vendors.' end,
  'south-florida', now()
from public.listings l
where l.name in ('Camisetas Miami', 'Ethnikos Plantisserie') and l.status = 'quarantined'
  and not exists (select 1 from public.ve_backlog_checks b where b.listing_id = l.id);
