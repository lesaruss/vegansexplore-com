# History: social

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## The Social tab, and the Guide tab is now Resources (Sean, 2026-11-03)

"A Social tab on every Directory listing... Featured by us, pinned first and locked in... Their top posts"; then "instead of us trying to scan
everybody's page... unlocked once somebody claims their profile... a way for them to input the information, and then it does it", and "any
claim unlocking top posts". Migration `20261103_listing_posts.sql`; edge function `ve-listing-posts`; Depot > Content > **Social posts**
(`/admin/depot/listing-posts`, copied from the mentions page).

- **Resources** (was the Guide tab): `public/ve-guide-tab.js` labels the tab **Resources** ("so we can put whatever we want on it later").
  Its key, address (`?tab=guide`), Guide content and tracking (promo `gt-<guide slug>`, cta `tab`) are unchanged.
- **The Social tab** (`loadSocialTab` in `directory/listing.html`): right after Menu, shown only when we hold posts for the listing (never
  an empty tab), not on LESARUSS.ai or in a demo. **Featured by us** first (newest, 8 and Show all, `?sfeat=all`), then **Their top posts**
  (pinned first, then likes plus comments, 10 a page, `?tab=social&spage=2`), each tile the Directory's card family with a two-row caption
  clamp that opens the post on Instagram in a new tab (no embedding: that needs Meta embed access, tokens still pending). An unclaimed
  listing with no posts of its own shows **Is this your page?** to `/business?listing=`. Rows come from `ve_listing_posts` (RLS: anyone reads
  `status = 'shown'`); the page never asks Instagram.
- **Featured by us is matched in the database** (`ve_listing_posts_build`, cron `ve-listing-posts-build` daily 08:37 UTC), the way
  `ve_content_mentions_build` matches the Pulse: a tagged handle, a post by the listing's own handle (a collab), the listing's website in the
  caption, then its full name as whole words (two words or more, a stop list and no generic "vegan <word>" names). Our own shows and hosts
  are left out (`c_skip_slug`, `c_skip_handle`). One row a post and listing; `ve_ig_handle()` reads `@handle` or an Instagram URL. A shown row
  the scan no longer supports goes; **hidden and removed rows never come back**. Built from the May 2026 scan (`ve_instagram_posts`, 1,965
  posts from @soflovegans and @vegansexplore): 1,661 rows across 251 listings on 2026-11-03 (tag, owner, link and name matches). Wrong
  matches come off in Depot > Social posts.
- **Their top posts are for claimed listings only** (`owner_member_id` set, any claim, member or Partner, Logan's default). The handle is the
  Instagram on the owner's Contact step; `weekly` (cron `ve-listing-posts-weekly`, 07:17 UTC) signs every claimed listing with a valid
  handle up in `ve_listing_social` and reads its recent posts (Apify `instagram-scraper`, `listing_social.max_posts` 40, a post by the handle
  only), 3 listings a run, again after `refresh_days` (7), at most `daily_listing_cap` (20) listings a day, three failures stop it. **Nothing
  is fetched from Apify until `ve_site_settings` `listing_social.scrape_on` is true** (false on 2026-11-03; **turned on 2026-11-04 at Sean's go**: with 4 claimed listings, 1 with an Instagram handle, it is a handful of reads, about $0.0023 a post and 40 posts a read, 3 listings a run, 20 a day). "Top" is the top of the recent posts the scraper returns, not all time, and the page says so. No view counts except where a
  source gives them (`view_count`); Instagram's -1 for hidden likes shows no likes figure.
- **The owner's Social step** (Edit your page is five steps now: About, Hours, Contact and links, **Social**, Logo and photos;
  `?edit=social`, `oeSocial` in `directory/listing.html`): their posts with **Hide**, **Show**, **Pin**, **Read my page now** (once a day,
  `manual_refresh_hours`) and **Stop showing my Instagram posts** (`ve_listing_social.paused`, which hides them). Featured by us is theirs to
  see but never theirs to hide ("locked in"). `ve-listing-posts` `owner_get`, `owner_post`, `owner_pause`, `owner_refresh` (member token, the
  listing's `owner_member_id` or a super admin). `admin_list`, `admin_set`, `admin_fetch`, `admin_thumbs` for the Depot.
- **Pictures are copied into our storage** (the logo rule): `thumbs` (cron `ve-listing-posts-thumbs`, every 10 minutes, 20 a run) copies each
  post's picture to `vegan-media/media/social-posts/<shortcode>.<ext>`, one failure waits 30 days. **Found 2026-11-03: every picture link
  in the May scan had expired by 2026-05-13** (Instagram's `oe=` stamp), so the 1,661 featured tiles show the Instagram mark and caption
  until their pictures are read again. Reading them again is a paid Apify run of the matched posts' URLs (721 distinct posts, not 580).
- **The picture refresh for the featured posts, finished 2026-11-03** (Sean: "go ahead" after the quote):
  `ve-listing-posts` `admin_refresh_quote` (free: counts the posts with no picture, estimates `apify_usd_per_1000_results` (default 2.30,
  list price, unverified) and reads Apify's plan and usage) and `admin_refresh_run` (batches of `refresh_batch`, Apify `instagram-scraper`
  on the post links, copies each picture to storage; needs `listing_social.refresh_ours_on` true AND `confirm` at least the remaining
  count). Quote: 721 posts, about $1.66, Apify Starter plan. **Result**: all 721 posts (1,661 rows) have a `thumb_url`, none gone ("Not
  returned by the reader"), none failed to copy; Apify spend about $1.90 for 65 runs (59 succeeded $1.66, 6 timed out $0.25).
  **Batch size is 10, not 25**: the call to Apify waits at most 140 seconds, and a 25-post batch that runs longer comes back as a 400, is
  still billed, and its results are dropped. `504 IDLE_TIMEOUT` is the gateway only; it came once from redeploying `ve-listing-posts`
  mid-run (never do that). It was driven by a temporary pg_cron job 111 that fired the next batch only when the last response was
  `{"ok":true`, halted on any error or gone post, and removed itself at `remaining` 0. Cleanup was done 2026-11-04 through
  `ve-once-refresh-cleanup` (the connector held the delete; now the 410 stub): job and `tmp_refresh_req` gone, `refresh_batch` removed,
  `refresh_ours_on` false, `scrape_on` false then, turned on later the same day (migration `20261104_listing_posts_refresh_cleanup.sql`). A second refresh needs
  `refresh_ours_on` and a batch size set again, and never runs twice at once: overlapping calls pick the same posts. **The open playbook
  for all social work is `ve-social-studio`** (Depot > Social and this tab share one queue). **Scheduled triggers belong to the account
  and fire into whichever chat is open**, so at wrap-up delete the triggers of a chat that is closing (`list_triggers`, `delete_trigger`)
  or its reminder lands in the next chat. Still unproven: `fetchTheirs`' paused guard (`scrape_on` is on, so the first real run proves it; check `ve_listing_social` and the posts after 07:17 UTC), the owner's Social step as a
  signed-in owner in a browser, and a look at a Social tab at 1440 and 390 px (the build session refuses `*.vercel.app`).
- **Paused is its own status** (2026-11-03, migration `20261103_listing_posts_paused.sql`; Sean: "do the paused status too"). `ve_listing_posts.status`
  is shown, hidden, **paused** or removed. **Stop showing my Instagram posts** moves shown posts to `paused` (pins kept) and Show again moves
  only `paused` ones back; `hidden` is only ever the owner's own choice, so Resume never re-shows what they hid. While paused the owner
  cannot Hide, Show or Pin (`owner_post` answers 409 `paused`) and `fetchTheirs` pulls no new posts (`paused`); the owner's screen says so and
  dims the posts. Public read is still `status = 'shown'`. Proven live as Sean on the Vegans Explore Podcast listing with three test posts
  (pinned, hidden by hand, plain): Pause gave paused+pin, hidden, paused; an edit was refused 409; Resume gave shown+pin, hidden, shown; the
  public saw only the two shown. Not proven: `fetchTheirs`' paused guard (`scrape_on` has been on since 2026-11-04; the first real run proves it).
- **Owner Social step proven live 2026-11-03** (a one-time session as Sean, then the 410 stub `ve-once-listing-posts-proof`): owner_get, hide, show,
  pin, a bad op, pause and resume, the refresh refused 409 while `scrape_on` was false, a non-owner (Logan test account) refused 403 on get and
  post, no token 401, a non-admin refused on `admin_list`. Not yet seen in a browser: no preview deploy of the branch was checked.
- Not built yet: Instagram only (no TikTok, YouTube or Facebook rows, the table allows `network` instagram), a Meta "Connect Instagram"
  button (real metrics, views and embeds, once the tokens are in), SEO data for the tab, and the other brands' listings.
- **Index, in BrandDesk Social (Sean, 2026-11-05, playbook `ve-social-studio`)**: "a button next to content... an index of all the social content
  that's been pulled, and a filtering system"; "stop using the gray background". BrandDesk > Vegans Explore > Social has an **Index** tab in the frame's
  own Plan | Notes for Logan | Content row (HQ `public/branddesk/social.html`, added by `scripts/sync-branddesk-social.py` in lesaruss-hq so a re-sync keeps it;
  the Depot's own Social page has none). It lists every post in `ve_listing_posts` (Featured by us and Their top posts) with search over captions, business names
  and handles, filters for source, business, why it matched, status (Shown, Hidden by owner, Paused, Taken off) and sort, a post popup, and Take it off /
  Put it back for featured posts (`ve-listing-posts` `admin_set`); a listing's own posts are the owner's to hide or pause. HQ `components/branddesk/SocialIndex.tsx`,
  `app/api/branddesk/social-index/route.ts` (super admin only, reads the database, fetches nothing from Instagram or Apify), `?s=index` in the address, on a white
  panel. Live on HQ `main` (b660a94, a5d53e2). Sean saw it on 2026-11-05 (he had been on a preview link before). **Round 1, the same day** (HQ main de6b36c,
  2edf33d, 36bc2e0, f9764f3; checked as `vegan@` live, no script errors): **one card per post** (rows grouped by `shortcode`; the card names the post's own account,
  else whoever the caption names first, `+N`, and "N tagged"); the lightbox is smaller text with the button row level with the bottom of the picture (the body is
  `height:0;min-height:100%` and scrolls above the buttons; on phones it stacks); **thumbnails start where the photo starts** (Sean: "It should just be pushed towards
  the top"): many posts are a photo inside a tall Instagram frame with plain bands, so `Pic` samples each stored picture once in the browser (`vegan-media` allows
  cross-origin reads) and sets `object-position` to the first row that is not one flat color, cards and lightbox alike; **tags with an X** (Sean: collaborations tag
  several businesses, and some, Animal Hero Kids, tag people only for reach): the lightbox lists the post's businesses as tags, the X sets that row `removed`
  (`admin_set`), so the post leaves that business's Social tab and the rebuild never brings it back; a removed tag stays struck through with Undo; a listing's own
  post shows Their post and has no X. Proven on real data (La Chia Vegana on Dina's post: off the public read, still off after a rebuild, put back). The Index never
  falls back to Instagram's picture link (Picture not saved yet). Also fixed: React error 418 on `?s=index` (BrandHome read the address while rendering; it reads it
  after load and draws the frame then). **The matcher, v2** (Sean: "go ahead and fix the matcher"; migration `20261105_listing_posts_matcher_v2.sql`): one listing per
  handle and per website (the main listing over its locations, a person over their channel or book, any other listing over media, then votes, then oldest; it had put
  PLANTA's posts on four listings and every person's on their YouTube listing too); a name only when written as a name (first real word capitalized, words joined by
  spaces, apostrophes, quotes, hyphens, & or a period, never a comma or line break; `ve_lp_titled`) or as a handle (`@angie.sadeghi`); an @handle written in an older
  caption counts as a tag when Instagram's own tag list missed it; `philly vegan` stopped. `ve_listing_posts_hits()` is the match without writing anything: preview a
  rule change against it before rebuilding. New rows reuse a post's saved picture. Result: 1,657 rows (721 posts) became 1,338 rows (773 posts); the 56 posts with no
  saved picture were read again through Apify (6 batches of 10, about $0.13; `refresh_ours_on` back to false, `refresh_batch` removed); every shown row's picture is in
  `vegan-media`. **The paused guard, 2026-11-05**: with `paused` true on `vegansexplore` the 2:17 AM ET run fetched nothing (`last_fetch_at` null, 0 posts), but the
  function's reply and Apify's run list were not read then. **Proven later the same day (7 AM ET)**: the run's reply, still in `net._http_response`, was
  `{"enrolled":0,"fetched":0,"results":[]}` with `scrape_on` true (`weeklyRun` selects only `paused = false`), Apify shows no run then, and `admin_fetch` on the row paused
  for a minute answered `{"ok":false,"error":"paused"}` with no Apify run (the guard inside `fetchTheirs`), then unpaused. Both levels are proven. The cron
  `ve-listing-posts-weekly` runs **every night** at 2:17 AM ET (`17 7 * * *`); a row is due once its last fetch is `refresh_days` (7) old, so the 2:17 AM ET Nov 6 run is
  the first real fetch. **The X and Undo were clicked signed in as `vegan@` on hq.lesaruss.ai** the same morning (La Chia Vegana on Dina's post: removed at 6:52:49 AM ET,
  shown at 6:53:16, no script errors). A headless login worked again (canon `agent-headless-page-verification`, replacement 2026-10-27: a one-time function mints the `vegan@` session into a file,
  Playwright reads it, sign it out and stub the function after); this sandbox refuses `*.vercel.app`, so a branch preview cannot be looked at, but `hq.lesaruss.ai` can.

- **First real fetch, the owner proof and the content direction (2026-11-06, playbook `ve-social-studio`; handoff `docs/handoff/2026-11-06-ve-social-studio-owner-proof-philly-carousel.md`)**. The 2:17 AM ET run read @vegansexplore (35 posts, pictures in `vegan-media`, no failures) and @soflovegans (1 post kept for a full run; to explain); each Apify read is about $0.092. **The owner's Social step is proven in a browser** at 1440 and 390 px: as Sean on the Vegans Explore Podcast (Hide, Show, Pin, Unpin, Stop showing, which drops Their top posts from the public tab, Show again, Read my page now, which really reads for a super admin since `too_soon` is skipped) and as Priya, a non-admin owner, on Planted Table ("Add your Instagram first", nothing written); sessions came from the one-time `ve-once-owner-proof` (now the 410 stub). The build phase closes Fri Nov 13 (Sean), then the playbook stays open as Watching for all social work. **Content direction (Sean, 2026-11-06)**: the relaunch Guide reels are abandoned (all 6 skipped); no commercials on social; content is about the community and ends with a call to action that serves the viewer (find places, join free with the survey, vote, give points), a contribution only as an option; Vegans Explore Podcast clips become animated news-style posts (built in `ve-podcast-studio`, scheduled here); city carousels go out through the week so people see every chapter, starting outside Florida. **First city carousel**: Canva `DAHaJ8TQI0I` "5 Vegan Restaurants to Try in Philadelphia", copied from "Top 10 Vegan Restaurants in the U.S." (`DAHDRMBJWw4`, the parent: full-bleed food photo, logo bar, name and city): Vedge, Monster Vegan, HipCityVeg, Batter & Crumbs, Miss Rachel's Pantry (all confirmed open on Google; Charlie was a sinner. dropped, no Instagram or food photo found), photos are each restaurant's own Instagram posts, credited by tagging in the caption, as the U.S. carousel did. Liz's closing line is `vegan-media/media/social/philly-carousel/liz-close-v1.mp3` (20.8 s, checked with `stt`). Never claim points can pay for our services on social until that rule is built. Sean has look-and-feel changes to make on it, which become the locked city carousel template.
- **The city carousel template, batch 1 for ten chapters, collaborators and Directory slides (2026-11-07, playbook `ve-social-studio`; handoff `docs/handoff/2026-11-07-ve-social-studio-city-carousels-batch-1.md`)**. Sean approved the Philadelphia look and it is the locked template (canon `canon-ve-city-carousel`, the template table above). It lives in Canva **Vegans Explore > Directory** (folder `FAHaPcBW8w8`); every city is a copy of `DAHaJ8TQI0I` with the same element ids (a copy keeps them), so a city is: its chapter art (`VE_HUBS[].page.banner`) on the cover background and main box and the closing background, the city name, five restaurants (name and city lines resized to 680 wide, left 362.54), each restaurant's own Instagram food photo, and "in <City>" on the closing text. Batch 1 built for Central Florida `DAHaPjFQ2Rk`, Atlanta `DAHaPuxtuWI`, New York `DAHaPsYrfLg`, Los Angeles `DAHaPlTEGpQ`, London `DAHaPlTTe2U`, Maryland `DAHaPkMrvYE`, Washington, D.C. `DAHaPr1LrYM`, Virginia `DAHaPlNPbtM`, South Florida `DAHaPsnXGxY`; North Florida, Delaware and West Virginia wait (fewer than 5 open 100% Vegan places with an Instagram). Picks: open 100% Vegan food places with an Instagram; photos came from one Apify `instagram-scraper` run per batch (about $1.10 in all), copied into `vegan-media/media/communities/carousels/<handle>-<n>.jpg` through `ve-off-lookup` `save` because this build session cannot reach Instagram's image servers, reviewed on contact sheets, then imported to Canva. A place whose posts are only flyers or selfies is swapped for the next pick. Weak slides Sean is reviewing: Glizzy's (D.C., a menu flyer), Beyond Vegan Cell Food (Virginia, a kitchen shot, likely AI), Tassili's (Atlanta), Monty's and Doomie's (LA), Plates (London), The Rabbit Hole (South Florida). E3 Vegan's own last post says it is closing (left as is, Sean's call). **Instagram collaborators** (`ve_social_slots.collaborators`, migration `20261107_ve_social_collaborators.sql`, up to 5 handles; the slot form's Instagram collaborators field in Depot > Social; `ve-social` v13 sends them as `instagramData.collaborators` on posts and carousels, proven against Metricool). Instagram takes music on Reels only, so a carousel's song is a by-hand step (`sound.by_hand`); a TikTok photo post can carry a trending song. **Directory slides** (Sean: "go"): the Philadelphia template now has three slides before the closing one, 10 in all: "See every Vegan place in <City>" (the live Directory on a phone, `?tab=food&sub=restaurants&city=<chapter>&area=<City>`), "Every place has its own page" (the first restaurant's page on a phone), "Your vote ranks them" (its Vote, Save, Check in card and a line on voting and joining free). Screenshots are taken with Playwright at iPhone size with `.vote-count` and `.vote-badge` hidden (every count was 1), framed as phones in PIL, put in storage through `ve-social` `asset_upload` (Canva's upload host is blocked here), then imported. The "most voted get featured next" promise is left out until Sean says so. **The plan for the feed** (Sean): city carousels with music, Vegans Explore Podcast clips (start now) and anything special, which goes into the podcast first; never two carousels back to back. Proposed rhythm: carousels Mon, Wed, Fri at 12:30 PM Eastern (Philadelphia Mon Nov 9, then New York, Atlanta, LA, D.C., London, Maryland, Virginia, Central and South Florida), podcast clips Tue and Thu, an organization or person spotlight on the weekend. The Philadelphia slot (`bb84ccd8-...`, proposed, with five collaborators including @monsterveganphilly) still holds the 7-slide export; re-export after Sean's edits. Nothing is scheduled.

## Depot > Social (Sean, 2026-11-01)

"A social media page in the VE Depot where I can see a grid of scheduled content and click in it to see the caption, tags, links,
and anything else... share analytics for all of our social feeds and make it so I can sort between channels to see scheduled and past
content." **Depot > Social** (`/admin/depot/social`, Content in the Go to menu; super admins), one thing per view: **Content**
(`#content/<scheduled|past|all>/<channel>`: channel chips with counts, Scheduled / Past / All, the period, search over captions,
hashtags and mentions; a grid four across, what goes out next first, then the newest past; each tile the picture, the channel, the
status (Scheduled, Published, Draft, Did not post), the time in Eastern, the caption in two rows and, once out, views, likes and
comments), **one post** (`#post/<id>`: the picture or episode audio, when it goes or went out, hashtags, who is tagged, every link
(a `/go/` link marked Tracked), the first comment, the network's settings, how it did, the full caption, Copy caption, Open on the
channel) and **Analytics** (`#analytics/<channel>`: a card a channel with followers, the change in the period and a line of it, posts,
views, reach and average engagement; pick one to see only its posts; every post in a table sorted by any column). Server: edge
function `ve-social` (`report` with Eastern `from` / `to`; super admin or the admin token; cached 30 minutes in `ve_analytics_cache`,
Refresh now skips it). It reads **Metricool** (`analytics_connections` `metricool`, blog 3707345: `/v2/scheduler/posts` for what is
scheduled, `/v2/analytics/posts|reels/instagram`, `/v2/analytics/posts/facebook|tiktok`, `/stats/youtube/videos`, and followers from
`/v2/analytics/timelines` with `subject=account`; Metricool gives times in Europe/Madrid, turned into UTC there) and **Captivate** for
the podcast (the show's dates are America/New_York). A post scheduled in Metricool that went out shows once, with the numbers. Checked
2026-11-01: Instagram 3,762 followers, TikTok 3,038, YouTube 584, Facebook 371. **X is not connected in Metricool** (its API says so),
though the 2026-10-31 notes said it was. Not yet: podcast downloads from Captivate, scheduling or editing from the page (it is read
only; posts are scheduled in Metricool).

**The studio** (Sean, 2026-11-01: "see what's slotted for the different brands... you propose things... the community manager goes
in... make any adjustments... or leave a note that you will then take care of... you will use your connections to push it out... If
something needs a manual thing... we know ahead of time... a calendar... track it to its metrics... between different brands...
clients"; migration `20261101_ve_social_studio.sql`). **By day is the Plan's default** (Sean, 2026-11-01: "the date is the first row and the posts are below it and all in one row... slide...
select the date... a little bit bigger... I prefer that than the calendar"): `#days/<brand>/<up|past>/<filter>` lists each date with posts
(Coming up, the next 90 days; Past, the last 90, newest first), the date on top and its posts in one row that slides sideways
(`drawDays`, `.dayrow`, `.strip`); **Pick a date** or a date's heading opens that one date bigger (`#day/<brand>/<date>/<filter>`, Day
before / Day after, Every day back); **Calendar view** is the week grid below, kept as an option. The same page opens on **Plan**: a brand picker (`ve_social_brands`: house or
client, its Metricool brand and connected channels), the week Monday to Sunday (`#plan/<brand>/<monday>/<todo|out|posted|all>`, Back /
This week / Next week), one card a slot (`ve_social_slots`: time, channels, kind, title, caption, first comment, links, assets, By hand
steps, status), **Approve the N waiting**, and **New slot** for super admins. A slot (`#slot/<id>`): its pictures, Approve and schedule,
Skip it, **Change it directly** (every change a `ve_social_edits` row; a change to a scheduled slot is sent to Metricool again), and
**Notes** (`ve_social_notes`: Leave a note for Logan, optionally holding it as Changes asked; Logan marks each done with what he did;
**Notes for Logan** lists the open ones). Statuses: Waiting for approval, Changes asked, Approved, Scheduled, Posted, Did not post, Post
by hand, Skipped. **Approving pushes it**: `ve-social` creates the Metricool post (autoPublish, the slot's time in Eastern, Reel or
Story by kind); a brand not in Metricool, or a channel not connected for it, makes it **Post by hand** with the reason, known ahead of
time; skipping deletes it from Metricool. Cron `ve-social-sync` (every 15 minutes, `sync`, admin token) marks what went out Posted with
its links and copies its numbers from Metricool's analytics (matched by link) onto the slot, so a past week is the posted log with how
each did. Who: super admins edit every brand; anyone else by a `ve_social_people` row (editor or viewer), so a Community Manager or a
client can work their brand. Sean A. Russell and GeekFon Society are brands with no Metricool brand yet: add each in Metricool, then set
`metricool_blog_id` and `channels` on its row. Proven 2026-11-01 against the real Metricool: a [TEST] slot approved (scheduled), edited
(re-pushed, the old copy gone), skipped (removed), then deleted. **All three brands are in Metricool** (2026-11-01): Vegans Explore 3707345, GeekFon Society
7797245 (Instagram @geekfon, Facebook, YouTube, TikTok), Sean A. Russell 7797481 (Instagram @seanarussell82, Facebook, LinkedIn, YouTube,
TikTok). A slot's assets are `{url, type}`: `image` and `video` go out; `cover` (the thumbnail on the Plan) and `storyboard` (frames for the
team) never do, and a reel, video or episode with no `video` asset cannot be pushed (it goes back to Changes asked, "No video yet"). Media
lives in `vegan-media/media/social/<batch>/` so Metricool can fetch it. **Relaunch week** (batch `relaunch-week`, from Station 2's lookbook,
loaded 2026-11-01): the Find your Guide carousel, the Airport and Dairy stories (link stickers by hand), the episode 144 clip, and one Guide
reel a day at 12:30 PM Eastern, Monday to Saturday (Thursday to Saturday are storyboards until their videos are made), each with Logan's
proposed caption and Station 2's `ve-relaunch` tracked links. **A slot shows its media as it will go out** (Sean, 2026-11-01: "I would like to see the actual asset in that
preview window... a light box and play for me... replace the item... you should get a notation of what change has been made"): the slot's
left panel is the preview in the post's shape (`mediaPanel`: stories, reels and episodes in a 9:16 frame, posts and carousels at their
own shape, a carousel with arrows and N of M), a warning when a wide picture would sit with bars on a story or reel, What goes out (each
file with **Replace** and **Remove**, and **Add a picture or video**), the cover (on the Plan only) and the storyboard (not posted). Any of
them opens full size in a **lightbox** (`lightbox`: videos play, arrows and the arrow keys move, Escape closes). A file goes up through
`ve-social` `asset_upload` (an editor of the brand; JPEG, PNG, WebP, GIF, MP4, MOV or WebM up to 300 MB; a signed upload into
`vegan-media/media/social/<brand>/<slot>/`), then the slot saves its assets (logged, and sent to Metricool again when it was scheduled).
**Plan cards show the whole picture** (Sean, 2026-11-01: "I would like to see the full item in the preview... It looks off to me"): every card's picture is a 4:5 frame; a reel, story, episode or video shows its cover whole on dark (`.th.v`, `contain`), and a post or carousel fills the frame from the top. **The period drives every tile** (Sean, 2026-11-01: "the tiles... don't appear to be synced with the dropdown... a custom option... how far back"): Last 7, 30, 90 days, 6 or 12 months, This year, each past year from 2023, or **Custom dates** (from and to, its own row; `range`, `periodSel`, `custRow` in `admin/depot/social.html`, kept for the visit in `sessionStorage` `ve_social`). Analytics opens with a summary strip for the period (views, posts, followers gained, likes, comments, the top post linked to its view), then one card per channel the brand has, led by its views in the period, its followers at the period's end and the change, posts, reach, likes, engagement and its top post. Metricool holds posts back to 2023 (Instagram and YouTube for Sean A. Russell) and follower counts from 2025; a card says when there is no follower history for the dates. **Notes can be spoken** (Sean, 2026-11-01: "Make it so I can leave a voice dictation on the post"): the note box has **Speak** (`wireSpeak` in `admin/depot/social.html`), the browser's own speech recognition writing at the cursor until Stop or silence, nothing recorded by us; no button where the browser has none (Firefox). The box is `data-dictate="off"` so `ve-dictate.js`'s floating mic does not double it. **A direct change by a person leaves Logan an open note** saying what changed (pictures and videos taken out and put in by file name, the
new time, Caption rewritten), in Notes for Logan; Logan's own changes leave none.
**Music** (Sean, 2026-11-01: "Instagram: Reels only, from Meta's library for outside apps. TikTok: the top 100 trending songs on photo and
carousel posts; videos with music get finished in the TikTok app"; migration `20261101_ve_social_sound_story.sql`). Checked against
Metricool's own OpenAPI spec (`app.metricool.com/api/swagger.json`, read through pg_net since the build session cannot reach it): Instagram
takes `instagramData.audioConfiguration` (`audioId` required, title, `audioType` music | original_sound, `audioVolume` and `videoVolume` 0 to
100) on Reels only, songs from `GET /v2/scheduler/catalogs/instagram/audio?searchQuery=`; TikTok takes `tiktokData.music` (`musicId`, title,
author, previewUrl, thumbnailUrl, and in practice `soundVolume`, refused without it though the spec does not mark it) on photo posts only,
songs from `GET /v2/scheduler/catalogs/tiktok/trending-tracks` (the top 100, `commercialMusicId`). A slot keeps its pick in
`ve_social_slots.sound` `{instagram?, tiktok?, by_hand?: {song}}`; the slot's **Music** panel (`musicPanel`, `wireMusic`) searches Instagram's
library (with Play to hear it and a mix: song and the video's own sound 100/100, song quieter under the voice 25/100, song only 100/0) on a
reel, video or episode, shows TikTok's top 100 (filter, Play, Pick) whenever TikTok is ticked, and takes **Not in the list?** (a song named
by hand). `ve-social` `sounds` {brand, net: instagram | tiktok, q?} reads the catalogs live. **What goes by hand, named ahead of time**: a
TikTok video with a song (TikTok is then Post by hand, "finish it in the TikTok app with <song>"), and a song named by hand (Instagram and
TikTok by hand unless a picked song covers them); the rest still schedules in Metricool. Instagram photo posts and stories get no song.
Proven 2026-11-01 against the real Metricool with [TEST] slots in December: a reel scheduled with its Instagram song at 25/100 and TikTok marked
by hand with the song named; a TikTok photo post scheduled with its song; then skipped (gone from Metricool) and the rows removed.
**Stories and Also share as a story** (same migration). A story slot goes to Metricool as type STORY; on 2026-11-01 a test story (today's
Find your Guide cover on a 9:16 frame) was scheduled on Vegans Explore's Instagram, Metricool held it as `instagramData.type` STORY, and it
published at 2:03 PM Eastern as an Instagram story (`instagram.com/stories/vegansexplore/...`). The same check found `sync` reading Metricool's
PUBLISHING as posted; only PUBLISHED or SUCCESS counts now.
A post's form has **Also share as a story** (any kind but story and thread): it adds a story slot 15 minutes after the post
(`STORY_AFTER_MIN`), on the post's Instagram and Facebook, with `story_of` the post, its links and a By hand link sticker step, and status
**held** (Waiting for 9:16 media) unless the post already has 9:16 media. Each picture and video carries its `w` and `h` (the page measures
them before saving, `measure`, `measureAll`); once every picture or video on a held story is 9:16 (height over width 1.70 to 1.86) it moves
to Waiting for approval, and back to held if a wide one goes on. A held story cannot be approved or pushed. The story follows the post's
time when the post moves, is skipped with it, and unticking the option skips it (out of Metricool if scheduled). `slot_get` returns the
post's `story` and the story's `parent`, linked on each slot. Proven 2026-11-01 with [TEST] slots (made held, moved to Waiting for approval
by a 1080 x 1920 picture, followed the post's move, skipped with it).
**Skipped slots are out of sight** (Sean, 2026-11-01: "When we skip a story, is it possible for us to delete or hide it? I don't like to see
things that we're not using"): the Plan (By day, a day, the Calendar view) and every chip leave skipped slots out, and a **Skipped** chip
shows only them (`inFilt` in `admin/depot/social.html`). A skipped slot has **Delete it** (an editor of the brand; `ve-social` `delete`,
refused with `not_skipped` for anything not skipped): the row goes, its notes and history with it (`ON DELETE CASCADE`), and a story made
from it keeps its own slot. Proven 2026-11-01 on a [TEST] slot (refused while waiting, skipped, deleted, its history gone).
