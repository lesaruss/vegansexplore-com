# Handoff 2026-11-14: the Next Level cities are open (ve-chapter-launch, closed)

Playbook `ve-chapter-launch` (closed). Canon `canon-ve-chapter-launch` (recipe, now with `deploy_one_at_a_time`, `live_vs_main`,
`city_list_chapters`, `headlines`). Record: `docs/history/communities.md`, sections Portland and "San Francisco, Austin, Denver and Boston".

## Sean's words
- "open the next Vegans Explore chapters with the Seattle recipe, Portland first"
- "open Portland"
- "go" (on building San Francisco, Austin, Denver and Boston as one batch)
- "open them"
- "close it"

## Done (live, proven at 1440 and 390 beside Los Angeles)
- **Portland** (all of Oregon): 102 places. Portland, Maine is kept out (filed as `portland-me`).
- **San Francisco** (Bay Area cities, CA): 132 places. **Austin** (Central Texas cities): 46. **Denver** (all of Colorado): 53.
  **Boston** (all of Massachusetts): 68. Nineteen chapters now.
- 385 listings added from 72 Google searches (about $2.88 at list); four Portland listings corrected to 100% Vegan from their own sites.
- City-list chapters check the state everywhere (`VE_HUBS`, `ve-claims`, `ve_outreach_cities`, `ve_chapter_of`); `ve-auth` maps shared town
  names only with the state and keeps a chapter named for a city to its own state (`CHAPTER_OWN_STATE`).
- Art: Denver and Boston drawn new in every shape; a 4:5 drawn new for all five cities.
- All 21 chapter-list functions live from 40cccb8, each version read back from the Management API, every sha256 matched.
- Live `ve-auth` kept the app's `delete_account` (Apple 5.1.1(v)), which lived only on the unmerged branch `claude/elegant-mayer-r6z3p0`;
  it is on main now with `20261108_member_delete.sql`.

## Found and fixed
- **Bulk deploys did not stick**: 21 `ve-function-deploy` calls fired together answered ok, but 14 stayed on old versions (Seattle's lists
  had never gone out either). Rule now in CLAUDE.md and canon: one at a time, read the live version back.

## Waiting on Sean
- Six launch posts and stories (Seattle, Portland, San Francisco, Austin, Denver, Boston) in playbook `ve-social-schedule`
  (`public/chapters/<slug>/`, `/go/<slug>-open`). Nothing posts until he approves.

## Parked (not this playbook)
- Carrie Davis (Next Level Veggie Grill): Christmas pickup dates and Christmas Day hours.
- Owner tools: Add a location, copy a menu to every location.
- Southern California outside the LA city list (Tustin, Carlsbad, El Segundo): a decision for Sean.
- Being vetted: 258 new vegan_options listings across the six cities wait for member votes.
- Outreach stays off for all six chapters until Sean turns it on.

## Start here (new chat)
```sql
select slug, kind, body, created_at from playbook_records where slug = 've-social-schedule' order by created_at;
```
