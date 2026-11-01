-- The listing check reads tomorrow's outreach first (Sean, 2026-11-01: "we know we're going to be reaching out to 30 people a day. We
-- can prioritize those people in the check... the day before. So that way their profiles have been kind of double checked for accuracy,
-- has the latest information. So when that potential client clicks on it, they're seeing the information they should be seeing").
-- A business in a send day (ve_outreach_batches, proposed or approved) for today or tomorrow in Eastern time, still waiting for its first
-- email, is read first by the nightly sweep (2:00 to 3:50 AM Eastern, before the sender starts at 9), and read again whenever its last
-- check is more than two days old, even if its monthly check is not due. A business the check holds comes off the email list on its own
-- (trg_ve_outreach_listing_hidden), so nobody gets an email pointing at a dead page. Everything else is unchanged.
create or replace function public.ve_listing_health_due(p_limit int default 25)
returns table(listing_id uuid, slug text, name text, website text, instagram text, status text, protected boolean)
language sql stable security definer set search_path = public as $$
  with soon as (
    select distinct c.listing_id from ve_outreach_contacts c join ve_outreach_batches b on b.id = c.batch_id
    where c.listing_id is not null and c.status = 'not_sent' and b.status in ('proposed', 'approved')
      and b.send_on between (now() at time zone 'America/New_York')::date and (now() at time zone 'America/New_York')::date + 1
  )
  select l.id, l.slug, l.name, l.website, l.instagram, l.status,
    (coalesce(l.claim_status, '') = 'verified' or l.owner_member_id is not null or l.claimed_by_member_id is not null
      or coalesce((l.details->>'review_ok_until')::date, '2000-01-01') >= current_date) protected
  from listings l left join ve_listing_health h on h.listing_id = l.id left join soon s on s.listing_id = l.id
  where coalesce(l.website, '') <> ''
    and coalesce(l.business_status, '') not in ('CLOSED_PERMANENTLY')
    and (ve_audit_local_category(l.category) or l.category in ('Food Trucks', 'Vendors'))
    and coalesce(l.address_city, '') <> '' and not (coalesce(l.tags, '{}') && array['lesaruss-ai-directory-candidate', 've-grocery-store'])
    and (l.status = 'approved'
      or (l.status = 'pending' and h.held_at is not null and l.details->'review'->>'by' = 'Listing check'))
    and (h.next_check_at is null or h.next_check_at <= now()
      or (s.listing_id is not null and (h.checked_at is null or h.checked_at < now() - interval '2 days')))
  order by (s.listing_id is not null) desc, h.checked_at nulls first, l.vote_count desc nulls last
  limit greatest(1, least(p_limit, 60));
$$;
revoke all on function public.ve_listing_health_due(int) from public, anon, authenticated;
