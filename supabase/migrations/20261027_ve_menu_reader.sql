-- The menu reader (Sean, 2026-10-27: "build the menu reader"). Edge function ve-menu-reader reads the menus the Background
-- writer's text read left at 'none' (a picture, a PDF, an ordering page that loads only in a browser) and saves them through
-- ve_menu_import_save. reader_at marks a listing it has tried (once each), reader_note what it found, reader_read what it read.
alter table public.ve_menu_imports add column if not exists reader_at timestamptz, add column if not exists reader_note text,
  add column if not exists reader_read jsonb, add column if not exists reader_preview jsonb; -- reader_preview: a save: false test

-- One listing a run (a read takes up to about five minutes in the background), every 5 minutes.
select cron.schedule('ve-menu-reader', '*/5 * * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-menu-reader',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"sweep","limit":1}'::jsonb, timeout_milliseconds := 30000)
$$);
