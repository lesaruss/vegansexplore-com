-- The Penis Book and iWant stay in the Directory (Sean, 2026-10-29: "Keep both. We spoke to that author about the book on our
-- podcast"): a book its author talked about with us is listed even when it is not about Vegan living (ve-books talkedAbout). Their
-- book-list rows say why, so a rebuild keeps them. Safe to run twice.
update ve_books set vegan_related = true, note = 'Kept: we talked about it with its author on our podcast (Sean, 2026-10-29)', updated_at = now()
where title_key in (ve_book_key('The Penis Book'), ve_book_key('iWant')) and status = 'built';
