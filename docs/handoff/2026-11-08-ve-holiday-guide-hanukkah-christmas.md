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
