# History: guides-topic

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## The Nutrition Guide (Sean, 2026-10-31: "build the Nutrition Guide")

**Launched 2026-10-31** (Sean: "lines are good, launch the Nutrition Guide"; migration `20261031_nutrition_guide_launch.sql`). The
Guide tab on Nutrition & Supplements, Physicians and Health Experts listings (`nutrition-guide` in `GUIDES` of `public/ve-guide-tab.js`).
`guides/nutrition-guide.html` and `guide-scripts/nutrition-guide.js`, the Nonprofit Guide's shell (indexed, og:image the banner, in the
sitemap), its card in the Guide catalog after the Airport Guide (label Nutrition, B12 free, `ve-guide-catalog.js`), banner
`public/guides/nutrition-guide.jpg` (Theo in a sunlit kitchen in the black tee, holding a Vegan plate and an unlabeled supplement bottle: the Guide in a scene,
not on white, Sean 2026-10-31; Higgsfield, shown to Sean before it went in). **Its animated card** (the Guides' banner style, Sean 2026-10-31: "copy that"): `G`
entry `nutrition-guide` in `ads/guides/guide.html`, four scenes (the banner "Eat Vegan, get it all"; the plate "Build your plate"; Theo at
the market "Where to find iron and calcium"; a physician on our podcast "Hear from our physicians"; `public/guides/nutrition/scene-*.webp`,
Higgsfield 2026-10-31; never a B12 line over food, since B12 comes from a supplement or fortified foods), campaign `...0c0de5a14007` under
`ve-house-banners`, link `/go/ve-guide-nutrition`, in four slots taken from the Dairy Guide (the North Florida, Virginia and London hubs'
tall slots, South Florida's first 300 x 250; migration `20261031_nutrition_guide_ad.sql`). **Theo** on the right (the Seasoned Vegan mentor, who had no Guide; his lines,
approved by Sean, show as text, no recordings). Tabs (`#/<tab>`): Overview; **Nutrients**, one per view (`#/nutrients/<id>`: B12, protein, iron, calcium, vitamin D, omega-3s,
iodine, zinc), each with why it matters, How much by who, Where to get it, Supplements, Theo's tip, This week (kept in the browser,
`nt_checks`), its sources and an episode; **B12 is the free example**; **Your plate** (Harvard's Healthy Eating Plate with the protein
made Vegan, and the every-day checklist); **Supplements** (the Directory's Nutrition & Supplements brands, open; what to look for before
you buy, members); **Experts** (People > Physicians and Health Experts, and Services > Health Professionals by chapter, open; a listing
opens in the Guide); **Pulse** (`PULSE_PICKS`: 16 episodes with our physicians and health experts, matched to their feeds, played in
place); My list (`ve-cookbook` kinds fix, episode, listing) and Get access. Every page carries the line that it is general information,
not medical advice. **Every number is from the source named under it**, checked 2026-10-31 against the NIH Office of Dietary Supplements
fact sheets, The Vegan Society, Harvard's Nutrition Source and the Academy of Nutrition and Dietetics' position paper (PCRM's Power Plate
page is gone, so the plate is Harvard's; USP blocks automated checks, so it is named without a link). The other seven nutrients, the
plate and the supplement checklist are `ve_guides.content_html` (`<script id="nt-data">`), loaded from the session, never in the repo; the
page holds the intro, the titles and B12 (`#nt-public`). The `ve_guides` row `nutrition-guide` is published ($11 or 1,100 points, sort 8)
so it sells and opens; Sean holds a comp copy (migration `20261031_nutrition_guide.sql`).
