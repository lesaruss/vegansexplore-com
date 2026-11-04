# Handoff: open social playbook and the picture refresh (wrap-up, 2026-11-03)

This supersedes the **State** and **First, check the refresh** parts of `2026-11-03-social-picture-refresh.md` (its other parts still hold). Nothing here is merged to main.
The paste prompt for the next chat is at the bottom.

## What happened this session (times Eastern, EST; 12:00 UTC = 7:00 AM)

- **The picture refresh ran, with trouble, and was fixed.** Of 721 featured posts (251 listings), the batches of 25 kept failing with `read_failed` 400. That is
  **Apify's run-sync call passing its 140 second limit**: Apify returns 400, bills the run anyway (about $0.053 for 25 posts) and the function drops the results,
  so the same posts are tried again. Found by reading Apify's run list (`GET /v2/actor-runs`, the token sent as a header from inside SQL, never printed): the failed runs
  read `TIMED-OUT`, the good ones `SUCCEEDED` at $0.0575 per 25 results ($2.30 per 1,000). Not a quota problem (Starter plan, about $13.4 of $29 used on Nov 3 at
  7:45 AM) and not a bad URL. **Fix: `listing_social.refresh_batch` = 10** (the function already reads it; no redeploy). Since then almost every batch has succeeded and the
  odd timeout costs a cent or two.
- **Cron job 111 (`ve-listing-refresh-tmp`) was rewritten three times** (all are `cron.alter_job` edits; nothing is in a migration, it is temporary): it now
  computes `confirm` from the live remaining count (it had hard-coded 721, which the function refuses once fewer than 521 are left: `confirm_mismatch`), it halts on
  any non-ok response and on any batch that reports a gone post (a post the reader does not return keeps `thumb_url` null, so it would be re-picked forever), and it
  fires as soon as the previous response is back. Its `tmp_refresh_req` setting holds the last request id.
- **Two chats were driving the refresh.** The trigger set by the old, closed chat (`trig_01RZr2GDzvEZEdMJL8ifiKMX`, a one-shot at 12:02 UTC) fired into a
  different chat and ran a batch. Sean said delete it; **deleted**. Lesson: a scheduled trigger belongs to the account and fires into whichever chat is open on the
  project, so a closed chat's triggers must be deleted at wrap-up.
- **`ve-social-studio` is now the open social media playbook** (Sean: "extend ve-social-studio"): briefing `ad93d024-7fa4-4631-9e64-331a2817af21`, the Depot studio
  and the Social tab on listings in one Work Queue (8 pending, 9 completed) and one history. It stays open: no pending tasks, nothing to do; pending tasks are
  worked at the start of any social session. Built on the existing v3-shell page by targeted edits. Not checked in a browser (this build session cannot reach
  `hq.lesaruss.ai` or `*.vercel.app`; only its structure was checked in the database). A brand-level playbook across GeekFon Society and Sean A. Russell
  (`social-desk`, `lesaruss-hq`) was left alone, Sean's call.

## State at wrap-up (check live; these numbers move)

- Remaining (distinct shortcode, source ours, status shown, `thumb_url` null): **136 at 8:40 AM**, about 10 every 1 to 2 minutes, so it should reach 0 by about 9 AM.
- `listing_social`: `refresh_ours_on` true, `refresh_batch` 10, **`scrape_on` false (must stay false)**.
- Spend: the Apify list since 6:30 AM Nov 3 (11:30 UTC) has the total; about 22 failed runs cost cents. Expect about $1.9 against the approved $1.66, because of the
  timed-out runs.
- A scheduled check (`trig_01AGW4kCphjyeCNk3ww8ZStX`, 13:54 UTC = 8:54 AM) was set from the chat that wrote this doc and **fires into whichever chat is open**.
  If you are the new chat and the old one is closed, you will receive it: it asks for the same steps as below. **Delete any other pending trigger from the old chat
  before you set your own**, so only one chat drives the refresh.

## Still to do (also in the playbook's Work Queue)

1. Finish the refresh; at remaining 0, clean up: delete cron job 111 (`select cron.unschedule('ve-listing-refresh-tmp')`), delete the `tmp_refresh_req` setting,
   remove the `refresh_batch` key and set `refresh_ours_on` false from `listing_social` (keep `scrape_on` false). Count rows with `thumb_url`, rows with
   `thumb_error` like 'Not returned%' (post gone) and 'could not be copied'. Total the Apify spend. Tell Sean.
2. Update the playbook: move the two refresh items to Completed and fix the counts (briefing `ad93d024...`, edit with targeted `replace`, keep the shell), add a
   `playbook_records` row (`slug` ve-social-studio, `brand_slug` vegans-explore, `source` must be `text`, `kind` decision) and a `stream_events` row (`status` must be
   `completed`, `in_progress` or `blocked`).
3. Look at a Social tab at 1440 and 390 px. Vercel preview of the branch exists (latest READY at the time: `vegansexplore-l11erx5nn-contact-2245s-projects.vercel.app`,
   commit d6380b5, team preview so it needs Vercel sign-in). This session could not open `*.vercel.app`. Try listings `john-thomas`, `torre-washington`,
   `brooke-sellers`, `thebodybuildingvegan-youtube`.
4. Ask Sean whether to merge the branch to main. Check the diff against main first. Do not merge without his yes.
5. Not proven: `fetchTheirs`' paused guard (needs `scrape_on`) and the owner Social step as a signed-in owner in a browser. Sean decides when `scrape_on` goes on.
6. CLAUDE.md's Social section is not updated with the timeout finding, the batch size, the playbook or the trigger lesson (this wrap-up could not safely edit that
   large file over the API); add them in the next chat's commit on this branch.

## Prompt for the next chat

```
Logan here, picking up the Social tab work. Repo lesaruss/vegansexplore-com, branch claude/dazzling-feynman-929qfw (nothing is merged to main). Read CLAUDE.md first (the section "The Social tab, and the Guide tab is now Resources"), then docs/handoff/2026-11-03-social-playbook-wrapup.md (it supersedes the state in 2026-11-03-social-picture-refresh.md), then the playbook ve-social-studio (briefings id ad93d024-7fa4-4631-9e64-331a2817af21: its Work Queue is the task list). Supabase project lesaruss-directory (fwbhwfxpncrsfhttimna). Commit author Sean A. Russell <contact@lesaruss.com>. Do not open a PR unless Sean asks. Times to Sean are Eastern.

STATE: the Apify picture refresh of the 721 featured posts is running through temporary cron job 111 (batches of 10, listing_social.refresh_batch=10; the 25-post batches kept timing out on Apify's 140 second limit, which returns 400 and bills anyway). It halts itself on any error or any gone post. About 136 were left at 8:40 AM Eastern. listing_social.refresh_ours_on is true; scrape_on must stay false. Only one chat may drive it: before you set any scheduled check, list the account's scheduled tasks and delete leftovers from the old chat (trig_01AGW4kCphjyeCNk3ww8ZStX fires at 13:54 UTC, 8:54 AM Eastern, into whichever chat is open; if it reaches you, act on it, it asks for the steps below).

DO, in order:
1. Check the refresh (read only): remaining count (distinct shortcode in ve_listing_posts where source='ours' and status='shown' and thumb_url is null), whether cron.job 111 exists, the last response via ve_site_settings key tmp_refresh_req -> net._http_response. If the last response is an error: a single read_failed 400 is an Apify timeout, so fire one batch by hand via pg_net (admin_refresh_run, confirm = remaining, token read from lesaruss_secrets inside SQL, never printed) and point tmp_refresh_req at that request id; if the same posts fail twice, stop and tell Sean. Never redeploy ve-listing-posts while it runs; never run two batches at once.
2. At remaining 0: cron.unschedule('ve-listing-refresh-tmp'), delete the tmp_refresh_req setting, remove refresh_batch and set refresh_ours_on false in listing_social (scrape_on stays false), count thumb_url rows and thumb_error rows ("Not returned" = post gone), total the Apify spend (GET /v2/actor-runs with the token read inside SQL as a header, runs since 11:30 UTC Nov 3), tell Sean.
3. Update the ve-social-studio playbook: move the two refresh items to Completed, fix the counts, add a Decision History line, a playbook_records row (source 'text') and a stream_events row (status 'completed').
4. Open a Social tab at 1440 and 390 px. The sandbox may refuse *.vercel.app and hq.lesaruss.ai; a Vercel preview of the branch exists (project vegansexplore-com); if you cannot reach it, tell Sean and give him the listings to look at (john-thomas, torre-washington, brooke-sellers, thebodybuildingvegan-youtube).
5. Ask Sean whether to merge the branch to main. Do not merge without his yes; check the diff against main first.
6. Update CLAUDE.md's Social section on the branch (the timeout finding, batch size 10, the open social playbook, the trigger lesson), then commit and push to the branch.
7. Not proven yet: fetchTheirs' paused guard (needs scrape_on) and the owner Social step in a browser as a signed-in owner. Leave scrape_on false until Sean says.
```
