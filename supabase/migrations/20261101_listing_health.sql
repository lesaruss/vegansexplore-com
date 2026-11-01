-- The listing check, in Sean's order (Sean, 2026-11-01: "the first best indicator is Google Maps... If they pass that, they can move
-- on to their website. Is their website up? ...the right security? Because if it doesn't have the right security, automatic flag,
-- you're going into review... then it's Instagram... I usually give them a grace of 6 months... that's when you might have somebody
-- do a bounty... If they confirm they're open, they bump them up, and then we flag them for special support"; then "go").
-- 1. Google says closed: off, as before (the nightly hold and the Monday re-check, 20261101_closed_off_open_back.sql).
-- 2. Website: the edge function ve-listing-health reads every local place's website once a month. A site that is gone (no answer, a
--    dead domain, 404 or 5xx, a parked or for-sale page) or has no working security (no https, a bad certificate) fails. A site that
--    only turns away scanners (401, 403, 406, 429, 503 even as a browser) is up. No website at all is not this check: Google covers it.
-- 3. Instagram, only for a failed website: a post in the last 6 months passes (and the place is flagged for support: its website needs
--    fixing). No post in 6 months, or no account, sends it to review (held), and a still-open bounty goes up in its chapter.
-- 4. Held for this check: read again every week; a working website or a fresh Instagram post puts it back. A member's visit through
--    the bounty settles it either way (ve-bounties applyCheck), and a confirmed open place is flagged for support.
-- A claimed or owned listing is never held by this; it is flagged for support instead. A place put back by hand (review_ok_until)
-- is checked but not held until that date passes. Defaults are Logan's, Sean's to change.

create table if not exists public.ve_listing_health (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  checked_at timestamptz,
  next_check_at timestamptz,
  website text,
  web_status text,          -- ok | blocked | down | insecure | none
  web_detail text,
  https_ok boolean,
  ig_handle text,
  ig_status text,           -- active | quiet | none | private | error | skipped
  ig_last_post timestamptz,
  ig_checked_at timestamptz,
  verdict text,             -- pass | review
  reasons text[] not null default '{}',
  held_at timestamptz,
  support_at timestamptz,
  support_why text,
  support_done_at timestamptz,
  history jsonb not null default '[]'::jsonb
);
alter table public.ve_listing_health enable row level security;
create index if not exists ve_listing_health_next on public.ve_listing_health (next_check_at);

-- Who is due: local places with a website, never checked or due again (held ones weekly, the rest monthly).
create or replace function public.ve_listing_health_due(p_limit int default 25)
returns table(listing_id uuid, slug text, name text, website text, instagram text, status text, protected boolean)
language sql stable security definer set search_path = public as $$
  select l.id, l.slug, l.name, l.website, l.instagram, l.status,
    (coalesce(l.claim_status, '') = 'verified' or l.owner_member_id is not null or l.claimed_by_member_id is not null
      or coalesce((l.details->>'review_ok_until')::date, '2000-01-01') >= current_date) protected
  from listings l left join ve_listing_health h on h.listing_id = l.id
  where coalesce(l.website, '') <> ''
    and coalesce(l.business_status, '') not in ('CLOSED_PERMANENTLY')
    and (ve_audit_local_category(l.category) or l.category in ('Food Trucks', 'Vendors'))
    and coalesce(l.address_city, '') <> '' and not ('lesaruss-ai-directory-candidate' = any(coalesce(l.tags, '{}')))
    and (l.status = 'approved'
      or (l.status = 'pending' and h.held_at is not null and l.details->'review'->>'by' = 'Listing check'))
    and (h.next_check_at is null or h.next_check_at <= now())
  order by h.checked_at nulls first, l.vote_count desc nulls last
  limit greatest(1, least(p_limit, 60));
$$;

-- The still-open bounty for a held place, in its chapter's campaign (made if missing). Once per place while it is open.
create or replace function public.ve_listing_still_open_bounty(p_listing uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare l listings%rowtype; ch text; camp uuid; bid uuid; due timestamptz := now() + interval '30 days'; place text;
begin
  select * into l from listings where id = p_listing;
  if not found then return null; end if;
  ch := ve_chapter_of(l.address_city, l.address_state);
  if ch is null then return null; end if;
  select id into bid from ve_bounties where check_listing_id = p_listing and status = 'open' limit 1;
  if bid is not null then return bid; end if;
  select id into camp from ve_bounty_campaigns where slug = 'still-open-' || ch;
  if camp is null then
    insert into ve_bounty_campaigns (slug, community_slug, kind, title, story, due_at, status, proposed_by, decided_by, decided_at)
    values ('still-open-' || ch, ch, 'ongoing', 'Is it still open?',
      'These places have gone quiet online: their website no longer works and they have not posted in months. Stop by, tell us if they are still serving, and we put them back on the Directory or say goodbye properly. Every place you check makes the Directory one you can trust.',
      due, 'open', 'aa000000-0000-4000-a000-000000000010', 'aa000000-0000-4000-a000-000000000010', now())
    returning id into camp;
  else
    update ve_bounty_campaigns set due_at = greatest(due_at, due), status = 'open' where id = camp;
  end if;
  place := case when l.google_place_id is not null then 'https://www.google.com/maps/place/?q=place_id:' || l.google_place_id
    else 'https://www.google.com/maps/search/?api=1&query=' || replace(concat_ws(' ', l.name, l.address_street, l.address_city, l.address_state), ' ', '+') end;
  insert into ve_bounties (community_slug, campaign_id, kind, title, brief, deliverable, points, slots, max_awards, due_at, status, sort, parts, remote, check_listing_id)
  values (ch, camp, 'other', 'Is ' || l.name || ' still open?',
    'Go to ' || l.name || ' at ' || concat_ws(', ', nullif(l.address_street, ''), nullif(l.address_city, ''), nullif(l.address_state, '')) ||
    ' (on the map: ' || place || '). If it is open, take a photo of the outside, then one inside: the menu, the counter or your receipt, and the hours posted on the door. If it is closed for good or gone, a photo of the storefront as it is now is just as useful. Add their Instagram, Facebook or website if you see one. Photos from today only, taken by you, never from Google or their pages. We check them before paying and update the listing with what you found.',
    'Photos from your visit, open or closed', 50, 1, 1, due, 'open', 0,
    array['A photo of the outside, taken today', 'If open: the menu, the counter or your receipt', 'If open: the hours posted on the door', 'Their Instagram, Facebook or website, if you saw one'],
    false, p_listing)
  returning id into bid;
  return bid;
end $$;

-- Flag a place for support (a confirmed open place, a website that needs fixing). Once until the team marks it done.
create or replace function public.ve_listing_support_flag(p_listing uuid, p_why text)
returns void language sql security definer set search_path = public as $$
  insert into ve_listing_health (listing_id, support_at, support_why) values (p_listing, now(), p_why)
  on conflict (listing_id) do update set support_at = coalesce(case when ve_listing_health.support_done_at is null then ve_listing_health.support_at end, now()),
    support_why = case when ve_listing_health.support_done_at is null and ve_listing_health.support_why is not null then ve_listing_health.support_why else p_why end,
    support_done_at = null;
$$;

revoke all on function public.ve_listing_health_due(int) from public, anon, authenticated;
revoke all on function public.ve_listing_still_open_bounty(uuid) from public, anon, authenticated;
revoke all on function public.ve_listing_support_flag(uuid, text) from public, anon, authenticated;

-- Every 10 minutes from 3 to 5 AM Eastern (07:00 to 08:50 UTC in winter), 25 places a run: about 300 a night.
select cron.schedule('ve-listing-health', '*/10 7-8 * * *', $c$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-listing-health',
    body := '{"action":"sweep","limit":25}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from lesaruss_secrets where key = 'CRON_SECRET')),
    timeout_milliseconds := 150000);
$c$);
