# ve-vegan-sourcing-guide: distributors, machinery and the Buy or make gaps (Logan, 2026-11-06, Eastern)

**On `main`** (merge d6ad75c, crumb fix after it). `ve-sourcing` v4 deployed from the repo file (live source read back and matched).
Migration `20261106_sourcing_batch_distribution_machinery.sql`, applied. No Google calls (ledger unchanged, $31.42 of $50 left).

**Done**
- **A fifth label, Equipment** (`equipment`): a machine maker is not a food company, so none of the four labels was honest for it.
  It reads "A maker of machines, not food. Being listed here is about what you can make with them, not a claim that the company is
  Vegan." (`SRC_LABEL`, `SRC_MEAN` in `guide-scripts/vegan-restaurant-guide.js`, `.rg-lab.eqp`, `LABELS` and `RANK` in `ve-sourcing`,
  the table's label check.) Logan's default; Sean's to rename.
- **Machinery, no longer Coming (4)**: Yung Soon Lih (tofu and soy milk lines, Taiwan), Takai (tofu and soy milk, Japan), Goodnature
  (cold press and nut milk presses, US), Bühler (high-moisture extrusion for plant-based meat, Switzerland). All Equipment.
- **Distributors, no longer Coming (4)**: Vegan Supply Wholesale (Canada, only Vegan) and GTFO It's Vegan (US, only Vegan) as Fully vegan
  company; Feeser's (Central Pennsylvania) and Clark Distributing (moved here from ready-made food) as Offers vegan options.
- **Buy or make: every item has a supplier now (14 of 14)**: Kite Hill ricotta (Fully vegan), Rich's coconut whipped topping and cooking
  cream (Offers vegan options), Violife heavy whipping cream, cheese and plant butter (Fully vegan), Mill It buttermilk (Fully vegan),
  Nature's Charm evaporated and sweetened condensed coconut milk (Offers vegan options: not sure their whole line is Vegan). No change to
  the MAKE patterns; kinds were worded to match (Kite Hill's whipped ricotta is stored as "ricotta alternative" so it does not land under
  Whipped cream).
- **Crumb fix**: a supplier opened by link after browsing a different list no longer shows that list in its crumb (`SRC.back.k`).
- 228 active suppliers. Every new `bio_source` says where the bio came from (web search; company sites are unreachable from the build
  session). Three say "confirm before ordering": Mill It and GTFO It's Vegan (no news after 2022), Nature's Charm (no company site found).
- **Checked live** with one-hour tokens (`ve-once-sourcing-proof`, back to the 410 stub) as a Guide owner who is not a super admin (Logan
  test account) and as a super admin, at 1440 and 390 px: machinery and distribution lists, Goodnature's supplier view with the Equipment
  label, Buy or make Ricotta with Kite Hill; every call 200, no sideways scroll, no script errors.

**Open**
- Sean: the Equipment label name and wording (default: keep).
- Logan: more machinery (tempeh incubators, nut milk lines at production scale, filling and pasteurizing) and US regional distributors with
  real Vegan ranges, a handful at a time; the Pre-Vegan Business Guide shows the same tab.
- Sean: Liz's Sourcing line (`docs/proposals/liz-audio-scripts.md`) still waits; nothing recorded.
