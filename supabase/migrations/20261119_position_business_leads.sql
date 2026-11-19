-- 2026-11-19: business owners she knows are hers to bring in (Sean, after the lock and before anyone signed: "what if she knows a business
-- owner personally... We're pretty much telling her not to make those connections... think of it like a lead generator. They're getting the
-- leads and sending them to the platform... Not until they cross the threshold that it becomes our handoff. So, however she wants to follow
-- up, she could follow up."). Agreement sections 2 and 3, the job posting, and the role rows. Safe to run twice.
do $$
declare pid uuid;
begin
  select id into pid from public.ve_positions where slug = 'social-media-manager-instagram';
  if pid is null then return; end if;
  update public.ve_positions set
    agreement_text = replace(replace(agreement_text,
      '- Invite people you know to Vegans Explore, with your own link.',
      '- Invite people you know to Vegans Explore, business owners too, with your own link.'),
      '- Businesses hear from Vegans Explore through @vegansexplore, not your own accounts. If one reaches out to you, send them our way.',
      '- Know a business owner? Send them to Vegans Explore with your link, and follow up however you like until they join. Once they''re on Vegans Explore, we take it from there.'),
    posting = replace(posting, '- Invite the people you know, with your own link.', '- Invite the people you know, business owners too, with your own link.'),
    updated_at = now()
  where id = pid;
  update public.ve_positions set agreement_sha256 = encode(sha256(convert_to(agreement_text, 'UTF8')), 'hex') where id = pid;
  update public.ve_position_duties set body = 'Invite the people you know personally, business owners too, with your link.'
   where position_id = pid and kind = 'duty' and grp = 'Your people: the biggest part' and body = 'Invite the people you know personally, with your link.';
  if not exists (select 1 from public.ve_position_duties where position_id = pid and kind = 'duty' and grp = 'Your people: the biggest part' and body like 'Follow up however you like%') then
    insert into public.ve_position_duties (position_id, kind, grp, grp_sort, grp_tag, tone, sort, body, step)
    select position_id, kind, grp, grp_sort, grp_tag, tone, 2, 'Follow up however you like until they join; once they are on Vegans Explore, we take it from there.', null
      from public.ve_position_duties where position_id = pid and kind = 'duty' and grp = 'Your people: the biggest part' and sort = 1 limit 1;
  end if;
  update public.ve_position_duties set body = 'Your people, the biggest part: invite people you know, business owners too, with your link, and follow up until they join.'
   where position_id = pid and kind = 'short' and body = 'Your people, the biggest part: invite people you know with your link.';
end $$;
