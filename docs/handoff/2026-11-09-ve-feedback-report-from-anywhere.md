# ve-feedback: report from anywhere, and Brion Hurley's follow-through (2026-11-09)

## Done and live
- **Report from anywhere**: in the Airport, Stadium & Arena, Theme Park and Supermarket Guides, Something missing and Comment ask
  "Where are you?": "I am at <venue> now" or "I am not there now". From away: no location, saved with `on_site` false, held for the
  team like every report, half the points when accepted (rounded up), 10 a member a day (`ve_venue_setting('daily_off_site')`).
  Every other kind stays on-site only (`on_site_only`). A `too_far` answer carries `off_site_ok` and the Guide suggests the choice.
  Depot > Venues reads "Not checked on site".
  - Migration `supabase/migrations/20261109_venue_reports_off_site.sql` (applied; patches `ve_venue_report_review` in place).
  - `ve-venues` v15 from 2287d67 (source sha256 matched).
  - Proven in a rolled-back block. Not yet seen in a browser signed in.
- **Reply sync** (HQ 04bdac6, email-replies-sync v5, HQ migration 087): reads contact@lesaruss.com and contact@vegansexplore.com, matches by sender.
- **Brion's reply** `reply-brion-hurley-2026-11-b` (BrandDesk campaign, draft) says report from anywhere is live (main 86bc60b).

## Waiting
- Sean: re-consent the contact@vegansexplore.com Gmail token (Client ID 450477549015-5udtc5emev5m13fkadmr8sf452ilih8m, secret in Key Room
  `GMAIL_CLIENT_SECRET`, scopes gmail.send + gmail.readonly), save it as `GMAIL_REFRESH_TOKEN_CONTACT_VE`.
- Sean: approve Brion's reply in BrandDesk.
- Logan: run email-replies-sync, confirm Brion's Nov 8 email is in `email_replies` matched to his send; check "Where are you?" at 1440 and 390 px.
- The Thai place, when Brion sends it. Four other Gmail tokens are revoked (optional re-consent).
