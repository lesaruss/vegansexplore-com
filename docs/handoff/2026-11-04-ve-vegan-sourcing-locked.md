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
