-- Only books about Vegan living are listings (Sean, 2026-10-29: "Only the books relevant to Veganism. You can leave the What the
-- Health book off"). Until now a book by one of our People was listed whatever it was about. ve-books buildOne now lists only a
-- book its check calls Vegan related (or one the team makes a listing in Depot > Books). Taken off the Directory (Removed: status
-- rejected with details.removed_*, never deleted) and set aside on the book list: Jane Velez-Mitchell's Secrets Can Be Murder,
-- Exposed and Addict Nation, Louie Psihoyos's Hunting Dinosaurs, Sandra Nomoto's PR guide, and the What the Health book under
-- Keegan Kuhn. The Penis Book stays (Sean kept it the same day; it carries plant-based eating advice). Safe to run twice.
with gone as (
  select b.id book_id, l.id listing_id from ve_books b join listings l on l.id = b.listing_id and l.status = 'approved'
  where l.slug in ('secrets-can-be-murder-by-jane-velez-mitchell', 'exposed-by-jane-velez-mitchell', 'addict-nation-by-jane-velez-mitchell',
    'hunting-dinosaurs-by-louie-psihoyos', 'the-only-public-relations-guide-you-ll-ever-need-by-sandra-nomoto')
     or (b.title_key = ve_book_key('What the Health') and b.author ilike '%Kuhn%')
), l as (
  update listings x set status = 'rejected', updated_at = now(), details = x.details || jsonb_build_object(
    'removed_at', now(), 'removed_by', 'logan', 'removed_reason', 'Not about Vegan living (Sean, 2026-10-29: only books relevant to Veganism)',
    'status_before_removed', 'approved')
  from gone where x.id = gone.listing_id returning x.id
)
update ve_books b set status = 'set_aside', note = 'Not about Vegan living; off the Directory (Sean, 2026-10-29)', updated_at = now()
from gone where b.id = gone.book_id;
