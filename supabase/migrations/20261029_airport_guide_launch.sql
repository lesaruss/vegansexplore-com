-- The Airport Guide launches (Sean, 2026-10-29: "Let's lock it and let's launch the airport guide"). Published, so ve-guide-unlock
-- sells it for $11 or 1,100 points, its airports join the venue bounties, and the page's buy button reads Get it for $11. Nori's
-- lines go out as text; no clips are recorded yet. Fort Lauderdale (fll) stays the free example.
update public.ve_guides set published = true where slug = 'airport-guide';
