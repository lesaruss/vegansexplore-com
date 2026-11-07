-- Ready to list, Instagram-track rows (Logan, 2026-11-07, playbook ve-community-directory; no Google calls).
-- Light check: a post in the last 6 months (before 2026-05-07 is left for Sean unless it is over a year or years quiet), an organization or Vegan business by its
-- own bio, and a place from its own bio or post locations. Listed through the same fields as backlog_decide; category and How Vegan are a best guess.
-- Set aside: Compassionate Farming (last post July 2017). Everything else on the Instagram track stays in Ready to list for Sean.
-- Run 2026-11-07 through the Supabase connector. Idempotent: only rows still quarantined and undecided.
do $$
declare r record; n int := 0; d record;
begin
  create temp table d (pfx text, act text, newname text, cat text, vs text, comms text[], city text, st text, why text) on commit drop;
  insert into d values
   ('7c196e6e','list','CudaBear''s Lair Animal Rescue & Sanctuary','Sanctuaries',null,'{central-florida}','Lake Placid','FL','Lake Placid, FL, from its Instagram places; 501(c)(3) by its bio; last post Oct 9, 2026.'),
   ('51138c88','list','Ark Rescue at Brightside Acres Sanctuary','Sanctuaries',null,'{north-florida}','Live Oak','FL','Live Oak, FL, from its Instagram places; 501(c)(3) by its bio; last post Oct 7, 2026. Instagram had it under a person''s name.'),
   ('0f529adc','list','Karma Farm Sanctuary','Sanctuaries',null,'{north-florida}','Micanopy','FL','Micanopy, FL, from its Instagram places; 501(c)(3) by its bio; last post Sep 26, 2026.'),
   ('1a815b42','list','Hogs & Kisses','Sanctuaries',null,'{virginia}',null,'VA','Virginia, from its bio (Vegan micro-farm sanctuary); last post Oct 8, 2026.'),
   ('420d61b5','list','Vegan for the Animals','Nonprofits',null,'{all}',null,null,'A national animal rights nonprofit by its Instagram category; last post Oct 10, 2026.'),
   ('d7388636','list','Our Planet. Theirs Too.','Nonprofits',null,'{all}',null,null,'A worldwide animal rights nonprofit by its bio; last post Oct 9, 2026.'),
   ('35f9c7a9','list','Fish Defender','Nonprofits',null,'{south-florida,central-florida,north-florida}',null,'FL','Florida marine wildlife advocates by their bio and places; last post Oct 10, 2026.'),
   ('07facba1','list','Vutchery','Food Brands','fully_vegan',null,null,null,'Its bio says 100% Vegan; a plant-based product brand sold online (and at Vegan Foodie Fest Miami, 2025); last post Oct 1, 2026.'),
   ('cabf2c02','list','Shena''s Confections','Bakeries & Cafes','vegan_options','{south-florida}',null,'FL','Custom cakes and treats, Vegan and non-Vegan by its bio, so Vegan options; South Florida from its Instagram places; last post Sep 23, 2026.'),
   ('11072a0e','hide',null,null,null,null,null,null,'Its last Instagram post was July 2017, so it is quiet for years.');
  for r in
    select l.id, l.name, l.slug, l.website, l.ig_handle, b.ig g, b.reason, b.verdict, b.checked_at, d.*
    from ve_backlog_checks b join listings l on l.id = b.listing_id join d on left(l.id::text, 8) = d.pfx
    where b.verdict = 'list' and b.decision is null and b.track = 'ig' and l.status = 'quarantined'
  loop
    if r.act = 'hide' then
      update listings set status = 'rejected', updated_at = now(),
        details = coalesce(details, '{}'::jsonb) || jsonb_build_object('status_before_hidden', 'quarantined',
          'backlog', jsonb_build_object('verdict', r.verdict, 'reason', r.reason, 'checked_at', r.checked_at, 'decided', 'hide', 'by', 'Logan', 'at', now()),
          'admin_notes', coalesce(details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
            'text', 'Set aside after the light check (2026-11-07): ' || r.why)))
      where id = r.id;
      update ve_backlog_checks set decision = 'hidden', decided_at = now() where listing_id = r.id;
    else
      update listings set status = 'approved', updated_at = now(), name = r.newname,
        slug = case when exists (select 1 from listings x where x.slug = trim(both '-' from regexp_replace(lower(r.newname), '[^a-z0-9]+', '-', 'g')) and x.id <> r.id and x.status in ('approved','quarantined','pending'))
                    then trim(both '-' from regexp_replace(lower(r.newname), '[^a-z0-9]+', '-', 'g')) || '-' || left(r.id::text, 4)
                    else trim(both '-' from regexp_replace(lower(r.newname), '[^a-z0-9]+', '-', 'g')) end,
        category = r.cat, extra_categories = '{}', vegan_status = r.vs, communities = coalesce(r.comms, communities),
        address_city = coalesce(r.city, address_city), address_state = coalesce(r.st, address_state),
        location = coalesce(nullif(concat_ws(', ', r.city, r.st), ''), location, ''), business_status = 'OPERATIONAL',
        website = coalesce(nullif(website, ''), r.g->>'link', ''), ig_handle = coalesce(ig_handle, r.g->>'handle'),
        details = coalesce(details, '{}'::jsonb) || jsonb_build_object(
          'backlog', jsonb_build_object('verdict', r.verdict, 'reason', r.reason, 'checked_at', r.checked_at, 'decided', 'list', 'by', 'Logan', 'at', now()),
          'admin_notes', coalesce(details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
            'text', 'Listed from the backlog check after a light check by Logan (2026-11-07): ' || r.why || ' Category' || case when r.vs is not null then ' and How Vegan' else '' end || ' are a best guess; adjust freely. No Google look-up was made.')))
      where id = r.id;
      update ve_backlog_checks set decision = 'listed', decided_at = now() where listing_id = r.id;
    end if;
    n := n + 1;
  end loop;
  raise notice 'decided %', n;
end $$;
