-- The universal search benchmark (BOSS, Sean 2026-11-02): real searches with what a person should get. Score it before and after every
-- change to ve_search_vocab, ve_search_places or ve_search; the interface ships only when the pass rate holds. known_gap rows are
-- things we know do not work yet; they are listed, never hidden, and left out of the pass rate.
create table if not exists ve_search_benchmark (
  id serial primary key,
  q text not null,
  lat float8, lng float8,                -- where the searcher is, for "near me"
  expect_label text,                     -- the intent we should read (one of the labels)
  expect_place text,                     -- the place we should resolve
  expect_name text,                      -- a listing name that should be in the top 3
  expect_cat text,                       -- a category that should be in the top 3
  expect_city text,                      -- the first result's city
  known_gap boolean not null default false,
  note text
);
alter table ve_search_benchmark enable row level security;
create or replace function ve_search_benchmark_run()
returns table (id int, q text, pass boolean, known_gap boolean, got_labels text, got_place text, top3 text, why text)
language sql stable security definer set search_path = public as $$
  with r as (select b.*, ve_search(b.q, b.lat, b.lng, 10) as j from ve_search_benchmark b),
  d as (select r.*, (select string_agg(x->>'name' || ' [' || coalesce(x->>'category','') || ', ' || coalesce(x->>'city','') || ']', '; ')
                     from (select x from jsonb_array_elements(r.j->'results') x limit 3) t) as t3,
        (select string_agg(x->>'name', '|') from (select x from jsonb_array_elements(r.j->'results') x limit 3) t) as names3,
        (select string_agg(x->>'category', '|') from (select x from jsonb_array_elements(r.j->'results') x limit 3) t) as cats3,
        r.j->'results'->0->>'city' as city1,
        (select string_agg(l, '|') from jsonb_array_elements_text(r.j->'interpretation'->'labels') l) as labs
        from r)
  select d.id, d.q,
    (coalesce(d.expect_label is null or d.labs ilike '%' || d.expect_label || '%', true)
     and coalesce(d.expect_place is null or lower(d.j->'interpretation'->'place'->>'name') = lower(d.expect_place), true)
     and coalesce(d.expect_name is null or d.names3 ilike '%' || d.expect_name || '%', true)
     and coalesce(d.expect_cat is null or d.cats3 ilike '%' || d.expect_cat || '%', true)
     and coalesce(d.expect_city is null or lower(coalesce(d.city1, '')) = lower(d.expect_city), true)) as pass,
    d.known_gap, d.labs, d.j->'interpretation'->'place'->>'name', d.t3,
    concat_ws(', ', case when d.expect_label is not null and not coalesce(d.labs ilike '%' || d.expect_label || '%', false) then 'label' end,
      case when d.expect_place is not null and lower(coalesce(d.j->'interpretation'->'place'->>'name', '')) <> lower(d.expect_place) then 'place' end,
      case when d.expect_name is not null and not coalesce(d.names3 ilike '%' || d.expect_name || '%', false) then 'name' end,
      case when d.expect_cat is not null and not coalesce(d.cats3 ilike '%' || d.expect_cat || '%', false) then 'category' end,
      case when d.expect_city is not null and lower(coalesce(d.city1, '')) <> lower(d.expect_city) then 'city' end)
  from d order by d.id;
$$;
revoke all on function ve_search_benchmark_run() from public;
grant execute on function ve_search_benchmark_run() to service_role;

insert into ve_search_benchmark (q, lat, lng, expect_label, expect_place, expect_name, expect_cat, expect_city, known_gap, note) values
 ('egg substitute', null, null, 'Egg alternatives', null, 'JUST Egg', null, null, false, 'Sean 2026-11-02'),
 ('vegan restaurants in Claremont', null, null, 'Restaurants', 'Claremont', null, null, 'Pomona', false, 'Sean 2026-11-02: no Claremont listings, nearest first'),
 ('vegan doctor', null, null, 'Doctors', null, null, 'Physicians', null, false, 'Sean 2026-11-02'),
 ('egg replacer', null, null, 'Egg alternatives', null, null, null, null, false, null),
 ('eggless baking', null, null, 'Egg alternatives', null, null, null, null, false, null),
 ('vegan cheese', null, null, 'Dairy alternatives', null, null, null, null, false, null),
 ('oat milk', null, null, 'Dairy alternatives', null, null, null, null, false, null),
 ('plant based meat', null, null, 'Meat alternatives', null, null, null, null, false, null),
 ('vegan sausage', null, null, 'Meat alternatives', null, null, null, null, false, null),
 ('where to eat in Miami', null, null, 'Restaurants', 'Miami', null, null, 'Miami', false, null),
 ('pizza in Philadelphia', null, null, 'Pizza', 'Philadelphia', null, null, 'Philadelphia', false, null),
 ('vegan brunch in Atlanta', null, null, 'brunch', 'Atlanta', null, null, 'Atlanta', false, null),
 ('bakery in Atlanta', null, null, 'Bakeries', 'Atlanta', 'Vegan Sweetie', null, 'Atlanta', false, null),
 ('cookies in Miami', null, null, null, 'Miami', 'Courtney', null, 'Miami', false, 'a snack brand or a bakery? tests the ambiguity'),
 ('love life cafe', null, null, null, null, 'Love Life Cafe', null, null, false, 'a name'),
 ('sen saigon', null, null, null, null, 'Sen Saigon', null, null, false, 'a name'),
 ('crossroads', null, null, null, null, 'Crossroads Kitchen', null, null, false, 'half a name'),
 ('christophers kitchen', null, null, null, null, 'Christopher', null, null, false, 'no apostrophe'),
 ('dinas vegan deli', null, null, null, null, 'Dina', null, null, false, 'no apostrophe'),
 ('mexican food in Los Angeles', null, null, 'Mexican', 'Los Angeles', null, null, 'Los Angeles', false, null),
 ('vegan food near me', 25.7617, -80.1918, 'Restaurants', null, null, null, 'Miami', false, 'phone in Miami'),
 ('coffee near me', 33.749, -84.388, 'Bakeries', null, null, null, 'Atlanta', false, 'phone in Atlanta'),
 ('doctor near me', 33.749, -84.388, 'Doctors', null, null, 'Physicians', null, false, 'doctors are people, no pin'),
 ('will bulsiewicz', null, null, null, null, 'Bulsiewicz', null, null, false, 'a person'),
 ('neal barnard', null, null, null, null, 'Barnard', null, null, false, 'a person'),
 ('nutritionist', null, null, 'Health professionals', null, null, null, null, false, null),
 ('dietitian in New York', null, null, 'Health professionals', 'New York', null, null, null, false, null),
 ('animal rescue', null, null, 'Rescues', null, null, 'Rescues', null, false, null),
 ('sanctuary', null, null, 'Sanctuaries', null, null, 'Sanctuaries', null, false, null),
 ('rescues near me', 25.7617, -80.1918, 'Rescues', null, null, null, null, false, null),
 ('podcast', null, null, 'Podcasts', null, null, 'Podcasts', null, false, null),
 ('rich roll', null, null, null, null, 'Rich Roll', null, null, false, 'a show'),
 ('vegan documentary', null, null, 'Documentaries', null, null, 'Documentaries', null, false, null),
 ('cookbook', null, null, 'Books', null, null, 'Books', null, false, null),
 ('b12 supplement', null, null, 'Nutrition', null, null, null, null, false, null),
 ('vegan shoes', null, null, 'shoes', null, null, 'Clothing', null, false, null),
 ('sneakers', null, null, 'shoes', null, null, null, null, false, null),
 ('makeup', null, null, 'Makeup', null, null, 'Beauty', null, false, null),
 ('skincare', null, null, 'Skincare', null, null, 'Beauty', null, false, null),
 ('vegan leather jacket', null, null, 'Clothing', null, null, 'Clothing', null, false, null),
 ('meal prep in Los Angeles', null, null, 'Meal prep', 'Los Angeles', null, null, null, false, null),
 ('catering in Miami', null, null, 'Catering', 'Miami', null, null, 'Miami', false, null),
 ('food truck in Orlando', null, null, 'Food trucks', 'Orlando', null, null, 'Orlando', false, null),
 ('farmers market in Atlanta', null, null, 'Markets', 'Atlanta', null, null, 'Atlanta', false, null),
 ('vegan restaurants in London', null, null, 'Restaurants', 'London', null, null, 'London', false, null),
 ('restaurants in Washington DC', null, null, 'Restaurants', 'Washington', null, null, 'Washington', false, null),
 ('burgers in Fort Lauderdale', null, null, 'Burgers', 'Fort Lauderdale', null, null, 'Fort Lauderdale', false, null),
 ('restaurants in nyc', null, null, 'Restaurants', 'New York', null, null, null, false, 'a nickname for a city'),
 ('vegan icecream', null, null, 'Desserts', null, null, null, null, false, 'a word run together'),
 ('resturant in miami', null, null, 'Restaurants', 'Miami', null, null, null, false, 'a misspelling'),
 ('hard rock stadium', null, null, null, null, 'Hard Rock', null, null, true, 'a venue in the Stadium Guide, not a listing yet'),
 ('plant milk at publix', null, null, 'Dairy alternatives', null, null, null, null, true, 'what a store carries is not in search yet');
