-- ve-feedback: remaining Facebook links (2026-11-08). Data change, already applied through the connector.
-- 4 replaced with pages Sean found by search while signed in; 36 hidden until a person confirms them.
-- Every old value is in listings.details.social_removed.facebook {value, at, why}; one ve_listing_edits row each
-- (field facebook, meta.playbook ve-feedback, decided_by sean). Re-running is a no-op once facebook is already changed.
update listings set facebook='https://www.facebook.com/pages/Coconutz%20Fussion%20Cafe/104929476216624/' where slug='coconutz-fusion-cafe' and status='approved';
update listings set facebook='https://www.facebook.com/DarbsterBistro' where slug='darbster' and status='approved';
update listings set facebook='https://www.facebook.com/profile.php?id=61583833435493' where slug='divine-leaf-vegan' and status='approved';
update listings set facebook='https://www.facebook.com/barbombon' where slug='bar-bomb-n' and status='approved';
-- Hidden (36): 4-rivers-smokehouse-coral-springs, blue-moon-cafe, bodhi-village, brgr-stop-coconut-creek, falafel-gourmet, fam-kitchen,
-- forks-over-knives, gary-rack-s-farmhouse-delray-beach, govinda-s-soho-street, higher-taste-plant-based, holy-burger-bed-stuy,
-- vegan-cuban-cuisine, joy-cafe, jusu-brothers-notting-hill, keep-on-cookin, mali-vegan-thai, naomi-s-garden-south-beach,
-- plant-based-briefing, sagar-covent-garden, sagar-hammersmith, sweet-leaf-ashton-heights, sweet-leaf-court-house,
-- taste-of-india-melbourne, the-local-restaurant, tony-s-darts-away, treelion, vromage-cuisine, ziree-thai-sushi-delray-beach,
-- amar-delray-beach, cosy-club-westfield-stratford-city, fitz-on-4th, frederick-social, gracias-madre, maggie-s-farm,
-- mellow-mushroom-jacksonville-beach, southernmost-pint-brewpub-blast-beer-company-brewery.
-- Find them: select slug, details->'social_removed'->'facebook'->>'value' from listings
--   where facebook is null and details->'social_removed'->'facebook'->>'why' like 'Hidden until confirmed%';
