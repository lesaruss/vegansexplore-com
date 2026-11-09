# ve-explorer-path: Join free on the chapters, and the paths page (2026-11-09)

- Chapter hubs (`communities/hub.html`): the banner's Get your Passport reads Join free and opens `/survey?s=explorer`, which brings them back to the
  chapter (`ve_after_survey`); the locked Members and Rewards boxes read Members only / Join free. Checked live at 1440 and 390 (e4040f2).
- Step 4, `/paths` (`paths.html`, parent `/guides`, wording approved 2026-11-07): see the CLAUDE.md Explorer path section. Checked locally against a
  mocked member (x_run events + nonprofit, nonprofit intake finished) and as a visitor, at 1440 and 390, beside `/guides` (same family), no errors.
- `survey.html` Explorer finish: See your paths first; the old next step (page back, claim, dashboard) is the outline button under it.
- Waiting on Sean: Liz's line for /paths (`docs/proposals/paths-page-liz-line.md`), then record.
- Next: step 5, path Guides gated with Explorer inline (canon `canon-ve-door-guides` v7/v10).

## Same day: Liz on /paths, and step 5
- Liz's two lines approved by Sean, recorded (`liz/paths/paths-member-v1.mp3`, `paths-visitor-v1.mp3`), stt matched, on /paths with Play (74972a1).
- el-media `stt` takes `{action:'stt', source_bucket:'vegan-media', source_path:'media/...'}` (no prefix added) and returns `{words:[[text,start,end]]}`.
- Step 5: path surveys start after Explorer (see CLAUDE.md). Checked locally with mocked answers: visitor and member without Explorer get Step 1 of 2,
  a member with Explorer goes straight in; Explorer's finish leads with Next: the Creator Guide survey, then Step 2 of 2. No errors.
- Not done: the Guides' own Get in screens still say "one short survey" (true for an Explorer; a non-Explorer meets Step 1 of 2 on the survey page).
- Next: step 6, badges on profiles and as tags.
