-- 2026-11-19: Sean locked the agreement ("lock it"); KJ (member 19f67b83-9368-40d5-af00-87084b0f3fae) is assigned as Community Manager,
-- home city Philadelphia, as the console's admin_assign does (tracked invite link, no email: Sean sends her the link himself). Safe to run twice.
do $$
declare pos record; m record; pid uuid; v_code text := 'pos-instagram-19f67b';
begin
  select * into pos from ve_positions where slug = 'social-media-manager-instagram';
  select id, name, email into m from members where id = '19f67b83-9368-40d5-af00-87084b0f3fae';
  if pos.id is null or m.id is null then return; end if;
  if exists (select 1 from ve_position_people where position_id = pos.id and member_id = m.id and stage <> 'ended') then return; end if;
  insert into ve_links (code, label, destination, initiative_slug, tags, channel, recipient_member_id, recipient_email, recipient_name, active)
  values (v_code, pos.title || ': invite for ' || m.name, 'https://vegansexplore.com/positions/' || pos.slug || '/start', 'position-' || pos.slug,
          array['positions', pos.slug, 'invite'], 'email', m.id, m.email, m.name, true)
  on conflict (code) do nothing;
  insert into ve_position_people (position_id, member_id, email, name, path, stage, invite_link_code, region, invited_at)
  values (pos.id, m.id, m.email, m.name, 'assigned', 'invited', v_code, 'Philadelphia', now()) returning id into pid;
  insert into ve_position_events (person_id, actor, action, detail, source) values
    (pid, 'Sean (via Logan)', 'assigned', jsonb_build_object('position', pos.slug, 'region', 'Philadelphia'), 'console'),
    (pid, 'Sean (via Logan)', 'invite_link_copied', null, 'console');
end $$;
