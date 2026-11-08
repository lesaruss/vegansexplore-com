# brooke-sellers: Brooke's BrandDesk, then her way into Vegans Explore (plan, 2026-11-08, waiting on Sean)

Sean, 2026-11-08: walk Brooke through everything she needs to be fully set up. Build her BrandDesk first from what we already have
(her current back end), ask her only for what is missing, so she runs everything from it with the same insights, SEO and monitoring
as Vegans Explore. Then take her through Vegans Explore: the survey first; creator is likely, but only if she wants it.

## What exists (checked 2026-11-08)
- meatlessmuscle.com is our own static site (repo lesaruss/meatless-muscle, Vercel, our database).
- Her back end, `dashboard.html` (Coach OS, Supabase Auth login): Overview, Leads and applications, Clients (2,135 contacts), Check-ins
  (3,353), Purchases (GoHighLevel orders 562 plus digital sales 38), Insights (GA4 via `ga4-meatless-muscle-report`), Your plan, Settings
  (GoHighLevel connection). Tables `coach_os_*`, RPCs `coach_os_has_access`, `coach_os_has_financial_access`, `coach_os_clients_page`.
- HQ BrandDesk has a `meatless-muscle` brand and brand kit (logo, colors, type locked; voice and story drafted). Every BrandDesk page is
  a staff route: a client cannot sign in to it today. Her Vegans Explore BrandDesk account (Managed by us) exists (26572b91).

## Part 1: her BrandDesk (B1 to B7)
- B1 Client sign-in: Brooke signs in to hq.lesaruss.ai and sees only BrandDesk > Meatless Muscle (a brand role table, staff routes
  unchanged for everyone else). Prototype for every client.
- B2 Coach OS becomes BrandDesk rooms: Clients (coaching clients, check-ins, purchases, leads), read and written through the same
  `coach_os_*` tables and RPCs, so nothing moves and her old dashboard keeps working until she switches.
- B3 Insights: GA4 (exists), Search Console, Social (her channels in Metricool), Podcast (Vegans Who Lift is already a Captivate show).
- B4 Signal: page scan, titles and descriptions, broken links (`scripts/check-links.py`), uptime.
- B5 Website: her site's pages, Books & Guides, the YouTube series (`ve-youtube` playlists), and changes she asks for.
- B6 Brand kit: lock voice and story with her answers.
- B7 The setup walkthrough: one guided page, step by step, each step done on its own or asked of her:
  confirm her accounts, add her card, voice and story, Search Console and Metricool access, GoHighLevel kept or retired, her first look
  at each room. Done means: she can do everything from BrandDesk.

## Part 2: Vegans Explore (V1 to V3), only after Part 1
- V1 The Explorer survey (everyone's door), her answers telling us where she stands.
- V2 The paths page: Creator shown first because her answers point there, the others beside it, all optional. If she does not want
  the creator path, we stop there and respect it; she is a member and keeps her BrandDesk.
- V3 If she chooses Creator: the creator survey, her Creator Guide (For Brooke tab), her People page as her media kit.

## Hold
The resend email (Depot > Outreach draft 4fbbd9f4) waits until Part 1 is ready; it becomes the email that opens the walkthrough.
