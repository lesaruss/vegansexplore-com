-- Studios go live after a preliminary check (Sean, 2026-10-29: "I'm not going to click through 129 studios... My main thing, is it
-- open? Is it active? If somebody reaches out to them, is somebody going to pick up the phone or answer an email?... If it fits that,
-- then we're good. Add them. We can always remove them later on").
-- The check, run 2026-10-29 from the database (net.http_get): Google Places for each studio's place (request ids 235465 to 235593:
-- businessStatus, phone, website, review times) and a fetch of each website (235597 to 235719, and 235720 to 235741 for the ones with
-- no Google review in two years). All 129 were OPERATIONAL on Google. A studio is added when it has a phone or website AND either a
-- Google review in the last two years or a website that loads. Six did not pass and are set aside (rejected, never deleted, with why):
-- two whose websites answer 404 and whose last review was 2022, and four with no website and no review in two years (one with no
-- phone either). They come back from Business outreach > New places' set-aside list, or by hand.
-- Listed the way backlog_decide lists (ve-discover): status approved, category Studios, How Vegan none (a studio is not a Vegan
-- business), Google's address, place, pin, phone and website, a team note, the backlog row decided.

with fail(pid, why) as (values
  ('ChIJ-WLPQYOx2YgRx5vOyUk1PM0', 'its website answers 404 and its last Google review is from 2022'),
  ('ChIJFQee6tE13YkRP8lB9lwZDas', 'its website answers 404 and its last Google review is from 2022'),
  ('ChIJbZXcHRsB2YgRwJkuriEhdKM', 'no website, and its last Google review is from 2021'),
  ('ChIJEYcIOlcB2YgRyzCugndEiy8', 'no website, and its last Google review is from May 2024'),
  ('ChIJFyzO_D3X2IgRq5hOJ8jk7eA', 'no website or phone, and its last Google review is from 2021'),
  ('ChIJhypexU2x2YgRYHdrZCUR4TU', 'no website, and its last Google review is from 2023')),
s as (select l.id, l.details, l.website, b.place p, f.why from listings l join ve_backlog_checks b on b.listing_id = l.id
  left join fail f on f.pid = b.place->>'id' where l.crawl_source = 'studio-search' and l.status = 'quarantined'),
up as (update listings l set
    status = case when s.why is null then 'approved' else 'rejected' end,
    category = case when s.why is null then 'Studios' else l.category end,
    vegan_status = null,
    google_place_id = coalesce(s.p->>'id', l.google_place_id),
    address_street = coalesce(s.p->>'street', l.address_street), address_city = coalesce(s.p->>'city', l.address_city),
    address_state = coalesce(s.p->>'state', l.address_state), address_zip = coalesce(s.p->>'zip', l.address_zip),
    address_country = coalesce(s.p->>'country', 'US'),
    latitude = coalesce((s.p->>'lat')::float, l.latitude), longitude = coalesce((s.p->>'lng')::float, l.longitude),
    business_status = 'OPERATIONAL', google_rating = (s.p->>'rating')::float, google_reviews_count = coalesce((s.p->>'reviews')::int, 0),
    google_category = s.p->>'type_name',
    website = coalesce(nullif(l.website, ''), s.p->>'website', ''), phone = coalesce(s.p->>'phone', l.phone),
    updated_at = now(),
    details = jsonb_set(coalesce(l.details, '{}'::jsonb), '{admin_notes}',
      coalesce(l.details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
        'text', case when s.why is null
          then 'Listed under Studios after the preliminary check (2026-10-29): open on Google, a phone or website, and a recent Google review or a website that loads.'
          else 'Set aside after the preliminary check (2026-10-29): ' || s.why || '. Put it back if it turns out to be open.' end)))
      || case when s.why is null then '{}'::jsonb else '{"status_before_hidden":"quarantined"}'::jsonb end
  from s where l.id = s.id returning l.id, l.status)
update ve_backlog_checks b set decision = case when up.status = 'approved' then 'listed' else 'hidden' end, decided_at = now()
from up where b.listing_id = up.id;
