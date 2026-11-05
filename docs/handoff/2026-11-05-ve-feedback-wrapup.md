# ve-feedback: wrap up 2026-11-05

Playbook `ve-feedback`, owner Logan, Watching. Queue page: `hq.lesaruss.ai/branddesk/brands/vegans-explore/playbook/ve-feedback` (not re-opened in a browser this session; its pending list and Decision History were edited in the database and checked there).

## ve-feedback: what changed
- Sean opened the queue to resend updates to Brooke Sellers. It grew into a project, so queue item 2 moved out to its own playbook, `brooke-sellers` (brand `meatless-muscle`). Its record, handoff (`docs/handoff/2026-11-05-brooke-sellers.md`) and paste prompt are there.
- The queue is now 8 pending: 1 header look (Sean), 3 partner window phase 4 (Sean), 4a to 4c Needs support (Logan), 5 transcripts (Logan, recurring, not worked), 6 and 7 parked. Item numbers were not renumbered. 10 done.
- CLAUDE.md gained "Client billing links" (the HQ feature built for Brooke).

## ve-feedback: still open
- Sean, asked once and unanswered: is `qa-tester@lesaruss.com` a real mailbox or an alias (a reset could reach whoever receives it)?
- Item 5 (transcripts): Vegans Explore 126 of 143 timestamped, SoFlo 2 of 59, Vegans Who Lift 0 of 57, Pre-Vegans 3 of 19 as of Nov 4; nothing new matched.
- Left behind on purpose, both under brooke-sellers: the paid Stripe test row `ae323cda-2d1e-4eab-aaa5-91455c018532` and the draft outreach row `4fbbd9f4-9c2b-4b3d-b597-d8de794999cd`.

## Paste prompt for the new chat
```
ve-feedback: open Sean's spot-check queue. Open as Logan ("Logan here").
Read CLAUDE.md "Playbooks: open here first" and docs/handoff/2026-11-05-ve-feedback-wrapup.md (lesaruss/vegansexplore-com, main). Playbook slug ve-feedback, brand vegans-explore, owner Logan, Watching. Time is Eastern (TZ=America/New_York date). Commit author Sean A. Russell <contact@lesaruss.com>; push to main for approved tweaks. Name every handoff line "ve-feedback: <task>". stream_events station 'vegans-explore', status 'completed' | 'in_progress' | 'blocked'.
Read the queue from the database, not memory: project fwbhwfxpncrsfhttimna, table playbook_records (slug 've-feedback', newest first), the briefings row (slug ve-feedback, brand_slug vegans-explore) and the ve_playbook_index row. The visual playbook is at hq.lesaruss.ai/branddesk/brands/vegans-explore/playbook/ve-feedback (sign in with the standing QA account qa-tester@lesaruss.com, password in env QA_TESTER_PASSWORD, error_registry QA-TESTER-STANDING-LOGIN; never print the password; Playwright needs chromium.launch({proxy:{server:process.env.HTTPS_PROXY}}); the Work Queue tabs sit inside a collapsed group). Keep the page's pending and done lists current as items move (edit briefings.content through the playbook skill, never hand HTML), re-run the Decision History rebuild after adding records, and update the index row.
Queue (8 pending, 10 done): 1 Sean: has he looked at the live header signed out and with an unpaid account? 3 Sean: partner window phase 4 (ve-member-profiles-partner-windows), recommended park after Logan reports how the first windows ran. 4a to 4c Logan: Needs support (ve-listing-check): Happy Zoe Vegan Bakery, The Vegan Joint, Jolo's Vegan Kitchen; fixing a site is outreach, offer to draft the note. 5 Logan, recurring: match each new batch of transcripts (ve-content-index); on 2026-11-04 Vegans Explore 126 of 143 timestamped, SoFlo 2 of 59, Vegans Who Lift 0 of 57, Pre-Vegans 3 of 19. 6 parked: /bounties as one list (ve-venue-guides). 7 parked: website-issues outreach lead source (ve-pathways), do not build.
Brooke Sellers is no longer in this queue: it is playbook brooke-sellers with its own chat. Do not touch it, the BrandDesk Blueprint (branddesk-production-wing) or the theme park guide (ve-theme-park-guide).
Sean picks by number or says "pick for me". Default: item 5. Triage anything new he sends: a tweak is done, confirmed live and logged; an item that belongs to an existing build goes to that playbook by slug; anything bigger is a new idea, so recommend (new playbook or park), never build quietly. Open question for Sean, ask once: is qa-tester@lesaruss.com a real mailbox or an alias (a reset could reach whoever receives it)? Do not put a "done" write in the same call as a write that can fail.
```
