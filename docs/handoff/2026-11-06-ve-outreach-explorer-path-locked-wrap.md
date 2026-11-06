# ve-outreach: Explorer path locked, Checking in and Hot Lab waiting (handoff, 2026-11-06)

Playbook: `ve-outreach`. Logan, build mode. All times Eastern.

## Done this session
- **Explorer path and badges LOCKED** (Sean, "lock it"): canon `canon-ve-door-guides` v7 (`explorer_path_v7`), new canon
  `canon-ve-voice-hero-guide` (they are the hero, we are the guide), migration `20261106_explorer_path_v7_canon.sql`,
  playbook lock record, index row, CLAUDE.md section "The Explorer path and badges". Merged to main (081de7d), Vercel READY.
- Two email drafts written in chat (general invitation, restaurant version). They are not loaded anywhere; Sean approves them first.
- Found: another session made v6 steps 3 to 9 live this morning. Two clashes with v7, logged in playbook record 68786362:
  1. The `explorer` survey has `ve_surveys.reviewed` on (points held, account waits in Depot > Profiles > Waiting for review).
     v7 step 3 turns it off (straight-in admission, the abuse watch is the guard).
  2. The `explorer` questions still carry the old weights. v7 step 1 re-weights them (chapter 15, journey 15, run 20 required;
     brings 30, more 35, hear 15, add 45, worth 75 optional) and adds two `x_run` options
     ("I organize a group or community", "Another kind of business").
  Badges already live in `ve_member_badges`; v7 step 6 adds the Explorer badge there and mirrors badges as `ve_person_tags`.
  Nothing has been changed in the live survey yet.

## Open, in order
1. **Mon Nov 9, on or after 9:45 AM:** confirm Checking in's (`closed-checking-in`) sends; expect 15. Check
   `ve_outreach_campaign_members` (send_status, stop_reason), `ve_outreach_events` kind sent with `detail->>campaign`,
   `email_sends` where `campaign_ref like 've-outreach-%-c%'` (delivered, bounced), and replies. Tell Sean.
2. **On Sean's go:** merge HQ branch `claude/quirky-hawking-7xrux2` (459fd30, Hot Lab meetings on profiles) into HQ main,
   merging main into the branch first; confirm production READY; give Sean the Vercel share link; then prove his first real
   meeting end to end (30 seconds, recorded to the cloud).
3. **Then the Explorer v7 build**, step 1 (re-weight, two new options), honoring record 68786362.

## Rules
- Nothing sends unless a campaign is approved. No merge to main without Sean's go. Give the Vercel share link whenever an HQ build is READY.
- Never deploy `ve-outreach` from main until `claude/gifted-rubin-ek818o` is merged (campaignTick lives only there, deployed v27).

## Sean's open calls
- Go on Hot Lab meetings. Upload the Instagram follower export. Approve the two invitation drafts when the build reaches step 8.
