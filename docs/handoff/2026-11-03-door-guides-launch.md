# Handoff: Door Guides step 2 built, Events Guide launched (2026-11-03, Logan)

Read CLAUDE.md "Door Guides" (the step 2 bullet, the launch bullet and the wrap-up bullet) first. Earlier notes: `2026-11-03-door-guides.md`, `2026-11-03-door-guides-survey-gate.md`.

## Live on main (337689d and later)
- Survey per Guide as rows (`ve_surveys`, `ve_survey_questions`, answers, completions), the event survey (12 questions, 100 points), `/survey?s=<slug>`, `public/ve-guide-survey.js`.
- Events Guide: survey gate, Claim tab, sponsorship needs the survey, Depot > Event sponsors > Compare, door Guide opens for any active member.
- Welcome notes for members: approved and switched on. Events Guide launched: indexed, in the sitemap, catalog card live.
- Bug fixed: `ve-events-guide` `viewer()` read columns that do not exist.

## Pending, in order
1. Check the host heads-up approval landed: `select approved_at, enabled from ve_outreach_cities where community_slug = 'event-hosts'`. If not, call `ve-event-headsup` `approve` again (ops token read inside SQL). It sends weekdays 10 AM to 5 PM Eastern.
2. Sean's two defaults then canon v2 for `canon-ve-door-guides`: event survey 100 points; the general survey admits without the event survey.
3. Real unpaid sign-up through the Guide's survey gate (ask Sean; 3 sign-ups an hour per address).
4. Free organizer account for hosts with no account; River's recordings; This month, question of the month, private struggling clip; a Depot view of `ve_door_guide_stats`; the other three door Guides after 30 days of numbers.

## Gotchas
- pg_net stalls often: a queued `net.http_post` can sit for minutes; `pg_terminate_backend` on the `pg_net%` worker frees it. A single SQL statement cannot read its own pg_sleep results (snapshot): sleep in one call, read in the next.
- The connector held a destructive delete: use a `ve-once-*` function (done, now the 410 stub `ve-once-door-cleanup`).
- `ve-mission-survey` has verify_jwt on (the pages send the anon key as Bearer).
