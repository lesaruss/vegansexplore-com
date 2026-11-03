# Handoff: survey door built (2026-11-03, Logan)

Read CLAUDE.md "Three doors, one Welcome, campaigns on people" (it has the survey door paragraph) and docs/proposals/people-campaigns-doors.md.

## Done and live (main at 55b5805 plus this note)
- Survey door: migration `20261103_survey_door.sql` (applied via the one-time `ve-once-survey-door`, now the 410 stub). `ve-mission-survey` `door_start` deployed from 55b5805, source sha256 1984cfe149f938768879e1cadf4567c40410a21a35037576efe36b4a6839f86a.
- Proven: rolled-back DB test (refused before the door, 250/250 admits, active, entry_via survey, no entry_paid_at, Founding, brand membership kind survey). Live page `/survey?door=1` clicked through in a browser with mocked network.
- Wording updated: join window, passport.html join tab, /policies#membership, six guide_kb_answers, and `ve-guide-platform-facts` (it is `knowledge_records` `body.facts`, not a function; the old 30% top rate fixed).

## Not done
- Never clicked through as a real unpaid account (needs a test sign-up; ask Sean first).
- `/claim` and pages with `VE_ACTIVATE_HANDLER` do not offer the survey.
- Challenges not retired (proposal: do not delete until Sean says).
- Referral farming: a survey join pays the sharer 111 points with no payment. Logan's default: leave on, watch a week; alternative: hold the points until approval or 14 days active. Sean's call.

## Next, in order
1. People sender on Depot > Outreach (`ve-people-outreach`): pick people and make drafts (unpaid accounts and HQ People pool, Tasters out), Sent/Opened/Clicked per row, campaign table, week view. Reference read only: lesaruss/bcpsmarcomm `src/app/api/bcps/cert-followup/route.ts`, `src/lib/email-streams.ts`, `src/components/pages/CertFollowupPage.tsx`.
2. Merged Welcome (Welcome + Passport + Taste): start with Sean, copy passport.html's Guide shell.

## Open items for Sean
- Pulse live proof needs `pulse_subscribe.on` flipped for a few minutes with only Sean's address, then off. Ask permission.
- Confirm Founding level thresholds 50k/100k/200k/400k (rows in `ve_affiliate_levels`).
- Content-index episode numbers: change nothing until Sean gives his two reference numbers (Jan 27 "Is Adding Meat a Death Spiral..." and Dec 14 "Dr. Neal Barnard Answers...").
- Pulse leftovers: mid-article box and nearest-city preselect, per-subscriber /go/ links, confirm email-send does not require {{unsubscribe_url}}, check the box and pop-up in a real browser once on.

## Gotchas this session
- apply_migration was held by the connector (expired confirmation): use the once-function route.
- ve-function-deploy needs the full 40-char sha and the token from `lesaruss_secrets` (not vault); read `net._http_response` by id range.
