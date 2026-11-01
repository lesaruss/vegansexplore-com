-- The handshake email, made accurate (Sean, 2026-11-01, reviewing the walkthrough: "we need to 100% make sure that these things that
-- we're saying are true... they come back and say, we do have hours... That kills our credibility"; "nothing's theirs to keep. They can
-- claim it if they're a member. That language is misleading"; "what dashboard? They haven't signed up with us").
--
-- Found while checking: Rootz Soul Cafe's email said "Google has no hours for you" because Google marks it CLOSED_TEMPORARILY (our check-up
-- had flagged it closed), and "we could not find the Instagram @rootzsoulcafe" because our reader could not open the account that day.
--
-- 1. ve_outreach_free_check: only a check-up from the last 7 days, never for a business Google or our check-up marks closed, and only the
--    five checks that read a fact straight from Google or their own home page: hours on Google, the Google rating, phone speed (Google's own
--    test), the page title, the search description. Left out: Instagram (our reader misses), "we cannot find your Google profile" (a match
--    can miss), photo count (Google returns at most 10), the website not opening (sites turn away scanners). Every line is dated. The link
--    is /check/<slug> (their own free check), not an id.
-- 2. ve_audit_sweep_due: a business on a send day in the next 10 days whose check-up is more than 5 days old is checked again first.
-- 3. Day 0's words: no "yours to keep", no Partner Dashboard; the ask is claiming the listing. No price.
create or replace function public.ve_outreach_free_check(p_listing uuid)
returns text
language sql stable security definer set search_path to 'public'
as $$
  with a as (
    select au.id, au.items, au.created_at from ve_audits au
     where au.listing_id = p_listing and au.status = 'done' and au.created_at > now() - interval '7 days'
     order by au.created_at desc limit 1
  ), ok as (
    select a.* from a
     where (select closure_level from ve_audits where id = a.id) is null
       and coalesce((select facts->'google'->>'status' from ve_audits where id = a.id), 'OPERATIONAL') = 'OPERATIONAL'
       and coalesce((select business_status from listings where id = p_listing), 'OPERATIONAL') = 'OPERATIONAL'
  ), f as (
    select clean_found as found, cr.weight from ok, jsonb_array_elements(ok.items) i
      join ve_audit_criteria cr on cr.key = i->>'key' and cr.active and cr.in_free
      cross join lateral (select btrim(regexp_replace(coalesce(i->>'found', ''), '\s+', ' ', 'g')) as clean_found) x
     where i->>'state' = 'fix' and i->>'key' in ('g_hours', 'g_rating', 'w_speed', 's_title_local', 's_meta')
       and length(clean_found) between 8 and 220
     order by cr.weight desc limit 3
  )
  select case when (select count(*) from f) = 0 then '' else
    E'\n\nWe also ran our free restaurant check on ' || (select name from listings where id = p_listing) || ' on ' ||
    to_char((select created_at at time zone 'America/New_York' from ok), 'FMMonth FMDD') || E'. A few things stood out:\n' ||
    (select string_agg('- ' || found, E'\n' order by weight desc) from f) ||
    E'\n\nThe full check, and how to fix each one, free: https://vegansexplore.com/check/' || (select slug from listings where id = p_listing)
  end
$$;
revoke all on function public.ve_outreach_free_check(uuid) from public, anon, authenticated;
grant execute on function public.ve_outreach_free_check(uuid) to service_role;

create or replace function public.ve_audit_sweep_due(p_limit integer default 3)
returns table(slug text, community_slug text)
language sql stable security definer set search_path to 'public'
as $$
  select x.slug, x.community_slug from (
    -- First: businesses on a send day in the next 10 days whose check-up is more than 5 days old, so their email says what is true now.
    select distinct on (l.id) l.slug, c.community_slug, 0 as pri, l.name
      from ve_outreach_contacts c
      join ve_outreach_batches b on b.id = c.batch_id and b.status in ('proposed', 'approved') and b.send_on between current_date and current_date + 10
      join listings l on l.id = c.listing_id
     where c.last_sent_at is null and l.status = 'approved' and coalesce(l.business_status, '') <> 'CLOSED_PERMANENTLY'
       and ve_audit_local_category(l.category) and l.slug is not null
       and not exists (select 1 from ve_audits a where a.listing_id = l.id and a.created_at > now() - interval '5 days'
         and coalesce(a.facts->'google'->>'error', '') not like 'places %')
    union all
    select l.slug, oc.community_slug, 1 as pri, l.name
      from listings l
      join ve_outreach_cities oc on oc.community_slug <> 'brands'
        and (oc.cities is null or l.address_city = any(oc.cities)) and (oc.states is null or l.address_state = any(oc.states))
     where l.status = 'approved' and coalesce(l.business_status, '') <> 'CLOSED_PERMANENTLY'
       and not ('lesaruss-ai-directory-candidate' = any(coalesce(l.tags, '{}')))
       and ve_audit_local_category(l.category) and l.slug is not null
       and not exists (select 1 from ve_audits a where a.listing_id = l.id and a.created_at > now() - interval '28 days'
         and coalesce(a.facts->'google'->>'error', '') not like 'places %')
  ) x
  order by x.pri, x.community_slug, x.name
  limit greatest(1, least(p_limit, 10))
$$;

update public.ve_outreach_templates set body =
$t$Hi {first_name},

I'm Sean, founder of Vegans Explore, the home for the Vegan community{in_city}. {business} is listed in our Directory, where our members find Vegan places, vote for the ones they love and save them for later.

Here is your listing: {link}{guide_line}{free_check}

We're lining up our Q1 campaigns{in_city} now, and we'd love to have you in the front row. The first step is claiming your listing, so you can add your own photos, hours and menu and see how many people find you.

If you have any questions, just reply. I answer them myself.

Sean A. Russell
Founder, Vegans Explore$t$, updated_at = now()
 where program = 'business-outreach' and step = 1;
