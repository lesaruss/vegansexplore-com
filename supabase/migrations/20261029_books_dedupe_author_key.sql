-- The China Study was built twice (2026-10-29): one mention named "T. Colin Campbell", another "T. Colin Campbell and Thomas M.
-- Campbell II", and the author key took the last word of the whole line ("ii"), so the two never matched. The author key is now the
-- first author's last name, without a generation or degree (II, III, IV, Jr, Sr, MD, PhD, RD, DO), and ve-books checks the ISBN
-- before making a listing. The second China Study listing is merged into the first (never deleted). Safe to run twice.
create or replace function public.ve_book_author_key(p text) returns text language sql immutable as $$
  select coalesce(nullif(regexp_replace(lower(btrim(regexp_replace(
    split_part(split_part(regexp_replace(coalesce(p, ''), '\s+(and|&)\s+', ',', 'gi'), ',', 1), ';', 1),
    '\s+\m(MD|PhD|RD|DO|Jr|Sr|II|III|IV)\M\.?', '', 'gi'))), '^.*\s', ''), ''), '')
$$;

-- Merge the duplicate listing into the one that stays.
with keep as (select id from listings where slug = 'the-china-study-by-t-colin-campbell' and status = 'approved'),
dup as (select id, status from listings where slug = 'the-china-study-by-t-colin-campbell-and-thomas-m-campbell-ii' and status = 'approved')
update listings l set status = 'rejected', updated_at = now(),
  details = l.details || jsonb_build_object('merged_into', (select id from keep), 'merged_at', now(), 'status_before_merge', 'approved')
from dup where l.id = dup.id and exists (select 1 from keep);

update ve_books b set listing_id = k.id, note = 'Same book as the other China Study row (merged 2026-10-29)', updated_at = now()
from listings k where k.slug = 'the-china-study-by-t-colin-campbell' and k.status = 'approved'
  and b.listing_id = (select id from listings where slug = 'the-china-study-by-t-colin-campbell-and-thomas-m-campbell-ii');

-- Recompute the keys where the new rule changes them and no other row already holds the new key.
update ve_books b set author_key = ve_book_author_key(b.author)
where b.author is not null and b.author_key is distinct from ve_book_author_key(b.author)
  and not exists (select 1 from ve_books o where o.id <> b.id and o.title_key = b.title_key and o.author_key = ve_book_author_key(b.author));
