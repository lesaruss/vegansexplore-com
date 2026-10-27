-- Media on the Directory says what it is (Sean, 2026-10-27): a book shows its type and year, a documentary its year.
-- Documentaries already held listings.details.release_year. Books get details.book_type (cookbook | memoir | educational |
-- health | lifestyle | children; the list is BOOK_TYPES in /public/ve-region-directory.js, /public/ve-listing-admin.js and
-- supabase/functions/ve-listing-media) from each book's own description, and details.release_year where the description
-- prints it, "(Publisher, 2019)". Applied 2026-10-27 through the Supabase connector; idempotent.
with t(name, kind) as (values
 ('Afro Vegan by Bryant Terry','cookbook'),('Artisan Vegan Cheese by Miyoko Schinner','cookbook'),('Badass Vegan by John Lewis','lifestyle'),
 ('Breaking Up with Dairy by Bailey Ruskus','lifestyle'),('Cooking from the Spirit by Tabitha Brown','cookbook'),('Eat What Elephants Eat by Dominick Thompson','cookbook'),
 ('Incredible Vegan Ice Cream by Deena Jalal','cookbook'),('Isa Does It by Isa Chandra Moskowitz','cookbook'),('One-Hour Dairy-Free Cheese by Claudia Lucero','cookbook'),
 ('Plant Based on a Budget by Toni Okamoto','cookbook'),('Super Easy Vegan Cheese Cookbook by Janice Buckingham','cookbook'),('Sweet Potato Soul by Jenne Claiborne','cookbook'),
 ('The Cheese Trap by Neal D. Barnard, MD','health'),('The Fiber Fueled Cookbook by Dr. Will Bulsiewicz','cookbook'),('The How Not to Die Cookbook by Dr. Michael Greger','cookbook'),
 ('The Oat Milk Cookbook by Kim Lutz','cookbook'),('The Vegan Creamery by Miyoko Schinner','cookbook'),('The Vegan Dairy by Catherine Atkinson','cookbook'),
 ('The Vegan Dairy Cookbook by Marleen Visser','cookbook'),('The Vegan Scoop by Wheeler del Torro','cookbook'),('Vegan Dairy by Emelie Holm','cookbook'),('Vegana Italiana by Tara Punzone','cookbook'))
update listings l set details = coalesce(l.details,'{}'::jsonb)
   || jsonb_build_object('book_type', t.kind)
   || case when coalesce(l.details->>'release_year','') = '' and substring(l.description from ', ((?:19|20)[0-9]{2})\)') is not null
           then jsonb_build_object('release_year', substring(l.description from ', ((?:19|20)[0-9]{2})\)')) else '{}'::jsonb end,
   updated_at = now()
from t where l.name = t.name and l.category = 'Books' and l.status = 'approved';
