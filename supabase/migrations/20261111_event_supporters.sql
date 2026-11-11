-- Supporting organizations (Sean, 2026-11-11): "If we have an organization that is also hosting their meetup, let's put it
-- underneath that listing. You know, we don't have to lose it completely, but we can show that these are the organizations
-- that are supporting this event. And then they can see, click on it and see their listing. So somebody might want to register
-- through DC Meetup... going is going, right? And it's almost like a referral." "Unless Polar Springs is a sponsor... but
-- we're not there yet" (a paid promotion hiding supporters is not built).
--
-- Two organizations listing one event (the gates' "two organizers" pair, 20261111_event_gates.sql) no longer wait for Sean:
-- the official one stays the event, the other becomes a supporter of it: status 'supporting', dupe_of = the event. A supporter
-- row is off the calendar (the calendar reads approved only) but is shown on the event's page under the host (its logo links to
-- its Directory page, and its own link is "Register with them"), and stays on its own group's Directory page with its own link.
-- Depot > Events > Supporting can swap which one is the main event or say they are two different events.

-- Anyone can read a supporter row, as they can a live event.
drop policy if exists "Public can view supporting events" on events;
create policy "Public can view supporting events" on events for select to anon, authenticated using (status = 'supporting');

-- Put p_sup under p_main: its RSVPs move to the main event, and anything already under p_sup moves under p_main too.
create or replace function ve_event_attach_supporter(p_main uuid, p_sup uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_main = p_sup then return; end if;
  update event_rsvps set event_id = p_main where event_id = p_sup
    and not exists (select 1 from event_rsvps x where x.event_id = p_main and x.member_id = event_rsvps.member_id);
  update events set dupe_of = p_main where dupe_of = p_sup and status = 'supporting';
  update events set status = 'supporting', dupe_of = p_main, gate_status = 'passed', gated_at = now(), reviewed_at = coalesce(reviewed_at, now()),
    gate_note = 'Another organization lists the same event; shown under it as a supporting organization, with its own link.'
    where id = p_sup;
end $$;

-- Make a supporter the main event: it takes the main event's place (live or waiting), the old main goes under it.
create or replace function ve_event_support_swap(p_sup uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s events; m events;
begin
  select * into s from events where id = p_sup;
  if s.id is null or s.status <> 'supporting' or s.dupe_of is null then return jsonb_build_object('ok', false, 'why', 'not_a_supporter'); end if;
  select * into m from events where id = s.dupe_of;
  update events set status = m.status, dupe_of = null, gate_status = 'passed', gated_at = now(), gate_note = 'Made the main event by the team.' where id = s.id;
  perform ve_event_attach_supporter(s.id, m.id);
  return jsonb_build_object('ok', true, 'main', s.id);
end $$;

-- Two different events after all: the supporter goes back through the gates on its own, and the pair is never matched again.
create or replace function ve_event_support_release(p_sup uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s events;
begin
  select * into s from events where id = p_sup;
  if s.id is null or s.status <> 'supporting' then return jsonb_build_object('ok', false, 'why', 'not_a_supporter'); end if;
  update events set not_dupes = array(select distinct unnest(not_dupes || s.id)) where id = s.dupe_of;
  update events set status = 'pending', dupe_of = null, gate_status = null, gate_note = null,
    not_dupes = array(select distinct unnest(not_dupes || s.dupe_of)) where id = s.id;
  return jsonb_build_object('ok', true);
end $$;

-- The gate: two organizations -> 'support' (was 'flag'), keep = the official one.
create or replace function ve_event_gate_dupes(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me events; m record; keep events; v_with uuid;
begin
  select * into me from events where id = p_id;
  if me.id is null or me.status <> 'pending' then return jsonb_build_object('action', 'skip'); end if;
  for m in select x.*, e as ev from ve_event_match(p_id) x join events e on e.id = x.other_id loop
    if m.same_org then
      if ve_event_keep_rank(m.ev) < ve_event_keep_rank(me)
         or (ve_event_keep_rank(m.ev) = ve_event_keep_rank(me) and (m.ev).created_at < me.created_at) then
        return jsonb_build_object('action', 'fold', 'into', m.other_id, 'why', m.why);
      end if;
    elsif v_with is null then
      v_with := m.other_id;
      keep := case when ve_event_official_rank(m.ev) < ve_event_official_rank(me) then m.ev
                   when ve_event_official_rank(me) < ve_event_official_rank(m.ev) then me
                   when m.other_status = 'approved' then m.ev else me end;
    end if;
  end loop;
  if v_with is not null then return jsonb_build_object('action', 'support', 'with', v_with, 'keep', keep.id); end if;
  return jsonb_build_object('action', 'check');
end $$;

-- Live pairs: two organizations -> the unofficial one goes under the official one (was: flagged for Sean).
create or replace function ve_event_live_dupes() returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; v_folded int := 0; v_supported int := 0; keep uuid; drop_ uuid;
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
      if r.ra < r.rb or (r.ra = r.rb and r.sa >= r.sb) then keep := r.a; drop_ := r.b; else keep := r.b; drop_ := r.a; end if;
      perform ve_event_attach_supporter(keep, drop_);
      v_supported := v_supported + 1;
    end if;
  end loop;
  return jsonb_build_object('folded', v_folded, 'supported', v_supported);
end $$;

-- The two pairs flagged before this: back through the gates (the pending one) and the live sweep (the live pair).
update events set gate_status = null, gate_note = null, dupe_of = null where gate_status = 'duplicate';
