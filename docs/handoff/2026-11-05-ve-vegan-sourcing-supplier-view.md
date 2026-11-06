# ve-vegan-sourcing-guide: supplier view, alternatives labels, first certifiers (Logan, 2026-11-05, evening Eastern)

**Branch**: `claude/charming-carson-58ep5d`, built on `claude/magical-gates-pq0cp6` (4890c10), which Sean had **not** merged at 6:43 PM Eastern.
Merging `claude/charming-carson-58ep5d` brings both. Nothing here changes `ve-sourcing` (v3 already has `get`).

**Done**
- **A supplier's own view** `#/sourcing/s/<slug>` (`viewSupplier` in `guide-scripts/vegan-restaurant-guide.js`, styles `.rg-sup*` in
  `guides/vegan-restaurant-guide.html`): the whole bio, the label and what it means (`SRC_MEAN`), what they make, Visit their website, Back
  to the list. Every supplier row (domain lists and Buy or make) now opens it; the crumb goes back to the list it came from, filters kept
  (`SRC.back`), else to the supplier's domain. A missing slug says so with Back.
- **"<x> alternatives"**: leather, suede, down, wool, fur, cashmere, silk, feathers show as "Leather alternatives" etc. on rows, the kind filter
  and the supplier view (`SRC_ALT`, `kindName`). Display only (Logan's default): the stored kinds keep the PETA list's words, so filter values,
  search and later imports are unchanged.
- **Certification is no longer Coming**: Vegan Action (Certified Vegan) and The Vegan Society (Vegan Trademark) as Fully vegan company, the
  V-Label as Offers vegan options (it also certifies vegetarian). Migration `20261105_sourcing_certifiers.sql`, applied. Bios from web search
  results, `bio_source` says so. No Google calls ($31.42 of $50 still left).
- Checked against mocked answers at 1440 and 390 px: rows open the view, crumb and Back return to `#/sourcing/materials`, kind filter reads
  "Leather alternatives", missing slug message, no sideways scroll, no script errors.

**Open**
- Sean: merge `claude/charming-carson-58ep5d` to main. Then Logan confirms live as a Guide owner and as a super admin at 1440 and 390.
- Sean: BeVeg (a for-profit law firm that certifies only Vegan) is held: Fully vegan company or leave it out? Default: leave it out.
- Sean: the Dairy Guide's 14 recipes still read free inside the Restaurant Guide. Default: keep it, since the Restaurant Guide is the door.
- Sean: Liz's Sourcing line (`docs/proposals/liz-audio-scripts.md`); nothing recorded until he approves.
- Logan: machinery and distribution are still Coming, and 5 Buy or make items have no supplier. A Google Places scan does not fit them (they
  are not walk-in places); next pass is web search, a handful at a time, same honesty rules.
