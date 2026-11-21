# Handoff: the Media Room and the media list (playbook `ve-newsroom`), 2026-11-21

## Where it stands
- **Live and running:** the private media list, Depot > Content > Media outlets (`/admin/depot/media-outlets`, `ve-media-outlets`):
  about 1,000 outlets and 4,000 scored articles, the daily feed `ve-media-alerts` (cron `ve-media-alerts-daily`, 12:17 UTC), the Founding Press
  25 with contacts (`ve-media-contacts`) and one best contact each (`ve_media_pick_best`).
- **Locked by Sean:** the name Media Room; HQ Outreach as the one engine; the Pitch Gate (canon `canon-lesaruss-pitch-gate`); Sean approves
  every pitch; the Founding Press 25.
- **Waiting on Sean:** lock the Media Room mock, https://vegansexplore.com/mocks/media-room/ (press-first, after the journalist panel).

## Next, in order, once the mock is locked
1. Build the Media Room in HQ Outreach: the media list as the Media audience, the Pitch Gate as a step every pitch passes, the join survey
   with the press check (work email, or a show link for podcasters), the Media Room page with Open the kit and Request an interview, the
   digests, the refer link.
2. The starting bank of pitches through the gate: the research piece "How the Press Covered Vegan Life in 2026" (needs a method page, one
   chart and the data file; outlet level, no reporter scored; out early January), then two per brand as brands launch.
3. Only then: the invite to the Founding Press 25, each to its best contact, approved by Sean.

## Parked (not this playbook)
- The Russell's Roving Reporters TV pitch: held until the RRR build (the official launch is the moment; maybe FETC, cost unknown).
- The Pitch Gate for grants: its own session.
- LESARUSS 360 Finance and the launch week plan: playbook `lesaruss-launch-week`.

## Files
`supabase/migrations/20261113_ve_media_outlets.sql`, `20261113_ve_media_alerts_daily.sql`, `20261113_ve_media_contacts.sql`,
`20261113_ve_media_drop_other_brand_coverage.sql`, `20261115_ve_media_best_contact.sql`; functions `ve-media-outlets`, `ve-media-alerts`,
`ve-media-contacts`; the backfill script `scripts/supabase-once/media-outlets.ts` (one-time functions back to the 410 stub); the page
`admin/depot/media-outlets.html`; the mock `mocks/media-room/` (index.html, guide.js); `public/ve-look.js` and `ve-look.css` (Media frame).
History: `docs/history/outreach.md`.
