# ve-events-guide: after the survey door retirement (2026-11-06)

Logan's drafts for Sean. **Items 1 to 3 approved and merged to `main` 2026-11-06 (687b0c2).** River's v2 is recorded; Liz's member line (item 2) stays text until Sean approves a recording.

## 1. River's Events Guide "Get access" line

**Now** (recorded as `river-join-v1.mp3`):
> There are two ways through, and both make you a Vegans Explore member. Take the free event survey, with points for every answer, or get the eleven dollar Passport. What to do when it rains stays open to everyone either way.

This is wrong now. A business Guide opens only with its own intake (membership rule v6), so the $11 does not open it. The page itself already only offers the survey.

**Draft for `river-join-v2.mp3`:**
> This Guide opens when you take the free event survey. It takes about ten minutes, with points for every answer, and if you're not a member yet, finishing it makes you one. What to do when it rains stays open to everyone.

Two lines on the page say the same old thing. They are text only (no recording), so they change with the same commit:
- The Get access tile (Overview groups): "Two ways in: the free event survey, or the $11 Passport." becomes **"Free with the event survey."**
- Under the Overview buttons: "The full Guide is free with the event survey, or $11." becomes **"The full Guide is free with the event survey."**

Once you approve: record `river-join-v2` in River's roster-profile voice (`btaSeNTVh1pGx4pjFzub`), check it word for word with `stt`, point `riverAudio('join')` at `-v2`, and set the tab's `say` to the same words. `-v1` stays in storage.

## 2. The Vegan Restaurant Guide's Get in screen, for members

**The gap:** a signed-in member who has not taken the restaurant survey sees the visitor screen: "your membership opens when you finish", the Founding Member line and "What membership gets you". They are already a member, so it reads wrong. (Someone who finished the survey never sees Get in.)

**Draft, shown only to an active member who has not taken the restaurant survey:**

- Eyebrow: **Get in**
- Heading: **You're a member. One short survey opens this Guide.**
- Line: **This Guide opens with its own survey, about your restaurant. It takes a few minutes and pays points for every answer, and what you tell us is how we know what your business needs. When you finish, every tab is yours to keep.**
- Box: **Free** / *with the restaurant survey* / button **Take the restaurant survey** / small print **Your answers are saved as you go.**
- Under it, **What opens when you finish**: Your audit and the top challenges in order; Claim your page and your dashboard; Try the demo; Sourcing and Buy or make; Pulse; Promotions; My list.
- No Founding Member line (it is set by when they joined), no "What membership gets you" list.

Liz's line for this screen, text until approved and recorded (`join-member-v1`):
> You're already a member, thank you. This Guide opens with its own short survey about your restaurant. Finish it and every tab is yours.

## 3. The Creator Guide's survey wording (branch `claude/optimistic-mendel-box698`)

One commit (7898a4f) over main, five files. What it changes:
- **Get access:** "$11 or 1,100 points" becomes **Free with the creator survey**: about ten minutes, up to 250 points, a membership on finishing, Founding before January 1, 2027.
- **Locked screens:** the $11 buttons become **Take the creator survey, free**.
- **Header box:** $11 becomes **Free / with a short survey**, button **Take survey**.
- **Kai's Get access line:** her recorded "eleven dollars" clip is taken off. The new line is text until you approve it: "The whole Creator Guide is free when you take the short creator survey. It makes you a member, and your answers are how we match you to campaigns."
- **For <first name> pages** (Brooke's): the header box now shows there too, so she opens the rest with the survey like everyone.
- **Catalog card:** the price chip becomes "Free with the survey". **og:description** says "Free with a short survey".
- **survey.html:** the sign-up line names the Guide's subject (your events, your restaurant, you and what you make).

The survey itself (`ve_surveys` `creator-guide`, 16 questions, 250 points) is already live in the database. Only the page wording waits.

**Before merging, three fixes (Logan's recommendation):**
1. **Merge conflict in `survey.html`.** It is one line: main changed the same sign-up sentence. Keep the branch's version, which covers all three Guides.
2. **A comment says "or the $11 Passport".** That contradicts v6, since a business Guide opens only by its intake. Change the comment; nothing a visitor sees.
3. **"It makes you a member" shows to people who already are.** It is the same gap as item 2. Show it only to someone signed out or waiting on their Passport.

Say "merge the Creator Guide" and I make those three fixes on the branch, then merge it with you as the author.

## 4. Proof: a signed-in Guide survey and a live Explorer approval (done 2026-11-06)

This ran through the one-time function `ve-once-survey-proof` (now the 410 stub; script `scripts/supabase-once/survey-proof.ts`, key removed). It used two [TEST] accounts, `member_class` member, each waiting on its Passport, each with its own signed session. The calls went through the live `ve-mission-survey` and `ve-guide-unlock` as the browser makes them.

**Event survey (signed in):**

| Check | Result |
|---|---|
| Guide before the survey | Locked, `pending_payment` |
| A bad answer | Refused, `bad_value` |
| Eleven required answers | Each paid at once |
| The last answer | Admitted the account |
| Guide after | Unlocked, `via` door |
| `open` | Returned the members' content (19,761 characters) |
| Account | Active, `entry_via` survey, Founding Member, 215 points |

**Explorer survey:**

| Check | Result |
|---|---|
| Six answers, signed in | Saved, points held (`paid_now` false) |
| The last required answer (`x_run`) | Went straight to `ve_survey_answer` in the database, to skip the team's "waiting for review" email. The edge function sends that email to contact@lesaruss.com on the finishing answer. |
| After the last answer | `survey_review` pending, `survey_submitted_at` set, still `pending_payment` |
| `review_list` as Sean | The account was in the queue |
| `review_list` as the test account | 403 |
| `review_decide` approve, as the test account | 403 |
| `review_decide` approve, as Sean | 200: 205 points paid, Founding Member, active, `entry_via` survey. No email, since the name has [TEST]. |
| A second approve | 400 `not_waiting` |

**Cleanup:** both accounts and their answers, completions, ledger rows, points, brand memberships and shared answers were deleted. A check afterwards found none left and no survey emails sent.

**Not proven:**
- The team's "waiting for review" email on a real finish.
- The approval email to a real (non-[TEST]) member.
- Either flow clicked in a browser.

**Noticed:** Explorer's points are already re-weighted to the v7 numbers, but it still waits for a person. Under v7 it admits at once; that is part of build order step 3.
