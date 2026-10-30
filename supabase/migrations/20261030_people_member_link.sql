-- A People profile can name the member it is (details.person.member_id), without making them its owner (owner_member_id
-- turns on owner perks, such as the campaign window's "let them message me" on save). The dashboard's member lightbox counts
-- votes on it as votes received (ve-dashboard member_card). Sean, 2026-10-30: "I would love to see if people vote for me."
update listings
   set details = jsonb_set(coalesce(details, '{}'::jsonb), '{person,member_id}', to_jsonb('72712a4a-ea0e-4ef4-a29e-d382496ef8da'::text), true)
 where slug = 'sean-russell' and status = 'approved'
   and coalesce(details->'person'->>'member_id', '') <> '72712a4a-ea0e-4ef4-a29e-d382496ef8da';

insert into ve_listing_edits (listing_id, member_id, field, old_value, new_value, meta)
select id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'person_member_id', 'null'::jsonb, to_jsonb('72712a4a-ea0e-4ef4-a29e-d382496ef8da'::text),
       jsonb_build_object('by', 'logan', 'note', 'Linked to Sean''s account for votes received')
  from listings where slug = 'sean-russell' and status = 'approved'
   and not exists (select 1 from ve_listing_edits e where e.listing_id = listings.id and e.field = 'person_member_id');
