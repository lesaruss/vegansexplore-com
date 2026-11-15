# Handoff 2026-11-15: freestyle session (Logan)

Sean: "I just need a general chat where we could just get a couple of things done." Everything below is on `main` and live unless marked.
Nothing is unmerged: vegansexplore-com main, lesaruss-hq main (merged from `claude/compassionate-lovelace-51lil0`), vegansexplore-app untouched.

## Done and live

1. **Local businesses listed Online no longer show in every chapter** (Seattle showed a Decatur, GA bakery). `ve-region-directory.js`
   `LOCAL_ONLY` (Restaurants, Bakeries & Cafes, Food Trucks, Vendors, Catering) is never "everywhere"; five leaked listings moved to their
   city (migration `20261115_local_online_listings_to_their_chapters.sql`; Amy's Lil Chunks of Love to South Florida on Sean's word).
2. **Holiday menus from Ideas 111526** (Drive): eight menus live, five new listings (Wong Way Veg, Loving Hut Glendora, Vegan Airyy, Follow
   Your Heart Market & Cafe, Nana's Rooted), The People's Harvest event. **Rule, CLAUDE.md**: what Sean hands over goes live, listings included;
   never queued back to him (Sean: "Why all of a sudden I have to intervene and be a middleman?").
3. **Add a listing** (Directory review): Online asks which chapters it serves (`add_create` saves them; ve-discover v23); an empty logo square
   is said out loud. Blondies: South Florida only, logo, both holiday menus on its listing.
4. **BrandDesk > Brand kit > Social kit** (HQ): each platform's name, handle, bio within its limit, tracked bio link, files at exact size, five
   story highlight covers, the 11 tracked profile links, Save to Photos on a phone; the phone overflow (713 px) fixed.
5. **Phones: the site as an app** (`public/ve-app-shell.js`): Back beside the logo and a picture viewer when opened from the home screen; Get the
   app; **the app's bottom bar** (Home, Explore, Menu, Saves, Profile) on every page at 860 px and under; **Menu is a sheet of tiles** (LOCKED by
   Sean); super admins get Depot and BrandDesk tiles; Dashboard's icon is a gauge; Profile opens My Account; no hamburger on phones.
6. **Dashboard**: Recent activity chips answer taps for super admins; the tab waits for its first layout with a loading line; iPhone pages
   wait for the look's CSS (no old-look flash); the dashboard's own parts in Color Block; Your tiles is Shortcuts.
7. **Votes are vouches** (playbook `ve-vouch-points`, LOCKED): one vote per member per listing with Undo; counts are people (884 became 711);
   ve-votes v12. The daily habit becomes earning points to give to businesses, spent on Vegans Explore promotion; owners may give to their own;
   the public count is outside supporters only. **To build** (playbook has the list).
8. **My Account rebuilt** (`/account`): details, Change my password (emailed link; Google, Apple and LESARUSS sign-ins told how they sign in),
   Purchases (`ve-account` + `ve_member_purchases`), Privacy, Sign out.
9. **Homepage**: a play button on the video; five new door pictures (Directory Liz, Events River, Guides all eight, Daily Pulse Theo,
   Passport Maya) in the Guide scene recipe, Maya and Theo from their original references; asset packs in all five shapes at
   `vegan-media/media/home/doors/<scene>/<shape>.jpg`.

## Not proven signed in

The Social kit, My Account and the dashboard fixes were checked with stand-ins and samples, not as Sean.

## Waiting on Sean

- Nothing open from this session. Next for the app: a new chat on playbook `ve-mobile-app` (prompt below).

## Next chat prompt (the app)

Logan, playbook `ve-mobile-app`. Task: version 1.0.1 of the Vegans Explore app in the Color Block look, matching the website, with the
Menu tab as the locked tile sheet (`public/ve-app-shell.js` `tileMenu`). Read `docs/history/app.md` in lesaruss/vegansexplore-com and the app
repo's CLAUDE.md first. iOS 1.0.0 (13) went to App Review 2026-11-08 in the old look and TestFlight shows it; Android is a draft waiting on
Sean's Play Console setup. First: check Apple's review status for 1.0.0, then restyle the app from `docs/brand-kit/README.md`.
