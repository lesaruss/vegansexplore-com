-- Fix it in Directory review (Sean, 2026-10-25: "right now it's allowing me to review but not fix... if I were able to find
-- the websites, find social, find the menu, I want to be able to input it here so it updates the listing and unflags it").
-- ve-outreach listing_fix saves what Sean found; this makes the flags and the menu writer follow it:
-- 1. "The website did not open" counts only for the site the check-up read, so a website fixed since is not flagged.
-- 2. A menu link Sean pastes (listings.menu_crawl_url, queued in ve_menu_imports.menu_url) is where the Background writer
--    starts, and a listing on hold for review (status pending) can take its menu too.

create or replace function public.ve_directory_review_flags()
returns table (listing_id uuid, slug text, name text, category text, city text, state text, community_slug text, logo_url text,
  website text, instagram text, flags text[], strong boolean, audit_id uuid, google_maps text)
language sql stable security definer set search_path to 'public' as $$
  with base as (
    select l.*, a.id aid, a.closure_level, a.facts, fr.decision,
      (select max(c.created_at) from ve_checkins c where c.listing_id = l.id) last_checkin,
      coalesce(a.facts->'google'->>'status', case when q.google_note like 'Google says CLOSED_PERMANENTLY%' then 'CLOSED_PERMANENTLY' end) gstatus,
      (select oc.community_slug from ve_outreach_cities oc where oc.kind = 'city' and oc.community_slug <> 'brands'
         and (oc.cities is null or l.address_city = any(oc.cities)) and (oc.states is null or l.address_state = any(oc.states)) limit 1) hub
    from listings l
    left join lateral (select * from ve_audits a where a.listing_id = l.id and a.status = 'done' order by a.created_at desc limit 1) a on true
    left join ve_audit_flag_reviews fr on fr.audit_id = a.id
    left join ve_listing_essentials q on q.listing_id = l.id
    where l.status = 'approved' and coalesce(l.business_status, '') <> 'CLOSED_PERMANENTLY'
      and (ve_audit_local_category(l.category) or l.category = 'Food Trucks & Vendors')
      and coalesce(l.address_city, '') <> '' and not ('lesaruss-ai-directory-candidate' = any(coalesce(l.tags, '{}')))
      and coalesce((l.details->>'review_ok_until')::date, '2000-01-01') < current_date
  ), f as (
    select b.*, array_remove(array[
      case when b.gstatus = 'CLOSED_PERMANENTLY' then 'Google says it is permanently closed'
           when b.gstatus = 'CLOSED_TEMPORARILY' then 'Google says it is temporarily closed' end,
      case when b.closure_level in ('closed', 'quiet') and b.decision is null then 'The monthly check-up flagged it as ' || case b.closure_level when 'closed' then 'closed' else 'gone quiet' end end,
      case when coalesce(b.instagram, '') = '' and coalesce(b.facebook, '') = '' and coalesce(b.tiktok, '') = '' then 'No socials' end,
      case when coalesce(nullif(b.google_hours_json::text, ''), 'null') in ('null', '{}', '[]', '""') then 'No hours' end,
      case when coalesce(b.address_street, '') = '' then 'No street address' end,
      case when coalesce(b.website, '') = '' then 'No website'
           -- A site that only turns away our scanner (401, 403, 406, 429, 503) is not down (the audit's lesson, 2026-10-10).
           -- Only for the site the check-up read: a website fixed since then (Directory review) is not flagged.
           when b.facts->'website'->>'error' is not null and b.facts->'website'->>'error' !~ '^(status (401|403|406|429|503)|no website)$'
             and coalesce(nullif(b.facts->'website'->>'url', ''), b.website) is not null
             and regexp_replace(lower(coalesce(nullif(b.facts->'website'->>'url', ''), b.website)), '^https?://(www\.)?|/+$', '', 'g')
               = regexp_replace(lower(b.website), '^https?://(www\.)?|/+$', '', 'g') then 'The website did not open' end
    ], null) fl
    from base b
  )
  select f.id, f.slug, f.name, f.category, f.address_city, f.address_state, f.hub, f.logo_url, f.website, f.instagram, f.fl,
    (f.gstatus = 'CLOSED_PERMANENTLY' or (f.closure_level in ('closed', 'quiet') and f.decision is null)
      or ('No socials' = any(f.fl) and ('No hours' = any(f.fl) or 'The website did not open' = any(f.fl) or 'No website' = any(f.fl))))
      -- A member checked in within 30 days: it is open, whatever else looks quiet.
      and coalesce(f.last_checkin < now() - interval '30 days', true) strong,
    f.aid, f.facts->'google'->>'maps'
  from f where cardinality(f.fl) > 0
  order by 12 desc, cardinality(f.fl) desc, f.name;
$$;
revoke all on function public.ve_directory_review_flags() from public, anon, authenticated;

create or replace function public.ve_menu_import_save(p_listing uuid, p_items jsonb, p_menu_url text default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare n int := 0; it jsonb; i int := 0; nm text;
begin
  if not exists (select 1 from listings where id = p_listing and status in ('approved', 'pending')) then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if exists (select 1 from ve_menu_items where listing_id = p_listing) then
    update ve_menu_imports set status = 'done', note = 'has a menu already', done_at = now() where listing_id = p_listing;
    return jsonb_build_object('ok', false, 'why', 'has_menu');
  end if;
  if p_menu_url is not null and p_menu_url !~ '^https?://' then return jsonb_build_object('ok', false, 'why', 'bad_url'); end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 300 then
    return jsonb_build_object('ok', false, 'why', 'items must be a list of at most 300');
  end if;
  for it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    i := i + 1;
    nm := left(btrim(coalesce(it->>'name', '')), 120);
    continue when nm = '';
    insert into ve_menu_items (listing_id, category, name, description, price_display, is_vegan, is_gluten_free, is_featured, is_available, sort_order, source, source_url)
    values (p_listing, coalesce(nullif(left(btrim(coalesce(it->>'category', '')), 60), ''), 'Menu'), nm,
      nullif(left(btrim(coalesce(it->>'description', '')), 400), ''), nullif(left(btrim(coalesce(it->>'price_display', '')), 30), ''),
      true, coalesce((it->>'is_gluten_free')::boolean, false), false, true, i * 10, 'import', p_menu_url);
    n := n + 1;
  end loop;
  insert into ve_menu_imports (listing_id, status, menu_url, items, note, done_at)
  values (p_listing, case when n > 0 then 'done' else 'none' end, p_menu_url, n, left(p_note, 300), now())
  on conflict (listing_id) do update set status = excluded.status, menu_url = excluded.menu_url, items = excluded.items, note = excluded.note, done_at = now();
  return jsonb_build_object('ok', true, 'saved', n);
end $$;

update public.lesaruss_dispatch_sources set instructions = replace(replace(instructions,
  $o$   select l.id, l.name, l.website, l.address_city, l.category from ve_menu_imports q join listings l on l.id = q.listing_id$o$,
  $n$   select l.id, l.name, l.website, q.menu_url, l.address_city, l.category from ve_menu_imports q join listings l on l.id = q.listing_id$n$),
  $o$   Open their website. Find the menu:$o$,
  $n$   When menu_url is set, someone on our team found the menu there by hand: start on that page and copy it, even when it is an ordering page the business uses.
   Otherwise open their website. Find the menu:$n$)
where key = 'menu_import' and instructions not like '%q.menu_url%';
