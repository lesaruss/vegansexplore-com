-- ve-restaurant-guide (Sean, 2026-11-05): before any send, take out the duplicate Veggie Grill contacts (one inbox,
-- chitchat@nextlevelvg.com) and pull H.O.P.E. (accessibility@dylish.com is a web vendor's mailbox).
-- Kept: Next Level Veggie Grill (Long Beach, the main listing, link bo-dt3wgz6). Applied through the connector 2026-11-05.
-- Same shape as ve-outreach `remove` with hold: status held, a reason, an event row. Never deleted.
with u as (
  update ve_outreach_contacts c set status = 'held', batch_id = null, next_send_at = null, updated_at = now(),
    stop_reason = case when c.id = '46751309-4dc3-48fa-8a8f-32c963c7d500'
      then 'taken out by Sean: the address is a web vendor''s (accessibility@dylish.com), not the restaurant''s'
      else 'taken out by Sean: same inbox as Next Level Veggie Grill (Long Beach), which keeps the contact' end
  where c.id in ('5d3f505e-6087-4334-84f1-b338f24d7202', 'e3700099-22e5-479b-84f4-0cb79b0c67b8', '46751309-4dc3-48fa-8a8f-32c963c7d500')
    and c.status = 'not_sent'
  returning c.id, c.stop_reason)
insert into ve_outreach_events (contact_id, kind, detail)
select id, 'status', jsonb_build_object('status', 'held', 'why', stop_reason, 'by', 'logan') from u;
