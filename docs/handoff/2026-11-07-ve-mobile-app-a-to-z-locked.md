# ve-mobile-app: A to Z locked, store keys checked (2026-11-07)

Playbook `ve-mobile-app` (Depot > Playbooks; page `hq.lesaruss.ai/branddesk/brands/vegans-explore/playbook/ve-mobile-app`, `briefings` slug `ve-mobile-app`). Canon `canon-ve-mobile-app`.

## Decided by Sean
- Name **Vegans Explore**, made by **LESARUSS Inc.**
- **No held date**: in the stores as soon as it passes review. Push through.
- **Native app, written fresh** (React Native, Expo) in `lesaruss/vegansexplore-app`. Not a website in a container. The June prototype (code name "Sapphire") is retired and stays in git history.
- **Version 1 tabs**: Home, Explore (search, Directory, place pages, map), Events, Saves, Profile. Join through the Explorer survey with the same account as the website. Guides, Pulse articles and the board, policies and the business dashboard open as web pages inside the app, signed in.

## Logan's technical calls
- One back end: the app calls the same edge functions as the site (ve-auth, ve-search, ve-votes, ve-checkin, ve-events...).
- iOS keeps bundle `com.lesaruss.sapphire` (the existing App Store record "VEGANS EXPLORE", app 6776554626; Apple never lets a record's bundle change; users never see it). Android is `com.lesaruss.vegansexplore` (Play app created by Sean today).
- Nothing sold inside the app in v1 (item T, Sean signs off).

## What exists (checked live today)
- `lesaruss/vegansexplore-app`: June Expo SDK 56 prototype, 11 commits (Jun 9-11). It signs in through Supabase Auth, not `members`/ve-auth, so no member can use it; reads points by `user_id`; `member_profile` has 0 rows; Media reads an empty `podcast_episodes`; home shows made-up stats. Not reused.
- Keys in `lesaruss_secrets` via Key Room (`hq.lesaruss.ai/keys`, rows in `secret_rotation_plan`): `ASC_API_KEY_P8` (saved as the key body without BEGIN/END lines: add them when building), `ASC_KEY_ID`, `ASC_ISSUER_ID`, `GOOGLE_PLAY_SERVICE_JSON` (`vegans-explore-play@lesaruss-493806.iam.gserviceaccount.com`, Release access on the app), `EXPO_TOKEN` (Expo user `lesaruss`, owns `@lesaruss/sapphire`, EAS project `935a602d-fdef-4bf3-8b9d-a5ded99c022e`).
- Checked through the one-time `ve-once-store-keys-check` (now the 410 stub; returned no values): Apple API 200 after Sean accepted the agreements; Google Play edit opens on `com.lesaruss.vegansexplore` (tracks empty); Expo resolves the project.
- Apple account also holds **SoFlo Vegans** (`com.lmg.soflo`, live, last build 2021: to come off sale on launch day unless Sean says otherwise), **GeekFon Society** (rejected July 2026; reason only in App Store Connect > App Review, asked Sean for it), Night Clubs LIVE.
- Website: `manifest.json` is linked only from `index.html`, its icons 404 (`/public/images/icon-*.png` do not exist), theme color orange. No service worker. `/app` is a slideshow.
- Account deletion today is only an email (`/policies#privacy`); no Block a member exists. Both are store requirements (R, S).

## The A to Z (23 pending, 10 done)
Done: A name/maker/no held date, B v1 tabs, C accounts and keys, plus the site features the app reuses.
Next, in order: **D** installable website bridge (icon, manifest on every page via nav.js, service worker, Add to home screen) ; **E** app icon and opening screen (show Sean first) ; **F** clickable phone mock of every v1 screen, approved before building (template gate: nothing in the template map fits a native app, so the mock is the recommendation Sean approves) ; **G** fresh Expo foundation ; **H** join and sign in (email, Google, Apple into ve-auth; needs ve-auth to accept native Google and Apple tokens; Explorer survey) ; **I** Home ; **J** Explore ; **K** map and Near me ; **L** check-in, camera, scanner ; **M** Events ; **N** Saves ; **O** Profile ; **P** web pages inside, signed in ; **Q** push and deep links ; **R** delete account in app ; **S** block a member ; **T** nothing sold in app (Sean signs off) ; **U** privacy forms, policy section, analytics, crash reports ; **V** TestFlight and Play internal testing ; **W** store listings (drafts to Sean) ; **X** submit (first Android upload by hand) ; **Y** launch, retire SoFlo Vegans ; **Z** after-launch routine.

## Open with Sean
- The GeekFon rejection reason (App Store Connect > GeekFon Society > App Review).
- SoFlo Vegans app: default is off sale on launch day.
