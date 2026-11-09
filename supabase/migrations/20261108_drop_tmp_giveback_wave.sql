-- ve-holiday-guide: Give Back full run done (2026-11-08). Drops the temporary wave job.
-- Applied through the one-time ve-once-giveback-drop (now the 410 stub); a check confirmed job 0, table and function gone.
select cron.unschedule('tmp-giveback-wave') where exists (select 1 from cron.job where jobname='tmp-giveback-wave');
drop function if exists public.tmp_giveback_wave();
drop table if exists public.tmp_giveback_fired;
