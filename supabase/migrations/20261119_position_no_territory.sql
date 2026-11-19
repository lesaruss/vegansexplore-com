-- 2026-11-19: no territory (Sean: "Why are we limiting her to the Northeast? It seems unnecessary... Let her use her network to be an
-- ambassador for what we're creating. And if there's events in Philadelphia, then she can be the boots on the ground in Philadelphia...
-- help put together events and stuff, and there'll be budgets around those... If we have somebody else that's closer, then we'll go with
-- that."). ve_position_people.region now means the holder's home city (the dashboard line: "{region} is your home base"), not a territory.
-- Safe to run twice.
comment on column public.ve_position_people.region is 'The holder''s home city (home base for in-person work). Not a territory: their network has none.';

do $$
declare pid uuid;
begin
  select id into pid from public.ve_positions where slug = 'social-media-manager-instagram';
  if pid is null then return; end if;
  delete from public.ve_position_duties where position_id = pid and kind = 'duty' and grp = 'Out in the Northeast';
  if not exists (select 1 from public.ve_position_duties where position_id = pid and grp = 'In person: your home city') then
    insert into public.ve_position_duties (position_id, kind, grp, grp_sort, grp_tag, tone, sort, body, step) values
      (pid, 'duty', 'In person: your home city', 3, 'Home base', 'new', 1, 'Your network has no territory: reach the people you know, anywhere.', null),
      (pid, 'duty', 'In person: your home city', 3, 'Home base', 'new', 2, 'In your home city, be our boots on the ground: sign people up at events, markets and Vegan spots, and tell owners their page is free to claim.', null),
      (pid, 'duty', 'In person: your home city', 3, 'Home base', 'new', 3, 'Help put together Vegans Explore events there; each one has its own budget, agreed with Sean before anything is spent.', null),
      (pid, 'duty', 'In person: your home city', 3, 'Home base', 'new', 4, 'Going somewhere else? Tell Kai, and we will try to set something up. If someone on the team is closer, they take it.', null),
      (pid, 'duty', 'In person: your home city', 3, 'Home base', 'new', 5, 'Send us events, places and people to spotlight, from anywhere.', null);
  end if;
  update public.ve_position_duties
     set body = 'In person: in your home city, sign people up and help put together events (each with a budget agreed first); traveling, tell Kai; send us what to spotlight from anywhere.'
   where position_id = pid and kind = 'short' and body like 'Out in the Northeast%';
  update public.ve_position_briefs
     set next_text = 'Your people come first, wherever they are: invite the people you know with your own link, post your first collab reel, and find where in your home city to sign people up in person. Keep @vegansexplore answered in about 15 minutes a day.'
   where position_id = pid and week_of = '2026-11-23' and next_text like 'Your people and the Northeast%';
  update public.ve_position_asks
     set title = 'Tell us one event or market in Philadelphia this month where you could sign people up.'
   where position_id = pid and title = 'Tell us one Northeast event or market this month where you could sign people up.';
end $$;
