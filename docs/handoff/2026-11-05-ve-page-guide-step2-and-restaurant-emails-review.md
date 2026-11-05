# ve-page-guide: Talk to the page's Guide (step 2) / ve-restaurant-guide: emails rendered for approval (2026-11-05)

Branch `claude/gifted-sagan-7jsjrl` (d89d768, e79f020). **Not on `main`.** The server side is live; the page side goes live when Sean says "merge it".

## ve-page-guide: step 2 built
- **Talk to <Guide>**: for a super admin signed in as themselves, `public/ve-feedback.js` loads `public/ve-page-guide.js` about 1.2 s after load.
  It adds a **Talk to <Guide>** button to:
  - the Guide rail (`#dgRail` `data-guide`)
  - the Partner Dashboard tour narrator (`.vgt-narr`)
  - each Resources card (`.gt-card`)
  A MutationObserver catches tabs that draw later. The Feedback button opens the rail's Guide, else the Resources Guide, else Liz.
- **Server** (`ve-page-guide`, live, deployed from d89d768, source sha256 64f851e5 matched):
  - `guide` names the persona: liz, maya, river, nori, dani, theo, kai or pascal (`GUIDES` in the function).
  - The new target `logan` files a **Note for Logan**: a `ve_feedback` row, kind suggestion, named "Sean (via River)", that Logan works from Depot > Feedback.
  - On a page that is not a listing, listing edits are refused (`not_a_listing`). Every log row records the Guide in `result.guide`.
- **Proven live** as Sean through `ve-once-page-guide-step2` (now the 410 stub):
  - No token was refused (401).
  - River turned a request on the Events Guide into a Note for Logan, and it saved.
  - A phone edit on the Guide page was refused.
  - Maya answered as herself on The Rabbit Hole.
  - The test feedback row was removed.
- Checked at 1440 and 390 px against a mocked answer, with no script errors. Not yet clicked by a real signed-in super admin.
- **Rabbit Hole**: Sean's real apply (Chef Sam, chefsam@therabbithole.life) has not been done; the log holds only Logan's proof turns. The tables
  the apply writes to were checked, so it should save cleanly.
- **Test row** "[TEST] Logan checking the suggestion kind" deleted through `ve-once-feedback-test` (now the 410 stub; the connector held the delete).
- **Next**: Sean merges; then members (saved answers first, then the AI Guide at 4 points), then visitors (suggestions only).

## ve-restaurant-guide: the five emails, for approval
- **The review page**: https://claude.ai/artifact/819FYdMdKGMUjKSF6UNfeC, rendered from the live drafts (`ve_outreach_render`, `rgEmail` in `ve-nurture`). It shows:
  - Day 0, Day 4 and Day 10 from Sean; Sobe Vegan as the example with a first name, and Blue Tree as the "Hi there," case.
  - The two after-membership notes, signed by the team; the Founding line drops after Jan 1.
- **Not approved yet.** Nothing has been sent and no city is on.
- **Contact problems to fix before sending**:
  - Next Level Veggie Grill (two listings) and Veggie Grill all go to chitchat@nextlevelvg.com. Keep one, take the other two out.
  - H.O.P.E. is on accessibility@dylish.com, a vendor's mailbox. Pull it.
  - The Rabbit Hole is fixed by Sean's apply.
- Sean started a tab-by-tab review of the live Guide (https://vegansexplore.com/guides/vegan-restaurant-guide). It is not done; his notes go to `ve-restaurant-guide`.

## Recommended next outreach build (ve-outreach; ve-outreach-buckets is merged into it)
1. A campaign holds who it reaches (door, kind of listing, cities as an optional filter), its locked emails, Sean's approval, a start day,
   a daily pace and its own pause. Each person is in one active campaign at a time. The city switches retire.
2. One email address is one contact across every campaign (fixes the Veggie Grill case).
3. The sender reads campaigns, not city lists. Sending hours (weekdays 9 to 5) and the warm-up limit stay; the 30 a day are spread across chapters.
4. A test run first: HQ > Campaigns shows "who goes out tomorrow", and only then is Approve wired to sending.

The 36 ready restaurants become "Restaurant Guide, round 1". Nothing sends until Sean approves it and switches it on.
