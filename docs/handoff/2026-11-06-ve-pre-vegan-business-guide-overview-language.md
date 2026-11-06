# ve-pre-vegan-business-guide: Maya recorded, Overview standard and Pre-Vegan language

2026-11-06. Playbook `ve-pre-vegan-business-guide`. Status: waiting on Sean.

## Done this session
- Merged to `main` (d184461, then 65914f9, d2aa9c7). Live at vegansexplore.com/guides/pre-vegan-business-guide, still `noindex`,
  no catalog card, not in the sitemap, `ve_guides` row unpublished.
- Maya's 13 lines recorded in her roster-profile voice (`sM8RysETdBj1LIqLd9tl`, eleven_multilingual_v2, Vegan spelled Veegan) at
  `vegan-media/media/maya/pre-vegan-business-guide/<key>-v1.mp3` (overview, overview-member, why, add, add-member, say, sourcing,
  make, found, claim, next, mylist, join). Each checked word for word with el-media `stt`: all 13 match.
- Wired as `AUDIO_V` / `AUDIO_M` in `guide-scripts/pre-vegan-business-guide.js`; once Play is pressed each new tab plays until Pause
  (`moved && TOUR.started && !TOUR.paused`). Checked at 1440 and 390 px: Play on screen, audio 206, carries to the next tab, no errors.
- Sean's direction saved as canon: `canon-ve-guide-overview-standard` (the Guide opening order) and `canon-ve-pre-vegan-meaning`
  (Pre-Vegan meaning; a business that is not Vegan offers plant-based or Pre-Vegan options and earns the word Vegan; the tasting
  night defined). Both in CLAUDE.md.
- Draft Overview, Maya's overview-v2 line and the language sweep: `docs/proposals/pre-vegan-business-guide-overview.md`.

## Waiting on Sean
1. Approve or change the new Overview words and Maya's overview-v2 line.
2. Approve the plant-based language across this Guide (11 "Vegan options" mentions in script and page; "Why add Vegan" and How to
   say it rewritten). 5 recordings then go to -v2: overview, overview-member, why, say, found (old files stay).
3. Approve the 5-group member menu: Start here (story and the 5-step checklist), Learn it (Why, How to say it), Add it (What to add,
   Sourcing, Buy or make), Get found (Get found, Claim your page), Your list (My list, What's next). Copy the Events Guide's `GROUPS`.
4. Launch calls: a banner (Higgsfield credits), then noindex off, sitemap, catalog card, publish the `ve_guides` row.
5. Not changed without Sean: the Directory's "Vegan options" listing label, the Restaurant Guide and the certification copy.

## How to record (what worked)
`net.http_post` to el-media from SQL with the admin token selected inside the query, two tts at a time; read
`net._http_response` after `pg_sleep(12-15)`; stt with `{action:'stt', source_bucket:'vegan-media', source_path:'media/maya/...'}`.
