# ve-vegan-sourcing-guide: Sean's calls applied (Logan, 2026-11-05)

Sean's answers: upgrade Cheeze and Thank You and The Vegan Copacker to Fully vegan (done); keep TopLine off the PETA seed (hidden, unchanged); the 24 PETA rows without a bio stay listed with name and website only (unchanged); packaging gets a **Plant-based material** label and shows (changed from the hidden default).

Applied in the database (migration `20261105_sourcing_decisions.sql`): label check widened to `plant_material`; five packaging rows (Green Paper Products, Good Start Packaging, Simply Pak, Vitaveg, AMS Compostable) set `plant_material` and `active`; two rows set `fully_vegan`. State: 13 fully vegan, 163 offers options, 38 PETA-Approved, 5 plant material, 5 hidden (TopLine, Wild Fibres, Plantafood, Rawmantic, Venice Bakery) = 224.
Code: `ve-sourcing` takes the new label; the Sourcing tab has the Plant-based material chip and a note that says it is a material, not a Vegan claim.

This branch also carries the merge of `claude/ecstatic-galileo-lth5gz` (Sourcing tab, `ve-sourcing`, table migration) into current main. One conflict in `guide-scripts/vegan-restaurant-guide.js` was resolved by keeping main's tab list and adding the Sourcing tab.
**Not done:** `ve-sourcing` is not deployed with the new label (deploy after Sean merges to main); the tab not yet seen as a signed-in member; Sean's go to merge to main; bios for the 24; buy-or-make recipes; Pre-Vegan Business Guide playbook.
