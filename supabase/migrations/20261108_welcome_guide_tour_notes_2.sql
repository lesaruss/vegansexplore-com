-- ve-explorer-path: Sean's second lookbook pass (2026-11-08). Frames 2 and 44 redrawn with natural adult proportions
-- (the old group shots made the Guides look short); chapter 1 re-recorded so "Let's go" sounds natural (tour-1-v2b,
-- stt word for word) and its five frames retimed to the new take.
do $$
declare base text := 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/tours/welcome-guide/v45/';
        tid uuid := (select id from ve_video_tours where slug = 'welcome-guide');
begin
  update ve_video_shots set image_url = base || 'b02-welcome.jpg', status = 'proposed',
         brief = 'All eight Guides waving you in on the steps of a cafe. Held about 3 s with a slight slow zoom in, then cut to the next picture.'
   where id = '6b21411f-9654-4b27-8bc2-29b289156235';
  update ve_video_shots set image_url = base || 'b44-rooftop.jpg', status = 'proposed',
         brief = 'The whole cast on a rooftop, fireworks for the new year. Held about 3 s with a slight slow zoom in, then cut to the next picture.'
   where id = '491fd9f4-5999-4d6c-901b-f3694ca5b8d8';
  update ve_video_chapters set audio_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/liz/welcome-guide/tour-1-v2b.mp3'
   where tour_id = tid and n = 1;
  update ve_video_shots s set audio_from = v.f, audio_to = v.t
    from (values (1, 0::numeric, 3.37::numeric), (2, 3.37, 7.0), (3, 7.0, 10.7), (4, 10.7, 15.1), (5, 15.1, 19.0)) as v(o, f, t)
   where s.tour_id = tid and s.chapter_n = 1 and s.ord = v.o;
end $$;
