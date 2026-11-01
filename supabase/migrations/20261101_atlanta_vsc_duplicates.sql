-- Sean, 2026-11-01: Vegan Social Clubs (Atlanta) posts the same weekly Wednesday meetup on Meetup twice, "The Vegan Social of
-- Atlanta" (5 PM, no place, no description) and "Vegan and Friends" (6 PM, Atlantucky Brewing). Vegan and Friends is the official
-- one; the other is turned down as a duplicate wherever both fall on the same day (Eastern). Nothing is deleted.
update events a set status = 'rejected', reviewed_at = now(),
  rejection_reason = 'Duplicate of Vegan and Friends the same day (Sean, 2026-11-01)'
where a.status = 'approved' and a.title = 'The Vegan Social of Atlanta'
  and a.host_listing_id = (select id from listings where slug = 'vegan-social-clubs-atlanta')
  and exists (select 1 from events b where b.host_listing_id = a.host_listing_id and b.status = 'approved'
    and b.title = 'Vegan and Friends'
    and (b.starts_at at time zone 'America/New_York')::date = (a.starts_at at time zone 'America/New_York')::date);

-- Keep them from coming back: ve_event_intake treats an event turned down as a duplicate ("Duplicate of ...") as already listed
-- that day, and refuses a title its host has had turned down as a duplicate three times or more (a recurring copy, new dates too).
do $$
declare d text := pg_get_functiondef('ve_event_intake'::regproc);
begin
  d := replace(d,
    $a$and (starts_at at time zone 'UTC')::date = (v_starts at time zone 'UTC')::date and status <> 'rejected' limit 1;$a$,
    $b$and (starts_at at time zone 'UTC')::date = (v_starts at time zone 'UTC')::date
    and (status <> 'rejected' or rejection_reason like 'Duplicate of%') limit 1;
  if v_dupe is null and v_host is not null and (select count(*) from events where host_listing_id = v_host
      and lower(title) = lower(v_title) and status = 'rejected' and rejection_reason like 'Duplicate of%') >= 3 then
    return jsonb_build_object('ok', false, 'why', 'known_duplicate');
  end if;$b$);
  if position('known_duplicate' in d) = 0 then raise exception 'intake anchor not found'; end if;
  execute d;
end $$;
