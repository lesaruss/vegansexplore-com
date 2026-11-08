# ve-feedback: the 8 broken Facebook addresses cleared (2026-11-08)

Playbook `ve-feedback`. Follows `2026-11-08-ve-feedback-facebook-review-list.md`.

## Done
- Sean chose **the 8 broken addresses** from the 48-item review list. Cleared: Good Kitchen + Market (`/search`), HAAM (`/p`),
  OverGreens (`/p`), PGH Green & Grains (`/p`), Renegade Vegan (`/https:`), Seoul Food D.C. (`/pg`), Soulicious (`/p`), Vegan Squad
  (a `/share/` link). Each old value is in `listings.details.social_removed.facebook` (value, why, at), and there are 8 `ve_listing_edits` rows
  (`meta.playbook` ve-feedback, `decided_by` sean). Migration note `20261108_facebook_broken_cleared.sql`.
- Checked live 2026-11-08: all 8 pages show no Facebook link and have no page errors. Four of them (Good Kitchen, OverGreens, PGH, Seoul
  Food) are Being vetted, so visitors see the members-only gate. Their server-rendered HTML was checked as well: no stored Facebook value.

## Still open
- 32 "Not available" and 8 "Came back empty" (in the review list): left on the listings until someone checks them while signed in to Facebook.
- Honest Cuban's new Instagram and Facebook (it is among the 32).
- Vegan Squad's share link may have pointed at a real page; if Sean knows the page, add it in Edit listing.
