-- ve-holiday-guide: Instagram handles the logo hunt read from four Gift Guide brands' own sites (2026-11-10), for the Featured in the
-- Holiday Guide story frames and DMs. Only where the listing had none. Safe to run twice.
update listings l set instagram = h.ig, ig_handle = h.ig, updated_at = now()
from (values ('nhiar-chocolates', 'nhiarchocolates'), ('renegade-foods', 'eatrenegade'), ('korean-vegan-beauty', 'koreanveganbeauty'), ('pawj-california', 'pawjcalifornia')) h(slug, ig)
where l.slug = h.slug and coalesce(l.instagram, '') = '';
