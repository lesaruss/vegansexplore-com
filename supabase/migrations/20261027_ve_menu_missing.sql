-- No menu yet (Sean, 2026-10-27: "Go with the No menu yet list in Directory review"). Every open food place with no menu on
-- its page, for the team to finish by hand: where it stands (being read by the writer or the menu reader, read and nothing
-- found, or no website to read), what the reader said, most voted first. Locations are left out: they show their main
-- listing's menu. One the team marks "No menu online" (details.menu_none_ok) leaves the list.
create or replace function public.ve_menu_missing()
returns table(listing_id uuid, slug text, name text, category text, city text, state text, logo_url text, website text,
  vote_count int, stage text, note text, tried_at timestamptz, menu_url text)
language sql stable security definer set search_path to 'public' as $$
  select l.id, l.slug, l.name, l.category, l.address_city, l.address_state, l.logo_url, l.website, coalesce(l.vote_count, 0)::int,
    s.stage, case when s.stage = 'reading' then null else coalesce(q.reader_note, q.note) end, coalesce(q.reader_at, q.done_at),
    coalesce(q.menu_url, l.menu_crawl_url)
  from listings l
  left join ve_menu_imports q on q.listing_id = l.id
  cross join lateral (select case
      when coalesce(l.website, '') !~* '^https?://' and coalesce(q.menu_url, l.menu_crawl_url, '') = '' then 'no_website'
      when q.listing_id is null or q.status in ('queued', 'reading') or q.reader_note = 'Reading'
        or (q.status in ('none', 'failed') and q.reader_at is null) then 'reading'
      else 'not_found' end as stage) s
  where l.status = 'approved' and coalesce(l.business_status, 'OPERATIONAL') <> 'CLOSED_PERMANENTLY' and l.parent_id is null
    and l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep')
    and not exists (select 1 from ve_menu_items m where m.listing_id = l.id)
    and coalesce(l.details->>'menu_none_ok', '') = ''
  order by case s.stage when 'not_found' then 0 when 'no_website' then 1 else 2 end, l.vote_count desc nulls last, l.name;
$$;
revoke all on function public.ve_menu_missing() from public, anon, authenticated;
