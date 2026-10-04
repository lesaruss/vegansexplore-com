-- Bounties as campaigns (Sean, 2026-10-04, playbook ve-bounties-lifecycle, worked through with V).
-- The bounties page shows campaign cards; a card opens the campaign with its story and its jobs.
-- Creator campaigns are by need only. They are their own Vegans Explore table (public.campaigns is
-- the LESARUSS-wide brand table) and can belong to a Vegans Explore campaign through campaign_id,
-- so the Plant Based Showcase can carry its own creator work.
--   kind event:   a festival or party with a date. Claims close 48 hours before, work due 7 days after.
--   kind place:   a host night at a restaurant. The host must be an active member, provides the meal
--                 and chooses it, and gets the recap and a featured listing filled with the content.
--   kind ongoing: a run window with no event day; work due when the window ends.
-- Any leadership member proposes (status proposed, jobs draft); the city's Community Manager or a
-- superadmin decides. A job is either one bundle (parts: every part required to earn the points)
-- or one of several separate jobs that each pay on their own.

create table if not exists public.ve_bounty_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  community_slug text not null,
  kind text not null check (kind in ('event', 'place', 'ongoing')),
  title text not null check (char_length(title) between 3 and 140),
  story text check (char_length(story) <= 4000),
  cover_url text check (char_length(cover_url) <= 1000),
  campaign_id uuid references public.campaigns(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  place_name text check (char_length(place_name) <= 200),
  address text check (char_length(address) <= 300),
  starts_at timestamptz,
  ends_at timestamptz,
  claims_close_at timestamptz,
  due_at timestamptz,
  host_listing_id uuid references public.listings(id) on delete set null,
  host_member_id uuid references public.members(id) on delete set null,
  host_extras text[] not null default '{}',
  creator_cap integer check (creator_cap is null or creator_cap > 0),
  status text not null default 'proposed' check (status in ('proposed', 'open', 'closed', 'canceled', 'declined')),
  proposed_by uuid references public.members(id) on delete set null,
  decided_by uuid references public.members(id) on delete set null,
  decided_at timestamptz,
  decision_note text check (char_length(decision_note) <= 1000),
  featured_applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_bounty_campaigns_city_idx on public.ve_bounty_campaigns (community_slug, status);
alter table public.ve_bounty_campaigns enable row level security;
revoke all on public.ve_bounty_campaigns from anon, authenticated;

alter table public.ve_bounties
  add column if not exists campaign_id uuid references public.ve_bounty_campaigns(id) on delete set null,
  add column if not exists parts text[] not null default '{}';
create index if not exists ve_bounties_campaign_idx on public.ve_bounties (campaign_id);
alter table public.ve_bounties drop constraint if exists ve_bounties_kind_check;
alter table public.ve_bounties add constraint ve_bounties_kind_check
  check (kind in ('recap_video', 'vlog', 'interviews', 'writeup', 'clips', 'feature', 'photos', 'reel', 'social_post', 'other'));
alter table public.ve_bounty_rundowns drop constraint if exists ve_bounty_rundowns_kind_check;
alter table public.ve_bounty_rundowns add constraint ve_bounty_rundowns_kind_check
  check (kind in ('recap_video', 'vlog', 'interviews', 'writeup', 'clips', 'feature', 'photos', 'reel', 'social_post', 'other'));

alter table public.ve_bounty_submissions add column if not exists parts_done integer[] not null default '{}';

-- A host's featured run (90 days from the first approved work). Only set by bounties, so the hourly
-- job can end it without touching a listing featured some other way.
alter table public.listings add column if not exists featured_until timestamptz;

-- The two Oct 24 events become the first two campaigns; claims already made are untouched.
insert into public.ve_bounty_campaigns (slug, community_slug, kind, title, story, event_id, starts_at, ends_at, claims_close_at, due_at, status, decided_at)
select distinct on (b.event_id)
  lower(regexp_replace(b.event_title, '[^A-Za-z0-9]+', '-', 'g')) || '-2026',
  b.community_slug, 'event', b.event_title,
  'We are covering ' || b.event_title || ' for the South Florida Vegan community. Pick the job that fits you: a recap video, a vlog, interviews, a write-up or raw clips. Each one pays on its own, so more of us can be part of it.',
  b.event_id, b.event_starts_at, b.event_ends_at, b.claims_close_at, b.due_at, 'open', now()
from public.ve_bounties b
where b.event_title in ('Vegan Creole Festival', 'Vegan Day Party Miami')
order by b.event_id, b.sort
on conflict (slug) do nothing;
update public.ve_bounties b set campaign_id = c.id
from public.ve_bounty_campaigns c
where c.event_id = b.event_id and b.campaign_id is null;
update public.ve_bounty_campaigns c set place_name = e.location_name, address = case when e.address ilike '%' || e.city || '%' then e.address else nullif(concat_ws(', ', e.address, e.city, e.state), '') end, cover_url = coalesce(c.cover_url, e.image_url)
from public.events e where e.id = c.event_id;

-- Rundown for host-night content (the bundled place job).
insert into public.ve_bounty_rundowns (kind, title, intro, sections, links) values ('feature', 'Host night rundown', 'You are a guest of the restaurant tonight. Enjoy the meal they chose for you, then show people why they should come.',
 jsonb_build_array(
  jsonb_build_object('heading', 'Before you go', 'items', jsonb_build_array('Read the campaign story: the date, the time and who to ask for when you arrive.', 'Charge everything and clear space on your phone.', 'Arrive on time. The kitchen plans the meals around the creators who claimed a seat.')),
  jsonb_build_object('heading', 'Every part, every time', 'items', jsonb_build_array('You eating on camera: at least 3 shots of you tasting and reacting.', 'Close-ups of every dish you are served: plated, cut into, the first bite.', 'The space: the room, the counter, the sign out front.', 'A 15 to 30 second talk to camera: what you ate and why people should come.', 'A post on your own account tagging the restaurant and Vegans Explore. Paste the link when you submit.')),
  jsonb_build_object('heading', 'Style', 'items', jsonb_build_array('Natural light beats flash. Sit near a window if you can.', 'Hold every shot at least 3 seconds.', 'Shoot the food before you eat it, then the first bite.', 'Original files only: no filters, no music.')),
  jsonb_build_object('heading', 'Consent', 'items', jsonb_build_array('Staff and other guests who are the clear focus of a shot say yes first.', 'Ask: Can we use this on Vegans Explore? and get the yes on camera.')),
  jsonb_build_object('heading', 'Common mistakes', 'items', jsonb_build_array('Skipping a part. Every part is needed to earn the points.', 'Dark, blurry close-ups.', 'No sign or name, so nobody knows where it was.'))
 ), '[]'::jsonb)
on conflict (kind) do nothing;
