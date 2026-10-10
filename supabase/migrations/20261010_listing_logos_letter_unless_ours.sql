-- Directory logos (Sean, 2026-10-10: "a lot of listings don't have the proper logos on it. I would prefer it
-- just to have the thumbnail with the letter if it's not the official logo"). A listing keeps its logo only
-- when we hold it in our own storage (vegan-media: logos checked by eye, the curated logo files, or one an
-- admin picked in the media library) or it is a podcast's own cover art (Apple Podcasts). Every other logo
-- was linked from somewhere else (Instagram pictures, whose links expire; website share images; other sites)
-- and is set aside in details.logo_unverified, so the card shows the letter. To restore one after checking it:
--   update listings set logo_url = details->>'logo_unverified', details = details - 'logo_unverified' where slug = '<slug>';
update public.listings
set details = coalesce(details, '{}'::jsonb) || jsonb_build_object('logo_unverified', logo_url, 'logo_unverified_at', '2026-10-10'),
    logo_url = null, logo_alt_text = null, updated_at = now()
where coalesce(logo_url, '') <> ''
  and logo_url not like 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/%'
  and logo_url not like 'https://is1-ssl.mzstatic.com/%';
