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

### Paste prompt for the next chat (the first one; the later one is at the end of part 3)
Logan here. Open the playbook `podcast-network-transcript-upload` (VE Podcast Network, project `fwbhwfxpncrsfhttimna`, brand `vegans-explore`, repo `lesaruss/vegansexplore-com`, HQ repo `lesaruss/lesaruss-hq`). Read its `briefings` row, its `playbook_records` newest first, `docs/handoff/2026-11-04-podcast-network-transcript-upload.md` (both parts) and the CLAUDE.md section "Podcast analytics in BrandDesk Insights". State: Insights > Podcast is live with a Show dropdown, Period (all time and custom) and Overview / Episodes / Audience / Uploads; places, apps and devices come from Captivate's API; transcripts 131 of 278 and Sean is still transcribing. Do first: name the playbook and its next action. Then: the podcast in the Analysis write-up; run the three after-batch transcript checks whenever I say a batch landed; the one bad Vegans Who Lift failed-transcript row stays until I say delete. To look at the live page, use the standing headless login for `vegan@lesaruss.com` (agent-headless-page-verification; never print the session). Eastern time only. Wrap up only when I say "wrap up".


## Part 3, later on Nov 4 (afternoon): the Audience layout merged, the podcast in the Analysis write-up
Playbook `podcast-network-transcript-upload`: Audience layout (live), the podcast in the Analysis write-up (deployed). Read all three parts.

### Shipped
- **Audience layout**, from Sean's notes: white Insights page, white text on the active toggle, Countries and State/City boxes fixed at 10 rows that scroll, a globe until a country is picked, Show cities / Show states, a click on a state opens its cities, a new country resets to states. HQ `main` 7063d6e, checked signed in as `vegan@` on the branch preview (1440 and 390 px, no script errors), then merged; Sean's own screenshot shows it live.
- **The podcast in the Analysis**: `branddesk-insights` v14 from vegansexplore-com 9c246f3 (sha256 matched), `podcastFacts`, the `Podcast` section, cache key `ins:analysis2`, `max_tokens` 8000. Real run: verdict mixed; Vegans Explore 230 against 413, SoFlo 539 against 106, Vegans Who Lift 247 against 195, Pre-Vegans 42 against 8.
- Sean's rule recorded: Insights holds every analytic; a later Podcast tab is for making the podcast and links into Insights, never a copy.
- CLAUDE.md "Podcast analytics in BrandDesk Insights" updated; vegansexplore-com branch merged to `main` at wrap-up.

### Next actions
1. Logan: look at the Analysis tab with the new Podcast section in a browser (headless login), and read its words against the facts.
2. Logan, if Sean says go: show Captivate's `AA` as "Not placed" in Audience; make Apps, Systems and Devices scroll like the places boxes.
3. Sean: pick the next community from the Audience places; say if he wants a saved snapshot of the places.
4. Run the three after-batch transcript checks when Sean says a batch landed (131 of 278). The one failed Vegans Who Lift row stays until he says delete.
5. Decide what the "all 278 transcribed" finish line counts (Captivate holds 111 SoFlo and 90 Vegans Who Lift episodes against our 59 and 57).

### Lessons
- A "we did that already" check earned its keep: the Audience layout and the Analysis write-up had been blended. Look at the deployed code before saying a thing is done or not.
- A pg_net request stays in `net.http_request_queue` while the worker runs it; a long analysis call looks stuck for about a minute and is not.
- Adding a section to a model-written JSON schema needs a bigger `max_tokens`; a truncated reply shows only as a parse failure.
- A branch deploy of an edge function leaves `main` behind the deployed source: merge to `main` before the next deploy from `main`.
- One-time function used and stubbed again: `ve-once-qa-session` (410). Its run key and the minted session were deleted from the scratchpad.

### Paste prompt for the next chat
Logan here. Open the playbook `podcast-network-transcript-upload` (VE Podcast Network, project `fwbhwfxpncrsfhttimna`, brand `vegans-explore`, repo `lesaruss/vegansexplore-com`, HQ repo `lesaruss/lesaruss-hq`). Read its `briefings` row, its `playbook_records` newest first, `docs/handoff/2026-11-04-podcast-network-transcript-upload.md` (all three parts) and the CLAUDE.md section "Podcast analytics in BrandDesk Insights". State: Insights > Podcast is live (Show, Period incl. all time and custom, Overview / Episodes / Audience / Uploads; the Audience boxes are two fixed 10-row scrolling lists with a state or city toggle) and the Analysis write-up now includes a Podcast section (`branddesk-insights` v14, on `main`); Sean wants every analytic in Insights, and a later Podcast tab will be for making the podcast and will link into Insights. Transcripts 131 of 278, Sean still transcribing. Do first: name the playbook and its next action. Then: look at the Analysis tab with the Podcast section in a browser and read it against the numbers; with Sean's go, show Captivate's country `AA` as Not placed and make Apps, Systems and Devices scroll like the places boxes; run the three after-batch transcript checks whenever I say a batch landed; the one bad Vegans Who Lift failed-transcript row stays until I say delete. To look at a live or preview page, use the standing headless login for `vegan@lesaruss.com` (agent-headless-page-verification; mint into a file, never print the session, sign it out and stub the one-time function after; a Vercel preview needs its share link first). Eastern time only. Wrap up only when I say "wrap up".


## Part 4, Nov 4 (evening, Eastern 8:10 PM): AA as Not placed, the scrolling boxes, the Analysis read
Playbook `podcast-network-transcript-upload`: Audience polish (live), the Analysis write-up read against the numbers. Read all four parts.

### Shipped
- **Analysis read in a browser** as `vegan@lesaruss.com` on production, no page errors. The Podcast section matches the Podcast tab for Oct 5 to Nov 3: 230, 539, 247 and 42 downloads, 1,058 against 722, every percentage, Portugal 17.0%, Overcast 37.4%. Single-episode first 7 and 30 day figures were not cross-checked.
- **AA reads Not placed** (Countries list, the right-hand box with its own note, the CSV) and **Apps and players, Systems and Devices are fixed 442 px scrolling boxes** with a title and N in all; lists of 8 or fewer shrink to fit (`.in-aud-box.fit`). HQ main `64e879e` (a fast-forward of the branch), production `dpl_CaU7xcmGUY7YHBUZz5dzuYiJ6KKV` READY. Seen on the branch preview at 1440 and 390 px, no overflow or errors, AA on Vegans Who Lift all time. Not seen on production itself (same commit). No typecheck run: the build session has no dependencies; the preview build passed.
- Playbook row, briefing (Sean's calls group, 7 done items, Completed 11) and a decision record updated; CLAUDE.md "Podcast analytics in BrandDesk Insights" updated.

### Next actions
1. Sean: pick the next community from the Audience places; say if he wants a saved snapshot of the places.
2. Sean: decide what the "all 278 transcribed" finish line counts (Captivate holds 111 SoFlo and 90 Vegans Who Lift episodes against our 59 and 57).
3. Optional, Sean's call: a possible-bots caution on Portugal (17.0% of Vegans Explore) and Chrome (71.4% of Pre-Vegans). A guess, not checked.
4. Run the three after-batch transcript checks when Sean says a batch landed (131 of 278). The failed Vegans Who Lift row stays until he says delete.

### Lessons
- A Vercel branch preview works headless: open the `_vercel_share` link first, then the session cookie set for the preview host.
- The one-time QA function was minted twice; each time signed out (204), stubbed and its session and key deleted.
- `ve_playbook_index.updated_by` is a uuid, not a name; leave it null.

### Paste prompt for the next chat
Logan here. Open the playbook `podcast-network-transcript-upload` (VE Podcast Network, project `fwbhwfxpncrsfhttimna`, brand `vegans-explore`, repo `lesaruss/vegansexplore-com`, HQ repo `lesaruss/lesaruss-hq`). Read its `briefings` row, its `playbook_records` newest first, `docs/handoff/2026-11-04-podcast-network-transcript-upload.md` (all four parts) and the CLAUDE.md section "Podcast analytics in BrandDesk Insights". State: Insights > Podcast is complete for now and live (all four shows, any period, Overview / Episodes with first 7 and 30 days / Audience with AA shown as Not placed and fixed scrolling boxes for countries, states or cities, apps, systems and devices / Uploads), and the Analysis write-up's Podcast section matches the numbers (HQ main 64e879e). Insights holds every analytic; a later Podcast tab will be for making the podcast and link into Insights. Transcripts 131 of 278, Sean still transcribing. Do first: name the playbook and its next action. Then: run the three after-batch transcript checks whenever I say a batch landed; the one failed Vegans Who Lift transcript row stays until I say delete; wait for Sean on the next community from the places, a saved snapshot, what the 278 finish line counts and a possible-bots caution. To look at a live or preview page, use the standing headless login for `vegan@lesaruss.com` (agent-headless-page-verification; mint into a file, never print the session, sign it out and stub the one-time function after; a Vercel preview needs its share link first). Eastern time only. Wrap up only when I say "wrap up".


## Part 5, Nov 4 (10:30 PM Eastern): a read-only check session, and a second podcast playbook found
Playbook `podcast-network-transcript-upload`: reconcile with `ve-podcast-studio`. No product changes this session; nothing was built, deployed or opened in a browser.

### Found
- A second active playbook exists: **`ve-podcast-studio`** (VE Podcast Studio, owner Sean, status Building, stage "built, awaiting first use", due Nov 6). Goal: make the weekly Vegans Explore Podcast in BrandDesk as a run sheet of segments; Sean's next action is to open **BrandDesk > Vegans Explore > Podcast** and make Episode 145 (airs Nov 8). Its index row was updated 10:19 PM Eastern, after this playbook's last update. It has **no `playbook_records` rows and no `briefings` row** and is not mentioned in the repo or CLAUDE.md, so nothing from it was readable beyond the index row.
- **Possible contradictions to check** (not confirmed):
  1. This playbook says a *later* Podcast tab is for making the podcast and links into Insights. Studio says that Podcast tab is already built. Is it the same tab, and does it link into Insights > Podcast rather than copying numbers?
  2. Two tabs named Podcast under BrandDesk > Vegans Explore (Insights > Podcast for analytics; Studio's Podcast for making). Confirm the names do not collide.
  3. Which playbook owns the weekly episode, the relaunch and the network tag? This playbook's 2026-11-03 rename says it carries transcripts plus the relaunch; Studio's goal is the weekly episode.
  4. Both reach Captivate. Studio should read it through `branddesk-insights` or the same `PODCAST_SHOWS` rows, not a second connection.
  5. Sean's rule "one playbook at a time" (Nov 3) is at stake if both stay active.

### Next actions
1. Compare against the other session (paste prompt below); settle which playbook owns what and record it in both.
2. Sean: next community from the Audience places, a saved snapshot of them, what the 278 finish line counts. A possible-bots caution on Portugal and Chrome is optional and unchecked.
3. After-batch transcript checks when Sean says a batch landed (131 of 278). The failed Vegans Who Lift row stays until he says delete.

### Paste prompt for the other active VE Podcast Network session
Part 5 is on `main` (b2e2b2a). The paste prompt is the one below.

Paste prompt for the next chat: Logan here. Open `podcast-network-transcript-upload` (VE Podcast Network, project `fwbhwfxpncrsfhttimna`, brand `vegans-explore`, repos `lesaruss/vegansexplore-com` and `lesaruss/lesaruss-hq`). Read its briefing, records newest first, this handoff (all five parts) and CLAUDE.md "Podcast analytics in BrandDesk Insights". Then read `ve_playbook_index` and any records or briefing for `ve-podcast-studio` (VE Podcast Studio, owner Sean, due Nov 6; Episode 145 airs Nov 8) and settle the five overlaps in part 5 with evidence: is Studio's Podcast tab the "later" tab and does it link into Insights > Podcast rather than copy numbers; two tabs named Podcast; who owns the weekly episode, relaunch and network tag; does Studio read Captivate through `branddesk-insights` `PODCAST_SHOWS`; the one-playbook rule. Recommend one owner per topic, show Sean, and record the answer in both playbooks only after he agrees. Still open for Sean: next community from the places, a saved snapshot, what the 278 finish line counts, an optional bots caution. Run the three after-batch transcript checks when Sean says a batch landed (131 of 278); the failed Vegans Who Lift row stays until he says delete. Headless login for `vegan@lesaruss.com` per `agent-headless-page-verification`; never print the session; stub the one-time function after. Eastern time only. Wrap up only on "wrap up".
