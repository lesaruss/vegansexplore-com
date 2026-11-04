# ve-social-studio: picture refresh finished, scrape_on turned on (2026-11-04)

Playbook: ve-social-studio (briefing ad93d024-7fa4-4631-9e64-331a2817af21; Pending 4, Completed 13, Waiting on Sean 2).

## Done
- Picture refresh for featured posts finished: 721 posts / 1,661 rows have thumb_url; Apify about $1.90 over 65 runs. Batch size is 10 (25 times out at 140 s).
- Cleanup through ve-once-refresh-cleanup (now the 410 stub): temp cron job 111 and tmp_refresh_req gone, refresh_batch removed, refresh_ours_on false. Migration 20261104_listing_posts_refresh_cleanup.sql.
- Social tab checked live at 1440 and 390 px.
- listing_social.scrape_on turned on at Sean's go (4 claimed listings, 1 with an Instagram handle; 3 a run, 20 a day, 7-day re-read).
- CLAUDE.md and the playbook updated (main 79b5e90). Leftover scheduled triggers deleted.

## Next (Logan)
- Check the first real weekly run (cron ve-listing-posts-weekly, 07:17 UTC = 2:17 AM Eastern, first after 2026-11-04): ve_listing_social rows, ve_listing_posts for the one handle, Apify spend. This proves fetchTheirs' paused guard.
- Still unproven: owner's Social step as a signed-in owner in a browser.
- refresh_ours_on stays false.
