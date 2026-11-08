# ve-holiday-guide: Holiday Menus v3 and For Businesses v2 on the sample restaurant (2026-11-08)

Branch `claude/eloquent-tesla-v5xk0l` (not on `main`; Sean merges).

## Done
- `theo-menus-v3.mp4` (18.5 s, Theo's tour chapter 4, same shot order as v2): Theo, the filters on South Florida, Green Leaf Kitchen's
  ThanksLiving menu card (family tray, coconut rice and beans, garlicky greens, Key lime cheesecake; from the sample's own news post),
  order-by facts and Saved, Tell us about a menu, Theo. Replaces the empty "No Holiday Menus Yet" shot.
- `theo-business-v2.mp4` (11.2 s, chapter 7): Theo, the real menu form filled in as Green Leaf Kitchen (Alex Rivera, the sample owner),
  its card as featured, every holiday's close date, Theo. Replaces the long text capture and the illustration.
- Every shot carries an orange SAMPLE tag top-left (top-right was under the phone card's Expand pill). No Friendsgiving anywhere.
- Captured from the live pages with Playwright, `ve-holiday` answers mocked in the script (nothing saved). The form's "N days left" is hidden.
- Uploaded through `ve-once-holiday-video` (back to the 410 stub, run key discarded). Served files match the cuts (md5).
- `VIDEO.menus = 'v3'`, `VIDEO.business = 'v2'`, captions copied (same voice, same timing), Guide script `?v=15`.
- Checked the branch at 1440 and 390 px (served locally, live data and storage; this sandbox cannot open `*.vercel.app`): both videos load and
  play, captions attached, no script errors, no sideways scroll.

## Open
- Merge, then a quick live look at `/guides/holiday-guide#/menus` and `#/business`.
- Theo's 9 Hanukkah and Christmas lines (`docs/proposals/holiday-guide-theo-lines.md`) are still drafts: nothing recorded until Sean approves.
- Re-cut Holiday Menus with real menus once some are approved (ThanksLiving closes Nov 18).
- Kwanzaa waits; locking the Guide as the template is Sean's call.
