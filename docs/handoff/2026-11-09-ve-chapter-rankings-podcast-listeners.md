# ve-chapter-rankings: podcast listener places on each board card

Date: 2026-11-09. Playbook `ve-chapter-rankings`.

## Done
1. **Board checked signed in** (the Logan test member, a 30-minute session from the one-time `ve-once-board-session`, now 410;
   script `scripts/supabase-once/board-session.ts`). The dashboard's Communities tab sends members to `/communities`, so that is the
   signed-in view: 12 places, no script errors, no sideways scroll at 1440 or 390 px. Found and fixed: the sample member dashboard
   (`dashboard/sample/demo.js`) did not pass `ve-votes next_list` through, so its board would have stayed on "Loading the places".
2. **Podcast listeners on every card**: "1,214 downloads" under each place (headphones icon), "on N episodes" when our episodes
   named it, a tooltip with the top places behind the number, a footnote saying what it counts. Equal votes rank by downloads.
   - `ve_next_chapters.listen_match` per place (migration `20261109_next_chapters_listens.sql`); `listens` holds the result.
   - `branddesk-insights` v18 (d14487a, sha256 bb32b626 matched; live and main were equal at a95763f before) `next_places`;
     cron `ve-next-places` 08:41 UTC daily. Proven: wrong cron secret and no auth 403, a real run with no errors.
   - First numbers (all time to Nov 8): San Francisco 1,294, Japan 1,273, Oregon 1,214, Seattle 1,027, North Carolina 952,
     Phoenix 869, Houston 558, Austin 374, Dublin 318, Las Vegas 283, New Zealand 241 (on 1 episode), Caribbean 64.
   - Palo Alto (1,035) and Redwood City were taken out of San Francisco: not the city, and Palo Alto is data-center heavy.
     Oregon counts the whole state, which includes Hillsboro and The Dalles (data-center towns, 167 together). Sean's call.

## Next
- Show me (a sample hub per place) waits for real votes.
- A new place on the board needs a `listen_match` row, or it shows no downloads.
