# branddesk-production-wing: the Depot home, the tour standard, and the Depot tour lookbook (2026-11-07)

Logan and V, one chat. Everything below is on `main` (last d46f310) and live on vegansexplore.com unless marked otherwise.

## Decisions Sean made

1. **The Depot stays.** It is how Vegans Explore runs the platform; BrandDesk is how a brand markets itself. They overlap only in Social, Ideas,
   Playbooks, Outreach and Analytics. Audit: `docs/proposals/depot-to-branddesk-audit.md`.
2. **Ideas lives in the Depot**, its own section, with Feedback beside it ("it's kind of buried in the blueprint"). This supersedes "Blueprint > Ideas
   holds every idea" (2026-11-06). **Open:** another chat built uploads and Logan's read into HQ's Blueprint > Ideas the same day (HQ main f60acd9,
   `blueprint_ideas`); the two idea stores (`ve_ideas` here, `blueprint_ideas` in HQ) are not merged. Bring Sean a recommendation.
3. **Depot sections**: Directory (with Secret Shopper), Logos, Content (with the Library), Bounties (Bounties, Check-ins, Submissions, Watchlist),
   Guides, Ideas, Demos, Moving to BrandDesk (People and everything relationship: each stays working until BrandDesk does all of it), Trash bin.
   Admin and Site and QA are gone. BrandDesk is not in the Depot.
4. **BrandDesk inside Vegans Explore** (planned, not built): one app, two doors (vegansexplore.com/dashboard/branddesk and hq.lesaruss.ai/branddesk),
   served by passing the pages through from HQ (not an iframe: Safari blocks sign-in in frames), with a sign-in bridge. Same database, so edits show in both.
5. **The tour standard** (canon `canon-ve-guide-tour-standard`, now v3): every Guide's Overview is a tour; each section's beat is its own recorded chapter,
   which doubles as that page's **Summarize this page**; the Guide is hidden on other pages as **Ask <Guide>**, a chat with suggestions. V narrates the
   Depot and BrandDesk. **v3: the tour is a video** (decided first on the Nonprofit Guide): script, recorded chapters, a **lookbook** approved before any
   animation, lip-synced on-camera moments (about 3 s each, start, middle, end), B-roll of the real pages, then the edit. It goes on YouTube, is
   downloadable, and is cut into clips. The Start here card and the Overview standard are superseded.
6. **White, never a dark stage**, for every mock and walkthrough (`vg-light` in `public/ve-guided.js`; CLAUDE.md and `canon-sean-interface-defaults` updated).

## Built and live

- **The Depot home** (`/admin/depot`): tiles with today's counts (`ve-depot` `home`, `ve_depot_counts()`), search by tool name, sections, the trash bin
  (13 retired tools, Restore, nothing deleted; a retired page opened by its address says so). Library moved to `/admin/depot/library`. Go to menu shows each
  section once. Migration `20261107_depot_home.sql`.
- **Depot > Guides > Guides and tours** (`/admin/depot/guides`): every tour's back end: lookbook (Approve / Redo with a note), script and recordings
  (each with its word-for-word check), video. Tables `ve_video_tours`, `ve_video_chapters`, `ve_video_shots` (migration `20261107_tour_backend.sql`,
  applied through the one-time `ve-once-tour-tables`, now the 410 stub; named ve_video_* because `ve_tours` is the old Tours feature).
- **The Depot tour**: 13 chapters in V's voice, all checked with stt (`geekfon-media/voice_samples/v/depot/tour-<n>-v1.mp3`, 1:56), 19 shots: V on
  camera at chapter 1 (0 to 2.4 s), 9 (0 to 2.5 s), 13 (6.9 to 9.6 s) from her existing frames (`artists/v/business-tour/`); 12 real Depot captures at
  1920 x 1080 (`vegan-media/media/tours/depot/`); 2 illustration ideas (chapters 7, 9). Script `docs/proposals/depot-tour-script.md`.
- Mock of it all: `/mocks/depot/` (14 slides, white).

## Not proven

- The Depot home and the Guides page were clicked through in a browser with a stand-in super admin sign-in and stubbed server answers. Sean's first real
  visit is the first real use of Approve and Restore.

## Next, in order

1. Sean approves the Depot lookbook in Depot > Guides and tours.
2. Lip-sync V's three moments (Wan 2.7 from her start frames, each audio cut held to 3 s), draw the approved illustrations, edit the video (chapter markers),
   put it on the page, YouTube and the Video tab.
3. Load the Nonprofit Guide (Dani) tour into Depot > Guides and tours (the other chat has her approved script).
4. Logos as its own tool: category pills, Most viewed sort (views are thin: about 545 views across 562 logo-less listings in 30 days, so votes break ties), city.
5. Better logo suggestions: socials read from their own site, Facebook page picture (Apify), Google listing photos (inside the $50 Google cap), then re-run
   the 755 that found nothing. Today the sweep reads only website and Instagram.
6. The Restaurant Guide tour (Liz): script `docs/proposals/restaurant-guide-tour-script.md` waits on Sean; build it as a video per v3.
7. BrandDesk inside Vegans Explore (pass-through and sign-in bridge); People in BrandDesk (one roster, a pill per group); Insights gains the Depot's
   Analytics tabs. Then the Moving to BrandDesk tools leave the Depot one at a time.
