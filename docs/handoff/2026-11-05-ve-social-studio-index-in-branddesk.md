# ve-social-studio: Index in BrandDesk Social, paused-guard test (2026-11-05)

Playbook: ve-social-studio (briefing ad93d024-7fa4-4631-9e64-331a2817af21; Pending 5, Completed 14). All times Eastern.

## Done
- ve-social-studio: first weekly fetch checked. The 2:17 AM ET Nov 4 run fired with `scrape_on` still false (nothing fetched). To test the paused guard, `paused` was set true on the one claimed listing with a handle (@vegansexplore, listing fdcf4960-0ead-4a85-9433-b555d7674730) at 10:04 PM Nov 4. The 2:17 AM Nov 5 run fetched nothing (`last_fetch_at` null, 0 posts, `fetch_fails` 0). NOT proven: the function's reply was not found and Apify could not be reached. `paused` set back to false at 4:09 AM Nov 5.
- ve-social-studio: Index view in BrandDesk Social, merged to lesaruss-hq main (c76cff8 first as top buttons; moved into the frame's tab row in b660a94; height fix a5d53e2). Files: `components/branddesk/SocialIndex.tsx`, `app/api/branddesk/social-index/route.ts`, `components/branddesk/BrandHome.tsx`, `components/branddesk/deskCss.ts`, `scripts/sync-branddesk-social.py` (adds the tab, route and a view message to the frame; `public/branddesk/social.html` regenerated). Checked live as `vegan@lesaruss.com` at 1440 and 390 px: Index tab in the row, 1,657 posts, white panel, no script errors, Content switches back.
- Playbook records (3), briefing lists and ve_playbook_index row updated. No migration, no edge function change.

## Not done / open
1. Sean did not see the Index tab on his screen. Get his address and a screenshot (cached frame file `/branddesk/social.html`, or he was on vegansexplore.com's Depot > Social, which has no Index).
2. Take it off / Put it back never clicked on real data.
3. Paused guard still unproven: the first real fetch is the 2:17 AM ET Nov 6 run. Check `ve_listing_social` (last_fetch_at, last_fetch_note, fetch_fails), `ve_listing_posts` for that listing, Apify spend and runs (about 40 posts, a few cents); read the function's reply. To prove the guard itself, repeat with paused true and read the reply or Apify's run list.
4. Matcher: one Dina's Vegan Deli post is attached to unrelated listings (one row per post and listing, by tag). Waiting on Sean's go.
5. Owner's Social step as a signed-in owner, still unproven.

## Lessons
- I said I could not sign in to HQ without trying. The headless login (canon `agent-headless-page-verification`) worked in minutes. Check before saying blocked.
- A frame cannot report a height below its own window; the Index view measures its own content. A hand edit to `public/branddesk/social.html` is erased by the next sync, so changes go in the sync script.
- This sandbox refuses `*.vercel.app`; test on `hq.lesaruss.ai` after a merge, and revert if wrong.
- One-time function `ve-once-qa-session` used twice and set back to the 410 stub; session signed out, files deleted. A scheduled trigger in the account (`trig_01FnbrYQ...`) belongs to another chat; left alone.
- Pushed straight to HQ main (no pull request) at Sean's word.

## Paste prompt for the next chat
Logan here. Open the playbook `ve-social-studio` (project `fwbhwfxpncrsfhttimna`, brand `vegans-explore`, repos `lesaruss/vegansexplore-com` and `lesaruss/lesaruss-hq`). Read its `briefings` row (ad93d024-7fa4-4631-9e64-331a2817af21), its `playbook_records` newest first, `docs/handoff/2026-11-05-ve-social-studio-index-in-branddesk.md` and the CLAUDE.md bullet "Index, in BrandDesk Social". State: the Index tab is live on HQ main in BrandDesk > Vegans Explore > Social, in the Plan | Notes for Logan | Content row, on a white panel, and was checked as `vegan@`; Sean did not see it on his screen. Do first: name the playbook and its next action. Then: (1) ask Sean the address he is on and for a screenshot of the Social tab, and sort out why he does not see Index; (2) after the 2:17 AM ET Nov 6 run, check the first real fetch of `vegansexplore`: `ve_listing_social`, `ve_listing_posts`, Apify spend and runs, and the function's reply; the paused guard is still unproven; (3) with Sean's go, look at the matcher (one post attached to unrelated listings). To look at a live HQ page use the standing headless login for `vegan@lesaruss.com` (agent-headless-page-verification; mint into a file, never print the session, sign it out and stub the one-time function after); this sandbox refuses `*.vercel.app`. Eastern time only. Wrap up only when I say "wrap up".
