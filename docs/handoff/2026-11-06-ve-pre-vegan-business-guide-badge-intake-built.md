# ve-pre-vegan-business-guide: business badge intake built (2026-11-06)

Sean said "approved" to the draft (`docs/proposals/business-badges-intake.md`) and Logan's three defaults: the Vegan choice in Question 2 is just
"We run it for the animals."; Vegan + Mostly or Not yet shows 100% Plant-based and the team follows up; about 20 points a question.

## Built
- Migration `20261106_business_badge_intake.sql` (live; run through `ve-once-badge-intake`, now the 410 stub).
- Skip logic for any survey: `show_if`, `ve_survey_states`; skipped questions pay as answered.
- `ve_business_badges` + trigger + `ve_business_badge_decide`.
- `public/ve-guide-survey.js`: skips, counts shown questions, shows Your badge.
- `admin/depot/badges.html` and edge function `ve-badges` (deployed from 9d2b700, source sha256 matched).
- `ve-events-guide` Compare scores the new answers (deployed from 9d2b700, sha256 matched).

## Important
- The database is live, but the survey page change is only on branch `claude/amazing-maxwell-m9ogki`. Until it is merged to `main`, the live survey
  page shows all four badge questions to everyone and asks for answers the server no longer requires. Merge soon.

## Not built
- The badge on listings and Directory cards (next step), an email to the owner when 100% Vegan is approved, an Inbox row for a new claim.

## Still waiting on Sean
- The members' Overview line, Maya's 4 group-page lines, the go to launch the Pre-Vegan Business Guide.
