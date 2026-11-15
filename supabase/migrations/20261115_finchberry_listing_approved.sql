-- 2026-11-15 (Logan): Finchberry is one of the ten Gift Guide picks in gift-guide-2026-selected (Sean approved the Featured in emails:
-- "yes, approve the Featured in emails"), but its listing was still pending, so its confirm page fell back to the generic one and the
-- sender skipped it. Checked complete (third-person description, Vegan capitalized, website, logo, its gift row), so it goes live like
-- the other nine. One ve_listing_edits row keeps it traceable and undoable. Safe to run twice.
insert into public.ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'status', to_jsonb(status), to_jsonb('approved'::text), jsonb_build_object('playbook', 've-holiday-guide', 'why', 'Gift Guide pick; Featured in email approved by Sean 2026-11-15', 'by', 'logan')
  from public.listings where slug = 'finchberry' and status <> 'approved';
update public.listings set status = 'approved' where slug = 'finchberry' and status <> 'approved';
