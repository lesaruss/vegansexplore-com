# ve-vegan-sourcing-guide: locked, Logan builds the Restaurant Guide Sourcing tab (2026-11-04)

Playbook `ve-vegan-sourcing-guide` (BrandDesk > Vegans Explore > Playbooks). Canon `canon-ve-vegan-sourcing`.

**Locked by Sean:** one shared sourcing directory (hidden from the shoppers' Directory) feeds a Sourcing tab in the Vegan Restaurant Guide (buy or make, home-scale recipes) and a new Pre-Vegan Business Guide for coffee shops, gyms, juice bars and any business adding vegan (Pascal; separate from the consumer Pre-Vegan Guide). Seed: 134 suppliers from PETA's Guide to Vegan Suppliers and Manufacturers (Oct 2026), `docs/suppliers/peta-guide-2026-10-names.csv`, names and websites only. Labels: PETA-Approved Vegan, Fully vegan company, Offers vegan options.

**Next (Logan):** hidden directory section, load the 134 with labels and bios from their own sites, the Sourcing tab (template gate: copy the Restaurant Guide), screenshots at 1440 and 390 px, then crawl food, drink and packaging suppliers (Google under the $50 cap, quote first).

**Sean's open calls:** price and door wording for the Pre-Vegan Business Guide; public find-a-supplier page; restaurant-scale recipe batch sizes.

Nothing loaded into the Directory; nothing built.

## Update: step 1 built (Logan, 2026-11-04)

Table `ve_suppliers` (own table, not `listings`), 134 PETA suppliers loaded (38 PETA-Approved Vegan, 96 Offers vegan options), edge function `ve-sourcing` deployed (refuses with no token), Sourcing tab in the Vegan Restaurant Guide (members only). Branch `claude/ecstatic-galileo-lth5gz`, not on main.

**Finding:** the PETA list is fashion and beauty materials, so a restaurant sees only the Materials domain live. The tab is honest about it (every other domain says Coming), but it is not useful to a restaurant until food, ingredient, packaging and co-packer suppliers are crawled.

**Next:** crawl those suppliers (Google under the $50 cap, quote first, bios from each company's own site), then buy or make recipes, then the Pre-Vegan Business Guide on its own playbook. Unproven: `ve-sourcing` with a real signed-in member.

## Wrap-up (Logan, 2026-11-04)

Everything above is on branch `claude/ecstatic-galileo-lth5gz`, **not on main**. Sean merges it. Files: `supabase/migrations/20261104_ve_suppliers.sql`, `20261104_vegan_sourcing_canon.sql`, `20261104_vegan_sourcing_wrapup.sql`; `supabase/functions/ve-sourcing/index.ts` (deployed v1 through the connector, no sha check); `guide-scripts/vegan-restaurant-guide.js` and `guides/vegan-restaurant-guide.html` (the Sourcing tab); `docs/suppliers/peta-guide-2026-10-names.csv`.

**Not proven:** `ve-sourcing` with a real signed-in member (the build session has no live token; with no token it answers 401). The tab was checked in a browser against mocked answers only.

**Paste prompt for a new chat:** ve-vegan-sourcing-guide: crawl food, drink, ingredient, packaging and co-packer suppliers into `ve_suppliers` (domains food_drink, ingredients, packaging, co_packing), labels PETA-Approved Vegan / Fully vegan company / Offers vegan options, never fully vegan for a mixed line; bios in our words from each company's own site; Google under the $50 cap with a quote first (`ve_google_approve`). Read the playbook `ve-vegan-sourcing-guide`, canon `canon-ve-vegan-sourcing` and `docs/handoff/2026-11-04-ve-vegan-sourcing-locked.md` first.
