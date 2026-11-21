# Wrap: Near me follow-ups, the 2026-11-13 old-look sweep, Guide art retirements (chat of 2026-11-13 to 2026-11-15)

Written 2026-11-21 when Sean cleared his queue ("make sure that whatever wasn't captured is captured, as long as it doesn't overwrite
any new things"). Everything below was already in `playbook_records` (ve-near-me, ve-brand-kit) and the history files; this file only
points to it and marks what later sessions changed. Nothing here overrides a newer decision.

## Done and live (unchanged since)
- **Near me** (playbook `ve-near-me`): the Directory doors' counts and header follow the country (deb8e07); counts match the All list,
  supermarket chains not counted (91ca4c9); "Which one?" for a city name that is more than one city, rpc `ve_search_place_choices`
  (migration `20261113_ve_search_place_choices.sql`, merge 470884f); the dictation mic follows its field (5b54281). History:
  `docs/history/directory.md`. Both open items of checkpoint 999 are closed by these.
- **Depot Ambassadors and Invites** load again (b10f0f1): an apostrophe in "the Passport's 1,100" had broken both since 2026-11-11.
- **Guide art audit, RETIRE** (Sean's picks, `ve_feedback` 75188017, 2026-11-13): the 57 retired pictures are off the site (78a605b,
  checked live 2026-11-15).

## Superseded by later sessions (keep theirs)
- The 2026-11-13 sweep's treatment of guided walkthroughs (dark scene kept, orange Next, through `ve-look.css`) was replaced on
  2026-11-16: `/partners` was found to be an old-look parent; the kit's Web part (`/public/ve-kit.css`, `/mocks/brand-kit/web`),
  `scripts/look-check.js` and the new walkthrough parent (`/partners/giving`) are the standard now (canon `canon-ve-brand-kit-web`,
  error `UI-BUILT-IN-OLD-LOOK`). Do not restore the 11-13 approach.
- The member dashboard's own parts were finished on 2026-11-15 (the 11-13 sweep had covered only its 17 side pages).
- `/groups/welcome` was rebuilt on the locked Guide layout on 2026-11-19 (playbook ve-holiday-guide).

## Still open (nobody has picked these up as of 2026-11-21)
1. **Guide art, UPDATE: 25 pictures to redraw** on the locked Guide scenes recipe, each in the shape of its spot:
   4, 8, 9, 22-26, 30-32, 34, 35, 38, 41, 43, 44, 54-57, 64, 65, 90, 92 (numbers on `/mocks/brand-kit/guide-art-audit`). Show Sean the
   first few before swapping in.
2. **Guide art, not yet marked by Sean:** 49-52, 66, 67, 98, 99 and 101-294 on the same page (his picks save on his device and send with
   "Send my picks to Logan" into `ve_feedback`).
