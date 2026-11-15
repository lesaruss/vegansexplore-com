-- Social kit files served from vegan-media storage (Sean, 2026-11-15: Save on the Events highlight opened the picture instead of the
-- save options). HQ's Content-Security-Policy connect-src allows https://*.supabase.co but not vegansexplore.com, so Save could show
-- those files but not fetch them. The 14 files under vegansexplore.com/public/brand-kit/social/ and the three logo PNGs were copied
-- byte for byte to vegan-media/media/brand-kit/social/ (one-time ve-once-social-week, now the 410 stub). Kit files belong in storage.
update ve_brand_cartridges set data = jsonb_set(data, '{social}', regexp_replace(regexp_replace((data->'social')::text,
  'https://vegansexplore\.com/public/brand-kit/social/', 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/brand-kit/social/', 'g'),
  'https://vegansexplore\.com/public/(logo-ve-[a-z0-9-]+\.png)', 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/brand-kit/social/\1', 'g')::jsonb), updated_at = now()
 where brand_slug = 'vegans-explore';
