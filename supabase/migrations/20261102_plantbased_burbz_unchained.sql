-- Plant Based in the Burbz: their YouTube channel comes off, UnchainedTV goes on (Sean, 2026-11-02: "remove their YouTube video. You can
-- link it, but it's not worth putting up... doesn't present them in a good light... use their Jane Unchained channel and just link to
-- that"). The YouTube listing is Removed (kept, never deleted; Directory review's Removed list puts it back). The show's page and Paige's
-- link their UnchainedTV page (https://watch.unchainedtv.com/plant-based-in-the-burbs) as their website and first in Their work; the
-- YouTube channel stays only as a plain link in Follow. The show and Paige keep their family tabs. Idempotent.
select public.ve_listing_set_state(l.id, 'removed',
  (select id from members where is_superadmin and email ilike 'srussell@lesaruss.com' limit 1),
  'Sean, 2026-11-02: not worth putting up; their UnchainedTV page is linked instead.', array['Sean asked'])
from listings l where l.slug = 'plantbased-in-the-burbz-youtube' and l.status = 'approved';

update listings set website = 'https://watch.unchainedtv.com/plant-based-in-the-burbs',
  details = jsonb_set(details, '{person,links}', jsonb_build_array(
    jsonb_build_object('label', 'Watch on UnchainedTV', 'url', 'https://watch.unchainedtv.com/plant-based-in-the-burbs'))),
  updated_at = now()
where slug = 'plantbased-in-the-burbs';

update listings set website = 'https://watch.unchainedtv.com/plant-based-in-the-burbs',
  details = jsonb_set(details, '{person,links}', jsonb_build_array(
    jsonb_build_object('label', 'Plant Based in the Burbz on UnchainedTV', 'url', 'https://watch.unchainedtv.com/plant-based-in-the-burbs'))),
  updated_at = now()
where slug = 'paige-parsons-roache';
