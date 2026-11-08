-- ve-community-directory: the old logo sweep (ve-discover logo_sweep, every 5 minutes, full-size pictures to Claude) paused
-- 2026-11-07. The Anthropic API account had $43.73 of a $260 promotional credit left (expires 2026-11-17, no purchased credit,
-- auto-reload off), and the sweep had looked at 282 listings in a day. ve-logo-hunt replaces it. Applied 2026-11-07.
select cron.alter_job(job_id := (select jobid from cron.job where jobname = 've-logo-sweep'), active := false);
