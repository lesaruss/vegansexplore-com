# ve-outreach-buckets: Orientation opens, Campaigns tiles, contact and Conversation on profiles, the tour rewritten

Date: 2026-11-05 (Thursday). Playbook: `ve-outreach-buckets`. Follows `2026-11-05-ve-outreach-buckets-sending-per-campaign-built.md`.
**Nothing has been sent to a business. Checking in is still a draft. HQ is not on `main`.**

## State checked at the start (8:00 AM Eastern)
- `closed-checking-in`: status draft, its one email not locked, not approved, 17 members, none touched. So the [TEST] campaign send was
  **not** run (Sean's order: after he approves Checking in).
- The `restaurant` campaign row reads status `active` with no `approved_at`, no emails and no members (left over from when HQ's Approve was
  broken). It cannot send. Logan's default: set it back to draft unless Sean says otherwise. **Not done yet.**
- Only outreach email in 3 days: yesterday's test to contact@lesaruss.com.

## Built (HQ `lesaruss/lesaruss-hq` branch `claude/quirky-hawking-7xrux2`, commit 761f862, preview READY; `tsc` clean)
Sean's notes on the preview: click through Always on Orientation and see its emails and assets with an Always on pill; the tour is old;
show contact information on profiles; a tile to track the conversation (DMs, calls).
- **Orientation opens** (`OrientationPage` in `components/branddesk/OutreachDesk.tsx`, `?o=1`): Always on and Draft, not sending pills,
  the four notes (the words from `docs/proposals/orientation-drip-draft.md`, each in a window), and the pages they open (Directory, dashboard,
  a city hub, events, Guides, the Welcome as their share link, the Pulse), each with See it. Nothing is built to send them.
- **Four tiles at the top of Campaigns**: On the Roster (approved listings), Emails sent, Opened, Clicked (real outreach `email_sends`, tests
  left out; `readDoorCampaigns` returns `totals`).
- **How to reach them** on every profile (`ContactBox`): email and where found, phone with Call (`tel:`) and Text (`sms:`), Instagram with
  Profile and Message (`ig.me/m/`), Facebook, TikTok, website; what is not on file listed.
- **Conversation** on every profile (`ConversationBox`): one timeline, theirs left, ours right: campaign emails with opened or clicked,
  Depot > Outreach one-to-one messages matched by email or `ig:<handle>`, and anything logged by hand. **Log a conversation**: how (Instagram,
  text, call, email reply, in person, Facebook, other), They said / We said, when, the words (typed or Speak). Remove marks it removed, kept.
  Table `ve_conversation_log` (migration `supabase/migrations/20261105_outreach_conversation_log.sql`, applied through the connector; RLS on, no
  policies); `lib/veOutreachRead.ts` `logConversation`, `removeConversation`; route actions `convo_log`, `convo_remove`. Table rules proven in a
  rolled-back transaction (a bad channel, an empty body and a row with no listing or person refused).
- **The tour** (`lib/branddeskTours.ts` `people`): rewritten for Campaigns, the Roster and a profile (6 steps), **text only, no `ver`, so nothing
  plays** until Sean approves the lines and they are recorded in V's voice (then `ver: 2`). The Take the tour button now shows on Roster and
  Campaigns.

## Not done / not proven
- Not seen signed in on the preview. Not on HQ `main` (Sean's go).
- **Instagram followers**: Instagram shows follower lists only to a logged-in account, so an Apify follower crawl would need @vegansexplore's
  login, which breaks our rules (never automate the account, never scrape logged-in). Logan's recommendation, Sean's default unless he says no:
  Sean downloads Instagram's own export (Accounts Center > Download your information > Followers and following, JSON), uploads it in People,
  Logan matches handles (999 of 2,375 live listings have one) and each profile shows Follows us / We follow them with the date; refreshed
  monthly. **Not built.**
- **Instagram DMs captured on their own**: needs the Meta messaging API (tokens pending, app review). Until then, paste into Log a conversation.
- **Calls recorded and transcribed**: a web page cannot record a phone call. Needs a call bridge (Twilio, about a dollar or two a month plus
  cents a minute, estimates) and Florida all-party consent (the call opens with "this call is recorded"). Waiting on Sean's go; meanwhile Call,
  then Speak a summary.
- The [TEST] campaign send (after Checking in is approved).

## Next
1. **Sean**: read and lock Checking in, approve it (starts Mon Nov 9); read the six tour lines; say yes or no to the export-based follower match
   and the Twilio call bridge; go to merge HQ.
2. **Logan**: set `restaurant` back to draft (unless told no); build the follower-export upload and match; after approval, prove a [TEST]
   campaign send to a lesaruss.com address; record the tour lines once approved; merge HQ on Sean's go and give the share link.
