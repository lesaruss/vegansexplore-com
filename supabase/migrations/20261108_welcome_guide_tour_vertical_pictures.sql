-- ve-explorer-path: Sean's lookbook notes (2026-11-08). Every wide picture redrawn as a native vertical 4:5 scene
-- (Higgsfield, from the old picture as reference); the two chapter cities extended to fill the frame; frame 16 shows a
-- real listing instead of the Sample one; frame 45 gets its own picture (it repeated frame 36). Files in
-- vegan-media/media/tours/welcome-guide/v45/. Frames are numbered as the lookbook shows them.
do $$
declare base text := 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/tours/welcome-guide/v45/';
begin
  update ve_video_shots s set image_url = base || v.f, brief = v.b || ' Held about 3 s with a slight slow zoom in, then cut to the next picture.', status = 'proposed', note = null
    from (values
      ('6b21411f-9654-4b27-8bc2-29b289156235'::uuid, 'b02-cast.jpg',         'All eight Guides together, waving (vertical).'),
      ('eda8e377-c079-4aa9-b54d-6d64cc017d1f'::uuid, 'b04-atlanta.jpg',      'Atlanta, the chapter art extended to fill the frame.'),
      ('010c5f64-d046-44ee-a824-578981010d6f'::uuid, 'b06-potluck.jpg',      'Theo and Maya welcoming you to a community potluck.'),
      ('b97137af-abea-4b8a-9792-2e820946dbe6'::uuid, 'b07-river-market.jpg', 'River at an evening Vegan market (vertical).'),
      ('a0fde64c-3712-41c2-9af7-4c701926ffc3'::uuid, 'b08-kai-cafe.jpg',     'Kai filming a plate in a cafe (vertical).'),
      ('d9aff05d-80a1-4b73-a2cc-47e5803bacf4'::uuid, 'b10-market-walk.jpg',  'The Guides walking through an outdoor market (vertical).'),
      ('ec7f742d-2e73-4fec-99ae-ae5a2b117e84'::uuid, 's16-listing.jpg',      'A real listing on a phone: Dina''s Vegan Deli with Vote and Save.'),
      ('026eace3-bd25-44ab-8b4e-eec0d0a949a2'::uuid, 'b17-liz-owner.jpg',    'Liz, in her pink tee, with a restaurant owner (vertical).'),
      ('668d5dd2-8deb-44f1-8378-b6fdbb0a8c6b'::uuid, 'b20-barn.jpg',         'Giving back: a pig and a hen in the barn, nothing cut off.'),
      ('2e228798-6f4e-4bd4-bac6-08e0752eb0f8'::uuid, 'b23-kai-studio.jpg',   'Kai on a studio set, a path''s own Guide (vertical).'),
      ('cc9eb0a1-03d5-4fce-98d9-5300f7ffe973'::uuid, 'b30-doorway.jpg',      'An open doorway into a bright cafe (vertical).'),
      ('9dbecee3-8945-4afd-856f-0fd72782229b'::uuid, 'b32-south-florida.jpg','South Florida, the chapter art extended to fill the frame.'),
      ('074473b2-ba35-49a5-b6be-dd10d4b8e8ce'::uuid, 'b35-dani-cow.jpg',     'Dani with a rescued cow at a sanctuary (redrawn).'),
      ('6b8f9f7f-ff34-4770-92e4-a0f74419f0f2'::uuid, 'b39-nori-door.jpg',    'Nori waving you in through the door: you''re in, free.'),
      ('491fd9f4-5999-4d6c-901b-f3694ca5b8d8'::uuid, 'b44-celebrate.jpg',    'The whole cast celebrating.'),
      ('7bd9d0f0-a72b-4958-bc67-96077f73a08f'::uuid, 'b45-liz-join.jpg',     'Liz, in her pink tee, inviting you to join today.')
    ) as v(id, f, b)
   where s.id = v.id;
end $$;

-- Then (same day): frames 18 and 19 recaptured with the Sample stamp out of the shot (Sean: the warning is not what people
-- want to see), and frame 43 shows the countdown so it no longer repeats frame 37.
update ve_video_shots set image_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/tours/welcome-guide/v45/s18-dashboard.jpg', status = 'proposed' where id = '403c0815-036f-4556-bc29-5a2fc7c11449';
update ve_video_shots set image_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/tours/welcome-guide/v45/s19-points.jpg', status = 'proposed' where id = 'dc2b6006-f691-4b79-abfc-431b85a90449';
update ve_video_shots set image_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/tours/welcome-guide/v45/s43-countdown.jpg', status = 'proposed' where id = '20a61aec-19bd-4996-87e1-1cdc31a94935';
