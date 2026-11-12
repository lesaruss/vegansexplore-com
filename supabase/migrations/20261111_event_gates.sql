-- The event gates (Sean, 2026-11-11: "I am not going through all 122 of these... why can't we just approve them? Can we put
-- in some gates?"; "If they are still active, if they have a link to register, it hasn't been canceled, it's not duplicated,
-- I would say we can roll with it"; "if they are two duplicate events, you can flag those and I can choose between them").
--
-- An event waiting for approval goes live on its own once ve-event-check's `gate` action has:
--   1. found no duplicate (ve_event_match): the same day, and the same link, or a near-same name in the same city or by the
--      same organizer. The same organizer twice (the crawl finding one event on Eventbrite and on its own site) is folded into
--      the one we keep: the live one first, else the organizer's own site over Eventbrite, Meetup and the like. Two different
--      organizers showing one event (the official festival and a Meetup group going to it) wait for Sean, side by side, with the
--      official one recommended (gate_status 'duplicate', dupe_of).
--   2. read its official page: still there, still this event, not cancelled, not postponed (ve_event_checks row as always).
-- Anything the gates cannot settle (an unreadable page, postponed) waits with gate_status 'held' and gate_note saying why.
-- Members' own submissions are not gated: they still wait for a person (Logan's default, Sean's to change).

create extension if not exists pg_trgm;

alter table events add column if not exists gate_status text;   -- null (not gated yet) | passed | held | duplicate
alter table events add column if not exists gate_note text;
alter table events add column if not exists gated_at timestamptz;
alter table events add column if not exists dupe_of uuid references events(id) on delete set null;
create index if not exists events_gate_pending on events (tenant_id, status, gate_status) where status = 'pending';

-- Keys that make the same event match across sources.
create or replace function ve_event_title_key(t text) returns text language sql immutable as $$
  select btrim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    replace(lower(coalesce(t, '')), '&', ' and '),
    'veg(an)?\s+fest', 'vegfest', 'g'),
    '\m(19|20)\d\d\M|\m\d+(st|nd|rd|th)\M|\m(annual|edition|the)\M', ' ', 'g'),
    '\((january|february|march|april|may|june|july|august|september|october|november|december)\)', ' ', 'g'),
    '[^a-z0-9]+', ' ', 'g'),
    '\s+', ' ', 'g'))
$$;

create or replace function ve_event_org_key(t text) returns text language sql immutable as $$
  select nullif(btrim(regexp_replace(regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]+', ' ', 'g'),
    '\m(inc|incorporated|llc|ltd|co|the|org)\M', ' ', 'g')), '')
$$;

create or replace function ve_event_url_key(u text) returns text language sql immutable as $$
  select nullif(regexp_replace(regexp_replace(split_part(split_part(lower(coalesce(u, '')), '#', 1), '?', 1),
    '^https?://(www\.)?', ''), '/+$', ''), '')
$$;

-- A link on a ticketing or group site, not the organizer's own page.
create or replace function ve_event_reposted(u text) returns boolean language sql immutable as $$
  select coalesce(u, '') ~* '://([a-z0-9-]+\.)*(eventbrite\.[a-z.]+|meetup\.com|partiful\.com|eventeny\.com|humanitix\.com|donorbox\.org|allevents\.in|facebook\.com|instagram\.com|blackthorn\.io|neoncrm\.com|ticketleap\.com|universe\.com|lu\.ma)'
$$;

-- Events that look like the same one as p_id: same local day, then the same link, or a near-same name in the same city or
-- by the same organizer. same_org says whether the organizers are one and the same.
create or replace function ve_event_match(p_id uuid)
returns table (other_id uuid, other_status text, same_org boolean, why text)
language sql stable security definer set search_path = public as $$
  with me as (select * from events where id = p_id)
  select o.id, o.status,
    (ve_event_org_key(o.organizer_name) is not null and ve_event_org_key(me.organizer_name) is not null
       and (ve_event_org_key(o.organizer_name) = ve_event_org_key(me.organizer_name)
         or position(ve_event_org_key(o.organizer_name) in ve_event_org_key(me.organizer_name)) > 0
         or position(ve_event_org_key(me.organizer_name) in ve_event_org_key(o.organizer_name)) > 0))
    or (ve_event_url_key(o.ticket_url) = ve_event_url_key(me.ticket_url)
       and (o.organizer_name is null or me.organizer_name is null)) as same_org,
    case when ve_event_url_key(o.ticket_url) = ve_event_url_key(me.ticket_url) then 'same link' else 'same name and day' end
  from me join events o on o.tenant_id = me.tenant_id and o.id <> me.id and o.status in ('pending', 'approved')
    and coalesce(o.listing_kind, 'event') = coalesce(me.listing_kind, 'event')
    and (o.starts_at at time zone coalesce(nullif(o.timezone, ''), 'UTC'))::date
      = (me.starts_at at time zone coalesce(nullif(me.timezone, ''), 'UTC'))::date
  where ve_event_url_key(o.ticket_url) = ve_event_url_key(me.ticket_url)
     or (similarity(ve_event_title_key(o.title), ve_event_title_key(me.title)) >= 0.5
         and ((nullif(lower(btrim(o.city)), '') = nullif(lower(btrim(me.city)), ''))
           or (ve_event_org_key(o.organizer_name) = ve_event_org_key(me.organizer_name))))
$$;

-- The one to keep among an event and its matches: the live one, else the organizer's own page, else one tied to a
-- Directory listing, else the first one in.
create or replace function ve_event_official_rank(e events) returns int language sql immutable as $$
  select (case when ve_event_reposted(e.ticket_url) then 10 else 0 end) + (case when e.host_listing_id is null then 1 else 0 end)
$$;
create or replace function ve_event_keep_rank(e events) returns int language sql immutable as $$
  select (case when e.status = 'approved' then 0 else 100 end) + ve_event_official_rank(e)
$$;

-- Intake: refuse a near-same event by the same organizer on the same day (the crawl finding it a second time), not only the
-- exact name. Different organizers still come in, and the gate puts the pair in front of Sean.
create or replace function ve_event_intake_dupe(p_tenant uuid, p_title text, p_starts timestamptz, p_tz text, p_city text, p_link text, p_org text)
returns uuid language sql stable security definer set search_path = public as $$
  select o.id from events o
  where o.tenant_id = p_tenant and o.status in ('pending', 'approved')
    and (o.starts_at at time zone coalesce(nullif(o.timezone, ''), 'UTC'))::date = (p_starts at time zone coalesce(nullif(p_tz, ''), 'UTC'))::date
    and (ve_event_url_key(o.ticket_url) = ve_event_url_key(p_link)
      or (similarity(ve_event_title_key(o.title), ve_event_title_key(p_title)) >= 0.5
          and ve_event_org_key(o.organizer_name) is not null and ve_event_org_key(p_org) is not null
          and (ve_event_org_key(o.organizer_name) = ve_event_org_key(p_org)
            or position(ve_event_org_key(o.organizer_name) in ve_event_org_key(p_org)) > 0
            or position(ve_event_org_key(p_org) in ve_event_org_key(o.organizer_name)) > 0)))
  order by (o.status = 'approved') desc, o.created_at limit 1
$$;

-- The gate's decision on one waiting event before its page is read:
--   {action: 'fold', into}      same organizer, already here: turned down as "Duplicate of <into>"
--   {action: 'flag', with, keep} different organizers: waits for Sean, `keep` the recommended one
--   {action: 'check'}           no duplicate: read the page
create or replace function ve_event_gate_dupes(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me events; m record; keep events; v_flag uuid;
begin
  select * into me from events where id = p_id;
  if me.id is null or me.status <> 'pending' then return jsonb_build_object('action', 'skip'); end if;
  for m in select x.*, e as ev from ve_event_match(p_id) x join events e on e.id = x.other_id loop
    if m.same_org then
      -- Keep the best of the two; if that is this one, the other is folded in when its own turn comes.
      if ve_event_keep_rank(m.ev) < ve_event_keep_rank(me)
         or (ve_event_keep_rank(m.ev) = ve_event_keep_rank(me) and (m.ev).created_at < me.created_at) then
        return jsonb_build_object('action', 'fold', 'into', m.other_id, 'why', m.why);
      end if;
    elsif v_flag is null then
      v_flag := m.other_id;
      -- Recommend the official organization's own listing; when both look alike, the one already live.
      keep := case when ve_event_official_rank(m.ev) < ve_event_official_rank(me) then m.ev
                   when ve_event_official_rank(me) < ve_event_official_rank(m.ev) then me
                   when m.other_status = 'approved' then m.ev else me end;
    end if;
  end loop;
  if v_flag is not null then return jsonb_build_object('action', 'flag', 'with', v_flag, 'keep', keep.id); end if;
  return jsonb_build_object('action', 'check');
end $$;

-- Wire the intake to the wider duplicate check.
do $$
declare src text;
begin
  select pg_get_functiondef('public.ve_event_intake'::regproc) into src;
  if position('ve_event_intake_dupe' in src) = 0 then
    src := replace(src,
      E'  if v_dupe is null and v_host is not null and (select count(*)',
      E'  if v_dupe is null and v_kind = ''event'' then\n    v_dupe := ve_event_intake_dupe(v_tenant, v_title, v_starts, nullif(p_event->>''timezone'', ''''), p_event->>''city'', v_link, v_org);\n  end if;\n  if v_dupe is null and v_host is not null and (select count(*)');
    if position('ve_event_intake_dupe' in src) = 0 then raise exception 've_event_intake: anchor not found'; end if;
    execute src;
  end if;
end $$;

-- ---- Second pass, same day (after the dry run on the live queue) ----
-- One organizer name inside another was too loose ("DC Vegan" the restaurant inside "Veg Society of DC Vegan Meetup"): the
-- same organizer is the same name, or one that starts with the other ("Vegan Street Fair" and "Vegan Street Fair (VSF
-- Connects Incorporated)"). With no organizer named on one side, the same link or the same website (not a ticketing or
-- group site) counts as the same organizer.
create or replace function ve_event_same_org(a_org text, b_org text, a_url text, b_url text) returns boolean language sql immutable as $$
  select case
    when ve_event_org_key(a_org) is not null and ve_event_org_key(b_org) is not null then
      ve_event_org_key(a_org) = ve_event_org_key(b_org)
      or ve_event_org_key(a_org) like ve_event_org_key(b_org) || ' %'
      or ve_event_org_key(b_org) like ve_event_org_key(a_org) || ' %'
    else ve_event_url_key(a_url) = ve_event_url_key(b_url)
      or (not ve_event_reposted(a_url) and not ve_event_reposted(b_url)
          and split_part(ve_event_url_key(a_url), '/', 1) = split_part(ve_event_url_key(b_url), '/', 1))
  end
$$;

create or replace function ve_event_match(p_id uuid)
returns table (other_id uuid, other_status text, same_org boolean, why text)
language sql stable security definer set search_path = public as $$
  with me as (select * from events where id = p_id)
  select o.id, o.status, ve_event_same_org(o.organizer_name, me.organizer_name, o.ticket_url, me.ticket_url),
    case when ve_event_url_key(o.ticket_url) = ve_event_url_key(me.ticket_url) then 'same link' else 'same name and day' end
  from me join events o on o.tenant_id = me.tenant_id and o.id <> me.id and o.status in ('pending', 'approved')
    and coalesce(o.listing_kind, 'event') = coalesce(me.listing_kind, 'event')
    and (o.starts_at at time zone coalesce(nullif(o.timezone, ''), 'UTC'))::date
      = (me.starts_at at time zone coalesce(nullif(me.timezone, ''), 'UTC'))::date
  where ve_event_url_key(o.ticket_url) = ve_event_url_key(me.ticket_url)
     or (similarity(ve_event_title_key(o.title), ve_event_title_key(me.title)) >= 0.5
         and ((nullif(lower(btrim(o.city)), '') = nullif(lower(btrim(me.city)), ''))
           or ve_event_same_org(o.organizer_name, me.organizer_name, o.ticket_url, me.ticket_url)))
$$;

create or replace function ve_event_intake_dupe(p_tenant uuid, p_title text, p_starts timestamptz, p_tz text, p_city text, p_link text, p_org text)
returns uuid language sql stable security definer set search_path = public as $$
  select o.id from events o
  where o.tenant_id = p_tenant and o.status in ('pending', 'approved')
    and (o.starts_at at time zone coalesce(nullif(o.timezone, ''), 'UTC'))::date = (p_starts at time zone coalesce(nullif(p_tz, ''), 'UTC'))::date
    and (ve_event_url_key(o.ticket_url) = ve_event_url_key(p_link)
      or (similarity(ve_event_title_key(o.title), ve_event_title_key(p_title)) >= 0.5
          and ve_event_same_org(o.organizer_name, p_org, o.ticket_url, p_link)))
  order by (o.status = 'approved') desc, o.created_at limit 1
$$;

-- Live duplicates (Sean: "We had that with the Georgia VegFest. We had two listings. I just never got around to having you
-- remove them"). Two upcoming live events that are one event by one organizer: the one with more RSVPs, an organizer
-- named, the organizer's own page, then the first in stays; the other is turned down as "Duplicate of <id>" (its RSVPs, if
-- any, move to the one kept). Two organizers showing one event are flagged for Sean (gate_status 'duplicate' on the one we
-- would take down), and both stay live until he picks. Runs with the gate.
create or replace function ve_event_live_dupes() returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; v_folded int := 0; v_flagged int := 0; keep uuid; drop_ uuid;
begin
  for r in
    select e.id a, o.id b, m.same_org,
      (coalesce(e.rsvp_count, 0) * 1000 - (e.organizer_name is null)::int * 100 - ve_event_official_rank(e) * 5 - extract(epoch from e.created_at) / 1e10) sa,
      (coalesce(o.rsvp_count, 0) * 1000 - (o.organizer_name is null)::int * 100 - ve_event_official_rank(o) * 5 - extract(epoch from o.created_at) / 1e10) sb,
      ve_event_official_rank(e) ra, ve_event_official_rank(o) rb
    from events e cross join lateral ve_event_match(e.id) m join events o on o.id = m.other_id
    where e.tenant_id = '00000000-0000-4000-a000-000000000002' and e.status = 'approved' and o.status = 'approved'
      and e.id < o.id and e.starts_at > now() - interval '1 day'
  loop
    if not exists (select 1 from events where id in (r.a, r.b) and status = 'approved' having count(*) = 2) then continue; end if;
    if r.same_org then
      if r.sa >= r.sb then keep := r.a; drop_ := r.b; else keep := r.b; drop_ := r.a; end if;
      update event_rsvps set event_id = keep where event_id = drop_
        and not exists (select 1 from event_rsvps x where x.event_id = keep and x.member_id = event_rsvps.member_id);
      update events set status = 'rejected', rejection_reason = 'Duplicate of ' || keep, dupe_of = keep, gate_status = 'passed',
        gate_note = 'The same event by the same organizer was already live; folded into it.', gated_at = now(), reviewed_at = now()
        where id = drop_;
      v_folded := v_folded + 1;
    else
      -- Recommend keeping the organizer's own listing; flag the other.
      if r.ra <= r.rb then keep := r.a; drop_ := r.b; else keep := r.b; drop_ := r.a; end if;
      update events set gate_status = 'duplicate', dupe_of = keep, gated_at = now(),
        gate_note = 'Live, and another organization lists the same event. Pick the one to keep.'
        where id = drop_ and gate_status is distinct from 'duplicate';
      v_flagged := v_flagged + 1;
    end if;
  end loop;
  return jsonb_build_object('folded', v_folded, 'flagged', v_flagged);
end $$;

-- ---- Third pass: "Not the same event" ----
-- When Sean says a flagged pair are two different events, each remembers the other (not_dupes) and is never matched with it
-- again; the waiting one goes back through the gates (its page is read) and the live one keeps going.
alter table events add column if not exists not_dupes uuid[] not null default '{}';

create or replace function ve_event_match(p_id uuid)
returns table (other_id uuid, other_status text, same_org boolean, why text)
language sql stable security definer set search_path = public as $$
  with me as (select * from events where id = p_id)
  select o.id, o.status, ve_event_same_org(o.organizer_name, me.organizer_name, o.ticket_url, me.ticket_url),
    case when ve_event_url_key(o.ticket_url) = ve_event_url_key(me.ticket_url) then 'same link' else 'same name and day' end
  from me join events o on o.tenant_id = me.tenant_id and o.id <> me.id and o.status in ('pending', 'approved')
    and coalesce(o.listing_kind, 'event') = coalesce(me.listing_kind, 'event')
    and (o.starts_at at time zone coalesce(nullif(o.timezone, ''), 'UTC'))::date
      = (me.starts_at at time zone coalesce(nullif(me.timezone, ''), 'UTC'))::date
    and not (o.id = any(me.not_dupes)) and not (me.id = any(o.not_dupes))
  where ve_event_url_key(o.ticket_url) = ve_event_url_key(me.ticket_url)
     or (similarity(ve_event_title_key(o.title), ve_event_title_key(me.title)) >= 0.5
         and ((nullif(lower(btrim(o.city)), '') = nullif(lower(btrim(me.city)), ''))
           or ve_event_same_org(o.organizer_name, me.organizer_name, o.ticket_url, me.ticket_url)))
$$;
