-- ve-theme-park-guide: step 2, the Magic Kingdom pins (Sean saw the pilot's plot on 2026-11-04 and said "Pins are good, go ahead with the page").
-- Spots carry a pin (Google's own placement, from the pilot job once:theme-park-magic-kingdom) and the land they are in. A spot with no pin is
-- an open job (Where is it?). The park's own menu link is empty until a real one is read; nothing is guessed.
alter table public.ve_venue_spots add column if not exists latitude numeric;
alter table public.ve_venue_spots add column if not exists longitude numeric;
alter table public.ve_venue_spots add column if not exists google_place_id text;
alter table public.ve_venue_spots add column if not exists pin_source text;
alter table public.ve_venue_spots add column if not exists land text;
alter table public.ve_venues add column if not exists menu_url text;

-- The park: Google's centre for Magic Kingdom Park; radius is the farthest pin (309 m) plus 100 m, rounded (canon: set per park from its pins).
update public.ve_venues set latitude = 28.4188163, longitude = -81.5817689, address = 'Bay Lake, FL 32836, USA', radius_m = 410, status = 'live', updated_at = now()
 where slug = 'magic-kingdom';

insert into public.ve_venue_spots (venue_id, name, kind, zone, land, where_text, latitude, longitude, google_place_id, pin_source, note, sort_order, status)
select v.id, t.name, 'food', 'outside', t.land, t.land, t.lat, t.lng, t.gid, t.src, t.note, t.ord, 'live'
from public.ve_venues v,
(values
('Cinderella''s Royal Table','Fantasyland',28.4195833,-81.58110889999999,'ChIJVVVVFbNi54gROTg8M1yibTo','google',null,1),
('Be Our Guest Restaurant','Fantasyland',28.421241,-81.5807138,'ChIJx3W2iZiA54gRAVmRr5RcmwQ','google',null,2),
('The Crystal Palace','Main Street, U.S.A.',28.4180741,-81.5818695,'ChIJiXxP-aGA54gREUwPAoQlDIg','google',null,3),
('Liberty Tree Tavern','Liberty Square',28.4191096,-81.5826491,'ChIJp-KiGaKA54gRu93-xkpO62o','google',null,4),
('Tony''s Town Square Restaurant','Main Street, U.S.A.',28.4168098,-81.58076919999999,'ChIJ06iAaJ-A54gRuUqOya7bPGU','google',null,5),
('The Plaza Restaurant','Main Street, U.S.A.',28.4179386,-81.5809429,'ChIJuxftUJ-A54gROd4mpFfOMU4','google',null,6),
('Skipper Canteen','Adventureland',28.4185426,-81.58265229999999,'ChIJh2OwH6KA54gRZLcx1Cjk8ic','google',null,7),
('Columbia Harbour House','Liberty Square',28.4199766,-81.5825229,'ChIJzRmVhyJ-3YgRlg5sneGz1_c','google',null,8),
('Pecos Bill Tall Tale Inn and Cafe','Frontierland',28.4188138,-81.5844276,'ChIJcwCMIqKA54gREfRU5B81QYE','google',null,9),
('Casey''s Corner','Main Street, U.S.A.',28.417944499999997,-81.5813558,'ChIJbSWVVp-A54gR-1T7NyCXHgM','google',null,10),
('Cosmic Ray''s Starlight Café','Tomorrowland',28.419256599999997,-81.5798406,'ChIJ5akowpiA54gRMSaa5vrormI','google',null,11),
('Pinocchio Village Haus','Fantasyland',28.4205589,-81.5814462,'ChIJ05n0k5iA54gRlzyyJ-DxXTs','google',null,12),
('The Friar''s Nook','Fantasyland',28.4201418,-81.58086949999999,'ChIJ6Yk3kZiA54gRUajF9YCgVRk','google',null,13),
('Sleepy Hollow','Liberty Square',28.4192628,-81.58199139999999,'ChIJC7hFKHeB54gR3wKFRJJp-Wk','google',null,14),
('Tortuga Tavern','Adventureland',28.4184207,-81.5844261,'ChIJGQFNf6GA54gR9sDstbTFuoM','google',null,15),
('Aloha Isle','Adventureland',null,null,null,null,'Not pinned yet. Google matched a different place; help us find where it is.',16),
('Gaston''s Tavern','Fantasyland',28.4213393,-81.5804385,'ChIJBazEYZiA54gRGUY6dC622aA','google',null,17),
('Main Street Bakery','Main Street, U.S.A.',28.417347999999997,-81.5810819,'ChIJvYKrXp-A54gRLKRh4Z2OQik','google',null,18),
('Plaza Ice Cream Parlor','Main Street, U.S.A.',28.4179249,-81.5811033,'ChIJzRmVhyJ-3YgRtjt-IZtDZkY','google',null,19),
('Sunshine Tree Terrace','Adventureland',28.4184266,-81.5825833,'ChIJJ1oRKKKA54gRqehaJ7UtpEc','google',null,20),
('Storybook Treats','Fantasyland',28.420157999999997,-81.58066579999999,'ChIJaRVakZiA54gRDtMA1pMqkqE','google',null,21),
('Cheshire Café','Fantasyland',28.4197696,-81.58004319999999,'ChIJdZd56piA54gRTzNGaxWp9dI','google',null,22),
('Golden Oak Outpost','Frontierland',28.4186654,-81.5847204,'ChIJS1dfL6KA54gRZySfpsnaVjs','google',null,23),
('Auntie Gravity''s Galactic Goodies','Tomorrowland',28.418669899999998,-81.5793716,'ChIJb4RHxZiA54gRVs_MumBaX_U','google',null,24)
) as t(name, land, lat, lng, gid, src, note, ord)
where v.slug = 'magic-kingdom' and not exists (select 1 from public.ve_venue_spots s where s.venue_id = v.id);
