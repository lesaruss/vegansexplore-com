# Handoff: Door Guides step 1, and the survey-model change (2026-11-03, Logan)

Read CLAUDE.md "Door Guides" and "Three doors, one Welcome, campaigns on people" first. Canon `canon-ve-door-guides` (v1, locked 2026-11-02), playbook `ve-door-guides`.

## Done and live (on main)
- Migration `20261103_door_guides.sql` (applied through the connector): `ve_guides.door`, `ve_tasters.door_guides`, `ve_event_host_stories.kind|claimed|adult_at`, `ve_door_guide_stats()`.
- `ve-taster` `guide_join`, `ve-guide-unlock` (`taster_token` opens a door Guide's screens, `reader: true`), `ve-events-guide` (recording needs an approved claim or an active membership, 18+ ticked, 90 seconds an answer), deployed from 7497a6c.
- Events Guide page: free-with-email gate, header "Free with your email / Read it free", rules card on the recorder (`guide-scripts/vegan-events-guide.js`, `guides/vegan-events-guide.html`).
- `ve-nurture` (from 4ec38d8): the Events Guide's Day 3 and Day 7 notes, draft until approved, off until switched on (`nurture.door_on`, `door_approved_hash`), Depot > Challenges > Taster emails. Both tested to contact@lesaruss.com and arrived. Nothing has been sent to a reader. Nothing is approved or switched on.

## Direction change from Sean (after the build, not built yet)
Sean replaced the email-only reader with a survey gate. In his words: "everybody can get a free account, but they have to complete the survey that's tied to that guide... the guide... will walk them through claiming their profile... tee up all the opportunities... their way through is either one time $11, or they can complete this survey... even if they do contribute the $11, they can still... complete the survey to earn points." For events: "no matter who you are, I want you to take the survey... if somebody wants to do a sponsorship... the first step is to complete the event survey... Then once they complete that, they get what's on the other end of that. If they don't have a membership, they get a membership. If they're applying for a sponsorship, they're now in the running... we're going to be reviewing all applicants... it's going to get competitive."

What that changes:
- The email-only reader level (`guide_join`, the Taster key reading a door Guide) is superseded. Keep the `door` flag, the recording rules and `ve_door_guide_stats`.
- Reading beyond the open Overview and the free example needs an account: $11, or the Guide's survey (the existing survey door engine, `/survey?door=1`, `ve_survey_door_start`, `ve_survey_door_admit`).
- A Guide's survey is a set of rows, so each door Guide adds rows, not code. The Events Guide gets an event survey.
- The sponsorship application starts with the event survey, then the existing application, then a competitive review in Depot (ranking by chapter, group size, fit, answers), keeping the 2 a chapter a month cap.
- The Guide walks them through claiming their profile (event claim, listing claim, People profile claim: all exist).
- A member who paid $11 can still take the survey for the points.
- The Day 3 and Day 7 notes say "you are not a member": reword before they can switch on, and decide who they go to (survey completers who are members).

## Open for Sean (Logan's defaults in brackets)
1. Event survey points: 100, or match the general survey's 250? [100, about 12 questions]
2. Does finishing the general survey admit someone with no event survey? [yes for membership, but a sponsorship still needs the event survey]
Canon v1 is not edited until Sean signs off; the playbook has the change as a pending decision.

## Not done, in order
1. Sean's two answers, then a canon v2 for `canon-ve-door-guides`.
2. Generalize the survey door: a survey per Guide (rows), the event survey's questions (about their group and community), admit on completion, points per survey.
3. Events Guide gate: replace the email field with "take the survey, free" beside "$11 or 1,100 points"; the Guide's claim-your-profile step; retire or repurpose `guide_join`.
4. Sponsorship: event survey first, then the application, then a Depot review view (rank, compare, decide), no entitlement wording.
5. Reword and re-approve the Day 3 and Day 7 notes for members.
6. Still open from before: This month, the question of the month, your story, good news, the private "struggling" clip, the free organizer account for hosts with no account, saving the plan to an account, a Depot view of `ve_door_guide_stats`, the other three door Guides after 30 days of numbers.
7. Waiting on Sean from the event host path: approve the heads-up email (Depot > Events > Heads-up), River's lines and launching the Events Guide.

## Gotchas
- The deploy route: push to main, then `ve-function-deploy` from SQL with the full 40-character sha and the admin token read inside SQL (never printed). The shared pg_net worker can be slow, a deploy or test response can take minutes to appear in `net._http_response`.
- Never run `ve-nurture` `tick` casually with the admin token: it also runs the live Taster emails when it is inside 10 AM to 5 PM Eastern.
- Test sends go to contact@lesaruss.com through `ve-nurture` `test` with `to`.
- The branch `claude/charming-tesla-nhpdwi` is pushed; main carries everything.
