# ve-events-guide: after the survey door, merged and live (2026-11-06)

Playbook: `ve-events-guide` (also touches `brooke-sellers` for the Creator Guide wording, and `ve-restaurant-guide` for the member Get in screen).

## Done
- Sean approved items 1 to 3 of `docs/proposals/events-guide-after-survey-door.md` and said "Okay, let's merge." Merged to `main` at 687b0c2, notes a1893b5.
- Events Guide: River's Get access line is `river-join-v2.mp3` (survey only, no $11, checked with stt). The Get access tile and the Overview footer say free with the event survey.
- Vegan Restaurant Guide: an active member who has not taken the restaurant survey gets their own Get in screen ("You're a member. One short survey opens this Guide."; `joinActive`, `sayActive`), with no Founding line.
- Creator Guide: free with the creator survey. `survey.html` names the right Guide per survey, the v6 comment is fixed, and "It makes you a member" shows only to non-members.
- Checked live: the deployed scripts carry the changes, the recording returns 200, and the Events and Creator Get access pages show the survey wording with no $11 and no page errors at 1440 and 390 px.

## Open
1. Liz's member Get in line is text only. Record it once Sean approves the words (el-media tts, her roster-profile voice, check with stt, `-v1`).
2. Not proven: the team's review email on a real Explorer finish, and either survey flow clicked through in a browser.
3. Not seen in a browser: the Restaurant member screen as a signed-in member. Only the live code was checked.
