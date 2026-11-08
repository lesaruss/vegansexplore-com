# ve-feedback: the remaining Facebook links, hidden and queued (2026-11-08)

Playbook `ve-feedback`. Follows `2026-11-08-ve-feedback-facebook-broken-cleared.md` (branch `claude/compassionate-tesla-i6nt9t`).

## Done
- Sean checked pages signed in and found that the stored links often fail while the business's page still exists under another address
  (found by searching). He found 4; they are replaced:
  Coconutz Fusion Cafe (`facebook.com/pages/Coconutz%20Fussion%20Cafe/104929476216624/`), Darbster (`facebook.com/DarbsterBistro`),
  Divine Leaf Vegan (`facebook.com/profile.php?id=61583833435493`; Sean pasted it unlabeled, Logan matched it by the page's own title),
  Bar Bombón (`facebook.com/barbombon`).
- Sean: searching every page himself is not a good use of his time. Hide what is not confirmed and give the task to a Community Manager.
  The other 36 have no Facebook button now (`facebook` null). Each old value is in `details.social_removed.facebook`, and there are
  40 `ve_listing_edits` rows (`meta.playbook` ve-feedback, `decided_by` sean). Migration note `20261108_facebook_hidden_pending_confirm.sql`.
- Checked live 2026-11-08 in a browser at 390 px: all 40 pages load with no script errors. Only the 4 replacements carry a Facebook link
  (the footer's own link aside). Coconutz and Bar Bombón are Being vetted, so visitors see the members gate; the server-rendered HTML has
  their new links.

## Queued in `ve-community-directory`
- A Community Manager or helper, signed in to Facebook, searches each of the 36 by name and puts the right page in Edit listing (Contact and
  links), or leaves it empty. The list query is in the migration note and the playbook record.
- Honest Cuban by VCC is one of them; it also needs its new Instagram (`@honestcuban` seen, not confirmed).

## Lesson
- A Facebook link that fails signed out is not proof the page is gone; the page often moved to a numeric or `/pages/` address.
  The database can read a public page's title with `net.http_get` and a `facebookexternalhit/1.1` user agent (worked for a `profile.php?id=` page);
  this build session's proxy refuses facebook.com.
