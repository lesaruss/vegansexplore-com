-- Group Partner applications (Sean, 2026-10-30: "It needs to be an intake... if they're interested and they want to move forward,
-- there's a registration and it'll walk them through what they need to answer... give us everything we need to know about this group...
-- take this seriously. Answer these questions. Let us determine if you're a right fit"; playbook ve-group-partners).
-- The Group Partner Guide's Apply tab (/groups/welcome#/yes/1 to /5) sends one row through ve-group 'apply'; Sean reads them in
-- Depot > Group Partners > Applications (ve-groups 'applications', 'application_get', 'application_save'). Nothing here invites a group:
-- an invitation is still made by hand (Sean, 2026-10-29: no invitations until he picks who gets one).

create table if not exists ve_group_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  group_name text not null check (length(group_name) between 1 and 160),
  chapter text,
  city text,
  organizer_name text not null check (length(organizer_name) between 1 and 120),
  organizer_email text not null check (organizer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  answers jsonb not null default '{}'::jsonb,
  invite_code text,
  listing_id uuid references listings(id),
  member_id uuid references members(id),
  status text not null default 'new' check (status in ('new', 'reviewing', 'accepted', 'declined')),
  decision_note text,
  reviewed_at timestamptz,
  reviewed_by text
);
create index if not exists ve_group_applications_status on ve_group_applications (status, created_at desc);
create index if not exists ve_group_applications_email on ve_group_applications (lower(organizer_email), created_at desc);
alter table ve_group_applications enable row level security;
