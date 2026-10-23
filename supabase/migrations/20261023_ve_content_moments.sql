-- Content index, Step 2: moments by topic (Sean, 2026-10-23: "you can start step two now, and I'll continue uploading").
-- Each timestamped transcript (ve_content_transcripts) is read by the Background writer (dispatcher source
-- content_moments_tag, Station 2, Sean's Claude subscription, no paid API) and cut into moments: where a topic is talked
-- about, from what second to what second, who is speaking, their words and a one-line summary, tagged with topics from
-- ve_content_topics. Step 3 (search and clips) reads ve_content_moments.
--
-- A transcript is queued for tagging when it is saved or replaced, or turns ready again (trigger below), so every file
-- Sean drops is tagged on the next run without anyone asking. ve_content_moments_save() checks every moment before it is
-- kept: its topics are on the list, its times fit the episode, and its quote is really said in the transcript within
-- 30 seconds of its start. Moments follow their transcript: moving a transcript to another episode moves its moments,
-- and a transcript set aside (status not ready) keeps its moments out of search. Nothing is ever deleted: each save is a
-- run (run_id), the transcript points at its latest (moments_run), and ve_content_moments_live is what counts.
-- Applied 2026-10-23 in three parts (_tables, _queue, _save); the job went live after a hand-tagged test episode.
--
-- tag_status on a transcript:
--   queued   waiting for the writer     tagging  a run has it (stale after 30 minutes)
--   tagged   moments saved (tag_note)   failed   the writer could not (tag_error says why)

create table if not exists public.ve_content_topics (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null,
  about text,
  sort int not null default 100,
  created_at timestamptz not null default now()
);
alter table public.ve_content_topics enable row level security;

insert into public.ve_content_topics (slug, label, about, sort) values
  ('dairy', 'Dairy', 'Milk, cheese, butter, the dairy industry and its replacements', 10),
  ('eggs', 'Eggs', 'Eggs, the egg industry and egg replacements', 11),
  ('meat-alternatives', 'Meat alternatives', 'Plant-based meat, Beyond, Impossible, seitan, jackfruit', 12),
  ('soy', 'Soy', 'Soy foods, tofu, tempeh and the soy myths', 13),
  ('protein', 'Protein', 'Getting enough protein, protein sources and powders', 20),
  ('nutrition', 'Nutrition', 'What to eat, nutrients, whole foods, processed food', 21),
  ('supplements', 'Supplements', 'B12, vitamin D, omega-3, iron and other supplements', 22),
  ('gut-health', 'Gut health', 'Fiber, the microbiome, digestion', 23),
  ('heart-health', 'Heart health', 'Cholesterol, blood pressure, heart disease', 24),
  ('diabetes', 'Diabetes', 'Blood sugar, insulin resistance, type 2 diabetes', 25),
  ('weight', 'Weight', 'Weight loss, weight gain, body composition', 26),
  ('longevity', 'Longevity and aging', 'Living longer, aging well, long-term Vegans', 27),
  ('mental-health', 'Mental health', 'Stress, burnout, emotions, mindset', 28),
  ('medicine', 'Doctors and medicine', 'Plant-based doctors, the medical system, disease', 29),
  ('fitness', 'Fitness', 'Training, the gym, recovery, injuries', 30),
  ('bodybuilding', 'Bodybuilding', 'Competing, prep, bulking and cutting', 31),
  ('athletes', 'Vegan athletes', 'Athletes who are Vegan and their performance', 32),
  ('cooking', 'Cooking and recipes', 'Recipes, cooking at home, cookbooks, swaps', 40),
  ('meal-prep', 'Meal prep', 'Planning and preparing meals ahead', 41),
  ('restaurants', 'Restaurants', 'Vegan restaurants, eating out, menus, chefs', 42),
  ('shopping', 'Shopping and products', 'Grocery stores, products, labels, brands to buy', 43),
  ('fast-food', 'Fast food', 'Vegan options at chains and on the road', 44),
  ('vegan-business', 'Vegan business', 'Running or starting a Vegan business, marketing, growth', 50),
  ('food-brands', 'Food brands', 'Vegan food companies and their stories', 51),
  ('creators', 'Creators and media', 'Content creators, social media, podcasts, documentaries', 52),
  ('activism', 'Activism', 'Outreach, campaigns, talking to people about Veganism', 60),
  ('animal-rights', 'Animal rights', 'Animal rights, factory farming, cruelty, the law', 61),
  ('sanctuaries', 'Sanctuaries and rescue', 'Farm sanctuaries, rescues, fostering, adoption', 62),
  ('environment', 'Environment and climate', 'Climate, land, water, sustainability', 63),
  ('farming', 'Farming and food systems', 'Agriculture, plant-based farming, the food supply', 64),
  ('food-policy', 'Laws and policy', 'Government, labeling laws, school food, subsidies', 65),
  ('hunger', 'Hunger and food access', 'Food banks, food deserts, food security', 66),
  ('going-vegan', 'Going Vegan', 'Starting out, the transition, what people wish they knew', 70),
  ('family', 'Family and kids', 'Raising Vegan kids, family meals, holidays with family', 71),
  ('relationships', 'Dating and relationships', 'Dating, partners, friends who are not Vegan', 72),
  ('community', 'Community', 'Vegan community, events, meetups, chapters, Vegans Explore', 73),
  ('travel', 'Travel', 'Traveling as a Vegan, cities, trips', 74),
  ('culture', 'Culture and history', 'Veganism in culture, history, music, Ital, faith', 75),
  ('ethics', 'Ethics and values', 'Why Vegan, compassion, values, the arguments', 76),
  ('beauty-fashion', 'Beauty and fashion', 'Cruelty-free makeup, clothing, products', 77),
  ('pets', 'Pets', 'Feeding and caring for animals at home', 78),
  ('holidays', 'Holidays', 'Thanksgiving, Christmas and other holiday food', 79)
on conflict (slug) do nothing;

alter table public.ve_content_transcripts
  add column if not exists tag_status text check (tag_status in ('queued', 'tagging', 'tagged', 'failed')),
  add column if not exists tag_marked_at timestamptz,
  add column if not exists tag_error text check (char_length(tag_error) <= 500),
  add column if not exists tag_note text check (char_length(tag_note) <= 500),
  add column if not exists tagged_at timestamptz;

create index if not exists ve_content_transcripts_tag_idx on public.ve_content_transcripts (tag_status, tag_marked_at);

create table if not exists public.ve_content_moments (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.ve_content_transcripts (content_id) on update cascade on delete cascade,
  start_s numeric(8,1) not null check (start_s >= 0),
  end_s numeric(8,1) not null,
  speaker text not null check (char_length(speaker) between 1 and 80),
  quote text not null check (char_length(quote) between 20 and 320),
  summary text not null check (char_length(summary) between 20 and 280),
  topics text[] not null check (cardinality(topics) between 1 and 3),
  run_id uuid,
  created_at timestamptz not null default now(),
  check (end_s > start_s)
);
alter table public.ve_content_moments enable row level security;
create index if not exists ve_content_moments_content_idx on public.ve_content_moments (content_id, start_s);
create index if not exists ve_content_moments_topics_idx on public.ve_content_moments using gin (topics);
create index if not exists ve_content_moments_run_idx on public.ve_content_moments (run_id);
alter table public.ve_content_transcripts add column if not exists moments_run uuid;

-- Queue a transcript for tagging whenever its words change or it becomes ready.
create or replace function public.ve_content_transcripts_tag_queue()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  if new.status = 'ready' and (tg_op = 'INSERT' or old.status is distinct from 'ready' or old.text is distinct from new.text) then
    new.tag_status := 'queued'; new.tag_marked_at := null; new.tag_error := null;
  end if;
  return new;
end $function$;

create or replace trigger trg_ve_content_transcripts_tag_queue before insert or update of status, text on public.ve_content_transcripts
  for each row execute function public.ve_content_transcripts_tag_queue();

-- The words the writer reads: one line per caption, "seconds|words", optionally a window of the episode.
create or replace function public.ve_content_transcript_lines(p_content uuid, p_from numeric default 0, p_to numeric default null)
 returns text
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select string_agg((seg ->> 's') || '|' || (seg ->> 't'), chr(10) order by (seg ->> 's')::numeric)
  from ve_content_transcripts t, jsonb_array_elements(t.segments) seg
  where t.content_id = p_content and (seg ->> 's')::numeric >= coalesce(p_from, 0) and (p_to is null or (seg ->> 's')::numeric < p_to);
$function$;

-- Save one transcript's moments as a new run, which replaces what it had. Every moment is checked; the bad ones are returned with why,
-- the good ones kept. moments: [{start_s, end_s, speaker, quote, summary, topics:[slug]}]. An empty list is allowed
-- (nothing worth tagging, say a short promo) with a note.
create or replace function public.ve_content_moments_save(p_content uuid, p_moments jsonb, p_note text default null)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  tr record; m jsonb; i int := 0; bad jsonb := '[]'::jsonb; keep jsonb := '[]'::jsonb;
  s numeric; e numeric; q text; tp text[]; dur numeric; win text; why text; rid uuid := gen_random_uuid();
begin
  select * into tr from ve_content_transcripts where content_id = p_content;
  if tr is null then raise exception 'no transcript for %', p_content; end if;
  if tr.status <> 'ready' then raise exception 'transcript % is not ready', p_content; end if;
  dur := greatest(coalesce(tr.duration_seconds, 0), coalesce((select max((seg ->> 'e')::numeric) from jsonb_array_elements(tr.segments) seg), 0));
  for m in select * from jsonb_array_elements(coalesce(p_moments, '[]'::jsonb)) loop
    i := i + 1; why := null;
    begin
      s := (m ->> 'start_s')::numeric; e := (m ->> 'end_s')::numeric; q := btrim(coalesce(m ->> 'quote', ''));
      tp := array(select jsonb_array_elements_text(coalesce(m -> 'topics', '[]'::jsonb)));
      if s is null or e is null or s < 0 or e <= s then why := 'start and end must be seconds, end after start';
      elsif e > dur + 5 then why := 'ends after the episode does';
      elsif e - s < 5 or e - s > 600 then why := 'a moment runs 5 seconds to 10 minutes';
      elsif cardinality(tp) not between 1 and 3 then why := 'one to three topics';
      elsif exists (select 1 from unnest(tp) x where x not in (select slug from ve_content_topics)) then
        why := 'topic not on the list: ' || (select string_agg(x, ', ') from unnest(tp) x where x not in (select slug from ve_content_topics));
      elsif char_length(q) not between 20 and 320 then why := 'quote must be 20 to 320 characters';
      elsif char_length(btrim(coalesce(m ->> 'speaker', ''))) not between 1 and 80 then why := 'speaker missing';
      elsif char_length(btrim(coalesce(m ->> 'summary', ''))) not between 20 and 280 then why := 'summary must be 20 to 280 characters';
      else
        select regexp_replace(lower(string_agg(seg ->> 't', ' ' order by (seg ->> 's')::numeric)), '[^a-z0-9]+', ' ', 'g') into win
        from jsonb_array_elements(tr.segments) seg
        where (seg ->> 's')::numeric between s - 30 and e + 30;
        if position(btrim(regexp_replace(lower(q), '[^a-z0-9]+', ' ', 'g')) in coalesce(win, '')) = 0 then
          why := 'quote is not said word for word within 30 seconds of this moment';
        end if;
      end if;
    exception when others then why := 'unreadable: ' || sqlerrm;
    end;
    if why is null then keep := keep || jsonb_build_array(m); else bad := bad || jsonb_build_array(jsonb_build_object('n', i, 'why', why)); end if;
  end loop;
  if jsonb_array_length(keep) = 0 and jsonb_array_length(coalesce(p_moments, '[]'::jsonb)) > 0 then
    return jsonb_build_object('ok', false, 'saved', 0, 'rejected', bad);
  end if;
  insert into ve_content_moments (content_id, run_id, start_s, end_s, speaker, quote, summary, topics)
  select p_content, rid, (x ->> 'start_s')::numeric, (x ->> 'end_s')::numeric, btrim(x ->> 'speaker'), btrim(x ->> 'quote'), btrim(x ->> 'summary'),
         array(select jsonb_array_elements_text(x -> 'topics'))
  from jsonb_array_elements(keep) x;
  update ve_content_transcripts set moments_run = rid, tag_status = 'tagged', tagged_at = now(), tag_error = null,
    tag_note = left(coalesce(nullif(btrim(p_note), ''), jsonb_array_length(keep) || ' moments') ||
      case when jsonb_array_length(bad) > 0 then ' (' || jsonb_array_length(bad) || ' left out)' else '' end, 500)
  where content_id = p_content;
  return jsonb_build_object('ok', true, 'saved', jsonb_array_length(keep), 'rejected', bad);
end $function$;

revoke all on function public.ve_content_moments_save(uuid, jsonb, text) from public, anon, authenticated;
revoke all on function public.ve_content_transcript_lines(uuid, numeric, numeric) from public, anon, authenticated;

-- The moments that count: each ready transcript's latest run.
create or replace view public.ve_content_moments_live with (security_invoker = true) as
  select m.*, c.title, c.podcast_show, c.episode_number, c.youtube_id, c.slug
  from ve_content_moments m
  join ve_content_transcripts t on t.content_id = m.content_id and t.moments_run = m.run_id and t.status = 'ready'
  join ve_pulse_content c on c.id = m.content_id;
revoke all on public.ve_content_moments_live from anon, authenticated;

-- Everything already saved waits for its first tagging.
update public.ve_content_transcripts set tag_status = 'queued' where status = 'ready' and tag_status is null;

-- The dispatcher job.
insert into public.lesaruss_dispatch_sources (key, label, enabled, batch, sort, instructions, notes)
values ('content_moments_tag', 'Content index: tag moments in podcast transcripts', true, 3,
  coalesce((select max(sort) from public.lesaruss_dispatch_sources where key = 'pulse_topic_write'), 11) + 1,
$i$
Vegans Explore content index, Step 2. Our podcast episodes have timestamped transcripts. Cut each one into moments so a member can search a topic ("dairy") and play the exact second it comes up. Never publish anything; this only fills the index.
1. Load up to BATCH transcripts:
   select t.content_id, c.title, c.podcast_show, c.episode_number, c.guest_name, t.duration_seconds, t.words, t.tag_error
   from ve_content_transcripts t join ve_pulse_content c on c.id = t.content_id
   where t.status = 'ready' and (t.tag_status = 'queued' or (t.tag_status = 'tagging' and t.tag_marked_at < now() - interval '30 minutes'))
   order by c.podcast_show = 'Vegans Explore Podcast' desc, c.episode_number nulls last, t.tag_marked_at nulls first limit BATCH;
2. For each: update ve_content_transcripts set tag_status = 'tagging', tag_marked_at = now() where content_id = '<id>' and tag_status in ('queued', 'tagging');
   Read it: select ve_content_transcript_lines('<id>');  Each line is "seconds|words". For a long episode (over about 6,000 words) read it in parts: select ve_content_transcript_lines('<id>', 0, 1200); then 1200 to 2400 and so on.
   Read the topic list once per run: select slug, label, about from ve_content_topics order by sort;
3. Find the moments. A moment is a stretch where someone says something worth finding by topic: a point, a story, advice, a fact, an opinion. Skip the intro, sponsor reads, "subscribe" and goodbyes, and small talk.
   - About one moment for every two to four minutes of real talk; a short daily episode may have two or three, a long interview fifteen to twenty-five. A two-minute promo may have none.
   - start_s: the second the point begins (the start of the line where it begins). end_s: where it is finished. Usually 20 seconds to 3 minutes.
   - speaker: the person talking, by name. The host of Vegans Explore, SoFlo Vegans and Pre-Vegans is Sean A. Russell (the captions often spell him Shawn). Vegans Who Lift is hosted by Brooke Sellers and John Thomas. Take a guest's name from the title or from how they are introduced, spelled the way the title spells it. If you cannot tell who is talking, use "Guest" or "Host".
   - quote: their words copied exactly from the transcript, 20 to 300 characters, from inside the moment. Fix nothing in it, not even spelling; it is checked word for word.
   - summary: one sentence in your own words, under 200 characters, saying what is said, for example "Dr. Klaper explains why fiber feeds the gut bacteria that lower inflammation." Always capitalize Vegan, Vegans and Veganism. No em dashes or en dashes. Never add facts that are not said.
   - topics: one to three slugs from ve_content_topics, the most specific first. Only slugs on the list.
4. Save all of the episode's moments in one call (dollar-quote the JSON as $j$...$j$):
   select ve_content_moments_save('<id>', $j$[{"start_s": 312.4, "end_s": 401.0, "speaker": "...", "quote": "...", "summary": "...", "topics": ["dairy", "nutrition"]}]$j$::jsonb, null);
   It answers {ok, saved, rejected:[{n, why}]}. Fix and save again if a quote was not found (copy it again from the lines, inside the moment) or a topic is off the list. If an episode truly has nothing worth tagging, save an empty list with a note: select ve_content_moments_save('<id>', '[]'::jsonb, 'Promo, nothing to tag');
   If it cannot be done at all: update ve_content_transcripts set tag_status = 'failed', tag_error = <short reason> where content_id = '<id>'; and move on.
Do not change the transcripts, the episodes or the topic list.
$i$,
'Content index Step 2 (Sean, 2026-10-23). Runs on the subscription like pulse_topic_write; ve_content_moments_save checks every quote against the transcript.')
on conflict (key) do nothing;

-- Count transcripts waiting alongside the dispatcher's other jobs.
create or replace function public.lesaruss_dispatch_pending()
 returns jsonb
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
    'news_desk_write', (select count(*) from ve_news_leads where status = 'write' or (status = 'drafting' and marked_at < now() - interval '20 minutes')),
    'pulse_topic_write', (select count(*) from ve_board_posts where kind = 'topic' and status = 'draft' and (write_status = 'queued' or (write_status = 'writing' and write_marked_at < now() - interval '20 minutes'))),
    'content_moments_tag', (select count(*) from ve_content_transcripts where status = 'ready' and (tag_status = 'queued' or (tag_status = 'tagging' and tag_marked_at < now() - interval '30 minutes'))),
    'fieldy_topicizer', (select count(*) from fieldy_transcripts where received_at > coalesce((select last_processed_through from fieldy_topicizer_state where id = 1), '2026-04-15') and received_at < now() - interval '30 minutes'),
    'room_work_orders', (select count(*) from room_work_orders where status = 'queued'),
    'agent_tasks_logan', (select count(*) from agent_tasks where status = 'pending' and lower(to_agent) = 'logan'),
    'fieldy_v_requests', (select count(*) from fieldy_transcripts where is_command and coalesce(command_status, 'pending') not in ('completed', 'done', 'dismissed', 'failed')),
    'personal_ideas_raw', (select count(*) from personal_ideas where status = 'raw'),
    'brand_features_to_build', (select count(*) from brand_dashboard_features where planned and not live),
    'playbook_orders_due', (select count(*) from playbook_records where applied = false),
    'people_tasks', (select count(*) from people_profile_queue where status not in ('profiled', 'skipped'))
  );
$function$;
