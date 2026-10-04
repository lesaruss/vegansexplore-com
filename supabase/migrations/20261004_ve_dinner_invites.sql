-- City dinner v3 (Sean, 2026-10-04, after BOSS and a PANEL): the seat is a gift, held by name.
-- Every guest is on this list with a personal code; their link (/dinners/<city>?i=<code>, sent
-- as a tracked link from Depot > Links) holds their seat with a yes and one answer in advance.
-- No checkout, no plus-ones. A backup list fills seats that open. People who were not invited can
-- ask for a seat (status 'requested'); Sean decides. Managed in Depot > Dinner guests.
create table if not exists public.ve_dinner_invites (
  id uuid primary key default gen_random_uuid(),
  dinner_slug text not null references public.ve_dinners(slug) on delete cascade,
  code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  name text not null check (char_length(name) between 1 and 120),
  email text check (email is null or char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 40),
  list text not null default 'a' check (list in ('a', 'backup')),
  rank integer,
  status text not null default 'invited' check (status in ('invited', 'yes', 'declined', 'requested', 'not_invited')),
  answer text check (answer is null or char_length(answer) <= 1000),
  suggestion text check (suggestion is null or char_length(suggestion) <= 500),
  note text check (note is null or char_length(note) <= 1000),
  show_name boolean not null default true,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_dinner_invites_dinner_idx on public.ve_dinner_invites (dinner_slug, status);
alter table public.ve_dinner_invites enable row level security; -- service role only, through ve-dinner-seats

-- RSVPs close a week out so the host gets a locked count (the count can only go down after).
alter table public.ve_dinners add column if not exists rsvp_closes date;
update public.ve_dinners set rsvp_closes = '2026-10-16' where slug = 'palm-beach-2026-10-23' and rsvp_closes is null;
