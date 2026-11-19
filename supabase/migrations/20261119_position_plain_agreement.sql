-- 2026-11-19: agreement v2 in plain words, no travel or budgets, footage to us instead of her own posts. Sean: "Does this have to be so
-- complicated? ... this would scare me if I read this"; "I don't want them thinking we have what we don't have"; "We're making those posts...
-- if she does create content, she'll be sending us footage so we can edit it on our own... we'll always have control of what we collab on."
-- Source of the words: docs/plans/2026-11-19-kj-agreement-v2.md. Still a DRAFT (v1 stays signable until Sean locks). Safe to run twice.
update public.ve_positions set
  posting_draft = $p$Community Manager, Vegans Explore

Vegans Explore opens on January 1. Help us bring the Vegan world in.

- Invite the people you know, with your own link.
- Sign people up in person at events in your city.
- Answer comments and messages on @vegansexplore, about 15 minutes a day.
- Send us footage and ideas. We make the posts and share them with you.

Your own hours. $125 every two weeks, paid through Stripe. The first month is a trial.$p$,
  agreement_draft_version = 'v2',
  agreement_draft_text = $a$Community Manager agreement, version 2

Between Vegans Explore (LESARUSS Inc.) and you.

1. You work for yourself.
You are an independent contractor, not an employee. You set your own hours, use your own phone and computer, can work for others, and handle your own taxes.

2. What you do.
- Invite people you know to Vegans Explore, with your own link.
- Sign people up in person at events in your city.
- Answer comments and messages on @vegansexplore, as Vegans Explore, about 15 minutes a day.
- Read the weekly brief and do its asks.
- Send us footage and ideas. We edit everything in our own style, post it, and invite you to collab on it.
Your questions go to Kai on your dashboard. Sean sees every conversation.

3. Ground rules.
- Businesses hear from Vegans Explore through @vegansexplore, not your own accounts. If one reaches out to you, send them our way.
- On @vegansexplore you only answer comments and messages. You don't post, change settings, or start new conversations.
- No bots or automation.
- If Instagram shows a warning, stop for 48 hours and tell Kai.

4. Pay.
$125 for every two weeks of work, through Stripe. Each two weeks runs Monday to Sunday, and you are paid the Friday after. A part of a two-week period at the start or end is paid by the day. Set up Stripe, including your W-9, before your first payday.

5. Trial and ending.
The first month is a trial. Either of us can end this at any time with 7 days' notice by email, or right away if the ground rules or privacy are broken. You are paid through your last day.

6. Access.
We add you to @vegansexplore in Meta Business Suite for messages and comments only, with your own login. No password is shared. We can see everything and can remove access at any time. Keep two-factor login on, and tell us right away if something seems wrong.

7. Privacy and tone.
Keep what you learn about Vegans Explore, its members and the people you talk to private. Be warm and honest, and never promise anything we haven't built.

8. What belongs to whom.
The conversations you handle for Vegans Explore belong to Vegans Explore. Footage you send us, we can edit and use, and what we make from it belongs to Vegans Explore. What you post on your own accounts stays yours.

9. When it ends.
We remove your access, and you delete anything of ours you have. Sections 7 and 8 still apply.

10. The basics.
Florida law applies. This is our whole agreement. Typing your name and ticking the box counts as signing, and you get a copy by email.$a$,
  updated_at = now()
where slug = 'social-media-manager-instagram';

do $$
declare pid uuid;
begin
  select id into pid from public.ve_positions where slug = 'social-media-manager-instagram';
  if pid is null then return; end if;
  -- Your people: no weekly post on her own account.
  delete from public.ve_position_duties where position_id = pid and kind = 'duty' and body like 'One post or reel a week on your own account%';
  update public.ve_position_duties set grp = 'Your people: the biggest part'
   where position_id = pid and grp = 'Your people and your audience: the biggest part';
  -- In person: events in her city only (no travel, no budgets, no territory talk).
  delete from public.ve_position_duties where position_id = pid and kind = 'duty' and grp in ('In person: your home city', 'In person, in your city');
  insert into public.ve_position_duties (position_id, kind, grp, grp_sort, grp_tag, tone, sort, body, step) values
    (pid, 'duty', 'In person, in your city', 3, 'Your city', 'new', 1, 'Sign people up at events in your city.', null);
  -- Footage and ideas: Vegans Explore makes the posts.
  delete from public.ve_position_duties where position_id = pid and kind = 'duty' and grp = 'Footage and ideas';
  insert into public.ve_position_duties (position_id, kind, grp, grp_sort, grp_tag, tone, sort, body, step) values
    (pid, 'duty', 'Footage and ideas', 3, 'Any time', 'new', 2, 'Send us footage and ideas. We edit everything in our own style, post it, and invite you to collab on it.', null);
  -- The short list.
  update public.ve_position_duties set body = 'Your people, the biggest part: invite people you know with your link.'
   where position_id = pid and kind = 'short' and sort = 2;
  update public.ve_position_duties set body = 'In person: sign people up at events in your city. Footage and ideas: send them to us; we edit, post and invite you to collab.'
   where position_id = pid and kind = 'short' and sort = 3;
  -- The first brief and its ask.
  update public.ve_position_briefs
     set next_text = 'Your people come first: invite the people you know with your own link, send us a few clips for your first collab reel, and find an event in your city where you can sign people up. Keep @vegansexplore answered in about 15 minutes a day.'
   where position_id = pid and week_of = '2026-11-23';
  update public.ve_position_asks set title = 'Send us a few clips from your week for your first collab reel.'
   where position_id = pid and title = 'Post your first collab reel with @vegansexplore from your creator kit.';
end $$;
