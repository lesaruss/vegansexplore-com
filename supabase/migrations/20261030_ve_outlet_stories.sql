-- News outlets show their latest stories under About (Sean, 2026-10-30). Edge function ve-outlet-stories reads each outlet's
-- RSS or Atom feed (listings.rss_url, found from their home page when empty) and keeps the latest 100 here.
create table if not exists public.ve_outlet_feeds (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  feed_url text not null default '',
  stories jsonb not null default '[]'::jsonb,
  fetched_at timestamptz,
  error text,
  error_at timestamptz
);
alter table public.ve_outlet_feeds enable row level security;  -- no policies: only ve-outlet-stories reads it

-- Our three Vegan outlets' feeds are known from the Pulse's sources (ve_news_feeds).
update public.listings set rss_url = 'https://vegnews.com/rss' where slug = 'vegnews-magazine' and status = 'approved' and rss_url is null;
update public.listings set rss_url = 'https://plantbasednews.org/feed/' where slug = 'plant-based-news' and status = 'approved' and rss_url is null;
update public.listings set rss_url = 'https://sentientmedia.org/feed/' where slug = 'sentient-media' and status = 'approved' and rss_url is null;

-- General outlets show only stories about Vegan living and animals (Logan's default, Sean's "go" 2026-10-30).
update public.listings set details = coalesce(details, '{}'::jsonb) || '{"news_filter":"vegan"}'::jsonb
where status = 'approved' and category = 'News Outlets'
  and slug in ('diario-las-amricas','las-olas-insider','miamis-community-newspapers','westside-gazette','wlrn-public-media',
               'wpec-cbs-12','wptv-tv-west-palm-beach');

-- Two feeds their home pages do not announce (found 2026-10-30): CBS 12's local news and Diario Las Américas' latest.
update public.listings set rss_url = 'https://cbs12.com/news/local.rss' where slug = 'wpec-cbs-12' and status = 'approved' and coalesce(rss_url, '') = '';
update public.listings set rss_url = 'https://www.diariolasamericas.com/rss/pages/lo-ultimo.xml' where slug = 'diario-las-amricas' and status = 'approved' and coalesce(rss_url, '') = '';
delete from public.ve_outlet_feeds f using public.listings l where l.id = f.listing_id and l.slug in ('wpec-cbs-12', 'diario-las-amricas');
