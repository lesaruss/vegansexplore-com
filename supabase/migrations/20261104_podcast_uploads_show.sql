-- BrandDesk > Insights > Podcast: one tab per show. Uploaded Captivate pages belong to a show of the brand
-- (vegans-explore, soflo-vegans, vegans-who-lift, pre-vegans). Playbook podcast-network-transcript-upload (VE Podcast Network).
-- Every upload before this was made on the Vegans Explore Podcast's page, so the default is its key.
alter table public.ve_podcast_uploads add column if not exists show_key text not null default 'vegans-explore';
create index if not exists ve_podcast_uploads_show_idx on public.ve_podcast_uploads (brand_slug, show_key, period_to desc) where removed_at is null;
