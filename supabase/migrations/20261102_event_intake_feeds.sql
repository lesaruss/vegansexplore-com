-- Every event feeds the Directory (Sean, 2026-11-02: "we put one thing in, put in one event, and we can get a whole bunch of
-- things from that"; "we probably should run a scan at least once a week just to make sure the event information is still
-- available"). Four parts:
--   1. Who puts an event on: events.organizer_name / organizer_url, saved at intake and read off the official page each week.
--   2. The weekly check (edge function ve-event-check, cron ve-event-check hourly): every upcoming event's official page is read
--      again once a week; what it found is a ve_event_checks row and events.link_* (ok, changed, postponed, cancelled, gone,
--      unreadable). Cancelled on its own page: status cancelled (off the calendar). A date or time the page changed: moved, logged.
--   3. Leads (ve_event_leads): every place an event was held and every organizer not yet in the Directory, counted across events,
--      for the team to add (no Google needed: the events say where) or set aside. Organizers that match a listing are linked.
--   4. People > Promoters: a person who puts on events. An organizer that is a People listing gets the event as a credit
--      (role Promoter) and Promoters among its sections.

alter table public.events
  add column if not exists organizer_name text,
  add column if not exists organizer_url text,
  add column if not exists link_status text,
  add column if not exists link_checked_at timestamptz,
  add column if not exists link_note text,
  add column if not exists link_fails int not null default 0;
alter table public.events drop constraint if exists events_link_status_check;
alter table public.events add constraint events_link_status_check
  check (link_status is null or link_status in ('ok', 'changed', 'postponed', 'cancelled', 'gone', 'unreadable', 'skipped'));
create index if not exists events_link_checked_idx on public.events (link_checked_at nulls first) where status = 'approved';

create table if not exists public.ve_event_checks (
  id bigserial primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  checked_at timestamptz not null default now(),
  url text,
  http int,
  outcome text not null,
  read_by text,             -- jsonld | next_data | claude | none
  found jsonb,
  changes jsonb,
  note text
);
create index if not exists ve_event_checks_event_idx on public.ve_event_checks (event_id, checked_at desc);
alter table public.ve_event_checks enable row level security;

create table if not exists public.ve_event_leads (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('venue', 'organizer')),
  norm text not null,
  city_norm text not null default '',
  name text not null,
  city text, state text, country text, address text, hub text,
  url text,
  event_ids uuid[] not null default '{}',
  event_count int not null default 0,
  first_at timestamptz, last_at timestamptz,
  status text not null default 'new' check (status in ('new', 'listed', 'linked', 'set_aside')),
  listing_id uuid references public.listings(id) on delete set null,
  note text,
  decided_by uuid, decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, norm, city_norm)
);
alter table public.ve_event_leads enable row level security;

-- 1. Intake keeps the organizer (the Background writer's events_crawl sends organizer_name / organizer_url).
create or replace function public.ve_event_intake(p_event jsonb, p_source text DEFAULT 'crawl'::text, p_source_id uuid DEFAULT NULL::uuid, p_author uuid DEFAULT NULL::uuid, p_approve boolean DEFAULT false)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  v_title text := nullif(btrim(p_event->>'title'), '');
  v_link text := nullif(btrim(coalesce(p_event->>'ticket_url', p_event->>'link')), '');
  v_starts timestamptz;
  v_ends timestamptz;
  v_cat text := lower(coalesce(nullif(p_event->>'category', ''), 'other'));
  v_author uuid := p_author;
  v_host uuid;
  v_past boolean := coalesce((p_event->>'past')::boolean, false);
  v_dupe uuid;
  v_id uuid;
  v_tenant uuid := '00000000-0000-4000-a000-000000000002';
  v_kind text := case when p_event->>'listing_kind' = 'funding' or p_event->>'kind' = 'funding' then 'funding' else 'event' end;
  v_funding jsonb := null;
  v_org text := nullif(left(btrim(coalesce(p_event->>'organizer_name', p_event->'organizer'->>'name', case when jsonb_typeof(p_event->'organizer') = 'string' then p_event->>'organizer' end)), 160), '');
  v_org_url text := nullif(btrim(coalesce(p_event->>'organizer_url', p_event->'organizer'->>'url')), '');
begin
  if v_org_url is not null and v_org_url !~* '^https?://' then v_org_url := null; end if;
  if p_event->>'tenant' = 'lesaruss' then v_tenant := '00000000-0000-4000-a000-000000000001';
  elsif p_source_id is not null then select coalesce(tenant_id, v_tenant) into v_tenant from ve_event_sources where id = p_source_id;
  end if;
  v_tenant := coalesce(v_tenant, '00000000-0000-4000-a000-000000000002');
  if v_title is null then return jsonb_build_object('ok', false, 'why', 'no_title'); end if;
  if v_link is null or v_link !~* '^https?://' then return jsonb_build_object('ok', false, 'why', 'no_official_link'); end if;
  begin v_starts := coalesce(nullif(p_event->>'deadline', ''), p_event->>'starts_at')::timestamptz; exception when others then v_starts := null; end;
  if v_starts is null then return jsonb_build_object('ok', false, 'why', case when v_kind = 'funding' then 'no_deadline' else 'no_date' end); end if;
  begin v_ends := nullif(p_event->>'ends_at', '')::timestamptz; exception when others then v_ends := null; end;
  if v_kind = 'funding' then
    v_ends := null;
    if v_cat not in ('grant', 'loan', 'accelerator', 'competition', 'fellowship') then v_cat := 'grant'; end if;
    v_funding := jsonb_strip_nulls(jsonb_build_object(
      'offered_by', nullif(left(btrim(coalesce(p_event->'funding'->>'offered_by', p_event->>'offered_by')), 120), ''),
      'amount', nullif(left(btrim(coalesce(p_event->'funding'->>'amount', p_event->>'amount')), 80), ''),
      'amount_usd', case when coalesce(p_event->'funding'->>'amount_usd', p_event->>'amount_usd') ~ '^[0-9]+$'
        then (coalesce(p_event->'funding'->>'amount_usd', p_event->>'amount_usd'))::bigint end,
      'eligibility', nullif(left(btrim(coalesce(p_event->'funding'->>'eligibility', p_event->>'eligibility')), 500), ''),
      'rolling', case when coalesce(p_event->'funding'->>'rolling', p_event->>'rolling') = 'true' then true end));
  elsif v_cat not in ('general','food','activism','health','social','market','festival','workshop','meetup','fundraiser','film','other',
                      'conference','summit','pitch','tour','networking','webinar') then v_cat := 'other';
  end if;
  begin v_host := nullif(p_event->>'host_listing_id', '')::uuid; exception when others then v_host := null; end;
  if v_host is not null and not exists (select 1 from listings where id = v_host) then v_host := null; end if;
  if v_host is null and p_source_id is not null then select listing_id into v_host from ve_event_sources where id = p_source_id; end if;
  if coalesce(v_ends, v_starts) < now() - interval '1 day'
     and not (v_past and v_host is not null and v_starts >= timestamptz '2020-01-01') then
    return jsonb_build_object('ok', false, 'why', case when v_kind = 'funding' then 'closed' else 'already_over' end);
  end if;
  select id into v_dupe from events where tenant_id = v_tenant and lower(title) = lower(v_title)
    and (starts_at at time zone 'UTC')::date = (v_starts at time zone 'UTC')::date
    and (status <> 'rejected' or rejection_reason like 'Duplicate of%') limit 1;
  if v_dupe is null and v_host is not null and (select count(*) from events where host_listing_id = v_host
      and lower(title) = lower(v_title) and status = 'rejected' and rejection_reason like 'Duplicate of%') >= 3 then
    return jsonb_build_object('ok', false, 'why', 'known_duplicate');
  end if;
  if v_dupe is null and v_kind = 'funding' then
    select id into v_dupe from events where tenant_id = v_tenant and listing_kind = 'funding' and status <> 'rejected'
      and (lower(title) = lower(v_title) or ticket_url = v_link) and starts_at >= now() - interval '1 day' limit 1;
  end if;
  if v_dupe is not null then
    if v_host is not null then update events set host_listing_id = v_host where id = v_dupe and host_listing_id is null; end if;
    if v_org is not null then update events set organizer_name = v_org, organizer_url = coalesce(organizer_url, v_org_url) where id = v_dupe and organizer_name is null; end if;
    return jsonb_build_object('ok', false, 'why', 'already_listed', 'id', v_dupe);
  end if;
  if v_author is null then
    select (value::jsonb->>'member_id')::uuid into v_author from lesaruss_dispatch_settings where key = 'pulse_auto';
  end if;
  insert into events (tenant_id, author_id, title, description, event_type, starts_at, ends_at, timezone, location_name, address,
    city, state, country, continent, virtual_url, category, ticket_url, price_cents, status, source, source_url, source_id, flyer_path,
    reviewed_by, reviewed_at, time_set, host_listing_id, listing_kind, funding, organizer_name, organizer_url)
  values (v_tenant, v_author, left(v_title, 200), coalesce(left(nullif(btrim(p_event->>'description'), ''), 2000), ''),
    case when v_kind = 'funding' then 'virtual' when p_event->>'event_type' in ('in_person','virtual','hybrid') then p_event->>'event_type' else 'in_person' end,
    v_starts, v_ends, coalesce(nullif(p_event->>'timezone', ''), 'America/New_York'),
    nullif(btrim(p_event->>'location_name'), ''), nullif(btrim(p_event->>'address'), ''),
    nullif(btrim(p_event->>'city'), ''), nullif(case when length(btrim(p_event->>'state')) <= 3 then upper(btrim(p_event->>'state')) else btrim(p_event->>'state') end, ''), nullif(upper(btrim(p_event->>'country')), ''),
    nullif(btrim(p_event->>'continent'), ''), nullif(btrim(p_event->>'virtual_url'), ''), v_cat, v_link,
    nullif(p_event->>'price_cents', '')::integer,
    case when p_approve then 'approved' else 'pending' end, p_source,
    coalesce(nullif(btrim(p_event->>'source_url'), ''), v_link), p_source_id, nullif(p_event->>'flyer_path', ''),
    case when p_approve then p_author end, case when p_approve then now() end,
    case when v_kind = 'funding' then coalesce((p_event->>'time_set')::boolean, false) else coalesce((p_event->>'time_set')::boolean, true) end,
    v_host, v_kind, v_funding, v_org, v_org_url)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$function$;

-- The Background writer asks for the organizer from now on.
update public.lesaruss_dispatch_sources set instructions = instructions || $i$

Who puts it on (Sean, 2026-11-02: every event tells us a venue and an organizer for the Directory): add "organizer_name" (the group,
business or person the official page names as the organizer or host) and "organizer_url" (their own page or profile link, if the
page gives one) to every event you save. Leave them out when the page does not say.
$i$
where key = 'events_crawl' and instructions not like '%Who puts it on (Sean, 2026-11-02%';

-- 3 and 4. Leads, organizer links and People > Promoters.
create or replace function public.ve_event_leads_refresh() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_t uuid := '00000000-0000-4000-a000-000000000002'; v_linked int := 0; v_credits int := 0; v_k int; r record;
  v_people text[] := array['Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders','Promoters'];
begin
  -- Organizers that are already in the Directory: a person gets the event as a credit, anyone else hosts it.
  for r in
    select e.id eid, e.title, e.starts_at, l.id lid, l.category,
           (l.category = any(v_people) or coalesce(l.extra_categories, '{}') && v_people) person
    from events e
    join lateral (select l.* from listings l where l.status = 'approved' and ve_norm_name(l.name) = ve_norm_name(e.organizer_name)
                  order by (l.category = any(v_people)) desc, l.created_at limit 1) l on true
    where e.status = 'approved' and e.tenant_id = v_t and e.organizer_name is not null and length(ve_norm_name(e.organizer_name)) >= 4
  loop
    if r.person then
      insert into ve_person_credits (listing_id, kind, role, event_id, title, happened_on)
      select r.lid, 'event', 'Promoter', r.eid, r.title, (r.starts_at at time zone 'America/New_York')::date
      where not exists (select 1 from ve_person_credits c where c.listing_id = r.lid and c.event_id = r.eid);
      get diagnostics v_k = row_count; v_credits := v_credits + v_k;
    else
      update events set host_listing_id = r.lid where id = r.eid and host_listing_id is null;
      get diagnostics v_k = row_count; v_linked := v_linked + v_k;
    end if;
  end loop;

  -- A person credited as putting on an event (promoter, host, producer, organizer) is under People > Promoters too.
  update listings l set extra_categories = array_append(coalesce(l.extra_categories, '{}'), 'Promoters'), updated_at = now()
  where l.status = 'approved' and l.category = any(v_people) and l.category <> 'Promoters'
    and not ('Promoters' = any(coalesce(l.extra_categories, '{}')))
    and exists (select 1 from ve_person_credits c where c.listing_id = l.id and c.kind = 'event'
                and c.role ~* '(promot|host|produc|organi)');

  -- Places events were held, not yet linked to a listing. Bare addresses, online and "to be announced" are left out.
  insert into ve_event_leads (kind, norm, city_norm, name, city, state, country, address, hub, event_ids, event_count, first_at, last_at)
  select 'venue', v.norm, v.cnorm, v.name, v.city, v.state, v.country, v.address, ve_chapter_of(v.city, v.state),
         v.ids, v.n, v.first, v.last
  from (select ve_norm_name(location_name) norm, lower(btrim(coalesce(city, ''))) cnorm, min(btrim(location_name)) name,
               min(city) city, min(state) state, min(country) country, min(address) address,
               array_agg(id order by starts_at) ids, count(*)::int n, min(starts_at) first, max(starts_at) last
        from events
        where status = 'approved' and tenant_id = v_t and venue_listing_id is null and event_type <> 'virtual'
          and location_name is not null and length(ve_norm_name(location_name)) >= 4 and location_name !~ '^\s*[0-9]'
          and location_name !~* '^\s*(online|virtual|zoom|tba|tbd|to be (announced|determined)|private|secret|location)'
        group by 1, 2) v
  on conflict (kind, norm, city_norm) do update set event_ids = excluded.event_ids, event_count = excluded.event_count,
    first_at = excluded.first_at, last_at = excluded.last_at, hub = coalesce(ve_event_leads.hub, excluded.hub),
    address = coalesce(ve_event_leads.address, excluded.address), updated_at = now();

  -- Organizers not yet in the Directory.
  insert into ve_event_leads (kind, norm, city_norm, name, city, state, country, url, hub, event_ids, event_count, first_at, last_at)
  select 'organizer', o.norm, '', o.name, o.city, o.state, o.country, o.url, ve_chapter_of(o.city, o.state), o.ids, o.n, o.first, o.last
  from (select ve_norm_name(organizer_name) norm, min(btrim(organizer_name)) name, mode() within group (order by city) city,
               mode() within group (order by state) state, mode() within group (order by country) country, min(organizer_url) url,
               array_agg(id order by starts_at) ids, count(*)::int n, min(starts_at) first, max(starts_at) last
        from events e
        where status = 'approved' and tenant_id = v_t and organizer_name is not null and length(ve_norm_name(organizer_name)) >= 4
          and host_listing_id is null
          and not exists (select 1 from ve_person_credits c where c.event_id = e.id and c.role = 'Promoter')
        group by 1) o
  on conflict (kind, norm, city_norm) do update set event_ids = excluded.event_ids, event_count = excluded.event_count,
    first_at = excluded.first_at, last_at = excluded.last_at, url = coalesce(ve_event_leads.url, excluded.url), updated_at = now();

  -- A lead whose events all got a listing since (by the nightly venue sync or by hand) is linked.
  update ve_event_leads ld set status = 'linked', listing_id = coalesce(ld.listing_id, x.lid), updated_at = now()
  from (select ld2.id,
               bool_and((case when ld2.kind = 'venue' then e.venue_listing_id else e.host_listing_id end) is not null
                        or exists (select 1 from ve_person_credits c where c.event_id = e.id and c.role = 'Promoter')) all_linked,
               (array_agg(case when ld2.kind = 'venue' then e.venue_listing_id else e.host_listing_id end))[1] lid
        from ve_event_leads ld2 join events e on e.id = any(ld2.event_ids) where ld2.status = 'new' group by ld2.id) x
  where ld.id = x.id and x.all_linked;

  return jsonb_build_object('hosts_linked', v_linked, 'promoter_credits', v_credits,
    'venue_leads', (select count(*) from ve_event_leads where kind = 'venue' and status = 'new'),
    'organizer_leads', (select count(*) from ve_event_leads where kind = 'organizer' and status = 'new'));
end $$;
revoke all on function public.ve_event_leads_refresh() from public, anon, authenticated;

-- Add a lead to the Directory from what its events say (no Google), linking its events. Categories: Event Venues for a venue;
-- Groups, Nonprofits, Event Venues or Promoters (People) for an organizer. Live at once; the team checks it on its page.
create or replace function public.ve_event_lead_add(p_lead uuid, p_category text, p_member uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ld record; v_slug text; v_base text; v_id uuid; v_person boolean := p_category = 'Promoters'; v_desc text; v_k int;
begin
  select * into ld from ve_event_leads where id = p_lead for update;
  if ld is null then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if ld.status <> 'new' then return jsonb_build_object('ok', false, 'why', 'decided'); end if;
  if p_category not in ('Event Venues', 'Groups', 'Nonprofits', 'Promoters') then return jsonb_build_object('ok', false, 'why', 'bad_category'); end if;
  if ld.kind = 'venue' and p_category <> 'Event Venues' then return jsonb_build_object('ok', false, 'why', 'bad_category'); end if;
  v_base := trim(both '-' from regexp_replace(lower(ld.name), '[^a-z0-9]+', '-', 'g'));
  v_slug := case when not exists (select 1 from listings where slug = v_base) then v_base
    when ld.city is not null and not exists (select 1 from listings where slug = v_base || '-' || trim(both '-' from regexp_replace(lower(ld.city), '[^a-z0-9]+', '-', 'g')))
      then v_base || '-' || trim(both '-' from regexp_replace(lower(ld.city), '[^a-z0-9]+', '-', 'g'))
    else v_base || '-' || left(md5(ld.id::text), 4) end;
  v_desc := case when ld.kind = 'venue' then 'A venue in ' || coalesce(ld.city, 'the area') || ' where Vegan events were held: ' || ld.event_count || ' on our calendar.'
    when v_person then 'Puts on Vegan events' || coalesce(' in ' || ld.city, '') || ': ' || ld.event_count || ' on our calendar.'
    else 'Puts on Vegan events' || coalesce(' in ' || ld.city, '') || ': ' || ld.event_count || ' on our calendar.' end;
  insert into listings (name, slug, category, specialty, description, status, website, location, address_street, address_city,
      address_state, address_country, business_status, vegan_status, initials, crawl_source, communities, details, updated_at)
  values (ld.name, v_slug, p_category, '', v_desc, 'approved', coalesce(ld.url, ''),
    case when v_person then null else nullif(concat_ws(', ', ld.city, ld.state), '') end,
    case when ld.kind = 'venue' then ld.address end, case when v_person then null else ld.city end,
    case when v_person then null else ld.state end, case when v_person then null else ld.country end,
    'OPERATIONAL', null, upper(left(regexp_replace(ld.name, '[^A-Za-z]', '', 'g'), 2)), 'event-lead',
    case when v_person then array['all'] when ld.hub is not null then array[ld.hub] else '{}'::text[] end,
    jsonb_build_object('event_lead', jsonb_build_object('lead', ld.id, 'at', now(), 'events', ld.event_count),
      'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
        'text', 'Added from our events calendar (Sean, 2026-11-02): ' || ld.event_count || ' events name it. Check its details.'))),
    now())
  returning id into v_id;
  if ld.kind = 'venue' then
    update events set venue_listing_id = v_id where id = any(ld.event_ids) and venue_listing_id is null;
  elsif v_person then
    insert into ve_person_credits (listing_id, kind, role, event_id, title, happened_on)
    select v_id, 'event', 'Promoter', e.id, e.title, (e.starts_at at time zone 'America/New_York')::date from events e where e.id = any(ld.event_ids);
  else
    update events set host_listing_id = v_id where id = any(ld.event_ids) and host_listing_id is null;
  end if;
  get diagnostics v_k = row_count;
  update ve_event_leads set status = 'listed', listing_id = v_id, decided_by = p_member, decided_at = now(), updated_at = now() where id = ld.id;
  perform ve_event_venues_sync();
  return jsonb_build_object('ok', true, 'id', v_id, 'slug', v_slug, 'events', v_k);
end $$;
revoke all on function public.ve_event_lead_add(uuid, text, uuid) from public, anon, authenticated;

-- Link a lead to a listing that is already in the Directory.
create or replace function public.ve_event_lead_link(p_lead uuid, p_listing uuid, p_member uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ld record; l record; v_k int;
  v_people text[] := array['Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders','Promoters'];
begin
  select * into ld from ve_event_leads where id = p_lead for update;
  select id, name, category, extra_categories into l from listings where id = p_listing and status = 'approved';
  if ld is null or l is null then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if ld.kind = 'venue' then
    update events set venue_listing_id = l.id where id = any(ld.event_ids) and venue_listing_id is null;
  elsif l.category = any(v_people) then
    insert into ve_person_credits (listing_id, kind, role, event_id, title, happened_on)
    select l.id, 'event', 'Promoter', e.id, e.title, (e.starts_at at time zone 'America/New_York')::date from events e
    where e.id = any(ld.event_ids) and not exists (select 1 from ve_person_credits c where c.listing_id = l.id and c.event_id = e.id);
    if l.category <> 'Promoters' and not ('Promoters' = any(coalesce(l.extra_categories, '{}'))) then
      update listings set extra_categories = array_append(coalesce(extra_categories, '{}'), 'Promoters') where id = l.id;
    end if;
  else
    update events set host_listing_id = l.id where id = any(ld.event_ids) and host_listing_id is null;
  end if;
  get diagnostics v_k = row_count;
  update ve_event_leads set status = 'linked', listing_id = l.id, decided_by = p_member, decided_at = now(), updated_at = now() where id = ld.id;
  perform ve_event_venues_sync();
  return jsonb_build_object('ok', true, 'events', v_k);
end $$;
revoke all on function public.ve_event_lead_link(uuid, uuid, uuid) from public, anon, authenticated;

-- Ella Magers puts on events (Sean, 2026-11-02: "I know Ella Magers does a lot of events... a new tag in addition to her other tags").
update public.listings set extra_categories = array_append(coalesce(extra_categories, '{}'), 'Promoters'), updated_at = now()
where status = 'approved' and lower(name) = 'ella magers' and not ('Promoters' = any(coalesce(extra_categories, '{}')));

-- The weekly check runs every hour on what is due (each upcoming event about once a week), and refreshes the leads.
select cron.unschedule('ve-event-check') where exists (select 1 from cron.job where jobname = 've-event-check');
select cron.schedule('ve-event-check', '23 * * * *', $c$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-event-check',
    body := '{"action":"sweep","limit":12}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from lesaruss_secrets where key = 'CRON_SECRET')),
    timeout_milliseconds := 150000);
$c$);

select public.ve_event_leads_refresh();
