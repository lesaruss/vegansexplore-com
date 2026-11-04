-- ve-vegan-sourcing-guide (Logan, 2026-11-04). The crawl of food, drink, ingredient, packaging and co-packer suppliers.
-- ve_suppliers gets the evidence behind each label (a quote from the company's own site, checked to really be there),
-- and a staging table keeps every company the crawl found, what happened to it and why, so nothing is lost or read twice.
alter table ve_suppliers add column if not exists evidence text;
alter table ve_suppliers add column if not exists country text;
alter table ve_suppliers add column if not exists google_place_id text;
create unique index if not exists ve_suppliers_place_idx on ve_suppliers (google_place_id) where google_place_id is not null;

create table if not exists ve_supplier_candidates (
  id uuid primary key default gen_random_uuid(),
  place_id text unique,
  query text,
  domain_guess text,
  name text,
  website text,
  host text,
  address text,
  types text[] default '{}',
  status text not null default 'new' check (status in ('new','added','rejected','failed')),
  reason text,
  supplier_id uuid,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
alter table ve_supplier_candidates enable row level security;
create index if not exists ve_supplier_candidates_status_idx on ve_supplier_candidates (status);
