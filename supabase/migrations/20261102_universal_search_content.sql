-- Universal search, the content lane (Sean, 2026-11-02: "I would want to be able to reference all of the podcasts that we've had... not just
-- the directory listings... even pull in some other podcasts"). Three groups beside the listings: moments from our own shows (the quote and
-- the second it starts), our own episode pages, and episodes of the other shows in the Directory (their title and description). Topic words
-- (ve_search_topics) read what a question is about; the listing engine (ve_search) is untouched.

create table if not exists ve_search_topics (
  id bigserial primary key,
  brand text not null default 'vegans-explore',
  phrase text not null,      -- lower case words a person types
  label text not null,       -- how we say it back
  topics text[] not null default '{}',   -- ve_content_topics slugs (the moments' tags)
  terms text not null,       -- websearch words that find it in a title or description
  unique (brand, phrase)
);
alter table ve_search_topics enable row level security;

-- Other shows' episodes, searchable (built from ve_podcast_feeds, refreshed by cron).
create table if not exists ve_search_feed_episodes (
  listing_id uuid not null,
  guid text not null,
  title text not null,
  summary text,
  published timestamptz,
  audio text,
  link text,
  image text,
  tsv tsvector generated always as (setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', left(coalesce(summary, ''), 2500)), 'B')) stored,
  primary key (listing_id, guid)
);
create index if not exists ve_search_feed_episodes_tsv on ve_search_feed_episodes using gin (tsv);
alter table ve_search_feed_episodes enable row level security;

create or replace function ve_search_feed_refresh() returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into ve_search_feed_episodes (listing_id, guid, title, summary, published, audio, link, image)
  select f.listing_id, e->>'guid', e->>'title',
         nullif(btrim(regexp_replace(regexp_replace(coalesce(e->>'summary', ''), '<[^>]+>', ' ', 'g'), '\s+', ' ', 'g')), ''),
         nullif(e->>'date', '')::timestamptz, e->>'audio', e->>'link', e->>'image'
  from ve_podcast_feeds f, jsonb_array_elements(f.episodes) e
  where f.error is null and coalesce(e->>'guid', '') <> '' and coalesce(e->>'title', '') <> ''
  on conflict (listing_id, guid) do update set title = excluded.title, summary = excluded.summary, published = excluded.published,
    audio = excluded.audio, link = excluded.link, image = excluded.image;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function ve_search_feed_refresh() from public;
grant execute on function ve_search_feed_refresh() to service_role;
select ve_search_feed_refresh();
select cron.schedule('ve-search-feed-refresh', '40 */6 * * *', 'select public.ve_search_feed_refresh()');

create or replace function ve_search_topic_add(p_phrase text, p_label text, p_topics text[], p_terms text) returns void language sql as $$
  insert into ve_search_topics (phrase, label, topics, terms) values (p_phrase, p_label, p_topics, p_terms)
  on conflict (brand, phrase) do update set label = excluded.label, topics = excluded.topics, terms = excluded.terms;
$$;

do $t$
declare p text;
begin
  foreach p in array array['convince','persuade','talk to','my family','my parents','my kids','my husband','my wife','my boyfriend','my girlfriend','my mom','my dad','loved ones','family','parents','relatives','relationship','dating'] loop
    perform ve_search_topic_add(p, 'Talking with family', array['family','relationships','going-vegan','activism'], 'family OR parents OR relatives OR "loved ones" OR convince OR persuade OR spouse OR husband OR wife OR kids');
  end loop;
  foreach p in array array['go vegan','going vegan','become vegan','transition','beginner','new to veganism','getting started','just went vegan'] loop
    perform ve_search_topic_add(p, 'Going Vegan', array['going-vegan'], '"going vegan" OR "go vegan" OR transition OR beginner OR "new vegan" OR "first steps" OR "getting started"');
  end loop;
  foreach p in array array['soy','tofu','tempeh'] loop
    perform ve_search_topic_add(p, 'Soy', array['soy'], 'soy OR tofu OR tempeh OR soybeans OR "soy milk"');
  end loop;
  foreach p in array array['protein','amino acids'] loop
    perform ve_search_topic_add(p, 'Protein', array['protein'], 'protein OR "amino acids"');
  end loop;
  foreach p in array array['b12','supplement','supplements','vitamin','vitamins','omega 3','iron','calcium'] loop
    perform ve_search_topic_add(p, 'Supplements and vitamins', array['supplements','nutrition'], 'b12 OR supplement OR supplements OR vitamin OR vitamins OR omega OR iron OR calcium');
  end loop;
  foreach p in array array['nutrition','diet','healthy'] loop
    perform ve_search_topic_add(p, 'Nutrition', array['nutrition'], 'nutrition OR nutrients OR diet OR "whole food"');
  end loop;
  foreach p in array array['gut','digestion','microbiome','bloating'] loop
    perform ve_search_topic_add(p, 'Gut health', array['gut-health'], 'gut OR digestion OR microbiome OR bloating OR fiber');
  end loop;
  foreach p in array array['heart','cholesterol','blood pressure'] loop
    perform ve_search_topic_add(p, 'Heart health', array['heart-health'], 'heart OR cholesterol OR "blood pressure" OR cardiovascular');
  end loop;
  foreach p in array array['diabetes','blood sugar','insulin'] loop
    perform ve_search_topic_add(p, 'Diabetes', array['diabetes'], 'diabetes OR "blood sugar" OR insulin');
  end loop;
  foreach p in array array['weight','lose weight','weight loss','obesity'] loop
    perform ve_search_topic_add(p, 'Weight', array['weight'], '"weight loss" OR "lose weight" OR obesity OR weight');
  end loop;
  foreach p in array array['longevity','aging','live longer'] loop
    perform ve_search_topic_add(p, 'Longevity', array['longevity'], 'longevity OR aging OR "live longer" OR lifespan');
  end loop;
  foreach p in array array['depression','anxiety','mental health'] loop
    perform ve_search_topic_add(p, 'Mental health', array['mental-health'], 'depression OR anxiety OR "mental health" OR mood');
  end loop;
  foreach p in array array['fitness','workout','muscle','lifting','bodybuilding','strength','gym','build muscle'] loop
    perform ve_search_topic_add(p, 'Fitness and strength', array['fitness','bodybuilding','athletes'], 'fitness OR workout OR muscle OR lifting OR bodybuilding OR strength OR athlete OR gym');
  end loop;
  foreach p in array array['athlete','athletes','sports','running','marathon'] loop
    perform ve_search_topic_add(p, 'Athletes', array['athletes','fitness'], 'athlete OR athletes OR sports OR running OR marathon OR olympic');
  end loop;
  foreach p in array array['recipe','recipes','cooking','cook'] loop
    perform ve_search_topic_add(p, 'Cooking', array['cooking'], 'recipe OR recipes OR cooking OR chef OR cookbook');
  end loop;
  perform ve_search_topic_add('meal prep', 'Meal prep', array['meal-prep'], '"meal prep" OR "meal planning" OR batch');
  foreach p in array array['grocery','groceries','shopping'] loop
    perform ve_search_topic_add(p, 'Shopping', array['shopping'], 'grocery OR groceries OR shopping OR supermarket');
  end loop;
  perform ve_search_topic_add('fast food', 'Fast food', array['fast-food'], '"fast food" OR drive OR chain');
  foreach p in array array['vegan business','start a business','starting a business','entrepreneur','opening a restaurant','food business'] loop
    perform ve_search_topic_add(p, 'Vegan business', array['vegan-business','food-brands'], 'business OR entrepreneur OR founder OR startup OR brand OR "opening a restaurant"');
  end loop;
  foreach p in array array['creator','content creator','youtube','influencer','social media'] loop
    perform ve_search_topic_add(p, 'Creators', array['creators'], 'creator OR "content creator" OR youtube OR influencer OR "social media"');
  end loop;
  foreach p in array array['activism','activist','advocacy','protest','outreach'] loop
    perform ve_search_topic_add(p, 'Activism', array['activism','animal-rights'], 'activism OR activist OR advocacy OR protest OR outreach');
  end loop;
  foreach p in array array['animal rights','factory farm','factory farming','slaughter','cruelty'] loop
    perform ve_search_topic_add(p, 'Animal rights', array['animal-rights','farming'], '"animal rights" OR "factory farm" OR "factory farming" OR slaughter OR cruelty');
  end loop;
  perform ve_search_topic_add('sanctuary', 'Sanctuaries', array['sanctuaries'], 'sanctuary OR rescue OR rescued');
  foreach p in array array['climate','environment','climate change','sustainability','planet'] loop
    perform ve_search_topic_add(p, 'Environment', array['environment'], 'climate OR environment OR "climate change" OR sustainability OR planet OR emissions');
  end loop;
  foreach p in array array['farming','farmers','farm'] loop
    perform ve_search_topic_add(p, 'Farming', array['farming'], 'farming OR farmers OR farm OR agriculture');
  end loop;
  foreach p in array array['policy','government','subsidies'] loop
    perform ve_search_topic_add(p, 'Food policy', array['food-policy'], 'policy OR government OR subsidies OR legislation');
  end loop;
  foreach p in array array['hunger','food insecurity'] loop
    perform ve_search_topic_add(p, 'Hunger', array['hunger'], 'hunger OR "food insecurity" OR "food bank"');
  end loop;
  foreach p in array array['community','meetup'] loop
    perform ve_search_topic_add(p, 'Community', array['community'], 'community OR meetup OR "social club"');
  end loop;
  foreach p in array array['travel','vacation','airport','trip'] loop
    perform ve_search_topic_add(p, 'Travel', array['travel'], 'travel OR vacation OR airport OR trip OR abroad');
  end loop;
  foreach p in array array['culture','ethics','moral'] loop
    perform ve_search_topic_add(p, 'Culture and ethics', array['culture','ethics'], 'culture OR ethics OR moral OR philosophy');
  end loop;
  foreach p in array array['beauty','fashion','leather'] loop
    perform ve_search_topic_add(p, 'Beauty and fashion', array['beauty-fashion'], 'beauty OR fashion OR leather OR cosmetics');
  end loop;
  foreach p in array array['dog','dogs','cat','cats','pet','pets'] loop
    perform ve_search_topic_add(p, 'Pets', array['pets'], 'dog OR dogs OR cat OR cats OR pet OR pets');
  end loop;
  foreach p in array array['holiday','holidays','thanksgiving','christmas'] loop
    perform ve_search_topic_add(p, 'Holidays', array['holidays'], 'holiday OR holidays OR thanksgiving OR christmas');
  end loop;
  foreach p in array array['dairy','milk','cheese'] loop
    perform ve_search_topic_add(p, 'Dairy', array['dairy'], 'dairy OR milk OR cheese');
  end loop;
  foreach p in array array['egg','eggs'] loop
    perform ve_search_topic_add(p, 'Eggs', array['eggs'], 'egg OR eggs');
  end loop;
  foreach p in array array['meat alternative','fake meat','impossible','beyond meat'] loop
    perform ve_search_topic_add(p, 'Meat alternatives', array['meat-alternatives'], '"meat alternative" OR "fake meat" OR "plant-based meat" OR impossible OR "beyond meat"');
  end loop;
  foreach p in array array['doctor','doctors','medicine','medical'] loop
    perform ve_search_topic_add(p, 'Medicine', array['medicine'], 'doctor OR doctors OR physician OR medicine OR medical');
  end loop;
end
$t$;

create or replace function ve_search_content(p_q text, p_limit int default 6, p_brand text default 'vegans-explore')
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  q text; rest text; v record; words text := '';
  tps text[] := '{}'; labels text[] := '{}'; termq text[] := '{}'; tsq tsquery;
  mom jsonb; epi jsonb; oth jsonb; lim int := greatest(1, least(coalesce(p_limit, 6), 20));
  cstop text[] := array['how','do','does','did','i','to','my','a','an','the','is','are','was','what','why','can','could','should','you','me','of','in','on','and','or','about','with','be','it','bad','good','vegan','vegans','veganism','plant','based','tips','advice','help','best','for','if','that','this','get','make','your','our','we','they','them','there','any','some','really','know','talk','say','tell','near','looking','find','want'];
begin
  q := lower(coalesce(p_q, ''));
  q := replace(replace(q, '''', ''), '’', '');
  q := btrim(regexp_replace(regexp_replace(q, '[^a-z0-9 ]', ' ', 'g'), '\s+', ' ', 'g'));
  if length(q) < 3 then return jsonb_build_object('intent', jsonb_build_object('labels', '[]'::jsonb, 'topics', '[]'::jsonb), 'moments', '[]'::jsonb, 'episodes', '[]'::jsonb, 'shows', '[]'::jsonb); end if;
  rest := ' ' || q || ' ';
  for v in select * from ve_search_topics where brand = p_brand order by length(phrase) desc, phrase loop
    if position(' ' || v.phrase || ' ' in rest) > 0 then
      tps := tps || v.topics; termq := termq || v.terms;
      if not (v.label = any(labels)) then labels := labels || v.label; end if;
      rest := replace(rest, ' ' || v.phrase || ' ', ' ');
    end if;
  end loop;
  select coalesce(string_agg(tw, ' '), '') into words from unnest(string_to_array(btrim(rest), ' ')) tw where tw <> '' and tw <> all(cstop);
  if cardinality(termq) > 0 then tsq := websearch_to_tsquery('english', array_to_string(termq, ' OR '));
  elsif words <> '' then tsq := plainto_tsquery('english', words); end if;
  if tsq is null or tsq::text = '' then
    return jsonb_build_object('intent', jsonb_build_object('labels', to_jsonb(labels), 'topics', to_jsonb(tps)), 'moments', '[]'::jsonb, 'episodes', '[]'::jsonb, 'shows', '[]'::jsonb);
  end if;

  -- moments: the quote, who said it, the second it starts
  select coalesce(jsonb_agg(t.x order by t.sc desc), '[]'::jsonb) into mom from (
    select jsonb_build_object('id', m.id, 'title', m.title, 'show', m.podcast_show, 'episode', m.episode_number, 'slug', m.slug, 'youtube_id', m.youtube_id,
             'start', m.start_s, 'speaker', m.speaker, 'quote', left(m.quote, 260), 'summary', m.summary, 'topics', m.topics) as x,
           m.sc, row_number() over (partition by m.content_id order by m.sc desc) as rn
    from (select l.*, (case when l.topics && tps then 3 * cardinality(array(select unnest(l.topics) intersect select unnest(tps))) else 0 end
                      + 6 * ts_rank(to_tsvector('english', coalesce(l.summary, '') || ' ' || coalesce(l.quote, '')), tsq)) as sc
          from ve_content_moments_live l
          where (cardinality(tps) > 0 and l.topics && tps) or to_tsvector('english', coalesce(l.summary, '') || ' ' || coalesce(l.quote, '')) @@ tsq) m
    order by m.sc desc limit lim * 3) t where t.rn <= 2 limit lim;

  -- our own episode pages (guest names count)
  select coalesce(jsonb_agg(t.x order by t.sc desc), '[]'::jsonb) into epi from (
    select jsonb_build_object('slug', c.slug, 'title', c.title, 'show', c.podcast_show, 'episode', c.episode_number, 'guest', c.guest_name,
             'summary', left(c.summary, 220), 'published', c.published_at, 'youtube_id', c.youtube_id, 'thumb', c.thumbnail_url) as x,
           (ts_rank_cd(c.search_vector, tsq) + (case when to_tsvector('english', coalesce(c.title, '')) @@ tsq then 1 else 0 end)
            + (case when words <> '' and lower(coalesce(c.guest_name, '')) like '%' || words || '%' then 2 else 0 end)) as sc
    from ve_pulse_content c
    where c.status = 'published' and (c.search_vector @@ tsq or (words <> '' and lower(coalesce(c.guest_name, '')) like '%' || words || '%'))
    order by sc desc limit lim) t;

  -- other shows in the Directory: their title and description
  select coalesce(jsonb_agg(t.x order by t.sc desc), '[]'::jsonb) into oth from (
    select jsonb_build_object('show', l.name, 'show_slug', l.slug, 'guid', e.guid, 'title', e.title, 'summary', left(coalesce(e.summary, ''), 200),
             'published', e.published, 'logo_url', l.logo_url) as x,
           e.sc, row_number() over (partition by e.listing_id order by e.sc desc) as rn
    from (select fe.*, (ts_rank_cd(fe.tsv, tsq, 1) + (case when to_tsvector('english', fe.title) @@ tsq then 0.5 else 0 end)) as sc
          from ve_search_feed_episodes fe where fe.tsv @@ tsq) e
    join listings l on l.id = e.listing_id
    where l.slug not in ('vegans-explore-podcast', 'soflo-vegans-podcast', 'vegans-who-lift-podcast', 'pre-vegans-podcast')
      and not (coalesce(l.tags, '{}') && array['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate'])
      and l.status = 'approved' and e.sc >= 0.2
    order by e.sc desc limit lim * 3) t where t.rn <= 2 limit lim;

  return jsonb_build_object('intent', jsonb_build_object('labels', to_jsonb(labels), 'topics', to_jsonb(tps), 'terms', words),
    'moments', mom, 'episodes', epi, 'shows', oth);
end
$fn$;
revoke all on function ve_search_content(text, int, text) from public;
grant execute on function ve_search_content(text, int, text) to service_role;

-- The content benchmark: real questions and what should come back. known_gap rows are listed, never hidden.
create table if not exists ve_search_content_benchmark (
  id serial primary key,
  q text not null,
  expect_topic text,        -- a topic slug the question should read as
  expect_kind text,         -- moments | episodes | shows | none
  expect_text text,         -- words that should be in a top-3 title, quote or summary of that kind
  known_gap boolean not null default false,
  note text
);
alter table ve_search_content_benchmark enable row level security;
create or replace function ve_search_content_benchmark_run()
returns table (id int, q text, pass boolean, known_gap boolean, topics text, n_moments int, n_episodes int, n_shows int, top1 text, why text)
language sql stable security definer set search_path = public as $$
  with r as (select b.*, ve_search_content(b.q, 6) j from ve_search_content_benchmark b),
  d as (select r.*, jsonb_array_length(r.j->'moments') nm, jsonb_array_length(r.j->'episodes') ne, jsonb_array_length(r.j->'shows') ns,
        (select string_agg(x, ' ') from jsonb_array_elements_text(r.j->'intent'->'topics') x) tps,
        (select string_agg(lower(coalesce(e->>'title','') || ' ' || coalesce(e->>'quote','') || ' ' || coalesce(e->>'summary','') || ' ' || coalesce(e->>'guest','')), ' ')
           from (select e from jsonb_array_elements(case r.expect_kind when 'moments' then r.j->'moments' when 'episodes' then r.j->'episodes' when 'shows' then r.j->'shows' else '[]'::jsonb end) e limit 3) z) top3,
        coalesce(r.j->'moments'->0->>'quote', r.j->'episodes'->0->>'title', r.j->'shows'->0->>'title') t1
        from r),
  c as (select d.*,
    (d.expect_topic is null or coalesce(d.tps like '%' || d.expect_topic || '%', false)) ok_topic,
    (case d.expect_kind when 'none' then d.nm + d.ne + d.ns = 0
       when 'moments' then d.nm > 0 when 'episodes' then d.ne > 0 when 'shows' then d.ns > 0 else true end) ok_kind,
    (d.expect_text is null or coalesce(d.top3 like '%' || lower(d.expect_text) || '%', false)) ok_text from d)
  select c.id, c.q, (c.ok_topic and c.ok_kind and c.ok_text), c.known_gap, c.tps, c.nm, c.ne, c.ns, left(c.t1, 110),
    concat_ws(', ', case when not c.ok_topic then 'topic' end, case when not c.ok_kind then 'kind' end, case when not c.ok_text then 'text' end)
  from c order by c.id;
$$;
revoke all on function ve_search_content_benchmark_run() from public;
grant execute on function ve_search_content_benchmark_run() to service_role;

insert into ve_search_content_benchmark (q, expect_topic, expect_kind, expect_text, known_gap, note) values
 ('how do I convince my family to go vegan', 'family', 'moments', null, false, 'Sean 2026-11-02'),
 ('how do I convince my family to go vegan', 'going-vegan', 'shows', null, false, 'other shows by title and description'),
 ('is soy bad for you', 'soy', 'episodes', 'soy', false, null),
 ('where do vegans get protein', 'protein', 'moments', null, false, null),
 ('do I need a b12 supplement', 'supplements', 'moments', null, false, null),
 ('how do I start going vegan', 'going-vegan', 'moments', null, false, null),
 ('vegan bodybuilding', 'bodybuilding', 'episodes', null, false, null),
 ('thanksgiving dinner for vegans', 'holidays', 'shows', null, false, null),
 ('what should I feed my dog', 'pets', 'shows', null, false, null),
 ('is dairy bad for you', 'dairy', 'moments', null, false, null),
 ('veganism and climate change', 'environment', 'episodes', null, false, null),
 ('how to lose weight on a vegan diet', 'weight', 'moments', null, false, null),
 ('vegan and diabetes', 'diabetes', 'moments', null, false, null),
 ('vegan athletes', 'athletes', 'episodes', null, false, null),
 ('how to talk to someone about veganism', 'activism', 'moments', null, false, null),
 ('starting a vegan business', 'vegan-business', 'episodes', null, false, null),
 ('vegan travel tips', 'travel', 'shows', null, false, null),
 ('gut health', 'gut-health', 'moments', null, false, null),
 ('chris moore', null, 'episodes', 'moore', false, 'a guest by name'),
 ('vegan restaurants in Claremont', null, 'none', null, false, 'a place question: the listings answer it, content stays out'),
 ('sushi near me', null, 'none', null, false, 'a place question'),
 ('tell me about the heart', 'heart-health', 'episodes', null, false, 'a loose word'),
 ('factory farming', 'animal-rights', 'moments', null, false, null),
 ('what is the best vegan documentary on netflix', null, 'none', null, true, 'streaming catalogs are not in our content yet');
