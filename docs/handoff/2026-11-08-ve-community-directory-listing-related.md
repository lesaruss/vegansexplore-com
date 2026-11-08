# ve-community-directory: what connects to a listing (2026-11-08)

Sean: Rowdy Girl and The Humane League have been on our podcast; Renee King-Sonnen should have her tile on Rowdy Girl's page; do it across the board,
starting with what is in our content, then sweep other shows.

## Built
- `ve_listing_related` cache (see CLAUDE.md "What connects to a listing"), migration `20261108_listing_related.sql`, applied through the one-time
  `ve-once-listing-related` (stubbed to 410 after). Cron `ve-listing-related` every 2 hours at :17.
- `directory/listing.html` `loadRelated`: People / Organizations cards, On our podcast, On other podcasts, then In the Pulse (it had no caller on
  real listings: only the sample group page ran it, which is why the episodes never showed).
- Checked locally against live data at 1440 and 390 px: Rowdy Girl shows Renee King-Sonnen and Brett Christoffel, 3 of our episodes and 9 on
  other shows; The Humane League shows Vicky Bond, 2 and 16; Renee's page shows Rowdy Girl under Organizations. No script errors, no sideways scroll.
- Also removed the five test clicks on /go/give-* from the Give Back check (a real click at 4:58 PM Eastern stays).

## Limits
- Other shows = the 58 Directory podcasts whose feeds we read (`ve_podcast_feeds`). More shows in the Directory means more matches.
- Our episodes come from `ve_content_mentions`, so an episode with no transcript matches only on its title and notes.
- Rachel Black (The Humane League) is a pending People listing, so she does not show until approved.
- A mention in show notes can be passing; those are labeled Mentioned and listed after Featured.

## Next
- Final build: 834 listings, 74 with our episodes, 70 with other shows (582 episodes), 14 with people. One-time function stubbed.
- Sean merges this branch to main (the page part waits on that; the data is live).
- Logan: brands and food places on other shows (needs a stricter name rule; restaurant names are often generic).
