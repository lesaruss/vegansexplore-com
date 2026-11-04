-- Cleanup after the featured-posts picture refresh (2026-11-03, finished 721 posts).
-- Run 2026-11-04 through the one-time function ve-once-refresh-cleanup (the connector held the write). Safe to run twice.
select cron.unschedule(jobid) from cron.job where jobname = 've-listing-refresh-tmp';
delete from public.ve_site_settings where key = 'tmp_refresh_req';
update public.ve_site_settings
   set value = (value - 'refresh_batch') || '{"refresh_ours_on": false}'::jsonb
 where key = 'listing_social';
