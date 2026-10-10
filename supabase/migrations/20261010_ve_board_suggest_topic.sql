-- Suggest a Topic (Sean, 2026-10-10): the seventh section of every city's Community Board. Members
-- suggest a Daily Pulse topic, something to talk about, or an idea for the board. The Pulse writer
-- reads the city's Daily Pulse ideas (most replied first) and may build a briefing on one it can
-- source; that briefing carries briefing.suggestion_id, and when it goes live (by the desk or on
-- autopilot) the trigger below marks the suggestion Covered and replies with the link.

alter table public.ve_board_posts drop constraint if exists ve_board_posts_kind_check;
alter table public.ve_board_posts add constraint ve_board_posts_kind_check
  check (kind in ('request', 'offer', 'topic', 'job', 'classified', 'foster', 'rescue', 'suggestion'));

alter table public.ve_board_posts drop constraint if exists ve_board_posts_category_check;
alter table public.ve_board_posts add constraint ve_board_posts_category_check
  check (category in ('rescue', 'transport', 'fostering', 'food', 'services', 'volunteers', 'other', 'pulse',
    'hiring', 'seeking', 'for_sale', 'free', 'wanted', 'trade', 'foster_needed', 'foster_offered',
    'rescue_urgent', 'rescue_needed', 'rescue_update', 'pulse_idea', 'talk_idea', 'board_idea', 'guide'));

create or replace function public.ve_board_suggestion_covered() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
declare s record;
begin
  if new.kind = 'topic' and new.status = 'open' and old.status = 'draft'
     and coalesce(new.briefing ->> 'suggestion_id', '') ~ '^[0-9a-f-]{36}$' then
    select id, community_slug into s from ve_board_posts
      where id = (new.briefing ->> 'suggestion_id')::uuid and kind = 'suggestion' and status = 'open' and not pinned;
    if found then
      insert into ve_board_replies (post_id, member_id, body) values (s.id, new.member_id,
        'This became the Daily Pulse. Thank you for suggesting it. Join the conversation here: https://vegansexplore.com/board?lane=pulse&community='
        || s.community_slug || '&post=' || new.id);
      update ve_board_posts set status = 'resolved', resolved_at = now(), updated_at = now(),
        reply_count = (select count(*) from ve_board_replies where post_id = s.id and status = 'visible')
      where id = s.id;
    end if;
  end if;
  return new;
end $fn$;
revoke all on function public.ve_board_suggestion_covered() from public, anon, authenticated;
create or replace trigger trg_ve_board_suggestion_covered after update of status on public.ve_board_posts
  for each row execute function public.ve_board_suggestion_covered();

-- The writer reads the suggestions.
update public.lesaruss_dispatch_sources set instructions = instructions || $i$
Member suggestions (2026-10-10): members suggest topics on the Board's Suggest a Topic section. In step 3, also read the open Daily Pulse ideas:
   select id, community_slug, title, body, reply_count from ve_board_posts where kind = 'suggestion' and category = 'pulse_idea' and status = 'open' and not pinned
   and community_slug = '<city>' (national: any city, and use only ones that are truly national) order by reply_count desc, created_at desc limit 5;
   A suggestion is a lead, never a source: use one only if you find and read a real source for it (WebSearch, then WebFetch), and only what that source says. If one leads or is part of the briefing, say in the opening that a member suggested it (never a name) and add "suggestion_id": "<its id>" to the briefing JSON. Publishing marks it Covered with a link. Use at most one suggestion a day, and never change a suggestion post yourself.$i$,
  notes = coalesce(notes, '') || E'\n2026-10-10: reads Suggest a Topic (pulse_idea) suggestions; briefing.suggestion_id marks the one used.'
where key = 'pulse_topic_write' and position('Member suggestions (2026-10-10)' in instructions) = 0;

-- The pinned "How it works" post in every city.
with who as (
  select (value::jsonb ->> 'member_id')::uuid id from public.lesaruss_dispatch_settings where key = 'pulse_auto'
), cities(slug, name) as (values
  ('south-florida', 'South Florida'), ('central-florida', 'Central Florida'), ('atlanta', 'Atlanta'), ('dmv', 'DMV'),
  ('new-york', 'New York'), ('philadelphia', 'Philadelphia'), ('los-angeles', 'Los Angeles'), ('london', 'London')
)
insert into public.ve_board_posts (community_slug, member_id, kind, category, title, body, status, pinned)
select c.slug, who.id, 'suggestion', 'guide', 'How to use Suggest a Topic in ' || c.name, replace($t$Welcome to Suggest a Topic for {city}. Tell us what your city should be talking about.

How it works
1. Choose Suggest a topic, then pick For the Daily Pulse, Something to talk about, or An idea for the board.
2. Title: the topic in one line, for example: More Vegan options in school lunches.
3. Details: why it matters to {city}, and a link to the story or source if there is one.
4. Reply to other suggestions to back them up or add what you know. Daily Pulse ideas with the most replies are read first when the next briefing is written.
5. When a suggestion becomes the Daily Pulse, it is marked Covered with a link to that day's briefing.

For the Daily Pulse: something happening in {city} that Vegans should know about. Every story is checked against a real source before it goes out, so a link helps.
Something to talk about: a question or idea you want your city's take on.
An idea for the board: a new section, a feature, or something we could do better.

Anyone can read. Suggesting and replying are for members (the $11 Founding Membership).

Questions? Reply below.$t$, '{city}', c.name), 'open', true
from cities c cross join who
where who.id is not null
  and not exists (select 1 from public.ve_board_posts x where x.community_slug = c.slug and x.kind = 'suggestion' and x.pinned);
