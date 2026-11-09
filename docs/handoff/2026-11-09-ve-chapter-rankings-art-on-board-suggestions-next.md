# ve-chapter-rankings: art on the board, the Depot suggestions page next

Date: 2026-11-09. Playbook `ve-chapter-rankings`.

## Done this session
- The "Where should we go next?" board (12 places) is live on `/communities` and the dashboard's Communities tab (merged and confirmed).
- Art for all 12 places, ready for launch (54 Higgsfield credits): `communities/next/<slug>/vertical.jpg` (1440 x 1920), `wide.jpg` (1920 x 1080),
  `square.jpg` (1200 x 1200, cut from the vertical), `thumb.jpg` (176 px). Originals in `vegan-media/media/communities/next-<slug>/`.
  Paths in `ve_next_chapters.art` (migration `20261109_next_chapters_art.sql`). Wynn logo removed from both Las Vegas pictures.
- The board shows each place's thumbnail (commit c4e5cea, live; checked at 1440 and 390 px, no errors). A place with no art keeps the pin.

## Not done: the Depot page for suggestions (Sean asked; not started before the wrap)
- Members suggest places through `ve-votes` `next_suggest` into `ve_next_chapter_suggestions` (0 rows on 2026-11-09); today they are only emailed.
- Build **Depot > Next chapter suggestions** (`/admin/depot/next-chapters`), copied from `admin/depot/feedback.html` (template gate):
  list of suggestions (New / Added / Set aside, search), one per view with who and why, **Add to the board** (creates a `ve_next_chapters`
  row, status open) or **Set aside** with a note; also the board's places themselves (hide, mark opened). Add a `TABS` row in
  `public/depot-tabs.js` (Directory or People section). Server: new `ve-votes` actions (`next_admin_list`, `next_admin_decide`,
  `next_admin_place_save`), super admin token, or a small new function. Needs a `status`/`note` column on `ve_next_chapter_suggestions`
  (check the table first). Check `ve-votes` live source against main before deploying (other sessions push to main).
- Then the Inbox row for a new suggestion (`ve_inbox_items` union) so it is not email only.

## Still open on the playbook
- Show me (a sample hub per place), podcast listener places on each card, the dashboard Communities tab checked signed in.
