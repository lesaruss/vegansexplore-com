# podcast-network-transcript-upload: wrap-up, Nov 4 2026

Playbook `podcast-network-transcript-upload`, titled **VE Podcast Network** (slug unchanged). The single catch-all for everything podcast: transcripts, relaunch and weekly readiness, new ideas, analytics, and the parked podcast production service for members (case-study-first; never turn away inbound clients).

## State
- **Transcripts**: 131 of 278 (VE 126/143, Pre-Vegans 3/19, SoFlo 2/59, VWL 1/57 as of Nov 3, corrected baseline 131). Sean transcribes in TurboScribe and drops SRT/ZIP in Depot > Content index. After each batch run the three checks in the playbook (saved count matches Depot; rebuild `ve_content_mentions` and spot-check Pulse "Discussed"; guest credits only where the episode's own summary confirms a guest).
- **Bad row**: one failed Vegans Who Lift transcript row is left in place, waiting for Sean to say delete.
- **Podcast analytics built** in BrandDesk > Vegans Explore > Insights > Podcast (Captivate downloads: period vs before, per day, per month, per episode; reconciled 258 = 258 = 258). Captivate's API gives no listeners, devices, apps or places.
- **Uploads built**: the same view takes screenshots/PDFs of Captivate's own dashboard (places, devices, apps, reports), several at once, kept by period for monthly and quarterly reports. Bucket `podcast-reports`, table `ve_podcast_uploads`, `branddesk-insights` v8 (commit 37719c5).
- **Deploys**: VE site READY (149ea29). HQ production READY on 42e59d9, which contains the uploads UI (2030338 is an ancestor).

## Not yet proven
- Opening Insights > Podcast signed in on hq.lesaruss.ai (the build session cannot reach or sign in).
- One 70-byte test PNG remains orphaned in `podcast-reports` (Storage blocks SQL delete); no row.

## Next actions
1. Logan: open Insights > Podcast signed in and confirm (or have Sean glance).
2. Sean's yes needed: have Claude read numbers out of uploaded screenshots into tables/charts, Sean confirming each before save (recommended).
3. Add podcast to the Analysis write-up; first 7/30-day downloads per episode (feedback-loop case study).
4. Run the three after-batch checks when a transcript batch lands.
5. Relaunch queue items from Nov 3 stay open.

## Rules carried
Eastern time only. Log changes to `playbook_records`, rebuild the briefing from the active template. "Transcripts are done" closes the transcript job inside this playbook; the playbook stays open.

## Later the same day (Nov 4, evening): any period, the audience, first days, seen signed in
Playbook `podcast-network-transcript-upload`: Insights > Podcast any period, Audience places, first 7 and 30 days. Added after the section above; read both.

### Shipped
- **Show dropdown and sub menu** (Vegans Explore, SoFlo Vegans, Vegans Who Lift, Pre-Vegans), then **Period** (7, 30, 90, this year, All time, Custom) and **Overview / Episodes / Audience / Uploads**, in the address.
- **One all-time daily series per show**, every period cut from it. **Audience**: every country, province and city, apps, systems, devices; All podcasts together; CSV of every place. **Episodes**: downloads for the period, first 7 and first 30 days.
- **Captivate's dashboard endpoints found in its public scripts** (not guessed). The "no places or devices through the API" note was wrong and is corrected in CLAUDE.md.
- **View only for agent accounts** in `branddesk-insights` (`vegan@lesaruss.com` reads, never writes).
- Function from vegansexplore-com `d2fa4cb` (sha256 matched), migrations `20261104_podcast_uploads_show.sql` and `20261104_podcast_episode_firsts.sql` applied, HQ `bed59b7` on `main`, production READY.
- **Seen signed in as `vegan@` on production** (2026-11-04): All time Overview 5,714 downloads (Captivate's all time 5,717), Audience with 93 countries and the United States opening to its provinces and cities, the CSV (939 rows), SoFlo Episodes with first 7 and 30 days, no page errors, the Insights period box hidden on this tab.

### Next actions
1. Sean: use the Audience CSV with Google's places to pick the next community; say if he wants a saved snapshot (a table) so places can be compared over time.
2. Podcast in the Analysis write-up.
3. Decide what the "all 278 transcribed" finish line counts, since Captivate has more episodes than our table for SoFlo (111 against 59) and Vegans Who Lift (90 against 57).
4. Run the three after-batch transcript checks whenever Sean says a batch landed (131 of 278 on Nov 4). The one failed Vegans Who Lift row stays until he says delete.
5. Optional: whether the places should show a caution for countries that look like data centers (Singapore, Vietnam and China are 3.2%, 2.9% and 2.0% of Vegans Explore's all-time downloads; that is a guess, not checked).

### Lessons
- I said "this session can't reach or sign in to HQ" from a CLAUDE.md note without trying. The browser reached it and the standing login (`agent-headless-page-verification`, the retired-OTP replacement, session written to a file and never printed) worked. Check before saying blocked.
- I guessed Captivate paths and called them nonexistent. Read the app's own scripts first.
- `vegan@lesaruss.com` is a super admin row; "probably refused" was wrong. View only is enforced in Insights, not across HQ.
- A new CSS class `in-sub` collided with the tile's text class and indented every tile's small text; check class names against `deskCss.ts` before adding.
- The branch push needs no force: reset the branch to its remote tip and merge `main` into it.
- One-time functions used and stubbed: `ve-once-captivate-shows`, `ve-once-captivate-probe`, `ve-once-qa-session` (all 410).

### Paste prompt for the next chat
Logan here. Open the playbook `podcast-network-transcript-upload` (VE Podcast Network, project `fwbhwfxpncrsfhttimna`, brand `vegans-explore`, repo `lesaruss/vegansexplore-com`, HQ repo `lesaruss/lesaruss-hq`). Read its `briefings` row, its `playbook_records` newest first, `docs/handoff/2026-11-04-podcast-network-transcript-upload.md` (both parts) and the CLAUDE.md section "Podcast analytics in BrandDesk Insights". State: Insights > Podcast is live with a Show dropdown, Period (all time and custom) and Overview / Episodes / Audience / Uploads; places, apps and devices come from Captivate's API; transcripts 131 of 278 and Sean is still transcribing. Do first: name the playbook and its next action. Then: the podcast in the Analysis write-up; run the three after-batch transcript checks whenever I say a batch landed; the one bad Vegans Who Lift failed-transcript row stays until I say delete. To look at the live page, use the standing headless login for `vegan@lesaruss.com` (agent-headless-page-verification; never print the session). Eastern time only. Wrap up only when I say "wrap up".
