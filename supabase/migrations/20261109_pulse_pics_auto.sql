-- ve-daily-pulse-discussion: run ve-pulse-pics on every published Daily Pulse (2026-11-09).
-- Story pictures are copied as soon as a city's Pulse goes out (7 AM local), so the day Sean approves the look the only change is
-- removing the ?pics=1 gate in public/ve-pulse-topics.js. Until then the pictures sit in the briefing and are not shown.
-- Vegans Explore cities only (LESARUSS.ai's lr-* topics are left out). A post is tried once: briefing.pics_at is stamped before
-- the call, so a page that refuses us is not hammered. Switch: ve_site_settings pulse_pics.auto (true/false).

insert into ve_site_settings (key, value) values ('pulse_pics', '{"auto": true, "per_run": 6, "window_hours": 36}'::jsonb)
on conflict (key) do nothing;

create or replace function ve_pulse_pics_tick() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s jsonb; tok text; p record; n int := 0;
begin
  select value into s from ve_site_settings where key = 'pulse_pics';
  if coalesce((s->>'auto')::boolean, false) is not true then return jsonb_build_object('off', true); end if;
  select value into tok from lesaruss_secrets where key = 'LESARUSS_ADMIN_TOKEN';
  if tok is null then return jsonb_build_object('error', 'no_token'); end if;
  for p in
    select id from ve_board_posts
     where kind = 'topic' and status = 'open'
       and published_at > now() - make_interval(hours => coalesce((s->>'window_hours')::int, 36))
       and community_slug not like 'lr-%'
       and briefing is not null and jsonb_typeof(briefing->'stories') = 'array'
       and not (briefing ? 'pics_at')
     order by published_at
     limit coalesce((s->>'per_run')::int, 6)
  loop
    update ve_board_posts set briefing = briefing || jsonb_build_object('pics_at', now()) where id = p.id;
    perform net.http_post(
      url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-pulse-pics',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || tok),
      body := jsonb_build_object('action', 'post', 'id', p.id),
      timeout_milliseconds := 120000);
    n := n + 1;
  end loop;
  return jsonb_build_object('sent', n);
end $$;
revoke all on function ve_pulse_pics_tick() from public, anon, authenticated;

select cron.unschedule(j.jobid) from cron.job j where j.jobname = 've-pulse-pics';
select cron.schedule('ve-pulse-pics', '6-59/15 * * * *', $c$ select ve_pulse_pics_tick(); $c$);
