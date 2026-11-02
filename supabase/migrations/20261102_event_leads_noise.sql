-- Leads that are not places (2026-11-02): Partiful shows only a neighborhood until someone RSVPs, so a lead whose events are all
-- Partiful events with no street address is a neighborhood; "address shared with those registered" and train stations are not
-- venues either. These are set aside with why, on every refresh, so Depot > Events > From our events lists real places.
create or replace function public.ve_event_leads_tidy() returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  update ve_event_leads ld set status = 'set_aside', updated_at = now(), decided_at = now(),
    note = case when ld.name ~* '(address|location) (shared|sent|given|revealed)|after (you )?(register|rsvp)' then 'Not a place: the address goes only to those who register.'
                when ld.name ~* '\m(station|tube|subway|metro stop)\M' then 'A station, where the group meets before going somewhere.'
                else 'A neighborhood: Partiful shows the place only after an RSVP.' end
  where ld.status = 'new' and ld.kind = 'venue'
    and (ld.name ~* '(address|location) (shared|sent|given|revealed)|after (you )?(register|rsvp)'
      or ld.name ~* '\m(station|tube|subway|metro stop)\M'
      or (ld.address is null and not exists (select 1 from events e where e.id = any(ld.event_ids) and coalesce(e.ticket_url, '') !~* 'partiful\.com')));
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke all on function public.ve_event_leads_tidy() from public, anon, authenticated;
-- The refresh (hourly, after the weekly check) tidies as it goes.
do $d$
declare d text := pg_get_functiondef('public.ve_event_leads_refresh()'::regprocedure);
begin
  if position('ve_event_leads_tidy' in d) = 0 then
    execute replace(d, $x$'organizer_leads', (select count(*) from ve_event_leads where kind = 'organizer' and status = 'new'));$x$,
      $x$'organizer_leads', (select count(*) from ve_event_leads where kind = 'organizer' and status = 'new'), 'tidied', ve_event_leads_tidy());$x$);
  end if;
end $d$;
select public.ve_event_leads_refresh();
