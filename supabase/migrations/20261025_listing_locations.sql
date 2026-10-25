-- One business, many locations (Sean, 2026-10-25: "how are we accounting for restaurants that have multiple locations. Should
-- they extend from the same listing and show a section for additional locations so they are all tied together. Also creating
-- additional locations can be done from within the listing so it copies the majority of the content that doesn't need to be
-- custom").
--
-- A group is one main listing (parent_id null) and its locations (parent_id = the main listing). Every location stays its own
-- listing: its own street, city, hours, phone, Google place, map pin, votes, check-ins, review state and city hub, so a
-- location in Miami shows in South Florida and one in Brooklyn in New York. The main listing holds what they share (logo, about,
-- socials, website, menu, cuisines); a location page fills anything it leaves empty from it (directory/listing.html) and lists
-- the group's other locations. location_label is the short name of the place ("West Village").
alter table public.listings add column if not exists parent_id uuid references public.listings(id);
alter table public.listings add column if not exists location_label text;
create index if not exists listings_parent_id on public.listings (parent_id) where parent_id is not null;
alter table public.listings drop constraint if exists listings_parent_not_self;
alter table public.listings add constraint listings_parent_not_self check (parent_id is null or parent_id <> id);

-- Add a location to a group: a new listing that copies what a location shares with its main listing, with its own place.
-- Only one level: a location of a location joins the main listing. Returns the new listing's id and slug.
create or replace function public.ve_listing_add_location(p_main uuid, p_label text, p_street text, p_city text, p_state text,
  p_zip text, p_phone text, p_by uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare m listings%rowtype; base text; nm text; s text; n int := 1; nid uuid; lbl text := nullif(btrim(coalesce(p_label, '')), '');
begin
  select * into m from listings where id = p_main;
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if m.parent_id is not null then select * into m from listings where id = m.parent_id; end if;
  if lbl is null or nullif(btrim(coalesce(p_city, '')), '') is null then return jsonb_build_object('ok', false, 'why', 'label_and_city'); end if;
  base := btrim(regexp_replace(m.name, '\s+-\s+[^-]+$', ''));
  nm := base || ' - ' || lbl;
  s := regexp_replace(lower(base || '-' || lbl), '[^a-z0-9]+', '-', 'g'); s := btrim(s, '-');
  while exists (select 1 from listings where slug = s || case when n = 1 then '' else '-' || n end) loop n := n + 1; end loop;
  if n > 1 then s := s || '-' || n; end if;
  insert into listings (name, slug, status, category, specialty, extra_categories, vegan_status, cuisines, product_kinds, description, tagline,
    website, instagram, facebook, tiktok, youtube, booking_url, uber_eats_url, doordash_url, logo_url, logo_alt_text, color, initials,
    tags, atmosphere, accommodations, is_black_owned, is_women_owned, is_latino_owned, is_asian_owned, is_lgbtq_owned,
    is_immigrant_owned, is_veteran_owned, is_indigenous_owned, is_family_owned, lgbtq_friendly, vetted_at, vetted_by,
    parent_id, location_label, address_street, address_city, address_state, address_zip, location, phone, business_status,
    details)
  values (nm, s, 'approved', m.category, coalesce(m.specialty, ''), m.extra_categories, m.vegan_status, m.cuisines, m.product_kinds, coalesce(m.description, ''), m.tagline,
    m.website, m.instagram, m.facebook, m.tiktok, m.youtube, m.booking_url, m.uber_eats_url, m.doordash_url, m.logo_url, m.logo_alt_text,
    m.color, m.initials, array_remove(coalesce(m.tags, '{}'), 've-application'), m.atmosphere, m.accommodations, m.is_black_owned,
    m.is_women_owned, m.is_latino_owned, m.is_asian_owned, m.is_lgbtq_owned, m.is_immigrant_owned, m.is_veteran_owned,
    m.is_indigenous_owned, m.is_family_owned, m.lgbtq_friendly, m.vetted_at, m.vetted_by,
    m.id, lbl, nullif(btrim(coalesce(p_street, '')), ''), btrim(p_city), nullif(upper(btrim(coalesce(p_state, ''))), ''),
    nullif(btrim(coalesce(p_zip, '')), ''), btrim(p_city) || coalesce(', ' || nullif(upper(btrim(coalesce(p_state, ''))), ''), ''),
    nullif(btrim(coalesce(p_phone, '')), ''), 'OPERATIONAL',
    jsonb_build_object('location_of', m.id, 'location_added_by', p_by, 'location_added_at', now()))
  returning id into nid;
  return jsonb_build_object('ok', true, 'id', nid, 'slug', s, 'name', nm, 'main', m.id);
end $$;
revoke all on function public.ve_listing_add_location(uuid, text, text, text, text, text, text, uuid) from public, anon, authenticated;
