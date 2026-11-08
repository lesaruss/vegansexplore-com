-- ve-community-voices: comment requests (Sean, 2026-11-08).
-- "Send out an email to them for a comment that we can give them the option to complete using a voice recording or writing it out.
-- If they use the voice, we may use it in our article... make sure the form is ready so we can use it in the future as well for
-- comments from our community on different items. It can also be a way to spotlight people and organizations in our listings."
--
-- A request is one ask (a business, a person, an organization, or the whole community), with its own link /comment/<code>.
-- A response is what came back: written words, a voice recording (private bucket community-comments), or both, with the release.
-- RLS on, no policies: everything goes through the edge function ve-comments.

create table if not exists ve_comment_requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null default 'business' check (kind in ('business','person','organization','community')),
  purpose text not null default 'pulse' check (purpose in ('pulse','spotlight','podcast','article','other')),
  listing_id uuid references listings(id) on delete set null,
  person_key text,
  to_name text,                       -- who we are asking (shown as "Hi <first name>")
  to_email text,
  title text not null,                -- what it is about, shown as the page heading
  prompt text not null,               -- the question we ask
  context text,                       -- a short paragraph of background
  allow_voice boolean not null default true,
  allow_written boolean not null default true,
  voice_max_seconds integer not null default 120 check (voice_max_seconds between 15 and 600),
  multi boolean not null default false,   -- true: anyone with the link may answer (community comments); false: one answer closes it
  closes_at timestamptz,
  status text not null default 'open' check (status in ('open','answered','closed')),
  opened_at timestamptz,
  open_count integer not null default 0,
  campaign text,
  note text,                          -- team only
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_comment_requests_listing on ve_comment_requests(listing_id);

create table if not exists ve_comment_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references ve_comment_requests(id) on delete cascade,
  member_id uuid,
  name text not null,
  role text,                          -- their title or how to credit them ("Co-founder, Honest Cuban by VCC")
  email text,
  written text,
  audio_path text,
  audio_seconds integer,
  credit_ok boolean not null default true,   -- we may name them with it
  release_at timestamptz not null,            -- the release: we may quote it, play it, and edit it for length
  adult boolean not null default true,
  status text not null default 'new' check (status in ('new','approved','used','declined')),
  used_in text,
  team_note text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  check (written is not null or audio_path is not null)
);
create index if not exists ve_comment_responses_request on ve_comment_responses(request_id, created_at desc);

alter table ve_comment_requests enable row level security;
alter table ve_comment_responses enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-comments', 'community-comments', false, 26214400,
        array['audio/webm','audio/mp4','audio/m4a','audio/x-m4a','audio/aac','audio/mpeg','audio/ogg','audio/wav','audio/x-wav'])
on conflict (id) do nothing;
