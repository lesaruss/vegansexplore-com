# ve-outreach-buckets: Checking in approved and tested, Instagram followers from the export, calls by Fieldy, meetings in the Hot Lab

Date: 2026-11-05 (Thursday). Playbook: `ve-outreach-buckets`. Follows `2026-11-05-ve-outreach-buckets-orientation-contact-conversation.md`
(on branch `claude/gifted-rubin-ek818o`). **HQ is still not on `main`. Nothing has been sent to a business yet; Checking in starts Monday Nov 9.**

## Done
- **restaurant campaign set back to draft** (it read active with no approval, no emails, no members; it could not send). Every campaign but
  Checking in is a draft.
- **Checking in reworded** (Sean: more general, shorter, never "since {business} closed"), then **locked and approved by Sean** at 1:38 PM
  Eastern. Subject "Checking in, {first_name}"; body: "It's been a while since we last connected, and I wanted to check in. No ask here, I'm
  just curious how you're doing. / Whenever you have a minute, just reply to this email. I'd love to hear from you. / Sean". Campaign
  `closed-checking-in` is `active`, approved by contact@lesaruss.com's member row, start Mon 2026-11-09, 17 members, 1 email, 30 a day.
  `ve_outreach_campaign_due` returned 0 for it on Nov 5 (start day not reached).
- **[TEST] campaign send proven**: `ve-outreach` `campaign_test` (called from the database with the admin token and `as_member`) for Natuurlik
  Vegan Restaurant to contact@lesaruss.com: result `sent`, `email_sends` status `delivered`, ref `ve-outreach-test-c3d5b8d30-1-...`. The rendered
  email used her first name (Antoinette). Natuurlik itself got nothing.
- **Instagram followers from Instagram's own export** (Sean: "Yes to the follower export, build it"). Never a crawl.
  - DB (migration `supabase/migrations/20261105_ig_follow_export.sql`, applied): `ve_ig_follows` (account, handle, follows_us/since/gone_at,
    we_follow/since/gone_at), `ve_ig_follow_imports` (each upload), `ve_ig_follow_import(account, kind, rows, files, by, by_name)` (one side
    per call; an empty upload refused; anyone missing from a new upload of that side is marked gone, kept; the earliest follow date kept),
    `ve_ig_follow_summary(account)`, index `listings_ig_handle_idx` on `ve_ig_handle(instagram)`. RLS on, no policies. Proven in a rolled-back
    transaction.
  - HQ (branch `claude/quirky-hawking-7xrux2`, commit c422fc6, preview READY, `tsc` clean): Outreach › Roster › **Instagram followers**
    (`IgFollowsBox`, `parseIgExport` in `components/branddesk/OutreachDesk.tsx`): the export steps, pick followers_N.json and following.json,
    read in the browser, Save sends handles and dates only (`ig_import`, route `app/api/branddesk/people/route.ts`; `importIgFollows`,
    `readIgFollowSummary` in `lib/veOutreachRead.ts`); counts and past uploads. Each profile's How to reach them shows **Follows us since**,
    **We follow them since**, or **Stopped following us by** (`IgFollowLine`, `readPerson` returns `ig_follow`). Account `vegansexplore`
    (`IG_ACCOUNT`). The parser was checked on sample files of both export layouts. Not seen signed in; no real export uploaded yet.
- **Calls and meetings (Sean's decision)**: no Twilio. Phone calls are recorded with Fieldy on speakerphone (Fieldy hears only Sean's side
  otherwise; Fieldy's own comparison page lists phone calls as No), opening with a consent line (Florida all-party consent). Video meetings with
  businesses go through the HQ **Hot Lab** (the standing Zoom Lab Room, `lab_rooms` id `standing`, HQ `/hot-lab`). `lab_recordings` holds 0
  rows, so Zoom's recording webhook (`/api/zoom/webhook`) has never delivered.

## Not done
- HQ merge to `main` (Sean's go).
- The six tour lines (text only in `lib/branddeskTours.ts` `people`) waiting for Sean's approval, then recording in V's voice.
- Hot Lab meetings on profiles (proposed, not built): Meet in the Hot Lab invite on each profile; Start our meeting records who and when; the
  Zoom recording that arrives attaches to that business's Conversation box; transcript and summary from it. **First**: Sean runs a one-minute
  recorded test in the Lab Room so we see whether a recording reaches `lab_recordings`.
- Whether Fieldy transcripts already reach our database (could fill the Conversation box on their own).

## Next
1. **Sean**: download Instagram's export (Followers and following, All time, JSON) and upload it in Roster › Instagram followers; approve the
   tour lines; run a one-minute recorded Hot Lab test; go to merge HQ.
2. **Logan**: Monday Nov 9 after 9 AM Eastern, confirm Checking in's first sends went (sent count, bounces). After Sean's Hot Lab test, check
   `lab_recordings`, fix the webhook if empty, then build the Hot Lab steps. Check Fieldy's transcript path.
