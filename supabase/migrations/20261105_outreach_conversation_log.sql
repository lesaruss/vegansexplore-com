-- ve-outreach-buckets: the Conversation box on a listing's outreach profile (Sean, 2026-11-05: "a tile where we can track the conversation
-- we're having with them. So if they send a message, if they send a DM... We can log if we've had a phone call").
-- One row per thing said, by them or by us, on any channel we cannot read automatically (an Instagram DM, a text, a call, in person, an
-- email reply that landed in contact@lesaruss.com). Emails our engine sent are not copied here; the profile reads them from email_sends.
-- Nothing is deleted: a wrong entry is marked removed. RLS on, no policies: read and written only by HQ's server (service role).
create table if not exists public.ve_conversation_log (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  person_key text,
  channel text not null check (channel in ('instagram','text','call','email','in_person','facebook','other')),
  direction text not null check (direction in ('in','out')),
  said_at timestamptz not null default now(),
  body text not null check (length(btrim(body)) between 1 and 4000),
  logged_by uuid,
  logged_by_name text,
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid,
  check (listing_id is not null or person_key is not null)
);
create index if not exists ve_conversation_log_listing on public.ve_conversation_log (listing_id, said_at desc) where removed_at is null;
create index if not exists ve_conversation_log_person on public.ve_conversation_log (person_key, said_at desc) where removed_at is null;
alter table public.ve_conversation_log enable row level security;
revoke all on public.ve_conversation_log from anon, authenticated;
