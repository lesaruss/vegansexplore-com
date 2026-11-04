# ve-door-guides: Restaurant Guide V1, the personal link and the enrollment copy (2026-11-04, Logan)

Read CLAUDE.md "Door Guides" (the 2026-11-04 bullet at its end), `docs/proposals/door-guides-enrollment-copy.md` (the locked copy) and canon `canon-ve-door-guides` v4 first.
Playbook `ve-door-guides` (index row: Building, owner Logan). Branch `claude/dazzling-archimedes-3rxgti` at 626757163 (main was at 48580a3 when this chat began; the branch is **not merged to main**).

## Done
- **Copy locked by Sean** ("locked"): restaurant emails (Day 0, 4, 10), a short Instagram message, the Guide tab by tab, Our story, the two doors, the 17-question survey, what membership gets you. Source of truth: `docs/proposals/door-guides-enrollment-copy.md`. Canon v4 (`enrollment_copy_v4`) and a playbook decision record hold the summary.
- **Personal link, live**: `ve-restaurant-audit` `personal {code}` (public: a `bo-xxxxxxx` outreach link code to the listing; returns name, street, city and the check from the last 7 days, never an email; bad code 404). `ve-outreach` sends a food place's tracked link to `/guides/vegan-restaurant-guide?b=<code>` (brands and non-food keep their Directory page; a test links straight to the Guide so a test click never counts). Both deployed from f41242c with matching source sha256 (b66c88f5..., 5d362b47...). Proven live on Aisha's Plant-Based Eatery: right business, bad codes refused.
- **The Guide** (`guide-scripts/vegan-restaurant-guide.js`, `guides/vegan-restaurant-guide.html`), on the branch only: `?b=` is read and kept in `localStorage` `rg_b`; the audit tab becomes **Your business** with no search box and a "Not your business? Tell us" line; Overview holds thanks, Our story (SoFlo Vegans since 2016) and What is coming (Live or Coming); **Claim your page** replaces Get featured; **Try the demo** (view-only `/business/sample`, visitor or owner); **Get in** is the two doors and What membership gets you; the header box reads "Free with the survey"; the paid-audit upsell shows to members only.
- **Survey, live in the database**: migration `20261104_restaurant_door_survey.sql` (applied through the one-time function `ve-once-restaurant-survey`, now the 410 stub): `ve_surveys` + 17 `ve_survey_questions` (100 points, 5 required), `ve_guides.door = true`, `survey_slug = vegan-restaurant-guide`.
- **Liz speaks**: four visitor lines (overview, audit, featured, demo) recorded with `el-media` tts in her roster-profile voice (`IUMUPi350HfIhyzUBJB3`, Vegan as Veegan), checked word for word with stt, in `vegan-media/media/liz/restaurant-guide/door-<tab>-v1.mp3`. The Guide plays a tab's mp3 when it has one and no video clip (`AUDIO`, `lizAudio`, `aud`). The old clips for overview, audit, featured and join are switched off (their words changed): those tabs are text or mp3 only.
- **Checked on the Vercel preview** (real browser, 1440 and 390 px): all tabs, no script errors, the demo frame loads Green Leaf Kitchen, Liz's picture, Start the tour plays her Overview line and the next tab plays its own.

## Two locked lines changed for accuracy (recorded in the copy doc)
1. "Claiming is free for a member" is false (a claim is the $11, 1,100 points or the Partner plan). The Guide says it is a short form covered by one of those.
2. "A person reads the survey before your membership opens" is false for a Guide survey (it admits on finishing; only the profile survey has the review gate). The Guide says the membership opens when you finish. Sean has not decided whether to add a review gate to Guide surveys.

## Waiting on Sean
- **Listen to Liz and look at the final product** on the preview (private window): link in the chat; the Vercel share links expire 2026-11-05 about 9:10 to 9:25 AM Eastern, make a fresh one with `mcp__Vercel__get_access_to_vercel_url` for the branch's latest deployment.
- **His new idea, not built**: make the Guides free with the survey as the only door; the $11 becomes an optional contribution on a **What's next** page after the survey (tiles: make a contribution from $11 via the existing Contribute window, share your link for points, read the Welcome Guide, claim your page, open your dashboard, post a job). Logan's defaults if he does not override: survey stays the door, Get in becomes one door, the contribution gives thanks only (no points), What's next appears when the survey is finished. Points cannot pay for services or ads (the business points rule, Earn your Passport part 7, is not built): do not promise it.
- Then: **lock Version 1** (record it, evaluate at the end of the week on numbers, then regroup; run the panel through it) and only then the emails.

## Not done, in order
1. Apply Sean's feedback; update the copy doc and Guide for the What's next page and a one-door Get in. Record Liz's Get in line and the members' lines after the words settle.
2. **Template gate**: screenshots of the new Guide beside its parent (the Welcome Guide, `passport.html`) at 1440 and 390 px. Not taken.
3. Merge the branch to main (Sean's step), so the live Guide has `?b=` handling. **Until then, a real outreach email would link to a Guide that ignores the code**; no city is switched on and nothing has been sent, so there is no risk today.
4. The emails: Day 0, 4, 10 and the Instagram message loaded into `ve_outreach_templates` (business-outreach program) as drafts, tested to contact@lesaruss.com, then Sean approves a send day. Tomorrow's batch must have its free check (the sweep does this for send days in the next 10 days).
5. Find emails across the chapters (free, websites only; 2,384 approved listings, only 79 contacts have an email today). Not run.
6. The survey's per-answer **Can be shown on my page** switch and the plus-button list for question 16 (today 16 is one long answer, one recommendation a line), and a **Their story** section on listing pages.
7. Weekly report page and the chapter momentum board (Sean's ask), the Featured in Guides tag, the Opportunities-by-city playbook (parked until after the first batch).
8. The other door Guides (Nonprofit, Creator; brands) reuse the skeleton once Version 1 is locked.

## Notes
- Aisha's contact now holds a link code (`bo-t5wpdzk`) from a dry-run render; the first real email reuses it.
- A Supabase `execute_sql` write was held once (timed out at 230 s); the one-time function route (`scripts/supabase-once/once.template.ts`) worked. Reads and `net.http_post` selects never hold.
- Functions deploy from a pushed commit through `ve-function-deploy` called from SQL with the admin token read inside SQL, the sha being the full 40 characters; compare `source_sha256` with `sha256sum`.
- Network access: `*.vercel.app` and `*.cloudfront.net` were allowed this session (Vercel previews and Liz's art load in the sandbox).
- Other playbooks: `ve-pathways` campaign homes in BrandDesk untouched (still waiting on Sean to pick the first campaign; proposed: the Plant-Based Showcase at the Dolphins game, Nov 29).
