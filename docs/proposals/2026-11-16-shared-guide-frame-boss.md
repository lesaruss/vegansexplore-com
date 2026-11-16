# BOSS ANALYSIS: one shared Guide frame for all 17 Guides

Sean, 2026-11-16: "I just don't want them to be drifting away from each other and some being super outdated", then "yes, build the
shared frame, Holiday Guide first", then "Did we do a panel and a boss on this?" and "yes" (run BOSS, then the panel). Playbook
`ve-holiday-guide`. The Holiday Guide pilot is live (commit a1d65bb). This analysis judges the plan before the other 16 move.

## Step 0: Define the challenge

**Symptom:** the 17 Guides look like one family but behave differently. Measured live on 2026-11-16 at 1440 and 390 px:
- Menus: a tab row on 10, a numbered dropdown on 4 (Welcome, Nutrition, Food Photographer, Taste), a "Start here, 1 of 6" picker on
  Events, step chips on Pre-Vegan Business.
- 10 of 17 scroll inside their own box on desktop (house rule: nothing scrolls inside itself).
- On phones every page title sat at 600 to 707 px, at or below the bottom of the first screen.
- Only the Activism Guide loads `/public/ve-kit.css`.

**Root cause:** every Guide page holds its own 500 to 800 line copy of the frame (header, menu, rail, layout, the one-screen mode), and
the per-Guide script repeats frame behavior (the Holiday script added `dg-fit`). Only the phone card (`ve-guide-corner.js`) and two
small helpers are shared. Our own template gate says "copy that file; change only the content", so each new Guide forks the frame on
purpose. A second layer, `ve-look.css`, restyles the frame on top of every copy, so the look already lives in two places.

**Why it matters:** a change made once reaches one Guide; Sean has to notice the other 16. The same fix gets asked for again
(error registry patterns: UI-BUILT-FROM-BLANK, UI-BUILT-IN-OLD-LOOK).

**Assumptions:** the 17 frames are close enough to share one file (the audit says yes: same header, rail and phone card); each Guide's
content styles can stay its own; pages are static HTML with no build step, so sharing means a linked file, not a compiled component.

## B — Best practice

1. **One source of truth that pages consume, never copy (design systems).** GOV.UK Design System and Brad Frost's Atomic Design
   (ch. 5, "Maintaining design systems") both treat copy-pasted UI as the main cause of drift: shared parts live in one place, pages
   reference them, and a change ships everywhere at once. Why it works: there is only one thing to keep current.
   design-system.service.gov.uk · atomicdesign.bradfrost.com/chapter-5
2. **Migrate piece by piece, old and new side by side (Strangler Fig).** Martin Fowler's pattern: move one part onto the new system,
   prove it, then the next, instead of a big switch. Why it works: each step is small, reversible and checked in production.
   martinfowler.com/bliki/StranglerFigApplication.html
3. **Guard the property with an automated check (fitness functions).** Ford, Parsons and Kua, *Building Evolutionary Architectures*
   (O'Reilly, 2017): an architectural rule ("Guides do not carry their own frame") is protected by a test that runs on every change,
   so it cannot quietly erode. Our `scripts/look-check.js` before every push is already this kind of check.
4. **Screenshot every page before and after (visual regression).** Tools like BackstopJS and Percy compare each page's render with
   its approved version, so a shared change cannot break a page nobody looked at. Why it works: a shared file has wide reach, so the
   proof has to be wide too.
5. **Pilot, then widen in rings (canary release).** Google's *Site Reliability Engineering* (ch. 8, Release Engineering) ships to a
   small slice first and widens only when the slice is healthy. Why it works: problems surface on one page, not 17.

## O — Outcome (how we know it worked)

By the end of the rollout (target Friday, November 20):
| Measure | Today | Target |
|---|---|---|
| Guides carrying their own frame copy | 16 of 17 | 0 |
| Guides that scroll inside their own box on desktop | 9 of 17 (Holiday fixed) | 0 |
| Phone page title on the first screen (390 x 844, above the bottom bar) | 1 of 17 | 17 of 17 |
| Navigation controls above the content | two on most | one menu, plus a section row where a Guide has sections |
| A test change to the frame file reaching every Guide | not possible | one edit, 17 pages, proven by the audit |
| A Guide page that re-adds its own frame | allowed | refused by the pre-push check (tested by trying it) |
| Console errors on the audited views | 0 | 0 |
Failure signal: any Guide that looks broken or loses a feature (a paid gate, the survey door, a video, Talk to the Guide) in its
before/after screenshots stops the batch.

## S — System (methodology)

**PDCA per batch, inside a Strangler Fig rollout, with an audit script as the Check.**
- **Plan:** pick the batch; list each page's frame-specific quirks (header color, gates, a picker like Events' "1 of 6").
- **Do:** link `ve-guide-frame.css`, add `body.ve-gf`, delete the page's frame copy, remove frame behavior from its script (`dg-fit`).
- **Check:** run the audit (saved as `scripts/guide-audit.js`) on every view of the batch at 1440 and 390, and compare screenshots
  with the before set. Look for: inner scroll, menus, phone title line, errors, missing features.
- **Act:** fix in the shared file when a problem is shared; in the page only when it is that Guide's content.

**Batch order (lowest risk and most alike first; the template and the most special last):**
1. Done: Holiday (pilot).
2. Tab-row Guides with the plain frame: Vegan Dairy, Vegan Restaurant, Pre-Vegan Restaurant, Nonprofit, Creator.
3. The venue Guides (one shared look already): Airport, Stadium & Arena, Supermarket, Theme Park.
4. The numbered-dropdown Guides: Nutrition, Food Photographer, Taste.
5. The special ones: Vegan Events ("1 of 6" picker), Pre-Vegan Business (step chips), Vegan Activism (already on the kit).
6. Last: the Welcome Guide in Passport (the template, most traffic, its own green header).

**Two things to settle before batch 2:**
- The frame's look lives in two files (the copy and `ve-look.css`). Move the Guide rules from `ve-look.css` into
  `ve-guide-frame.css`, so specificity fights stop (the pilot needed an id selector to beat `ve-look.css`).
- The phone card is locked canon (`canon-guide-mobile-card`, 2026-11-07). The strip replaces it; update the canon with Sean's yes.

## S — Simplify (make it repeatable)

- **One rule** (CLAUDE.md template gate and Guides): a Guide page is the shared frame plus its own content; the frame changes only in
  `/public/ve-guide-frame.css`. The template gate stops saying "copy the file" for Guides and says "link the frame, copy the content
  shape".
- **One check:** `scripts/look-check.js` refuses a Guide page that defines frame selectors (`.dg-top`, `.dg-app`, `.dg-rail`,
  `.dg-menu`, `html.dg-fit`) or lacks the frame link.
- **One audit:** `scripts/guide-audit.js` prints the table above for every Guide; run it per batch and weekly.
- **One owner of the look:** the frame file; `ve-look.css` keeps only the site-wide Color Block rules.

## Continuous improvement loop

Each batch is one loop: plan, move, audit, act. After batch 2, re-run the panel on one moved Guide beside the mock. If a batch breaks
a feature twice, stop and redefine (maybe that Guide needs a frame variant, set by a body class in the same file, never a copy).

## BOSS conclusion

**Recommendation:** yes, one shared frame file is the right fix, with two additions the pilot skipped: a pre-push check that guards
it (without one, drift comes back) and an audit script that proves every page before and after. Settle the two-file problem
(`ve-look.css`) and the phone card canon first, then roll out in the six batches above. **Confidence: high** that this stops drift
(it removes the copies that cause it, and the check guards it); **medium** on the five-day timeline, because the special Guides
(Events, Pre-Vegan Business, Welcome) may each need a small variant.

## Iteration 2: the panel's corrections (2026-11-16, five lenses on the live pilot and this plan)

All five: **do not move another Guide until the Holiday pilot matches the approved mock.** The plan's measures were all frame measures,
and the pilot passes them while still failing visitors. Changes to this plan:
- **Phase A first (Holiday only):** one way to navigate (the header dropdown names the holiday and page; the section tabs and the
  Back / N of 26 / Next pager are settled for every Guide), a one-line join, land on content (no overview stop; title and main action
  on the first phone screen), one card per business in the shared Directory card (fix the name mismatch), the business doorway and
  Coming rows, Theo's picture once. Then re-panel the Holiday Guide beside the mock.
- **Added measures:** title AND main action above the bottom bar at 390 x 844 (and a shorter phone); one way to navigate; no business
  repeated in a list; no text box scrolling inside itself on phones (the corner script's bubble today); a business can send a menu or an
  event; taps from the Guide home to content.
- **Added checks:** screenshot all 17 Guides on every edit to the frame file; test paid and survey gates signed out, signed in and paid;
  open every live campaign `/go/` link into a Guide before each batch; a one-move rollback per batch (the page's old copy kept in git).
- **The frame file itself:** no `!important`, no id selectors, no Guide-specific classes (`hg-` and the like), no old-look colors; merge
  the Guide rules from `ve-look.css` keeping its section scoping and the `ve-cb` guard (so the Welcome Guide's green and `?look=off` work).
- **Timing:** no rollout during ThanksLiving week (the Holiday Guide's busiest days). Phase B starts after November 26.
- **Order:** open question, the Welcome Guide last (lowest risk) or early (it proves the template variant). Logan's call at Phase B.
