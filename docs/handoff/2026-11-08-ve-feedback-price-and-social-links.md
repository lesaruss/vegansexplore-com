# ve-feedback: "$2" on listings, and Instagram and Facebook buttons (2026-11-08)

Playbook `ve-feedback`. Both items live on `main` (ec8f871, 2abef85, 985c65c). Checked live on Honest Cuban, Sen Saigon and
Cafe Sunflower at 1440 and 390 px: prices read `$$` / `$$$`, correct social links, no script errors.

## 1. Price ("$2")
- Cause: `listings.google_price_level` held Google's raw level (1 to 4) from an old import; the page printed it as "$ 2".
  No function writes the column today (checked all 105 functions and the database's own functions).
- Fixed: the page maps 1 to 4 to `$` to `$$$$`; the data was normalized (48 rows, each a `ve_listing_edits` row); trigger
  `trg_ve_listings_price_level` (`ve_price_level_dollars()`) turns any later raw number or `PRICE_LEVEL_*` name into dollar signs.
  Hand-entered ranges ("$10–20") kept. The Directory card never showed price. Migration `20261108_price_level_dollars.sql`.

## 2. Instagram and Facebook buttons
- The page's links were well formed for valid values (two builders, `ytSocial` and `normSocial`; a bare Facebook handle would have
  become a link relative to our site). Replaced by one `socialUrl(net, value)` for the Follow buttons, "Find them on" icons and
  schema `sameAs`.
- The real cause was the stored values:
  - **Instagram** (Apify profile scraper, 885 handles, $2.04, misses run twice): 34 accounts that no longer exist (Honest Cuban's
    `@vegancubancuisine` among them), 15 `@rsrc.php`, 1 `@accounts`: cleared (48 listings). `fish_defender,` fixed.
  - **Facebook**: 27 system pages cleared (16 `facebook.com/docs`, 5 `/login`, `/help`, `/2008`, `/external-redirect` x2,
    `facebook.com/facebook.com`, `facebook.com/www.facebook.com`); Blue Moon Cafe's trailing text trimmed.
  - Every removed value is kept in `listings.details.social_removed` and logged in `ve_listing_edits` (`meta.playbook` ve-feedback).
- Where the junk came from: the home-page readers (`ve-restaurant-audit` essentials, `ve-discover`, `ve-logo-hunt`) matched
  `instagram.com/` anywhere in a link (so `static.cdninstagram.com/rsrc.php/...` became `@rsrc.php`) and took Facebook's own pages
  from site footers. Both fixed; deployed from 2abef85 (source sha256 matched). ve-discover's live copy had been behind main (no Google
  meter, max_tokens 4000, no Event Venues or Promoters); this deploy brought it level.

## Open
- **Honest Cuban's Facebook** (`facebook.com/vegancubancuisine`) bounces logged-out visitors to the login page; it may be gone with the
  rename. Not removed: logged-out checks cannot tell a deleted page from a hidden one. `@honestcuban` exists on Instagram (9 posts, no
  name) but is not confirmed theirs. Sean: give their new Instagram and Facebook, or say to leave them off.
- **Facebook review list**: Apify's pages scraper run `2EK5TxNjA4UPYRzSv` (dataset `m297ruPSmWGZ4XPm6`, capped at $5) was still running
  at wrap (167 of 462). Its "not available" answers include real people whose profiles hide from logged-out visitors (Tabitha Brown,
  Isa Chandra, Bryant Terry), so they are a list for a person, never automatic removals. Next chat: read the dataset into
  `ve_social_link_checks` and give Sean the non-person "not available" listings to look at.
- Scan tables `ve_social_link_checks` and `ve_social_scan_ig` (RLS on, no policies) can be dropped once the review is done.
- Apify this cycle: about $11 before, $2.04 Instagram, up to $5 Facebook.
