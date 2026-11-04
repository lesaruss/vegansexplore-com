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
