# ve-feedback: wrap up 2026-11-05 (second session)

Playbook `ve-feedback`, owner Logan, Watching. Queue page: `hq.lesaruss.ai/branddesk/brands/vegans-explore/playbook/ve-feedback` (checked live as the QA account this session: Pending 7, Completed 12).

## ve-feedback: what changed
- **Transcripts left this queue** (Sean: "it's a part of the podcast playbook... I don't think it should be part of the feedback playbook"). Item 5 now lives only in `podcast-network-transcript-upload`, which got a record with the Nov 5 counts (Vegans Explore 126 of 143, SoFlo 2 of 59, Vegans Who Lift 0 of 57 with 1 failed row, Pre-Vegans 3 of 19; nothing new since Nov 3).
- **Money-in alerts are Vegans Explore only.** `ve-stripe-webhook` emailed contact@lesaruss.com for every live payment on every account it listens to (Vegans Explore, LESARUSS, Meatless Muscle), all branded Vegans Explore; two Meatless Muscle payments reached Sean ($75 Nov 2, $300 Nov 5). `moneyAlert` now returns unless the payment is on the Vegans Explore account, and skips a customer tagged `revenue_class: client_services` (Brooke's $200 billing still on our account). LESARUSS account payments no longer alert either. main 0790819, webhook v65 deployed from it through `ve-function-deploy` (source sha256 2bc1a811... matched), boots (400 Missing signature). CLAUDE.md's "Money in" section says it.
- **Brooke's own notifications are unaffected**: our system never emailed her about sales (her Stripe account's own settings do), and her buyers' cookbook receipts run in a separate branch.
- **Queued in `brooke-sellers`**: a branded money-in email for Brooke (record 8ec01412). Open there: her address, renewals or not, whether Sean is copied.

## ve-feedback: still open
- Not proven with a real payment: the next Meatless Muscle payment should send Sean nothing; the next Vegans Explore payment should still send.
- Sean, asked twice, unanswered: is `qa-tester@lesaruss.com` a real mailbox or an alias?
- Queue: 1 header look (Sean), 3 partner window phase 4 (Sean, recommend park), 4a to 4c Needs support owner notes (Logan, default next), 6 and 7 parked.

## Paste prompt for the new chat
```
ve-feedback: open Sean's spot-check queue. Open as Logan ("Logan here").
Read CLAUDE.md "Playbooks: open here first" and docs/handoff/2026-11-05-ve-feedback-wrapup-2.md (lesaruss/vegansexplore-com, main). Playbook slug ve-feedback, brand vegans-explore, owner Logan, Watching. Time is Eastern (TZ=America/New_York date). Commit author Sean A. Russell <contact@lesaruss.com>; push to main for approved tweaks. Name every handoff line "ve-feedback: <task>". stream_events station 'vegans-explore', status 'completed' | 'in_progress' | 'blocked'.
Read the queue from the database, not memory: project fwbhwfxpncrsfhttimna, table playbook_records (slug 've-feedback', newest first; source must be 'text' or 'voice'), the briefings row (slug ve-feedback, brand_slug vegans-explore) and the ve_playbook_index row. The visual playbook is at hq.lesaruss.ai/branddesk/brands/vegans-explore/playbook/ve-feedback (sign in as qa-tester@lesaruss.com, password in env QA_TESTER_PASSWORD, never print it; Playwright needs chromium.launch({proxy:{server:process.env.HTTPS_PROXY}}); fill the login by setting input[name=email] and input[name=password] values in page.evaluate, Playwright's fill timed out). Keep the page's pending and done lists and Decision History current as items move (edit briefings.content through the playbook skill), and update the index row.
Queue (7 pending, 12 done): 1 Sean: has he looked at the live header signed out and with an unpaid account? 3 Sean: partner window phase 4, recommended park. 4a to 4c Logan: Needs support (Happy Zoe Vegan Bakery, The Vegan Joint, Jolo's Vegan Kitchen; certificates rejected); draft the three owner notes for Sean to approve, nothing sent. 6 parked: /bounties as one list. 7 parked: website-issues outreach lead source, do not build. Transcripts are not in this queue (podcast-network-transcript-upload). Brooke Sellers is playbook brooke-sellers (its own chat); do not touch it, the BrandDesk Blueprint or the theme park guide.
Check once: the next Meatless Muscle payment sent Sean no money-in email and the next Vegans Explore payment did (ve_money_alerts; Meatless Muscle rows should stop after 2026-11-05).
Sean picks by number or says "pick for me". Default: 4a to 4c. Triage anything new: a tweak is done, confirmed live and logged; an item that belongs to an existing build goes to that playbook by slug; anything bigger is a new idea, so recommend, never build quietly. Open question for Sean, ask once: is qa-tester@lesaruss.com a real mailbox or an alias? Do not put a "done" write in the same call as a write that can fail.
```
