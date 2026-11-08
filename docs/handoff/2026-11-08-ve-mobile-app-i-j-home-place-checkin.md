# ve-mobile-app: I and J (Home, the place page and Check in)

Date: 2026-11-08 (Eastern). Playbook `ve-mobile-app`, canon `canon-ve-mobile-app`. App repo `lesaruss/vegansexplore-app`, branch
`claude/great-rubin-yc6ey5` at e15db33 (not on its main).

## Done
1. **I, Home**: chapter picker (kept on the device as `ve_chapter`; first visit the member's home chapter, else South Florida), the chapter's
   art, Most voted near you (the chapter's 100% Vegan food places by votes; LESARUSS.ai and closed listings left out), Coming up (approved
   Vegans Explore events in the chapter's `eventCities`), Join free or Build your profile, the Dairy Guide and today's Daily Pulse. Chapters are
   `src/lib/chapters.ts`, generated from this repo's `public/ve-hubs.js` by `node scripts/gen-chapters.mjs` in the app repo. Explore follows the
   chapter (its full Directory is a later step).
2. **J, the place page**, copied from `directory/listing.html`: art by chapter, crumb, pills with cuisines, Vote (live count), Save / Saved,
   Check in, the info bar, Overview / Menu / Photos as one dropdown, Hours, Follow, Is this your business, Directions / Call / Order; a location
   fills from its main listing; Menu follows the website's 35-day rule.
3. **Check in**: the phone's position, `ve-checkin` `checkin`, then the check-in menu as its own screen (meal and receipt photos shrunk to
   1600 px JPEG, post link, shout-out, bounties). No server change.
4. **V**: `.github/workflows/eas-build.yml` in the app repo (hand-run; production auto-submits to TestFlight and Play internal testing).

## Proven (live database, phone size, 2026-11-08)
- Home for South Florida, Atlanta, London and Central Florida with no failed reads; Love Life Cafe's page and its Menu link-out.
- As the Logan test account (`459ced0a`, a session from the one-time `ve-once-app-checkin`, now the 410 stub; script
  `scripts/supabase-once/app-checkin-proof.ts`): 22.6 miles away refused (too_far); at the cafe checked in at 8 m for +10; a shout-out and a meal
  photo sent, both pending. Then the check-in, its actions, the photo, the ledger row and the points removed (balance 1,113, lifetime 1,130 as before).

## Found
- expo-location's web version reuses any earlier position (maximumAge Infinity); the app's web build now asks the browser directly (`lib/where.ts`).
- `ve-auth` `me` reads a LESARUSS-tenant account as `pending_payment` here, so app proofs use the Vegans Explore Logan test account.
- GitHub runs a hand-run workflow only when it is on the default branch: dispatching it on the branch answered 404.

## Waiting on Sean
1. Merge `claude/great-rubin-yc6ey5` into the app repo's main (open since H).
2. Add the app repo's Actions secrets from Key Room: EXPO_TOKEN, ASC_API_KEY_P8, ASC_KEY_ID, ASC_ISSUER_ID, APPLE_TEAM_ID, GOOGLE_PLAY_SERVICE_JSON.
3. The Google sign-in clients for iOS and Android (Google Cloud project; their IDs into EAS env and ve-auth's GOOGLE_NATIVE_CLIENT_IDS).
4. Item T (nothing sold in the app), the GeekFon rejection reason, the SoFlo Vegans app on launch day.

## Next (Logan)
Run Actions > EAS build (production, submit) once 1 and 2 are done; prove Apple sign-in on an iPhone through TestFlight and the place page and
Check in on a device. Not proven yet: iOS credentials made non-interactively on the first build (EAS may need one interactive setup).
