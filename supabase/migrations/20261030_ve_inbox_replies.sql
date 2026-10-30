-- Replying from the Inbox (Sean, 2026-10-30: "go with your recommendation"). A reply is sent from the dashboard's Inbox by email
-- from Vegans Explore, signed with the sender's first name ("Maria, Vegans Explore team"), replies to contact@lesaruss.com (and the
-- Community Manager who sent it). Sending one sets ve_inbox_state.replied_at, so the 24-hour clock stops itself. Every reply is kept
-- here; read only through ve-dashboard (RLS on, no policies).
create table if not exists public.ve_inbox_replies (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id uuid not null,
  member_id uuid references public.members(id) on delete set null,
  to_email text not null,
  subject text not null,
  body text not null,
  signed_as text,
  provider_id text,
  test boolean not null default false,
  sent_at timestamptz not null default now()
);
create index if not exists ve_inbox_replies_item on public.ve_inbox_replies (source, source_id, sent_at desc);
alter table public.ve_inbox_replies enable row level security;
