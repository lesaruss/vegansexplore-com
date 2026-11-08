# ve-daily-pulse-discussion: visual Pulse, story pictures preview, Bounty of the day (2026-11-08)

Also touches `ve-ads-studio` (one campaign per banner, Holiday Guide ad).

## Done and live on main
- **No "Friendsgiving"** in our Pulse copy: post fc4d32fe fixed (title, body, action, reply, question); writer rule added to `lesaruss_dispatch_sources` `pulse_topic_write`.
- **From Vegans Explore looks like a newsletter** (`public/ve-pulse-topics.js`, `VEPulse.hydrate`, `pulse.html` loads `?v=5`): Spotlight is the Directory card with Vote; New in the Directory is a sideways strip of Directory cards plus a "See all N" tile (`ve_pulse_house` caps it at 12, logos first); the episode is the show's own row with Play and Save.
- **Join free**: the Pulse join note button reads Join free and goes to `/survey?s=explorer` (comes back through `ve_after_survey`). LESARUSS.ai keeps its own.
- **Bounty of the day**: `ve_pulse_house` adds `bounty_day` (one open campaign in the chapter or remote, least recently shown in that city first via `ve_pulse_house_log` kind `bounty_day`, then most points; skipped while a live `ve_pulse_features` story links to it). Card has See the jobs and See all bounties. Facebook bounty stays the lead feature Nov 9 to 15. Migration `20261108_pulse_bounty_of_the_day.sql`.
- **Holiday Guide ad** replaced the Nonprofit Guide ad in its three slots (campaign `...0c0de5a14008`, `/go/ve-guide-holiday`, `ads/guides/guide.html?g=holiday-guide`, button reads Free). Nonprofit campaign 14005 paused; it stays the Resources tab on nonprofit/rescue/sanctuary listings and in the catalog.
- **By banner** in BrandDesk > Vegans Explore > Insights > Ads (`branddesk-insights` v17 `ads.banners`; HQ `InsightsRoom.tsx` d758744c): seen, clicks, click rate per banner vs the period before. A banner = campaigns named `<Sponsor> - <Banner> (<format>)`. Not yet seen signed in.

## Built, waiting on Sean
- **Story pictures, preview only** behind `?pics=1`: https://vegansexplore.com/pulse?city=south-florida&post=fc4d32fe-f425-4bf9-828a-2e5668f96cfc&pics=1
  - `ve-pulse-pics` edge function (admin token, verify_jwt false, v3): reads each story's og:image, copies it to `vegan-media/media/pulse/stories/`, sets `stories[n].image`. 5 of 6 on South Florida (PETA refused).
  - First story with a picture in each section is a large lead; the rest thumbnails.
- **When Sean approves**: remove the `?pics=1` gate in `ve-pulse-topics.js` (the `pics` var), bump `?v=`, and run `ve-pulse-pics` on every published Pulse (call it from `ve_pulse_auto_publish` via pg_net, or a cron 15 minutes after 7 AM local).

## Open
- Sean looks at By banner signed in.
- Facebook bounty: verify submissions, restore pages (SQL in `docs/handoff/2026-11-08-ve-community-directory-facebook-bounty.md`), pay.
