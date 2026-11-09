# ve-chapter-rankings: Depot > Next chapter suggestions built

Date: 2026-11-09. Playbook `ve-chapter-rankings`.

## Done
- **Depot > Next chapter suggestions** (`/admin/depot/next-chapters`, Ideas group in `TABS`), copied from `admin/depot/feedback.html`:
  New / Added / Set aside / All with search; one suggestion per view (who, email, their profile, their chapter, when, why);
  Add to the board (name, line under it; makes an open `ve_next_chapters` row, slug from the name; if that slug exists it asks to
  link the suggestion to it); Set aside (note required); Back to New. The Board tab: every place with art and votes, Hide, Mark
  opened (pick the chapter it became), Back on the board.
- `ve-votes` v10 (commit 4e3b141, source sha256 3b116cb6 matched; main and live were both 06e16784 before): `next_admin_list`,
  `next_admin_decide`, `next_admin_place_save`, super admins in good standing only. The suggestion email now links the Depot page.
- The table already had `status`, `note`, `added_slug`; no column change.
- Inbox: `ve_inbox_items` gained source `next_chapter` (New only, `[TEST]` members left out), linking `#s/<id>`. Migration
  `20261109_next_chapter_suggestions_inbox.sql` patches the live definition in place (safe to run twice).
- Proven live 23 of 23 (`scripts/supabase-once/next-chapters-proof.ts`, function now the 410 stub): Inbox row, signed-out 401,
  member 403 on all three actions, set aside needs a note, add, add twice refused, same place links, hide leaves the public board,
  bad hub refused, opened as London, unknown place 404. Every test row removed (0 suggestions, 12 places after).
- Screenshots at 1440 and 390 px beside Feedback against mocked answers: same family, no errors, no sideways scroll.

## Not done
- Not clicked signed in as a real super admin on the live page (the actions are proven live; the page was checked with mocks).
- Show me (a sample hub per place), podcast listener places on each card.
