# ve-outreach: Hot Lab recording proven, HQ merged, private recordings live, Hot Lab meetings on profiles built

Date: 2026-11-06 (Friday). Playbook: `ve-outreach` (`ve-outreach-buckets` was merged into it on 2026-11-05). Follows
`2026-11-05-ve-outreach-buckets-checking-in-approved-ig-followers.md` (branch `claude/vigilant-bell-bqu2mn`).

## Done
- **Checking in (`closed-checking-in`) is ready for Monday Nov 9.** Active, approved, one locked email, 30 a day. Sean confirmed The
  Chocolate Chip Bakery and Vlendedful are no longer active; both were already Permanently closed in the Directory (their Open-looking
  copies are hidden merged duplicates), and both were taken out of the campaign (`ve_outreach_campaign_remove`, `removed_at` set, kept).
  **15 businesses** go Monday. The due query pinned to Nov 9 returned them all; warm-up room on mail.lesaruss.ai is 250 a day; the sender
  runs 6 a tick every 10 minutes from 9 AM Eastern, so all 15 should be out by about 9:30.
- **Risk to remember:** the campaign sender (`campaignTick` in `ve-outreach`) is deployed (v27) and equals branch
  `claude/gifted-rubin-ek818o` byte for byte (sha256 7979c590...). **`main` does not have it.** Deploying `ve-outreach` from `main` would
  remove campaign sending. Merge that branch before any `ve-outreach` deploy from `main`.
- **Hot Lab recording proven.** Sean cloud-recorded a one-minute test in the standing Lab Room (meeting 85047017818) at 1:38 AM ET; Zoom
  delivered `recording.completed` to `hq.lesaruss.ai/api/zoom/webhook` at 1:43 AM ET; `lab_recordings` row `679cde1c` and the MP4 (1.7 MB)
  in the private bucket `lab-recordings`. The webhook was always fine; nothing had been cloud-recorded before.
- **Fieldy already reaches the database:** `fieldy_transcripts` (19,066 rows, cron `fieldy-ingest-cron` every 5 minutes). Rows are ~500
  character segments with `date` and per-speaker `transcriptions`, no conversation id or title, so a call matches a profile by its time
  window. Nothing came in Nov 3 and 4.
- **People tour, six lines approved** (Sean: "approve with your fixes"; line 2 lost "Restaurant and No longer open are ready", line 3 ends
  "Orientation is for new members, and it starts once you approve it"). Recorded in V's profile voice (`Nhs7eitvQWFTQBsf0yiT`,
  `eleven_turbo_v2`, stability 0.75) as `geekfon-media/voice_samples/v/branddesk/tour-people-1..6-v2.mp3` (v1 is the old nine-step tour,
  kept), line 4 from "Veegan", each checked word for word with `stt`. `lib/branddeskTours.ts` sets `ver: 2`.
- **HQ merged to `main`** (Sean: "go merge HQ"): `claude/quirky-hawking-7xrux2` as 58da80e, conflicts in `BrandHome.tsx` (kept main's
  Podcast tab and People's roster default) and `deskCss.ts` (kept both). Live on hq.lesaruss.ai.
- **Private Lab Room recordings, live** (Sean: "go on the privacy fix"): every standing Lab Room recording used to be listed for every
  LESARUSS member at `/member/labs`. `lab_recordings.private` and `private_reason` (HQ migration 081, applied); `labRecordings` and
  `labRecordingById` in `lib/memberPortal.ts` skip private ones; the test is private. HQ `main` 3ffa429, production READY.

## Built, not on HQ `main` (waiting for Sean's go)
**Hot Lab meetings on Outreach profiles.** HQ branch `claude/quirky-hawking-7xrux2` commit **459fd30**, preview READY:
`lesaruss-cqvvj6hts-contact-2245s-projects.vercel.app` (share link made 2026-11-06, expires about 1:38 AM ET Nov 7; make a new one with
`get_access_to_vercel_url` if needed). `tsc --noEmit` clean.
- Each profile (BrandDesk > Vegans Explore > Outreach > Roster > a name) has a **Hot Lab meetings** box under Conversation: **Copy the
  invite** (Lab Room link and a line that Sean records calls; Sean sends it himself, nothing is emailed by us) and **Start our meeting**
  (a `waiting` row in `ve_outreach_meetings`, HQ migration 082 applied, and the Lab Room opens).
- `/api/zoom/webhook`: a standing Lab Room recording is claimed by the newest waiting meeting started from 2 hours before to 10 minutes
  after the recording began (`claimForMeeting` in `lib/outreachMeetings.ts`); the `lab_recordings` row turns private and is retitled
  "Meeting with <business>". Then `writeMeeting`: the transcript (Zoom's VTT, else Whisper on the M4A), and a Claude summary with next steps.
  A Zoom retry does not rewrite a finished meeting.
- The box shows each meeting: the private video (one-hour signed link), the summary, next steps, the transcript. A meeting with no recording
  a day later says "No recording arrived"; a waiting one can be cancelled.
- **Not proven end to end:** needs one real Start our meeting plus a short cloud recording. No Zoom transcript arrived on the test (Whisper
  will be used unless "Create audio transcript" is on in Zoom's recording settings).

## Next
1. **Logan, Monday Nov 9 after 9:45 AM ET:** confirm Checking in's sends: `ve_outreach_campaign_members` for `closed-checking-in`
   (send_status, stop_reason), `ve_outreach_events` kind `sent` with `detail->>campaign`, `email_sends` with `campaign_ref` like
   `ve-outreach-%-c%` today (delivered, bounced), and replies (a reply makes the contact Interested). Expected 15 sent.
2. **Sean:** look at the Hot Lab meetings box on the preview, optionally run one real meeting from a profile (30 seconds, Record to the
   Cloud), then say go to merge HQ.
3. **Logan, after go:** merge `claude/quirky-hawking-7xrux2` to HQ `main` (merge `main` in first; the Podcast Studio session pushes often),
   confirm production READY, prove the first real meeting end to end.
4. **Sean:** the Instagram follower export (Accounts Center > Your information and permissions > Download your information > Followers and
   following, All time, JSON), uploaded in Outreach > Roster > Instagram followers.
5. Later: Fieldy calls onto the Conversation box by time window; "Not this meeting" (detach a recording claimed by the wrong meeting).
