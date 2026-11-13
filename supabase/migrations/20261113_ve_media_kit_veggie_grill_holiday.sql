-- Veggie Grill (UCLA) Featured in the Holiday Guide kit (Sean, 2026-11-13: "approved", the headlines and captions of the feature kits).
-- Graphics: scripts/brand-templates/featured-business.js --kind holiday, in /public/kit/veggie-grill/holiday-gift-card/. Its own tracked link
-- to the Gift Guide (initiative ve-media-kit). Safe to run twice.
insert into public.ve_links (code, label, destination, initiative_slug, tags, channel)
select 'vg-ucla-holiday', 'Veggie Grill UCLA: Featured in the Holiday Guide post', 'https://vegansexplore.com/guides/holiday-guide#/xm-gifts',
  've-media-kit', array['media-kit', 'holiday', 'veggie-grill'], 'social'
where not exists (select 1 from public.ve_links where code = 'vg-ucla-holiday');

insert into public.ve_media_kit_items (listing_id, key, kind, title, where_label, where_url, post_url, story_url, link_code, caption, status, featured_at, approved_by, approved_at)
select l.id, 'holiday:' || g.id, 'holiday', g.title, 'The Holiday Guide', '/guides/holiday-guide#/xm-gifts',
  '/public/kit/veggie-grill/holiday-gift-card/post.jpg', '/public/kit/veggie-grill/holiday-gift-card/story.jpg', 'vg-ucla-holiday',
  'We''re in the @vegansexplore Holiday Guide ' || U&'\+01F381' || ' Find us and every Vegan gift idea, link in bio.',
  'ready', g.created_at, 'Sean (2026-11-13, "approved")', now()
from public.ve_holiday_gifts g join public.listings l on l.id = g.listing_id
where l.slug = 'veggie-grill' and g.status = 'live'
on conflict (listing_id, key) do update set post_url = excluded.post_url, story_url = excluded.story_url, link_code = excluded.link_code,
  caption = excluded.caption, status = 'ready', approved_by = excluded.approved_by, approved_at = excluded.approved_at;
