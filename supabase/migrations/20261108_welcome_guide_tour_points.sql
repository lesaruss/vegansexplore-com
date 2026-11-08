-- ve-explorer-path: Sean's third pass (2026-11-08). Chapter 1 gets a one-second beat after "Let's go" (tour-1-v3, the
-- v2b take padded). Chapter 4 adds what points are worth (Sean: "let them know points are valuable... giveaways,
-- opportunities, discounts... give them to your favorite nonprofits and local businesses that they can use for promotional
-- and marketing services"), recorded in one take (tour-4-v2a, stt word for word), worded as coming since neither the
-- discounts nor businesses spending points on our services is built yet. Three new frames for the new sentence.
do $$
declare tid uuid := (select id from ve_video_tours where slug = 'welcome-guide');
        base text := 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/';
        tail text := ' Held about 3 s with a slight slow zoom in, then cut to the next picture.';
begin
  update ve_video_chapters set audio_url = base || 'liz/welcome-guide/tour-1-v3.mp3' where tour_id = tid and n = 1;
  update ve_video_shots set audio_to = 20.0 where tour_id = tid and chapter_n = 1 and ord = 5;

  update ve_video_chapters set audio_url = base || 'liz/welcome-guide/tour-4-v2a.mp3',
         line = 'Vote for the places you love. Your favorites tell us who to spotlight next. Check in when you visit and take on bounties to earn points. Spend them to open Guides and ask your Guide anything, or give them to the places and causes you care about. And points keep getting more valuable: giveaways, special opportunities and discounts are on the way, and the local businesses and nonprofits you give them to will be able to use them for promotion through us.'
   where tour_id = tid and n = 4;
  update ve_video_shots s set audio_from = v.f, audio_to = v.t
    from (values (1, 0::numeric, 2.4::numeric), (2, 2.4, 5.2), (3, 5.2, 8.7), (4, 8.7, 11.9), (5, 11.9, 15.2)) as v(o, f, t)
   where s.tour_id = tid and s.chapter_n = 4 and s.ord = v.o;
  if not exists (select 1 from ve_video_shots where tour_id = tid and chapter_n = 4 and ord = 6) then
    insert into ve_video_shots (tour_id, chapter_n, ord, kind, readiness, status, line, brief, image_url, audio_from, audio_to) values
      (tid, 4, 6, 'illustration', 'ready', 'proposed', 'And points keep getting more valuable:',
       'Liz, in her pink tee, opening a gift.' || tail, base || 'tours/welcome-guide/v45/b20a-liz-gift.jpg', 15.2, 17.9),
      (tid, 4, 7, 'screen', 'ready', 'proposed', 'giveaways, special opportunities and discounts are on the way,',
       'The Vault, where members bid points on gift cards.' || tail, base || 'tours/welcome-guide/v45/s20b-vault.jpg', 17.9, 21.8),
      (tid, 4, 8, 'illustration', 'ready', 'proposed', 'and the local businesses and nonprofits you give them to will be able to use them for promotion through us.',
       'A bakery owner and a sanctuary volunteer being photographed for a feature.' || tail, base || 'tours/welcome-guide/v45/b20c-promotion.jpg', 21.8, 28.03);
  end if;
end $$;
