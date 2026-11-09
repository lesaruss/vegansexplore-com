# signal-context-efficiency: lean sessions, wrap-up 2026-11-09

Playbook `signal-context-efficiency` (part of Signal, brand lesaruss-hq), status Watching, due 2026-11-23.
Canon: `canon-session-procedure` v2, `canon-wrap-up-standard` v3, `canon-core` (on-demand rule), `canon-manifest` (43 slugs),
`ops-claude-skills-update-steps` v2.

## Ledger (every item from the session, and where it is stored)

| # | Item | Stored at |
|---|---|---|
| 1 | Question answered: wrapping after each compaction saved nothing; CLAUDE.md (~1 MB) was the cause | this doc |
| 2 | BOSS run on session procedure, Anthropic Claude Code docs cited | playbook row "locked procedure"; canon-session-procedure `sources` |
| 3 | Procedure locked by Sean ("lock it") | canon-session-procedure v1, CLAUDE.md "Sessions and context" (88f460e) |
| 4 | Wrap-up standard v3: wrap when finished, lean prompt | canon-wrap-up-standard v3; CLAUDE.md Wrap up line (5380e71) |
| 5 | CLAUDE.md trimmed 7,614 lines / 1 MB to ~314 lines / 28 KB; 135 sections moved verbatim to 25 files in docs/history/; line check passed | main 2d1d13b, 5380e71; playbook row "the trim" |
| 6 | Sean: "we're not going to wrap up until the playbook is completed" (then chose to wrap here and continue in a new chat) | playbook row "locked procedure"; this doc |
| 7 | Criteria, watch levels and rollback (restore CLAUDE.md from 88f460e) | playbook row "criteria"; canon-session-procedure v2 `rollback` |
| 8 | Logan steers the degradation check | CLAUDE.md (e9e5c67); canon-session-procedure v2 `degradation_duty`; playbook row |
| 9 | Weekly check-in, Mondays 1:23 PM Eastern | scheduled task trig_01EE1wPCTYuFMuSkurD6oYqu (fires into the old session; recreate in the new chat); playbook row |
| 10 | Always-load canon 102 records / 405K chars to 43 / 140K; 59 tagged ondemand:<area>; manifest rewritten; presence check passes both ways | playbook row; snapshot table zz_canon_load_snapshot_20261109; migration note 20261109_canon_always_load_trim.sql (27f8b82) |
| 11 | lesaruss-guard step 2: always_load only for every-brand rules | org skill updated 2026-11-09 10:57 UTC; playbook row |
| 12 | How to update and enable a claude.ai skill | canon ops-claude-skills-update-steps v2 (ondemand:access-and-verification) |
| 13 | decision-interim-architecture-routing retired | knowledge_records status superseded; playbook row |
| 14 | lesaruss-hq loads no instruction file; universe 9 KB; nothing to trim | playbook row |
| 15 | lesaruss-handoff: lean new-chat prompt, checkpoints at milestones not every 5 minutes | org skill new version 2026-11-09 12:33 UTC; playbook row |

## Baseline numbers
- CLAUDE.md on main: 314 lines (target <= 400 lines, 40 KB).
- Error registry before the trim: about 22 hits and 11 repeats a week (weeks of Oct 12, 19, 26, Nov 2: repeats 8, 11, 16, 11).
- Always-load canon after the trim: 43 records, 139,585 chars.
- Fresh-chat context %: about 10% at open, 12% after the first task (Sean, 2026-11-09; was 40 to 50%; target <= 15%: met).

## Next (new chat)
1. Sean reads the context % the new chat opened at; Logan records it in the playbook.
2. Confirm the new chat loaded the new lesaruss-handoff and lesaruss-guard text.
3. Recreate the weekly check-in bound to the new chat, then delete trig_01EE1wPCTYuFMuSkurD6oYqu.
4. Weekly checks until 2026-11-23, then close or roll back.

## Second chat, 2026-11-09 (session_01Au68axze5MADn5vyhAKUiS): items 1 to 3 done

| # | Item | Stored at |
|---|---|---|
| 16 | Fresh-chat context %: Sean, "It opened like around 10%. It's at 12% right now." Target <= 15% met | playbook row 12:52 UTC; baseline above |
| 17 | lesaruss-handoff and lesaruss-guard synced into the new chat with the new text (checked on disk, 12:50 UTC) | playbook row 12:50 UTC |
| 18 | Weekly check-in recreated bound to this chat: trig_01KQzrX1TrcB1hN63Hfzk5Hq, Mondays 1:23 PM Eastern; trig_01EE1wPCTYuFMuSkurD6oYqu deleted; list shows only the new one | playbook row 12:50 UTC; checkpoint 965 |

Still open: weekly checks until 2026-11-23 (they fire into this chat on their own; leave the chat in place, do not archive it),
then close the playbook and delete the check-in if every target held two weeks running, or roll back.
