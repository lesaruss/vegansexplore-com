# ve-social-studio: Index round 1, matcher v2, tags with an X (2026-11-05)

Playbook: ve-social-studio (briefing ad93d024-7fa4-4631-9e64-331a2817af21). All times Eastern.

## Done
- ve-social-studio: Sean found the Index (he had been on a preview link). His round 1 is live on HQ main (de6b36c, 2edf33d, 36bc2e0, f9764f3), checked as `vegan@` on hq.lesaruss.ai, no script errors:
  - one card per post (rows grouped by `shortcode`), named for the post's own account or whoever the caption names first, `+N`, "N tagged";
  - smaller lightbox text, the button row level with the bottom of the picture, the body scrolling above it;
  - thumbnails start where the photo starts: posts that are a photo inside a tall Instagram frame have plain bands; `Pic` in `components/branddesk/SocialIndex.tsx` samples each stored picture once in the browser and sets `object-position` past the band;
  - tags with an X in the lightbox: X sets that row `removed` (ve-listing-posts `admin_set`), the post leaves that business's Social tab and the rebuild never brings it back; Undo puts it back; a listing's own post has no X;
  - React error 418 on `?s=index` fixed in `components/branddesk/BrandHome.tsx` (read the address after load).
- ve-social-studio: pictures. Every shown row's picture is in `vegan-media` (none from Instagram). The Index never falls back to Instagram's link.
- ve-social-studio: matcher v2, migration `supabase/migrations/20261105_listing_posts_matcher_v2.sql` (applied, rebuilt). One listing per handle and per website; names only when written as names or as a handle; @handles in older captions count as tags; `ve_listing_posts_hits()` previews without writing. 1,657 rows / 721 posts became 1,338 rows / 773 posts (about 320 wrong rows off, about 155 real tags on). 56 posts with no saved picture read again through Apify, about $0.13, all copied; `refresh_ours_on` false again, `refresh_batch` removed.
- ve-social-studio: X proven on real data: La Chia Vegana's row on Dina's post (DXDxdLxAfqf) set removed, gone from the public read, still removed after `ve_listing_posts_build()`, then put back to shown.
- Playbook records (4), ve_playbook_index row, CLAUDE.md "Index, in BrandDesk Social", this handoff.

## Not done / open
1. First real fetch of @vegansexplore: the cron `ve-listing-posts-weekly` runs 2:17 AM ET Nov 6. Check `ve_listing_social` (last_fetch_at, last_fetch_note, fetch_fails) and `ve_listing_posts` for listing fdcf4960-0ead-4a85-9433-b555d7674730, the cron's reply in `net._http_response` (kept 6 hours, so before about 8 AM ET), and Apify's runs and spend. Paused guard still unproven (repeat with `paused` true and read the reply to prove it).
2. The X was not clicked signed in on the live page (the server path is proven; the page was checked locally).
3. Sean's question left open: a post that only thanks a business still shows on its page unless someone taps X. He chose the X; no automatic rule.
4. Owner's Social step as a signed-in owner, still unproven.
5. Commits are authored as Claude, not Sean A. Russell (Sean has not said which to keep).

## Lessons
- Preview a matcher change with a function that returns the matches without writing, compare it to what is shown, then rebuild. The first rule set would have dropped real tags that Instagram's tag list had missed.
- A grouped list must decide which row names the card; sort by where the caption names each business.
- Instagram's picture links from the May scan are expired; any new row for a post needs the saved copy or a paid re-read.
- Use `ve-once-qa-session` for the headless `vegan@` login (key hashed in the source, session into a file, sign out, back to the 410 stub). Done this session; it is the stub now.
- The scheduled reminder for the 2:45 AM check was deleted at wrap-up (a reminder is tied to its chat); the check is in the paste prompt.
