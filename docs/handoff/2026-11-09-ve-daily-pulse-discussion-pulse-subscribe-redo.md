# ve-daily-pulse-discussion: Pulse subscribe redo, Facebook bounty feature, wrap-up (2026-11-09)

## Done and live
- **Facebook bounty feature as a tile** (main afc4b20): feature `0921f35b` links `/bounties?campaign=confirm-facebook`; `isBounty` in
  `public/ve-pulse-topics.js` reads absolute and relative /bounties links; features (`feature_id`) never file under "In <City>"
  (migration `20261109_pulse_features_bounty_url_topic.sql`). Greyhound feature `54c8c359` is a draft in Ideas (topic animals), waiting on Sean.
- **Pulse subscribe redo** (main 0f40100): on `/pulse` the search and the subscribe sit half and half (`#pulse-top`, `#vps-slot`), stacked at 760 px.
  Subscribe opens "Choose your Daily Pulse" (cities up to 3, every day / Mondays, London box enforced), Confirm shows Check your email.
  Articles: the same form as a card at the foot. Exit pop-up holds it. Members not required.
  `public/ve-pulse-subscribe.js?v=2`. **Depot > Content > Pulse subscribers** (`/admin/depot/pulse-subscribers`; `ve-pulse-subscribe` v5 `list`,
  super admins). Migration `20261109_pulse_subscribers_source.sql` (`ve_tasters.pulse_source`, `pulse_requested_at`).
- Checked live at 1440 and 390 px with the subscribe request intercepted (no email sent). The Depot list has not been seen signed in as an admin.

## Checked, nothing to do
- Monday's 13 Pulse drafts had every topic. Facebook bounty: 0 member submissions (one released test claim), nothing to restore or pay.

## Open
1. **Check the published Mon Nov 9 Pulse** (after 10 AM ET, when LA is out): South Florida, New York, London, Los Angeles at 1440 and 390 px:
   pictures filled, every story under a topic (no "More news"), the Facebook bounty the first bounty tile and not a story, tiles 320x132
   (269x132 phones), no script errors. Fix in `public/ve-pulse-topics.js`, bump `?v=` in `pulse.html` (now 7), confirm live.
   The scheduled check for this chat was deleted at wrap-up; the next chat does it.
2. Sean: open Depot > Pulse subscribers signed in; try Save and Edit on a Pulse card (steps: /pulse?city=south-florida, open today's topic,
   Save on Spotlight, see it in My Saves, unsave; Save a New in the Directory card; More > Edit, save unchanged, page reloads; signed out Save shows the members window).
3. Sean: BrandDesk > Vegans Explore > Insights > Ads > By banner, signed in.
4. Facebook bounty submissions: restore with the SQL in `docs/handoff/2026-11-08-ve-community-directory-facebook-bounty.md`, then pay.
5. Articles are cached up to an hour; old ones may show the old box until refreshed.
