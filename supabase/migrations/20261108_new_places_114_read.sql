-- ve-community-directory: the 114 New places rows (A person / Not a restaurant) whose name or bio mention animals or Vegan, read one by one
-- (Logan, 2026-11-08). Listed 8: Vegan brands and organizations active in 2025-2026 with their own site, or a Vegan food business in a chapter.
-- Set aside the rest: creators, coaches and athletes we have not worked with (the People rule: only people we have interacted with), accounts
-- quiet since 2024 or earlier, places outside our chapters, duplicates of people or listings already on the Directory, and Ike's Sandwiches
-- (serves meat). Also Sean's defaults (2026-11-08): Miami Beach Vegan set aside; Angela Yvonne / Vegan Pop Eats set aside (not on our shows).
-- Rose of Sharon (a 501(c)(3) feeding people plant-based meals) also serves South Florida, so south-florida joins its chapters.
-- Reversible: set-aside rows are status rejected with details.status_before_hidden = quarantined.
with d(id, nm, cat, vs, site, comm, st, city, kinds, about) as (values
 ('23708787-3470-4f69-951b-b30e34939c80'::uuid,'Compassion Co','Clothing and Fashion','fully_vegan','http://www.compassionco.com',array['all'],null::text,null::text,array['streetwear'],
  'Vegan shirts with an animal liberation message since 2011: organic, made in the USA and sweatshop free.'),
 ('a110c181-2062-4b8b-8f8b-342e46c2da8d','Green Vegan Bags','Clothing and Fashion','fully_vegan','http://www.greenveganbags.com/',array['all'],null,null,array['bags'],
  'Vegan leather handbags: cruelty-free, sustainable and made to stand out.'),
 ('09486347-30a4-4a4a-84e8-46f1a6119e52','GUNAS New York','Clothing and Fashion','fully_vegan','',array['all'],null,null,array['bags'],
  'Luxury handbags from New York, intentionally Vegan and cruelty-free, founded by designer Sugandh.'),
 ('bcefcb8c-afc3-4b4e-8169-853df485383a','Vegan Club','Clothing and Fashion','fully_vegan','https://veganclub.co',array['all'],null,null,array['streetwear'],
  'Street art and apparel by artist Le Fou, with part of every sale donated to help animals.'),
 ('332e634d-bf12-4837-8363-ec8a4fe68a44','Black Rican Vegan','Catering','fully_vegan','https://linktr.ee/blackricanvegan',array['new-york'],'NY','New York',null::text[],
  'Afro-Boricua Vegan cooking from the New York chef behind the Black Rican Vegan cookbook: catering, pop-ups and events.'),
 ('a7d54e05-58f1-445c-8be4-312e591aaae1','The Vegan Sweet Spot','Bakeries & Cafes','fully_vegan','https://linktr.ee/thevegansweetspot',array['south-florida'],'FL',null,null,
  'Vegan custom cakes and treats by Ms. B, made to order for pickup in South Florida, limited orders each week.'),
 ('782f5294-6b16-4bec-83d5-26ef73eb6fc1','International Vegan Film Fest','Events',null,'https://www.instagram.com/the_ivff/',array['all'],null,null,null,
  'A film festival for creatives advocating for change, with screenings year round and online.'),
 ('2412d68a-c693-4b5f-b9fa-f76073b348f4','Vegan Women Summit','Events',null,'https://www.veganwomensummit.com/',array['all'],null,null,null,
  'A community and summit for women in the Vegan movement.')
)
, ig as (select d.*, c.ig, c.verdict, c.reason, c.checked_at from d join ve_backlog_checks c on c.listing_id=d.id)
, upd as (
update listings l set status='approved', name=ig.nm, slug=trim(both '-' from regexp_replace(lower(ig.nm),'[^a-z0-9]+','-','g')), category=ig.cat, vegan_status=ig.vs, updated_at=now(),
 website = coalesce(nullif(ig.site,''), ''), description = ig.about, instagram='@'||lower(ig.ig->>'handle'), ig_handle=lower(ig.ig->>'handle'),
 communities = ig.comm, address_state = coalesce(ig.st, l.address_state), address_city = coalesce(ig.city, l.address_city),
 location = case when ig.city is not null then ig.city||', '||ig.st when ig.st is not null then ig.st else coalesce(nullif(l.location,''),'Online') end,
 product_kinds = coalesce(ig.kinds, l.product_kinds), initials = upper(left(regexp_replace(ig.nm,'[^A-Za-z ]','','g'),1)) || coalesce(upper(left(split_part(regexp_replace(ig.nm,'[^A-Za-z ]','','g'),' ',2),1)),''),
 tenant_id='00000000-0000-4000-a000-000000000002',
 details = coalesce(l.details,'{}'::jsonb)
   || jsonb_build_object('backlog', jsonb_build_object('verdict',ig.verdict,'reason',ig.reason,'checked_at',ig.checked_at,'decided','list','by','Logan','at',now()))
   || jsonb_build_object('admin_notes', coalesce(l.details->'admin_notes','[]'::jsonb) || jsonb_build_array(jsonb_build_object('at',now(),'by','Logan','kind','note',
      'text','Listed from the 114 read (2026-11-08): a Vegan brand or organization active on Instagram in 2025-2026. Category, How Vegan and the line about it are Logan''s, from their own bio.')))
from ig where l.id=ig.id and l.status='quarantined' returning l.id)
update ve_backlog_checks set decision='listed', decided_at=now() where listing_id in (select id from upd);

-- Everyone else in the 114, plus Miami Beach Vegan.
with t as (
 select b.listing_id id, b.verdict, b.reason from ve_backlog_checks b join listings l on l.id=b.listing_id
 where b.decision is null and l.status='quarantined'
   and (b.verdict in ('person','other') or l.id='fa981a91-b32e-458d-9b7e-f1a61990c195')
), upd as (
 update listings l set status='rejected', updated_at=now(),
  details = coalesce(l.details,'{}'::jsonb) || jsonb_build_object('status_before_hidden','quarantined',
   'backlog', coalesce(l.details->'backlog','{}'::jsonb) || jsonb_build_object('verdict',t.verdict,'reason',t.reason,'decided','hide','by','Logan','at',now()),
   'admin_notes', coalesce(l.details->'admin_notes','[]'::jsonb) || jsonb_build_array(jsonb_build_object('at',now(),'by','Logan','kind','note',
     'text', case when l.id='fa981a91-b32e-458d-9b7e-f1a61990c195' then 'Set aside (Sean''s default, 2026-11-08): Google matched a different business and nothing confirms it on its own.'
       else 'Set aside in the 114 read (2026-11-08): a creator, coach or athlete we have not worked with, quiet since 2024 or earlier, outside our chapters, already on the Directory, or not Vegan.' end)))
 from t where l.id=t.id returning l.id)
update ve_backlog_checks c set decision='hidden', decided_at=now() from upd where c.listing_id=upd.id;

update listings set communities = array['los-angeles','south-florida'], updated_at=now()
where slug='rose-of-sharon-soflo-d775' and status='approved' and not communities @> array['south-florida'];
