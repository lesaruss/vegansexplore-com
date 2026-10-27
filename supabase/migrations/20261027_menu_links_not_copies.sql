-- Menu links, not copies (Sean, 2026-10-27: "how do we know if they're updated?... if she changes just one of them, we're
-- presenting wrong information. So... have a tab that says menu, and... when they click it, it takes them out to wherever their
-- menu is listed... not until they claim it"). An unclaimed food place's Menu tab links out to listings.menu_crawl_url; a claimed
-- one shows the menu its owner keeps on the Partner Dashboard. Copied menus (ve_menu_items source import) stay in the table,
-- never shown. Run through the one-time function ve-once-menu-links (the connector held the write).

-- 1. Stop copying: the menu reader, the nightly queue and the Background writer's menu_import.
select cron.alter_job(jobid, active := false) from cron.job where jobname in ('ve-menu-reader', 've-menu-import-queue');
update public.lesaruss_dispatch_sources set enabled = false,
  notes = coalesce(notes, '') || ' Paused 2026-10-27 (Sean): menus are linked, not copied.' where key = 'menu_import' and enabled;

-- 2. What the link finder found.
alter table public.ve_menu_imports add column if not exists link_checked_at timestamptz, add column if not exists link_note text;

-- 3. The places the finder has not checked yet, most voted first.
create or replace function public.ve_menu_link_due(p_limit int default 15)
returns table(listing_id uuid) language sql stable security definer set search_path to 'public' as $$
  select l.id from listings l left join ve_menu_imports q on q.listing_id = l.id
  where l.status = 'approved' and coalesce(l.business_status, 'OPERATIONAL') <> 'CLOSED_PERMANENTLY' and l.parent_id is null
    and l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep')
    and coalesce(l.menu_crawl_url, '') = '' and l.website ~* '^https?://' and q.link_checked_at is null
    and coalesce(l.details->>'menu_none_ok', '') = ''
  order by l.vote_count desc nulls last, l.name limit p_limit;
$$;
revoke all on function public.ve_menu_link_due(int) from public, anon, authenticated;

-- 4. No menu link (Directory review's list): open food places whose Menu tab has nowhere to go. A claimed place with its own
--    menu is done; one marked No menu online leaves the list.
create or replace function public.ve_menu_missing()
returns table(listing_id uuid, slug text, name text, category text, city text, state text, logo_url text, website text,
  vote_count int, stage text, note text, tried_at timestamptz, menu_url text)
language sql stable security definer set search_path to 'public' as $$
  select l.id, l.slug, l.name, l.category, l.address_city, l.address_state, l.logo_url, l.website, coalesce(l.vote_count, 0)::int,
    s.stage, case when s.stage = 'waiting' then null else q.link_note end, q.link_checked_at, null::text
  from listings l
  left join ve_menu_imports q on q.listing_id = l.id
  cross join lateral (select case
      when coalesce(l.website, '') !~* '^https?://' then 'no_website'
      when q.link_checked_at is not null then 'not_found'
      else 'waiting' end as stage) s
  where l.status = 'approved' and coalesce(l.business_status, 'OPERATIONAL') <> 'CLOSED_PERMANENTLY' and l.parent_id is null
    and l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep')
    and coalesce(l.menu_crawl_url, '') = ''
    and not ((l.claim_status = 'verified' or l.owner_member_id is not null)
      and exists (select 1 from ve_menu_items m where m.listing_id = l.id and m.source <> 'import'))
    and coalesce(l.details->>'menu_none_ok', '') = ''
  order by case s.stage when 'not_found' then 0 when 'no_website' then 1 else 2 end, l.vote_count desc nulls last, l.name;
$$;
revoke all on function public.ve_menu_missing() from public, anon, authenticated;

-- 5. The places whose menu we copied already know where it lives: that page becomes their menu link.
with src as (
  select distinct on (m.listing_id) m.listing_id, m.source_url from ve_menu_items m
  where m.source = 'import' and m.source_url ~* '^https?://' order by m.listing_id, m.created_at),
pick as (
  select l.id, coalesce(src.source_url, nullif(q.menu_url, '')) as url from listings l
  left join src on src.listing_id = l.id left join ve_menu_imports q on q.listing_id = l.id
  where l.status = 'approved' and coalesce(l.menu_crawl_url, '') = '' and coalesce(src.source_url, nullif(q.menu_url, '')) ~* '^https?://'
    and l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep')),
upd as (update listings l set menu_crawl_url = pick.url, updated_at = now() from pick where l.id = pick.id returning l.id, pick.url)
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'menu_crawl_url', null, to_jsonb(url), '{"by":"logan","reason":"menu link from the page its menu was read from (2026-10-27)"}'::jsonb from upd;

-- 6. The link finder: 15 places every 10 minutes until each has been checked once.
select cron.schedule('ve-menu-links', '*/10 * * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-menu-reader',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"link_sweep","limit":15}'::jsonb, timeout_milliseconds := 30000)
$$);
