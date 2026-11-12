-- Plantonia: listed as Vegan-friendly (Sean, 2026-11-11: "List Plantonia as Vegan-friendly"). Its own site calls it "Poland's first
-- sustainable and vegan-friendly aparthotel", built with Vegan and recycled materials. Safe to run twice.
update listings set status = 'approved', vegan_status = 'vegan_friendly', listed_at = coalesce(listed_at, now()), updated_at = now(),
  tagline = 'A Vegan-friendly aparthotel in Krakow', specialty = 'A Vegan-friendly aparthotel in Krakow',
  description = 'Plantonia calls itself Poland''s first sustainable and Vegan-friendly aparthotel: studios and apartments in Krakow designed with Vegan and recycled materials, with a gym, yoga classes and a workspace.',
  details = jsonb_set(coalesce(details, '{}'::jsonb), '{admin_notes}', coalesce(details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
    'at', now(), 'by', 'Logan', 'kind', 'note', 'text', 'Listed as Vegan-friendly (Sean, 2026-11-11). Its own site: "Poland''s first sustainable and vegan-friendly aparthotel".')))
where slug = 'plantonia' and status = 'pending';
