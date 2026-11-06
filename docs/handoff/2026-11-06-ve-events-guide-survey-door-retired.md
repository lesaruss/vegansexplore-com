# ve-events-guide: old 31-question survey door retired (2026-11-06)

Sean: "retire it". Main 494e161.

## Done and checked
- `/survey?door=1` redirects to `/survey?s=explorer` (checked live in a browser).
- `ve-mission-survey` v11 (sha256 4acaf811... matched): `door_start` and `finalize` answer 410 `{error:'retired', use:'/survey?s=explorer'}`. Not tested with a signed-in token.
- Send-back email links `/survey?s=explorer`. Depot > Profiles > Waiting for review stays for the Explorer survey.
- Nobody was midway (one `survey_door_at` row, already active). Members keep Build your profile.

## Open (Sean's calls)
1. River's Events "Get access" recording mentions the $11 path: new words, then a `-v2` recording.
2. The Restaurant Guide's Get in screen speaks only to non-members.
3. Creator Guide wording is on branch `claude/optimistic-mendel-box698`, not on main.
4. Not yet proven: a real signed-in Guide survey run, and a live Explorer approval in the Depot.
