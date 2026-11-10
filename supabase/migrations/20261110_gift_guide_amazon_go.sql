-- ve-holiday-guide: the Gift Guide's Amazon links become our tracked links (Sean, 2026-11-10: "those Amazon links are affiliate links. That's
-- the whole point of using Amazon"). Each Amazon gift gets /go/gift-<n>; ve-links adds our Associates tag (ve_site_settings amazon_associates,
-- vegansexplore-20) on the way out and counts the click. The card's amazon_link points at the /go/ link. Safe to run twice.
with g as (
  select id, title, amazon_link, 'gift-' || lower(regexp_replace(title, '[^A-Za-z0-9]+', '-', 'g')) as code
  from ve_holiday_gifts where amazon_link ~* '^https?://(www\.)?amazon\.' and holiday_slug = 'christmas'
), ins as (
  insert into ve_links (code, destination, initiative_slug, tags, channel)
  select left(trim(both '-' from code), 60), amazon_link, 'holiday-gift-guide', array['holiday-gift-guide', 'amazon', 'gift-guide'], 'other' from g
  on conflict (code) do nothing returning code
)
update ve_holiday_gifts h set amazon_link = 'https://vegansexplore.com/go/' || left(trim(both '-' from g.code), 60), updated_at = now()
from g where h.id = g.id;
