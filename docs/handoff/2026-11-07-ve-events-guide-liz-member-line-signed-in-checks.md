# ve-events-guide: Liz's member Get in line, and the signed-in checks (2026-11-07)

Playbook: `ve-events-guide` (also `ve-restaurant-guide` for the Get in screen, `ve-feedback` for the nav label).

## Done
1. **Liz's member Get in line.** Recorded with el-media `tts` from the database in her roster-profile voice (`IUMUPi350HfIhyzUBJB3`, checked against `character_agents`). The text has no "Vegan" in it, so no Veegan spelling was needed. `stt` matched 24 of 24 words (only punctuation and a lowercase "guide" differ). File: `vegan-media/media/liz/restaurant-guide/door-join-member-v1.mp3` (187 KB, about 7.5 s). Wired as `AUDIO_ACTIVE` in `guide-scripts/vegan-restaurant-guide.js`: `lizAudio('join')` returns it on the `joinActive` screen, and the cue key gets `:a` so it re-cues if the screen changes. On main at de2738f. Confirmed live at 1440 and 390 px as a signed-in member with no restaurant survey: the `sayActive` text shows, Play loads the mp3, no script errors, no sideways scroll.
2. **Signed-in browser run** with two [TEST] member-class accounts and one-hour tokens (`ve-once-guide-run`, now the 410 stub; source in `scripts/supabase-once/guide-run.ts`, key removed). The internal Logan test account could not be used: `ve_survey_answer` refuses any `member_class` other than member.
   - Restaurant: Get in > Take the restaurant survey > every question (answers save as you go; it resumed at question 18) > the Guide opened on What's next as an owner. 1440 px.
   - Events: Get access > Take the event survey, free > finished > the Guide with the member menu (Start here, 1 of 6). 390 px.
   - Creator: Get access > Take the creator survey, free > You finished > the Guide opens. The first screenshot, taken mid-redirect, showed the visitor header. A fresh load showed the member view, with `open` returning unlocked via door.
3. **The Explorer review email.** It does not fire, and under today's rule it should not. `ve_surveys` explorer is `reviewed` false and `admits` true (Explorer path v7, straight in, Sean confirmed 2026-11-06). A real Explorer finish in the browser made the unpaid account active (`entry_via` survey, Founding Member, 220 points), with no review and no `email_sends` rows at all. `notifyTeam` in `ve-mission-survey` only runs when an answer returns `review: 'pending'`, so it is dormant, not broken.
4. Cleanup: 2 members, 58 answers, 4 completions, 60 ledger rows, 2 brand memberships and 9 shared answers removed. The Explorer filler answer filed no Directory lead.

## Found
- `public/nav.js:341` labels every active member "Founding Member", whatever `members.founding_member` says. Queued in `ve-feedback` (Logan).
- The creator survey's finish screen shows the business badge line ("Your badge will be 100% Vegan... until then your page shows 100% Plant-based") to a creator. Sean's call whether creators should see it.

## Open
- Sean: the creator badge line above. If the team should still hear about Explorer finishes even though they go straight in, that is a new rule for Sean (default: no email; the Depot shows new members).
