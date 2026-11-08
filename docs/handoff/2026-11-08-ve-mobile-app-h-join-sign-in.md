# ve-mobile-app: H, join and sign in

Date: 2026-11-08 (Eastern). Playbook `ve-mobile-app`, canon `canon-ve-mobile-app`.

## Done
1. **ve-auth** (deployed from e4eece1, source sha256 391f409a matched): `apple` action (Apple identity token checked against Apple's keys,
   issuer, audience `com.lesaruss.sapphire`, expiry, nonce), Google checks an audience list, issuer and verified email. One shared branch
   for both: find by `apple_id` / `google_id`, else link by email, else a new account waiting on its survey.
2. **ve-mission-survey** (same commit, sha256 72fc6f0b): `survey_get` with no token; `survey_submit_all` saves all answers at once.
3. **Website**: `/survey?s=explorer` works before an account; answers on the device, points pill, Save your answers makes the account.
4. **App** (`lesaruss/vegansexplore-app` branch `claude/great-rubin-yc6ey5`, f7104d3): `/join`, `/signin`, join prompts on Vote, Save,
   Check in, Saves, Profile.

## Proven
- Apple token check: 8 cases with the function's own code and a local key.
- Live: survey read with no token; a [TEST] account saved 8 answers, a bad value skipped, admitted on the last (205 points, Founding,
  entry via survey); account removed.
- Website and app web build checked at phone size against the live questions; desktop for the website.

## Not proven / needs Sean or a device
- A real Apple or Google sign-in (needs a device build, step V).
- Google on iOS and Android needs two OAuth clients in the Google Cloud project (iOS bundle `com.lesaruss.sapphire`, Android package
  `com.lesaruss.vegansexplore` with the signing SHA-1), their IDs as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `_ANDROID_` in the app's EAS env,
  and ve-auth's `GOOGLE_NATIVE_CLIENT_IDS`. Until then the Google button hides on phones.
- Sign in with Apple capability on the App ID (EAS sets it on build from `usesAppleSignIn`).

## Next
I (Home, the Explorer content), J (the full place page with Check in), then V (builds from GitHub Actions).

## Open with Sean
Merge the app branch to its main; item T (nothing sold in the app); the GeekFon rejection reason; the SoFlo Vegans app on launch day.
