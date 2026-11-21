# Handoff: Featured in the Holiday Guide, confirm your feature (2026-11-13, wrapped 2026-11-21)

Playbook `ve-holiday-guide`. Session branch `claude/inspiring-darwin-pxdyya` (merged to main). Wrapped on Sean's cue while he cleared his
queue: "make sure that whatever wasn't captured is captured, as long as it doesn't overwrite any new things."

## What Sean decided (2026-11-13)
- The action is to confirm the feature, not just tell them they are listed: "congratulations, we are featuring you in our holiday guide.
  We're going to be starting promotions on November 20th... If you want to replace the photo, you can. If you want to replace the item
  completely, you can." One item per business. Claiming the listing happens in the same process.
- "Kosher Places" becomes "Kosher Places and Brands" (Noshy is a food brand).
- 11 Days of Giving is the first opportunity once they are in the dashboard. Its details set that day were later replaced by Sean's locks
  on 2026-11-17 and 11-19 (official rules, Dec 1 to Jan 1, brands up to $150, the locked timeline). Those govern; see the playbook.
- He asked for a plain-language Overview on each campaign program in HQ ("imagine a community manager... what is the overview of this
  campaign?"): not built yet (below).

## Built and live
- `/hello/gifts?l=<slug>`: the confirm page for a gift, a holiday menu or Kosher Places and Brands. Step 1 keeps or changes the feature;
  step 2 claims the listing free. In the kit look (`data-look="plain"`, as its parent `hello.html`).
- `ve-holiday` `gift_card` returns `kind`, menus and kosher; `gift_request` takes `kind` and the `fix` change. `ve-claims` `start`
  `pay: 'featured'` claims free with no membership, only for listings in the `gift-guide-2026` program.
- Migration `20261113_holiday_guide_confirm_your_feature.sql`: the three emails, the twelve DMs, their links, the program's steps.
- BOSS and PANEL logged on the playbook; four legal questions added (2026-11-13 rows; the locked rules of 2026-11-19 govern their defaults).

## State on 2026-11-21
- Emails: You Were Picked 8 of 10 sent, Holiday Menus 6 of 7, Kosher Places and Brands 13 of 13. After They Claim: active, nobody in it.
- Claims through the page: Dina's Vegan Deli (11-16) and My Organic Corner (11-17), both approved. That proves the flow live, so the
  [TEST] claim run (blocked by the session's permission check on 11-13) is no longer needed; `scripts/supabase-once/confirm-claim-proof.ts`
  is kept for reference and `ve-once-confirm-proof` is the 410 stub.

## Still open (none of these were picked up elsewhere as of 2026-11-21)
1. The 12 DMs in the program are `to_send` (sent by hand from HQ). The confirm-by date in them (Nov 18) has passed: reword before sending.
2. The HQ Overview on each campaign program (goal, who is in it, the timeline, what Approve does). HQ repo was not attached to this session.
3. The After They Claim email still offers the old December ideas; it should point to 11 Days of Giving as locked.
4. Theo's recorded Kosher line says "places": new words need Sean's approval, then a recording (`-v3`).
