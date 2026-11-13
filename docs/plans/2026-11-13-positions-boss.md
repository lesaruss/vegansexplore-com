# BOSS: Positions (first role: Social Media Manager, Instagram)

Status: draft for the panel, not locked. Sean's decisions so far (2026-11-13): pay $125 every 2 weeks while active (no half up front);
agreed with every recommendation in the talk-through (name "Positions", role "Social Media Manager (Instagram)", Stripe Connect holds the
W-9, contractor wording, Meta partial access, members only, batch results when a round closes, candor note, redirect).

## Step 0: The challenge

Sean wants to fill paid positions from members, quickly and safely, without chasing anyone. First case: KJ (@keyz60), assigned
directly. Later: open rounds people apply to. The system must (1) bring a member in by assignment or by application, (2) walk them
through a checklist (role, agreement, payouts and tax, Instagram access) with status Sean can see, (3) pay them every 2 weeks without
Sean touching it, (4) protect the Instagram account, (5) turn people down with candor and point them elsewhere, (6) take the next
position with no new code.

Root risks: paying someone who stopped working; someone taking over the Instagram account; storing tax IDs ourselves; a flat
recurring payment that reads as a wage; Instagram restricting the account for spammy DMs; building a third system beside the
Gig Board and the invite engine.

## B: Best practice (research 2026-11-13, sources in the research notes below)

1. **Payouts: Stripe Connect Express, recipient (transfers only).** Stripe's onboarding collects the bank, ID and W-9 and checks the
   TIN with the IRS; the SSN never touches our database. We top up the Stripe balance by ACH (4 to 6 business days to clear), and our
   own cron sends a Transfer per person per period with an idempotency key; a unique (person, period) row is the real guard. Stripe 1099
   e-files and delivers the 1099-NEC ($2.99 federal, $1.49 state). Cost about $2 a month per active person plus 0.25% + 25 cents a payout:
   about $3 to $4 a month each. We already run Connect Express in `ve-ambassador` (`payout_start`, `payout_status`).
   Sources: docs.stripe.com/connect/separate-charges-and-transfers, /connect/top-ups, /connect/tax-reporting, stripe.com/connect/pricing.
2. **1099 threshold.** For payments made in 2026 the 1099-NEC threshold is $2,000 (One Big Beautiful Bill Act, sec. 70433). $125 x 26 =
   $3,250 a year, so a full-year person gets a 1099. Source: irs.gov/pub/irs-pdf/i1099mec.pdf.
3. **Contractor, not employee.** IRS: behavioral control, financial control, relationship. Define outcomes, not hours; they use their
   own tools and hours and may work for others; each fee pays for that period's deliverables; renewable term. California's ABC test is
   stricter (lawyer review before a California contractor). Sources: irs.gov contractor page, dol.gov 2026 rulemaking.
4. **E-signature.** ESIGN Act and UETA: show the full text, checkbox plus typed name, record time, IP, browser, the document's version and
   hash, email them a copy. We already do this in `ve-branddesk` checkout and `ve-board-consent`.
5. **Instagram access.** Add the person to the Meta Business Portfolio as a person (never admin) with Partial access: **Messages** and
   **Community activity** only. They log in with their own Meta account; no password shared; removed in one click.
   **Gap:** Business Suite Inbox can reply but most likely cannot START a new DM, and the Messaging API cannot send a first DM (only
   replies within 24 hours, and one Private Reply to someone who commented, within 7 days). Starting DMs to the accounts we follow needs
   the Instagram app. Options in Decision 1.
6. **DM limits.** Meta publishes no numbers and bans spam whether by hand or automated. Practitioner guidance (not Meta's): 20 to 50 new
   DMs a day for an established account, no more than 2 to 3 an hour, each written to the person; stop 24 to 48 hours after any action block.
   Our default: 20 new DMs a day, 3 an hour, rising only after two clean weeks.
7. **Automating Meta access.** The Business Management API can assign tasks on assets, but the Instagram-specific write is unconfirmed and
   needs app review and business verification. For one hire, Sean does it by hand from a checklist the system gives him (about two minutes).
8. **Owner security.** 2FA required for everyone in the portfolio, a second trusted admin, partial access only, remove on the last day,
   weekly login activity check while a contractor works.

## O: Outcome (what success is)

- KJ goes from invite to Active in under 48 hours of her own time, with Sean doing at most three things: assign, approve, add her in
  Meta Business Suite.
- Every 2-week payment goes out on its day with no action from Sean, after a notice he can stop; zero double payments (unique row per
  person per period); zero payments to someone not Active.
- No tax ID, bank number or Instagram password in our database. Instagram access is removed the same day a position ends (system task
  until checked off).
- Every not-selected applicant gets the candor note within 24 hours of Sean closing the round; nothing is sent before.
- The second position (any role) goes live by filling in a form, no code.
- The role's own result is measured: new DMs, replies and site visits from her tracked `/go/` link, per 2-week period, shown at day 25.

## S: System

Scientific method on a small pilot: KJ is the first run (direct path). Hypothesis: a direct-assign intake plus automated pay gets an
active manager in two days and costs Sean under ten minutes. Measure at day 25 (activity, visits, Sean's minutes, any friction), adjust,
then open the first application round.

## The plan (what gets built)

### Reuse, not new engines
| Need | Reuse |
|---|---|
| Invite by link and by email, invite bound to the email, statuses (Sent, Read, Opened, Accepted) | `ve-invites` + `universe_invites` (add `points_to = 'position'`) and `invite.html` |
| Not a member yet | the invite lands on the survey first (membership is the survey), then the intake |
| Search a member and assign | `ve-dashboard` `member_search` |
| Apply during a window | the Gig Board (`/public/ve-gigs.js`, `ve_bounties` with `apply_mode='apply'`, `apply_by`), the position shown as a gig |
| Intake steps with the Guide rail | `claim.html` (`?step=`, `#dgApp`, `#dgRail`, Liz), Color Block |
| Agreement e-sign | the `ve-branddesk` checkout pattern (`agreed_name`, `agreement_version`) plus hash, IP, copy emailed |
| Payout setup (W-9, bank) | `ve-ambassador` `payout_start` / `payout_status`, moved into a shared helper |
| Personal tracked link | Depot > Links (`ve-links`), one per position holder |
| Admin console layout | `admin/depot/ambassadors.html` (list > item > sub-view, `#invites/<status>`, `#new`) |

### New pieces
- `ve_positions`: one row per role (title, slug, summary, the posting, pay 12500 cents every 14 days, trial 30 days, the checklist, the
  agreement version, round window, status Draft / Open for applications / Choosing / Filled / Closed). Linked to a `ve_bounties` row when
  it takes applications so it shows on the Gig Board.
- `ve_position_people`: one row per person per position: path (assigned, applied), stage, shortlist, decision (pending, selected,
  not selected, pointed elsewhere), redirect target, decision held until the round closes, checklist timestamps, Meta email, Stripe
  account id, tracked link, start date, trial review date, end date and reason.
- `ve_position_agreements`: signed name, version, document sha256, IP, browser, time, stored PDF.
- `ve_position_payouts`: one row per person per period, unique (person, period_start): scheduled, notified, held by Sean, sent, failed;
  Stripe transfer id.
- `ve-positions` edge function: admin actions (create, assign, list, shortlist, decide, close round and send results, approve, pause,
  end), intake actions (load, step saves, sign, payout link, done), and the pay cron.
- Crons: daily pay run (notice to Sean 2 days before; transfer on the day if Active, payouts enabled, and the period's check-ins are in);
  low-balance alert 6 business days before a payday the balance cannot cover; day-25 trial review notice.

### Stages Sean sees (colored tags, plain words)
Invited, Opened, Role read, Agreement signed, Payouts ready, Waiting on Instagram access (Sean's step), Active (trial), Trial review,
Active, Paused, Ended. Applicants: Applied, Shortlisted, Not selected (held), Selected, Pointed elsewhere.

### The holder's side
Intake at `/positions/<slug>/start?step=` (copied from `claim.html`): 1 The role, 2 Quick check (three questions on the do's and
don'ts), 3 The agreement, 4 Payouts (Stripe), 5 Instagram (their Meta account email, how access works), 6 Your toolkit (tracked link,
the openers, the daily limits). Done: both get a notice. After that, the role lives in the dashboard (`/dashboard/position`): this period's
check-ins, next payment date, the toolkit.

### Payment rule (per period)
Each 2-week period's $125 pays for that period's work. The holder logs a short daily check-in (new DMs, replies, comments answered; one
tap each). Two days before payday Sean gets: "Paying KJ $125 on Friday. Stop?" If he does nothing and the holder is Active with check-ins
in, the transfer goes. The first payment is at the end of the first 2 weeks.

## S: Simplify (the repeatable standard)

A new position is a form: title, posting, pay and period, trial length, checklist steps (from a library: role, quick check, agreement,
payouts, platform access, toolkit), the agreement text, and whether it is assigned only or takes applications. Everything else (invites,
intake, stages, pay, results, offboarding) is the same engine. The SOP goes into the playbook and canon on lock.

## Decisions for Sean (with Logan's recommendation and default)

1. **Starting new DMs.** Partial access cannot start a DM. Options:
   (a) No password at all: she answers comments and replies, and Sean sends the openers from his phone from her list (puts daily work
   back on Sean);
   (b) She logs into the Instagram app with a password only Sean can change: two-factor on Sean's phone with login approval for each new
   device, recovery email and phone Sean's only, password changed the day she ends, weekly login check;
   (c) Meta's account-sharing feature, if Sean's app offers it (check in Instagram > Accounts Center; unverified).
   **Recommendation: check (c) first (two minutes in Sean's app); if it is not there, (b) with every guard.** Default if Sean does not
   say: (b).
2. **Where the console lives.** Sean said Outreach. HQ Outreach's screens are in the HQ repo; all the data and functions are here.
   **Recommendation:** the console is `/admin/depot/positions` here, and HQ Outreach gets a Positions door that opens it. Default: that.
3. **Daily check-in as the pay condition.** Recommendation: yes (it is what keeps it a contractor fee and tells Sean she is active).

## Research notes
Full reports (Meta access, payouts and tax, code map) were gathered 2026-11-13 by Logan's research agents; key URLs:
facebook.com/business/help/2169003770027706, developers.facebook.com/documentation/business-messaging/instagram-messaging/overview,
help.instagram.com/436248864916865, docs.stripe.com/connect/tax-reporting, docs.stripe.com/connect/top-ups, stripe.com/connect/pricing,
irs.gov/pub/irs-pdf/i1099mec.pdf, irs.gov/businesses/small-businesses-self-employed/independent-contractor-self-employed-or-employee.
