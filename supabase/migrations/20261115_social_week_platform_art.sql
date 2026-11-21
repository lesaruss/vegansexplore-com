-- Social week of 2026-11-16, round 2 (Sean, 2026-11-15: "We're leaning too much on Liz in these photos... I would like to actually see some real
-- screenshots... the real point of this is to show off the platform, not our guides, but the guides will anchor it. And I'm not a big fan of the groups shot.")
-- Every slide is now a live phone screenshot with a rotating Guide beside it (scripts/brand-templates/screen-art.js). Same file names in storage, so only
-- the What is carousel (now 9 slides) and the two captions change here. Safe to run twice.

update ve_social_slots set assets='[{"url": "https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/social/week-2026-11-16/what-is/slide-01.jpg", "type": "image", "w": 1080, "h": 1350}, {"url": "https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/social/week-2026-11-16/what-is/slide-02.jpg", "type": "image", "w": 1080, "h": 1350}, {"url": "https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/social/week-2026-11-16/what-is/slide-03.jpg", "type": "image", "w": 1080, "h": 1350}, {"url": "https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/social/week-2026-11-16/what-is/slide-04.jpg", "type": "image", "w": 1080, "h": 1350}, {"url": "https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/social/week-2026-11-16/what-is/slide-05.jpg", "type": "image", "w": 1080, "h": 1350}, {"url": "https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/social/week-2026-11-16/what-is/slide-06.jpg", "type": "image", "w": 1080, "h": 1350}, {"url": "https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/social/week-2026-11-16/what-is/slide-07.jpg", "type": "image", "w": 1080, "h": 1350}, {"url": "https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/social/week-2026-11-16/what-is/slide-08.jpg", "type": "image", "w": 1080, "h": 1350}, {"url": "https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/social/week-2026-11-16/what-is/slide-09.jpg", "type": "image", "w": 1080, "h": 1350}]'::jsonb, caption='What is Vegans Explore? Everything Vegan, near you, in one place. Swipe through:

• The Directory: Vegan places near you, voted on by the community
• Every place has its own page: hours, menus, holiday menus and more
• Events: Vegan events in your city
• Guides: for every step, whether you''re Pre-Vegan or Seasoned
• Communities: your city''s Vegan hub
• Media: podcasts and shows, free
• Nominate Someone: put a person you admire in the spotlight

Membership is free. Join by midnight Eastern on January 1 and you''re a Founding Member for good. Link in bio.

#VegansExplore #Vegan #VeganCommunity #VeganFood #FoundingMember', updated_at=now() where batch='week-2026-11-16' and title='Pinned 1: What is Vegans Explore' and status='proposed';
update ve_social_slots set caption='Vegans Explore in 30 seconds. 🌱 Vegan places, a page for every one, events, Guides, your city''s community and free shows.

Join by midnight Eastern on January 1 and you''re a Founding Member for good. Link in bio.

#VegansExplore #Vegan #VeganCommunity #VeganFood', updated_at=now() where batch='week-2026-11-16' and title='Reel: What is Vegans Explore, in 30 seconds' and status='proposed';
