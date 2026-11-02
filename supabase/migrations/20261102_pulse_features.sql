-- Featured items in the Daily Pulse (Sean, 2026-11-01: "what I noticed you didn't put into the post today was the episode, the launch of
-- the Vegans Explore podcast. Let's do it for tomorrow"; "we could be sending them stuff like that periodically").
-- A ve_pulse_features row goes first in the stories of every Vegans Explore city's Pulse published between starts_on and ends_on
-- (Eastern dates; communities null = every city, never LESARUSS.ai's lr-* topics). Applied when the draft publishes at 7 AM, and at once
-- by ve_pulse_features_apply() so the Pulse desk shows it. Each story carries feature_id so it is never added twice.
create table if not exists public.ve_pulse_features (
  id uuid primary key default gen_random_uuid(),
  starts_on date not null,
  ends_on date not null,
  communities text[],
  story jsonb not null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.ve_pulse_features enable row level security;

create or replace function public.ve_pulse_features_apply(p_post uuid default null)
 returns int language plpgsql security definer set search_path to 'public' as $$
declare n int := 0; r record; f record;
begin
  for r in select id, community_slug, briefing, auto_publish_at from ve_board_posts
    where kind = 'topic' and status = 'draft' and auto_publish_at is not null and briefing is not null
      and community_slug not like 'lr-%' and (p_post is null or id = p_post) and auto_publish_at > now() - interval '12 hours'
  loop
    for f in select * from ve_pulse_features
      where (r.auto_publish_at at time zone 'America/New_York')::date between starts_on and ends_on
        and (communities is null or r.community_slug = any(communities)) order by created_at
    loop
      if not exists (select 1 from jsonb_array_elements(coalesce(r.briefing->'stories','[]')) s where s->>'feature_id' = f.id::text) then
        r.briefing := jsonb_set(r.briefing, '{stories}', jsonb_build_array(f.story || jsonb_build_object('feature_id', f.id::text)) || coalesce(r.briefing->'stories','[]'));
        update ve_board_posts set briefing = r.briefing, updated_at = now() where id = r.id;
        n := n + 1;
      end if;
    end loop;
  end loop;
  return n;
end $$;
revoke all on function public.ve_pulse_features_apply(uuid) from public, anon, authenticated;

create or replace function public.ve_pulse_auto_publish()
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  p record; reply text; used uuid[]; out text[] := '{}';
begin
  for p in select * from ve_board_posts
    where kind = 'topic' and status = 'draft' and auto_publish_at is not null
      and auto_publish_at <= now() and auto_publish_at > now() - interval '12 hours'
      and coalesce(write_status, '') not in ('queued', 'writing', 'failed')
    for update skip locked
  loop
    reply := nullif(btrim(coalesce(p.first_reply, p.briefing ->> 'first_reply', '')), '');
    if length(btrim(p.title)) < 3 or btrim(p.body) = '' or nullif(btrim(coalesce(p.question, '')), '') is null
       or (p.source_url is null and p.briefing is null) or reply is null then
      update ve_board_posts set write_error = 'Did not go out on its own: it is missing a headline, opening, question, story or first reply.' where id = p.id;
      continue;
    end if;
    perform ve_pulse_features_apply(p.id);
    update ve_board_posts set status = 'open', published_at = now(), updated_at = now(), reply_count = 1, write_status = null where id = p.id and status = 'draft';
    insert into ve_board_replies (post_id, member_id, body) values (p.id, p.member_id, left(reply, 2000));
    select array_agg(distinct x) into used from (
      select p.lead_id x union all
      select (s ->> 'lead_id')::uuid from jsonb_array_elements(coalesce(p.briefing -> 'stories', '[]')) s where (s ->> 'lead_id') ~ '^[0-9a-f-]{36}$') u where x is not null;
    if used is not null then update ve_news_leads set topic_post_id = p.id where id = any(used) and topic_post_id is null; end if;
    out := out || p.community_slug;
  end loop;
  return jsonb_build_object('published', out);
end $function$;

-- The first one: the Vegans Explore Podcast's return, in every city's Pulse on Monday, November 2, 2026.
insert into public.ve_pulse_features (starts_on, ends_on, story, note)
select '2026-11-02', '2026-11-02', jsonb_build_object(
  'title', 'The Vegans Explore Podcast is back',
  'take', 'Our show returned on World Vegan Day, now every Sunday: Sean on what happened since the daily run ended, then our Guides with the week''s news, the Directory and what''s happening around the world.',
  'url', 'https://vegansexplore.com/listen?show=vegans-explore-podcast&ep=73510abf-12fa-40c1-a35e-ebd638d10827',
  'source', 'Vegans Explore Podcast', 'ours', true),
  'Founder''s Report: Back and Ready for Duty (Sean, 2026-11-01)'
where not exists (select 1 from public.ve_pulse_features where starts_on = '2026-11-02' and story->>'title' = 'The Vegans Explore Podcast is back');
