-- BrandDesk websites: keep the traffic their old website earned (Sean, 2026-11-01, reviewing the walkthrough: "run a scan of their
-- domains on their previous site... so they don't lose that traffic. We can redirect or map out the page structure").
-- Before their domain moves to us, ve-branddesk (site_old_scan; on its own at Build their website and at Add their domain) reads their
-- current website: its sitemaps (sitemap.xml, sitemap_index.xml, wp-sitemap.xml, the ones robots.txt names) and the links on its home
-- page, up to 300 addresses, each page's title for the first 60. Each old address is matched to one of the five new pages (home, menu,
-- order, about, visit) by its words; the team can change any match (site_old_save). On their domain every old address answers with a
-- permanent redirect (301) to its new page, and the final check tries them.
--   old_site        the website we read (their Directory page's website at the time)
--   old_pages       [{path, title, to, how}] path lowercase without a trailing slash; to '' | menu | order | about | visit; how
--                   'same' (the new site already has that address), 'words' (matched by its words), 'home' (nothing matched),
--                   'team' (set by hand)
--   old_scanned_at  when; old_note what the scan found or why it found nothing
alter table public.ve_branddesk_sites
  add column if not exists old_site text,
  add column if not exists old_pages jsonb,
  add column if not exists old_scanned_at timestamptz,
  add column if not exists old_note text;
