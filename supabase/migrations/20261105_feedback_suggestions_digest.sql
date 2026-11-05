-- Sean, 2026-11-05 (playbook ve-page-guide): anyone who is not a super admin leaves a suggestion; it lands in the Inbox and Sean
-- is emailed at once. When there are too many, the daily digest switch (Depot > Feedback) sends one email a day instead.
alter table ve_feedback drop constraint ve_feedback_kind_check;
alter table ve_feedback add constraint ve_feedback_kind_check
  check (kind = any (array['suggestion','broken','wrong','confusing','missing','idea','praise','other']));

insert into ve_site_settings (key, value) values ('feedback', '{"digest": false}'::jsonb)
on conflict (key) do nothing;

-- 8:23 AM Eastern (13:23 UTC; 9:23 under EDT). Sends nothing while the digest is off.
select cron.schedule('ve-feedback-digest', '23 13 * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-feedback',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select value from lesaruss_secrets where key='CRON_SECRET')),
    body := '{"action":"digest"}'::jsonb, timeout_milliseconds := 30000)
$$);
