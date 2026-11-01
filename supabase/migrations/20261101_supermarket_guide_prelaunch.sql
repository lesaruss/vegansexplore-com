-- The Supermarket Guide is prelaunch (Sean, 2026-11-01: "The Supermarket Guide is prelaunch. Only members can see it... I'm really
-- shopping into supermarkets to launch later on"). Not published, so ve-guide-unlock does not sell it and the page reads Coming soon;
-- Publix at Brickell Village stays open by link for the pitch (/business/supermarkets). The page carries noindex again, it left the
-- sitemap, and its catalog card is Coming soon for signed-in members only. It launches in Q1 2027 with its sponsors.
update public.ve_guides set published = false where slug = 'supermarket-guide';
