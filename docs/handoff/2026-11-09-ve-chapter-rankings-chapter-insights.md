# ve-chapter-rankings: chapter insights, traffic ranks, board fit (2026-11-09)

Sean: hide downloads on the board, rank by the algorithm; super admins click a place to see its audience in BrandDesk Insights under Chapters (podcasts by show with thumbnails, web, YouTube, social, news), South Florida first, then every chapter and coming-next place; Traffic sort on the chapter cards; board as tall as the cards; remove the old bottom block.

## Done
- `branddesk-insights` v21 (from db50840, sha256 b6d8412c matched): `places`, `place {kind, slug, from, to}`, `chapter_traffic` (cron ve-chapter-traffic 08:51 UTC). Every chapter and coming-next place works, not only South Florida.
- Migration `20261109_chapter_traffic_ranks.sql` (applied): `ve_chapter_traffic`, `ve_chapter_stats.traffic`, `ve_next_chapter_stats` returns `traffic` instead of the numbers.
- VE: board without numbers, Insights links for super admins, fit to the cards on desktop; chapter cards smaller buttons, Insights, Traffic sort; Run a Community block removed.
- HQ branch `claude/youthful-ramanujan-74oduo` (35c5d5e): Insights > Chapters has Open a place, and the ranking's chapter names open it. Checked signed in (QA login) on the preview at 1440 and 390 px: South Florida, San Francisco, every tab, no errors. **Not on HQ main until Sean merges.** Until then the Insights buttons on vegansexplore.com open HQ main, which shows the ranking only.

## Numbers seen (Oct 10 to Nov 8)
South Florida: 8 podcast downloads (6 before), 66 web visitors (26 before), 753 Instagram and 58 Facebook followers there, 40 news stories. Traffic ranks: New York, South Florida, Central Florida, Los Angeles, Virginia (Ashburn and Sterling counted out: 1,015 -> 251).

## Not built
- YouTube by place: Metricool gives YouTube countries only and TikTok nothing; YouTube's own place data needs the channel owner's Google sign-in (YouTube Analytics), not set up.
- News feeds for coming-next places (none collected; a feed per place is the next step if Sean wants it).
