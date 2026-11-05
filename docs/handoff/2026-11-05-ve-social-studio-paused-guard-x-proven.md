# ve-social-studio: paused guard proven, X clicked live (2026-11-05)

Playbook `ve-social-studio` (Depot > Social and BrandDesk Social, one queue). Logan, about 6:50 to 7:05 AM Eastern, Thursday Nov 5.

## Done
- ve-social-studio: paused guard proven at both levels.
  - The 2:17 AM ET Nov 5 run (07:17 UTC, the row paused) replied `{"enrolled":0,"fetched":0,"results":[]}` with `scrape_on` true: `weeklyRun` selects only `paused = false`.
  - Apify's run list had no run at that time (the 6:18 to 6:28 AM ET `instagram-scraper` runs are the matcher v2 picture refresh; the 2:45 and 3:00 AM `dSCLg...` runs are the profile reader used by other jobs).
  - The guard inside `fetchTheirs`: the row paused for a minute, `admin_fetch` with the ops token answered `{"ok":false,"error":"paused"}`, no Apify run; then unpaused. Row now: paused false, last_fetch_at null, fetch_fails 0.
- ve-social-studio: X and Undo clicked signed in as `vegan@` on hq.lesaruss.ai (`/branddesk/brands/vegans-explore?view=social&s=index`): La Chia Vegana on Dina's post DXDxdLxAfqf (row 05805b58), removed 6:52:49 AM ET, shown 6:53:16; struck through with Undo, then X back; reload had 24 cards and no script errors. HQ's POST has no view-only block for vegan@ (unlike bcpsmarcomm).
- ve-social-studio: headless login. `ve-once-qa-session` deployed with a hashed run key (generate_link magiclink, verify, session into a scratch file, never printed), Playwright with the `sb-fwbhwfxpncrsfhttimna-auth-token.N` cookie, signed out (204), back to the 410 stub (version 20).
- Commit author: Sean said Sean A. Russell <contact@lesaruss.com>, Claude in Co-Authored-By; Claude only for a push refused for the author. In CLAUDE.md's Deploy rule.

## Not done / next
1. The first real fetch is tonight, 2:17 AM ET Nov 6 (the cron is nightly, `17 7 * * *`). Before about 8 AM ET read: `ve_listing_social` (last_fetch_at, last_fetch_note, fetch_fails) for listing fdcf4960-0ead-4a85-9433-b555d7674730; its `source = 'theirs'` rows in `ve_listing_posts`; `thumb_url` in vegan-media (thumbs cron every 10 min); the reply in `net._http_response` around 07:17 UTC; Apify runs and spend (`net.http_get` to `api.apify.com/v2/actor-runs` with the token read inline from `lesaruss_secrets` APIFY_API_TOKEN).
2. The owner's Social step as a signed-in owner in a browser is still unproven.
