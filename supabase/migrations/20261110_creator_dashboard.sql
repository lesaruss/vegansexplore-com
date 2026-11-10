-- The creator dashboard (Sean, 2026-11-10): "this should be her dashboard, what she sees when she logs in. She now has a dashboard,
-- and only select people will get the dashboard. I don't think everyone has a dashboard."
-- One row per creator who has one. Read only by the ve-creator edge function (service role); no client policies.
-- enabled stays false until Sean has looked it over; super admins can preview it before then.
create table if not exists public.ve_creator_dashboards (
  member_id    uuid primary key references public.members(id) on delete cascade,
  slug         text not null unique,
  display_name text not null,
  handle       text,
  city         text,
  go_code      text,
  people_slug  text,
  kit          jsonb not null default '{}'::jsonb,
  enabled      boolean not null default false,
  enabled_at   timestamptz,
  enabled_by   uuid,
  created_at   timestamptz not null default now()
);
alter table public.ve_creator_dashboards enable row level security;

-- KJ (Keya, VeganKween), Philadelphia: the first one. Her kit is canon canon-ve-creator-kit.
insert into public.ve_creator_dashboards (member_id, slug, display_name, handle, city, go_code, people_slug, kit)
values ('19f67b83-9368-40d5-af00-87084b0f3fae', 'keya', 'KJ (VeganKween)', '@keyz60', 'Philadelphia', 'keya', 'keya-vegankween',
  jsonb_build_object(
    'base', 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/people/keya-vegankween/',
    'avatar', 'avatar-geekfon-v2.jpg',
    'reel', jsonb_build_object('file', 'kit/reel-kai-intro-v5.mp4', 'poster', 'kit/reel-kai-intro-v5-poster.jpg',
                               'about', 'Kai introduces you over Philadelphia, lo-fi neo soul under his voice. 28 seconds, 9:16.'),
    'story', jsonb_build_object('file', 'kit/story-v2.jpg', 'about', 'Meet your official Vegans Explore content creator. 9:16.'),
    'carousel', (select jsonb_agg('kit/carousel-v1-' || lpad(i::text, 2, '0') || '.jpg' order by i) from generate_series(1, 10) i),
    'captions', jsonb_build_array(
      jsonb_build_object('label', 'Bio line', 'text', 'Official @VegansExplore content creator. Find Vegan food, people and events in your city: {link}'),
      jsonb_build_object('label', 'Announcement post', 'text', 'Big news: I''m now an official Vegans Explore content creator! Vegans Explore is bringing every Vegan business, organization and person onto one platform, city by city, and membership is free. Join through my link in bio and come explore with me.'),
      jsonb_build_object('label', 'Story', 'text', 'I''m an official Vegans Explore content creator. Membership is free. Tap my link to join.'),
      jsonb_build_object('label', 'Your city post', 'text', 'Who should be on the Vegans Explore page for Philadelphia? Drop the Vegan spots, groups and nonprofits we need to add in the comments.'),
      jsonb_build_object('label', 'Reel caption', 'text', 'Exploring Vegan Philadelphia with @VegansExplore. Free to join, link in bio.'))))
on conflict (member_id) do update set kit = excluded.kit, display_name = excluded.display_name, handle = excluded.handle,
  city = excluded.city, go_code = excluded.go_code, people_slug = excluded.people_slug;
