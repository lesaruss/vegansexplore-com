# Handoff 2026-11-03: mobile header, Apps modal, Area filter, Pulse episode pages

All live on main (last: d453ff2, Vercel production READY). Verified with Playwright at 390 and 1440 px.

## Done
- Mobile header: no floating mic on phones/coarse pointers (`ve-dictate.js`); Feedback inline left of Apps; right to left: hamburger, member square, Apps, Feedback; 38px squares, 6px radius, 6px gaps (`nav.js`, `dashboard/center-console.html`); desktop menu titles weight 800.
- Apps/LESARUSS launcher is a centered modal with X at <=900px or coarse pointer (HQ `public/shell/universal-bar.js`, loaded with `?v=20261103`).
- Directory filters: Area > All cities no longer overflows on phones (`ve-region-directory.js`, `.vrd-geo` min-width 0).
- Pulse episode pages (`api/pulse-article.js`): order = short description, player (the show page's episode row via `VEEpisodes.row`, docked player), Topics Covered, About the Guest, On this episode (all credited people: Guest then Host), In this story (excludes credited people), share. No guest line at the top.

## Open
- DONE 2026-11-03: YouTube-video episodes now use the show-page episode row too (default taken). Exception: a moment link (`?t=`) keeps the YouTube player, since the second is timed on the video.
- On this episode should also list people discussed, once Sean uploads transcripts (held until then).
- Sandbox cannot reach hq.lesaruss.ai, Captivate or mzstatic: audio and artwork not loaded in local tests.
