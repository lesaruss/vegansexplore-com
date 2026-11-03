# ve-feedback: dashboard Insights live check and the mobile footer fix (2026-11-03)

Playbook: `ve-feedback` (Sean's spot-check list; Watching). Canon: `canon-ve-feedback-playbook`. Earlier handoff: `2026-11-03-ve-feedback.md`.

## Done this chat
- **ve-feedback: dashboard Insights live check.** Sean looked at the live dashboard (mobile): Insights is fine. Closed.
- **ve-feedback: mobile dashboard footer overlaps content.** Live on main e7008ae. Cause: `html,body{height:100%}` plus the flex column added for
  footer-at-the-foot (`4b41f84`) let `.console-frame` shrink to the screen height on phones, so content spilled over the footer. Fix in
  `dashboard/center-console.html`: `html{height:100%}`, `body{min-height:100vh;height:auto;display:flex;flex-direction:column}`,
  `body>main,body>.console-frame{flex:1 0 auto}`. Confirmed live at 390 px with 3,000 px of forced content (footer top 3489, content bottom 3429, no
  overlap). Not looked at signed in on a phone by Sean yet.

## Queue now (ve-feedback, from the database)
1. `ve-feedback: the header chip reads Member for an unpaid account` (wording only; Logan; next to take)
2. `ve-money-in: move Brooke Sellers' billing to the LESARUSS Stripe account before Nov 30` (Sean)
3. `ve-member-profiles-partner-windows: review how the first windows ran, then decide phase 4` (Sean)
4. `ve-listing-check: work the Needs support list in Directory review` (Logan, recurring)
5. `ve-content-index: match each new batch of transcripts` (Logan, recurring)
6. `ve-venue-guides: /bounties as one list, evergreen and paid bounties` (queued, not built; bigger than a tweak, recommend parking)

## Notes for the next chat
- No migration this chat. Records written to `playbook_records` (slug `ve-feedback`), index row updated.
- `playbook_records` columns are `slug`, `brand_slug`, `author`, `kind`, `body` (not `playbook_slug`). The tables live in the `lesaruss-directory` project
  (`fwbhwfxpncrsfhttimna`).
- Insights height against For you with real data and the Depot grid after scroll were not raised by Sean; treat as fine unless he says otherwise.
