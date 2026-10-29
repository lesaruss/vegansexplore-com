-- Two book fixes (Sean, 2026-10-29).
-- 1. The Penis Book: the crawl took its author as "Aaron Splitz" from Google Books' record (a typo there; the publisher's own
--    description says Spitz). Name, slug, creator, cover path and the book list now say Aaron Spitz. The listing was made the same day.
-- 2. Pre-Vegans, Sean's book (Lesaruss Media, May 13, 2022, paperback, ISBN 979-8986263007, Amazon B0B1CD57RW). The builder
--    could not find it: it has a 979 ISBN, so no ISBN-10 and no Amazon cover by ISBN. Added by hand from its Amazon page: its
--    cover copied into vegan-media/media/logos/books/, the description from the page, the eight People whose stories are in it
--    as its Featured people, the family `pre-vegans` with the Pre-Vegans Podcast, and its tracked Amazon link. Featured in Media >
--    Books (SHOWS in public/ve-media.js). Safe to run twice.

-- 1. Aaron Spitz
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'name', to_jsonb(name), to_jsonb('The Penis Book by Aaron Spitz'::text), jsonb_build_object('by', 'logan', 'why', 'Author is Aaron Spitz, not Splitz (Sean)')
from listings where slug = 'the-penis-book-by-aaron-splitz';
update listings set name = 'The Penis Book by Aaron Spitz', slug = 'the-penis-book-by-aaron-spitz',
  logo_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/books/the-penis-book-by-aaron-spitz.jpg',
  details = details || '{"creator": "Aaron Spitz"}'::jsonb, updated_at = now()
where slug = 'the-penis-book-by-aaron-splitz';
update ve_books set author = 'Aaron Spitz', author_key = 'spitz',
  cover_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/books/the-penis-book-by-aaron-spitz.jpg',
  note = 'Google Books lists the author as Splitz; the book and its publisher say Spitz (corrected 2026-10-29).', updated_at = now()
where title_key = 'penis book' and author_key = 'splitz';

-- 2. Pre-Vegans
insert into ve_links (code, label, destination, initiative_slug, tags, channel)
values ('book-b0b1cd57rw', 'Buy on Amazon: Pre-Vegans', 'https://www.amazon.com/dp/B0B1CD57RW', 'books', array['book', 'amazon'], 'other')
on conflict (code) do nothing;

insert into listings (name, slug, category, specialty, location, address_country, communities, vegan_status, business_status, status,
  tenant_id, color, initials, website, logo_url, description, details)
select 'Pre-Vegans by Sean Russell', 'pre-vegans-by-sean-russell', 'Books', 'Books', 'United States', 'US', array['all'], 'fully_vegan',
  'OPERATIONAL', 'approved', '00000000-0000-4000-a000-000000000002', '#1A1A1A', 'PV', 'https://www.amazon.com/dp/B0B1CD57RW',
  'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/books/pre-vegans-by-sean-russell.jpg',
  'Inspirational stories from Vegan veterans that answer why to go Vegan, how to go Vegan and what''s in it for you, with a Getting Started guide.',
  jsonb_build_object(
    'isbn', '9798986263007', 'asin', 'B0B1CD57RW', 'family', 'pre-vegans', 'creator', 'Sean Russell', 'media_type', 'book',
    'book_type', 'lifestyle', 'publisher', 'Lesaruss Media', 'release_year', 2022, 'pages', 76, 'buy_link', '/go/book-b0b1cd57rw',
    'added_by', 'logan', 'book_source', 'sean', 'book_facts_from', 'amazon',
    'cover_source', 'Amazon cover for ASIN B0B1CD57RW, copied 2026-10-29', 'cover_checked', true,
    'summary', E'Pre-Vegans answers the questions people curious about veganism want to know: why go Vegan, how to go Vegan, and what''s in it for me if I do? It recounts the journeys of well-known Vegan veterans through conversations and stories, for Vegans and Pre-Vegans alike.\n\nIt carries the stories of Ingrid Newkirk, Earthling Ed, Dr. Michael Klaper, Jane Velez-Mitchell, Dr. Neal Barnard, John Lewis (Badass Vegan), Dr. Angie Sadeghi and Robert Cheeke, along with a Getting Started guide to help you figure out the next steps on your own journey.',
    'film_people', jsonb_build_array(
      jsonb_build_object('person', 'ingrid-newkirk', 'role', 'In the book'), jsonb_build_object('person', 'earthling-ed', 'role', 'In the book'),
      jsonb_build_object('person', 'michael-klaper', 'role', 'In the book'), jsonb_build_object('person', 'jane-velez-mitchell', 'role', 'In the book'),
      jsonb_build_object('person', 'neal-barnard', 'role', 'In the book'), jsonb_build_object('person', 'john-lewis', 'role', 'In the book'),
      jsonb_build_object('person', 'angie-sadeghi', 'role', 'In the book'), jsonb_build_object('person', 'robert-cheeke', 'role', 'In the book')))
where not exists (select 1 from listings where slug = 'pre-vegans-by-sean-russell');

update listings set details = details || '{"family": "pre-vegans"}'::jsonb where slug = 'pre-vegans-podcast' and status = 'approved'
  and coalesce(details ->> 'family', '') <> 'pre-vegans';

update ve_books v set status = 'built', listing_id = l.id, author = 'Sean Russell', isbn13 = '9798986263007', publisher = 'Lesaruss Media',
  year = 2022, cover_url = l.logo_url, buy_link = '/go/book-b0b1cd57rw', vegan_related = true, book_type = 'lifestyle',
  description = l.description, summary = l.details ->> 'summary', note = 'Added by hand from its Amazon page (979 ISBN, no ISBN-10).', updated_at = now()
from listings l where l.slug = 'pre-vegans-by-sean-russell' and v.title_key = 'pre vegans' and v.author_key = 'russell';
