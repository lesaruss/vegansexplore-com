# ve-mobile-app: device builds in TestFlight and Play, Menu and Directory mirror the website

Playbook `ve-mobile-app`. Session 2026-11-08 (Logan, build mode).

## Where it stands
- **Secrets**: all six Actions secrets are set on `lesaruss/vegansexplore-app` (EXPO_TOKEN, ASC_API_KEY_P8, ASC_KEY_ID, ASC_ISSUER_ID,
  APPLE_TEAM_ID, GOOGLE_PLAY_SERVICE_JSON), copied server side from `lesaruss_secrets` through the one-time `ve-once-app-secrets` (now the 410 stub).
  The workflow's `secrets` job prints SET / MISSING for each, never values.
- **GITHUB_TOKEN reinstated** (Sean approved): a fine-grained token, vegansexplore-app only, Secrets read/write only. Canon
  `canon-repo-write-standard` body key `exception_2026_11_08_app_secrets`. Never widen it without Sean.
- **iOS**: build 10 reached TestFlight and Sean installed it. Builds 11 and 12 followed; 12 (EAS 5f8b3548, submission ae8c7adb) finished and
  was sent to TestFlight. Android versionCode 4 (EAS 625e590d, submission f9b1b859) was still building at wrap-up.
- **App branch** `claude/elegant-mayer-r6z3p0` at b95d391, **not on the app's main**: Menu tab is the website's phone menu
  (`src/app/(tabs)/menu.tsx`), Explore is the website's Directory (`src/app/(tabs)/explore.tsx`, rules in `src/lib/directory.ts`,
  picker `src/components/OptionSheet.tsx`).
- **Website** branch `claude/elegant-mayer-r6z3p0` at cce2b85, not on main: the phone gap under the Directory's page bar is 16px.
  Merges to main only on Sean's "merge".

## Fixes made, for next time
- Non-interactive EAS reuses a stored iOS profile without checking capabilities: `reset_ios_profile` input runs
  `scripts/asc-reset-profile.mjs` (adds Sign in with Apple with `PRIMARY_APP_CONSENT`, Associated Domains, deletes App Store profiles).
- ASC key from Key Room has no BEGIN/END and may carry literal `\n`: the workflow cleans and re-wraps it, checked with `openssl pkey`.
- Android submit needs `submit.production.android.serviceAccountKeyPath` in `eas.json` (the workflow writes `play-service-account.json`).
- Submit by build id (`submit_only` + `ios_build_id` / `android_build_id`), never `--latest` (it can pick an old June build).
- The workflow inputs: platform, profile, submit, submit_only, ios_build_id, android_build_id, cancel_builds, reset_ios_profile, check_only.

## Next (in order)
1. Confirm iOS 1.0.0 (12) in TestFlight and Android 4 in Play internal testing (if Play refuses the first automated upload, upload it once by hand in Play Console).
2. Sean tests Explore sections, sub-sections, Filters and the Menu on device; then prove Apple sign-in, email sign-in, the Explorer join and a real Check in, watching the database.
3. Step 4: Google iOS and Android OAuth client IDs into EAS env and ve-auth `GOOGLE_NATIVE_CLIENT_IDS`, rebuild, prove Google sign-in.
4. Merge both branches on Sean's word.
5. Decisions waiting on Sean (defaults given): item T nothing sold in v1 (keep); GeekFon rejection reason (need Apple's message); SoFlo Vegans iOS app off sale on launch day with a note (default).
6. Later: website pages inside the app signed in; built-in Events and Pulse screens.

## Seeing Android without an Android phone
Play internal testing needs an Android device. Options: Android Studio's emulator on a computer (install the build from EAS's
"Install" link or `eas build:run -p android`), or Appetize.io with the APK from a `preview` profile build. The website at phone size shows the same screens.
