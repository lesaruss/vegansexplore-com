-- Clothing and Fashion > Suits & formal, first brand (Sean, 2026-11-03: "go ahead with the suit brands"; the "vegan suit" search
-- question was the prompt). Same rule as the Clothing round (20261101_marketplaces_clothing_beauty.sql): in only when the whole line
-- is Vegan, checked by web search (the session cannot open brand sites).
-- In: WILDA.ECO, a Polish women's suit label; Good On You (updated 2026-02-04) says its entire range is Vegan.
-- Left out: Hangrr and Sartoro (vegan suits are an option beside wool lines), Hugo Boss (one linen suit), Hall Madden (vegan
-- specialist, not whole line), Brave GentleMan (the first all-Vegan menswear label, but no sign it trades now), Will's Vegan Store (closed).
insert into public.listings (name, slug, category, specialty, description, tagline, location, website, status, vegan_status,
  communities, crawl_source, tenant_id, initials, product_kinds, details)
select 'WILDA.ECO', 'wilda-eco', 'Clothing and Fashion', 'Vegan women''s suits, made to order',
  'Women''s suits made to order in Poznan, Poland, from Vegan, biodegradable and certified organic materials, down to the shoulder pads and sleeve heads. Its whole range is Vegan.',
  'The first natural, Vegan, biodegradable suit', 'Online', 'https://wilda.eco', 'approved', 'fully_vegan',
  '{}'::text[], 'admin', '00000000-0000-4000-a000-000000000002', 'W', array['formal'],
  jsonb_build_object('added_by_hand', true, 'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
    'text', 'Added 2026-11-03 to Clothing and Fashion (Suits & formal): whole range Vegan per Good On You (2026-02-04) and its own site; checked by web search.')))
where not exists (select 1 from public.listings l where l.slug = 'wilda-eco' and l.status = 'approved');
