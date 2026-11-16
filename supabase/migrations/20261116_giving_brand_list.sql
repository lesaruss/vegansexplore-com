-- 11 Days of Giving: the brand list (Sean, 2026-11-16: "lock it at $150 per pack"; playbook ve-holiday-guide). One row per approved brand
-- listing (Food Brands, or a listing that sells products), with the email on file and what ve-web-reader found on its own website.
-- Nothing here sends: the list feeds an HQ Outreach program only after Sean approves the email.
create table if not exists ve_giving_brand_list (
  listing_id uuid primary key references listings(id) on delete cascade,
  name text not null,
  slug text,
  website text,
  email_on_file text,
  found_emails text[] default '{}',
  contact_links text[] default '{}',
  read_request bigint,
  read_status int,
  contact_request bigint,
  best_email text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table ve_giving_brand_list enable row level security;
insert into ve_giving_brand_list (listing_id, name, slug, website, email_on_file)
select id, name, slug, nullif(website,''), coalesce(nullif(email,''), nullif(ve_contact_email,''))
from listings
where status = 'approved' and (category = 'Food Brands' or (product_kinds is not null and array_length(product_kinds,1) > 0))
on conflict (listing_id) do nothing;
-- After the reads (ve-web-reader, home page then one contact page per brand): emails found, then the best one per brand.
-- (run 2026-11-16; held by the connector's approval box, see the session notes)
with r as (select b.listing_id, (r.content)::jsonb j from ve_giving_brand_list b join net._http_response r on r.id=b.contact_request),
e as (select listing_id, (select array_agg(distinct lower(m[1])) from regexp_matches(coalesce(j->>'text','') || ' ' || coalesce((j->'links')::text,''), '([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})', 'g') m
   where lower(m[1]) !~ '(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.svg|sentry|wixpress|example\.com|domain\.com|godaddy|yourname|email\.com|@2x|shopify\.com)') ems from r)
update ve_giving_brand_list b set found_emails = coalesce(e.ems,'{}'), updated_at=now() from e where e.listing_id=b.listing_id and e.ems is not null;
update ve_giving_brand_list b set best_email = coalesce(b.email_on_file, (select x from unnest(b.found_emails) x order by
   case when x ~ '^(partner|collab|sponsor|marketing|pr|press|media|wholesale|sales)' then 0 when x ~ '^(hello|hi|info|contact|team|support)' then 1 else 2 end,
   case when b.website is not null and position(split_part(x,'@',2) in lower(b.website))>0 then 0 else 1 end limit 1)), updated_at=now();
