# ve-feedback: Facebook review list (2026-11-08)

Playbook `ve-feedback`. Follows `2026-11-08-ve-feedback-price-and-social-links.md`.

## Done
- Dropped the leftover `ve_social_check_tick()` (its cron was already gone; checked no cron called it).
- Apify's Facebook pages run `2EK5TxNjA4UPYRzSv` finished (SUCCEEDED, $3.79 of its $5 cap). All 462 items of dataset
  `m297ruPSmWGZ4XPm6` were read through pg_net (token read inside SQL) into `ve_social_link_checks`; 461 matched our rows by Facebook
  path (one came back under a rewritten profile address). Result on the 580 Facebook rows checked: 527 live pages, 44 "not available",
  9 came back empty.
- Then `ve_social_link_checks` and `ve_social_scan_ig` were dropped (migration note `20261108_social_scan_tables_drop.sql`).
  The list below is the only copy of the review.
- **Nothing was removed from any listing.**

## The review list for Sean (48 listings that are not people)
Left off: the Bryant Terry, Tabitha Brown and Isa Chandra books (their Facebook is the author's personal profile, which hides from
logged-out readers) and the two Urban Plates (already cleared last session).

- **Broken address** (8): the stored value is not a page at all (`/p`, `/pg`, `/search`, `/https:`, a share link). Safe to clear.
- **Not available** (32): Facebook told a logged-out reader the page is unavailable. It may be deleted, renamed, or age or
  country restricted (bars and brewpubs often are). Worth a look while signed in to Facebook.
- **Came back empty** (8): the scraper got nothing back. Usually a restricted page (several are bars); weakest signal of the three.

| Why | Listing | Kind | Facebook value now |
|---|---|---|---|
| Broken address | [Good Kitchen + Market](https://vegansexplore.com/directory/good-kitchen-market) | Restaurants | `https://www.facebook.com/search` |
| Broken address | [HAAM - Caribbean Plant Cuisine](https://vegansexplore.com/directory/haam-caribbean-plant-cuisine) | Restaurants | `https://www.facebook.com/p` |
| Broken address | [OverGreens Salads & Juice](https://vegansexplore.com/directory/overgreens-salads-juice) | Restaurants | `https://www.facebook.com/p` |
| Broken address | [PGH Green & Grains Co](https://vegansexplore.com/directory/pgh-green-grains-co) | Restaurants | `https://www.facebook.com/p` |
| Broken address | [Renegade Vegan](https://vegansexplore.com/directory/renegade-vegan) | Restaurants | `https://www.facebook.com/https:` |
| Broken address | [Seoul Food D.C.](https://vegansexplore.com/directory/seoul-food-d-c) | Restaurants | `https://www.facebook.com/pg` |
| Broken address | [Soulicious Vegan Kitchen](https://vegansexplore.com/directory/soulicious-vegan-kitchen) | Restaurants | `https://www.facebook.com/p` |
| Broken address | [Vegan Squad](https://vegansexplore.com/directory/vegan-squad-florida) | Health and Wellness | `https://www.facebook.com/share/16sMPZi9EV/?mibextid=wwXIfr` |
| Not available | [4 Rivers Smokehouse](https://vegansexplore.com/directory/4-rivers-smokehouse-coral-springs) | Restaurants | `https://www.facebook.com/4rsmokehouse` |
| Not available | [Bar Bombón](https://vegansexplore.com/directory/bar-bomb-n) | Restaurants | `https://www.facebook.com/bar-bomb%c3%b3n` |
| Not available | [Blue Moon Cafe](https://vegansexplore.com/directory/blue-moon-cafe) | Restaurants | `https://www.facebook.com/bluemooncafe` |
| Not available | [Bodhi Village](https://vegansexplore.com/directory/bodhi-village) | Restaurants | `https://www.facebook.com/bodai5908` |
| Not available | [BRGR Stop](https://vegansexplore.com/directory/brgr-stop-coconut-creek) | Restaurants | `https://www.facebook.com/brgrstopftl` |
| Not available | [Coconutz Fusion Cafe](https://vegansexplore.com/directory/coconutz-fusion-cafe) | Restaurants | `https://www.facebook.com/coconutz-fussion-cafe` |
| Not available | [Darbster](https://vegansexplore.com/directory/darbster) | Restaurants | `https://www.facebook.com/darbster` |
| Not available | [Divine Leaf Vegan](https://vegansexplore.com/directory/divine-leaf-vegan) | Restaurants | `https://www.facebook.com/divineleafvegan` |
| Not available | [Falafel Gourmet](https://vegansexplore.com/directory/falafel-gourmet) | Restaurants | `https://www.facebook.com/falafelgourmetcs` |
| Not available | [Fam Kitchen](https://vegansexplore.com/directory/fam-kitchen) | Restaurants | `https://www.facebook.com/fam’skitchen` |
| Not available | [Forks Over Knives](https://vegansexplore.com/directory/forks-over-knives) | Documentaries & Films | `https://www.facebook.com/forksoverknives/` |
| Not available | [Gary Rack's Farmhouse - Delray Beach](https://vegansexplore.com/directory/gary-rack-s-farmhouse-delray-beach) | Restaurants | `https://www.facebook.com/farmhousekitchenboca` |
| Not available | [Govinda's Soho Street](https://vegansexplore.com/directory/govinda-s-soho-street) | Restaurants | `https://www.facebook.com/govindaslondon` |
| Not available | [Higher Taste, Plant-Based](https://vegansexplore.com/directory/higher-taste-plant-based) | Restaurants | `https://www.facebook.com/highertasteplantbased` |
| Not available | [Holy Burger Bed-Stuy](https://vegansexplore.com/directory/holy-burger-bed-stuy) | Restaurants | `https://www.facebook.com/holycownyc` |
| Not available | [Honest Cuban by VCC](https://vegansexplore.com/directory/vegan-cuban-cuisine) | Restaurants | `https://www.facebook.com/vegancubancuisine` |
| Not available | [Joy Cafe](https://vegansexplore.com/directory/joy-cafe) | Restaurants | `https://www.facebook.com/63230752120` |
| Not available | [Jusu Brothers - Notting Hill](https://vegansexplore.com/directory/jusu-brothers-notting-hill) | Bakeries & Cafes | `https://www.facebook.com/jusubrotherslvk` |
| Not available | [Keep on Cookin'](https://vegansexplore.com/directory/keep-on-cookin) | Podcasts (closed temporarily) | `https://facebook.com/keeponcookinbydustinharder` |
| Not available | [Mali Vegan Thai](https://vegansexplore.com/directory/mali-vegan-thai) | Restaurants | `https://www.facebook.com/mali-vegan-thai-103233072077703` |
| Not available | [Naomi's Garden - South Beach](https://vegansexplore.com/directory/naomi-s-garden-south-beach) | Restaurants | `https://www.facebook.com/naomismiami` |
| Not available | [Plant Based Briefing](https://vegansexplore.com/directory/plant-based-briefing) | Podcasts | `https://facebook.com/PlantBasedBriefing` |
| Not available | [Sagar Covent Garden](https://vegansexplore.com/directory/sagar-covent-garden) | Restaurants | `https://www.facebook.com/sagarveg` |
| Not available | [Sagar Hammersmith](https://vegansexplore.com/directory/sagar-hammersmith) | Restaurants | `https://www.facebook.com/sagarveg` |
| Not available | [Sweet Leaf - Ashton Heights](https://vegansexplore.com/directory/sweet-leaf-ashton-heights) | Restaurants | `https://www.facebook.com/sweetleafafe` |
| Not available | [Sweet Leaf - Court House](https://vegansexplore.com/directory/sweet-leaf-court-house) | Restaurants | `https://www.facebook.com/sweetleafafe` |
| Not available | [Taste of India - Melbourne](https://vegansexplore.com/directory/taste-of-india-melbourne) | Restaurants | `https://www.facebook.com/taste-of-india-melbourne-119622032363` |
| Not available | [The Local Restaurant](https://vegansexplore.com/directory/the-local-restaurant) | Restaurants | `https://www.facebook.com/thelocalnaples` |
| Not available | [Tony's Darts Away](https://vegansexplore.com/directory/tony-s-darts-away) | Restaurants | `https://www.facebook.com/tonysdartsaway` |
| Not available | [Treelion](https://vegansexplore.com/directory/treelion) | Restaurants (closed permanently) | `https://www.facebook.com/227050227307814` |
| Not available | [VROMAGE CUISINE](https://vegansexplore.com/directory/vromage-cuisine) | Restaurants | `https://www.facebook.com/vromage-dairy-free-cheese-shop` |
| Not available | [Ziree Thai Sushi](https://vegansexplore.com/directory/ziree-thai-sushi-delray-beach) | Restaurants | `https://www.facebook.com/ziree-thai` |
| Came back empty | [Amar](https://vegansexplore.com/directory/amar-delray-beach) | Restaurants | `https://www.facebook.com/AmarDelray` |
| Came back empty | [Cosy Club Westfield Stratford City](https://vegansexplore.com/directory/cosy-club-westfield-stratford-city) | Restaurants | `https://www.facebook.com/thecosyclubuk` |
| Came back empty | [Fitz on 4th](https://vegansexplore.com/directory/fitz-on-4th) | Restaurants | `https://www.facebook.com/fitzon4th` |
| Came back empty | [Frederick Social](https://vegansexplore.com/directory/frederick-social) | Restaurants | `https://www.facebook.com/fredericksocialcafe` |
| Came back empty | [Gracias Madre](https://vegansexplore.com/directory/gracias-madre) | Restaurants | `https://www.facebook.com/graciasmadreweho` |
| Came back empty | [Maggie's Farm](https://vegansexplore.com/directory/maggie-s-farm) | Restaurants | `https://www.facebook.com/farmmaggies` |
| Came back empty | [Mellow Mushroom Jacksonville Beach](https://vegansexplore.com/directory/mellow-mushroom-jacksonville-beach) | Restaurants | `https://www.facebook.com/mellowjaxbeach` |
| Came back empty | [Southernmost Pint Brewpub - Blast Beer Company Brewery](https://vegansexplore.com/directory/southernmost-pint-brewpub-blast-beer-company-brewery) | Restaurants | `https://www.facebook.com/southernmostpintbrewpub` |

## Next
- Sean says which to clear (Logan's recommendation: clear the 8 broken addresses now; the rest after a signed-in look). Clearing keeps
  the old value in `listings.details.social_removed` and logs a `ve_listing_edits` row, as last session did.
- Still open from last session: Honest Cuban's new Instagram and Facebook (it is on this list).
- Apify this cycle: about $11 before, $2.04 Instagram, $3.79 Facebook.
