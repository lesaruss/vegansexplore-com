-- Daily Pulse on autopilot (Sean, 2026-10-05): "have it set up the day before. And then if I look at
-- it, I look at it. If I don't, it goes out." Each evening a draft is queued for tomorrow for every
-- community in the pulse_auto setting; the Background writer (dispatcher source pulse_topic_write)
-- builds it overnight, including the first reply; at 7:00 AM local it publishes itself unless a person
-- discarded it or the writer failed. Publishing it by hand earlier works as before (Depot > Inbox desk).
alter table public.ve_board_posts add column if not exists auto_publish_at timestamptz;
alter table public.ve_board_posts add column if not exists first_reply text;

-- Which communities, when, and whose name the post and first reply go up under (the same account the
-- first two briefings were published from). A city joins by adding its slug here.
insert into public.lesaruss_dispatch_settings (key, value)
values ('pulse_auto', '{"communities":["national","south-florida"],"publish_local":"07:00","member_id":"72712a4a-ea0e-4ef4-a29e-d382496ef8da"}')
on conflict (key) do nothing;

create or replace function public.ve_pulse_tz(p_community text) returns text
language sql immutable as $$
  select case p_community when 'los-angeles' then 'America/Los_Angeles' when 'london' then 'Europe/London' else 'America/New_York' end;
$$;

-- Evening: queue tomorrow's draft for each community (once).
create or replace function public.ve_pulse_auto_queue() returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  cfg jsonb := coalesce((select value::jsonb from lesaruss_dispatch_settings where key = 'pulse_auto'), '{}');
  c text; tz text; at timestamptz; queued text[] := '{}';
  who uuid := (cfg ->> 'member_id')::uuid;
  hhmm time := coalesce(cfg ->> 'publish_local', '07:00')::time;
  names jsonb := '{"national":"Daily Pulse","south-florida":"South Florida Pulse","central-florida":"Central Florida Pulse","atlanta":"Atlanta Pulse","dmv":"DMV Pulse","new-york":"New York Pulse","philadelphia":"Philadelphia Pulse","los-angeles":"Los Angeles Pulse","london":"London Pulse"}';
begin
  if who is null then return jsonb_build_object('queued', queued, 'reason', 'no member_id in pulse_auto'); end if;
  for c in select jsonb_array_elements_text(coalesce(cfg -> 'communities', '[]')) loop
    tz := ve_pulse_tz(c);
    at := (((now() at time zone tz)::date + 1) + hhmm) at time zone tz;
    if exists (select 1 from ve_board_posts where kind = 'topic' and community_slug = c and auto_publish_at = at) then continue; end if;
    insert into ve_board_posts (community_slug, member_id, kind, category, status, title, body, question, write_status, write_marked_at, write_note, auto_publish_at)
    values (c, who, 'topic', 'pulse', 'draft', coalesce(names ->> c, 'Daily Pulse'), 'The Background writer is building tomorrow''s briefing.', '',
      'queued', now(), 'Auto: tomorrow''s briefing. It goes out on its own at ' || to_char(at at time zone tz, 'FMHH12:MI AM') || ' ' || to_char(at at time zone tz, 'Dy, Mon FMDD') || ' unless someone discards it. Write the first reply too.', at);
    queued := queued || c;
  end loop;
  if array_length(queued, 1) > 0 then perform lesaruss_dispatch_tick(); end if;
  return jsonb_build_object('queued', queued);
end $$;

-- Every 15 minutes: publish what is due, the way ve-board topic_publish does (status open, the first
-- reply under the same account, the stories it used marked so they are not used again). A draft the
-- writer is still on, or that failed, waits for a person; one more than 12 hours late is left alone.
create or replace function public.ve_pulse_auto_publish() returns jsonb
language plpgsql security definer set search_path to 'public' as $$
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
    update ve_board_posts set status = 'open', published_at = now(), updated_at = now(), reply_count = 1, write_status = null where id = p.id and status = 'draft';
    insert into ve_board_replies (post_id, member_id, body) values (p.id, p.member_id, left(reply, 2000));
    select array_agg(distinct x) into used from (
      select p.lead_id x union all
      select (s ->> 'lead_id')::uuid from jsonb_array_elements(coalesce(p.briefing -> 'stories', '[]')) s where (s ->> 'lead_id') ~ '^[0-9a-f-]{36}$') u where x is not null;
    if used is not null then update ve_news_leads set topic_post_id = p.id where id = any(used) and topic_post_id is null; end if;
    out := out || p.community_slug;
  end loop;
  return jsonb_build_object('published', out);
end $$;

revoke all on function public.ve_pulse_auto_queue() from public, anon, authenticated;
revoke all on function public.ve_pulse_auto_publish() from public, anon, authenticated;

-- 6:00 PM Eastern (22:00 UTC; 5 PM in winter): queue tomorrow. Every 15 minutes: publish what is due.
select cron.schedule('ve-pulse-auto-queue', '0 22 * * *', $c$ select public.ve_pulse_auto_queue(); $c$);
select cron.schedule('ve-pulse-auto-publish', '3,18,33,48 * * * *', $c$ select public.ve_pulse_auto_publish(); $c$);
