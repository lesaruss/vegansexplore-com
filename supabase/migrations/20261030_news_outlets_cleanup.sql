-- News outlets, after Sean's look at them (2026-10-30): "I'm not seeing those news stations... I don't see the feed for Unchained...
-- remove Veg Out... Plant-based news should have a news feed... that should be the default... When you're on YouTube, you should see
-- their YouTube channel... Veg World... from February 23rd, we might need to remove them as well."

-- 1. The seven local outlets were hidden from Vegans Explore by the LESARUSS.ai candidate tag. They stay in the LESARUSS.ai Directory
--    (tag lesaruss-ai-directory) and now show here too. They are not Vegan outlets, so no How Vegan.
update public.listings set tags = array_remove(tags, 'lesaruss-ai-directory-candidate'), vegan_status = null
where status = 'approved' and category = 'News Outlets'
  and slug in ('diario-las-amricas','las-olas-insider','miamis-community-newspapers','westside-gazette','wlrn-public-media',
               'wpec-cbs-12','wptv-tv-west-palm-beach');

-- 2. UnchainedTV publishes its news at unchainedtv.com/latest-news/feed/ (the listing's website, unchained.tv, names no feed).
update public.listings set rss_url = 'https://unchainedtv.com/latest-news/feed/'
where slug = 'unchained_tv' and status = 'approved' and coalesce(rss_url, '') = '';
delete from public.ve_outlet_feeds f using public.listings l where l.id = f.listing_id and l.slug = 'unchained_tv' and f.feed_url = '';

-- 3. Plant Based News: the News Outlet shows its stories; its channel is its own YouTube listing in the same family (tabs link them).
insert into public.listings
select r.* from public.listings l, jsonb_populate_record(null::public.listings, to_jsonb(l) || jsonb_build_object(
  'id', gen_random_uuid(), 'slug', 'plant-based-news-youtube', 'name', 'Plant Based News (YouTube)', 'category', 'YouTube',
  'extra_categories', '[]'::jsonb, 'vote_count', 0, 'voter_count', 0, 'favorites_count', 0, 'likes_count', 0,
  'owner_member_id', null, 'claimed_by_member_id', null, 'google_place_id', null, 'rss_url', null, 've_business_id', null,
  'created_at', now(), 'updated_at', now(),
  'details', (l.details - 'release_year') || jsonb_build_object('media_type', 'youtube', 'split_from', 'plant-based-news'))) r
where l.slug = 'plant-based-news' and l.status = 'approved'
  and not exists (select 1 from public.listings where slug = 'plant-based-news-youtube');
update public.ve_youtube_feeds f set listing_id = y.id
from public.listings o, public.listings y
where o.slug = 'plant-based-news' and o.status = 'approved' and y.slug = 'plant-based-news-youtube' and f.listing_id = o.id
  and not exists (select 1 from public.ve_youtube_feeds where listing_id = y.id);
update public.listings set extra_categories = array_remove(extra_categories, 'YouTube'), details = details - 'youtube_channel_id'
where slug = 'plant-based-news' and status = 'approved' and details ? 'youtube_channel_id'
  and exists (select 1 from public.listings where slug = 'plant-based-news-youtube');

-- 4. VegOut (no longer active) and VegWorld (latest story 2026-02-23) come off the Directory: Removed, never deleted, put back
--    from Directory review's Removed list.
select public.ve_listing_set_state(id, 'removed', '72712a4a-ea0e-4ef4-a29e-d382496ef8da',
  case slug when 'vegout-magazine' then 'Not active any more (Sean, 2026-10-30).'
            else 'Latest story February 23, 2026; out of date (Sean, 2026-10-30).' end, null)
from public.listings where slug in ('vegout-magazine', 'vegworld-magazine') and status = 'approved';
