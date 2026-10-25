-- Directory review (Sean, 2026-10-25): "have these businesses quarantined in a place where I can go through them manually...
-- That way we don't have listings that are out of date... there's some red flags if the business doesn't have social... a few
-- businesses... I just wanted to remove and not even mark as permanently closed... the idea of permanently closed is I would
-- like people to be able to look at those from a nostalgic point of view."
--
-- Every listing now has four outcomes, set from Depot > Directory review or the listing editor (ve_listing_set_state):
--   live     on the Directory (status approved; reopens a closed one)
--   hold     On hold for review: off the Directory until Sean decides (status pending, details.review)
--   removed  off the Directory for good, but never deleted (status rejected, details.removed_*); not shown under Closed
--   closed   Permanently closed: stays under Type > Closed, for memory (business_status CLOSED_PERMANENTLY)
-- Red flags (ve_directory_review_flags): Google says it is closed, the monthly check-up's closed or quiet flag, no socials, no
-- hours, no street address, a website that does not open, no website. The strong ones are held automatically every night
-- (ve_directory_auto_hold, cron ve-directory-auto-hold) so an out-of-date place leaves the Directory until Sean looks; a place
-- Sean puts back stays live for 90 days before it can be held again (details.review_ok_until). A claimed or owned listing is
-- never held automatically.

-- 1. Set a listing's state, with a note on the listing. p_by is the member who decided (null for the nightly hold).
create or replace function public.ve_listing_set_state(p_listing uuid, p_state text, p_by uuid default null, p_note text default null,
  p_reasons text[] default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare l listings%rowtype; d jsonb; who text; at text := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  txt text; note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if p_state not in ('live', 'hold', 'removed', 'closed') then return jsonb_build_object('ok', false, 'why', 'bad_state'); end if;
  select * into l from listings where id = p_listing for update;
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if l.status not in ('approved', 'pending', 'rejected') or (l.status = 'rejected' and l.details ? 'merged_into') then
    return jsonb_build_object('ok', false, 'why', 'not_a_directory_listing'); end if;
  who := coalesce((select split_part(name, ' ', 1) from members where id = p_by), 'Nightly check');
  d := coalesce(l.details, '{}'::jsonb) - 'review' - 'removed_at' - 'removed_by' - 'removed_reason';
  if p_state = 'live' then
    update listings set status = 'approved',
      business_status = case when business_status = 'CLOSED_PERMANENTLY' then coalesce(nullif(d->>'status_before_closed', 'CLOSED_PERMANENTLY'), 'OPERATIONAL') else business_status end,
      details = d || jsonb_build_object('review_ok_until', to_char((now() + interval '90 days') at time zone 'utc', 'YYYY-MM-DD')),
      updated_at = now() where id = l.id;
    txt := 'Back on the Directory.';
  elsif p_state = 'hold' then
    update listings set status = 'pending', details = d || jsonb_build_object('review', jsonb_build_object('at', at, 'by', who,
      'reasons', to_jsonb(coalesce(p_reasons, array[]::text[])), 'auto', p_by is null, 'status_before', l.status)), updated_at = now() where id = l.id;
    txt := 'On hold for review' || coalesce(': ' || array_to_string(p_reasons, '; '), '') || '.';
  elsif p_state = 'removed' then
    update listings set status = 'rejected', details = d || jsonb_build_object('removed_at', at, 'removed_by', who, 'removed_reason', note,
      'status_before_removed', l.status), updated_at = now() where id = l.id;
    txt := 'Removed from the Directory (not closed).';
  else
    update listings set status = 'approved', business_status = 'CLOSED_PERMANENTLY',
      details = d || jsonb_build_object('closed_at', at, 'closed_by', who, 'status_before_closed', l.business_status), updated_at = now() where id = l.id;
    txt := 'Permanently closed. It stays under Closed in the Directory.';
  end if;
  update listings set details = jsonb_set(details, '{admin_notes}', coalesce(details->'admin_notes', '[]'::jsonb) ||
    jsonb_build_array(jsonb_build_object('at', at, 'by', who, 'kind', p_state, 'text', txt || coalesce(' ' || note, '')))) where id = l.id;
  return jsonb_build_object('ok', true, 'state', p_state);
end $$;
revoke all on function public.ve_listing_set_state(uuid, text, uuid, text, text[]) from public, anon, authenticated;

-- 2. Off the Directory means off the email list too (held, the way a closed one already is).
create or replace function public.ve_outreach_listing_hidden() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if new.status <> 'approved' and old.status = 'approved' then
    update ve_outreach_contacts set status = 'held', stop_reason = case when new.status = 'pending' then 'on hold for review' else 'removed from the Directory' end,
      next_send_at = null, batch_id = case when status = 'not_sent' then null else batch_id end
    where listing_id = new.id and status in ('not_sent', 'in_sequence', 'interested');
  end if;
  return new;
end $fn$;
revoke all on function public.ve_outreach_listing_hidden() from public, anon, authenticated;
create or replace trigger trg_ve_outreach_listing_hidden after update of status on public.listings
  for each row execute function public.ve_outreach_listing_hidden();

-- 3. The red flags on every open local listing (the check-up's categories plus food trucks), worst first.
create or replace function public.ve_directory_review_flags()
returns table (listing_id uuid, slug text, name text, category text, city text, state text, community_slug text, logo_url text,
  website text, instagram text, flags text[], strong boolean, audit_id uuid, google_maps text)
language sql stable security definer set search_path to 'public' as $$
  with base as (
    select l.*, a.id aid, a.closure_level, a.facts, fr.decision,
      coalesce(a.facts->'google'->>'status', case when q.google_note like 'Google says CLOSED_PERMANENTLY%' then 'CLOSED_PERMANENTLY' end) gstatus,
      (select oc.community_slug from ve_outreach_cities oc where oc.kind = 'city' and oc.community_slug <> 'brands'
         and (oc.cities is null or l.address_city = any(oc.cities)) and (oc.states is null or l.address_state = any(oc.states)) limit 1) hub
    from listings l
    left join lateral (select * from ve_audits a where a.listing_id = l.id and a.status = 'done' order by a.created_at desc limit 1) a on true
    left join ve_audit_flag_reviews fr on fr.audit_id = a.id
    left join ve_listing_essentials q on q.listing_id = l.id
    where l.status = 'approved' and coalesce(l.business_status, '') <> 'CLOSED_PERMANENTLY'
      and (ve_audit_local_category(l.category) or l.category = 'Food Trucks & Vendors')
      and coalesce(l.address_city, '') <> '' and not ('lesaruss-ai-directory-candidate' = any(coalesce(l.tags, '{}')))
      and coalesce((l.details->>'review_ok_until')::date, '2000-01-01') < current_date
  ), f as (
    select b.*, array_remove(array[
      case when b.gstatus = 'CLOSED_PERMANENTLY' then 'Google says it is permanently closed'
           when b.gstatus = 'CLOSED_TEMPORARILY' then 'Google says it is temporarily closed' end,
      case when b.closure_level in ('closed', 'quiet') and b.decision is null then 'The monthly check-up flagged it as ' || case b.closure_level when 'closed' then 'closed' else 'gone quiet' end end,
      case when coalesce(b.instagram, '') = '' and coalesce(b.facebook, '') = '' and coalesce(b.tiktok, '') = '' then 'No socials' end,
      case when coalesce(nullif(b.google_hours_json::text, ''), 'null') in ('null', '{}', '[]', '""') then 'No hours' end,
      case when coalesce(b.address_street, '') = '' then 'No street address' end,
      case when coalesce(b.website, '') = '' then 'No website'
           -- A site that only turns away our scanner (401, 403, 406, 429, 503) is not down (the audit's lesson, 2026-10-10).
           when b.facts->'website'->>'error' is not null and b.facts->'website'->>'error' !~ '^(status (401|403|406|429|503)|no website)$' then 'The website did not open' end
    ], null) fl
    from base b
  )
  select f.id, f.slug, f.name, f.category, f.address_city, f.address_state, f.hub, f.logo_url, f.website, f.instagram, f.fl,
    (f.gstatus = 'CLOSED_PERMANENTLY' or (f.closure_level in ('closed', 'quiet') and f.decision is null)
      or ('No socials' = any(f.fl) and ('No hours' = any(f.fl) or 'The website did not open' = any(f.fl) or 'No website' = any(f.fl)))) strong,
    f.aid, f.facts->'google'->>'maps'
  from f where cardinality(f.fl) > 0
  order by 12 desc, cardinality(f.fl) desc, f.name;
$$;
revoke all on function public.ve_directory_review_flags() from public, anon, authenticated;

-- 4. The nightly hold: strong flags only, never a claimed or owned listing.
create or replace function public.ve_directory_auto_hold()
returns int language plpgsql security definer set search_path to 'public' as $$
declare r record; n int := 0;
begin
  for r in select f.* from ve_directory_review_flags() f join listings l on l.id = f.listing_id
    where f.strong and coalesce(l.claim_status, '') <> 'verified' and l.owner_member_id is null and l.claimed_by_member_id is null loop
    perform ve_listing_set_state(r.listing_id, 'hold', null, null, r.flags);
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.ve_directory_auto_hold() from public, anon, authenticated;

select cron.schedule('ve-directory-auto-hold', '30 8 * * *', $c$ select public.ve_directory_auto_hold(); $c$);
select public.ve_directory_auto_hold();
