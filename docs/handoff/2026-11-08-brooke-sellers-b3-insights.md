# brooke-sellers: B3, BrandDesk > Meatless Muscle > Insights (2026-11-08)

Playbooks: `brooke-sellers` (with `branddesk-production-wing`). Logan, build mode. **Built, not merged.**

## Where
- HQ branch `claude/brooke-insights` (d346430), built on top of `claude/brooke-show-me-how` (045f277) with HQ main merged in. Merging it also merges Show me how,
  so merge Show me how first, or merge this one to take both.
- vegansexplore-com branch `claude/brooke-insights` (fe4bab4): `branddesk-insights` gets `PODCAST_SHOWS['meatless-muscle']` = Vegans Who Lift.
  **Already deployed** (ve-function-deploy, source sha256 93656216... matched; main's file was the live one first). It only adds a brand row; nothing else changed.
  Merge this branch so main matches live.

## What it does
BrandDesk > Meatless Muscle > Insights (`?view=insights&r=7|30|90|365`, default 30; through yesterday, Eastern, against the period before):
- **Your business** (Coach OS, read with the client's own session, so Coach OS's row rules decide): new leads (bots left out by the same test as
  `coach_os_looks_junk`), new clients, check-ins and people checking in, sales (paid and completed; only with Coach OS money access) and the newest leads.
- **Your website** (GA4 property 433904174 through `branddesk-insights` web_analytics): visitors, page views, visits, engaged visits, by day, top pages,
  where visitors came from, top countries.
- **Vegans Who Lift Podcast** (Captivate): downloads with the compare, a day, past 12 months, all time, by day.
- **Search** and **Social**: "Waiting on you" with the Show me how links (`?how=search-console|instagram|youtube|tiktok`).
- Files: `lib/clientInsights.ts` (server only; the brand is fixed by the page, never from the browser; the function called with the admin token, read actions
  only), `components/branddesk/client/ClientInsights.tsx` (uses the Clients room's tiles), wired in `app/client-desk/[brand]/page.tsx` and `ClientDesk.tsx`.
  V's Insights line changed (text draft).

## Proven (2026-11-08, signed in as a throwaway client on example.com, removed after)
- The address stayed `/branddesk/brands/meatless-muscle` (middleware rewrite), 1440 and 390 px, no sideways scroll, no page errors.
- Last 30 days (Oct 9 to Nov 7): leads 45 (69 with 24 bots), new clients 42, check-ins 167, sales $91.96, each equal to SQL; website 141 visitors; VWL 206 downloads.
- Cleanup: seat, Coach OS access and login deleted (0 left), `ve-once-desk-proof` back to the 410 stub (verify_jwt on).

## Found
- Her GA4 has data only from Oct 30, 2026 (the period before shows ~0); the page says so and does not show silly percentages ("Too little the period before").
- 24 of 69 leads in 30 days are bots (random-letter names); the `leads` table is not filtered at intake.
- One Coach OS check-in is dated in the future (Dec 12, 2026).
- Chromium's tunnel to some `*.vercel.app` preview hosts is refused while curl gets through: route the browser's requests through curl (Playwright `route`).
