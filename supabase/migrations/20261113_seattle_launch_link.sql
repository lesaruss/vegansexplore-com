-- The tracked link for the Seattle launch post (Sean, 2026-11-13: "approved, draft the Seattle post"). Nothing posts until Sean approves.
insert into ve_links (code, label, destination, initiative_slug, tags, channel, active)
values ('seattle-open', 'Vegan Seattle is open (launch post)', 'https://vegansexplore.com/communities/seattle', 'chapter-seattle', array['seattle','chapter-launch','social','veggie-grill'], 'social', true)
on conflict (code) do nothing;
