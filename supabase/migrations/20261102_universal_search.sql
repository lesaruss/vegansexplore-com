-- Universal search (Sean, 2026-11-02): "I should be able to search what I'm looking for, and then it just shows up, no matter what the
-- category is." One engine (ve_search) and three sets of rows per brand: the vocabulary (what a word means), the places (where a
-- word is) and the log (what people looked for). A new brand adds rows, never code. BOSS run 2026-11-02, playbook ve-universal-search.
-- Phase 1: listings only (Directory, People, Products and every kind of listing). Events, Guides and the Pulse come next.

create table if not exists ve_search_vocab (
  id bigserial primary key,
  brand text not null default 'vegans-explore',
  phrase text not null,            -- lower case, letters and spaces, singular (plurals are matched too)
  label text not null,             -- how we say it back to the visitor
  cats text[] not null default '{}',      -- listing categories (any of)
  kinds text[] not null default '{}',     -- listings.product_kinds (any of)
  cuisines text[] not null default '{}',  -- listings.cuisines (any of)
  link text,                       -- a deep link into the Directory when the intent is one shelf
  unique (brand, phrase)
);
create table if not exists ve_search_places (
  id bigserial primary key,
  name text not null,
  state text,
  lat float8 not null,
  lng float8 not null,
  weight int not null default 0,
  source text not null default 'listings'
);
create unique index if not exists ve_search_places_uq on ve_search_places (lower(name), coalesce(lower(state), ''));
create table if not exists ve_search_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  brand text not null default 'vegans-explore',
  q text not null,
  place text,
  intent text,
  results int,
  zero boolean,
  nearest_km numeric,
  visitor text
);
alter table ve_search_vocab enable row level security;
alter table ve_search_places enable row level security;
alter table ve_search_log enable row level security;

-- Places we can resolve: every city a listing sits in (average of its listings' pins), plus a few the team adds by hand.
insert into ve_search_places (name, state, lat, lng, weight, source)
select max(address_city), max(address_state), avg(latitude), avg(longitude), count(*), 'listings'
from listings
where status = 'approved' and latitude is not null and coalesce(address_city, '') <> ''
group by lower(address_city), lower(coalesce(address_state, ''))
on conflict do nothing;
-- Hand-added (approximate city centers): the Inland Empire towns beside Pomona, where Sean searched on 2026-11-02 and found nothing.
insert into ve_search_places (name, state, lat, lng, weight, source) values
  ('Claremont', 'CA', 34.0967, -117.7198, 5, 'seed'),
  ('Upland', 'CA', 34.0975, -117.6484, 3, 'seed'),
  ('Ontario', 'CA', 34.0633, -117.6509, 3, 'seed'),
  ('La Verne', 'CA', 34.1008, -117.7678, 2, 'seed'),
  ('San Dimas', 'CA', 34.1067, -117.8067, 2, 'seed'),
  ('Rancho Cucamonga', 'CA', 34.1064, -117.5931, 3, 'seed')
on conflict do nothing;

-- Vocabulary. A phrase may carry categories, product kinds and cuisines: all that are given must match (a cuisine inside a category).
create or replace function ve_search_vocab_add(p_phrase text, p_label text, p_cats text[], p_kinds text[], p_cui text[], p_link text default null)
returns void language sql as $$
  insert into ve_search_vocab (phrase, label, cats, kinds, cuisines, link)
  values (p_phrase, p_label, coalesce(p_cats, '{}'), coalesce(p_kinds, '{}'), coalesce(p_cui, '{}'), p_link)
  on conflict (brand, phrase) do update set label = excluded.label, cats = excluded.cats, kinds = excluded.kinds, cuisines = excluded.cuisines, link = excluded.link;
$$;

do $v$
declare
  eat text[] := array['Restaurants','Bakeries & Cafes','Food Trucks'];
  p text;
begin
  -- somewhere to eat
  foreach p in array array['restaurant','place to eat','somewhere to eat','where to eat','something to eat','eat','eat out','dinner','lunch','food','diner','dining','bite','meal','takeout','take out'] loop
    perform ve_search_vocab_add(p, 'Restaurants', eat, null, null);
  end loop;
  foreach p in array array['bakery','cafe','coffee','coffee shop','pastry','donut','doughnut','cake','cupcake'] loop
    perform ve_search_vocab_add(p, 'Bakeries & cafes', array['Bakeries & Cafes'], null, null);
  end loop;
  perform ve_search_vocab_add('food truck', 'Food trucks', array['Food Trucks'], null, null);
  perform ve_search_vocab_add('vendor', 'Vendors', array['Vendors'], null, null);
  perform ve_search_vocab_add('catering', 'Catering', array['Catering'], null, null);
  perform ve_search_vocab_add('caterer', 'Catering', array['Catering'], null, null);
  foreach p in array array['market','farmers market','grocery','grocery store','supermarket','grocer'] loop
    perform ve_search_vocab_add(p, 'Markets', array['Markets'], null, null);
  end loop;
  perform ve_search_vocab_add('meal prep', 'Meal prep', array['Meal Prep'], null, null);
  perform ve_search_vocab_add('meal delivery', 'Meal prep', array['Meal Prep'], null, null);
  -- what kind of food
  perform ve_search_vocab_add('pizza', 'Pizza', eat, null, array['italian']);
  perform ve_search_vocab_add('italian', 'Italian', eat, null, array['italian']);
  perform ve_search_vocab_add('pasta', 'Italian', eat, null, array['italian']);
  perform ve_search_vocab_add('mexican', 'Mexican', eat, null, array['mexican']);
  perform ve_search_vocab_add('taco', 'Mexican', eat, null, array['mexican']);
  perform ve_search_vocab_add('burrito', 'Mexican', eat, null, array['mexican']);
  perform ve_search_vocab_add('cuban', 'Cuban', eat, null, array['cuban']);
  perform ve_search_vocab_add('thai', 'Thai', eat, null, array['thai']);
  perform ve_search_vocab_add('chinese', 'Chinese', eat, null, array['chinese']);
  perform ve_search_vocab_add('japanese', 'Japanese', eat, null, array['japanese']);
  perform ve_search_vocab_add('sushi', 'Japanese & sushi', eat, null, array['japanese']);
  perform ve_search_vocab_add('korean', 'Korean', eat, null, array['korean']);
  perform ve_search_vocab_add('indian', 'Indian', eat, null, array['indian']);
  perform ve_search_vocab_add('ethiopian', 'Ethiopian', eat, null, array['ethiopian']);
  perform ve_search_vocab_add('vietnamese', 'Vietnamese', eat, null, array['vietnamese']);
  perform ve_search_vocab_add('pho', 'Vietnamese', eat, null, array['vietnamese']);
  perform ve_search_vocab_add('mediterranean', 'Mediterranean', eat, null, array['mediterranean']);
  perform ve_search_vocab_add('middle eastern', 'Middle Eastern', eat, null, array['middle_eastern']);
  perform ve_search_vocab_add('soul food', 'Soul food', eat, null, array['soul']);
  perform ve_search_vocab_add('caribbean', 'Caribbean', eat, null, array['caribbean']);
  perform ve_search_vocab_add('comfort food', 'Comfort food', eat, null, array['american']);
  perform ve_search_vocab_add('burger', 'Burgers', eat, null, array['burgers']);
  perform ve_search_vocab_add('brunch', 'Breakfast & brunch', eat, null, array['brunch']);
  perform ve_search_vocab_add('breakfast', 'Breakfast & brunch', eat, null, array['brunch']);
  perform ve_search_vocab_add('juice', 'Juice bars', eat, null, array['raw']);
  perform ve_search_vocab_add('smoothie', 'Juice bars', eat, null, array['raw']);
  perform ve_search_vocab_add('salad', 'Bowls & salads', eat, null, array['bowls']);
  perform ve_search_vocab_add('bowl', 'Bowls & salads', eat, null, array['bowls']);
  perform ve_search_vocab_add('dessert', 'Desserts', array['Restaurants','Bakeries & Cafes','Food Trucks'], null, array['desserts']);
  perform ve_search_vocab_add('ice cream', 'Desserts', array['Restaurants','Bakeries & Cafes','Food Trucks'], null, array['desserts']);
  -- things you buy anywhere (Products shelves)
  foreach p in array array['egg substitute','egg replacer','egg alternative','egg replacement','egg free','eggless','egg','vegan egg','just egg'] loop
    perform ve_search_vocab_add(p, 'Egg alternatives', null, array['egg'], null, '/directory?tab=products&sub=food-and-drink&kinds=egg');
  end loop;
  foreach p in array array['milk','dairy free','non dairy','nondairy','dairy alternative','milk alternative','plant milk','oat milk','almond milk','cheese','butter','yogurt','creamer','cream cheese'] loop
    perform ve_search_vocab_add(p, 'Dairy alternatives', null, array['dairy'], null, '/directory?tab=products&sub=food-and-drink&kinds=dairy');
  end loop;
  foreach p in array array['meat substitute','meat alternative','meat replacement','plant based meat','mock meat','fake meat','sausage','bacon','jerky','deli meat','chicken nugget','nugget'] loop
    perform ve_search_vocab_add(p, 'Meat alternatives', null, array['meat'], null, '/directory?tab=products&sub=food-and-drink&kinds=meat');
  end loop;
  foreach p in array array['seafood alternative','fish alternative','vegan fish','vegan tuna','tuna','shrimp alternative'] loop
    perform ve_search_vocab_add(p, 'Seafood alternatives', null, array['seafood'], null, '/directory?tab=products&sub=food-and-drink&kinds=seafood');
  end loop;
  foreach p in array array['snack','chip','candy','chocolate','cookie'] loop
    perform ve_search_vocab_add(p, 'Snacks and sweets', null, array['snacks'], null, '/directory?tab=products&sub=food-and-drink&kinds=snacks');
  end loop;
  perform ve_search_vocab_add('frozen meal', 'Frozen meals', null, array['frozen'], null, '/directory?tab=products&sub=food-and-drink&kinds=frozen');
  perform ve_search_vocab_add('protein powder', 'Protein', null, array['protein'], null);
  perform ve_search_vocab_add('protein', 'Protein', null, array['protein'], null);
  foreach p in array array['supplement','nutrition','multivitamin'] loop
    perform ve_search_vocab_add(p, 'Nutrition & supplements', array['Nutrition & Supplements'], null, null);
  end loop;
  foreach p in array array['vitamin','b12'] loop
    perform ve_search_vocab_add(p, 'Vitamins & minerals', array['Nutrition & Supplements'], array['vitamins'], null);
  end loop;
  foreach p in array array['shoe','sneaker','boot','sandal'] loop
    perform ve_search_vocab_add(p, 'Vegan shoes', array['Clothing and Fashion'], array['shoes'], null);
  end loop;
  foreach p in array array['clothing','clothes','apparel','fashion','shirt','jacket','dress'] loop
    perform ve_search_vocab_add(p, 'Clothing & fashion', array['Clothing and Fashion'], null, null);
  end loop;
  foreach p in array array['makeup','lipstick','mascara'] loop
    perform ve_search_vocab_add(p, 'Makeup', array['Beauty and Personal Care'], array['makeup'], null);
  end loop;
  foreach p in array array['skincare','skin care','moisturizer','sunscreen'] loop
    perform ve_search_vocab_add(p, 'Skincare', array['Beauty and Personal Care'], array['skincare'], null);
  end loop;
  foreach p in array array['beauty','cosmetic','shampoo','haircare','hair care','soap','fragrance','perfume'] loop
    perform ve_search_vocab_add(p, 'Beauty & personal care', array['Beauty and Personal Care'], null, null);
  end loop;
  -- people who help
  foreach p in array array['doctor','physician','dr','md','gp','family doctor','primary care'] loop
    perform ve_search_vocab_add(p, 'Doctors', array['Physicians','Health Professionals'], null, null);
  end loop;
  foreach p in array array['dentist','dietitian','dietician','nutritionist','therapist','counselor','counsellor','chiropractor','psychologist','naturopath','acupuncturist'] loop
    perform ve_search_vocab_add(p, 'Health professionals', array['Health Professionals','Health Experts','Physicians'], null, null);
  end loop;
  perform ve_search_vocab_add('health expert', 'Health experts', array['Health Experts','Physicians'], null, null);
  foreach p in array array['coach','trainer','personal trainer','consultant','fitness','gym','yoga'] loop
    perform ve_search_vocab_add(p, 'Coaches & trainers', array['Coaches and Consultants','Health and Wellness'], null, null);
  end loop;
  foreach p in array array['vet','veterinarian','groomer','pet'] loop
    perform ve_search_vocab_add(p, 'Animal care', array['Animal Care'], null, null);
  end loop;
  perform ve_search_vocab_add('chef', 'Chefs', array['Chefs'], null, null);
  foreach p in array array['creator','influencer','content creator'] loop
    perform ve_search_vocab_add(p, 'Content creators', array['Content Creators'], null, null);
  end loop;
  perform ve_search_vocab_add('athlete', 'Athletes', array['Athletes'], null, null);
  perform ve_search_vocab_add('activist', 'Activists', array['Activists'], null, null);
  -- community and animals
  perform ve_search_vocab_add('sanctuary', 'Sanctuaries', array['Sanctuaries'], null, null);
  perform ve_search_vocab_add('rescue', 'Rescues', array['Rescues'], null, null);
  perform ve_search_vocab_add('animal rescue', 'Rescues', array['Rescues'], null, null);
  foreach p in array array['nonprofit','non profit','charity','organization'] loop
    perform ve_search_vocab_add(p, 'Nonprofits', array['Nonprofits','Rescues','Sanctuaries'], null, null);
  end loop;
  foreach p in array array['group','meetup','social club','club','community'] loop
    perform ve_search_vocab_add(p, 'Groups', array['Groups'], null, null);
  end loop;
  -- media and services
  perform ve_search_vocab_add('podcast', 'Podcasts', array['Podcasts'], null, null);
  perform ve_search_vocab_add('youtube', 'YouTube channels', array['YouTube'], null, null);
  foreach p in array array['documentary','film','movie'] loop
    perform ve_search_vocab_add(p, 'Documentaries & films', array['Documentaries & Films'], null, null);
  end loop;
  foreach p in array array['book','cookbook'] loop
    perform ve_search_vocab_add(p, 'Books', array['Books'], null, null);
  end loop;
  perform ve_search_vocab_add('news', 'News outlets', array['News Outlets'], null, null);
  perform ve_search_vocab_add('studio', 'Studios', array['Studios'], null, null);
  foreach p in array array['venue','event venue'] loop
    perform ve_search_vocab_add(p, 'Event venues', array['Event Venues'], null, null);
  end loop;
  perform ve_search_vocab_add('marketing', 'Marketing & growth', array['Marketing & Growth'], null, null);
end
$v$;

-- The engine. Reads a sentence, finds the place and the kind of thing, and returns what fits, nearest first. Pure read: the log is
-- written by the edge function. Distance counts for places you walk into, never for products you can buy anywhere.
create or replace function ve_search(p_q text, p_lat float8 default null, p_lng float8 default null, p_limit int default 20, p_brand text default 'vegans-explore')
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  q text; rest text; near_me boolean := false;
  pl record; v record; n text; frag text; prep text; cand text;
  v_cats text[] := '{}'; v_kinds text[] := '{}'; v_cui text[] := '{}'; v_labels text[] := '{}'; v_link text;
  c_lat float8 := null; c_lng float8 := null; use_center boolean := false; place_json jsonb := null;
  name_terms text := ''; has_intent boolean; res jsonb; min_km float8; total int; top_city text;
  stop text[] := array['vegan','vegans','plant','based','plantbased','best','top','good','great','find','me','for','a','an','the','some','any','places','place','spots','spot','near','nearby','with','that','are','is','i','want','looking','to','get','buy','my','of','and','or','in','at','around','close','shop','store','stores'];
  found boolean := false;
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
    for pl in select name, state, lat, lng from ve_search_places where position(lower(name) in q) > 0 order by length(name) desc, weight desc loop
      foreach cand in array array[lower(pl.name) || ' ' || lower(coalesce(pl.state, '~')), lower(pl.name)] loop
        foreach prep in array array['in', 'near', 'around', 'at', ''] loop
          if prep <> '' then frag := ' ' || prep || ' ' || cand || ' '; else frag := ' ' || cand || ' '; end if;
          if (prep <> '' and position(frag in rest) > 0) or (prep = '' and right(rest, length(frag)) = frag) then
            found := true;
            place_json := jsonb_build_object('name', pl.name, 'state', pl.state, 'lat', pl.lat, 'lng', pl.lng);
            c_lat := pl.lat; c_lng := pl.lng;
            rest := replace(rest, frag, ' ');
            exit;
          end if;
        end loop;
        exit when found;
      end loop;
      exit when found;
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
           l.vegan_status in ('fully_vegan', 'vegan') as full_vegan
    from listings l
    where l.status = 'approved' and coalesce(l.business_status, '') <> 'CLOSED_PERMANENTLY' and l.category <> 'Uncategorized'
      and not (coalesce(l.tags, '{}') && array['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-directory-business-member'])
      and not (l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep')
               and coalesce(l.vegan_status, '') in ('vegan_options', 'vegan_friendly') and coalesce(l.voter_count, 0) < 10
               and l.vetted_at is null and l.claim_status <> 'verified')
  ), s as (
    select b.*, (b.nsim * 4 + ln(1 + b.votes) * 0.35 + (case when b.full_vegan then 0.6 else 0 end)
                 + (case when b.dist is null then 0 else 4 * exp(-b.dist / 20.0) end) + (case when b.intent_ok and name_terms <> '' then 0.8 else 0 end)) as score
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
