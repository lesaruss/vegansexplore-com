# Handoff 2026-11-21: ve-social-schedule, the 2026-11-15 chat wrapped (nothing lost, nothing newer overwritten)

Sean cleared this chat from his queue ("make sure that whatever wasn't captured is captured, as long as it doesn't overwrite any new things").
Checked against everything newer first: the playbook rows of Nov 18 to 19 (Paris launch, Sean's faces-first direction, SoFlo Vegans connected,
clip calls, the podcast spotlight reel locked) and main as of 3f4a8b9. Nothing newer was changed.

## Landed with this wrap
- Branch `claude/optimistic-goodall-fa2j04` (which carried the unmerged `claude/sweet-ritchie-oiq411`) merged into main. Conflicts in CLAUDE.md,
  `docs/history/social.md` and `docs/history/guides-standards.md` kept main's text and added this chat's after it; the 13 existing files the
  branch changed (the six city launch images, the roster mock) had no newer change on main.
- Canon: `canon-ve-design-team` gained `faces_first_2026_11_19` (Sean's Nov 19 words; it outranks the older new-Guide-art rule);
  `canon-ve-city-carousel` gained `our_template_2026_11_15`. Migration `20261121_ve_social_wrap_canon.sql`.

## Open, for whoever picks up ve-social-schedule
1. **Week of Nov 23**: 17 slots proposed, batch `week-2026-11-23` (views `public/social/week-2026-11-23/grid-preview.jpg`, `stories-preview.jpg`).
   They predate the faces-first direction. Recommendation: keep the four city carousels, skip or replace the Guide-led ThanksLiving pieces with
   business and people posts (the podcast spotlight reels when the episode videos arrive). Nothing there is approved.
2. **Founding 2 retake** before Mon Nov 23 9 AM ET: slides 2, 3 and 5 (live counts, event dates),
   `public/social/founding/direct-response/src/render.js` (now on main). A fresh-session scheduled task fires Sun Nov 22 10 AM ET.
3. **Bio link 3** back to the Holiday Guide on Nov 27: a fresh-session scheduled task fires Nov 27 12:05 AM ET.
4. Parked: the Social kit platform buttons run off the right edge on phones (HQ `KitSheet.tsx` `.sk-tabs`); the holiday menus post for the
   week of Nov 30 (Christmas menus); a Feed / Stories filter in Depot > Social.

## Start here
```sql
select created_at, left(body::text, 600) from playbook_records where slug='ve-social-schedule' order by created_at desc limit 10;
select to_char(slot_at at time zone 'America/New_York','Dy MM-DD HH12:MI AM') et, status, kind, title from ve_social_slots
 where brand_slug='vegans-explore' and slot_at >= now() and status<>'skipped' order by slot_at;
```
