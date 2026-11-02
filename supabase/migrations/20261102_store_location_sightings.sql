-- Location-checked sightings and the chain registry (LOCKED by Sean 2026-11-02: "Yes, please"; canon canon-ve-store-scan-search v2, playbook
-- ve-store-scan-search). Sean: "I can lock it in for Publix and specifically that location... Publix is known to carry this product. And then
-- people go in and they say, I don't see the product... if enough locations don't carry it, then maybe that raises a red flag... people see the
-- bounties... once we're able to get sponsored by a supermarket, maybe there's a way for us to get access to their inventory."

alter table public.ve_store_sightings
  add column if not exists venue_id uuid references public.ve_venues(id),
  add column if not exists lat numeric, add column if not exists lng numeric,
  add column if not exists accuracy_m integer, add column if not exists distance_m integer,
  add column if not exists photo_path text,
  add column if not exists local_day date,
  add column if not exists paid_points integer not null default 0,
  add column if not exists status text not null default 'live';
create index if not exists ve_store_sightings_venue_idx on public.ve_store_sightings (venue_id, product_id, created_at desc);
create unique index if not exists ve_store_sightings_once_a_day on public.ve_store_sightings (member_id, venue_id, gtin, local_day) where venue_id is not null;

insert into public.ve_site_settings (key, value) values ('store_sightings', jsonb_build_object(
  'seen', 2, 'not_here', 2, 'not_here_photo', 5, 'daily_paid_cap', 20, 'daily_reports', 60,
  'window_days', 60, 'flag_min_locations', 3, 'flag_share', 0.3))
on conflict (key) do nothing;

-- The team's decision on a flagged item: kept (still carried; the flag returns only on newer reports) or dropped (off the chain's registry).
create table if not exists public.ve_item_flag_reviews (
  chain_listing_id uuid not null references public.listings(id),
  product_id uuid not null references public.ve_products(id),
  decision text not null check (decision in ('kept', 'dropped')),
  note text,
  decided_by uuid,
  decided_at timestamptz not null default now(),
  primary key (chain_listing_id, product_id)
);
alter table public.ve_item_flag_reviews enable row level security;

-- What the locations say about one item at one chain: the latest report from each location in the window.
create or replace function public.ve_item_chain_counts(p_chain uuid, p_product uuid)
returns table (seen_n int, not_n int, last_seen timestamptz, flagged boolean)
language plpgsql stable security definer set search_path = public as $$
declare cfg jsonb; wd int; mn int; sh numeric; kept timestamptz; s int; nn int; nf int; ls timestamptz;
begin
  select coalesce(value, '{}'::jsonb) into cfg from ve_site_settings where key = 'store_sightings';
  cfg := coalesce(cfg, '{}'::jsonb);
  wd := coalesce((cfg->>'window_days')::int, 60); mn := coalesce((cfg->>'flag_min_locations')::int, 3); sh := coalesce((cfg->>'flag_share')::numeric, 0.3);
  select decided_at into kept from ve_item_flag_reviews where chain_listing_id = p_chain and product_id = p_product and decision = 'kept';
  select count(*) filter (where l.seen), count(*) filter (where not l.seen), max(l.created_at) filter (where l.seen),
         count(*) filter (where not l.seen and l.created_at > coalesce(kept, '-infinity'::timestamptz))
    into s, nn, ls, nf
    from (select distinct on (x.venue_id) x.venue_id, x.seen, x.created_at from ve_store_sightings x
           where x.store_listing_id = p_chain and x.product_id = p_product and x.venue_id is not null and x.status = 'live'
             and x.created_at > now() - make_interval(days => wd)
           order by x.venue_id, x.created_at desc) l;
  return query select coalesce(s, 0), coalesce(nn, 0), ls,
    (coalesce(nf, 0) >= mn and coalesce(nf, 0)::numeric / greatest(coalesce(s, 0) + coalesce(nn, 0), 1) >= sh);
end $$;
grant execute on function public.ve_item_chain_counts(uuid, uuid) to service_role;

-- A phone inside a store says an item is, or is not, on its shelf. Only items we know are Vegan (a live barcode) count.
create or replace function public.ve_store_sighting_at(p_member uuid, p_venue uuid, p_gtin text, p_seen boolean,
  p_lat numeric, p_lng numeric, p_accuracy numeric, p_photo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v ve_venues%rowtype; code text; bc record; d numeric; acc numeric := greatest(coalesce(p_accuracy, 0), 0);
  today date := (now() at time zone 'America/New_York')::date; n int; sid uuid; cfg jsonb; pts int := 0; paid_today int; cap int; c record; chain_name text;
begin
  select * into v from ve_venues where id = p_venue and status = 'live' and kind = 'supermarket' and chain_listing_id is not null;
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  code := ve_gtin(p_gtin);
  if code is null then return jsonb_build_object('ok', false, 'why', 'bad_code'); end if;
  select gtin, product_id into bc from ve_product_barcodes where gtin = code and status = 'live' and product_id is not null;
  if not found then return jsonb_build_object('ok', false, 'why', 'not_ours'); end if;
  if v.latitude is null or v.longitude is null then return jsonb_build_object('ok', false, 'why', 'no_location'); end if;
  if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then return jsonb_build_object('ok', false, 'why', 'no_position'); end if;
  if acc > 500 then return jsonb_build_object('ok', false, 'why', 'not_precise', 'accuracy_m', round(acc)); end if;
  d := 2 * 6371000 * asin(sqrt(power(sin(radians(p_lat - v.latitude) / 2), 2)
       + cos(radians(v.latitude)) * cos(radians(p_lat)) * power(sin(radians(p_lng - v.longitude) / 2), 2)));
  if d > v.radius_m + least(acc, 100) then return jsonb_build_object('ok', false, 'why', 'too_far', 'distance_m', round(d)); end if;
  select coalesce(value, '{}'::jsonb) into cfg from ve_site_settings where key = 'store_sightings'; cfg := coalesce(cfg, '{}'::jsonb);
  select count(*) into n from ve_store_sightings where member_id = p_member and local_day = today;
  if n >= coalesce((cfg->>'daily_reports')::int, 60) then return jsonb_build_object('ok', false, 'why', 'daily_limit'); end if;
  if exists (select 1 from ve_store_sightings where member_id = p_member and venue_id = v.id and gtin = code and local_day = today) then
    return jsonb_build_object('ok', false, 'why', 'already_today'); end if;
  insert into ve_store_sightings (store_listing_id, venue_id, gtin, product_id, seen, member_id, source, lat, lng, accuracy_m, distance_m, photo_path, local_day)
  values (v.chain_listing_id, v.id, code, bc.product_id, coalesce(p_seen, true), p_member, 'member', round(p_lat, 5), round(p_lng, 5), round(acc), round(d),
          nullif(p_photo, ''), today)
  returning id into sid;
  -- A yes sets the chain's last checked date (and brings a dropped item back).
  if coalesce(p_seen, true) then
    update ve_product_stores set confirmed_at = now(), removed_at = null where product_id = bc.product_id and store_listing_id = v.chain_listing_id;
    if not found then
      insert into ve_product_stores (product_id, store_listing_id, source, confirmed_at) values (bc.product_id, v.chain_listing_id, 'member', now());
    end if;
  end if;
  -- Small points for a location-checked report, capped a day; a photo of the empty spot pays more.
  cap := coalesce((cfg->>'daily_paid_cap')::int, 20);
  select coalesce(sum(paid_points), 0) into paid_today from ve_store_sightings where member_id = p_member and local_day = today;
  pts := case when coalesce(p_seen, true) then coalesce((cfg->>'seen')::int, 2)
              when nullif(p_photo, '') is not null then coalesce((cfg->>'not_here_photo')::int, 5) else coalesce((cfg->>'not_here')::int, 2) end;
  pts := least(pts, greatest(cap - paid_today, 0));
  if pts > 0 then
    begin
      perform ve_points_grant(p_member, pts, 'venue_report', 'sighting:' || sid::text);
      update ve_store_sightings set paid_points = pts where id = sid;
    exception when others then pts := 0; end;
  end if;
  select * into c from ve_item_chain_counts(v.chain_listing_id, bc.product_id);
  select name into chain_name from listings where id = v.chain_listing_id;
  return jsonb_build_object('ok', true, 'id', sid, 'distance_m', round(d), 'points', pts, 'chain', chain_name, 'venue', v.name,
    'seen_locations', c.seen_n, 'not_locations', c.not_n, 'flagged', c.flagged);
end $$;
revoke all on function public.ve_store_sighting_at(uuid, uuid, text, boolean, numeric, numeric, numeric, text) from public, anon, authenticated;

-- The mapped stores nearest a phone.
create or replace function public.ve_nearby_stores(p_lat numeric, p_lng numeric, p_limit int default 4)
returns table (id uuid, slug text, name text, address text, city text, chain text, chain_slug text, distance_m int, radius_m int)
language sql stable security definer set search_path = public as $$
  select * from (
    select v.id, v.slug, v.name, v.address, v.city, l.name as chain, l.slug as chain_slug,
      round(2 * 6371000 * asin(sqrt(power(sin(radians(p_lat - v.latitude) / 2), 2)
        + cos(radians(v.latitude)) * cos(radians(p_lat)) * power(sin(radians(p_lng - v.longitude) / 2), 2))))::int as distance_m, v.radius_m
    from ve_venues v join listings l on l.id = v.chain_listing_id
    where v.kind = 'supermarket' and v.status = 'live' and v.latitude is not null
      and v.latitude between p_lat - 0.05 and p_lat + 0.05 and v.longitude between p_lng - 0.06 and p_lng + 0.06) x
  order by distance_m limit greatest(1, least(p_limit, 8));
$$;
grant execute on function public.ve_nearby_stores(numeric, numeric, int) to service_role;

-- What the chains' registries say about one barcode (the scan result's Carried at).
create or replace function public.ve_item_chain_status(p_product uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('slug', l.slug, 'name', l.name, 'seen_locations', c.seen_n, 'not_locations', c.not_n,
    'last_seen', c.last_seen, 'flagged', c.flagged, 'checked_at', ps.confirmed_at) order by l.name), '[]'::jsonb)
  from ve_product_stores ps join listings l on l.id = ps.store_listing_id and l.status = 'approved'
  cross join lateral ve_item_chain_counts(ps.store_listing_id, ps.product_id) c
  where ps.product_id = p_product and ps.removed_at is null;
$$;
grant execute on function public.ve_item_chain_status(uuid) to service_role;

-- Jobs for one store: items its chain carries that nobody has checked here lately, flagged ones first.
create or replace function public.ve_store_gaps(p_venue uuid, p_limit int default 12)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v ve_venues%rowtype; wd int; out jsonb;
begin
  select * into v from ve_venues where id = p_venue and kind = 'supermarket' and chain_listing_id is not null;
  if not found then return '[]'::jsonb; end if;
  select coalesce((value->>'window_days')::int, 60) into wd from ve_site_settings where key = 'store_sightings'; wd := coalesce(wd, 60);
  select coalesce(jsonb_agg(g.j order by g.rk, g.bn), '[]'::jsonb) into out from (
    select jsonb_build_object('brand', b.name, 'type', p.product_type, 'product_slug', p.slug, 'brand_slug', b.slug,
        'gtin', (select gtin from ve_product_barcodes where product_id = p.id and status = 'live' order by gtin limit 1),
        'reason', case when c.flagged then 'flagged' else 'not_checked' end) j,
      case when c.flagged then 0 else 1 end rk, b.name bn
    from ve_product_stores ps join ve_products p on p.id = ps.product_id
    join listings b on b.id = p.brand_listing_id and b.status = 'approved' and coalesce(b.business_status, '') <> 'CLOSED_PERMANENTLY'
    cross join lateral ve_item_chain_counts(ps.store_listing_id, ps.product_id) c
    where ps.store_listing_id = v.chain_listing_id and ps.removed_at is null
      and exists (select 1 from ve_product_barcodes bb where bb.product_id = p.id and bb.status = 'live')
      and not exists (select 1 from ve_store_sightings s where s.venue_id = v.id and s.product_id = p.id and s.status = 'live'
                        and s.created_at > now() - make_interval(days => wd))
    limit greatest(1, least(p_limit, 40))) g;
  return out;
end $$;
grant execute on function public.ve_store_gaps(uuid, int) to service_role;

-- The team's list: every item a chain's locations say is not on the shelf.
create or replace function public.ve_item_flags()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(f.j order by f.n desc), '[]'::jsonb) from (
    select jsonb_build_object('chain', l.name, 'chain_id', l.id, 'brand', b.name, 'type', p.product_type, 'product_id', p.id, 'product_slug', p.slug,
      'seen_locations', c.seen_n, 'not_locations', c.not_n, 'last_seen', c.last_seen,
      'where', (select coalesce(jsonb_agg(jsonb_build_object('store', v.name, 'city', v.city, 'at', s.created_at) order by s.created_at desc), '[]'::jsonb)
                from (select distinct on (x.venue_id) x.venue_id, x.seen, x.created_at from ve_store_sightings x
                       where x.store_listing_id = ps.store_listing_id and x.product_id = ps.product_id and x.venue_id is not null and x.status = 'live'
                       order by x.venue_id, x.created_at desc) s join ve_venues v on v.id = s.venue_id where not s.seen)) j, c.not_n n
    from ve_product_stores ps join listings l on l.id = ps.store_listing_id
    join ve_products p on p.id = ps.product_id join listings b on b.id = p.brand_listing_id
    cross join lateral ve_item_chain_counts(ps.store_listing_id, ps.product_id) c
    where ps.removed_at is null and c.flagged) f;
$$;
grant execute on function public.ve_item_flags() to service_role;

create or replace function public.ve_item_flag_decide(p_member uuid, p_chain uuid, p_product uuid, p_decision text, p_note text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if p_decision not in ('kept', 'dropped') then return jsonb_build_object('ok', false, 'why', 'bad_decision'); end if;
  insert into ve_item_flag_reviews (chain_listing_id, product_id, decision, note, decided_by, decided_at)
  values (p_chain, p_product, p_decision, nullif(left(trim(coalesce(p_note, '')), 400), ''), p_member, now())
  on conflict (chain_listing_id, product_id) do update set decision = excluded.decision, note = excluded.note, decided_by = excluded.decided_by, decided_at = now();
  if p_decision = 'dropped' then update ve_product_stores set removed_at = now() where store_listing_id = p_chain and product_id = p_product; end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.ve_item_flag_decide(uuid, uuid, uuid, text, text) from public, anon, authenticated;

-- Search: each answer says how many locations saw the item and whether locations report it gone.
do $$
declare d text; n text;
begin
  select pg_get_functiondef('public.ve_search_store(text,int)'::regprocedure) into d;
  n := replace(d, 'join ve_products p on p.id = ps.product_id', 'join ve_products p on p.id = ps.product_id left join lateral ve_item_chain_counts(ps.store_listing_id, ps.product_id) c on true');
  if n = d then raise exception 'patch 1 failed'; end if;
  d := n;
  n := replace(d, '''checked_at'', ps.confirmed_at)', '''checked_at'', ps.confirmed_at, ''seen_locations'', coalesce(c.seen_n, 0), ''not_locations'', coalesce(c.not_n, 0), ''flagged'', coalesce(c.flagged, false))');
  if n = d then raise exception 'patch 2 failed'; end if;
  execute n;
end $$;
