-- Links to a merged listing forward to the one that stays (Sean, 2026-10-10: "make the merged listing links
-- forward to the real ones"). directory/listing.html asks this when a slug has no approved listing; it answers
-- the approved listing's slug, or nothing. It exposes only a slug, never the merged row.
create or replace function public.ve_listing_merged_to(p_slug text) returns text
language sql stable security definer set search_path to 'public' as $fn$
  select k.slug
  from listings d join listings k on k.id = (d.details ->> 'merged_into')::uuid
  where d.slug = p_slug and d.status = 'rejected' and d.details ? 'merged_into' and k.status = 'approved'
  order by d.updated_at desc
  limit 1
$fn$;
revoke all on function public.ve_listing_merged_to(text) from public;
grant execute on function public.ve_listing_merged_to(text) to anon, authenticated;
