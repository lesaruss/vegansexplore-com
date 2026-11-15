-- The profile link list (Sean, 2026-11-15: "Go with your list"): 11 links in order, the first ones the ones people see. Each is a
-- tracked /go/ link (initiative ve-social-profiles, tags link-list + its key) and the list sits in the Social kit as data.social.links.
-- Safe to run twice.
insert into ve_links (code, label, destination, initiative_slug, tags, channel)
select 've-link-' || k, 'Profile link: ' || t, d, 've-social-profiles', array['link-list', k], 'social'
from (values
 ('join','Join free','https://vegansexplore.com/join'),
 ('near','Find Vegan near you','https://vegansexplore.com/directory'),
 ('holiday','The Holiday Guide','https://vegansexplore.com/guides/holiday-guide'),
 ('events','Events near you','https://vegansexplore.com/events'),
 ('podcast','The Vegans Explore Podcast','https://vegansexplore.com/directory/vegans-explore-podcast'),
 ('guides','All our Guides','https://vegansexplore.com/guides'),
 ('pulse','The Daily Pulse','https://vegansexplore.com/pulse'),
 ('claim','Claim your business free','https://vegansexplore.com/claim'),
 ('nominate','Nominate someone','https://vegansexplore.com/nominate'),
 ('community','Find your community','https://vegansexplore.com/communities'),
 ('partner','Partner with us','https://vegansexplore.com/partners')
) v(k, t, d)
where not exists (select 1 from ve_links where code = 've-link-' || k);

update ve_brand_cartridges set data = jsonb_set(data, '{social,links}', (
  select jsonb_agg(jsonb_build_object('title', t, 'url', 'https://vegansexplore.com/go/ve-link-' || k, 'note', n) order by o)
  from (values
   (1,'join','Join free',''),(2,'near','Find Vegan near you',''),(3,'holiday','The Holiday Guide','Until Christmas, then swap in the next seasonal Guide'),
   (4,'events','Events near you',''),(5,'podcast','The Vegans Explore Podcast',''),(6,'guides','All our Guides',''),(7,'pulse','The Daily Pulse',''),
   (8,'claim','Claim your business free',''),(9,'nominate','Nominate someone',''),(10,'community','Find your community',''),(11,'partner','Partner with us','')
  ) v(o, k, t, n))), updated_at = now()
where brand_slug = 'vegans-explore';
