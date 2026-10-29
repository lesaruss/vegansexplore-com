-- Groups in the Community directory (Sean, 2026-10-29: "the same way we have nonprofit rescue sanctuaries... when you click on it,
-- all of their events will be tied to their profile, and their profile will be tied to all their events").
-- A group is a listing (category Groups, Community section, no How Vegan). An event names the listing that hosts it
-- (events.host_listing_id); a crawl source can belong to a group (ve_event_sources.listing_id), and every event the crawl saves
-- from that source is tied to the group without anyone picking it.

alter table public.events add column if not exists host_listing_id uuid references public.listings(id) on delete set null;
create index if not exists events_host_listing_idx on public.events (host_listing_id, starts_at) where host_listing_id is not null;

alter table public.ve_event_sources add column if not exists listing_id uuid references public.listings(id) on delete set null;
create index if not exists ve_event_sources_listing_idx on public.ve_event_sources (listing_id) where listing_id is not null;

-- ve_event_intake: the host is the event's own host_listing_id, else its source's group. A duplicate the crawl finds again from a
-- group's own page gets that group as its host when it had none.
create or replace function public.ve_event_intake(p_event jsonb, p_source text default 'crawl', p_source_id uuid default null,
  p_author uuid default null, p_approve boolean default false)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  v_title text := nullif(btrim(p_event->>'title'), '');
  v_link text := nullif(btrim(coalesce(p_event->>'ticket_url', p_event->>'link')), '');
  v_starts timestamptz;
  v_ends timestamptz;
  v_cat text := lower(coalesce(nullif(p_event->>'category', ''), 'other'));
  v_author uuid := p_author;
  v_host uuid;
  v_dupe uuid;
  v_id uuid;
begin
  if v_title is null then return jsonb_build_object('ok', false, 'why', 'no_title'); end if;
  if v_link is null or v_link !~* '^https?://' then return jsonb_build_object('ok', false, 'why', 'no_official_link'); end if;
  begin v_starts := (p_event->>'starts_at')::timestamptz; exception when others then v_starts := null; end;
  if v_starts is null then return jsonb_build_object('ok', false, 'why', 'no_date'); end if;
  begin v_ends := nullif(p_event->>'ends_at', '')::timestamptz; exception when others then v_ends := null; end;
  if coalesce(v_ends, v_starts) < now() - interval '1 day' then return jsonb_build_object('ok', false, 'why', 'already_over'); end if;
  if v_cat not in ('general','food','activism','health','social','market','festival','workshop','meetup','fundraiser','film','other') then v_cat := 'other'; end if;
  begin v_host := nullif(p_event->>'host_listing_id', '')::uuid; exception when others then v_host := null; end;
  if v_host is not null and not exists (select 1 from listings where id = v_host) then v_host := null; end if;
  if v_host is null and p_source_id is not null then select listing_id into v_host from ve_event_sources where id = p_source_id; end if;
  select id into v_dupe from events where lower(title) = lower(v_title) and (starts_at at time zone 'UTC')::date = (v_starts at time zone 'UTC')::date and status <> 'rejected' limit 1;
  if v_dupe is not null then
    if v_host is not null then update events set host_listing_id = v_host where id = v_dupe and host_listing_id is null; end if;
    return jsonb_build_object('ok', false, 'why', 'already_listed', 'id', v_dupe);
  end if;
  if v_author is null then
    select (value::jsonb->>'member_id')::uuid into v_author from lesaruss_dispatch_settings where key = 'pulse_auto';
  end if;
  insert into events (tenant_id, author_id, title, description, event_type, starts_at, ends_at, timezone, location_name, address,
    city, state, country, continent, virtual_url, category, ticket_url, price_cents, status, source, source_url, source_id, flyer_path,
    reviewed_by, reviewed_at, time_set, host_listing_id)
  values ('00000000-0000-4000-a000-000000000002', v_author, left(v_title, 200), coalesce(left(nullif(btrim(p_event->>'description'), ''), 2000), ''),
    case when p_event->>'event_type' in ('in_person','virtual','hybrid') then p_event->>'event_type' else 'in_person' end,
    v_starts, v_ends, coalesce(nullif(p_event->>'timezone', ''), 'America/New_York'),
    nullif(btrim(p_event->>'location_name'), ''), nullif(btrim(p_event->>'address'), ''),
    nullif(btrim(p_event->>'city'), ''), nullif(case when length(btrim(p_event->>'state')) <= 3 then upper(btrim(p_event->>'state')) else btrim(p_event->>'state') end, ''), nullif(upper(btrim(p_event->>'country')), ''),
    nullif(btrim(p_event->>'continent'), ''), nullif(btrim(p_event->>'virtual_url'), ''), v_cat, v_link,
    nullif(p_event->>'price_cents', '')::integer,
    case when p_approve then 'approved' else 'pending' end, p_source,
    coalesce(nullif(btrim(p_event->>'source_url'), ''), v_link), p_source_id, nullif(p_event->>'flyer_path', ''),
    case when p_approve then p_author end, case when p_approve then now() end,
    coalesce((p_event->>'time_set')::boolean, true), v_host)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$function$;
