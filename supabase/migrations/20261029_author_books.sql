-- Books on a person's page (Sean, 2026-10-29: "if they're an author, we want to put a book section after YouTube and before
-- partner dashboard... when you click on the book cover, in the same space, it opens up... a synopsis about the book, and then you
-- could purchase it on Amazon with our affiliate link"). A book joins its author's linked pages through details.family, and the
-- person's page shows every book in the family under its Books tab (directory/listing.html, loadFamily, drawBooks).
--
-- Each book: its cover copied into vegan-media/media/logos/books/<slug>.jpg (Amazon's cover for that ISBN, checked by eye
-- 2026-10-29), details.summary (the synopsis shown on the Books tab, written from what the book itself says it covers),
-- details.isbn, details.publisher, details.release_year (first published), and details.buy_link, our tracked /go/book-<...> link
-- to the book on Amazon. ve-links adds our Amazon Associates tag to every Amazon link it sends on (ve_site_settings
-- amazon_associates; empty until Sean gives the tracking ID).
-- Safe to run twice.

-- 1. The Associates setting. { tag: '<tracking id>' } for amazon.com, tags: { 'amazon.co.uk': '...' } for other Amazon stores.
insert into ve_site_settings (key, value)
values ('amazon_associates', '{"tag": "", "tags": {}}'::jsonb)
on conflict (key) do nothing;

-- 2. The new books.
with b(slug, name, creator, family, isbn, isbn10, publisher, yr, book_type, description, summary) as (values
  ('this-is-vegan-propaganda-by-ed-winters', 'This Is Vegan Propaganda by Ed Winters', 'Ed Winters', 'earthling-ed',
   '978-1785043765', '1785043765', 'Vermilion', 2022, 'educational',
   'Ed Winters, known as Earthling Ed, looks at what animal farming does to animals, people and the planet, and at the stories told to keep us eating it.',
   E'Ed Winters, the educator known as Earthling Ed, takes apart the stories that keep animal products on our plates: that farm animals live good lives, that meat is needed for health, that local and "humane" farming solves the problem.\n\nHe walks through what happens on farms and in slaughterhouses, the effect of animal agriculture on the climate, wildlife and public health, and the psychology that lets kind people look away. The book is written for anyone curious, not only for Vegans.'),
  ('how-to-argue-with-a-meat-eater-by-ed-winters', 'How to Argue With a Meat Eater by Ed Winters', 'Ed Winters', 'earthling-ed',
   '978-1785044489', '1785044486', 'Vermilion', 2023, 'educational',
   'Earthling Ed''s guide to the questions Vegans hear most, with calm, clear answers and a way of talking that keeps the conversation open.',
   E'Ed Winters has spent years talking with people on the street, on campuses and online about eating animals. Here he gathers the arguments he hears most, from protein and plants feeling pain to the circle of life, and answers each one.\n\nThe book is as much about how to talk as what to say: listening, asking questions and keeping a conversation kind, so that it changes minds rather than ending in a fight.'),
  ('how-to-go-and-stay-vegan-by-ed-winters', 'How to Go (and Stay) Vegan by Ed Winters', 'Ed Winters', 'earthling-ed',
   '978-1785045844', '1785045849', 'Vermilion', 2025, 'lifestyle',
   'A practical guide from Earthling Ed to making the change to Vegan living and keeping it for good.',
   E'Ed Winters turns from why to how. This guide is for anyone thinking about going Vegan, starting out, or finding it hard to keep going.\n\nIt covers the everyday parts of the change: food and shopping, eating out, family and friends, and the questions that come up along the way, so that going Vegan becomes a way of life rather than a short experiment.'),
  ('your-body-in-balance-by-neal-d-barnard-md', 'Your Body in Balance by Neal D. Barnard, MD', 'Neal D. Barnard, MD', 'neal-barnard',
   '978-1538747421', '1538747421', 'Grand Central Publishing', 2020, 'health',
   'Dr. Neal Barnard on how food affects our hormones, with a plant-based plan and recipes.',
   E'Dr. Neal Barnard, founder of the Physicians Committee for Responsible Medicine, explains how the foods we eat affect our hormones, and through them fertility, menstrual pain, menopause, thyroid health, weight and the risk of some cancers.\n\nHe sets out a plant-based way of eating to bring the body back into balance, with menus and recipes by Lindsay S. Nixon.'),
  ('the-power-foods-diet-by-neal-d-barnard-md', 'The Power Foods Diet by Neal D. Barnard, MD', 'Neal D. Barnard, MD', 'neal-barnard',
   '978-1538764954', '1538764954', 'Grand Central Publishing', 2024, 'health',
   'Dr. Neal Barnard''s plan for lasting weight loss built on foods that help the body trap, trim and burn calories.',
   E'Dr. Neal Barnard describes the foods that help the body manage weight: foods that tame the appetite, foods that hold on to fewer calories, and foods that raise the calories burned after a meal.\n\nThe book turns that research into an everyday plant-based plan for weight loss that lasts, with recipes by Dustin Harder and Lindsay S. Nixon.'),
  ('power-foods-for-the-brain-by-neal-d-barnard-md', 'Power Foods for the Brain by Neal D. Barnard, MD', 'Neal D. Barnard, MD', 'neal-barnard',
   '978-1455512201', '1455512206', 'Grand Central Publishing', 2013, 'health',
   'Dr. Neal Barnard''s three-step plan to protect your memory and lower the risk of Alzheimer''s.',
   E'Dr. Neal Barnard looks at what research says about memory loss and Alzheimer''s disease and what we can do about it.\n\nHis three-step plan covers the foods that protect the brain and the ones to avoid, along with physical exercise and mental exercise, with menus and recipes to put it into practice.'),
  ('the-vegan-starter-kit-by-neal-d-barnard-md', 'The Vegan Starter Kit by Neal D. Barnard, MD', 'Neal D. Barnard, MD', 'neal-barnard',
   '978-1538747407', '1538747405', 'Grand Central Publishing', 2018, 'lifestyle',
   'A short, friendly guide from Dr. Neal Barnard to everything you need to know about plant-based eating.',
   E'Dr. Neal Barnard''s short guide for anyone starting out on plant-based eating.\n\nIt explains why a Vegan diet is good for health, what to eat and how to get the nutrients that matter, and how to make the change easy, with simple meal ideas to begin with.'),
  ('21-day-weight-loss-kickstart-by-neal-d-barnard-md', '21-Day Weight Loss Kickstart by Neal D. Barnard, MD', 'Neal D. Barnard, MD', 'neal-barnard',
   '978-0446583817', '0446583812', 'Grand Central Publishing', 2011, 'health',
   'Dr. Neal Barnard''s three-week plant-based plan to lose weight, lower cholesterol and improve your health.',
   E'Dr. Neal Barnard''s three-week program to start losing weight and feeling better on a plant-based diet.\n\nDay by day it explains how to boost metabolism, lower cholesterol and improve overall health, with menus and recipes by Jason Wyrick.'),
  ('program-for-reversing-diabetes-by-neal-d-barnard-md', 'Dr. Neal Barnard''s Program for Reversing Diabetes', 'Neal D. Barnard, MD', 'neal-barnard',
   '978-1635651270', '1635651271', 'Rodale', 2007, 'health',
   'Dr. Neal Barnard''s research-based plant-based program for type 2 diabetes, without drugs.',
   E'Dr. Neal Barnard sets out the low-fat Vegan program his research team tested in people with type 2 diabetes, and explains why it works: it addresses how the body handles insulin rather than only counting carbohydrates.\n\nThe book guides readers through the change, with menus and recipes by Bryanna Clark Grogan. The revised edition is the one in print today.'),
  ('foods-that-fight-pain-by-neal-d-barnard-md', 'Foods That Fight Pain by Neal D. Barnard, MD', 'Neal D. Barnard, MD', 'neal-barnard',
   '978-0609600986', '0609600982', 'Harmony Books', 1998, 'health',
   'Dr. Neal Barnard on the foods that can trigger pain and the foods that help relieve it.',
   E'Dr. Neal Barnard explains how certain foods can trigger or worsen pain, and how others can help relieve it.\n\nHe looks at migraines, arthritis, back pain, menstrual pain and digestive pain, among others, and sets out how changing what we eat can bring relief, with recipes.'),
  ('breaking-the-food-seduction-by-neal-d-barnard-md', 'Breaking the Food Seduction by Neal D. Barnard, MD', 'Neal D. Barnard, MD', 'neal-barnard',
   '978-0312314934', '0312314930', 'St. Martin''s Press', 2003, 'health',
   'Dr. Neal Barnard on why we crave chocolate, cheese, sugar and meat, and seven steps to end the cravings naturally.',
   E'Why are chocolate, cheese, sugar and meat so hard to give up? Dr. Neal Barnard explains the hidden reasons behind food cravings, including how some foods act on the brain''s reward system.\n\nHe then lays out seven steps to break those cravings naturally, with menus and recipes.')
),
ins as (
  insert into listings (tenant_id, name, slug, category, specialty, status, description, logo_url, website, location, address_country,
    vegan_status, business_status, communities, initials, details)
  select '00000000-0000-4000-a000-000000000002', b.name, b.slug, 'Books', 'Books', 'approved', b.description,
    'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/books/' || b.slug || '.jpg',
    'https://www.amazon.com/dp/' || b.isbn10, 'United States', 'US', 'fully_vegan', 'OPERATIONAL', array['all'],
    upper(left(regexp_replace(b.name, '^(The|Dr\. Neal Barnard''s) ', ''), 1)) || upper(substr(split_part(regexp_replace(b.name, '^(The|Dr\. Neal Barnard''s) ', ''), ' ', 2), 1, 1)),
    jsonb_build_object('family', b.family, 'creator', b.creator, 'isbn', b.isbn, 'publisher', b.publisher, 'release_year', b.yr,
      'book_type', b.book_type, 'media_type', 'book', 'summary', b.summary, 'buy_link', '/go/book-' || b.isbn10,
      'cover_source', 'Amazon cover for ISBN ' || b.isbn || ', copied 2026-10-29', 'cover_checked', true, 'added_by', 'logan-2026-10-29')
  from b
  where not exists (select 1 from listings x where x.tenant_id = '00000000-0000-4000-a000-000000000002' and x.slug = b.slug)
  returning id
)
select count(*) from ins;

-- 3. The two books already listed: The Cheese Trap joins Dr. Barnard's pages, Badass Vegan gets its cover and synopsis. Badass
--    Vegan's ISBN was 978-0593420713 (The Cheese Trap is a Dairy Guide book under the other tenant id, so these match by slug alone), which Amazon does not know; the Avery edition is 978-0593420737.
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select l.id, 'details', l.details, l.details || v.patch, jsonb_build_object('by', 'logan', 'why', 'Books tab on the author''s page (Sean, 2026-10-29)')
from listings l
join (values
  ('the-cheese-trap-by-neal-d-barnard-md', jsonb_build_object('family', 'neal-barnard', 'creator', 'Neal D. Barnard, MD', 'isbn', '978-1455594672',
     'publisher', 'Grand Central Publishing', 'buy_link', '/go/book-1455594679',
     'summary', E'Dr. Neal Barnard explains why cheese is so hard to give up, from the casein that breaks down into opiate-like compounds to the salt and fat, and what it does to weight, hormones and health.\n\nHe sets out how to break the habit, with a plan and recipes for living without cheese.')),
  ('badass-vegan-by-john-lewis', jsonb_build_object('isbn', '978-0593420737', 'publisher', 'Avery', 'buy_link', '/go/book-059342073X',
     'summary', E'John Lewis, the Badass Vegan, tells how he went from a life of junk food to a plant-based one, and why it matters most in communities hit hardest by diet-related disease.\n\nPart story and part guide, the book mixes straight talk about health and food with recipes full of flavor, for anyone ready to change how they eat.',
     'cover_source', 'Amazon cover for ISBN 978-0593420737, copied 2026-10-29', 'cover_checked', true))
) as v(slug, patch) on v.slug = l.slug
where l.status = 'approved' and not (l.details ? 'buy_link');

update listings l set details = l.details || v.patch
from (values
  ('the-cheese-trap-by-neal-d-barnard-md', jsonb_build_object('family', 'neal-barnard', 'creator', 'Neal D. Barnard, MD', 'isbn', '978-1455594672',
     'publisher', 'Grand Central Publishing', 'buy_link', '/go/book-1455594679',
     'summary', E'Dr. Neal Barnard explains why cheese is so hard to give up, from the casein that breaks down into opiate-like compounds to the salt and fat, and what it does to weight, hormones and health.\n\nHe sets out how to break the habit, with a plan and recipes for living without cheese.')),
  ('badass-vegan-by-john-lewis', jsonb_build_object('isbn', '978-0593420737', 'publisher', 'Avery', 'buy_link', '/go/book-059342073X',
     'summary', E'John Lewis, the Badass Vegan, tells how he went from a life of junk food to a plant-based one, and why it matters most in communities hit hardest by diet-related disease.\n\nPart story and part guide, the book mixes straight talk about health and food with recipes full of flavor, for anyone ready to change how they eat.',
     'cover_source', 'Amazon cover for ISBN 978-0593420737, copied 2026-10-29', 'cover_checked', true))
) as v(slug, patch)
where l.slug = v.slug and l.status = 'approved' and not (l.details ? 'buy_link');

insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'logo', null, to_jsonb('https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/books/badass-vegan-by-john-lewis.jpg'::text),
  jsonb_build_object('by', 'logan', 'why', 'The book''s cover, Amazon ISBN 978-0593420737')
from listings where slug = 'badass-vegan-by-john-lewis' and status = 'approved' and logo_url is null;
update listings set logo_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/logos/books/badass-vegan-by-john-lewis.jpg'
where slug = 'badass-vegan-by-john-lewis' and status = 'approved' and logo_url is null;

-- 4. The tracked Amazon links, one per book (vegansexplore.com/go/book-<ISBN-10>, campaign books).
insert into ve_links (code, label, destination, initiative_slug, tags, channel)
select 'book-' || lower(i.isbn10), 'Buy on Amazon: ' || i.name, 'https://www.amazon.com/dp/' || i.isbn10, 'books', array['book', 'amazon', i.family], 'other'
from (values
  ('1785043765', 'This Is Vegan Propaganda', 'earthling-ed'), ('1785044486', 'How to Argue With a Meat Eater', 'earthling-ed'),
  ('1785045849', 'How to Go (and Stay) Vegan', 'earthling-ed'), ('1538747421', 'Your Body in Balance', 'neal-barnard'),
  ('1538764954', 'The Power Foods Diet', 'neal-barnard'), ('1455512206', 'Power Foods for the Brain', 'neal-barnard'),
  ('1538747405', 'The Vegan Starter Kit', 'neal-barnard'), ('0446583812', '21-Day Weight Loss Kickstart', 'neal-barnard'),
  ('1635651271', 'Program for Reversing Diabetes', 'neal-barnard'), ('0609600982', 'Foods That Fight Pain', 'neal-barnard'),
  ('0312314930', 'Breaking the Food Seduction', 'neal-barnard'), ('1455594679', 'The Cheese Trap', 'neal-barnard'),
  ('059342073X', 'Badass Vegan', 'john-lewis')
) as i(isbn10, name, family)
on conflict (code) do nothing;
