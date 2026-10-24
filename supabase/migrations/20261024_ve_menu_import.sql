-- Menus on every listing (Sean, 2026-10-24: "I would love to see the menus on all the listings. I think it gives another level
-- to this page"). An owner edits their own menu on their dashboard (ve-claims menu_save, source 'owner'). For everyone else the
-- Background writer (dispatcher source menu_import, Station 2, on the subscription) reads the menu the business publishes on
-- its own website and copies it, word for word, never guessed. An imported menu shows on the page as "From their website,
-- checked <month>"; it never replaces a menu an owner or the team entered (source owner or manual).

-- 1. Where each menu item came from.
alter table public.ve_menu_items add column if not exists source text not null default 'manual';
alter table public.ve_menu_items add constraint ve_menu_items_source_check check (source in ('manual', 'owner', 'import'));
alter table public.ve_menu_items add column if not exists source_url text;

-- 2. The queue: one row per listing the writer has tried.
create table if not exists public.ve_menu_imports (
  listing_id uuid primary key references public.listings(id),
  status text not null default 'queued' check (status in ('queued', 'reading', 'done', 'none', 'failed')),
  menu_url text,
  items int not null default 0,
  note text,
  marked_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.ve_menu_imports enable row level security;

-- Food places that are open, have a website and no menu yet. Run again any time; a listing is queued once.
create or replace function public.ve_menu_import_queue()
returns int language sql security definer set search_path to 'public' as $$
  with ins as (
    insert into ve_menu_imports (listing_id)
    select l.id from listings l
    where l.status = 'approved' and l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks & Vendors', 'Catering', 'Meal Prep')
      and coalesce(l.business_status, 'OPERATIONAL') <> 'CLOSED_PERMANENTLY' and coalesce(l.website, '') ~ '^https?://'
      and not exists (select 1 from ve_menu_items m where m.listing_id = l.id)
    on conflict (listing_id) do nothing
    returning 1)
  select count(*)::int from ins;
$$;

-- 3. The writer saves what it read, once: it refuses a listing that already has a menu (entered, or imported before).
--    p_items: [{category, name, description?, price_display?, is_gluten_free?}] in the order the menu shows them. An empty list
--    with a note marks the listing as having no menu we can read (a PDF scan, a picture, no menu online).
create or replace function public.ve_menu_import_save(p_listing uuid, p_items jsonb, p_menu_url text default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare n int := 0; it jsonb; i int := 0; nm text;
begin
  if not exists (select 1 from listings where id = p_listing and status = 'approved') then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
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
revoke all on function public.ve_menu_import_save(uuid, jsonb, text, text) from public, anon, authenticated;
revoke all on function public.ve_menu_import_queue() from public, anon, authenticated;

select public.ve_menu_import_queue();

-- 4. The dispatcher job.
insert into public.lesaruss_dispatch_sources (key, label, enabled, batch, sort, instructions, notes)
values ('menu_import', 'Directory: copy menus from the businesses'' own websites', true, 5,
  coalesce((select max(sort) from public.lesaruss_dispatch_sources where key = 'content_moments_tag'), 12) + 1,
$i$
Vegans Explore Directory menus. Each listing below is a Vegan food place with a website and no menu on its page yet. Copy the menu the business itself publishes, so visitors see what they serve. Never invent, guess or "improve" an item, a price or a description. Only what their own site shows.
1. Load up to BATCH listings:
   select l.id, l.name, l.website, l.address_city, l.category from ve_menu_imports q join listings l on l.id = q.listing_id
   where q.status = 'queued' or (q.status = 'reading' and q.marked_at < now() - interval '30 minutes')
   order by l.vote_count desc nulls last, q.created_at limit BATCH;
2. For each: update ve_menu_imports set status = 'reading', marked_at = now() where listing_id = '<id>';
   Open their website. Find the menu: a Menu link or page on the same site, or the online ordering page their own site links to (Toast, Square, ChowNow, their own shop). Skip Yelp, Google, DoorDash, Uber Eats, Grubhub and any other third-party listing that the business does not run.
3. Copy the menu as text, in the order shown: each item's section (category, as they name it: Bowls, Smoothies...), name, description if there is one, and price exactly as written ($14, $12 / $16, MP). Mark is_gluten_free true only when the menu says so. Leave out drinks lists only if they are just sodas and water; keep juices, smoothies, coffee and teas. Up to 300 items; for a huge menu take every section but the add-ons. Always capitalize Vegan. No em dashes or en dashes.
4. Save in one call (dollar-quote the JSON as $j$...$j$):
   select ve_menu_import_save('<id>', $j$[{"category": "Bowls", "name": "...", "description": "...", "price_display": "$14"}]$j$::jsonb, '<the menu page url>', null);
   If there is no menu you can read as text (only a scanned picture or a PDF you cannot read, no menu online, the site is down, or it is not their site), save none with the reason:
   select ve_menu_import_save('<id>', '[]'::jsonb, null, 'Menu is a picture only');
   It answers {ok, saved} or {ok: false, why}. has_menu means someone already entered their menu: leave it.
Do not change the listings or any other table.
$i$,
'Menus on every listing (Sean, 2026-10-24). Fills ve_menu_items with source import; ve_menu_import_save refuses a menu an owner or the team entered.')
on conflict (key) do nothing;

create or replace function public.lesaruss_dispatch_pending()
 returns jsonb
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
    'news_desk_write', (select count(*) from ve_news_leads where status = 'write' or (status = 'drafting' and marked_at < now() - interval '20 minutes')),
    'pulse_topic_write', (select count(*) from ve_board_posts where kind = 'topic' and status = 'draft' and (write_status = 'queued' or (write_status = 'writing' and write_marked_at < now() - interval '20 minutes'))),
    'content_moments_tag', (select count(*) from ve_content_transcripts where status = 'ready' and (tag_status = 'queued' or (tag_status = 'tagging' and tag_marked_at < now() - interval '30 minutes'))),
    'menu_import', (select count(*) from ve_menu_imports where status = 'queued' or (status = 'reading' and marked_at < now() - interval '30 minutes')),
    'fieldy_topicizer', (select count(*) from fieldy_transcripts where received_at > coalesce((select last_processed_through from fieldy_topicizer_state where id = 1), '2026-04-15') and received_at < now() - interval '30 minutes'),
    'room_work_orders', (select count(*) from room_work_orders where status = 'queued'),
    'agent_tasks_logan', (select count(*) from agent_tasks where status = 'pending' and lower(to_agent) = 'logan'),
    'fieldy_v_requests', (select count(*) from fieldy_transcripts where is_command and coalesce(command_status, 'pending') not in ('completed', 'done', 'dismissed', 'failed')),
    'personal_ideas_raw', (select count(*) from personal_ideas where status = 'raw'),
    'brand_features_to_build', (select count(*) from brand_dashboard_features where planned and not live),
    'playbook_orders_due', (select count(*) from playbook_records where applied = false),
    'people_tasks', (select count(*) from people_profile_queue where status not in ('profiled', 'skipped'))
  );
$function$;
