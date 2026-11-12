# The featured kit (Nominate Someone; Sean, 2026-11-12: "approved, build the featured kit")

When the team saves where a feature is live (Depot > Nominations > a member > **Feature them**), a `stream_events` row asks Logan for the
kit: "Featured kit requested: <name> (nomination <id>)". Logan makes it in a session (no server can draw), then the team checks the
likeness and presses **Send the feature**.

1. **Their photo.** `ve-nominations` `get` (team) returns `photo_url` (signed, an hour). No photo yet: ask them first (their interview's
   Set Up Your Account and You've Been Featured both take one). Import it to Higgsfield with `media_import_url`.
2. **Draw the portrait in all five shapes** (asset packs rule) with the locked recipe: model `nano_banana_pro`; references in this order:
   their photo, the style scene `6c80cc2c-765e-4739-a93b-b9643ce543b8`, a tee from the Guide wardrobe (any color; e.g. dark green
   `32cec0e9-7009-4b14-8a4a-47be39903a18`, ids in `docs/merch/2026-11-09-guide-tees.md` part 5). Prompt: "<Name>, the same person as the
   first reference (same face, hair, skin tone, glasses and jewelry if any), drawn in the illustrated style of the second reference scene,
   mid shot from head to waist, a warm wave, smiling, plain clean white background, centered with space above the head. Wearing exactly
   the t-shirt in the third reference, the suitcase mark on the chest at the same size and place. Hands fully drawn. No other logos, no
   readable words." Aspects `1:1`, `4:5`, `9:16`, `16:9`, `21:9`. Never crop one shape into another. Check each by eye against the photo:
   a likeness that is off is worse than none; draw again.
3. **Size and render**: save them as `1x1.png` ... `21x9.png` in one folder, then
   `python3 scripts/featured-kit/make.py --name "<their name>" --city "<their area>" --in <folder> --out <kit folder>`
   (the graphics are `scripts/brand-templates/featured.js` on the locked brand kit templates; a name too long to fit stops the render).
4. **Upload** the seven files to `vegan-media/media/people/<kit_slug>/featured/` (the folder the Depot shows): a signed PUT for each from
   `el-media` `upload_url` (path `people/<kit_slug>/featured/<file>`), called from SQL with net.http_post as usual.
5. In the Depot press **Check the kit**: every file must be there. The team compares the portrait with their photo, ticks the box and
   presses **Send the feature**: the featured person (`featured-people`, their link to You've Been Featured) and their nominator
   (`nominator-featured`, their link to the first place it is live) are emailed in the next send window, weekdays 9 to 5 Eastern.
6. **A redraw** ("Not quite you?" on their page) emails contact@lesaruss.com and shows in the Depot with their note. Draw again, upload
   over the same names, Check the kit (that clears the request and refreshes their page). Redraws are counted per person.
