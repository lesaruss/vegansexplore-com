-- ve-explorer-path: the Welcome Guide tour lookbook matches the final video, vertical 4:5 (Sean, 2026-11-08).
-- A tour carries its frame shape; the Depot lookbook draws its player and frames in it.
alter table ve_video_tours add column if not exists aspect text not null default '4:5';
alter table ve_video_tours drop constraint if exists ve_video_tours_aspect_check;
alter table ve_video_tours add constraint ve_video_tours_aspect_check check (aspect in ('4:5','9:16','1:1','16:9'));
-- The two older tours were planned wide; they keep 16:9 until their final shape is decided.
update ve_video_tours set aspect = '16:9' where slug in ('holiday-guide','depot');
update ve_video_tours set aspect = '4:5' where slug = 'welcome-guide';
-- Screen frames now point at the phone captures (1080 x 1350).
update ve_video_shots s set image_url = replace(s.image_url, '/tours/welcome-guide/f', '/tours/welcome-guide/v45/f')
  from ve_video_tours t
 where t.id = s.tour_id and t.slug = 'welcome-guide' and s.image_url like '%/tours/welcome-guide/f%';
