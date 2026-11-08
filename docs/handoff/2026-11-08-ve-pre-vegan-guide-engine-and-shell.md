# ve-pre-vegan-guide: steps 1 and 2, the course engine and the Guide shell (2026-11-08)

Logan, from canon `canon-ve-pre-vegan-guide` v1 and `docs/handoff/2026-11-08-ve-pre-vegan-guide-locked.md`. Branch `claude/admiring-pasteur-zxx8tz`
(the locked-playbook branch `claude/jolly-goldberg-qecpqk` merged into it). Not on `main` until Sean says merge.

## Step 1: the brand-neutral course engine (live, program draft)
Migration `supabase/migrations/20261108_course_engine.sql`, proof `scripts/supabase-once/course-engine-proof.sql`.
- Tables (RLS on, no policies; functions service role only): `course_programs` (brand, days, unlock hour, proof window, pause, phase gate,
  points currency), `course_phases`, `course_days` (ready flag: a day not ready never unlocks), `course_challenges` (kind, auto or person
  review, source log, target, points), `course_unlocks` (badge, phase, feature; earned on open, approval or finish), `course_questions` (the
  question map: profile or course), `course_enrollments`, `course_progress`, `course_proofs`, `course_member_unlocks`, `course_answers`.
- Functions: `course_enroll`, `course_open_day`, `course_refresh` (the day clock, lazy), `course_next_unlock`, `course_auto_check`,
  `course_proof_submit`, `course_proof_review`, `course_pay`, `course_earn`, `course_answer`, `course_pause`, `course_finish`, `course_state`.
- **Reuse**: scans read `ve_product_scans`, saves `ve_listing_saves` / `ve_guide_saves` / `ve_episode_saves`, check-ins `ve_checkins`, a photo
  at a check-in is the `ve_checkin_actions` row decided in Depot > Check-ins (trigger `trg_course_checkin_action` mirrors it), points go through
  `ve_points_grant` (ledger reason `course`, once per ref, frozen accounts refused), profile questions through `ve_profile_answer`.
  **Not reused literally**: photos, voice notes and reflections that belong to no check-in are `course_proofs` decided by `course_proof_review`
  with the bounty rule (a super admin approves; points only on approval; a decline needs a note). A `ve_bounties` row per challenge would have put
  them on the public boards. Their Depot screen comes with step 3 (a tab beside Depot > Check-ins).
- **Rules as built**: Day 1 on Start; the next day unlocks at 5 AM local on the calendar day after the current one unlocked, never before the first
  5 AM after it was opened, and only once it was opened (no backlog, no bingeing); proofs open 7 days; one paid action of a kind per local day
  (a second is recorded with "one paid photo a day" and 0 points); pause 1 to 14 days once per phase; Day 111 "I'm Vegan" writes the shared
  `journey` answer as vegan (source `course:pre-vegan-111`); never a Vegan badge. `ve_member_badges` now also returns course badges (Pre-Vegan, 111 Days).
- **Logan's defaults, Sean's to change**: the next phase opens once the capstone is **sent** (`phase_gate` capstone_sent), not approved, so nobody waits on
  the team; the Day 5 meal photo pays 10 from the course on top of the check-in menu's own 15 (25 together); the open-points only for the newest day.
- Seeded: program `pre-vegan-111` (Vegans Explore, 111 days, **draft**), 9 phases, Days 1 to 7 (ready, lines draft), 16 challenges, 11 unlocks, the
  question map (22 profile questions every 5 days, why, what is hardest at each capstone, the Day 111 choice). 111 Day Theory is a second program row
  (`brand_slug` lesaruss); its badges do not join Vegans Explore's.
- **Proven 2026-11-08** in a rolled-back transaction (the connector held the write, so a one-time function, `ve-once-course-engine`, now the 410 stub,
  ran the repo files at their commit): 40 checks pass (draft refused to a non-internal member, open pays 5 once, no binge, tick, answer, one paid open a
  day, photo needs an upload, review refused to a member and a decline without a note, approve pays 25, scans 2 then 3 from the log, check-in 15, meal
  through Depot > Check-ins mirrored, capstone gate, badge on approval, pause rules, finish only at the end and the journey answer, frozen refused,
  ledger matches the balance). Then applied live; 0 enrollments.

## Step 2: the Guide and the survey (page on the branch; survey and row live)
- `guides/pre-vegan-guide.html` (the Dairy Guide's file and styles, `noindex`) and `guide-scripts/pre-vegan-guide.js`. Tabs: Start here, 111 Days
  (phase map, Day 1 free, Days 2 to 7 for members), Is it Vegan? (VEScan + `ve-products` lookup), Near me (`ve-search` with the phone's place,
  100% Vegan first), Swap of the week (a new one each Monday), Get in (the survey). Maya's lines are text drafts (no Play until recorded).
- Survey `pre-vegan` (migration `20261108_pre_vegan_guide_survey.sql`): Explorer's 9 questions (same ids and shared keys, so Explorer answers carry
  over) + 5 (`pv_start` required, `pv_hardest`, `pv_home`, `pv_cook`, `pv_help`), 250 points, admits. `ve_guides` `pre-vegan-guide`: door, survey
  pre-vegan, published (so ve-guide-unlock answers), members' Days 2 to 7 in `content_html` (`pv-data`, not in the repo).
- Checked at 1440 and 390 px beside the Dairy Guide (same family), no script errors, no sideways scroll; `/survey?s=pre-vegan` loads signed out.
- **Not proven**: a signed-in member who finished the survey seeing Days 2 to 7 (needs a real session); not in the catalog or sitemap (the Coming
  soon `prevegan` card stays until launch).

## Open, for Sean
1. Maya's lines on the six tabs (text in the script) and Days 1 to 7 (canon), then recording.
2. Whether finishing the Pre-Vegan survey should also count as finishing Explorer (Explorer badge and the Explorer orientation). Default: no, until you say.
3. The three defaults above (phase gate on sent, the Day 5 photo 10, open points for the newest day only).

## Next (Logan)
Step 3: the edge function the page calls (`ve-course`: state, enroll, open, submit, answer, pause, finish), the course-proofs review tab, the daily
drop email (opt-in) and the one gentle note after 3 quiet days. Then Days 8+ in batches by phase to Sean.
