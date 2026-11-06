# ve-events-guide: membership rule locked, intakes at 250, shared intake answers built (2026-11-06)

Playbooks: `ve-events-guide` (also `ve-pathways`, `ve-pricing-points-passport`).

## Locked by Sean 2026-11-06 ("lock it")
Canon `canon-ve-door-guides` v6 (`membership_rule_v6`) and `canon-ve-people-campaigns-doors` v5. Migration `20261106_membership_rule_v6.sql`.
1. In by any Guide survey (250 points) or the $11 one time (never "a month"); after the $11, a prompt (not required) to take a survey.
2. Topic Guides (Dairy, Nutrition, Airport, Stadium & Arena, Theme Park, Supermarket) are $11 or 1,100 points for members, no survey route.
   Supermarket stays free while a sponsorship is active.
3. Business Guides (Restaurant, Creator, Events, Nonprofit; Pre-Vegan Business later, in its own chat) open by finishing their intake, for
   anyone, members included. Replaces "a door Guide opens for any active member" (`ve-guide-unlock` line ~216, `ve_owns_guide`; NOT changed yet).
4. One survey system for every Guide (Creator and Nonprofit move onto `ve_surveys`).
5. Shared answers fill in on later intakes; newest answer wins everywhere.
6. A Registered badge per intake (Registered creator, restaurant owner, event host, nonprofit), role answer as small text under it.
7. Each intake pays 250, stacking (Sean: "I want them to get to level 2").
8. The general survey becomes the short Explorer survey on the Welcome (/passport): about 8 questions, 250 points, person-checked.
   The 31-question profile stays the member's profile, paying per answer.

## Done and live
- Step 1: canon, playbook record, stream event (main 0f852f2).
- Step 2: Events and Restaurant intakes each total 250 (every question x2.5; restaurant r_proud 12, r_recommend 13). Events Guide price box
  says "up to 250 points". Host story points stay 100.
- Step 3 mechanism (migration `20261106_shared_intake_answers.sql`, applied through the one-time `ve-once-shared-intake`, now the 410 stub):
  `ve_shared_questions` (the bank; a tagged question takes its wording and choices by trigger), `ve_member_shared_answers` (one per member and
  key), `ve_survey_questions.shared_key`, `ve_survey_carried()`, `ve_survey_get` returns `carried` and `shared`, `ve_survey_answer` saves the
  shared answer, propagates it to other intakes' rows (newest wins, no new points) and writes carried answers into this intake paying their points.
  Client `public/ve-guide-survey.js`: carried questions are prefilled and skipped forward and back, listed at the end with Change; an intake with
  only carried answers left finishes on its own. Proven in a rolled-back transaction and in a browser against mocked answers.
  NO question is tagged yet, so members see no change.

## Waiting on Sean
- The wording in `docs/proposals/shared-intake-questions.md`: four shared questions (chapter, org name, link, how Vegan is what you run) and the
  two lines members read. On approval: one migration tags them (Events e_chapter, e_vegan; split e_group; Restaurant gains chapter, name, link;
  r_vegan takes the shared wording with Events' stored values all/mostly/friendly/notyet so Depot > Event sponsors' Compare keeps scoring), re-spread
  points to 250 each, check both intakes at 1440 and 390 px.

## Next, in order
4. Creator and Nonprofit onto `ve_surveys` (creator application today: `ve_creator_applications` via `/gigs/sample#join/1`; nonprofit:
   `ve_nonprofit_surveys`, members only). Both Guides become free with their intake.
5. Members see the intake before a business Guide opens (change `ve-guide-unlock` door access to require that Guide's completion).
6. Registered badges. 7. Explorer survey + prompt after the $11. 8. Claim emails point hosts to the event survey.
9. Policies, Guides' facts, saved answers. Every word people read goes to Sean first.

## Still open on the playbook (not this chat)
Saving the 12-week plan to the account; a Depot view of `ve_door_guide_stats`; This month recordings; host path steps 3 to 5.
