-- ve-holiday-guide: Give Back full run (2026-11-08). TEMPORARY.
-- A wave job that sends 48 organizations (12 batches of 4) to ve-giveback every 6 minutes and
-- unschedules itself when none are left. Dropped after the run (see 20261108_drop_tmp_giveback_wave.sql).
create table if not exists tmp_giveback_fired(slug text primary key, at timestamptz default now());
alter table tmp_giveback_fired enable row level security;
-- tmp_giveback_wave(): picks open Nonprofits, Rescues and Sanctuaries with a real website (not social),
-- no details.support, no details.support_try, not fired yet; posts each batch with the cron secret.
-- (Full body as applied lives in the session; it is removed after the run.)
-- select cron.schedule('tmp-giveback-wave', '*/6 * * * *', 'select tmp_giveback_wave()');
