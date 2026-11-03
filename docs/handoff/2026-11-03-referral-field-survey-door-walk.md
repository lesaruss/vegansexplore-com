# ve-pricing-points-passport: referral field and the survey door walk (2026-11-03)

Playbook: `ve-pricing-points-passport` (Earn your Passport and points). Session items filed under it, and one lesson under `ve-universal-search`.

## Done this session
- **The survey door, proven live as a real unpaid account** (a [TEST] account, since removed): sign-up, the $11 window offers the survey, door start, answers saved through the page, admit (active, `entry_via` survey, Founding, 250 points, no payment), first dashboard load at 1440 and 390 px with no errors.
- **Dead end fixed**: signed-out `/survey?door=1` now offers "Make my account" (`survey.html`, a7022a6).
- **Did someone send you?** now on the invitation's One step left, the challenges' signed-in banner and the dinner's seat-held panel (`invite.html`, `challenges/index.html`, `dinners/palm-beach.html`). `public/ve-referrer.js` `mount(el, {token})` takes a page's own session (4de4d7a). Each hides itself once the account has paid. Tested against the live `ve-referrer` in both token modes; the test claim and account were removed.
- **WILDA.ECO removed** from the Directory (business is on a break), reversible from Directory review > Removed. Lesson filed under `ve-universal-search`: confirm a business is trading before listing it from research.

## Not verified
- The three mounts inside their real server states (a pending invitation, a started challenge, a held dinner seat). Only the mount function, token modes and page loads were tested.
- Google sign-up and `/login` (the sandbox cannot reach `hq.lesaruss.ai` or Google). Sean should sign up with real Google in a private window.
- The survey page's `onAdmitted` firing from the page (the last answer in the test was made in the database).

## Open on `ve-pricing-points-passport`
1. Sean: do the three doors retire the three challenges? (blocks parts 6 and 7)
2. A duplicate-account filter for referral claims (Sean has several internal accounts that suggest as "Sean R.").
3. Someone making many unpaid accounts to farm the 111-point referral. Default: leave abuse watch log-only until 2026-11-10, then review what it would flag.
4. Abuse watch is log-only; `/policies#community` is live, so opening cases can be turned on after the review.
5. The header chip reads "Member" for an unpaid account (wording only).

## Sean's own checks still waiting (from `ve-dashboard-roadmap` and `ve-universal-search`)
- Click through the live dashboard signed in: Dashboard, My Saves, Depot, a Depot page, the phone menu, the account chip, Apps, Take the tour.
- One action on each of Depot > Feedback, Search questions (Send me a test) and Referral claims.
- Approve Liz's answer-email wording (default: approve, keep emailing askers off).
- Lock "one header" as canon next to `canon-template-gate` (default yes); suggested playbook slug `ve-one-header`.
- Inbox row for answered search questions (default no).
