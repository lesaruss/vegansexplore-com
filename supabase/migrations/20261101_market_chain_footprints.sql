-- Grocery chains under Markets show only in the chapters where they have stores (Sean, 2026-11-01: "we have Atlanta and there's
-- like 20 different markets listed. Are these all in Atlanta?... make sure that the markets are only showing in chapters where they
-- are actually located"). The 20 chains (tag ve-grocery-store) had no address and no chapters, so the Directory read them as online
-- and showed every one in every chapter. Each footprint below comes from Google Places on 2026-11-01 (486 searches, two or three
-- cities a chapter, the one-time ve-once-market-audit): a chapter counts when the chain itself has a store in that chapter's metro,
-- not a namesake (Stop & Shop corner stores, "Jewel" jewelers, Safeway movers) or an office or warehouse (Kroger's Florida delivery
-- center). A chain with no store in any chapter gets ['none']: it stays on the Directory's All locations and its Vegan aisle, and no
-- chapter shows it. Amazon and Instacart sell online, so they leave Markets for Products > E-Commerce & Marketplaces, every chapter.
-- ve-region-directory.js (everywhere()) keeps a no-address listing that names its chapters in those chapters only.
create temp table _fp(slug text, c text[]) on commit drop;
insert into _fp(slug, c) values
  ('publix-super-markets',  array['south-florida','central-florida','north-florida','atlanta','virginia']),
  ('target',                array['south-florida','central-florida','north-florida','atlanta','washington-dc','delaware','maryland','virginia','west-virginia','new-york','philadelphia','los-angeles']),
  ('whole-foods-market',    array['south-florida','central-florida','north-florida','atlanta','washington-dc','maryland','virginia','new-york','philadelphia','los-angeles','london']),
  ('costco',                array['south-florida','central-florida','north-florida','atlanta','washington-dc','delaware','maryland','virginia','new-york','philadelphia','los-angeles','london']),
  ('walmart',               array['south-florida','central-florida','north-florida','atlanta','washington-dc','delaware','maryland','virginia','west-virginia','new-york','philadelphia','los-angeles']),
  ('sprouts-farmers-market',array['south-florida','central-florida','north-florida','atlanta','delaware','maryland','virginia','new-york','philadelphia','los-angeles']),
  ('wegmans',               array['washington-dc','delaware','maryland','virginia','new-york','philadelphia']),
  ('shoprite',              array['delaware','maryland','new-york','philadelphia']),
  ('food-lion',             array['delaware','maryland','virginia','west-virginia']),
  ('giant-food',            array['washington-dc','delaware','maryland','virginia']),
  ('safeway',               array['washington-dc','delaware','maryland','virginia']),
  ('kroger',                array['atlanta','virginia','west-virginia']),
  ('albertsons',            array['central-florida','north-florida','los-angeles']),
  ('stop-and-shop',         array['new-york']),
  ('jewel-osco',            array['none']),
  ('hannaford',             array['none']),
  ('qfc',                   array['none']),
  ('heb',                   array['none']);

-- Each change is a ve_listing_edits row with what it replaced, so Depot can undo it.
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select l.id, 'communities', to_jsonb(coalesce(l.communities, '{}')), to_jsonb(f.c), jsonb_build_object('by', 'logan', 'why', 'market chain footprint audit 2026-11-01')
from listings l join _fp f on f.slug = l.slug
where l.status = 'approved' and 've-grocery-store' = any(l.tags) and coalesce(l.communities, '{}') is distinct from f.c;

update listings l set communities = f.c, updated_at = now()
from _fp f where l.slug = f.slug and l.status = 'approved' and 've-grocery-store' = any(l.tags);

insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'category', to_jsonb(category), to_jsonb('E-Commerce & Marketplaces'::text), jsonb_build_object('by', 'logan', 'why', 'online, not a market; market audit 2026-11-01')
from listings where slug in ('amazon-com','instacart') and status = 'approved' and category is distinct from 'E-Commerce & Marketplaces';

update listings set category = 'E-Commerce & Marketplaces', communities = array['all'], updated_at = now()
where slug in ('amazon-com','instacart') and status = 'approved';
