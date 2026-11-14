-- The tracked link for the Portland launch post (Sean, 2026-11-14: "open Portland"). Copied from 20261113_seattle_launch_link.sql.
-- The post and story (public/chapters/portland/) are parked in playbook ve-social-schedule. Nothing posts until Sean approves.
insert into ve_links (code, label, destination, initiative_slug, tags, channel, active)
values ('portland-open', 'Vegan Portland is open (launch post)', 'https://vegansexplore.com/communities/portland', 'chapter-portland', array['portland','chapter-launch','social','veggie-grill'], 'social', true)
on conflict (code) do nothing;
