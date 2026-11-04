# ve-vegan-sourcing-guide: supplier crawl run (Logan, 2026-11-04)

Playbook `ve-vegan-sourcing-guide`. Canon `canon-ve-vegan-sourcing` v2.

**Done.** Google quote 60 searches, 0 details ($2.40 at list), approved as `once:vegan-sourcing-crawl`; used 28 searches (about $1.12). Ledger after: $16.18 spent, $33.82 left of $50.
24 queries (food_drink, ingredients, packaging, co_packing) found 109 companies with websites. Each was read from its own site: **27 added to `ve_suppliers`**, 71 rejected (reason kept in `ve_supplier_candidates`), 11 failed (site 403/402/401/404 or did not open).

**Gate (in `scripts/supabase-once/sourcing-crawl.ts`):** a company is added only with a quote copied exactly from its site that shows a Vegan or plant-based claim. `fully_vegan` only on a whole-company claim; otherwise `offers_options`. `peta_approved` is never set by the crawl. Bios: our words, no dashes, capital V, no 8-word run copied from the site. Each row keeps its `evidence` quote and `bio_source` URL.

**Result:** 3 fully vegan (The Coconut Company UK, Vegan Kingz, Crust Vegan Bakery, the last fixed by hand), 24 offers vegan options. Six rows set `hidden`: five compostable-packaging suppliers whose only evidence is "plant-based" as a material (AMS Compostable, Good Start Packaging, Green Paper Products, Simply Pak, Vitaveg) and Plantafood Medical (weak quote).

**Open for Sean:** how packaging should be labeled (plant-fiber material is not a Vegan claim); Cheeze and Thank You and The Vegan Copacker read as fully vegan but stay `offers_options`.

**Not done:** bios and checks for the 134 PETA rows; retry the 11 failed sites; more queries (Google has $33.82 left); buy-or-make recipes; Pre-Vegan Business Guide; `ve-sourcing` with a real signed-in member (unproven). The Sourcing tab is on `claude/ecstatic-galileo-lth5gz`, not on main. Rows are `active` and show only to Guide owners through `ve-sourcing`.

The crawl function `ve-once-sourcing-crawl` is the 410 stub. Migration `supabase/migrations/20261104_ve_suppliers_crawl.sql` is applied.
