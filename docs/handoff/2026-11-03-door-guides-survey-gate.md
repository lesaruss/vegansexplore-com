# Handoff: Door Guides step 2, the survey gate (2026-11-03, Logan)

Read CLAUDE.md "Door Guides" (the step 2 bullet) first. Supersedes the "Direction change" and "Not done, in order" parts of `2026-11-03-door-guides.md`.

## Built
- Generic survey engine in rows (`ve_surveys`, `ve_survey_questions`, `ve_survey_answers`, `ve_survey_completions`, `ve_survey_get`, `ve_survey_answer`) plus the event survey (12 questions, 100 points). Applied through the connector.
- `ve-mission-survey` (`survey_get`, `survey_answer`), `/survey?s=<slug>`, `public/ve-guide-survey.js`.
- Events Guide: survey gate, Claim tab, sponsorship step 1. `ve-events-guide` `sponsor_apply` needs the survey; `admin_compare` and Depot > Event sponsors > Compare.
- `ve-guide-unlock` opens a door Guide for any active member; the email reader is gone (`ve-taster` `guide_join` is 410).
- Welcome notes reworded for members, recipients are survey completers (`ve_door_emails`); draft again, off.

## To check after deploy
- A real unpaid sign-up through the Guide's Take the survey button (ask Sean first; sign-ups from one address are limited to 3 an hour).
- `ve-function-deploy` for ve-mission-survey, ve-guide-unlock, ve-taster, ve-events-guide, ve-nurture from the pushed sha.

## Waiting on Sean
Event survey points (default 100), whether the general survey admits without it (default yes), canon v2 for `canon-ve-door-guides`, approve the host heads-up email, the free organizer account for hosts with no account, River's lines, launching the Events Guide, approve the reworded Day 3 and Day 7 notes.
