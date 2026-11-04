# ve-feedback: header chip, Needs support re-check, sorting-hat triage (2026-11-04)

Playbook: `ve-feedback` (Sean's spot-check list; Watching). Earlier handoff: `2026-11-03-ve-feedback-footer.md`.

## Done this chat
- **ve-feedback: header chip reads Passport pending for an unpaid account.** Live on main 59adf8f (`public/nav.js` `tierBadge`).
- **ve-feedback: header treats an unpaid account as signed out.** Live on main fa38b83 (Sean chose this over wording only). `realLoggedIn` is false for
  `membership_status` `pending_payment`, same as `VEAuth.isLoggedIn`: Log In and Join, no chip. Served live; not checked in a browser with a pending account.

## Open
- **ve-listing-check: Needs support list, in progress.** 4 open, 1 done. Happy Zoe Vegan Bakery and The Vegan Joint (certificate does not work); Macchialina
  and Batter & Crumbs (domain parked or for sale). All unowned, on the Directory, posting on Instagram. The re-check from the database (pg_net 274614 to
  274617) never returned (response rows empty); redo it and read within the hour. Nothing marked Done. Fixing a site is outreach, not done from a session.

## Sorted (ideas Sean dropped)
- **ve-pathways: website-issues outreach lead source (IDEA, parked, Sean said hold).** Failing listings become a lead source in the people queue; a short
  honest email naming what we verified; a guided tour variant on `/business/pitch`; a one-time fix with a refund guarantee. Panel verdict: worth it as a
  trust-builder (volume is small, 4 today). Rules: reach out only when we know we can fix it (site passes the listing check, posts on Instagram, a fix type we
  do, host known); free diagnosis in the email, paid step is doing it; access by invitation only, never a password; only small reversible extras, listed
  afterwards; a parked or for-sale domain gets a different note, never the fix offer. Pricing recommendation: $99 flat including the $11 membership and the
  free listing check, full refund if not fixed and they keep the membership; not $150 ($149 is the secret shopper audit); test with the first ten. Waits
  until Sean locks the people queue.
- **ve-theme-park-guide**: Sean worked it in another chat the same day (concept locked 2026-11-04, canon-ve-theme-park-guide). Not duplicated here.

## Queue now (ve-feedback)
1. `ve-listing-check: work the Needs support list` (Logan; redo the site re-check first)
2. `ve-money-in: move Brooke Sellers' billing to the LESARUSS Stripe account before Nov 30` (Sean)
3. `ve-member-profiles-partner-windows: review how the first windows ran, then decide phase 4` (Sean)
4. `ve-content-index: match each new batch of transcripts` (Logan, recurring)
5. `ve-venue-guides: /bounties as one list, evergreen and paid bounties` (queued, recommend parking)
6. `ve-pathways: website-issues outreach lead source` (idea, parked until the people queue is locked)

## Notes
- No migration. Records in `playbook_records` (slug `ve-feedback`), index row, `brief_checkpoints` and `stream_events` written.
- The sorting-hat way of working: Sean dumps ideas, Logan sorts each into new playbook, another playbook, or a quick fix done and logged here.
