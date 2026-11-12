# Handoff 2026-11-12: the business dashboard, shell and Home built; paused for the brand kit

Playbook: `ve-business-dashboard` (decisions also in `ve-holiday-guide`). Canon: `canon-ve-business-dashboard` v2, `canon-template-gate` v7.

## What Sean decided
- 2026-11-11, on the mock https://vegansexplore.com/mocks/business-dashboard/ : "Approved, lock it in and start building". The ask: "a dashboard
  for businesses and organizations... ways that they can contribute... opportunities for additional sponsorships... notifications each week on
  what they've missed via email... reach out to them directly through the platform. Once we get the mobile app, we can look into push notifications."
- 2026-11-12, after seeing it: "we've created a brand new look and feel for Vegans Explore... What we created... I don't even want to look at it
  right now." Pause, then continue in a new chat now that the brand kit is done ("now that the brand kits are completed").

## What is built and live (main a16bbda, merged 28f88ef)
- `business-dashboard.html`, served in the dashboard window at `/dashboard/business?l=<slug>&tab=<part>&pd=<view>` (`openBusiness` in
  `dashboard/center-console.html`; the Your business tile and its buttons open it; ve-frame-url keeps the address in step).
- Seven parts in one dropdown: Home, Your page, Media kit, Opportunities, Messages, Insights, Your plan.
  - Home: Needs you (checklist gaps, listing-check flags, a pending claim), New for you (`ve_dashboard_cards` + `opportunities`, titles once),
    Your week (views, visitors, taps, check-ins vs last week) from `ve-claims owner_dashboard` (days 7).
  - Your page / Opportunities / Insights / Your plan host the existing views of `public/ve-partner-dashboard.js`, mounted with the new
    options `{ only, tab, base, data }` (backward compatible; the listing page's `?tab=brand` dashboard is unchanged).
  - Media kit and Messages show a Coming card.
- Owner with one listing lands on it; several get a picker; super admins type any slug to preview.
- Proof: live at 1440 and 390, in the dashboard window and alone, no page errors, the dropdown moves the address. Sign-in and function answers were
  stubbed in the proof (real card and opportunity rows, made-up numbers). **Not yet proven with a real owner account.**

## Open, in order
1. **Restyle to the brand kit first** (Sean's call): read `docs/brand-kit/README.md`, canon `canon-ve-look-color-block`, `canon-ve-brand-kit-foundations`
   (`/mocks/brand-kit`). The look is live through `/public/ve-look.js` / `ve-look.css` under `html.ve-cb`; tune `business-dashboard.html` (and the
   `.vpd` views it hosts) there, beside the parent, at 1440 and 390. One orange action button per view. Then update the CLAUDE.md template row if the
   shell changes.
2. Media kit (build step 2). Note: another session pushed "Featured kit draft" to main (f74e8ef, f3464e3: share graphics render script on the locked
   templates, one tracked link per email). Read it first and feed the Media kit from it rather than building a second kit. Story frames today:
   `scripts/featured-stories/render.js`, zip `vegan-media/media/holiday/featured-stories/holiday-guide-featured-stories-v1.zip`.
3. Opportunities, 4. the weekly Monday email (only when there is news, email-send, Sean approves before anything sends; outreach is paused until he
   lifts it), 5. Messages.
4. Prove signed in as a real owner (a verified listing: 8 exist) once restyled.
