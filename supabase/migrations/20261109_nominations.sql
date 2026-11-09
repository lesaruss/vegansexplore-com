-- ve-nominate-someone: nominations (Sean, 2026-11-09, approved; proposal docs/proposals/nominate-someone.md).
-- "We want them to nominate somebody from their community... They got to put in their name, that person's email address so we can contact
-- them, and then in their own words why... Once they submit that comes to us. We review it. And if we agree, we send an invitation."
--
-- One row per nomination: who (the nominee), what they do (pick any), why (a recording in the private community-comments bucket under
-- nominations/, and/or written words), and who nominated them. The team reviews it in Depot > Nominations. Status runs
-- new -> approved (ready to invite) or declined; invited, interviewing, member and featured come with the interview (step 2).
-- RLS on, no policies: everything goes through the edge function ve-nominations.

create table if not exists ve_nominations (
  id uuid primary key default gen_random_uuid(),
  nominee_name text not null,
  nominee_email text not null,
  community_slug text,                 -- ve_communities.slug, or null for somewhere else
  community_other text,                -- their area in their words when it is not a chapter
  roles text[] not null default '{}',  -- business_owner, content_creator, nonprofit, activist (pick any)
  self_nominated boolean not null default false,
  listing_id uuid references listings(id) on delete set null,   -- a Directory listing they are behind, when one fits
  written text,
  audio_path text,                     -- community-comments bucket, nominations/<uuid>.<ext>
  audio_seconds integer,
  nominator_member_id uuid,
  nominator_name text not null,
  nominator_email text,
  credit_ok boolean not null default true,      -- we may tell them, and say on air, who nominated them
  release_at timestamptz not null,              -- the release: we may play or read the nomination
  adult boolean not null default true,
  source text,                                  -- where it came from: hub, pulse, show, listing, direct
  status text not null default 'new' check (status in ('new','approved','declined','invited','interviewing','member','featured')),
  team_note text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (written is not null or audio_path is not null)
);
create index if not exists ve_nominations_status on ve_nominations(status, created_at desc);
create index if not exists ve_nominations_email on ve_nominations(lower(nominee_email));

alter table ve_nominations enable row level security;
