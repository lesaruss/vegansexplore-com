-- BrandDesk website launch (canon canon-ve-front-of-house; Sean, 2026-10-31: "we're going to go ahead with the website launch").
-- A client's real website: built from their Cartridge (ve_cartridges) on the same frame as business/site.html, only the brand slots
-- changing; up first on a preview address for the owner to approve (the approval recorded); then on their own domain with SSL and a
-- final check of every page. One shared hosting project (Vercel branddesk-sites) serves every client site by the domain asked for.
--
-- ve_branddesk_sites, one per client account:
--   status       building (we are making it) | preview (sent to the owner) | changes (the owner asked for changes) | approved (the
--                owner said yes: `published` is what goes live) | connecting (their domain is added, waiting on DNS and SSL) | live
--                (the final check passed on their domain) | paused | ended
--   preview_token  the private preview address, <sites host>/p/<token>, always the brand kit as it is now (never indexed)
--   review       waiting (sent to the owner for their OK) | changes (they asked for changes) | null; a site already live stays up
--                while an update waits for their OK
--   published    the Cartridge the owner approved, the one their domain serves; changing the brand kit afterwards changes nothing live
--                until they approve again (published_version counts the approvals)
--   look         null: their brand kit's colors and type; else one of the ready looks while the kit's colors are not chosen
--   domain       their own domain (apex, with www sending to it, or a subdomain); domain_state what Vercel and the check last said
--   checks       the final check: every page over https on their domain, with what was looked at
-- ve_branddesk_site_events: every step, with who and when (made, sent, approved with the name they typed, changes asked, domain
--   added, checked, launched, paused, ended). RLS on, no policies: only ve-branddesk reads and writes them.
create table if not exists public.ve_branddesk_sites (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ve_branddesk_accounts(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  status text not null default 'building' check (status in ('building','preview','changes','approved','connecting','live','paused','ended')),
  preview_token text not null unique,
  look text,
  review text check (review in ('waiting','changes')),
  sent_at timestamptz,
  sent_by uuid,
  change_note text,
  change_at timestamptz,
  published jsonb,
  published_version int not null default 0,
  approved_at timestamptz,
  approved_by uuid,
  approved_name text,
  domain text unique,
  www boolean not null default false,
  domain_added_at timestamptz,
  domain_state jsonb not null default '{}'::jsonb,
  checks jsonb,
  checked_at timestamptz,
  launched_at timestamptz,
  launched_by uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ve_branddesk_sites_account on public.ve_branddesk_sites(account_id);
create index if not exists ve_branddesk_sites_listing on public.ve_branddesk_sites(listing_id);
alter table public.ve_branddesk_sites enable row level security;

create table if not exists public.ve_branddesk_site_events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.ve_branddesk_sites(id) on delete cascade,
  kind text not null,
  by_member uuid,
  by_name text,
  note text,
  data jsonb,
  at timestamptz not null default now()
);
create index if not exists ve_branddesk_site_events_site on public.ve_branddesk_site_events(site_id, at desc);
alter table public.ve_branddesk_site_events enable row level security;

-- Where the shared hosting project lives (ve-branddesk reads it; set once the project exists).
update public.ve_site_settings
   set value = coalesce(value, '{}'::jsonb) || jsonb_build_object('sites', coalesce(value->'sites', jsonb_build_object('project', null, 'host', 'branddesk-sites.vercel.app')))
 where key = 'branddesk';
