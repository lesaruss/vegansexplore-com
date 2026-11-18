-- Tracked link for the Paris launch post (Sean, 2026-11-18: "open Paris"). Copied from 20261114_batch4_launch_links.sql. The post and
-- story (public/chapters/paris/) are parked in ve-social-schedule; nothing posts until Sean approves.
insert into ve_links (code, label, destination, initiative_slug, tags, channel, active)
values ('paris-open', 'Vegan Paris is open (launch post)', 'https://vegansexplore.com/communities/paris', 'chapter-paris', array['paris','chapter-launch','social'], 'social', true)
on conflict (code) do nothing;
