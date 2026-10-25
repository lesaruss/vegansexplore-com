-- A check-up whose Google lookup failed on Google's side (a key or quota problem: facts.google.error 'places <status>')
-- does not count as this month's check-up, so the next sweep runs it again (2026-10-25: the Places key was refused for a day).
create or replace function public.ve_audit_sweep_due(p_limit integer default 3)
 returns table(slug text, community_slug text)
 language sql stable security definer
 set search_path to 'public'
as $function$
  select l.slug, oc.community_slug
  from listings l
  join ve_outreach_cities oc on oc.community_slug <> 'brands'
    and (oc.cities is null or l.address_city = any(oc.cities)) and (oc.states is null or l.address_state = any(oc.states))
  where l.status = 'approved' and coalesce(l.business_status, '') <> 'CLOSED_PERMANENTLY'
    and not ('lesaruss-ai-directory-candidate' = any(coalesce(l.tags, '{}')))
    and ve_audit_local_category(l.category) and l.slug is not null
    and not exists (select 1 from ve_audits a where a.listing_id = l.id and a.created_at > now() - interval '28 days'
      and coalesce(a.facts->'google'->>'error', '') not like 'places %')
  order by oc.community_slug, l.name
  limit greatest(1, least(p_limit, 10))
$function$;
