-- Spotlight on the Social tab (Sean, 2026-11-17: "when people claim it, let's keep the social media and just let them know to, give them
-- suggestions on what to pick to spotlight. And I would love it to be as simple as them putting the URL in there and then it's showing up
-- as a 3 column on the page or a 2 column if it's too big"). [{url, network, id, kind}], at most 6, set by the owner through
-- ve-listing-posts owner_spotlight; the listing page shows each as the post itself (Instagram, TikTok or YouTube's own embed).
alter table public.listings add column if not exists spotlight_posts jsonb;
comment on column public.listings.spotlight_posts is 'The owner''s Spotlight on the Social tab (Sean, 2026-11-17): [{url, network, id, kind}] Instagram, TikTok or YouTube links they paste, at most 6, shown as the posts themselves. Set through ve-listing-posts owner_spotlight.';
