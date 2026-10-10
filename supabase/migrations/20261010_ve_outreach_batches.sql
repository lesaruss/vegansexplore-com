-- Business outreach: Sean approves who gets it (Sean, 2026-10-10: "I would like to be able to see who is on the queue,
-- approve who the emails are going to be going out to... on Monday, we're sending it to these 60... see what the draft
-- is that's going to be sent to them... and we commit to it for like maybe 15 days before we make any drastic changes").
--
-- Contacts go out in batches, one per send day per city. A batch is proposed (Depot > Business outreach, Plan), Sean looks
-- at each row (who they are, their page, the exact email) and approves it; a row can be taken out first. Approving a batch
-- approves the whole sequence for those businesses: Day 0 on its send day, then Day 4 and Day 10 unless they respond.
-- The first approval in a city starts its 15-day commitment (ve_outreach_cities.committed_until): no big changes to the
-- emails or the plan before then.
-- A business featured in a Guide gets a line saying so, with a link to where it is in that Guide (Sean, 2026-10-10:
-- "take them to the guide so they can see that implementation as well").

create table if not exists public.ve_outreach_batches (
  id uuid primary key default gen_random_uuid(),
  community_slug text not null references public.ve_outreach_cities(community_slug),
  send_on date not null,
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'sent', 'cancelled')),
  approved_at timestamptz,
  approved_by uuid references public.members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_outreach_batches_city_idx on public.ve_outreach_batches (community_slug, send_on);
alter table public.ve_outreach_batches enable row level security;

alter table public.ve_outreach_contacts add column if not exists batch_id uuid references public.ve_outreach_batches(id) on delete set null;
alter table public.ve_outreach_contacts add column if not exists email_source text;
alter table public.ve_outreach_cities add column if not exists committed_until date;

-- Brands are not in a city: they have their own row, and go first.
insert into public.ve_outreach_cities (community_slug, name) values ('brands', 'Brands (national)')
on conflict (community_slug) do nothing;

-- Guides a listing is in: as a brand whose products a Guide lists, or as a store that carries them.
create or replace function public.ve_outreach_guides(p_listing uuid)
returns table (guide_slug text, title text, as_store boolean)
language sql stable security definer set search_path to 'public' as $fn$
  select distinct on (g.slug) g.slug, g.title, x.as_store
  from (
    select unnest(p.guides) gs, false as_store from ve_products p where p.brand_listing_id = p_listing
    union all
    select unnest(p.guides), true from ve_product_stores s join ve_products p on p.id = s.product_id
      where s.store_listing_id = p_listing and s.removed_at is null
  ) x join ve_guides g on g.slug = x.gs and g.published
  order by g.slug, x.as_store
$fn$;
revoke all on function public.ve_outreach_guides(uuid) from public, anon, authenticated;

-- The email exactly as it goes out (the sender swaps {link} for the business's personal /go/ link to the same page).
create or replace function public.ve_outreach_render(p_contact uuid, p_step integer default 1)
returns table (subject text, body text, to_email text, page_url text, guide_url text)
language plpgsql stable security definer set search_path to 'public' as $fn$
declare c record; l record; t record; g record; oc record; first text; city text; page text; gurl text; gline text := '';
begin
  select * into c from ve_outreach_contacts where id = p_contact;
  if not found then return; end if;
  select * into l from listings where id = c.listing_id;
  select * into oc from ve_outreach_cities where community_slug = c.community_slug;
  select * into t from ve_outreach_templates where step = p_step;
  if t is null then return; end if;
  first := nullif(split_part(trim(coalesce(c.contact_name, '')), ' ', 1), '');
  -- National brands have no city: "{in_city}" is " in South Florida" for a city, nothing for a brand.
  city := case when c.community_slug = 'brands' then '' else oc.name end;
  page := 'https://vegansexplore.com/directory/' || l.slug;
  select * into g from ve_outreach_guides(c.listing_id) limit 1;
  if g.guide_slug is not null then
    gurl := 'https://vegansexplore.com/guides/' || replace(g.guide_slug, '-site', '') || '#/listing/' || l.slug;
    gline := E'\n\n' || l.name || ' is also in ' || g.title || case when g.as_store
      then ', as a store where our members find the products it recommends.' else ', where our members choose what to buy.' end
      || ' See how you''re featured: ' || gurl;
  end if;
  subject := replace(replace(replace(t.subject, '{business}', l.name), '{in_city}', case when city = '' then '' else ' in ' || city end), '{city}', city);
  body := replace(replace(replace(replace(replace(replace(replace(t.body,
    '{in_city}', case when city = '' then '' else ' in ' || city end),
    '{first_name}', coalesce(first, 'there')),
    '{business}', l.name),
    '{city}', city),
    '{link}', page),
    '{guide}', case when c.segment = 'brand' and g.guide_slug like 'vegan-dairy-guide%' then 'Maya' else 'Liz' end),
    '{guide_line}', gline);
  to_email := c.email; page_url := page; guide_url := gurl;
  return next;
end $fn$;
revoke all on function public.ve_outreach_render(uuid, integer) from public, anon, authenticated;

-- Day 0 names the Guide feature, after the page link; national brands drop the city ("{in_city}").
update public.ve_outreach_templates set
  subject = replace(subject, ' in {city}', '{in_city}'),
  body = replace(replace(replace(body, ' in {city}', '{in_city}'), '{guide_line}', ''), E'Take a look: {link}', E'Take a look: {link}{guide_line}'),
  updated_at = now()
where step = 1;
update public.ve_outreach_templates set
  subject = replace(subject, ' in {city}', '{in_city}'),
  body = replace(body, ' in {city}', '{in_city}'), updated_at = now()
where step in (2, 3);

-- Propose the next batches for a city: p_sizes[i] businesses on the i-th send day (weekdays from p_start), brands first,
-- only contacts that are Not sent yet and in no batch.
create or replace function public.ve_outreach_plan(p_city text, p_start date, p_sizes integer[])
returns integer language plpgsql security definer set search_path to 'public' as $fn$
declare d date := p_start; i integer; b uuid; n integer := 0; k integer;
begin
  for i in 1 .. coalesce(array_length(p_sizes, 1), 0) loop
    while extract(isodow from d) > 5 loop d := d + 1; end loop;
    insert into ve_outreach_batches (community_slug, send_on) values (p_city, d) returning id into b;
    update ve_outreach_contacts set batch_id = b where id in (
      select id from ve_outreach_contacts where community_slug = p_city and status = 'not_sent' and batch_id is null
      order by (segment = 'brand') desc, created_at limit greatest(p_sizes[i], 0));
    get diagnostics k = row_count;
    if k = 0 then delete from ve_outreach_batches where id = b; exit; end if;
    n := n + k; d := d + 1;
  end loop;
  return n;
end $fn$;
revoke all on function public.ve_outreach_plan(text, date, integer[]) from public, anon, authenticated;

-- What a sender would send now: approved batches whose day has come (Day 0), and follow-ups when due. Nothing else.
create or replace function public.ve_outreach_due(p_limit integer default 100)
returns table (contact_id uuid, community_slug text, listing_id uuid, email text, next_step integer)
language sql stable security definer set search_path to 'public' as $fn$
  select c.id, c.community_slug, c.listing_id, c.email, c.step + 1
  from ve_outreach_contacts c
  join ve_outreach_batches b on b.id = c.batch_id and b.status in ('approved', 'sent')
  join ve_outreach_cities oc on oc.community_slug = c.community_slug and oc.enabled
  where c.step < 3
    and ((c.status = 'not_sent' and c.step = 0 and b.send_on <= (now() at time zone 'America/New_York')::date)
      or (c.status = 'in_sequence' and c.next_send_at <= now()))
    and not exists (select 1 from email_suppressions x where x.active and lower(x.email) = lower(c.email))
    and exists (select 1 from ve_outreach_templates t where t.step = c.step + 1 and t.status = 'ready')
  order by b.send_on, (c.segment = 'brand') desc, c.created_at
  limit p_limit
$fn$;
revoke all on function public.ve_outreach_due(integer) from public, anon, authenticated;

-- Emails found on a business's own website (Depot > Business outreach > Find emails, ve-outreach find_emails). One row per
-- listing tried, so a website is read once; an email is never guessed, only taken from a page (source_url).
create table if not exists public.ve_outreach_lookups (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  tried_at timestamptz not null default now(),
  email text,
  source_url text,
  note text
);
alter table public.ve_outreach_lookups enable row level security;

grant execute on function public.ve_outreach_guides(uuid), public.ve_outreach_render(uuid, integer),
  public.ve_outreach_plan(text, date, integer[]), public.ve_outreach_due(integer) to service_role;
