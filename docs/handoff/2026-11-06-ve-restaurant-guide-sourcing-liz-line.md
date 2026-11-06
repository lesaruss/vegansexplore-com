# ve-restaurant-guide: Sourcing, Liz's Sourcing line; Start here merged; Overview v3 (2026-11-06)

Sean, 2026-11-06: "approve K and L, merge the branch".

## Done
- **Start here merged to main** (branch `claude/affectionate-planck-jjh7xv`, merge 6b941e4). The visitor heading now reads "Welcome to the Vegan Restaurant Guide" (the locked name; it said "Vegans Explore Restaurant Guide").
- **Liz's Sourcing line (K)**: `vegan-media/media/liz/restaurant-guide/door-sourcing-member-v1.mp3` (36 s), el-media tts from the database, roster-profile voice `IUMUPi350HfIhyzUBJB3`, Veegan; stt matched word for word (case and commas only).
- **Liz's Overview v3 (L)**: `door-overview-v3.mp3` (43 s), same checks; matches Start here. overview-v2 kept.
- Wired in `guide-scripts/vegan-restaurant-guide.js`: `AUDIO_M.sourcing`, `AUDIO_V.overview` = overview-v3, Sourcing `sayMember` = the recording, new `showMember` (members' short on-screen line while a recording exists), Overview `say` = v3.
- Checked locally at 1440 and 390 px with mocked access: member Sourcing shows the short line and Play requests sourcing-member-v1; visitor Overview shows Start here open and Play requests overview-v3; no script errors, no sideways scroll. Live check after the push below.
- Maya's matching Sourcing line is ready to record at the Pre-Vegan Business Guide's launch (`docs/proposals/liz-audio-scripts.md`).

## Waiting on Sean
- The tab-by-tab V1 lock-in (visitor: Overview, Your audit, What to expect, Get in; member: Top challenges, Pulse, Sourcing, Claim your page, Your dashboard, Try the demo, Promotions, My list, What's next).
- The five emails: https://claude.ai/artifact/819FYdMdKGMUjKSF6UNfeC. Nothing sends, no city on.
- The three shared inboxes (Vale Healthy Kitchen, FreshOne Kitchen, EZ Eatz by Yaya); default keep each main location.
- Try Talk to Liz signed in and out (Ask a person and a real phone member still unproven).

## Logan next
- Draft the Events Guide's Start here parts (audience, problem, change) as text for Sean, then the other Guides.
