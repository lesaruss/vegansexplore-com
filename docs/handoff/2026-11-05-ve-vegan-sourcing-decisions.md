# ve-vegan-sourcing-guide: Sean's calls applied (Logan, 2026-11-05)

Sean's answers: upgrade Cheeze and Thank You and The Vegan Copacker to Fully vegan (done); keep TopLine off the PETA seed (hidden, unchanged); the 24 PETA rows without a bio stay listed with name and website only (unchanged); packaging gets a **Plant-based material** label and shows (changed from the hidden default).

Applied in the database (migration `20261105_sourcing_decisions.sql`): label check widened to `plant_material`; five packaging rows (Green Paper Products, Good Start Packaging, Simply Pak, Vitaveg, AMS Compostable) set `plant_material` and `active`; two rows set `fully_vegan`. State: 13 fully vegan, 163 offers options, 38 PETA-Approved, 5 plant material, 5 hidden (TopLine, Wild Fibres, Plantafood, Rawmantic, Venice Bakery) = 224.
Code: `ve-sourcing` takes the new label; the Sourcing tab has the Plant-based material chip and a note that says it is a material, not a Vegan claim.

This branch also carries the merge of `claude/ecstatic-galileo-lth5gz` (Sourcing tab, `ve-sourcing`, table migration) into current main. One conflict in `guide-scripts/vegan-restaurant-guide.js` was resolved by keeping main's tab list and adding the Sourcing tab.
**Not done:** `ve-sourcing` is not deployed with the new label (deploy after Sean merges to main); the tab not yet seen as a signed-in member; Sean's go to merge to main; bios for the 24; buy-or-make recipes; Pre-Vegan Business Guide playbook.

## Update: bios for the 24 (Logan, 2026-11-05)
Sean: write the bios for the 24 PETA rows without one. The build session cannot reach the companies' sites (the proxy refuses them, and the web-fetch agent got DNS failures), so bios came from web search results (trade press, trade fair listings, registries), written in our words, no dashes, each `bio_source` saying so with the sources. **14 written, 10 still without**: 3 of the 24 are not the sourcing we want to guess at.
Written: 3M Thinsulate, Climashield, NatureWorks, Indorama Ventures (DEJA), Hemp Traders, Mycel, VEGEA, Singtex, Aspen Aerogels, Everest Textile, Hung's Fortune, Vinni's Colours, Avinya Leather, Villani Leonello. Weakest sourcing: Avinya (directory profiles only), Villani Leonello (one university materials listing), Hemp Traders (newest source 2023). Indorama's row says NewLife, but no source ties NewLife to DEJA, so the bio names DEJA only.
Still without (listed with name and website): NuDown (search found a Reno air insulation firm, identity unclear), Autron, BeWave, THE LAB 808, Marikina Rubber (no company page found), Donglim (only trademark records), ReNewTex (a network, not a maker), Rossi Lorenzo e Figli (the Villasanta firm of that name makes fabric finishing and is closing), plus TopLine and Wild Fibres (hidden). 
Data change was a direct update (no schema change). Not done: reading the 10 from their own sites (needs a network that reaches them); a check that the dated sources still hold.

## Update: the last 10 (Logan, 2026-11-05)
Sean checked the sites by hand. Applied (migration `20261105_sourcing_last_ten.sql`): **NuDown hidden** (coming back soon, not active); **Autron** and **ReNewTex** got bios from Sean's own copy of their sites (ReNewTex stays listed as a network); **removed**: BeWave, THE LAB 808, Marikina Rubber, Donglim, Rossi Lorenzo e Figli, TopLine, Wild Fibres. State, 224 rows: 213 active, 4 hidden (NuDown, Plantafood, Rawmantic, Venice Bakery), 7 removed. Every active PETA-seed row now has a bio.
