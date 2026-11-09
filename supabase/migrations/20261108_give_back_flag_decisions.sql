-- ve-holiday-guide: Give Back flagged listings, Sean's decisions (2026-11-08). Applied through the one-time ve-once-giveback-flags.
-- Every change is a ve_listing_edits row; each step only acts on listings not yet changed, so it is safe to run twice.
do $$
declare s uuid := '72712a4a-ea0e-4ef4-a29e-d382496ef8da'; r record;
  m jsonb := '{"where":"logan","playbook":"ve-holiday-guide","approved":"Sean 2026-11-08"}';
begin
  for r in select id, slug from listings where status = 'approved' and slug in ('ena-kindness-in-action','lovelovinglove-inc',
      'velveteen-rabbit-project','little-pet-project','pet-rehoming-network-philadelphia','fund-for-animals') loop
    perform ve_listing_set_state(r.id, 'removed', s, case
      when r.slug = 'fund-for-animals' then 'Now part of Humane World for Animals, which is listed (Give Back review, Sean 2026-11-08).'
      when r.slug = 'little-pet-project' then 'A project of a for-profit photo studio, not an animal nonprofit (Give Back review, Sean 2026-11-08).'
      when r.slug = 'pet-rehoming-network-philadelphia' then 'A paid rehoming service, not a nonprofit rescue (Give Back review, Sean 2026-11-08).'
      else 'Serves people, not animals (Give Back review, Sean 2026-11-08).' end, null);
    insert into ve_listing_edits(listing_id, member_id, field, old_value, new_value, meta) values (r.id, s, 'state', '"approved"', '"removed"', m);
  end loop;

  for r in select id, slug from listings where status = 'approved' and slug in ('pets-washington-dc','thinking-animals-united') loop
    perform ve_listing_set_state(r.id, 'hold', s, null, array[case when r.slug = 'pets-washington-dc'
      then 'May no longer be active: latest figures on its site are from 2001'
      else 'May no longer be active: its site still promotes a 2018 summit' end]);
    insert into ve_listing_edits(listing_id, member_id, field, old_value, new_value, meta) values (r.id, s, 'state', '"approved"', '"hold"', m);
  end loop;

  for r in select id, slug, details from listings where slug in ('rude-ranch-animal-rescue','101-paws-and-claws')
      and (details ? 'donation_url' or details ? 'donation_link_code') loop
    insert into ve_listing_edits(listing_id, member_id, field, old_value, new_value, meta)
      values (r.id, s, 'donation', jsonb_build_object('donation_url', r.details->'donation_url', 'donation_link_code', r.details->'donation_link_code'), 'null', m);
    update listings set details = (details - 'donation_url' - 'donation_link_code' - 'donation_url_source') || jsonb_build_object('donation_removed',
      jsonb_build_object('at', now(), 'by', 'Sean (via Logan)', 'url', r.details->'donation_url', 'code', r.details->'donation_link_code',
        'why', case when r.slug = 'rude-ranch-animal-rescue' then 'Adoptions stopped in 2021; no Donate until confirmed active'
                    else 'Link went to their contact page; PayPal account in another name' end)), updated_at = now()
    where id = r.id;
  end loop;

  for r in select * from (values
      ('rude-ranch-animal-rescue', null::text, 'Millersville', 'MD', null::text, false, null::text[]),
      ('loving-acres', null, 'Chester', 'VA', null, false, null),
      ('freedom-hearts-animal-rescue-martinsburg', 'Freedom Hearts Animal Rescue', 'Gerrardstown', 'WV', '25420', true, null),
      ('phoenix-animal-rescue', null, 'Philadelphia', 'PA', null, true, array['philadelphia']),
      ('project-paws-alive', null, 'Braselton', 'GA', '30517', true, array['all'])) v(slug, newname, city, st, zip, clear_addr, comm) loop
    insert into ve_listing_edits(listing_id, member_id, field, old_value, new_value, meta)
      select l.id, s, 'location',
        jsonb_build_object('name', l.name, 'street', l.address_street, 'city', l.address_city, 'state', l.address_state, 'zip', l.address_zip,
          'lat', l.latitude, 'lng', l.longitude, 'communities', l.communities),
        jsonb_build_object('name', coalesce(r.newname, l.name), 'city', r.city, 'state', r.st, 'communities', coalesce(r.comm, l.communities),
          'address_cleared', r.clear_addr), m
      from listings l where l.slug = r.slug and l.address_city is distinct from r.city;
    update listings set name = coalesce(r.newname, name), address_city = r.city, address_state = r.st,
      address_zip = case when r.clear_addr then r.zip else address_zip end,
      address_street = case when r.clear_addr then null else address_street end,
      latitude = case when r.clear_addr then null else latitude end,
      longitude = case when r.clear_addr then null else longitude end,
      communities = coalesce(r.comm, communities), updated_at = now()
    where slug = r.slug and address_city is distinct from r.city;
  end loop;
end $$;
