# Handoff for the next chat: Social tab picture refresh (2026-11-03)

Paste the prompt below as the first message of the next chat.

---

Logan here, picking up the Social tab work. Repo `lesaruss/vegansexplore-com`, branch `claude/dazzling-feynman-929qfw` (nothing is merged to main).
Read `CLAUDE.md` first, the section "The Social tab, and the Guide tab is now Resources". Supabase project is `lesaruss-directory`
(`fwbhwfxpncrsfhttimna`). Commit author `Sean A. Russell <contact@lesaruss.com>`. Do not open a PR unless Sean asks.

**State.** Deployed: `ve-listing-posts` version 5 (quote and refresh actions, `LESARUSS_ADMIN_TOKEN` ops path for `admin_*` only, the paused status and
its guards). Migration `20261103_listing_posts_paused.sql` is applied. Sean approved the Apify picture refresh after the quote (721 posts, about $1.66,
Apify Starter plan, $16 of room; the "premium" he upgraded was his Claude account, not Apify). It is **running, not finished**: a temporary
pg_cron job 111 `ve-listing-refresh-tmp` fires one batch of 25 a minute-tick, only when the previous response is back and ok, and stops itself on any
error. About 546 posts were left at the last check; one batch had hit a 504 idle timeout after a redeploy, and one batch was fired again by hand.
`listing_social.refresh_ours_on` is true; `listing_social.scrape_on` is false and must stay false until Sean says to read claimed owners' pages.

**First, check the refresh (read only):**
1. `select count(distinct shortcode) from ve_listing_posts where source='ours' and status='shown' and thumb_url is null;` (721 at the start).
   `select exists(select 1 from cron.job where jobid=111);` and the last response:
   `select status_code, content from net._http_response where id=(select (value #>> '{}')::bigint from ve_site_settings where key='tmp_refresh_req');`
2. If the last response is an error (not `{"ok":true`), the job is halted on purpose and spends nothing. Read the error, then fire one batch by hand
   through pg_net (admin_refresh_run, confirm 721, the token read from `lesaruss_secrets` inside SQL, never printed) and point `tmp_refresh_req` at that
   request id, as the CLAUDE.md paragraph describes. Never redeploy `ve-listing-posts` while it runs, and never run two batches at once.
3. When `remaining` is 0: delete job 111 if it is still there, delete the `tmp_refresh_req` setting, set `refresh_ours_on` back to false (keep
   `scrape_on` false), count rows with `thumb_url` and rows with `thumb_error` ("Not returned by the reader" = the post is gone), and tell Sean.

**Then:**
4. Look at a Social tab in a browser at 1440 and 390 px (a featured-by-us listing). Nothing is merged, so the live site has no Social tab: look for a
   Vercel preview of the branch (`vercel` connector, project `vegansexplore-com`); if there is none, tell Sean and ask whether to merge.
5. Ask Sean whether to merge the branch to main (it holds the Social tab, Resources rename, owner Social step, Depot > Social posts, the paused
   status). Do not merge without his yes. If he says yes, check the diff against main first.
6. Not proven yet: `fetchTheirs`' paused guard (needs `scrape_on`), and the owner Social step in a browser as a signed-in owner.

**Rules.** Time to Sean is Eastern. Leave `scrape_on` false. A scheduled check (trigger `trig_01RZr2GDzvEZEdMJL8ifiKMX`, 12:02 UTC) was set from the
old session and may land in this one; it asks for the same steps as above.
