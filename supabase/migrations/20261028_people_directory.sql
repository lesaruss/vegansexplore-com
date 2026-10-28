-- The People directory (Sean, 2026-10-28: "a people directory... people that we've actually interacted with... the same way we have
-- media, community, we want to see people... an IMDb of all the stuff that they've done with Vegans Explore").
-- A person is a listing in the People section (category Activists, Content Creators, Athletes, Physicians, Health Experts, Chefs or
-- Founders), so votes, saves, the card and the page work as for everyone else. No place: no address, phone or hours; every chapter.
-- What they have done with us is a credit: an episode of one of our shows, an event, an article, a video.
-- listings.details.person: { title (their profession in a line), specialty (a physician's), links [{label, url}] (their intake page,
-- their product, their book), bio_source ('transcript' when the bio was written from their interview) }.

create table if not exists public.ve_person_credits (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  kind text not null check (kind in ('episode', 'event', 'article', 'video')),
  role text,                                  -- Guest, Speaker, Panelist, Vendor, Host, Featured
  content_id uuid references public.ve_pulse_content(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  title text,                                 -- for an event, article or video not in our tables
  url text,
  happened_on date,
  note text,
  created_at timestamptz not null default now(),
  unique (listing_id, kind, content_id),
  unique (listing_id, kind, event_id)
);
create index if not exists ve_person_credits_listing_idx on public.ve_person_credits (listing_id);
create index if not exists ve_person_credits_content_idx on public.ve_person_credits (content_id);

alter table public.ve_person_credits enable row level security;
drop policy if exists ve_person_credits_read on public.ve_person_credits;
create policy ve_person_credits_read on public.ve_person_credits for select using (true);
grant select on public.ve_person_credits to anon, authenticated;
