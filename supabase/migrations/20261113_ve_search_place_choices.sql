-- ve_search_place_choices: the cities a bare place name could mean, for a "Which one?" pick (playbook ve-near-me;
-- Sean, 2026-11-13: "If there's two locations that conflict, could we give them the option of picking the right one, so we
-- could show the city with the state and they choose that one?").
-- Only for a whole text that is one place name and nothing else (no state typed: "Decatur, GA" is already exact in
-- ve_search_core). A city counts when universal search would read it bare (population 20,000 or more, the same floor as
-- ve_search_core, or a curated alias/weighted row), it is in a country we have chapters in (US, GB), it is at least 5% the size
-- of the largest, and it is not within 30 miles of a bigger one already listed (one place under two names counts once).
-- "Decatur" offers IL, AL and GA; "Miami" nothing (Miami, OK is under 20,000); "Austin" nothing (Austin, MN is 2.5% of
-- Austin, TX). Fewer than two: []. Read only.
create or replace function public.ve_search_place_choices(p_q text)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  q text; top_pop int := null; r record; kept jsonb := '[]'::jsonb; e jsonb; dup boolean;
begin
  q := lower(coalesce(p_q, ''));
  q := replace(replace(q, '''', ''), '’', '');
  q := btrim(regexp_replace(regexp_replace(q, '[^a-z0-9 ]', ' ', 'g'), '\s+', ' ', 'g'));
  if length(q) < 3 then return '[]'::jsonb; end if;
  for r in select coalesce(shows_as, name) as name, state, country, lat, lng, coalesce(population, 0) as pop
           from ve_search_places
           where key = q and lat is not null and lng is not null
             and (coalesce(population, 0) >= 20000 or source = 'alias' or coalesce(weight, 0) > 0)
             and coalesce(country, 'US') in ('US', 'GB')
           order by coalesce(population, 0) desc, coalesce(weight, 0) desc loop
    if top_pop is null then top_pop := r.pop; end if;
    exit when r.pop < top_pop * 0.05;
    dup := false;
    for e in select * from jsonb_array_elements(kept) loop
      if 3959 * 2 * asin(least(1, sqrt(power(sin(radians(r.lat - (e->>'lat')::float8) / 2), 2)
           + cos(radians(r.lat)) * cos(radians((e->>'lat')::float8)) * power(sin(radians(r.lng - (e->>'lng')::float8) / 2), 2)))) < 30 then
        dup := true; exit;
      end if;
    end loop;
    continue when dup;
    kept := kept || jsonb_build_array(jsonb_build_object('name', r.name, 'state', r.state, 'country', r.country, 'lat', r.lat, 'lng', r.lng,
      'label', r.name || case when r.state is not null then ', ' || r.state when r.country = 'GB' then ', UK' else '' end));
    exit when jsonb_array_length(kept) >= 6;
  end loop;
  if jsonb_array_length(kept) < 2 then return '[]'::jsonb; end if;
  return kept;
end
$function$;

revoke all on function public.ve_search_place_choices(text) from public;
grant execute on function public.ve_search_place_choices(text) to anon, authenticated, service_role;
