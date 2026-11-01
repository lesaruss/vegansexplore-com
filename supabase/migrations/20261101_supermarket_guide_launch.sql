-- The Supermarket Guide launches (Sean, 2026-11-01: "launch the Supermarket Guide"). Published, so ve-guide-unlock sells it for $11
-- or 1,100 points while no supermarket sponsors it (ve_supermarket_guide_sync turns it free while a Title or Partner sponsorship is
-- active), its stores join the bounties once their chain is sponsored, and the page's buy button reads Get it for $11. Pascal's lines
-- go out as text. Publix at Brickell Village (publix-miami-cjalb8) stays the free example. The page loses noindex, its card leaves
-- Coming soon in public/ve-guide-catalog.js, and it joins the sitemap (api/sitemap.js).
update public.ve_guides set published = true where slug = 'supermarket-guide';
