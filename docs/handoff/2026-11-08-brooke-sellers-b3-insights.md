# brooke-sellers: B3, BrandDesk > Meatless Muscle > Insights (2026-11-08)

Playbooks: `brooke-sellers` (with `branddesk-production-wing`). Logan, build mode.

## Sean's rule (LOCKED 2026-11-08, canon `canon-template-gate` v5, template map "Analytics or insights for a client")
"The analytics needs to be set up just the same way our Vegans Explore analytics are set up. No freestyling... the Vegans Explore is locked in of
how I want the information to be shared for our clients as well." A first version with its own layout was rejected and removed.

## What it is
BrandDesk > Meatless Muscle > Insights is the staff Insights room itself (`components/branddesk/InsightsRoom.tsx`) mounted by the client desk with
`client={{ coach }}`: the same header, period dropdown, toggles, tiles, lines and tables, address `?view=insights&in=<part>&range=`.
- Toggles for a client: **Web** (GA4 433904174), **Clients** (new, Coach OS: new leads with bots left out, new clients, check-ins, people checking in,
  sales and paid orders when Coach OS gives money access, check-ins and leads by day, newest leads), **Social** and **SEO** ("waiting on one step from you"
  with the Show me how links until connected), **Podcast** (Vegans Who Lift; Overview, Episodes, Audience; no Uploads), **Analysis**.
- Never shown to a client: Ads, Campaigns, Chapters, Site sections, Members, Costs, Health, podcast Uploads.
- `/api/branddesk/insights`: staff as before; a non-staff session must hold a seat on that brand and may run only web_analytics, podcast, seo, analysis
  (sent as ops, no member) and coach_os (read with their own session, so Coach OS's row rules decide). `middleware.ts` lets a session reach that one path.
- `lib/clientInsights.ts` (`coachInsights`, `looksJunk` = the database's `coach_os_looks_junk`). `Problem` in `insightsKit.tsx` never renders an error object.
- vegansexplore-com: `branddesk-insights` `PODCAST_SHOWS['meatless-muscle']` = Vegans Who Lift, deployed 2026-11-08 (source sha256 93656216 matched).

## Proven (signed in as a throwaway example.com client, removed after)
Preview, 1440 and 390 px, every toggle, no page errors, no sideways scroll; 30 days (Oct 9 to Nov 7): leads 45 (69 with 24 bots), new clients 42,
check-ins 167, sales $91.96, each equal to SQL; website 141 visitors; Vegans Who Lift 206 downloads.

## Found
- Her GA4 has data only from Oct 30, 2026, so the template's compare reads "+31200%" for now (left as the template shows it).
- 24 of 69 leads in 30 days are bots; the `leads` table is not filtered at intake. One Coach OS check-in is dated Dec 12, 2026.
- Chromium's tunnel to some `*.vercel.app` hosts is refused while curl works: route the browser's requests (GET and POST) through curl. A new share link can take ~40 s to work.
