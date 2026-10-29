-- Covers and Amazon links for the books listed before 2026-10-29 (found when Referenced books first showed the cookbook episode).
-- Five had no cover or showed the author's website logo; each cover is Amazon's image for the ISBN the listing holds, copied into
-- vegan-media/media/logos/books/ and checked by eye. Sweet Potato Soul showed its author's sweet potato logo, not the book, and Amazon
-- has no image for its ISBN, so that picture is set aside (details.logo_unverified) and the letter shows. Every book with an ISBN-10
-- gets its tracked Amazon link (details.buy_link, /go/book-<ISBN-10>), as the books added the same day have. Safe to run twice.

with c(slug, isbn10, isbn13) as (values
  ('afro-vegan-by-bryant-terry', '1607745313', '9781607745310'),
  ('isa-does-it-by-isa-chandra-moskowitz', '0316221902', '9780316221900'),
  ('plant-based-on-a-budget-by-toni-okamoto', '1946885983', '9781946885982'),
  ('the-fiber-fueled-cookbook-by-dr-will-bulsiewicz', '0593418778', '9780593418772'),
  ('the-how-not-to-die-cookbook-by-dr-michael-greger', '1250127769', '9781250127761')
), e as (
  insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
  select l.id, 'logo', to_jsonb(l.logo_url), to_jsonb('https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/books/' || c.slug || '.jpg'),
    jsonb_build_object('by', 'logan', 'why', 'The book''s cover, Amazon ISBN ' || c.isbn13)
  from listings l join c on c.slug = l.slug
  where l.status = 'approved' and l.category = 'Books' and coalesce(l.details ->> 'cover_source', '') not like 'Amazon%'
  returning listing_id
)
update listings l set logo_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/books/' || c.slug || '.jpg',
  details = l.details || jsonb_build_object('cover_source', 'Amazon cover for ISBN ' || c.isbn13 || ', copied 2026-10-29', 'cover_checked', true)
    || case when l.logo_url is not null and l.logo_url not like '%/logos/books/%' then jsonb_build_object('logo_replaced', l.logo_url) else '{}'::jsonb end
from c where l.slug = c.slug and l.id in (select listing_id from e);

-- Sweet Potato Soul: the author's logo is not the book.
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'logo', to_jsonb(logo_url), 'null'::jsonb, jsonb_build_object('by', 'logan', 'why', 'The author''s website logo, not the book''s cover; set aside for the letter')
from listings where slug = 'sweet-potato-soul-by-jenne-claiborne' and status = 'approved' and logo_url is not null;
update listings set details = details || jsonb_build_object('logo_unverified', logo_url, 'logo_unverified_at', '2026-10-29'), logo_url = null
where slug = 'sweet-potato-soul-by-jenne-claiborne' and status = 'approved' and logo_url is not null;

-- Amazon links for every book with an ISBN-10 (from details.isbn, or the ISBN its cover note names).
with b as (
  select l.id, l.name, l.slug, coalesce(nullif(replace(l.details ->> 'isbn', '-', ''), ''), substring(l.details ->> 'cover_source' from 'ISBN (97[89][0-9]{10})')) i13
  from listings l where l.category = 'Books' and l.status = 'approved' and not (l.details ? 'buy_link')
), t as (
  select b.*, substr(i13, 4, 9) || (case ((11 - (
      10 * substr(i13, 4, 1)::int + 9 * substr(i13, 5, 1)::int + 8 * substr(i13, 6, 1)::int + 7 * substr(i13, 7, 1)::int + 6 * substr(i13, 8, 1)::int +
      5 * substr(i13, 9, 1)::int + 4 * substr(i13, 10, 1)::int + 3 * substr(i13, 11, 1)::int + 2 * substr(i13, 12, 1)::int) % 11) % 11)
    when 10 then 'X' else ((11 - (
      10 * substr(i13, 4, 1)::int + 9 * substr(i13, 5, 1)::int + 8 * substr(i13, 6, 1)::int + 7 * substr(i13, 7, 1)::int + 6 * substr(i13, 8, 1)::int +
      5 * substr(i13, 9, 1)::int + 4 * substr(i13, 10, 1)::int + 3 * substr(i13, 11, 1)::int + 2 * substr(i13, 12, 1)::int) % 11) % 11)::text end) as i10
  from b where i13 ~ '^978[0-9]{10}$'
), links as (
  insert into ve_links (code, label, destination, initiative_slug, tags, channel)
  select 'book-' || lower(i10), left('Buy on Amazon: ' || regexp_replace(name, '\s+by\s+.*$', ''), 120), 'https://www.amazon.com/dp/' || i10, 'books', array['book', 'amazon'], 'other'
  from t on conflict (code) do nothing returning code
)
update listings l set details = l.details || jsonb_build_object('buy_link', '/go/book-' || t.i10)
from t where l.id = t.id;

-- The book list follows.
update ve_books v set cover_url = l.logo_url, buy_link = l.details ->> 'buy_link', updated_at = now()
from listings l where v.listing_id = l.id and (v.cover_url is distinct from l.logo_url or v.buy_link is distinct from (l.details ->> 'buy_link'));
