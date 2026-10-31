-- Visit bounties for BrandDesk clients (Sean, 2026-10-31, the build order after the pitch pages; canon-ve-front-of-house:
-- "member visit bounties open to everyone: the phone's location proves the visit, a phone shooting guide on the gig, team
-- approval before points, the best credited on the listing and our socials. Members pay their own meal unless the restaurant
-- offers a perk; a comped visit is disclosed (FTC)").
-- A visit is a claim gig (gig_kind 'visit') tied to the restaurant (visit_listing_id). Posted weekly from Depot > BrandDesk >
-- a client; repeat_weekly makes the hourly ve-bounties cron post next week's when this week's claims close.
alter table public.ve_bounties add column if not exists visit_listing_id uuid references public.listings(id);
alter table public.ve_bounties add column if not exists repeat_weekly boolean not null default false;
alter table public.ve_bounties drop constraint if exists ve_bounties_gig_kind_check;
alter table public.ve_bounties add constraint ve_bounties_gig_kind_check
  check (gig_kind = any (array['campaign','collab','hosting','event','content','bounty','photo','visit']));
create index if not exists ve_bounties_visit_listing_idx on public.ve_bounties (visit_listing_id) where visit_listing_id is not null;

-- The visit itself: when "I'm here" was tapped, how far the phone was from the restaurant and how sure it was, whether the meal
-- was on the house (the FTC disclosure), and when the approved photos went into the client's Library.
alter table public.ve_bounty_submissions add column if not exists visit_at timestamptz;
alter table public.ve_bounty_submissions add column if not exists visit_distance_m integer;
alter table public.ve_bounty_submissions add column if not exists visit_accuracy_m integer;
alter table public.ve_bounty_submissions add column if not exists visit_comped boolean;
alter table public.ve_bounty_submissions add column if not exists library_at timestamptz;
