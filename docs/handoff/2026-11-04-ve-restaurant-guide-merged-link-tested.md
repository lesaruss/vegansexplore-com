# ve-restaurant-guide: front door merged to main, /go/bo- link tested, Liz's new lines not recorded

Date: 2026-11-04. Playbook: `ve-restaurant-guide`. Follows `2026-11-04-ve-restaurant-guide-front-door-built.md`.

## Done
- Sean said "merge it". `claude/laughing-dirac-udxp3j` fast-forwarded into `main` (288bbad) and pushed. The live `guide-scripts/vegan-restaurant-guide.js` carries "Run my free check".
- Real link test with a [TEST] contact (Tofubox, code `bo-tz7q3kx`, `ve_links` row plus `ve_outreach_contacts` row, no batch so never due):
  - `/go/bo-tz7q3kx` answered 302 to `/guides/vegan-restaurant-guide?b=bo-tz7q3kx&vl=<click id>`.
  - The click was logged as a real, non-bot click with the test email.
  - `ve-restaurant-audit` `personal` returned Tofubox (632 Grand Street, Brooklyn) from the code alone.
  - All test rows removed (link, contact, click, events, interest); recount 0.

## Not done / not checked
- Liz's new Overview and What to expect lines are not recorded (no el-media here; no voice is picked without Sean). Overview is text only, What to expect has no audio.
- The sync turning the test contact Interested was not checked (rows were removed first).
- The merge also brought in the `ve-outreach` change (`supabase/functions/ve-outreach/index.ts`) and `supabase/migrations/*playbooks_restaurant_guide_split_certification.sql`. Whether the function is deployed and the migration applied was not checked.
- The new front door was not viewed live in a browser with a `?b=` code.

## Next (Logan)
1. With el-media: record the two lines in Liz's roster-profile voice, check each with `stt`, save as `-v2`, add to `AUDIO` in the Guide script.
2. Confirm `ve-outreach` is deployed from main and the migration applied.
3. Look at the live front door with a real `?b=` code at 1440 and 390 px.

Nothing was sent. No city is on.
