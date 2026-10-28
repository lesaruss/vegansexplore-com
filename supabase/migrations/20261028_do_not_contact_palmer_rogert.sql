-- Do not contact (Sean, 2026-10-28: "I never want to speak with them again... remove them from the list so that we don't message them
-- by accident... put in the do not contact list"): Vanessa Palmer and Geoff Palmer (Clean Machine) and Oyuki Rogert (YO Synergy).
-- Each email goes on people_suppression (every invitation, outreach list and HQ send checks it), and their HQ > People rows are archived
-- with the reason, so they leave every list and pick-list. Nothing is deleted: the record is what keeps a later import from bringing them
-- back. Safe to run twice.
insert into people_suppression (email, person_id, reason, active, created_by)
select v.email, v.pid::uuid, 'Sean, 2026-10-28: never contact', true, 'logan'
  from (values ('vpalmer@cleanmachineonline.com', '72899e41-ffe9-42e9-be92-85d2a329140b'),
               ('gpalmer@cleanmachineonline.com', 'b3f08a5f-0b7e-421c-a5eb-820827b3caf6'),
               ('info@yosynergy.com', 'c8a90bda-3b7f-42fa-82e9-e87139f884bb')) v(email, pid)
 where not exists (select 1 from people_suppression s where lower(s.email) = v.email);
update people_suppression set active = true, released_at = null, reason = 'Sean, 2026-10-28: never contact',
       person_id = coalesce(person_id, 'c8a90bda-3b7f-42fa-82e9-e87139f884bb'::uuid)
 where lower(email) in ('vpalmer@cleanmachineonline.com', 'gpalmer@cleanmachineonline.com', 'info@yosynergy.com');
update people set archived = true, archived_at = coalesce(archived_at, now()), removed_reason = 'other',
       removed_note = 'Sean, 2026-10-28: never contact again', updated_at = now()
 where id in ('72899e41-ffe9-42e9-be92-85d2a329140b', 'b3f08a5f-0b7e-421c-a5eb-820827b3caf6', 'c8a90bda-3b7f-42fa-82e9-e87139f884bb');
