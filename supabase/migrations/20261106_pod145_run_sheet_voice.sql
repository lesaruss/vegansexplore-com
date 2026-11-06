-- ve-podcast-studio: Episode 145 run sheet changes, applied live 2026-11-06 through the connector (record only).
-- Kai "Coming up today" spot at 25; commercials at 27 (dairy-guide), 45 (restaurant-guide), 90 (nonprofit-guide);
-- script edits to Kai (30), Liz (40), Maya (80); Sean intro (20) and outro (100) voiced in his Higgsfield voice:
-- media/podcast/vep-weekly/2026-11-08/sean-intro-v3.mp3, sean-outro-v4.mp3; title set.
update ve_pod_episodes set title = 'Ballots, Marathons and Jane Velez-Mitchell Unchained'
 where id = '7d59c856-f226-4055-b5f0-50e43b0ea856' and captivate_episode_id is null;
