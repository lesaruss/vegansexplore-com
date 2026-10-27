-- Copied menus only while we keep them current (Sean, 2026-10-27: "if we can get an accurate menu, we can use that. But if a
-- restaurant doesn't have a menu that we can pull accurately and keep updated like on a monthly basis, then we go to [linking]
-- their menu... only if we can keep the menu up to date with our processes"). A copied item carries checked_at; the listing
-- page shows a copied menu only while it is under 35 days old, else its Menu tab links out. Run through ve-once-menu-check.

-- 1. When each copied item was last confirmed (new items: now; existing ones: when they were copied).
alter table public.ve_menu_items add column if not exists checked_at timestamptz;
update public.ve_menu_items set checked_at = created_at where checked_at is null;
alter table public.ve_menu_items alter column checked_at set default now();

-- 2. The copied menus due their monthly re-read (oldest first); a failed re-read tries again a week later.
create or replace function public.ve_menu_refresh_due(p_limit int default 1)
returns table(listing_id uuid) language sql stable security definer set search_path to 'public' as $$
  select m.listing_id from ve_menu_items m join listings l on l.id = m.listing_id left join ve_menu_imports q on q.listing_id = l.id
  where m.source = 'import' and l.status = 'approved' and coalesce(l.business_status, 'OPERATIONAL') <> 'CLOSED_PERMANENTLY'
    and not (l.claim_status = 'verified' or l.owner_member_id is not null)
    and (q.reader_at is null or q.reader_at < now() - interval '7 days')
  group by m.listing_id having min(m.checked_at) < now() - interval '28 days'
  order by min(m.checked_at) limit p_limit;
$$;
revoke all on function public.ve_menu_refresh_due(int) from public, anon, authenticated;

-- 3. Reading again: the Background writer's menu_import, its nightly queue and the menu reader (new menus, then re-checks).
select cron.alter_job(jobid, active := true) from cron.job where jobname in ('ve-menu-reader', 've-menu-import-queue');
update public.lesaruss_dispatch_sources set enabled = true,
  notes = coalesce(notes, '') || ' Back on 2026-10-27 (Sean): copied menus show only while the monthly re-read keeps them current.' where key = 'menu_import' and not enabled;

-- 4. No menu link leaves out a place showing a current copied menu.
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
    and not exists (select 1 from ve_menu_items m where m.listing_id = l.id and m.source = 'import' and m.checked_at > now() - interval '35 days')
    and coalesce(l.details->>'menu_none_ok', '') = ''
  order by case s.stage when 'not_found' then 0 when 'no_website' then 1 else 2 end, l.vote_count desc nulls last, l.name;
$$;
revoke all on function public.ve_menu_missing() from public, anon, authenticated;
