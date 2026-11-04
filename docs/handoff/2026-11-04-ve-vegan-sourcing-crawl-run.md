# ve-vegan-sourcing-guide: supplier crawl run (Logan, 2026-11-04)

Playbook `ve-vegan-sourcing-guide`. Canon `canon-ve-vegan-sourcing` v2.

**Done.** Google quote 60 searches, 0 details ($2.40 at list), approved as `once:vegan-sourcing-crawl`; used 28 searches (about $1.12). Ledger after: $16.18 spent, $33.82 left of $50.
24 queries (food_drink, ingredients, packaging, co_packing) found 109 companies with websites. Each was read from its own site: **27 added to `ve_suppliers`**, 71 rejected (reason kept in `ve_supplier_candidates`), 11 failed (site 403/402/401/404 or did not open).

**Gate (in `scripts/supabase-once/sourcing-crawl.ts`):** a company is added only with a quote copied exactly from its site that shows a Vegan or plant-based claim. `fully_vegan` only on a whole-company claim; otherwise `offers_options`. `peta_approved` is never set by the crawl. Bios: our words, no dashes, capital V, no 8-word run copied from the site. Each row keeps its `evidence` quote and `bio_source` URL.

**Result:** 3 fully vegan (The Coconut Company UK, Vegan Kingz, Crust Vegan Bakery, the last fixed by hand), 24 offers vegan options. Six rows set `hidden`: five compostable-packaging suppliers whose only evidence is "plant-based" as a material (AMS Compostable, Good Start Packaging, Green Paper Products, Simply Pak, Vitaveg) and Plantafood Medical (weak quote).

**Open for Sean:** how packaging should be labeled (plant-fiber material is not a Vegan claim); Cheeze and Thank You and The Vegan Copacker read as fully vegan but stay `offers_options`.

**Not done:** bios and checks for the 134 PETA rows; retry the 11 failed sites; more queries (Google has $33.82 left); buy-or-make recipes; Pre-Vegan Business Guide; `ve-sourcing` with a real signed-in member (unproven). The Sourcing tab is on `claude/ecstatic-galileo-lth5gz`, not on main. Rows are `active` and show only to Guide owners through `ve-sourcing`.

The crawl function `ve-once-sourcing-crawl` is the 410 stub. Migration `supabase/migrations/20261104_ve_suppliers_crawl.sql` is applied.

## Update: PETA bios (Logan, 2026-11-04)

Sean: go with the defaults (packaging stays hidden; Cheeze and Thank You and The Vegan Copacker stay "Offers vegan options") and write the PETA bios.
Bios for the 134 PETA rows, from each company's own site, no Google calls, labels unchanged: **97 have a bio** (33 of 38 PETA-Approved Vegan, 64 of 96 Offers vegan options). **37 have none**, with the reason in `bio_source` ("no bio: ..."): 17 site did not open, 5 site errors (400, 403, 404, 503), 3 bio length, 3 bio copied the site, 9 site not usable (under construction, script only, not the company). A spot check of 14, including Toray, Lenzing and DuPont (Sorona), shows no mixed-line company called Vegan.
Script: `scripts/supabase-once/sourcing-bios.ts`; function `ve-once-sourcing-bios` is the 410 stub.
**Not done:** the 37 without bios, more crawl queries ($33.82 of Google left), buy-or-make recipes, Pre-Vegan Business Guide, `ve-sourcing` with a signed-in member, merge of `claude/ecstatic-galileo-lth5gz`.

## Update: retry of the 37 (Logan, 2026-11-04)

The reader now tries the www, non-www and http forms of a site and gives the model three attempts on a bad length or a copied bio. **13 more bios: 110 of 134 PETA rows have one, 24 do not.** No Google calls; `ve-once-sourcing-bios` is the 410 stub again.
Still without a bio (reason in `bio_source`): 6 sites did not open (BeWave, Everest Textile, Hung's Fortune, Mycel, Singtex, VEGEA); 5 site errors (Marikina Rubber 400, 3M Thinsulate and NatureWorks 403, THE LAB 808 404, NuDown 503); 3 bios that still copied the site (Climashield, Hemp Traders, Villani Leonello); 10 sites with nothing usable (Avinya, Autron, Aspen Aerogels, Rossi Lorenzo, Indorama, Vinni's Colours, Donglim, ReNewTex, TopLine, Wild Fibres).
**Found:** TopLine's own site names only animal fibres, so its "Offers vegan options" label has no support; Wild Fibres' site says its store and fibre sales are closing. Both set `hidden` pending Sean.
**Open for Sean:** whether TopLine stays off the PETA seed; whether the 24 without bios stay listed with name and website only (default: yes). Packaging wording, the two fully-vegan upgrades and the merge of `claude/ecstatic-galileo-lth5gz` are unchanged.

## Update: crawl 2 and wrap-up (Logan, 2026-11-04)

Sean: "go with your defaults and run more crawl queries", then "wrap up". Quote 100 searches, 0 details ($4.00 at list), approved as `once:vegan-sourcing-crawl-2`; used 60 searches ($2.40). **Ledger after: $18.58 spent, $31.42 left of $50.** 46 narrower queries (food_drink, ingredients, packaging, co_packing); the crawler skips every host the first crawl saw, reads `www`, non-`www` and `http` forms, and counts "all vegan" as a whole-company claim.
285 new companies found and all read: **63 added**, 213 rejected (reason kept in `ve_supplier_candidates`), 9 failed on site errors. Reviewed: Hungry Planet moved to Offers vegan options (its quote is one product line), Rawmantic Chocolate (a consumer shop) and Venice Bakery (a navigation heading as evidence) set hidden. Eight crawl-2 rows are Fully vegan company, each with a whole-company quote (All Vegetarian, Loco Love Chocolate, Nutcase Organics, Plant Ahead Vegan, Raw Chocolate Love, Switch Foods, The Jackfruit Company, NutreeLife).
Function `ve-once-sourcing-crawl-2` is the 410 stub. Script `scripts/supabase-once/sourcing-crawl-2.ts` (key-free).

**State of `ve_suppliers`, end of day:** 224 rows, 214 active, 10 hidden. PETA seed 134 (38 PETA-Approved Vegan, 96 Offers vegan options, 110 with a bio); crawl 1 27; crawl 2 63; 11 Fully vegan company in all (3 + 8). Hidden: TopLine and Wild Fibres (PETA), five compostable packaging rows and Plantafood (crawl 1), Rawmantic and Venice Bakery (crawl 2).

**Open for Sean:** packaging wording (plant-fiber material is not a Vegan claim; five rows stay hidden until decided); upgrading Cheeze and Thank You and The Vegan Copacker to Fully vegan; whether TopLine stays off the seed; whether the 24 PETA rows without bios stay listed with name and website only; merge `claude/ecstatic-galileo-lth5gz` so members can see the Sourcing tab.
**Not done:** the 24 PETA rows without bios; `ve-sourcing` with a real signed-in member (unproven); buy-or-make recipes; the Pre-Vegan Business Guide (own playbook); chapter filter or search words on the tab for the new domains; more queries only if Sean wants them (Google $31.42 left). A suppliers row is shown to members only, through `ve-sourcing`, and only on the branch that has the tab.
**Branches:** crawl files and handoffs are on `claude/cool-feynman-ypf2j7`; the tab, `ve-sourcing` and the table's first migration are on `claude/ecstatic-galileo-lth5gz`; neither is on main.
