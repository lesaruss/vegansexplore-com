-- The Find us post made at approval (playbook ve-claims-onboarding; Sean, 2026-11-13: "Build the Find us post at approval next").
-- ve-claims adds a draft find-us row to ve_media_kit_items when it approves a business with a logo; .github/workflows/find-us-post.yml
-- renders it (find-us.js) and commits it to public/claims/<slug>/; this check, every 5 minutes, marks the row ready once both images are
-- live and releases Liz's approval email (held as stopped, 'waiting for the Find us post'), or gives up after 90 minutes.
select cron.unschedule('ve-claims-find-us') where exists (select 1 from cron.job where jobname = 've-claims-find-us');
select cron.schedule('ve-claims-find-us', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-claims?cron=find_us',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{}'::jsonb
  );
$$);
