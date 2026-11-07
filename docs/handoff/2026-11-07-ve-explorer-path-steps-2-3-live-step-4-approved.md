# ve-explorer-path: steps 2 and 3 live, step 4 (the paths page) approved, not built

Session 2026-11-07 (Eastern). Logan. Playbook `ve-explorer-path`.

## Done and live (main cad2dc5)
- Step 2: shared questions. `ve_shared_questions` rows `journey` and `runs` (copied from `x_journey`, `x_run`); `x_journey`, `x_chapter`, `x_run` carry
  `shared_key` journey, chapter, runs. Migration `supabase/migrations/20261106_explorer_v7_step2_shared_tags.sql`.
- Step 3: the Welcome ends in Explorer; finishing admits at once (`ve_surveys.reviewed` false, `20261106_explorer_v7_step3_straight_in.sql`); new optional
  `x_tough` "What is one of the toughest things you are dealing with on your Vegan journey?" 35 points; `x_worth` 75 to 40; total 250; nine questions
  (`20261106_explorer_v7_step3_toughest_question.sql`). `passport.html` join card reads "nine quick questions".
- Proven: in a rolled-back transaction a new member answering the 3 required questions became active and Founding with 3 shared answers; live curl of /passport.

## Step 4: approved by Sean ("approve") 2026-11-07, NOT built
Build it exactly as approved:
- New page `/paths` copied from `guides/index.html` (template gate parent: VECityBanner + VEGuideCatalog cards), rewrite in `vercel.json`, nav.js/footer.js.
- Shows only the path Guides. Order follows the member's `x_run` answer: ticked paths first, tagged "Picked from your answers"; every other path still shown.
- Title "Your paths". Line: "You're an Explorer now. Pick the paths that fit what you do. Take as many as you like. Each one opens its Guide and a badge, with up to 250 more points."
- Cards:
  - Restaurant, Vegan Restaurant Guide (Liz): "You feed the movement. Get your free check, claim your page and get found."
  - Event host, Vegan Events Guide (River): "You bring people together. Plan it, fill it and run it, with us behind you."
  - Creator, Creator Guide (Kai): "You tell the stories. Get seen, get booked and work with Vegan brands."
  - Nonprofit, Nonprofit Guide (Dani): "You stand up for the animals. Get found, get help and share the load."
  - Business, Pre-Vegan Business Guide (Maya): "You're adding plant-based options. Learn what to serve, where to buy it and how to say it." (says "up to 100" points)
  - Group leader, Coming, with Notify me: "You run a group or community. Your path is on its way."
- Buttons: "Start this path"; after that path's intake: "Open your Guide" and "Badge earned".
- `survey.html` `explorerDone(runs)` gets a "See your paths" button to `/paths`.
- Defaults Sean accepted: Business opens the Pre-Vegan Business Guide (unpublished, not in the catalog yet); Group leader Coming + Notify me.
- DB: creator-guide, nonprofit-guide, vegan-events-guide, vegan-restaurant-guide (250 each) and pre-vegan-business-guide (100) are door Guides with active surveys.
- Before it ships: screenshot `/paths` beside `/guides` at 1440 and 390 px; Sean sees them; then merge.
- Open question to handle: the paths page needs a Guide voice script (CLAUDE.md "A Guide speaks on every page"); draft it as text for Sean.

## Then
Steps 5 to 9 from canon `canon-ve-door-guides` v7/v10: path Guides gated with Explorer inline; badges; Build your profile; invitation drafts; policies, facts, saved answers.

## Notes
- Local proof script pattern: Playwright with mocked `ve-mission-survey` and `ve-auth`, python http.server on :8765, use `.html` paths (no Vercel rewrites locally).
- Branch `claude/vigilant-hamilton-ujvpyd` is in sync with main; commits as Sean A. Russell.
