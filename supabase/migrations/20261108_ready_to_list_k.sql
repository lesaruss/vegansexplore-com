-- ve-community-directory K: the 44 in Business outreach > New places > Ready to list (Sean, 2026-11-08: "K as recommended, set aside 39 to 44").
-- Mirrors ve-discover backlog_decide. Two Google matches were wrong (Ou La La matched LA Vegan; Miami Beach Vegan matched Aura Miami Beach):
-- Ou La La is listed without the place; Miami Beach Vegan is left in Ready to list for Sean.
with d(id, cat, vs, use_place, comm, st, kinds, extra, site) as (values
 ('0d78c3d2-242d-4033-bf49-38e3042bc0a1'::uuid,'Meal Prep','fully_vegan',false,array['los-angeles'],'CA',null::text[],null::text[],null::text),
 ('02cbc749-041f-42a3-901f-ce4f22f89375','Restaurants','fully_vegan',false,array['south-florida'],'FL',null,null,null),
 ('fc008aba-ded6-4136-9dea-648771acece4','Restaurants','fully_vegan',true,null,null,null,array['Event Venues'],null),
 ('ba6251d4-0577-4e38-9c35-f7e762121887','Nutrition & Supplements','fully_vegan',false,null,null,array['greens'],null,'http://www.mossbegood.com/'),
 ('df75b918-7f9e-4778-b3ef-779d94c2906e','Food Brands','fully_vegan',false,null,null,array['meals'],null,'https://altrofoodusa.com'),
 ('4e0675fc-bd10-4681-b14f-c0d4d82e27cb','Food Brands','fully_vegan',false,null,null,array['drinks'],null,'https://linktr.ee/drinkoatrageous'),
 ('1aae3990-9f5e-4864-bde9-4c7c213bb305','Food Brands','vegan_friendly',false,null,null,array['pantry'],null,'https://shopwips.com'),
 ('8a5d41a2-bc21-4e71-805f-8112c86a2305','Restaurants','vegan_options',true,array['new-york'],null,null,null,null),
 ('dd9749fa-88af-4042-bcdb-3310173895d1','Catering','vegan_options',false,array['south-florida'],'FL',null,null,'http://elitefusioncatering.com'),
 ('8ad5583c-eb49-4964-81bc-5ddb3e7b9d85','Bakeries & Cafes','vegan_options',true,null,null,null,null,'https://naranjapina.com/'),
 ('7d84b042-6203-4965-b364-1ef3bb9be600','Food Trucks','vegan_options',false,array['south-florida'],'FL',null,null,null),
 ('bf4a26f7-a289-4e13-9067-813525434c7d','Food Trucks','vegan_options',false,array['south-florida'],'FL',null,null,null),
 ('c8509a42-f15e-4e2a-b134-0076385fdf6c','Vendors','vegan_options',false,array['south-florida'],'FL',null,null,null),
 ('8e0a52bb-b246-4285-97af-74ed4f3356fc','Vendors','vegan_options',false,array['south-florida'],'FL',null,null,'http://www.mankafood.com/'),
 ('b2563f3f-801a-42cc-9c24-2f8e8b421f31','Food Trucks','vegan_options',false,array['atlanta'],'GA',null,null,null),
 ('5d38702c-cfc9-4191-ac2a-0cb5244b0ae2','Sanctuaries',null,true,null,null,null,null,null),
 ('15797c75-231e-4fa9-8ea7-210f6c3fa606','Sanctuaries',null,true,null,null,null,null,null),
 ('37189729-e0c1-43a3-99d6-f59c15e954d1','Rescues',null,true,null,null,null,null,null),
 ('e0bc3815-7df9-47d3-9d3f-7dfa7e547893','Rescues',null,true,null,null,null,null,null),
 ('9f034c2f-2c6a-4a12-8cd8-2b736b0602f0','Sanctuaries',null,true,null,null,null,null,null),
 ('fd8c253f-fc94-4ddc-8a23-5843e5e50b82','Sanctuaries',null,true,null,null,null,null,null),
 ('ee66a015-ea6f-488d-aa1a-db9e15ee3fb8','Nonprofits',null,true,null,null,null,null,null),
 ('b501174d-8940-41b4-8d07-ad9f1c7c2b1c','Nonprofits',null,true,null,null,null,null,null),
 ('aab04379-e387-4b20-b255-e479631cd011','Rescues',null,true,null,null,null,null,null),
 ('2da2fcbf-b110-42b9-be06-7efd310f64e9','Rescues',null,true,null,null,null,null,null),
 ('3fd202ea-d917-4579-9955-89a13b652038','Rescues',null,true,null,null,null,null,null),
 ('517e32f2-08e7-4d4c-82ca-648476089b0e','Nonprofits',null,false,array['all'],null,null,null,null)
), b as (select d.*, c.place p, c.ig, c.verdict, c.reason, c.checked_at from d join ve_backlog_checks c on c.listing_id=d.id)
, upd as (
update listings l set
 status='approved', category=b.cat, vegan_status=b.vs, updated_at=now(),
 google_place_id = case when b.use_place then b.p->>'id' else l.google_place_id end,
 address_street = case when b.use_place then b.p->>'street' else l.address_street end,
 address_city = case when b.use_place then b.p->>'city' else l.address_city end,
 address_state = case when b.use_place then b.p->>'state' else coalesce(b.st, l.address_state) end,
 address_zip = case when b.use_place then b.p->>'zip' else l.address_zip end,
 address_country = case when b.use_place then b.p->>'country' else l.address_country end,
 latitude = case when b.use_place then (b.p->>'lat')::numeric else l.latitude end,
 longitude = case when b.use_place then (b.p->>'lng')::numeric else l.longitude end,
 business_status = case when b.use_place then coalesce(b.p->>'status','OPERATIONAL') else l.business_status end,
 google_rating = case when b.use_place then (b.p->>'rating')::numeric else l.google_rating end,
 google_reviews_count = case when b.use_place then coalesce((b.p->>'reviews')::int,0) else l.google_reviews_count end,
 google_category = case when b.use_place then nullif(b.p->>'type_name','') else l.google_category end,
 location = case when b.use_place then nullif(concat_ws(', ', b.p->>'city', b.p->>'state'),'') else l.location end,
 phone = case when b.use_place and b.p->>'phone' is not null then b.p->>'phone' else l.phone end,
 website = coalesce(nullif(l.website,''), b.site, case when b.use_place then nullif(b.p->>'website','') end, ''),
 ig_handle = coalesce(l.ig_handle, b.ig->>'handle'),
 communities = coalesce(b.comm, l.communities),
 product_kinds = coalesce(b.kinds, l.product_kinds),
 extra_categories = coalesce(b.extra, l.extra_categories),
 details = coalesce(l.details,'{}'::jsonb)
   || jsonb_build_object('backlog', jsonb_build_object('verdict',b.verdict,'reason',b.reason,'checked_at',b.checked_at,'decided','list','by','Logan (Sean approved)','at',now()))
   || jsonb_build_object('admin_notes', coalesce(l.details->'admin_notes','[]'::jsonb) || jsonb_build_array(jsonb_build_object('at',now(),'by','Logan','kind','note',
      'text','Listed from Ready to list (K), Sean approved 2026-11-08. Category and How Vegan are Logan''s recommendation from the saved checks.'
        || case when b.id='0d78c3d2-242d-4033-bf49-38e3042bc0a1' then ' Google had matched it to LA Vegan, a different business, so no address was taken.' else '' end)))
from b where l.id=b.id and l.status='quarantined' returning l.id)
update ve_backlog_checks set decision='listed', decided_at=now() where listing_id in (select id from upd);

with h(id) as (values ('353a346f-2d7b-427a-a1ce-92e918578d45'::uuid),('9d018c1b-8b82-47fd-aa64-08455f13e750'),('0ec5935a-7f8d-42fb-adb0-506a2e8c9942'),
 ('084cfd1a-de93-4116-8d1c-b14448e2137b'),('fc328a31-765d-44f6-ad45-23b1f38650e0'),('bac86183-05a8-4e3e-a863-ee89e84c336a'),('4babe724-e6ad-475c-bb02-8a7f37426938'),
 ('00fd8a1e-166e-47a6-9b0f-5630a7f3713b'),('ddc6e330-a1b2-40f2-8d73-ab701533d6ff'),('64c74a51-aabd-4cb1-be15-e1599e78fbc6'),('90d4dd3a-e80b-49d0-a4d5-93df39af0b7a'),
 ('e1784fad-5180-4826-bd37-49ca362096c9'),('d5f89414-3cc2-432d-870f-c1855f1f07c2'),('be8c1640-26e8-4e85-bd42-35f10e78adfd'),('c728f329-853e-4913-aadc-d072c2e0efa5'),
 ('0188357c-858b-4b65-b718-8230d032fcfd'))
, upd as (
update listings l set status='rejected', updated_at=now(),
 details = coalesce(l.details,'{}'::jsonb) || jsonb_build_object('status_before_hidden','quarantined',
   'backlog', jsonb_build_object('verdict',c.verdict,'reason',c.reason,'decided','hide','by','Logan (Sean approved)','at',now()),
   'admin_notes', coalesce(l.details->'admin_notes','[]'::jsonb) || jsonb_build_array(jsonb_build_object('at',now(),'by','Logan','kind','note',
     'text','Set aside from Ready to list (K), Sean approved 2026-11-08: a duplicate, a city shelter, a personal account, not a Vegan organization, no website or socials, or no known location.')))
from h join ve_backlog_checks c on c.listing_id=h.id where l.id=h.id and l.status='quarantined' returning l.id)
update ve_backlog_checks set decision='hidden', decided_at=now() where listing_id in (select id from upd);
