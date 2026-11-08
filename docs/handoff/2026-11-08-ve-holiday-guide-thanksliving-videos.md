# ve-holiday-guide: ThanksLiving dropdown, page videos, Theo per page, Events regions (2026-11-08)

Branch `claude/lucid-pascal-zxvmu4`, last commit 00a4e49 (pushed; not on `main`, Sean merges). Preview of that commit:
https://vegansexplore-fmakuhnnj-contact-2245s-projects.vercel.app/guides/holiday-guide (share link expires 2026-11-09).

## Done this session (all checked at 1440 and 390 px against the live data, no script errors, no sideways scroll)

1. **ThanksLiving section row is a dropdown** (Sean: the picture pills were hard to read and competed with At the Store's chips):
   "ThanksLiving" and a `.dg-sort` select (`#hgSubSel`, `subnav()`) under the crumb on the ThanksLiving page and its five sections.
2. **A summary video on every ThanksLiving page** (Ideas, Recipes, At the Store, Holiday Menus, Events, Listen): 12 to 19 s, 4:5,
   Theo's still opening and closing with a slow push, phone-size captures of the page and the Guide's illustrations cut on his words,
   his voice 0.5 s in, the podcast bed `story-dining-v2` at -19 dB, -15 LUFS. No lip sync, no credits for the video (Sean: stills are fine).
   `VIDEO` and `setVideo()` in `guide-scripts/holiday-guide.js`; files `vegan-media/media/guides/holiday/video/theo-<page>-<v>.mp4`
   (Ideas v1, the other five v2); captions `public/guides/holiday/video/theo-<page>-<v>.vtt` (shown above 900 px only).
   Play plays the video; a play button sits in the frame's bottom-left corner on desktop (`.hg-rplay`; `.hg-vplay` is the Overview's).
3. **Three new Theo lines recorded** (Sean: "Looks good"): `voices/holiday-guide/theo-recipes-v1`, `theo-store-v1`, `theo-listen-v1`,
   roster voice aFyw0oiXW7dzKF4o7woX, eleven_multilingual_v2, each matched word for word with stt. Ideas, Menus, Events use tour chapters 3, 4, 5.
4. **Theo's frame is one size and full width**: 320 x 400 (4:5) on desktop on every tab; the right column scrolls on a short screen.
   Phones keep the locked Guide card.
5. **A different Theo per page** (Higgsfield nano_banana_pro from his ThanksLiving still, store clothes only):
   `public/guides/holiday/theo-recipes|store|menus|events|listen.jpg`, set as `TABS[].pic` and each video's poster.
6. **Events**: Add your event and The whole calendar moved to the top and made smaller; a region dropdown built only from the events
   shown (US state, else country, else Online, with counts; `evRegion`), in the address as `#/events/<region>`.

## Tools used (cleaned up)

- Uploads went through the one-time `ve-once-holiday-video` (signed upload links), now the 410 stub. The run key lived only in the scratchpad.
- The build script and captures are in the session scratchpad only (not in the repo). To re-cut a video: same shots, new `-v3`.

## Open / next

- **Sean merges** `claude/lucid-pascal-zxvmu4` to `main` (it also carries the earlier items of this session: Hide me position,
  title case, At the Store filters and Suggest an Item, Listen header, Upload a Menu for super admins, ve-holiday v6).
- **Holiday Menus video shows "No Holiday Menus Yet"**: re-cut as `theo-menus-v3` once the first menus are approved.
- **The Events video** leaves out one organizer's event titled with Friendsgiving (never in our own copy or video).
- **ThanksLiving campaigns** (`thanksliving-2026-vegan` 34, `thanksliving-2026-plant` 56) were approved in BrandDesk and start Tue Nov 10
  (another chat, playbook `ve-outreach-buckets`); nothing to do here.
- Not done: Give Back and For Businesses have no video (voice only); Hanukkah, Christmas, Kwanzaa tabs.
