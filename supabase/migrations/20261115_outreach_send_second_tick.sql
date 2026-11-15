-- Sean, 2026-11-15: "yes, step it up Wednesday" (Holiday Launch: Everyone Else 125 -> 195 a day from Wed Nov 18, so every group finishes
-- by Wed Nov 25, before Thanksgiving). The sender sends at most 6 per run and runs every 10 minutes, weekdays 9 to 5 Eastern: about 288 a day,
-- just under the Wednesday total of about 285, so a slow run would cut the day short. A second run at :05, :15, ... doubles the room to about
-- 576 a day without touching the function. Each run still obeys every rule inside ve-outreach (each campaign's daily pace, the domain's
-- warm-up allowance, one outreach email per address per day, the do-not-email list), so this adds room only, never volume. Safe to run twice.
select cron.unschedule('ve-outreach-send-b') where exists (select 1 from cron.job where jobname = 've-outreach-send-b');
select cron.schedule('ve-outreach-send-b', '5-55/10 * * * *', $cron$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-outreach',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"tick"}'::jsonb, timeout_milliseconds := 120000)
$cron$);
