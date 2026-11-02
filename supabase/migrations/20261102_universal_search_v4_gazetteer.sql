-- Gazetteer (2026-11-02): ve_search_places holds GeoNames cities500 (236,874 places; loaded by a one-time function, now the stub),
-- so any town resolves. Place words are found by index, big towns win a tie (population), and a word that is also a town needs in/near/around.
create or replace function ve_search_core(p_q text, p_lat float8 default null, p_lng float8 default null, p_limit int default 20, p_brand text default 'vegans-explore')
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  q text; rest text; near_me boolean := false;
  pl record; v record; n text; frag text; prep text; cand text;
  v_cats text[] := '{}'; v_kinds text[] := '{}'; v_cui text[] := '{}'; v_labels text[] := '{}'; v_link text;
  c_lat float8 := null; c_lng float8 := null; use_center boolean := false; place_json jsonb := null;
  name_terms text := ''; has_intent boolean; res jsonb; min_km float8; total int; top_city text;
  stop text[] := array['vegan','vegans','plant','based','plantbased','best','top','good','great','find','me','for','a','an','the','some','any','places','place','spots','spot','near','nearby','with','that','are','is','i','want','looking','to','get','buy','my','of','and','or','in','at','around','close','shop','store','stores'];
  placed boolean := false; fw text; toks text[]; grams text[] := '{}'; i int; j int;
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
    -- every run of one to four words in the sentence is a possible place; the index finds the ones we know
    toks := string_to_array(btrim(rest), ' ');
    for i in 1..coalesce(array_length(toks, 1), 0) loop
      for j in i..least(i + 3, array_length(toks, 1)) loop
        grams := grams || array_to_string(toks[i:j], ' ');
      end loop;
    end loop;
    for pl in select name, state, lat, lng, shows_as, key, source from ve_search_places
              where key = any(grams) and (length(key) >= 3 or source = 'alias')
              order by length(key) desc, coalesce(population, 0) desc loop
      foreach cand in array array[pl.key || ' ' || lower(coalesce(pl.state, '~')), pl.key] loop
        foreach prep in array array['in', 'near', 'around', 'at', ''] loop
          if prep <> '' then frag := ' ' || prep || ' ' || cand || ' '; else frag := ' ' || cand || ' '; end if;
          -- a word that is also a town ("reading", "mobile", "cheese") is a place only after in, near or around
          if prep = '' and (cand = pl.key) and (length(pl.key) <= 2 or (pl.source = 'geonames' and coalesce(pl.population, 0) < 20000) or exists (select 1 from ve_search_place_words w where w.word = pl.key)
                or exists (select 1 from ve_search_vocab vv where vv.brand = p_brand and vv.phrase = pl.key)) then continue; end if;
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
  for fw in select x from unnest(string_to_array(btrim(rest), ' ')) x where length(x) >= 5 and x <> all(stop) loop
    select * into v from ve_search_vocab where brand = p_brand
      and similarity(replace(phrase, ' ', ''), fw) >= (case when length(fw) >= 7 then 0.55 else 0.72 end)
    order by similarity(replace(phrase, ' ', ''), fw) desc limit 1;
    if found then
      rest := regexp_replace(rest, ' ' || fw || ' ', ' ', 'g');
      v_cats := v_cats || v.cats; v_kinds := v_kinds || v.kinds; v_cui := v_cui || v.cuisines;
      if not (v.label = any(v_labels)) then v_labels := v_labels || v.label; end if;
      if v_link is null and array_length(v_labels, 1) = 1 then v_link := v.link; end if;
    end if;
  end loop;

  select coalesce(string_agg(tw, ' '), '') into name_terms
  from unnest(string_to_array(btrim(rest), ' ')) tw where tw <> '' and tw <> all(stop);
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
revoke all on function ve_search_core(text, float8, float8, int, text) from public;
grant execute on function ve_search_core(text, float8, float8, int, text) to service_role;
