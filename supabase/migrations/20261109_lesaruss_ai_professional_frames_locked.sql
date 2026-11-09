-- lesaruss-ai-professional-frames: locked by Sean 2026-11-09 (concept session with V). Applied through the connector.
-- One decision record in playbook_records (slug lesaruss-ai-professional-frames, brand lesaruss-ai, author V) holding the full text,
-- and its ve_playbook_index row:
insert into ve_playbook_index (slug, brand_slug, title, goal, status, stage, next_action, owner, priority)
values ('lesaruss-ai-professional-frames','lesaruss-ai','Professional frames: software with a community built in',
'BrandDesk for coaches, CPAs and law firms: their marketing and presence run by us, plugged into our community and network, sold by demo.',
'building','Locked 2026-11-09 by Sean; queued behind pricing_v9.','After pricing_v9: build the coach frame and its sample coach demo.','Logan',60)
on conflict do nothing;
