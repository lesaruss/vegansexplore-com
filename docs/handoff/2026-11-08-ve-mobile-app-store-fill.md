# ve-mobile-app: store listings loaded, submission waiting on Sean

Playbook `ve-mobile-app`. Session 2026-11-08 (Logan, build mode).

## Done
- **Builds confirmed** (Actions > EAS build, `store_status`, run 17): iOS 1.0.0 (13) VALID in TestFlight internal testing; Android 1.0.0 (5) on Play
  internal, status completed.
- **Screenshots remade** (the earlier session's were never committed): from the app's web build with live data, `store/screenshots/` in the app repo,
  four each (Home, Explore, Love Life Cafe's page, Join free) at iPhone 6.9 inch 1320 x 2868 and Android 1080 x 2160.
- **Listing text** in `store/listing.json` (listing.md kept the same). Two fields were over the limit and were trimmed: Play short description (now
  "Find Vegan restaurants, events and brands near you. Join free with a survey.", 76) and Apple keywords (dropped the duplicate plant-based, 92).
- **`store_fill`** input on the workflow, `scripts/store-fill.mjs`: reads, or with `store_write` writes, the listing into App Store Connect and Play.
  It never submits and never changes a release track.
- **App Store Connect, written**: version 1.0 renamed 1.0.0, build 13 attached, copyright, description, keywords, promo text, support and marketing
  URLs, name "Vegans Explore" (was VEGANS EXPLORE), subtitle, privacy URL, categories Food & Drink and Travel, 4 iPhone screenshots.
- **Explorer User test account removed** (set to a plain member, then `ve_member_delete`; its one vote deleted).

## Waiting on Sean
- Listing approval (his answer did not come through).
- Apple review contact phone (`REVIEW_PHONE`), review account typed in App Review Information, App Privacy, price Free and availability.
- Play: give the service account store-listing (and production release) permission, then rerun `store_fill`; Data safety, content rating,
  app access, target audience, ads declaration in the console.
- Then: submit iOS 13 for App Review and Android 5 to production.
