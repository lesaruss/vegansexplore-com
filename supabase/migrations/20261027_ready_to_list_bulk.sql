-- Ready to list, decided by Logan on Sean's word (2026-10-27: "take a good estimated guess... if they're active, if they fit the
-- description, I would just want to be able to populate it... once I see it up and running, I can go ahead and make adjustments").
-- The same as backlog_decide: open places go live with Google's address, place, phone and website, the category and How Vegan
-- picked here, a team note, and the backlog row marked decided. Duplicates, a closed place, a vegetarian (not Vegan) brand and
-- groups that do not put the animals first are set aside (rejected, never deleted). Places with no location to go by are left
-- for Sean. Renamed listings get a clean slug. Idempotent: only rows still quarantined are touched.
do $$
declare r record; n_list int := 0; n_hide int := 0; s text; base text;
begin
  create temp table d (name text, src text, act text, cat text, extra text[], vs text, newname text, comms text[], use_place boolean, city text, state text, site text, note text) on commit drop;
  -- The older lists (Instagram, the spreadsheet, the SoFlo Vegans group), one by one.
  insert into d values
   ('Meraki Juice Kitchen','old','hide',null,null,null,null,null,false,null,null,null,'Now Christopher''s Kitchen, which is already listed.'),
   ('Hippocrates','old','list','Health and Wellness','{}','fully_vegan','Hippocrates Wellness',null,true,null,null,null,null),
   ('PLANTA','old','list','Restaurants','{}','fully_vegan',null,null,true,null,null,null,null),
   ('Tree Lion','old','hide',null,null,null,null,null,false,null,null,null,'A second copy of Treelion.'),
   ('Treelion','old','list','Restaurants','{}','fully_vegan',null,null,true,null,null,null,null),
   ('V Gelato','old','hide',null,null,null,null,null,false,null,null,null,'A second copy of V Gelato & Cafe.'),
   ('V gelato & cafe','old','list','Bakeries & Cafes','{}','fully_vegan','V Gelato & Cafe',null,true,null,null,null,null),
   ('Vannucchi Brothers','old','hide',null,null,null,null,null,false,null,null,null,'A second copy of Vannucchi Brothers Pizza.'),
   ('Vannucchi Brothers Est. 2014','old','list','Restaurants','{}','vegan_options','Vannucchi Brothers Pizza',null,true,null,null,null,null),
   ('Vegan and Juice','old','list','Restaurants','{}','fully_vegan',null,null,true,null,null,null,null),
   ('@flexbites','old','list','Food Brands','{}','fully_vegan','Flex Bites',null,true,null,null,null,null),
   ('@nocow','old','list','Food Brands','{}','fully_vegan','No Cow',null,false,null,null,'https://nocow.com','Google''s match was a different bakery, so no address: a brand sold online and in stores.'),
   ('@rescuedognetwork','old','list','Rescues','{}',null,'Rescue Dog Network','{south-florida}',false,null,null,'https://www.rescuedognetwork.org','South Florida, from their Instagram.'),
   ('@ripplefoods','old','hide',null,null,null,null,null,false,null,null,null,'Ripple is already listed.'),
   ('@veganeventsorlando,','old','hide',null,null,null,null,null,false,null,null,null,'A second copy of Orlando Vegan Events.'),
   ('Orlando Vegan Events','old','list','Events','{}',null,null,null,true,null,null,null,null),
   ('@vishhollywood','old','list','Restaurants','{}','vegan_friendly','Vish Hummus Hollywood',null,true,null,null,null,null),
   ('Animal Recovery Mission','old','list','Nonprofits','{}',null,null,'{south-florida}',false,'Miami','FL',null,'Miami, from their own description.'),
   ('Arden''s Garden: Juices, smoothies & plant-based foods','old','list','Bakeries & Cafes','{}','fully_vegan','Arden''s Garden',null,true,null,null,null,null),
   ('BOLDLY','old','list','Food Brands','{}','fully_vegan','Boldly',null,false,null,null,null,'Google matched an amusement centre, so no address: a Vegan seafood brand.'),
   ('CHIA BALLZ','old','list','Food Brands','{}','fully_vegan','Chia Ballz',null,true,null,null,null,null),
   ('Closed','old','hide',null,null,null,null,null,false,null,null,null,'Jonny Nobones Vegan Restaurant is no longer open, by its own page.'),
   ('Dharma Bear’s Rescue','old','list','Rescues','{}',null,'Dharma Bear''s Rescue','{south-florida}',false,null,null,null,'South Florida, by its 954 number.'),
   ('DI Vegan Yaad','old','list','Restaurants','{}','fully_vegan','Di Vegan Yaad',null,true,null,null,null,null),
   ('Garden Diva Hummus 👒','old','list','Restaurants','{}','fully_vegan','Garden Diva Hummus',null,true,null,null,null,null),
   ('Happea’s','old','list','Restaurants','{}','fully_vegan','Happea''s',null,true,null,null,null,null),
   ('ISLAND SIPS','old','list','Restaurants','{}','vegan_options','Island Sips',null,true,null,null,null,null),
   ('Love Life Animal Rescue & Sanctuary, Inc.','old','list','Sanctuaries','{Rescues}',null,'Love Life Animal Rescue & Sanctuary',null,false,'Myakka City','FL',null,'Myakka City, FL, from their Instagram.'),
   ('Mac & Tingz','old','list','Restaurants','{}','fully_vegan',null,null,true,null,null,null,null),
   ('Madrina Vegana Food Truck NYC','old','list','Food Trucks','{}','fully_vegan','Madrina Vegana',null,true,null,null,null,null),
   ('Mariselis Rosa-Sanchez, MD','old','list','Health and Wellness','{}','vegan_friendly',null,null,true,null,null,null,null),
   ('MorningStar Farms','old','hide',null,null,null,null,null,false,null,null,null,'A vegetarian brand, not a Vegan one.'),
   ('P l a t e s','old','list','Restaurants','{}','fully_vegan','Plates',null,true,null,null,null,null),
   ('Plant-Based Bakery | Courtney''s Cookies®','old','list','Bakeries & Cafes','{}','fully_vegan','Courtney''s Cookies',null,true,null,null,null,null),
   ('Planty Fuel Cafe','old','list','Food Trucks','{}','fully_vegan',null,null,true,null,null,null,null),
   ('Rescue Dogs Rock NYC','old','list','Rescues','{}',null,null,null,false,'New York','NY',null,'New York, from their Instagram.'),
   ('Respect Animal Sanctuary','old','list','Sanctuaries','{}',null,null,'{atlanta}',false,null,'GA',null,'Greater Atlanta, from their Instagram.'),
   ('Shibuya Grill & Sushi Bar 🍣🔥','old','list','Restaurants','{}','vegan_options','Shibuya Grill & Sushi Bar',null,true,null,null,null,null),
   ('The Indian Harbor','old','list','Restaurants','{}','vegan_options',null,null,true,null,null,null,null),
   ('The National Animal Rights Day - Worldwide','old','list','Events','{}',null,'National Animal Rights Day','{all}',false,null,null,null,'A worldwide day, so every chapter.'),
   ('Bare Blends','old','list','Restaurants','{}','fully_vegan','BARE Blends',null,true,null,null,null,null),
   ('Cena Vegan Catering','old','hide',null,null,null,null,null,false,null,null,null,'Cena Vegan is already listed.');
  -- The community search: its own guess, except these.
  insert into d values
   ('American Humane Society','cs','hide',null,null,null,null,null,false,null,null,null,'Certifies animal farms as humane; does not put the animals first.'),
   ('RSPCA Central London Branch','cs','hide',null,null,null,null,null,false,null,null,null,'Runs the RSPCA Assured farm label; left for Sean.'),
   ('Viva! - the vegan trailblazers','cs','hide',null,null,null,null,null,false,null,null,null,'Viva! is already listed.'),
   ('Humane World for Animals UK','cs','hide',null,null,null,null,null,false,null,null,null,'Humane World for Animals is already listed in every chapter.'),
   ('People for the Ethical Treatment of Animals','cs','hide',null,null,null,null,null,false,null,null,null,'PETA UK is listed for London.'),
   ('People for the Ethical Treatment of Animals Foundation','cs','hide',null,null,null,null,null,false,null,null,null,'PETA UK is listed for London.'),
   ('FARM Farm Animal Rights Movement','cs','list','Nonprofits','{}',null,'Farm Animal Rights Movement',null,true,null,null,null,null),
   ('Animal Acres','cs','list','Sanctuaries','{}',null,null,null,true,null,null,null,null),
   ('The Gentle Barn','cs','list','Sanctuaries','{}',null,null,null,true,null,null,null,null),
   ('loving ​ hearts ​ of atlanta','cs','list','Nonprofits','{}',null,'Loving Hearts of Atlanta',null,true,null,null,null,null),
   ('Animal Rescue Force of South Florida, Inc. *** By Appointment Only ***','cs','list','Rescues','{}',null,'Animal Rescue Force of South Florida',null,true,null,null,null,null),
   ('The Good Earth Farm & Foundation inc.Home of the chocolate chip animal rescue','cs','list','Sanctuaries','{Rescues}',null,'The Good Earth Farm & Foundation',null,true,null,null,null,null),
   ('ANIMAL WELFARE FOUNDATION','cs','list','Nonprofits','{}',null,'Animal Welfare Foundation',null,true,null,null,null,null),
   ('Greenmore Farm Animal Rescue, 501c3','cs','list','Sanctuaries','{Rescues}',null,'Greenmore Farm Animal Rescue',null,true,null,null,null,null);

  for r in
    select l.id, l.name, l.slug, l.details, l.website, l.ig_handle, b.place p, b.ig g, b.reason, b.verdict, b.checked_at, l.crawl_source,
           coalesce(d.act, case when l.crawl_source = 'community-search' then 'list' end) act,
           coalesce(d.cat, case when l.crawl_source = 'community-search' then
             (case substring(b.reason from 'looks like a (\w+)') when 'rescue' then 'Rescues' when 'sanctuary' then 'Sanctuaries' else 'Nonprofits' end) end) cat,
           d.extra, d.vs, d.newname, d.comms, coalesce(d.use_place, l.crawl_source = 'community-search') use_place, d.city, d.state, d.site, d.note
    from ve_backlog_checks b join listings l on l.id = b.listing_id
    left join d on d.name = l.name and (d.src = 'cs') = (l.crawl_source = 'community-search')
    where b.verdict = 'list' and l.status = 'quarantined'
  loop
    if r.act is null then continue; end if;  -- left for Sean
    if r.act = 'hide' then
      update listings set status = 'rejected', updated_at = now(),
        details = coalesce(details, '{}'::jsonb) || jsonb_build_object('status_before_hidden', 'quarantined',
          'backlog', jsonb_build_object('verdict', r.verdict, 'reason', r.reason, 'checked_at', r.checked_at, 'decided', 'hide', 'by', 'Logan', 'at', now()),
          'admin_notes', coalesce(details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
            'text', 'Set aside after the backlog check: ' || coalesce(r.note, r.reason) || ' (Sean asked Logan to sort Ready to list, 2026-10-27.)')))
      where id = r.id;
      update ve_backlog_checks set decision = 'hidden', decided_at = now() where listing_id = r.id;
      n_hide := n_hide + 1; continue;
    end if;
    -- The name, and a clean slug when it changes or the old one is not a web address.
    s := r.slug;
    if r.newname is not null or r.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
      base := trim(both '-' from regexp_replace(lower(coalesce(r.newname, r.name)), '[^a-z0-9]+', '-', 'g'));
      s := base;
      if exists (select 1 from listings x where x.slug = s and x.id <> r.id and x.status in ('approved', 'quarantined', 'pending')) then s := base || '-' || left(r.id::text, 4); end if;
    end if;
    update listings set status = 'approved', updated_at = now(), name = coalesce(r.newname, name), slug = s,
      category = r.cat, extra_categories = coalesce(r.extra, '{}'), vegan_status = r.vs,
      communities = coalesce(r.comms, communities),
      google_place_id = case when r.use_place and r.p->>'id' is not null then r.p->>'id' else google_place_id end,
      address_street = case when r.use_place and r.p->>'id' is not null then nullif(r.p->>'street', '') else address_street end,
      address_city = case when r.use_place and r.p->>'id' is not null then nullif(r.p->>'city', '') else coalesce(r.city, address_city) end,
      address_state = case when r.use_place and r.p->>'id' is not null then nullif(r.p->>'state', '') else coalesce(r.state, address_state) end,
      address_zip = case when r.use_place and r.p->>'id' is not null then nullif(r.p->>'zip', '') else address_zip end,
      address_country = case when r.use_place and r.p->>'id' is not null then nullif(r.p->>'country', '') else address_country end,
      latitude = case when r.use_place and r.p->>'id' is not null then (r.p->>'lat')::float8 else latitude end,
      longitude = case when r.use_place and r.p->>'id' is not null then (r.p->>'lng')::float8 else longitude end,
      business_status = case when r.use_place and r.p->>'id' is not null then coalesce(r.p->>'status', 'OPERATIONAL') else 'OPERATIONAL' end,
      google_rating = case when r.use_place and r.p->>'id' is not null then (r.p->>'rating')::numeric else google_rating end,
      google_reviews_count = case when r.use_place and r.p->>'id' is not null then coalesce((r.p->>'reviews')::int, 0) else google_reviews_count end,
      google_category = case when r.use_place and r.p->>'id' is not null then r.p->>'type_name' else google_category end,
      location = case when r.use_place and r.p->>'id' is not null then nullif(concat_ws(', ', nullif(r.p->>'city', ''), nullif(r.p->>'state', '')), '')
                      when r.city is not null then concat_ws(', ', r.city, r.state) else location end,
      website = coalesce(nullif(website, ''), r.site, case when r.use_place then r.p->>'website' end, r.g->>'link'),
      phone = case when r.use_place and r.p->>'phone' is not null then r.p->>'phone' else phone end,
      ig_handle = coalesce(ig_handle, r.g->>'handle'),
      details = coalesce(details, '{}'::jsonb) || jsonb_build_object(
        'backlog', jsonb_build_object('verdict', r.verdict, 'reason', r.reason, 'checked_at', r.checked_at, 'decided', 'list', 'by', 'Logan', 'at', now()),
        'admin_notes', coalesce(details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
          'text', 'Listed from the backlog check (' || r.reason || '), category and How Vegan by Logan''s best guess on Sean''s word (2026-10-27); adjust freely.'
                  || coalesce(' ' || r.note, ''))))
    where id = r.id;
    update ve_backlog_checks set decision = 'listed', decided_at = now() where listing_id = r.id;
    n_list := n_list + 1;
  end loop;
  raise notice 'listed %, set aside %', n_list, n_hide;
end $$;
