-- Travel > Stays, first batch checked on the hotels' own sites through ve-web-reader (Sean, 2026-11-11: "go ahead").
-- Approved: the hotel's own site says Vegan (or, for The House of AiA, shows plant-based menus). Kept on hold, with the reason in admin_notes.
-- Safe to run twice: approve only touches rows still pending; notes are appended once (guarded by the note text).
update listings set status = 'approved', listed_at = coalesce(listed_at, now()), updated_at = now(),
  details = jsonb_set(coalesce(details, '{}'::jsonb), '{admin_notes}', coalesce(details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
    'at', now(), 'by', 'Logan', 'kind', 'note', 'text', 'Checked on its own site through ve-web-reader 2026-11-11: ' || v.evidence || '. Approved.')))
from (values
 ('agrivilla-i-pini', 'ipinitoscana.com: "Vegan Agrivilla I Pini, Vegan Hotel Tuscany"'),
 ('casa-albets', 'casaalbets.cat: "our vegan restaurant"'),
 ('koukoumi', 'koukoumihotel.com: "Koukoumi Vegan Boutique Hotel"'),
 ('harmony-hill-bali', 'harmonyhillbali.com: "100% vegan luxury villas in Bali"'),
 ('bluedothotel', 'bluedothotel.fr: "a carefree 100% vegan stay"'),
 ('il-mansio', 'ilmansio.net: "a fully vegan and sustainable philosophy"'),
 ('kapuhala', 'kapuhalasamui.com: "Eco-friendly Accommodation and Vegan Resort"'),
 ('beck-hall', 'beckhallmalham.com: "England''s first 100% plant-based hotel"'),
 ('casa-mauna', 'casamauna.com: "plant-based dining", "Plant-based living"'),
 ('mother-earth-vegan-hotel', 'meveganhotel.com: the hotel names itself Mother Earth Vegan Hotel (its domain, direct booking and Facebook page)'),
 ('the-house-of-aia', 'thehouseofaia.com: "plant-based menus at a restaurant"')
) v(slug, evidence)
where listings.slug = v.slug and listings.status = 'pending';

update listings set updated_at = now(),
  details = jsonb_set(coalesce(details, '{}'::jsonb), '{admin_notes}', coalesce(details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
    'at', now(), 'by', 'Logan', 'kind', 'note', 'text', 'Checked on its own site through ve-web-reader 2026-11-11, kept on hold: ' || v.why)))
from (values
 ('hoy-paris', 'its home and about pages no longer say Vegan ("4-Star Wellness & Yoga Hotel")'),
 ('dreamers-welcome', 'its site (now Dreamers BnB) says nothing about Vegan'),
 ('jean-michel-cousteau-resort', 'its home page says nothing about Vegan or plant-based food'),
 ('finca-victoria', 'only its breakfast is said to be Vegan; the stay itself is not called Vegan'),
 ('plantonia', 'it calls itself "vegan-friendly", built with Vegan materials; not a 100% Vegan claim. Sean to decide how it is listed'),
 ('the-farm-at-san-benito', 'its site now redirects to Marriott, which refused the read'),
 ('mikasa-ibiza', 'no website of its own in the source')
) v(slug, why)
where listings.slug = v.slug and listings.status = 'pending'
  and not (coalesce(listings.details->'admin_notes', '[]'::jsonb)::text like '%kept on hold%');

-- Il Mansio's card read "Worldwide" (no town in the source); its place is Lake Garda.
update listings set address_city = 'Lake Garda', updated_at = now() where slug = 'il-mansio' and address_city is null;
