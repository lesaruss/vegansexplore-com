-- Keya (VeganKween): her profile becomes hers, with the creator badge (Sean, 2026-11-10: "once we confirm her on our end, we should put the
-- badge on her thumbnail... in her bio, let's say educator and vegans explore content creator. And remove Happy Cow Ambassador.").
-- Applied 2026-11-10 by execute_sql; kept as the record. Her account (19f67b83) was made by her own sign-up the same morning; her creator
-- application was accepted. Every change is a ve_listing_edits row (meta.source creator_application). Checked live at 1440 and 390 px.
update listings l set owner_member_id = '19f67b83-9368-40d5-af00-87084b0f3fae', claimed_by_member_id = '19f67b83-9368-40d5-af00-87084b0f3fae',
  claim_status = 'verified', tiktok = coalesce(nullif(l.tiktok, ''), '@VeganKween'),
  address_city = coalesce(nullif(l.address_city, ''), 'Philadelphia'), address_state = coalesce(nullif(l.address_state, ''), 'PA'),
  details = jsonb_set(coalesce(l.details, '{}'::jsonb), '{person}', coalesce(l.details->'person', '{}'::jsonb)
    || jsonb_build_object('member_id', '19f67b83-9368-40d5-af00-87084b0f3fae', 'title', 'Educator and Vegans Explore content creator')),
  description = replace(l.description, 'She is a Happy Cow ambassador and creates videos for brands and restaurants',
    'She is an official Vegans Explore content creator and creates videos for brands and restaurants'), updated_at = now()
where l.id = '6646448a-d752-47c1-9ef7-9232b19cbe90' and l.owner_member_id is null;
update ve_creator_applications set member_id = '19f67b83-9368-40d5-af00-87084b0f3fae', claim_listing_id = '6646448a-d752-47c1-9ef7-9232b19cbe90'
where id = '02026682-f87b-440c-9e8e-b580cbfef93b';
insert into ve_person_tags (person_key, tag_slug, source, note)
values ('kyonakey@yahoo.com', 'badge-creator', 'hand', 'Official content creator, application accepted (Sean, 2026-11-10)')
on conflict (person_key, tag_slug) do update set removed_at = null;
