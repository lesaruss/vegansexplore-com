-- ve-community-directory (Logan, 2026-11-08): New places clear-out. Set aside every undecided quarantined backlog row in
-- Not found (783), Closed (156), Not enough to check (178), Already listed (60), and A person / Not a restaurant rows whose
-- bio and name never mention animals or Vegan (520 + 419). 114 such rows that do mention them stay for a read.
-- Reversible: status rejected, details.status_before_hidden = quarantined. Also: the Richmond Meetup group as a weekly event source.
with t as (
 select b.listing_id id, b.verdict, b.reason from ve_backlog_checks b join listings l on l.id=b.listing_id
 where b.decision is null and l.status='quarantined' and (
   b.verdict in ('gone','closed','thin','listed')
   or (b.verdict in ('person','other') and not ((coalesce(b.ig->>'biography','')||' '||l.name) ~* '(sanctuar|rescue|animal|nonprofit|non-profit|501|vegan|plant.based|foster|adopt)')))
), upd as (
 update listings l set status='rejected', updated_at=now(),
  details = coalesce(l.details,'{}'::jsonb) || jsonb_build_object('status_before_hidden','quarantined',
   'backlog', coalesce(l.details->'backlog','{}'::jsonb) || jsonb_build_object('verdict',t.verdict,'reason',t.reason,'decided','hide','by','Logan','at',now()),
   'admin_notes', coalesce(l.details->'admin_notes','[]'::jsonb) || jsonb_build_array(jsonb_build_object('at',now(),'by','Logan','kind','note',
     'text','Set aside in the New places clear-out (2026-11-08): '||t.reason)))
 from t where l.id=t.id returning l.id)
update ve_backlog_checks c set decision='hidden', decided_at=now() from upd where c.listing_id=upd.id;

insert into ve_event_sources (name, kind, url, city_slug, tenant_id, listing_kind, every_days, active, notes)
select 'Vegetarian Society of Richmond / RVA Vegan (Meetup)', 'list', 'https://www.meetup.com/bekind2animals/events/', 'virginia', '00000000-0000-4000-a000-000000000002', 'event', 7, true,
 'Added 2026-11-08 (Logan): the Virginia search found 0 dated events; this group runs the Richmond potlucks.'
where not exists (select 1 from ve_event_sources where url = 'https://www.meetup.com/bekind2animals/events/');
