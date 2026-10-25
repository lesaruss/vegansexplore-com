-- Earthy Picks duplicates merged (Sean, 2026-10-25: "merge the Earthy Picks duplicates"). Applied 2026-10-25.
-- The listing that stays is Earthy Picks Vegan Cafe (earthy-picks-vegan-cafe, cc53ff6d), the full one: street, phone, website,
-- Google place, hours. It was on hold for review that night (Google said temporarily closed, the check-up flag, no socials).
-- Merged into it, the usual way (status rejected, details.merged_into, never deleted):
--   Earthy Picks Vegan (earthy-picks-vegan-orlando, 752ff05f), a near-empty Community Partner copy: the restaurant gains that
--   category, and its email contact (earthypicks.info@gmail.com, never sent) moves over, held while the listing is on hold;
--   two import copies (b34f746b, an old site project page; 43417952, the Instagram import): Instagram @earthypicks moves over.

begin;
update ve_outreach_contacts set listing_id = 'cc53ff6d-dea3-4d70-a844-72dfc82fba98', status = 'held', stop_reason = 'on hold for review',
  next_send_at = null, batch_id = null
where listing_id = '752ff05f-2fee-48f2-beba-107c081177f6' and status = 'not_sent';
update listings set instagram = coalesce(nullif(instagram, ''), 'earthypicks'),
  extra_categories = case when 'Community Partner' = any(coalesce(extra_categories, '{}')) then extra_categories else array_append(coalesce(extra_categories, '{}'), 'Community Partner') end,
  updated_at = now()
where id = 'cc53ff6d-dea3-4d70-a844-72dfc82fba98';
update listings d set status = 'rejected',
  details = coalesce(d.details, '{}'::jsonb) || jsonb_build_object('merged_into', 'cc53ff6d-dea3-4d70-a844-72dfc82fba98', 'merged_at', '2026-10-25', 'status_before_merge', d.status),
  updated_at = now()
where d.id in ('b34f746b-e172-4082-9d41-4b15857f9aa0', '43417952-8b20-4499-b526-1c19f7eaffb0', '752ff05f-2fee-48f2-beba-107c081177f6')
  and d.status <> 'rejected';
commit;
