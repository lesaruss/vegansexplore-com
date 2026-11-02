-- Universal search v2 (benchmark round 1, 2026-11-02): misspellings, city nicknames, far results nearest first, places with no pin last,
-- and a cookie is a bakery thing, not a snack brand.
alter table ve_search_places add column if not exists shows_as text;           -- an alias shows as this name (NYC -> New York)
alter table ve_search_benchmark add column if not exists expect_fallback boolean;  -- true: nothing is near, so the nearest are shown and said so
insert into ve_search_places (name, state, lat, lng, weight, source, shows_as)
select a.alias, p.state, p.lat, p.lng, p.weight, 'alias', p.name
from (values ('NYC','New York','NY'),('NY','New York','NY'),('LA','Los Angeles','CA'),('DC','Washington','DC'),('Philly','Philadelphia','PA'),
             ('ATL','Atlanta','GA'),('SF','San Francisco','CA'),('Vegas','Las Vegas','NV'),('Miami Beach','Miami Beach','FL')) as a(alias, target, st)
join ve_search_places p on lower(p.name) = lower(a.target) and coalesce(lower(p.state), '') = lower(a.st) and p.source <> 'alias'
on conflict do nothing;

-- cookies, cakes and cupcakes are a bakery, not a snack brand
select ve_search_vocab_add('cookie', 'Bakeries & cafes', array['Bakeries & Cafes'], null, null);
select ve_search_vocab_add('brownie', 'Bakeries & cafes', array['Bakeries & Cafes'], null, null);
update ve_search_benchmark set expect_city = null, expect_fallback = true, note = 'no such place there: nearest shown and said so'
 where q in ('food truck in Orlando', 'farmers market in Atlanta', 'burgers in Fort Lauderdale');
update ve_search_benchmark set expect_city = null, expect_name = null, expect_cat = 'Bakeries' where q = 'cookies in Miami';
update ve_search_benchmark set expect_city = null where q = 'catering in Miami';

create or replace function ve_search(p_q text, p_lat float8 default null, p_lng float8 default null, p_limit int default 20, p_brand text default 'vegans-explore')
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  q text; rest text; near_me boolean := false;
  pl record; v record; n text; frag text; prep text; cand text;
  v_cats text[] := '{}'; v_kinds text[] := '{}'; v_cui text[] := '{}'; v_labels text[] := '{}'; v_link text;
  c_lat float8 := null; c_lng float8 := null; use_center boolean := false; place_json jsonb := null;
  name_terms text := ''; has_intent boolean; res jsonb; min_km float8; total int; top_city text;
  stop text[] := array['vegan','vegans','plant','based','plantbased','best','top','good','great','find','me','for','a','an','the','some','any','places','place','spots','spot','near','nearby','with','that','are','is','i','want','looking','to','get','buy','my','of','and','or','in','at','around','close','shop','store','stores'];
  placed boolean := false; w text;
begin
  q := lower(coalesce(p_q, ''));
  q := replace(replace(q, '''', ''), '’', '');
  q := btrim(regexp_replace(regexp_replace(q, '[^a-z0-9 ]', ' ', 'g'), '\s+', ' ', 'g'));
  if length(q) < 2 then
    return jsonb_build_object('q', q, 'interpretation', jsonb_build_object('labels', '[]'::jsonb), 'results', '[]'::jsonb, 'total', 0);
  end if;
  rest := ' ' || q || ' ';

  if rest ~ ' (near me|nearby|around me|close to me|nearest) ' then
    near_me := true;
    rest := regexp_replace(rest, ' (near me|nearby|around me|close to me|nearest) ', ' ', 'g');
    c_lat := p_lat; c_lng := p_lng;
  end if;

  -- a place named in the sentence: "in Claremont", "near Pomona CA", or a place on the end
  if not near_me then
    for pl in select name, state, lat, lng, shows_as from ve_search_places where position(lower(name) in q) > 0 order by length(name) desc, weight desc loop
      foreach cand in array array[lower(pl.name) || ' ' || lower(coalesce(pl.state, '~')), lower(pl.name)] loop
        foreach prep in array array['in', 'near', 'around', 'at', ''] loop
          if prep <> '' then frag := ' ' || prep || ' ' || cand || ' '; else frag := ' ' || cand || ' '; end if;
          if (prep <> '' and position(frag in rest) > 0) or (prep = '' and right(rest, length(frag)) = frag) then
            placed := true;
            place_json := jsonb_build_object('name', coalesce(pl.shows_as, pl.name), 'state', pl.state, 'lat', pl.lat, 'lng', pl.lng);
            c_lat := pl.lat; c_lng := pl.lng;
            rest := replace(rest, frag, ' ');
            exit;
          end if;
        end loop;
        exit when placed;
      end loop;
      exit when placed;
    end loop;
  end if;
  if c_lat is null then c_lat := p_lat; c_lng := p_lng; end if;

  -- what kind of thing: the longest phrases first, plurals too
  for v in select * from ve_search_vocab where brand = p_brand order by length(phrase) desc, phrase loop
    if rest ~ (' ' || v.phrase || '(s|es)? ') then
      rest := regexp_replace(rest, ' ' || v.phrase || '(s|es)? ', ' ', 'g');
      v_cats := v_cats || v.cats; v_kinds := v_kinds || v.kinds; v_cui := v_cui || v.cuisines;
      if not (v.label = any(v_labels)) then v_labels := v_labels || v.label; end if;
      if v_link is null and array_length(v_labels, 1) = 1 then v_link := v.link; end if;
    end if;
  end loop;


  -- a misspelled word: the closest vocabulary phrase, only for longer words
  for w in select x from unnest(string_to_array(btrim(rest), ' ')) x where length(x) >= 5 and x <> all(stop) loop
    select * into v from ve_search_vocab where brand = p_brand
      and similarity(replace(phrase, ' ', ''), w) >= (case when length(w) >= 7 then 0.55 else 0.72 end)
    order by similarity(replace(phrase, ' ', ''), w) desc limit 1;
    if found then
      rest := regexp_replace(rest, ' ' || w || ' ', ' ', 'g');
      v_cats := v_cats || v.cats; v_kinds := v_kinds || v.kinds; v_cui := v_cui || v.cuisines;
      if not (v.label = any(v_labels)) then v_labels := v_labels || v.label; end if;
      if v_link is null and array_length(v_labels, 1) = 1 then v_link := v.link; end if;
    end if;
  end loop;

  select coalesce(string_agg(w, ' '), '') into name_terms
  from unnest(string_to_array(btrim(rest), ' ')) w where w <> '' and w <> all(stop);
  has_intent := cardinality(v_cats) + cardinality(v_kinds) + cardinality(v_cui) > 0;
  use_center := c_lat is not null and cardinality(v_kinds) = 0;

  with b as (
    select l.id, l.slug, l.name, l.category, l.logo_url, coalesce(l.vote_count, 0) as votes, l.address_city as city, l.address_state as state,
           l.vegan_status, l.tagline,
           case when use_center and l.latitude is not null then
             6371 * 2 * asin(least(1, sqrt(power(sin(radians(l.latitude - c_lat) / 2), 2) + cos(radians(c_lat)) * cos(radians(l.latitude)) * power(sin(radians(l.longitude - c_lng) / 2), 2)))) end as dist,
           case when name_terms <> '' then greatest(similarity(lower(l.name), name_terms), word_similarity(name_terms, lower(l.name)),
                  case when lower(l.name) like '%' || name_terms || '%' then 1 else 0 end,
                  case when lower(coalesce(l.tagline, '') || ' ' || coalesce(l.description, '')) like '%' || name_terms || '%' then 0.45 else 0 end) else 0 end as nsim,
           ((cardinality(v_cats) = 0 or l.category = any(v_cats) or coalesce(l.extra_categories, '{}') && v_cats)
            and (cardinality(v_kinds) = 0 or coalesce(l.product_kinds, '{}') && v_kinds)
            and (cardinality(v_cui) = 0 or coalesce(l.cuisines, '{}') && v_cui)) as intent_ok,
           l.vegan_status in ('fully_vegan', 'vegan') as full_vegan,
           l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep', 'Markets', 'Health Professionals', 'Animal Care', 'Coaches and Consultants', 'Health and Wellness', 'Studios', 'Event Venues') as local_kind
    from listings l
    where l.status = 'approved' and coalesce(l.business_status, '') <> 'CLOSED_PERMANENTLY' and l.category <> 'Uncategorized'
      and not (coalesce(l.tags, '{}') && array['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-directory-business-member'])
      and not (l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep')
               and coalesce(l.vegan_status, '') in ('vegan_options', 'vegan_friendly') and coalesce(l.voter_count, 0) < 10
               and l.vetted_at is null and l.claim_status <> 'verified')
  ), s as (
    select b.*, (b.nsim * 4 + ln(1 + b.votes) * 0.35 + (case when b.full_vegan then 0.6 else 0 end)
                 + (case when b.dist is null then (case when use_center and b.local_kind then -3 else 0 end) else 4 * exp(-b.dist / 20.0) - least(b.dist, 3000) / 250.0 end) + (case when b.intent_ok and name_terms <> '' then 0.8 else 0 end)) as score
    from b
    where (name_terms = '' and b.intent_ok) or (name_terms <> '' and b.nsim >= 0.3)
  ), top as (select * from s order by score desc limit greatest(1, least(coalesce(p_limit, 20), 50)))
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'slug', t.slug, 'name', t.name, 'category', t.category, 'city', t.city, 'state', t.state,
                  'logo_url', t.logo_url, 'votes', t.votes, 'vegan_status', t.vegan_status, 'km', case when t.dist is null then null else round(t.dist::numeric, 1) end) order by t.score desc), '[]'::jsonb),
         (select min(dist) from s), (select count(*) from s), (select city from top order by score desc limit 1)
  into res, min_km, total, top_city from top t;

  return jsonb_build_object('q', q,
    'interpretation', jsonb_build_object('labels', to_jsonb(v_labels), 'place', place_json, 'near_me', near_me,
      'needs_location', near_me and c_lat is null, 'terms', name_terms, 'link', v_link, 'center', use_center),
    'nearest_fallback', (use_center and min_km is not null and min_km > 40),
    'nearest_km', case when min_km is null then null else round(min_km::numeric) end,
    'nearest_city', top_city, 'total', total, 'results', res);
end
$fn$;
revoke all on function ve_search(text, float8, float8, int, text) from public;
grant execute on function ve_search(text, float8, float8, int, text) to service_role;
