# ve-outreach-buckets: sending governed per campaign, the No longer open group, Checking in (built, engine not yet deployed)

Date: 2026-11-05 (Thursday). Playbook: `ve-outreach-buckets` (and `ve-restaurant-guide` for the two notes). Follows
`2026-11-05-ve-outreach-buckets-cold-warm-hot-closed-group.md`. Sean: "go, use the Checking in email as drafted".
**No email has gone to a business. Nothing is approved. Nothing is on HQ `main`.**

## Done
- **Database, live** (migration `supabase/migrations/20261105_outreach_campaign_sending.sql`, applied through the one-time
  `ve-once-campaign-sending`, now the 410 stub; the connector held the write):
  - `ve_outreach_campaigns`: `audience` (door | closed), `email_count` (1 to 3), `daily_pace` (default 30), `paused_at`, `paused_by`.
  - `ve_outreach_campaign_emails.day_offset` (0, 4, 10 filled); `ve_outreach_campaign_members`: `step`, `send_status`
    (waiting | in_sequence | finished | stopped), `next_send_at`, `last_sent_at`, `stop_reason`.
  - `ve_outreach_campaign_due()`: what may go now: approved, status active, not paused, start day reached (Eastern), the email for the
    next step locked, an email, not suppressed, contact not opted out, bounced, joined, interested or not interested, the cities filter
    when set, and the audience (a door campaign: open, unowned listings, no closed flag; closed: Permanently or Temporarily closed).
  - `ve_outreach_campaign_render(member, step)`: the campaign's own words filled in (no first name: "Checking in, {first_name}" reads
    "Checking in"; body "there").
  - **`ve_outreach_due()` now serves people lists only** (`oc.kind = 'people'`): city lists and send days no longer email businesses.
  - `ve_outreach_roster(..., p_group 'open' | 'closed')`: closed listings leave the door tabs (2,294 open, 81 closed on 2026-11-05);
    opens also read campaign refs. `ve_outreach_campaign_add` refuses a closed listing in a door campaign and the reverse.
  - Tag `new-venture`. Campaign **`closed-checking-in`** ("Checking in", audience closed, 1 email, start Mon 2026-11-09, 30 a day,
    **draft, email not locked, not approved**), the email exactly as Sean drafted it, and the **17** closed listings with an email in it.
  - Found: `ve_outreach_campaigns.status` only allows draft | active | finished, but HQ's Approve wrote `approved`, so approving had always
    failed. Approve now sets `active`.
- **Engine** (`supabase/functions/ve-outreach/index.ts`, commit 5458925 on `claude/gifted-rubin-ek818o`): `campaignTick` runs first in
  every tick and gets the room; the old path gets what is left. Rules kept for every send: weekdays 9 to 5 Eastern, the warm-up
  allowance, email-send's do-not-email list, and **one outreach email per address per day** (any `ve-outreach-%` send to that address
  since Eastern midnight; a second waits). Pace counts the campaign's sends today. Send ref `ve-outreach-<contact>-c<member8>-<step>`, so a
  person can be in several campaigns. A listing with no outreach contact gets one at its first email. Actions `campaign_preview` and
  `campaign_test` (HQ as the super admin; a test only to a lesaruss address).
- **HQ** (`lesaruss/lesaruss-hq` branch `claude/quirky-hawking-7xrux2`, b4551a1, preview READY): Roster has **No longer open** after the
  doors (count, business status on each row); a closed listing's page has **No longer open: what did they say?** (They reopened: back to
  OPERATIONAL and its door, a `ve_listing_edits` row, a contact held only for closing is released; A new venture: tag `new-venture` with a
  note, needs the words; No news: a note; all three leave a listing note and a person note; nothing deleted). Campaigns has a **No longer
  open** tile; a campaign page shows its state (Draft, Approved waiting for its start day, Sending, Paused, Everyone has had their emails),
  **Daily pace**, **Pause sending / Resume sending**, each person's progress, and **Read** (their emails exactly as they go, Send me a
  test). New campaign: cities are an optional filter; a No longer open campaign starts from the Checking in email. The old Cities, Send
  days and People lists views say they no longer email businesses. V's text-only lines (`people`, `people-roster`, `people-board`)
  reworded; no recordings changed. `tsc` clean.
- **Restaurant Guide notes** (`ve-nurture`, commit f0347bd): "You're in" (next weekday morning after the survey) and Day 7, words as
  drafted, from the team, Founding line only before 2027-01-01. Their own approval and switch (`nurture.rest_approved_hash`, `rest_on`),
  so the Events Guide notes' approval is untouched. Depot > Challenges > Taster emails shows the card to read, approve and switch on.
  Also fixed: an unescaped apostrophe that stopped that Depot page's script from running at all.
- **Orientation** is a text draft: `docs/proposals/orientation-drip-draft.md` (one for everyone with a door line, four notes a week apart).

## Not done / not proven
- **`ve-outreach` and `ve-nurture` are not deployed.** Deploying from the commit (`ve-function-deploy`) was refused by this session's
  permission check. Until they are deployed: campaigns cannot send even if approved (safe: the database already stopped the old path),
  Read and Send me a test on a campaign answer unknown action, and the restaurant notes do not exist. Deploy both from their commits
  (5458925 for ve-outreach, f0347bd for ve-nurture) and compare the source sha256.
- HQ preview not seen signed in; checked only by `tsc`. The sender has never sent a real campaign email.
- Evergreen tour recordings (`-v2`): text lines updated only, nothing recorded.

## Next
1. **Sean**: allow the two deploys (or deploy them), open the preview, read Checking in as each of the 17 gets it, lock it and approve if
   right (it would start Monday Nov 9, 30 a day, weekdays 9 to 5 Eastern); read and approve the restaurant notes in Depot > Challenges.
2. **Logan**: after the deploys, prove a campaign send with a [TEST] campaign to a lesaruss address, then merge HQ to main on Sean's go.
