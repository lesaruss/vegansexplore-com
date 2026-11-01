-- Playbook ve-directory-review: BUILD RECORD, 2026-11-01 (Logan), so the held-listings and "Is it still open?" work can be
-- picked up in a new chat. Safe to run twice.
insert into public.playbook_records (slug, brand_slug, author, source, kind, body)
select 've-directory-review', 'vegans-explore', 'Logan', 'text', 'decision',
$body$BUILD RECORD, 2026-11-01 (Logan). Directory review: held listings, the nightly check, closed places and the "Is it still open?" bounty. Full detail: CLAUDE.md in lesaruss/vegansexplore-com, section "Explore and the Directory", paragraph "Directory review". Last commit 2ec4a53 (main and claude/happy-noether-9nmy7n).

1. THE 87 HELD LISTINGS (held by the nightly check for a dead website or no socials), checked on Google (78 Place Details calls):
- 34 open with 50 or more reviews, or a review since May 2026, went back on the Directory (Sean: "Bring back the 34").
- 6 Google calls permanently closed were Removed (Sean: "remove any"). Shojin and Bang! went back earlier after a new website was found.
- 2 temporarily closed (Coco Lov, Seasoned Green) stay off.
- 36 with few or old reviews stay on hold (Sean: "keep those where they are"). Google lists no website for most, so a website alone cannot vet them.

2. THE NIGHTLY CHECK FIXED (migration 20261101_directory_auto_hold_google_verified.sql). "No socials" with no website or no hours holds a place only when Google does not vouch for it (Google place, street, hours, Google not saying closed). Still flagged in Directory review. On the same data it would have held 29, not 58.

3. CLOSED OFF, OPEN BACK, WITHOUT ASKING (Sean: "anything temporarily closed or permanently closed, let's leave it off... You don't even have to ask me... if the status changes, then we can put it back"; migration 20261101_closed_off_open_back.sql). The nightly hold also takes off Google's temporarily closed. Every Monday 9:17 AM Eastern ve_closed_recheck_send asks Google (businessStatus only, job closed-recheck) about every listing held or Removed because Google said closed; ten minutes later ve_closed_recheck_read puts back any Google shows open, with a note (ve_closed_rechecks). First run 2026-11-01: all eight still closed. One-time scans (once:*) no longer count against the daily Google cap (20261101_google_room_skips_once.sql).

4. THE 36 ARE A BOUNTY: "Is it still open?" (Sean: "Make the 36 on hold a bounty"; 20261101_bounty_still_open.sql). Nine Bounties campaigns, still-open-<chapter>: Atlanta 7, South Florida 5, London 5, Philadelphia 5, New York 4, North Florida 3, Los Angeles 3, Virginia 3, Central Florida 1. One job a place, 50 points, one person, until 2026-12-01, in person: a photo of the outside today, and if open the menu, counter or receipt and the hours. Closed counts too. (Logan's defaults, Sean's to change.)

5. APPROVING UPDATES THE LISTING (Sean: "make approving it update the listing automatically"; 20261101_bounty_still_open_apply.sql; ve-bounties deployed, source sha256 dd87c82b... matched). ve_bounties.check_listing_id links each job (36 of 36). The member answers What did you find? (open / closed, check_result) and must upload a photo. Depot > Bounties shows the answer and a Listing choice beside Approve and pay. Approving runs applyCheck: open puts it back live (90 days off the nightly hold), closed makes it Removed, each with a note naming the visit, once per submission (check_applied_at). Proven end to end on Down South Vegan with a 1-point test job and the Logan test account, then restored and cleaned up. A new "Is it still open?" job needs check_listing_id set.

6. THE DAILY PULSE (Sean: "post the bounty in the Daily Pulse"). Nine draft topics in ve_board_posts (kind topic, category pulse, status draft, auto_publish_at null, member Sean), one a chapter: "Is it still open? 50 points a stop in <City>", a See the places button to /bounties?community=<slug>&campaign=still-open-<slug>, the first reply set. They wait in the Pulse desk (Depot > Inbox) and never go out on their own.

7. OPEN. Sean said "publish them all now" for the nine drafts. NOT DONE: that turn ran out of room, then the Supabase connector disconnected. Publish each the way ve-board topic_publish does (status open, published_at now, first_reply posted as the opening reply under the pulse_auto account rules), check each shows on its chapter's /pulse, then tell Sean. Each is a second topic that day beside the morning briefing.

8. NEXT. Watch the first submissions in Depot > Bounties. The Monday recheck runs weekly. Decide with Sean whether the 36 jobs' 50 points and the 2026-12-01 end hold.$body$
where not exists (select 1 from public.playbook_records where slug = 've-directory-review' and body like 'BUILD RECORD, 2026-11-01%');
