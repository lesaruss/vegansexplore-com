-- Tracked links for the San Francisco, Austin, Denver and Boston launch posts (Sean, 2026-11-14: "open them"). Copied from
-- 20261114_portland_launch_link.sql. The posts and stories (public/chapters/<slug>/) are parked in ve-social-schedule; nothing posts
-- until Sean approves.
insert into ve_links (code, label, destination, initiative_slug, tags, channel, active)
select c || '-open', 'Vegan ' || n || ' is open (launch post)', 'https://vegansexplore.com/communities/' || c, 'chapter-' || c, array[c,'chapter-launch','social','next-level'], 'social', true
from (values ('san-francisco','San Francisco'),('austin','Austin'),('denver','Denver'),('boston','Boston')) v(c,n)
on conflict (code) do nothing;
