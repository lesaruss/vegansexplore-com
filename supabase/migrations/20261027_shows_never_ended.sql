-- A show is never Ended, only On hiatus (Sean, 2026-10-27: "We can't confirm it's ended because it could come back 3 years later...
-- I would take offense if somebody typed my podcast ended"). ve-podcast now sets OPERATIONAL or CLOSED_TEMPORARILY only; the
-- five podcasts the feed had marked Ended (Keep On Cookin', Moby Pod, Pre-Vegans, The Keto Vegan, The Ordinary Vegan) go to On hiatus.
update public.listings set business_status = 'CLOSED_TEMPORARILY', updated_at = now()
where business_status = 'CLOSED_PERMANENTLY' and category in ('Podcasts', 'YouTube', 'News Outlets', 'Media');
