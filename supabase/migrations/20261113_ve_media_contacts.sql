-- Founding Press and media contacts (Sean, 2026-11-13; playbook ve-newsroom). Sean approved the Founding Press 25 ("Approved").
-- Contacts are found only on the outlet's own public pages (through ve-web-reader) and in its articles' bylines; an email is stored
-- only when it appears exactly on the page it came from (never guessed), with that page kept as source_url. Private: no policies.

alter table public.ve_media_outlets add column if not exists program text;          -- 'founding_press' for the first 25
alter table public.ve_media_outlets add column if not exists program_at timestamptz;

create table if not exists public.ve_media_contacts (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.ve_media_outlets(id) on delete cascade,
  kind text not null default 'person' check (kind in ('person', 'desk')),   -- a reporter or editor, or a shared inbox (tips, news desk)
  name text,
  role text,
  beat text,
  email text,
  phone text,
  profile_url text,
  social text,
  source_url text not null,
  status text not null default 'found' check (status in ('found', 'verified', 'bounced', 'do_not_contact')),
  notes text,
  found_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ve_media_contacts_one on public.ve_media_contacts (outlet_id, lower(coalesce(email, '')), lower(coalesce(name, '')));
create index if not exists ve_media_contacts_outlet on public.ve_media_contacts (outlet_id);
alter table public.ve_media_contacts enable row level security;

update public.ve_media_outlets set program = 'founding_press', program_at = coalesce(program_at, now())
where domain in ('vegnews.com', 'plantbasednews.org', 'vegoutmag.com', 'onegreenplanet.org', 'veganfoodandliving.com',
  'cbsnews.com', 'nytimes.com', 'foodandwine.com', 'theinfatuation.com', 'tastingtable.com', 'eatingwell.com', 'axios.com', 'thetakeout.com',
  'cbc.ca', 'theguardian.com',
  'bocamag.com', 'wfla.com', 'orlandosentinel.com', 'clickondetroit.com', 'billypenn.com', 'koin.com', 'secretatlanta.co', 'latimes.com',
  'nbcsandiego.com', 'tucsonfoodie.com');
