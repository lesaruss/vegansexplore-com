-- Approving an "Is it still open?" job updates the listing (Sean, 2026-11-01: "Yes, make approving it update the listing
-- automatically"). A job carries the listing it checks (ve_bounties.check_listing_id); the member says what they found
-- (ve_bounty_submissions.check_result: open or closed) and the reviewer can change it from the photos. On approval ve-bounties puts an
-- open place back on the Directory (ve_listing_set_state live, 90 days off the nightly hold) or takes a closed one off as Removed, with a
-- note naming the visit; check_applied_at records it once.
alter table public.ve_bounties add column if not exists check_listing_id uuid references public.listings(id) on delete set null;
alter table public.ve_bounty_submissions add column if not exists check_result text,
  add column if not exists check_applied_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 've_bounty_submissions_check_result_check') then
    alter table public.ve_bounty_submissions add constraint ve_bounty_submissions_check_result_check check (check_result in ('open', 'closed'));
  end if;
end $$;

-- The 36 jobs made today, each to its listing (by the title the first migration gave it).
update public.ve_bounties b set check_listing_id = l.id
from public.ve_bounty_campaigns c, public.listings l
where b.campaign_id = c.id and c.slug like 'still-open-%' and b.check_listing_id is null
  and b.title = 'Is ' || l.name || ' still open?' and l.status = 'pending'
  and c.slug = 'still-open-' || public.ve_chapter_of(l.address_city, l.address_state);
