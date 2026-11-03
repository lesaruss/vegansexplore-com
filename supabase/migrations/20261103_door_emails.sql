-- The Events Guide's welcome notes go to members who finished the event survey (not Tasters). One row per member and note.
create table if not exists ve_door_emails (
  member_id uuid not null references members(id) on delete cascade,
  kind text not null,
  sent_at timestamptz not null default now(),
  resend_id text,
  error text,
  primary key (member_id, kind)
);
alter table ve_door_emails enable row level security;
