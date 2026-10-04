-- The Daily Pulse is a city briefing (Sean, 2026-10-04): "treat it as if we're leading a movement
-- in this city", not trivia. Each day's topic is a mini newsletter: an opening, the stories people
-- are talking about (up to five, each with its source), upcoming events, and one concrete action,
-- with the question and the conversation underneath. The sections live in ve_board_posts.briefing:
--
--   { "stories": [{ "title", "take", "source", "url", "lead_id" }], up to 5 (lead_id: the Inbox story)
--     "events":  [{ "title", "when", "where", "url" }],            up to 3
--     "action":  { "title", "text", "label", "url" } }            one, or null
--
-- A briefing's sources are its stories, so the single source_url/source_name a topic needed
-- before is now required only when there are no stories (checked in ve-board).

alter table public.ve_board_posts add column if not exists briefing jsonb;
alter table public.ve_board_posts drop constraint if exists ve_board_posts_topic_source_check;
alter table public.ve_board_posts add constraint ve_board_posts_topic_source_check
  check (kind <> 'topic' or question is not null);

update public.lesaruss_dispatch_sources set label = 'Daily Pulse: build queued city briefings', instructions = $i$
Vegans Explore Daily Pulse. Build today's city briefing into a queued draft; never publish it.
The Daily Pulse is how Vegans Explore leads the Vegan movement in each city, one briefing a day: what is happening, what people are talking about, and one thing to do about it, with a conversation underneath on the Community Board. Write like the organizers of that city's Vegan community: warm, direct, proud of the city, focused on what moves the community forward. Not trivia, not "it's National Cupcake Day", not filler.
community_slug is the city (south-florida, central-florida, atlanta, dmv, new-york, philadelphia, los-angeles, london) or 'national' (every city; national news and national actions).

1. Load up to BATCH drafts:
   select id, community_slug, title, body, source_name, source_url, lead_id, write_note from ve_board_posts
   where kind = 'topic' and status = 'draft' and (write_status = 'queued' or (write_status = 'writing' and write_marked_at < now() - interval '20 minutes'))
   order by write_marked_at nulls first limit BATCH;
2. For each: update ve_board_posts set write_status = 'writing', write_marked_at = now(), write_error = null where id = '<id>' and status = 'draft' and write_status in ('queued', 'writing');
   write_note is the desk's own line (follow it). If source_url is set, that story leads the briefing.

3. Gather, for that city (city names for matching: south-florida = Miami, Fort Lauderdale, Broward, Palm Beach and nearby; central-florida = Orlando and nearby; dmv = Washington DC, Maryland, Virginia; the rest by their name):
   a. Stories, last 7 days, not already used: select id, title, url, source_name, summary, published_at from ve_news_leads
      where brand_slug = 'vegans-explore' and status <> 'dismissed' and topic_post_id is null and coalesce(published_at, created_at) > now() - interval '7 days'
      and city_slug = '<city>'  (national: and feed_id in (select id from ve_news_feeds where scope = 'vegan'))
      order by coalesce(published_at, created_at) desc limit 25;
      Pick up to 5 that matter most to Vegans in that city: openings and closings, a Vegan spot changing, local policy and animal protection, community wins, things people can go to or act on. Skip fluff and repeats. Read each with WebFetch before using it (Google News links usually will not open: WebSearch the headline plus outlet, then fetch the original), and use only what it says.
   b. Events, next 14 days: select title, starts_at, location_name, city, ticket_url from events where status = 'approved' and starts_at between now() and now() + interval '14 days' order by starts_at; keep the ones in that city (national: none unless truly national or virtual). Up to 3.
   c. Ways to act: select id, title, description, opportunity_type from opportunities where is_active and brand_slug = 'vegans-explore' and (city_slug = '<city>' or city_slug is null);
      open requests on the Board: select id, title, category from ve_board_posts where community_slug = '<city>' and kind = 'request' and status = 'open' order by created_at desc limit 5;
      an upcoming event from b; the city's Directory (/communities/<city>) to support a Vegan business named in a story.
      Choose ONE action that fits today's briefing best. Links: an opportunity is /dashboard/opportunities, a Board request is /board?community=<city>&post=<id>, an event is its ticket_url, the Directory is /communities/<city>. Bounties are not live yet; do not point to them.

4. Write:
   - title: "<City> Pulse: " plus the two or three things in today's briefing, under 90 characters (national: "Daily Pulse: ...").
   - body (the opening): two or three sentences, under 450 characters, that say what is moving in the city today and why it matters to the community.
   - stories: for each, title (your own plain words, under 90 characters), take (one sentence, under 200 characters, why it matters here, only facts from the source), source (the outlet's real name), url, lead_id (its ve_news_leads id from step 3a, or null for a story found another way).
   - events: title, when (for example "Sat, Oct 24, 7 pm"), where, url (ticket_url, or null).
   - action: title (under 60 characters), text (one sentence on what to do and why), label (the button, two to four words, for example "Apply to help"), url.
   - question: one real question, under 160 characters, that gets the city talking about today's briefing. Never a loaded or bait question.
   Rules: always capitalize Vegan, Vegans and Veganism. No em dashes or en dashes. No emoji, hashtags or markdown. No health or tax claims. Never invent names, dates, prices, addresses, quotes or numbers. Neutral on controversies; attribute claims. If there is not enough real news, a shorter briefing (even one story or none) with a strong event or action is better than padding.

5. Save it, only if a person has not taken it over meanwhile. The first story is the briefing's lead source. Dollar-quote text ($b$...$b$) and the JSON ($j$...$j$):
   update ve_board_posts set title = <title>, body = <opening>, question = <question>,
     briefing = $j${"stories":[...],"events":[...],"action":{...}}$j$::jsonb,
     source_name = <first story's source or null>, source_url = <first story's url or null>,
     write_status = 'written', write_error = null, updated_at = now()
   where id = '<id>' and status = 'draft' and write_status = 'writing';
   If it cannot be built: update ve_board_posts set write_status = 'failed', write_error = <short reason> where id = '<id>' and write_status = 'writing';
Do not publish, do not reply, do not touch any other post, and do not change ve_news_leads (the desk marks stories used when the briefing is published).
$i$, notes = coalesce(notes, '') || E'\n2026-10-04: became the city briefing builder (Sean: lead the movement, not trivia).'
where key = 'pulse_topic_write';
