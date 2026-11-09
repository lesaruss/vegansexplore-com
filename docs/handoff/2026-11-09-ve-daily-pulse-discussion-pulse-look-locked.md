# ve-daily-pulse-discussion: Pulse look locked, story pictures live (2026-11-09)

Also touches `ve-ads-studio` (By banner). Follows `2026-11-08-ve-daily-pulse-discussion-visual-pulse-bounty-day.md`.

## Live on main (merge 9391d96, Sean: "merge it to main")
- **Stories**: no big lead; every story is a small picture row (`story()` in `public/ve-pulse-topics.js`). The ?pics=1 gate is gone.
  Grouped under eyebrows: "Top news", then "In <City>" (the city's own), then topics in this order: Food and drink, For the animals,
  Health, Community, Business, Film books and media, More news (`TOPICS`). Never "national" or "international" (Sean: we serve the
  Vegan community everywhere). A story linking to `/bounties` shows as a bounty tile instead.
- **The writer** (`lesaruss_dispatch_sources` `pulse_topic_write`) gives every story a `topic`: food, animals, health, business, culture,
  community. Nov 8 posts and Nov 9 drafts were tagged by hand.
- **Heads up** events wear the calendar's date tile (`dateParts` reads "Sun, Nov 8, 1 pm").
- **From Vegans Explore**: Spotlight, Bounties of the day, New in the Directory, Listen are all the Directory card at one size
  (320x132, 269x132 on phones), each in a row that slides sideways. Episode = card with Play and Save.
- **Bounties of the day**: `ve_pulse_house` returns `bounties_day` (up to 4, rotating via `ve_pulse_house_log`), `bounties_all_url`;
  `bounty_day` stays the first.
- **The Directory card everywhere gains Save** (`saveBtn`, `bindSave` in `public/ve-region-directory.js`, ve-auth save_listing;
  signed out: the members window). Not on LESARUSS.ai (`VE_BRAND`). Admin More (Edit, Review) works on cards drawn outside the
  Directory: `VERegionDirectory.admin(cb)` before `card()`, then `wire()`; Edit after save reloads the page.
- **Pictures fill themselves**: cron `ve-pulse-pics` (every 15 min at :06) runs `ve_pulse_pics_tick()`, which calls the edge
  function for each Vegans Explore Pulse published in 36 hours with no `briefing.pics_at` (stamped first, tried once). Switch:
  `ve_site_settings` `pulse_pics.auto`. Nov 8: 68 of 74 stories with a picture.
- Migrations `20261109_pulse_pics_auto.sql`, `20261109_pulse_topics_bounties_day.sql`.
- Checked live at 1440 and 390 on South Florida and New York: no errors, no sideways scroll, tiles all one size.

## Open
- Not proven: Save and Edit clicked signed in as Sean (needs his session).
- Check the Nov 9 Pulse after 7 AM local in a few cities: pictures filled, writer's topics present, bounty tiles (the Facebook
  bounty, a live feature Nov 9 to 15, should be the first tile, not a story).
- By banner: data correct through `branddesk-insights` `ads` (11 banners); the HQ page not yet seen signed in.
- Facebook bounty (`confirm-facebook`): no member submissions yet. Restore SQL in
  `docs/handoff/2026-11-08-ve-community-directory-facebook-bounty.md`.
- The card's Save now also shows in the Directory, city hubs and Guides (one card). If Sean wants it only on the Pulse, say so.
