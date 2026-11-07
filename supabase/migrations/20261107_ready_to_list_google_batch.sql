-- Ready to list, Google-track rows (Logan, 2026-11-07, playbook ve-community-directory; Sean: work the 330 Ready to list, light check, best guess, no Google calls).
-- Light check, from what we already hold plus a read of each website through pg_net: open on Google (all were OPERATIONAL), the website answers or the
-- place has 5 or more Google reviews. Pass = listed (same as backlog_decide, Google address/place/phone), category from the community search's own
-- guess, no How Vegan for Rescues, Sanctuaries and Nonprofits, food places Vegan options, a team note saying it is a best guess. Fail = set aside with why.
-- Unsure (no working site and under 5 reviews, a wrong Google match, a hijacked or renamed site) = left in Ready to list for Sean.
-- Idempotent: only rows still quarantined and undecided are touched. Run 2026-11-07 through the Supabase connector.
do $$
declare r record; n_list int := 0; n_hide int := 0; s text; base text; nm text; cat text; vs text; lab text; par uuid; clr boolean; note text;
  hide_ids text[] := array['95647db7','af6fa451','54de22eb','f17335d7','bb7c84bf','c45bc3d8','836cf7f5'];
  hide_why text[] := array['A mobile petting zoo that breeds and sells livestock; not an animals-first rescue.',
    'Its website is gone (404, the Farm Animal Rights Movement page), no Google reviews.',
    'A city-run shelter (cityoffortpierce.com); city and county shelters are left out.',
    'A second copy of Brandywine Valley SPCA, which is already listed (its Georgetown campus is listed here).',
    'The same organization as Toby''s Legacy Critter Creek Ranch Foundation, which is already listed.',
    'A program of Jacksonville Humane Society at the same address; the shelter is listed.',
    'A program of Friends of Strays Animal Shelter at the same address; the shelter is listed.'];
  unsure_ids text[] := array['fc008aba','8a5d41a2','fa981a91','aab04379','5d38702c','3fd202ea','9d018c1b','ddc6e330','b501174d','9f034c2f','64c74a51','00fd8a1e','fc328a31','e0bc3815','ee66a015','bac86183','fd8c253f','2da2fcbf','15797c75','37189729','0188357c','4babe724'];
  food_ids text[] := array['1220945b','ef4296c7','d7c809a4','a77d0f49','96f0ce85'];
  dead_names text[] := array['Pet Haven St Lucie','Vintage Paws Sanctuary','Candle'];
  i int;
begin
  for r in
    select l.id, l.name, l.slug, l.website, l.ig_handle, b.place p, b.reason, b.verdict, b.checked_at, b.community_slug cs,
           coalesce((b.place->>'reviews')::int, 0) rv
    from ve_backlog_checks b join listings l on l.id = b.listing_id
    where b.verdict = 'list' and b.decision is null and b.track = 'google' and l.status = 'quarantined' and b.place->>'id' is not null
  loop
    if left(r.id::text, 8) = any (unsure_ids) then continue; end if;
    i := array_position(hide_ids, left(r.id::text, 8));
    if i is not null then
      update listings set status = 'rejected', updated_at = now(),
        details = coalesce(details, '{}'::jsonb) || jsonb_build_object('status_before_hidden', 'quarantined',
          'backlog', jsonb_build_object('verdict', r.verdict, 'reason', r.reason, 'checked_at', r.checked_at, 'decided', 'hide', 'by', 'Logan', 'at', now()),
          'admin_notes', coalesce(details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
            'text', 'Set aside after the light check (2026-11-07): ' || hide_why[i])))
      where id = r.id;
      update ve_backlog_checks set decision = 'hidden', decided_at = now() where listing_id = r.id;
      n_hide := n_hide + 1; continue;
    end if;
    -- clean name (zero-width characters), a city on a second listing of one name
    nm := regexp_replace(r.name, '[​‌‍﻿]', '', 'g');
    nm := btrim(regexp_replace(nm, '\s+', ' ', 'g'));
    if r.name = 'Freedom Hearts Animal Rescue' then nm := 'Freedom Hearts Animal Rescue - ' || (r.p->>'city'); end if;
    if r.name = 'Brandywine Valley SPCA, Delaware - Copeland Center' or r.name like 'Brandywine Valley SPCA, Delaware - C%' then nm := 'Brandywine Valley SPCA - Copeland Center'; end if;
    if r.name like 'Brandywine Valley SPCA, Georgetown%' then nm := 'Brandywine Valley SPCA - Georgetown'; end if;
    if r.name like 'Brandywine Valley SPCA, Washington%' then nm := 'Brandywine Valley SPCA - Ivy City'; end if;
    if r.name = 'Brandywine Valley SPCA Dover' then nm := 'Brandywine Valley SPCA - Dover'; end if;
    if r.name like 'Furkids Headquarters%' then nm := 'Furkids Headquarters'; end if;
    if r.name = 'FurKids of East Cobb' then nm := 'Furkids East Cobb'; end if;
    if r.name like 'Dogs Trust Harefield%' then nm := 'Dogs Trust Harefield Rehoming Centre'; end if;
    -- location of an already listed main listing
    par := null; lab := null;
    if r.name like 'Brandywine Valley SPCA%' then par := '54904f73-3433-4149-a771-113a4ad1459d';
      lab := case when r.name like '%Dover' then 'Dover' when r.name like '%Copeland%' then 'Copeland Center, New Castle' when r.name like '%Georgetown%' then 'Georgetown' else 'Ivy City, Washington, DC' end; end if;
    if r.name like 'Dogs Trust Harefield%' then par := '117f84fb-8519-4448-a3db-b31b8534bee4'; lab := 'Harefield'; end if;
    if r.name like 'Furkids Headquarters%' then par := '9b96282d-f6bb-466f-a9e2-d35cb983d72e'; lab := 'Headquarters, Cumming'; end if;
    if r.name = 'FurKids of East Cobb' then par := '9b96282d-f6bb-466f-a9e2-d35cb983d72e'; lab := 'East Cobb, Marietta'; end if;
    -- category and How Vegan
    if left(r.id::text, 8) = any (food_ids) then
      cat := case left(r.id::text, 8) when '96f0ce85' then 'Markets' else 'Restaurants' end;
      vs := case left(r.id::text, 8) when '96f0ce85' then 'fully_vegan' else 'vegan_options' end;
    else
      cat := case substring(r.reason from 'looks like a (\w+)') when 'rescue' then 'Rescues' when 'sanctuary' then 'Sanctuaries' else 'Nonprofits' end;
      vs := null;
    end if;
    clr := nm = any (dead_names) and r.name = any (dead_names);
    note := case when clr then 'Its website no longer answers (404), so the link was left off; open on Google with ' || r.rv || ' reviews.'
                 when r.rv >= 5 then 'Open on Google with ' || r.rv || ' reviews.' else 'Open on Google; its website answers.' end;
    s := r.slug;
    if nm <> r.name or r.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
      base := trim(both '-' from regexp_replace(lower(nm), '[^a-z0-9]+', '-', 'g'));
      s := base;
      if exists (select 1 from listings x where x.slug = s and x.id <> r.id and x.status in ('approved', 'quarantined', 'pending')) then s := base || '-' || left(r.id::text, 4); end if;
    end if;
    update listings set status = 'approved', updated_at = now(), name = nm, slug = s, category = cat, extra_categories = '{}', vegan_status = vs,
      parent_id = par, location_label = lab,
      communities = case when par is null then array[r.cs] else communities end,
      google_place_id = r.p->>'id',
      address_street = nullif(r.p->>'street', ''), address_city = nullif(r.p->>'city', ''), address_state = nullif(r.p->>'state', ''),
      address_zip = nullif(r.p->>'zip', ''), address_country = nullif(r.p->>'country', ''),
      latitude = (r.p->>'lat')::float8, longitude = (r.p->>'lng')::float8,
      business_status = coalesce(r.p->>'status', 'OPERATIONAL'), google_rating = (r.p->>'rating')::numeric,
      google_reviews_count = coalesce((r.p->>'reviews')::int, 0), google_category = r.p->>'type_name',
      location = coalesce(nullif(concat_ws(', ', nullif(r.p->>'city', ''), nullif(r.p->>'state', '')), ''), location, ''),
      website = case when clr then '' else coalesce(nullif(website, ''), r.p->>'website', '') end,
      phone = coalesce(r.p->>'phone', phone),
      details = coalesce(details, '{}'::jsonb) || jsonb_build_object(
        'backlog', jsonb_build_object('verdict', r.verdict, 'reason', r.reason, 'checked_at', r.checked_at, 'decided', 'list', 'by', 'Logan', 'at', now()),
        'admin_notes', coalesce(details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
          'text', 'Listed from the backlog check after a light check by Logan (2026-11-07, Sean: work Ready to list): ' || note
                  || ' Category' || case when vs is not null then ' and How Vegan' else '' end || ' are a best guess; adjust freely.')))
    where id = r.id;
    update ve_backlog_checks set decision = 'listed', decided_at = now() where listing_id = r.id;
    n_list := n_list + 1;
  end loop;
  raise notice 'listed %, set aside %', n_list, n_hide;
end $$;
