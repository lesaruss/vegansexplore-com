# ve-holiday-guide: Hanukkah and Christmas sections (2026-11-08)

Branch `claude/dazzling-archimedes-52cbrv`, built on top of `claude/lucid-pascal-zxvmu4` (the ThanksLiving videos branch), so merging this
branch brings both. Not on `main`; Sean merges.

## Built
- **One Guide, holiday by holiday**: `HOLX` in `guide-scripts/holiday-guide.js` names each holiday's pages (ThanksLiving `recipes`, `store`,
  `menus`, `events`; Hanukkah `hanukkah`, `hk-recipes`, `hk-menus`, `hk-events`; Christmas `christmas`, `xm-recipes`, `xm-store`, `xm-menus`,
  `xm-events`) and its events filter. The menus, recipes, store and events views read the holiday of the page being drawn (`curHol`), so
  ThanksLiving's pages are unchanged. Menus load per holiday (`LIVE`, `loadLive`), events per holiday (`EVS`, `eventsUrl`).
- **Top row**: Overview, ThanksLiving, Hanukkah, Christmas, Give Back, For Businesses. A holiday leaves the row (and the Overview's sections)
  the day after it (`holPast`); its pages still open by link.
- **Hanukkah**: Ideas (5, flat icons; notes pointing to My Jewish Learning and Jewish Veg for the meaning of the holiday), Recipes (latkes with
  cashew sour cream, applesauce, carrot tzimmes, sufganiyot), Holiday Menus, Events (none on the calendar yet; the page invites hosts to add one).
- **Christmas**: Ideas (5), Recipes (mushroom Wellington, maple Brussels sprouts, cashew nog, gingerbread; mash and gravy point to the
  ThanksLiving recipes), At the Store (roasts, nog, butter and cream, baking; from VegNews's holiday roast guide and Go Dairy Free's nog list),
  Holiday Menus, Events (9 on the calendar).
- **Pictures** (Higgsfield nano_banana_pro, 20 credits): `public/guides/holiday/theo-hanukkah.jpg`, `theo-christmas.jpg` (store tee and apron,
  no costume), `r-latkes|applesauce|tzimmes|sufganiyot|wellington|sprouts|nog|gingerbread.jpg`.
- Page title and description name all three holidays; script `?v=13`.
- Checked locally at 1440 and 390 px against live data: every new page and the ThanksLiving pages, no script errors, no sideways scroll.

## Waiting on Sean
- Merge this branch (it carries the ThanksLiving videos branch too), then confirm live at 1440 and 390 px.
- Theo's nine new lines (`docs/proposals/holiday-guide-theo-lines.md`); recorded once approved. Until then Play is hidden on these pages.
- The recipes are drafts, not kitchen-tested.

## Next
- Re-cut the Holiday Menus video as `theo-menus-v3` once the first menus are approved (none yet).
- Kwanzaa (Sean, 2026-11-08: Hanukkah and Christmas only for now).

## Round 2, same day (Sean: the Overview video in Theo's frame, Play and Talk on one row, Expand on phones, Give Back and For Businesses videos)
- **Overview video**: `theo-overview-v1.mp4` (93 s, the whole recorded tour, chapters 1 to 8) plays in Theo's frame like the ThanksLiving pages;
  the "How to Use the Holiday Guide" card left the page (`videoCard()` is no longer called).
- **Give Back and For Businesses videos**: `theo-giveback-v1.mp4` (chapter 6, 11 s) and `theo-business-v1.mp4` (chapter 7, 11 s).
- All three follow the ThanksLiving rules: 1080 x 1350, Theo's still opening and closing on a slow push, phone captures and the Guide's
  illustrations cut on his words, voice 0.5 s in, bed `story-dining-v2` 19 dB under him, -15 LUFS. The events capture leaves out one
  organizer's event titled with Friendsgiving. Captions `public/guides/holiday/video/theo-<page>-v1.vtt` are timed to his pauses (sentence
  level, not word level). Uploaded through `ve-once-holiday-video` (back to the 410 stub).
- New Theo stills: `theo-overview.jpg` (welcoming), `theo-giveback.jpg` (at a sanctuary with a goat), `theo-business.jpg` (restaurant counter).
- **Play Theo and Talk to Theo** are equal halves of one row on desktop (CSS grid on `.dg-rail`, `grid-auto-rows:max-content` keeps the
  frame 320 x 400); with nothing to play, Talk takes the row. Phones already had them on one row (`ve-guide-corner.js`).
- **Expand** (phones): a pill like Hide me, in the top-right corner of Theo's picture (both pills do not fit side by side under 400 px),
  opens the page's video, or his picture, big in a lightbox, picking up where the frame's video was; Close or Escape. GA `video_expand`.
- Checked at 1440, 1366, 430, 390 and 360 px locally against live data: no script errors, the lightbox opens, plays and closes.
- **Template**: Sean (2026-11-08) wants this Guide to become the official Guide template once the Holiday Guide is finished and locked.
  Not locked yet.
