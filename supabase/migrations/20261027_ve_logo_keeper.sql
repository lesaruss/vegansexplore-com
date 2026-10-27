-- Every logo is our own copy (Sean, 2026-10-27: "any logo that we pull, let's not use it from where it was hosted from... make a
-- copy of it immediately"). ve-logo-keeper copies any logo_url outside vegan-media into our storage, every hour. Its first run on
-- 2026-10-27 copied the 55 podcasts' Apple Podcasts covers.
select cron.schedule('ve-logo-keeper', '41 * * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-logo-keeper',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"sweep"}'::jsonb, timeout_milliseconds := 150000)
$$);
