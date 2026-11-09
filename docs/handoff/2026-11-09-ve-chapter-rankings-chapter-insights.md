# ve-chapter-rankings: chapter insights, traffic ranks, board fit (2026-11-09)

Sean: hide downloads on the board, rank by the algorithm; super admins click a place to see its audience in BrandDesk Insights under Chapters (podcasts by show with thumbnails, web, YouTube, social, news), South Florida first, then every chapter and coming-next place; Traffic sort on the chapter cards; board as tall as the cards; remove the old bottom block.

## Done
- `branddesk-insights` v21 (from db50840, sha256 b6d8412c matched): `places`, `place {kind, slug, from, to}`, `chapter_traffic` (cron ve-chapter-traffic 08:51 UTC). Every chapter and coming-next place works, not only South Florida.
- Migration `20261109_chapter_traffic_ranks.sql` (applied): `ve_chapter_traffic`, `ve_chapter_stats.traffic`, `ve_next_chapter_stats` returns `traffic` instead of the numbers.
- VE: board without numbers, Insights links for super admins, fit to the cards on desktop; chapter cards smaller buttons, Insights, Traffic sort; Run a Community block removed.
- HQ: Insights > Chapters has Open a place, and the ranking's chapter names open it; merged to HQ main (Sean: "merge HQ to main"). Checked signed in (QA login) on the preview at 1440 and 390 px.

## Numbers seen (Oct 10 to Nov 8)
South Florida: 8 podcast downloads (6 before), 66 web visitors (26 before), 753 Instagram and 58 Facebook followers there, 40 news stories. Traffic ranks: New York, South Florida, Central Florida, Los Angeles, Virginia (Ashburn and Sterling counted out: 1,015 -> 251).

## Later the same day (all live, both mains)
- Insights head: title left, period right (dropdown as wide as its dates); phone spacing; the sections as one Section dropdown.
- YouTube: Sean connected the channel (read only). A YouTube tab per place: the period, the whole state, all time. Short periods read 0 because YouTube hides small places.
- News for coming-next places: Google News search per place, 6 hours, Vegan headlines only (San Francisco 27, Japan 17).

## Open
- TikTok has no place data anywhere. If the Google app is in testing mode, the YouTube connection expires every 7 days (set the consent screen to In production).
- Show me, the sample hub per place, waits until places get real votes (Sean).
