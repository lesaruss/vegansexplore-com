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

## Panel (2026-11-13): back end, payments and security, front end, design

Changes adopted (they override the sections above where they differ):
1. **Applications live in the position tables, not `ve_bounty_submissions`.** `ve-bounties` `applicant_decide` emails each decision at
   once, and its hourly cron marks booked work `no_show` and writes `ve_bounty_strikes`: a hire would get a strike. The Gig Board shows a
   Positions card fed by `ve-positions` `open_list`; applying happens at `/positions/<slug>`.
2. **Schema** (RLS on, no policies, service role only): `ve_positions`, `ve_position_people` (decision held while `decision_notified_at` is
   null), `ve_position_agreements` (text snapshot, sha256, name, IP, browser; copy emailed; no PDF in phase 1), `ve_position_checkins`
   (unique person, day), `ve_position_payouts` (unique person, period_start; unique idempotency key and transfer id; statuses scheduled,
   held, sending, sent, failed, skipped), `ve_position_events` (append-only audit; update and delete revoked).
3. **Stages:** invited, role_read, agreed, payouts_ready, awaiting_access, trial, active, paused, ended; applicants applied, shortlisted,
   then the held decision. "Opened" is read from `universe_invites`. One `advance(id, from[], to)` with a conditional update; 409 on no-op.
4. **One Stripe account per member** (`ve_member_payout_accounts`, filled from `ve_ambassador_door`): one 1099, one monthly fee. Fix
   `ve-ambassador` account creation: `business_type=individual`, an `Idempotency-Key` per member (a double tap makes two accounts today);
   "ready" means `capabilities.transfers = active` and no `requirements.disabled_reason`. **The W-9 is collected only when 1099 tax
   reporting is on in the Stripe dashboard (Connect > Tax forms): switch it on in live mode before KJ starts.**
5. **Pay run:** claim the row atomically (`status='notified' -> 'sending'`), live checks at send time (stage, check-ins, Stripe account,
   balance, kill switch), key `vepos-<payout_id>-a<attempt>` with `transfer_group`; insufficient balance is not retried by Stripe, so mark
   `failed`, alert, and list transfers by group before any retry. If the notice email fails, the payment waits.
6. **Webhooks:** connected-account events need a separate Stripe endpoint and secret; a new small `ve-stripe-connect` function, not the
   1,700-line `ve-stripe-webhook`.
7. **Stop link:** signed, one-time, expiring; opening it only shows a page; the hold happens on the button. Releasing a hold needs sign-in.
8. **ve-invites:** `points_to='position'`, `universe_invites.position_id`, exempt from the "already a member" skip, `accept` returns
   `/positions/<slug>/start`; the survey gets a same-origin `next=` hand-back. Recreate the points_to check from the live definition (the
   repo copy has drifted).
9. **Front end:** console `admin/depot/positions.html` (router and gate copied from `ambassadors.html`, the look and `.ptabs`, `.r`, `.tag`
   from `business-dashboard.html`; no self-scrolling lists; Positions in a live Depot tab group, not "Moving to BrandDesk"); five parts:
   Posting, People, Applicants, Pay, Settings; a person is its own view. Intake copied from `claim.html`. Shared `/public/ve-positions.js`
   (stage map, tag, checklist, pay line). Routes: `#list`, `#p/<slug>/<part>`, `#p/<slug>/invite`, `#person/<id>`, `#payout/<id>`;
   `/positions/<slug>/start?step=role|check|agreement|payouts|instagram|toolkit|done`; `/dashboard/position?p=&tab=`.
10. **Design:** section color Communities mid green; status colors: mint moving, peach waiting on Sean, bright green active, pink
   shortlisted, grey ended. The Guide is Sean's pick (front end flagged Kai, the Creator Guide, who runs the Gig Board).
11. **Phasing:** phase 1 for KJ (Stripe fixes, pay engine, checklist, console assign and person views); phase 2 rounds, the Gig Board card,
   the result emails, the position builder.
12. **Instagram (security engineer):** a shared login breaks Instagram's terms and gives full control; test first whether Business Suite
   can start a DM (Sean's second account with partial access), then Instagram's account sharing; only then the guarded login (authenticator
   2FA on Sean's phone, Sean's email and phone, she declines Accounts Center, weekly checks, same-day offboarding).

Mock: `/mocks/positions/` (copied from `/mocks/claims/`).

## Follow-up BOSS (2026-11-13): starting DMs without handing over the account

Sean asked whether we had checked industry best practice for a manager who starts conversations, and whether there is app access that
cannot lock him out. Findings (Meta sources read through search extracts; confirm in the app):
- **Instagram Shared Access** (rolled out about July 2025): the owner invites up to 3 people in the Instagram app, no password. They work in
  the real app; the inbox only if the owner allows it; they cannot change the password, username or profile, deactivate, or invite others;
  the owner sees an activity log and revokes any time. Unknowns: eligibility (may need Meta Verified), whether posting can be switched off,
  and starting new threads (very likely, since it is the native app). Sources: meta.com/help/subscriptions/1092771219974826/,
  help.instagram.com/iphone-app/5861247717337470.
- Business Portfolio task access and every third-party tool (Metricool, Sprout, Agorapulse, Hootsuite, Later, ManyChat) cannot start a new
  DM (Meta's API rule; Agorapulse and Sprout say so in their docs).
- Password managers' "hidden password" sharing is not a real barrier (1Password and Bitwarden say so). Instagram's terms bar sharing a login.
- With a shared login, a full lockout is unlikely under authenticator 2FA and owner-only email and phone (password change needs the current
  password; email change sends an undo link to the old address), but the realistic worst case is posts, deletions or bad DMs before removal.

**Revised order:** 1. Shared Access with the inbox allowed (Sean checks his app; pay for Meta Verified if that is what unlocks it). 2. If it is
not available: a company phone that stays logged in to the account, the device approved once by Sean, the contractor never sees the password.
3. Either way, Business Suite (or Metricool, if it passes the inbox-only test) for replies and comments, traced to her. Never the raw password.

## Sean's call (2026-11-13): Instagram Shared Access

Sean: "I think that's the perfect solution... it's good that we wouldn't want to have any more than three at a time anyhow... we have access
now, and I have all of my accounts are verified." Decision 1 is Shared Access with the inbox allowed (Meta Verified is on). The intake's
Instagram step changes: Sean invites her in the Instagram app (Shared Access), allows the inbox; Business Suite task access stays only for
comments and replies being traced, optional. First proof with KJ: she starts one new DM to a followed account; Sean checks the activity log
and whether posting can be switched off. Defaults standing unless Sean changes them: Guide Kai; no second admin until Sean names one.

## Sean's calls (2026-11-13): her queue, and outreach resumes

- **Outreach unpaused**: "You can unpause outreach... we can still do checks and make sure everything looks good. And fix things on the fly."
  Migration `20261113_resume_campaigns_after_brand_lock.sql` (the 12 campaigns the 2026-11-11 pause stopped).
- **No end-of-month deadline**: "don't worry about the end of the month thing... let's be aggressive... reaching out in many different places."
  Sean reached out to El Napolito himself; they are interested and have the link.
- **Her dashboard is her queue** ("use this dashboard to see the next person you need to reach out to. It's that simple"): one card at a
  time (who, why, Sean's note, the opener, suggested replies; Sent, They replied, Can't reach them, Ask a question). Sources: Directory
  listings with no email or no reply after **5 days** (Sean: "Yeah, automatic joins her queue"), people who mention our content with no
  email, hot leads Sean pins to number one, one-off Instagram jobs, and "check whether these creators follow us" tasks (the API gives a
  follower count, not the list). Each person gets their own tracked link; the card closes itself when they register.
- **Check-in is automatic**: completed queue tasks are the proof of work and appear in the payday notice (Sean: "Daily tally, boom, boom").
- **Logan answers her questions**, looping Sean in for decisions.
- **Contractor-safe wording kept** (Sean: "make sure all that's good"): the queue is the scope of work; she picks her hours and her words.

## Her queue: what the code already gives us (code map, 2026-11-13; counts from docs, not live)

- **Instagram is the main channel, not the follow-up.** Docs from 2026-11-04 record 2,384 approved listings and only 79 to 219 contacts with
  an email; the 2026-11-08 scan found 885 Instagram handles on approved listings, plus about 2,386 handle-only rows in `ve_businesses`.
  Live counts when the connector is back.
- **Parent for the queue: `ve_campaign_dms`** (migration `20261110_gift_guide_program_dms.sql`), already an Instagram DM list (handle,
  opener, follow_up, nudge; to_send, sent, replied, done) shown in HQ `OutreachDesk.tsx`. Her queue extends it with an owner (the position
  holder), a priority and Sean's note, rather than a new table. (`admin/depot/social.html`, named as the queue parent in CLAUDE.md, is now a
  redirect stub.)
- **Sources:** `listings.ig_handle || instagram`; no reply in 5 days from `ve_outreach_roster()` (cold, `last_sent_at`), with
  `owner_member_id is null`; no email = `listings.email` and `ve_outreach_contacts.email` both null; mentions from `ve_content_mentions`
  joined to listings; hot leads added by Logan.
- **Personal links:** `ve_links` rows inserted per card (the `hg-<slug>` pattern, tag `instagram-dm`, channel dm); the card closes on a claim
  (`listings.owner_member_id`, `ve_listing_claims`) or a member credited through `ve-links` `claim`.
- **Her questions:** a thread per card on the `ve_bounty_messages` pattern (thread key, member, body, staff).
- Mock slide: "Her queue" in `/mocks/positions/`; the manual tally is gone (finished cards are her check-in).
