# ve-mobile-app: D live, G built, H next

Date: 2026-11-08 (Eastern). Playbook `ve-mobile-app`, canon `canon-ve-mobile-app`.

## Where it stands
- **D, the installable website: live** on vegansexplore.com (main). Manifest, icon A in `public/app/`, `sw.js` v2 (keeps `/offline`, since clean addresses redirect `/offline.html`), `offline.html`, `public/ve-install.js` (from the 3rd page; `?install=1` forces it), all wired through `nav.js`.
- **E decided**: icon A (white suitcase on #2D5C27); B on file; the leaf mosaic `public/ve-mark.png` is retired. Opening screen: the stacked logo on white (`public/logo-ve-portrait-v1.svg`).
- **F approved** ("I approved the look"): canvas https://claude.ai/artifact/D52VjPJvNiWXafBXZbvhCp.
- **G built** on `lesaruss/vegansexplore-app` branch `claude/great-rubin-yc6ey5` (44329ef, pushed, **not on its main**). Fresh Expo SDK 58: tabs Home, Explore, Menu (raised), Saves, Profile; Home and Explore show live top places with the website's Directory card; place page with Back; ve-auth session storage. tsc clean, web export builds, checked in a phone-sized browser.
- **H not started.** Sean said "Go ahead with H" and the session was wrapped before any H code was written.

## H, join and sign in (next)
1. Survey first, account last (Sean: "they do the guide and then they get the account"): the Explorer survey with a points pill adding up in the top right, then save with Apple, Google or email, which makes the account.
2. ve-auth must accept native Apple and Google sign-in from the app (id tokens; iOS bundle `com.lesaruss.sapphire`, Android `com.lesaruss.vegansexplore`). Read `supabase/functions/ve-auth` first; never Supabase Auth.
3. The website changes to match: `/survey?s=explorer` today needs an account first.
4. No forced login: browse first; Vote, Save, Check in, Saves and Profile ask to join.

## Blocked from build sessions
docs.expo.dev and api.expo.dev are refused, so EAS builds and submits run from GitHub Actions in the app repo with `EXPO_TOKEN` (Key Room). That is step V.

## Open with Sean
- Merge the app branch to its main (harmless; nothing deploys from it yet).
- Item T default: nothing sold in the app; locked Guides say get it on vegansexplore.com.
- The GeekFon rejection reason; taking the SoFlo Vegans app off sale on launch day; whether + Get badges shows on other members' pages (Logan: yes).
