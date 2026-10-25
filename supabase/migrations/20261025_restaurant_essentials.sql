-- Restaurant essentials (Sean, 2026-10-25): "show the type of restaurant it is. Because just because it's vegan doesn't tell
-- the whole story. Some are Caribbean, some are Ethiopian, Italian... we can select multiple" and "all the restaurant listings
-- have, 250 character about us. They have the hours. They have the socials that are available. They have the address that you
-- can click and go to Google Maps... and then the menus. Those should be the mandatory things... media... can come later."
--
-- 1. listings.cuisines: what kind of food, up to four (Global mix for a place that is not one thing). Set in the listing editor
--    (ve-claims admin_listing), shown on the listing page beside how Vegan it is, and a Food filter in the Directory.
-- 2. ve_restaurant_essentials: every open food place and what it is missing (about, hours, socials, address, menu, cuisine).
-- 3. Filled from what the business itself publishes, never invented, and never over the owner's own words:
--    - Google and their website (ve-restaurant-audit `essentials`, cron ve-listing-essentials): hours, street, Google place,
--      website, and the Instagram, Facebook and TikTok their own site links to.
--    - The Background writer (dispatcher source listing_essentials): the about (up to 250 characters, from their own site and
--      Google's own summary) and the cuisines, through ve_listing_essentials_save.
--    Menus come from menu_import (20261024_ve_menu_import.sql). Every change is a ve_listing_edits row (member_id null, meta.by
--    google | website | writer), so the Depot's Undo works on it.

-- 1. Cuisines. Keep the list in step with CUISINES in /public/ve-listing-admin.js, /public/ve-region-directory.js and ve-claims.
alter table public.listings add column if not exists cuisines text[] not null default '{}';
alter table public.listings add constraint listings_cuisines_known
  check (cuisines <@ array['american','soul','caribbean','latin','mexican','cuban','italian','mediterranean','middle_eastern','ethiopian',
    'african','indian','thai','chinese','japanese','korean','vietnamese','asian','burgers','bowls','raw','brunch','desserts','global']::text[]
    and cardinality(cuisines) <= 4);
update public.listings set cuisines = array['american'] where cuisine_type = 'American' and cuisines = '{}';
update public.listings set cuisines = array['caribbean'] where cuisine_type = 'Caribbean/Jamaican' and cuisines = '{}';
update public.listings set cuisines = array['mexican'] where cuisine_type = 'Mexican' and cuisines = '{}';

-- 2. What each open food place is missing. An about counts at 150 characters or more (the target is up to 250).
create or replace view public.ve_restaurant_essentials as
select l.id, l.slug, l.name, l.category, l.address_city, l.address_state,
  length(coalesce(l.description, '')) >= 150 as has_about,
  coalesce(nullif(l.google_hours_json::text, ''), 'null') not in ('null', '{}', '[]', '""') as has_hours,
  coalesce(l.instagram, '') <> '' or coalesce(l.facebook, '') <> '' or coalesce(l.tiktok, '') <> '' as has_socials,
  coalesce(l.address_street, '') <> '' as has_address,
  exists (select 1 from public.ve_menu_items m where m.listing_id = l.id) as has_menu,
  cardinality(l.cuisines) > 0 as has_cuisine,
  l.website, l.google_place_id
from public.listings l
where l.status = 'approved' and l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks & Vendors', 'Catering', 'Meal Prep')
  and coalesce(l.business_status, 'OPERATIONAL') <> 'CLOSED_PERMANENTLY';
revoke all on public.ve_restaurant_essentials from public, anon, authenticated;

-- 3. The queue: one row per listing. google_checked_at is the Google and website step; write_status the writer's.
create table if not exists public.ve_listing_essentials (
  listing_id uuid primary key references public.listings(id),
  google_checked_at timestamptz,
  google_note text,
  write_status text not null default 'queued' check (write_status in ('queued', 'writing', 'done', 'none', 'failed')),
  write_marked_at timestamptz,
  written_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
alter table public.ve_listing_essentials enable row level security;

-- Every open food place missing something gets a row; the writer's part is queued when the about or the cuisine is missing.
create or replace function public.ve_listing_essentials_queue()
returns int language sql security definer set search_path to 'public' as $$
  with ins as (
    insert into ve_listing_essentials (listing_id, write_status)
    select e.id, case when not e.has_about or not e.has_cuisine then 'queued' else 'done' end
    from ve_restaurant_essentials e
    where not (e.has_about and e.has_hours and e.has_socials and e.has_address and e.has_cuisine)
    on conflict (listing_id) do nothing
    returning 1)
  select count(*)::int from ins;
$$;

-- The next listings for the Google and website step: missing hours, a street, the Google place or socials, not checked in 30 days.
create or replace function public.ve_listing_essentials_due(p_limit int default 15)
returns table (id uuid, slug text, name text, address_street text, address_city text, address_state text, google_place_id text,
  website text, need_hours boolean, need_street boolean, need_socials boolean)
language sql stable security definer set search_path to 'public' as $$
  select e.id, e.slug, e.name, l.address_street, e.address_city, e.address_state, e.google_place_id, e.website,
    not e.has_hours, not e.has_address, not e.has_socials
  from ve_restaurant_essentials e
  join listings l on l.id = e.id
  left join ve_listing_essentials q on q.listing_id = e.id
  where (not e.has_hours or not e.has_address or not e.has_socials or e.google_place_id is null)
    and (q.google_checked_at is null or q.google_checked_at < now() - interval '30 days')
  order by q.google_checked_at nulls first, l.vote_count desc nulls last
  limit greatest(1, least(p_limit, 40));
$$;

-- 4. The writer saves what it read, once per field: an about only where ours is under 150 characters and the owner has not
--    written their own, cuisines only where none are set, a social only where that one is empty. p_socials: {instagram, facebook,
--    tiktok}. Answers {ok, changed: [...], refused: [{field, why}]}.
create or replace function public.ve_listing_essentials_save(p_listing uuid, p_about text default null, p_cuisines text[] default null,
  p_socials jsonb default null, p_source_url text default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare l listings%rowtype; changed text[] := '{}'; refused jsonb := '[]'::jsonb; a text; c text[]; v text; k text;
  known text[] := array['american','soul','caribbean','latin','mexican','cuban','italian','mediterranean','middle_eastern','ethiopian',
    'african','indian','thai','chinese','japanese','korean','vietnamese','asian','burgers','bowls','raw','brunch','desserts','global'];
  meta jsonb := jsonb_build_object('by', 'writer', 'source', p_source_url);
begin
  select * into l from listings where id = p_listing and status = 'approved';
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if p_source_url is not null and p_source_url !~ '^https?://' then return jsonb_build_object('ok', false, 'why', 'bad_url'); end if;

  if p_about is not null then
    a := btrim(regexp_replace(p_about, '\s+', ' ', 'g'));
    if length(a) < 120 or length(a) > 250 then refused := refused || jsonb_build_object('field', 'about', 'why', 'must be 120 to 250 characters, was ' || length(a));
    elsif a ~ '[—–]' then refused := refused || jsonb_build_object('field', 'about', 'why', 'no em or en dashes');
    elsif a ~ '\mvegan\M' then refused := refused || jsonb_build_object('field', 'about', 'why', 'capitalize Vegan');
    elsif length(coalesce(l.description, '')) >= 150 then refused := refused || jsonb_build_object('field', 'about', 'why', 'already has one');
    elsif exists (select 1 from ve_listing_edits e where e.listing_id = l.id and e.field = 'description' and e.member_id is not null and e.undone_at is null)
      then refused := refused || jsonb_build_object('field', 'about', 'why', 'the owner wrote their own');
    else
      update listings set description = a, updated_at = now() where id = l.id;
      insert into ve_listing_edits (listing_id, field, old_value, new_value, meta) values (l.id, 'description', to_jsonb(l.description), to_jsonb(a), meta);
      changed := changed || 'about'::text;
    end if;
  end if;

  if p_cuisines is not null and cardinality(p_cuisines) > 0 then
    select coalesce(array_agg(distinct x), '{}') into c from unnest(p_cuisines) x where x = any(known);
    if cardinality(c) = 0 or cardinality(c) > 4 then refused := refused || jsonb_build_object('field', 'cuisines', 'why', 'one to four from the list');
    elsif cardinality(l.cuisines) > 0 then refused := refused || jsonb_build_object('field', 'cuisines', 'why', 'already set');
    else
      update listings set cuisines = c, updated_at = now() where id = l.id;
      insert into ve_listing_edits (listing_id, field, old_value, new_value, meta) values (l.id, 'cuisines', to_jsonb(l.cuisines), to_jsonb(c), meta);
      changed := changed || 'cuisines'::text;
    end if;
  end if;

  if p_socials is not null and jsonb_typeof(p_socials) = 'object' then
    for k in select unnest(array['instagram', 'facebook', 'tiktok']) loop
      v := btrim(coalesce(p_socials->>k, ''));
      continue when v = '';
      if k = 'instagram' then v := '@' || lower(regexp_replace(regexp_replace(v, '^(https?://)?(www\.)?instagram\.com/', '', 'i'), '^@|[/?#].*$', '', 'g'));
        if v !~ '^@[a-z0-9._]{1,30}$' then refused := refused || jsonb_build_object('field', k, 'why', 'not an Instagram handle'); continue; end if;
      elsif k = 'tiktok' then v := '@' || lower(regexp_replace(regexp_replace(v, '^(https?://)?(www\.)?tiktok\.com/@?', '', 'i'), '^@|[/?#].*$', '', 'g'));
        if v !~ '^@[a-z0-9._]{2,24}$' then refused := refused || jsonb_build_object('field', k, 'why', 'not a TikTok handle'); continue; end if;
      else
        if v !~* '^https?://(www\.|m\.)?facebook\.com/[^/?#]+' then refused := refused || jsonb_build_object('field', k, 'why', 'not a Facebook page link'); continue; end if;
        v := regexp_replace(v, '^https?://(www\.|m\.)?', 'https://www.', 'i');
      end if;
      if coalesce(case k when 'instagram' then l.instagram when 'facebook' then l.facebook else l.tiktok end, '') <> '' then
        refused := refused || jsonb_build_object('field', k, 'why', 'already set'); continue; end if;
      execute format('update listings set %I = $1, updated_at = now() where id = $2', k) using v, l.id;
      insert into ve_listing_edits (listing_id, field, old_value, new_value, meta) values (l.id, k, null, to_jsonb(v), meta);
      changed := changed || k;
    end loop;
  end if;

  insert into ve_listing_essentials (listing_id, write_status, written_at, note) values (l.id, 'done', now(), left(p_note, 300))
  on conflict (listing_id) do update set write_status = case when cardinality(changed) > 0 or p_note is not null then 'done' else 'none' end,
    written_at = now(), note = coalesce(left(p_note, 300), ve_listing_essentials.note);
  return jsonb_build_object('ok', true, 'changed', to_jsonb(changed), 'refused', refused);
end $$;

revoke all on function public.ve_listing_essentials_queue() from public, anon, authenticated;
revoke all on function public.ve_listing_essentials_due(int) from public, anon, authenticated;
revoke all on function public.ve_listing_essentials_save(uuid, text, text[], jsonb, text, text) from public, anon, authenticated;

select public.ve_listing_essentials_queue();
select public.ve_menu_import_queue();

-- 5. The dispatcher job for the writer's part.
insert into public.lesaruss_dispatch_sources (key, label, enabled, batch, sort, instructions, notes)
values ('listing_essentials', 'Directory: about and cuisine for food places, from their own words', true, 5,
  coalesce((select max(sort) from public.lesaruss_dispatch_sources where key = 'menu_import'), 13) + 1,
$i$
Vegans Explore Directory, the restaurant essentials. Each listing below is an open Vegan food place whose page is missing a proper about (we want 150 to 250 characters) or the kind of food it serves. Write both from what the business itself says: its own website, its own Instagram bio, and Google's own summary of it. Never invent a dish, an award, a year, an owner's name or anything else you did not read there.
1. Load up to BATCH listings:
   select l.id, l.name, l.website, l.instagram, l.address_city, l.category, l.vegan_status, l.description, l.cuisines
   from ve_listing_essentials q join listings l on l.id = q.listing_id
   where q.write_status = 'queued' or (q.write_status = 'writing' and q.write_marked_at < now() - interval '30 minutes')
   order by l.vote_count desc nulls last, q.created_at limit BATCH;
2. For each: update ve_listing_essentials set write_status = 'writing', write_marked_at = now() where listing_id = '<id>';
   Read their website (home and about page) or, with no website, their Instagram profile.
3. The about: 150 to 250 characters, plain and warm, third person, what they serve and what it is like, in their own terms
   ("Family-run Jamaican kitchen in Lauderhill serving..."). vegan_status fully_vegan means 100% Vegan; say Vegan options only
   when that is what it is. Always capitalize Vegan. No em dashes or en dashes, no exclamation marks, no prices, no hours.
   If our description is already 150 characters or more, pass null.
4. The cuisines, one to four slugs from this list only, the ones that describe most of the menu:
   american (American and comfort food), soul, caribbean, latin, mexican, cuban, italian (and pizza), mediterranean, middle_eastern,
   ethiopian, african, indian, thai, chinese, japanese (and sushi), korean, vietnamese, asian (pan-Asian), burgers (and fast food),
   bowls (and salads), raw (and juice bar), brunch, desserts (and sweets), global (a menu from many places, not one thing).
5. Socials only if you saw them linked from their own site: {"instagram": "@handle", "facebook": "https://www.facebook.com/page", "tiktok": "@handle"}.
6. Save in one call (dollar-quote text as $a$...$a$):
   select ve_listing_essentials_save('<id>', $a$<about or null>$a$, array['caribbean'], '{"instagram": "@..."}'::jsonb, '<the page you read>', null);
   If there is nothing to read (no website, the site is down, no Instagram), save with a note and nothing else:
   select ve_listing_essentials_save('<id>', null, null, null, null, 'No website or Instagram to read');
   It answers {ok, changed, refused: [{field, why}]}. Fix a refused about (length, dashes, Vegan) and call again once.
Do not change the listings or any other table directly.
$i$,
'Restaurant essentials (Sean, 2026-10-25). Fills listings.description (only under 150 characters and never over the owner''s words), cuisines and socials through ve_listing_essentials_save; each change is a ve_listing_edits row.')
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
    'listing_essentials', (select count(*) from ve_listing_essentials where write_status = 'queued' or (write_status = 'writing' and write_marked_at < now() - interval '30 minutes')),
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

-- 6. The Google and website step, every morning (8 AM UTC, after the check-ups), 15 at a time until nothing is due.
select cron.schedule('ve-listing-essentials', '*/10 8 * * *', $c$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-restaurant-audit',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"essentials","limit":15}'::jsonb, timeout_milliseconds := 150000)
  where exists (select 1 from public.ve_listing_essentials_due(1));
$c$);
