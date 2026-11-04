# ve-feedback: queue wrapped (2026-11-04, second session)

Playbook slug `ve-feedback`, owner Logan, Watching. Time is Eastern.

## Done and checked
- **ve-feedback: visual playbook verified.** Opened as the standing QA account (qa-tester@lesaruss.com, env `QA_TESTER_PASSWORD`, error_registry `QA-TESTER-STANDING-LOGIN`) at hq.lesaruss.ai/branddesk/brands/vegans-explore/playbook/ve-feedback (the playbook is an iframe at /api/studio/playbook/ve-feedback?brand=vegans-explore). Groups open, Pending and Completed tabs switch, 1440 and 390 px, no script errors. The Work Queue tabs sit inside a collapsed group.
- **ve-feedback: Decision History refreshed.** It was baked HTML that stopped at Nov 3; rebuilt from `playbook_records` (newest first). Re-run the same rebuild after adding records (replace the `<details class="history">` block in `briefings.content`).
- **ve-feedback: mini-guides idea moved.** Became the BrandDesk concept, locked by Sean, in playbook `branddesk-production-wing` (canon `canon-branddesk-blueprint-signal`, `docs/handoff/2026-11-04-branddesk-blueprint-lock.md`). This queue becomes the Blueprint's Ideas view when the Blueprint exists; do not move it before then.
- **ve-feedback: network allowlist master list** (26 hosts) given to Sean in chat only.

## Queue now: 9 pending, 10 done
You decide: 1 live header signed out and unpaid; 2 Brooke Sellers' billing to the LESARUSS Stripe account before Nov 30 (recommended: this week, with a short note); 3 partner window phase 4 (recommended: park after Logan reports how the first windows ran). Logan works: 4 Needs support (Happy Zoe, The Vegan Joint, Jolo's; outreach, offer to draft the note); 5 transcripts, recurring (Vegans Explore 126 of 143 timestamped, SoFlo 2 of 59, Vegans Who Lift 0 of 57, Pre-Vegans 3 of 19 on 2026-11-04). Parked: 6 /bounties as one list; 7 website-issues outreach lead source.

## Open
- Is `qa-tester@lesaruss.com` a real mailbox or alias? A password reset could reach whoever receives it. HQ treats any @lesaruss.com sign-in as staff, so it reads BrandDesk pages; owner-only pages stay Sean-only. Sean is fine with it seeing everything while only we hold it.
- Branch `claude/admiring-rubin-bl4qma` (canon, migration, proposal, handoffs) is not merged to main.
- Playwright from the cloud needs `chromium.launch({proxy:{server:process.env.HTTPS_PROXY}})`.

## Paste prompt for the next ve-feedback chat
Printed in the session reply.
