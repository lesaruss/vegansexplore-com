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

## Update (second half of 2026-11-03)
- YouTube-video episodes use the show-page episode row (c477c60); `?t=` moment links keep the YouTube player.
- On this episode lists Discussed people from `ve_content_mentions` (1d6dd86). Klaper credited Guest on `klaper-moving-medicine-forward-nutrition` and `nutrition-blind-spot-modern-medicine` (data only, `ve_person_credits`).
- Playbook: `podcast-network-transcript-upload` (briefings + playbook_records, brand vegans-explore). Open while Sean transcribes all four shows; closes when every episode with audio has a transcript (132 of 278 on Nov 3: VE 126/143, SoFlo 2/59, Pre-Vegans 3/19, VWL 1/57). Step 1 of `ve-content-index` moved there.
- Open: audit episodes with a guest but no Guest credit; rebuild mentions after each transcript batch; the Studio page for the new playbook was checked by structure in the database, not in a browser (hq.lesaruss.ai is unreachable from the sandbox).
