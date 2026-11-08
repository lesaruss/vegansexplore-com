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

## Then, same session (Sean)
- Green Leaf Kitchen's card shows its leaf mark, not the full logo; both videos re-cut and re-uploaded (served md5 matches).
- Menus post as soon as they are approved, never on the close date. The server already worked that way; the form's thank-you said a menu shows
  "when the Guide opens", now fixed, plus the form's countdown and the For Businesses line. `ve_holidays.promo_from` set to 2026-11-07
  (migration `20261108_holiday_menus_post_on_approval.sql`). The two ThanksLiving campaign emails only name Nov 18 as the last day to send,
  so they were left as approved. Guide script `?v=16`.

## Hanukkah and Christmas, same session (Sean: "I approve Theo's lines")
- 9 lines recorded in Theo's roster voice, all matched with stt (hk-recipes and xm-store retaken). 9 page videos cut and uploaded (served md5
  matches), captions in the repo, `VIDEO` wired, Play shows on every Hanukkah and Christmas page; checked at 1440 and 390 px, no errors.
- Sample tag only on the two Holiday Menus videos (the demo); real pages, events and illustrations carry none.
- Left behind: the temp table `tmp_theo_rec` and functions `tmp_theo_rec_next`, `tmp_theo_stt` (RLS on, no policies). The drop was held by
  the connector's approval box; drop them when the box can be answered.

## Open
- Merge, then a quick live look at `/guides/holiday-guide#/menus` and `#/business`.
- Re-cut Holiday Menus with real menus once some are approved (ThanksLiving closes Nov 18).
- Kwanzaa waits; locking the Guide as the template is Sean's call.
