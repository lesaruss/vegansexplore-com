-- Made-right memberships (Sean, 2026-11-01, playbook ve-outreach-buckets): people who paid on the old platform and did not get its
-- worth may still be invited on us as Founding Members, while comps stay off for everyone else. ve-invites reads the list; a
-- comped Founding Member invitation's claim (universe_invite_claim) makes them an active Founding Member. Applied 2026-11-01.
update ve_site_settings
   set value = value || jsonb_build_object('made_right', jsonb_build_array(
     'ejf8889@gmail.com',              -- Elle Jimenez
     'korinsutton@bodyhdfitness.com',  -- Korin Sutton
     'ella.magers@gmail.com'))         -- Ella Magers
 where key = 'founding_member';
