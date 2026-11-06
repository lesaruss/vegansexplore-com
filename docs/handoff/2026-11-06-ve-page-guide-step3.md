# ve-page-guide: step 3, Talk to <Guide> for members and visitors (2026-11-06)

Sean: "Go with your defaults, build step 3". Playbook `ve-page-guide`, status Waiting on Sean.

## Live
- `main` faa641a. `ve-auth` v74 from 9362197 (source sha256 acc450e3 matched).
- Migration `20261106_guide_kb_questions_page_url.sql` (applied).
- **Talk to <Guide>** is on every Guide panel for everyone (`#dgRail`, `.vgt-narr`, `.gt-card`). `ve-feedback.js` loads `ve-page-guide.js` on those pages.
- `open()` picks the mode:
  - **Super admin**: the step 2 chat, with changes and Apply.
  - **Member**: saved answers first (free, with related questions). The newest question offers **Ask <Guide> directly · 4 points** or **Ask a person, free**. The Guide gets the page link, its title and a 1,500-character excerpt of the page.
  - **Visitor or unpaid account**: **Suggest a change**, with an optional email. It goes to `ve-feedback` as a suggestion, named "A visitor (via <Guide>)", and comes with a note that membership lets you ask the Guide.
- `guide_kb_questions.page_url` records where each question was asked. The page link drops `?ref=`.

## Proven
- **Where and how:** the Events Guide (River) and The Rabbit Hole's Resources tab (Maya), at 1440 and 390 px.
- **As a member** (Logan test account):
  - a saved answer;
  - a no-match;
  - a 4-point reply that used the page; 1,117 points were left.
- **Signed out:** the suggestion window, with its POST answered locally.
- No script errors and no sideways scroll.
- **Cleaned up:** the test rows are removed, and `ve-once-member-proof` is back to the 410 stub.
- **The fix that mattered:** before it got the page excerpt, River said the Events Guide had no rain plan. Now he answers from the page.

## Not proven
- **Ask a person:** not tested, because it emails the team. Its code is unchanged.
- **A real member on a phone:** not seen yet.

## Next
- **Sean:** try it on `/guides/vegan-events-guide` as a member and signed out, then say what to change.
- **Also waiting on Sean:**
  - the Rabbit Hole apply (Chef Sam);
  - approval of the Restaurant Guide notes and emails;
  - the three shared restaurant inboxes (my recommendation: keep each one's main location).
