# History: daily-pulse

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## No city news: the Daily Pulse (Sean, 2026-10-05)

"We're not really doing news like that anymore. We're doing the Daily Pulse." Big local items go in
that city's Daily Pulse topic and national ones in the daily national topic (`ve_board_posts`, kind
`topic`, through `ve-board`). We don't write news articles: too many loopholes, and finding the right
image isn't worth the time. The one exception is a sponsor, because a sponsor gives us the graphics.

- A city hub opens on the Daily Pulse (`?tab=news` and `?tab=pulse` both land there): the city's
  topics and the national one (`VEHubNews.render` in `/public/hub-news.js` draws them with `VEPulse`).
  "Featured stories" under it shows only when an approved `ve_community_news` row or a published Pulse
  piece is tagged to the city. The "Submit news" form is gone.
- `ve-news-desk` (cron `ve-news-desk-6h`) keeps running: its leads feed the Pulse briefings.
- Depot > Inbox (2026-10-05): stories left alone feed the Pulse briefings; **Lead a Pulse topic** starts a
  topic from one story (`ve-board` `topic_draft` with `lead_id`). **Sponsor story** is the only way to
  write one up or share it to a hub: `ve-news-desk` `lead_write` and `lead_share` refuse without a
  sponsor name (`sponsor_only`) and save it in `ve_news_leads.sponsor_name`. A story a topic used
  (`topic_post_id`) counts as done (migration `20261005_ve_news_leads_sponsor_only.sql`). HQ's Depot calls
  the same function, so its write-up needs a sponsor too.

## Featured items in the Daily Pulse (Sean, 2026-11-01)

"What I noticed you didn't put into the post today was the episode, the launch of the Vegans Explore podcast. Let's do it for
tomorrow"; "we could be sending them stuff like that periodically". A `ve_pulse_features` row (`starts_on`, `ends_on` Eastern dates,
`communities` or null for every Vegans Explore city, `story` {title, take, url, source}; migration `20261102_pulse_features.sql`, RLS on, no
policies) goes first in the stories of every city's Pulse that publishes in those dates, never LESARUSS.ai's `lr-*` topics.
`ve_pulse_auto_publish` applies it as each draft goes out (`ve_pulse_features_apply(post)`), and `ve_pulse_features_apply()` applies it to
every waiting draft at once so the Pulse desk shows it; each story carries `feature_id`, so it is never added twice. A story that is ours
links to its page on our site (an episode: `/listen?show=&ep=`). First: the podcast's return ("Founder's Report: Back and Ready for Duty",
Nov 1) in every city on Monday, November 2. The same night five cities' drafts (South, Central and North Florida, Atlanta, D.C.) had failed
to write ("No new verifiable story"); they were queued again with the episode as their lead (`write_status` queued, `write_note` 500
characters at most, then `lesaruss_dispatch_tick()`). Each city's Pulse already carries the national news under its own (Across the
country, since 2026-10-31); there is no separate national Pulse (`pulse_auto.communities` has no `national`).

**5 to 10 stories, never empty, and our own content** (Sean, 2026-11-01: "at least 5 to 10 stories in there. And then we can intermix
some of our content... podcast episodes, some interviews... spotlight a restaurant... nominate somebody in your community that we should
interview... share some new bounties... what new listings have been created in their chapter"; migration `20261102_pulse_house.sql`).
The writer's `pulse_topic_write` instructions now ask for 5 to 10 stories, the city's own first, then national ones to fill, and never fail
a city for lack of news (lead with the national ones and say so). **From Vegans Explore** is a section of every city's briefing built from
our data when it publishes (`ve_pulse_house(city, post, record)`, called by `ve_pulse_features_apply`, stored as `briefing.house`, drawn by
`VEPulse.briefing` in `public/ve-pulse-topics.js` between Heads up and Today's move): **Spotlight** (a 100% Vegan food place in the chapter
with a logo and its own words, most voted, not spotlighted there in 60 days), **New in the Directory** (public listings that went live in
the chapter since its last Pulse, five and See all N; `listings.listed_at`, set by `trg_ve_listing_listed_at` when a listing turns
approved), **Listen** (one of our four shows' episodes on `/listen`, not used there in 120 days), **New bounties** (opened in the chapter
since the last Pulse) and, on Mondays, **Who should we interview?** (Nominate someone, `/pulse/suggest?city=`). `ve_pulse_house_log`
rotates them. A featured item is never added twice (not when the writer already wrote its link as a story).

**A real newsletter, Bounty of the day, story pictures (Sean, 2026-11-08, playbook `ve-daily-pulse-discussion`)**: From Vegans Explore draws the
**The Pulse look, LOCKED by Sean 2026-11-09** ("merge it to main"; handoff `docs/handoff/2026-11-09-ve-daily-pulse-discussion-pulse-look-locked.md`): every story is a small picture row (no big lead) under eyebrows, Top news > In <City>, then topics (Food and drink, For the animals, Health, Community, Business, Film books and media; the writer's `stories[n].topic`); never "national" or "international" in Pulse copy (we serve the Vegan community everywhere). Heads up events wear the calendar's date tile. Every From Vegans Explore item (Spotlight, Bounties of the day up to 4 from `ve_pulse_house.bounties_day`, New in the Directory, Listen) is the Directory card at one size (320x132, 269x132 on phones). **The Directory card has Save everywhere**, and its admin More menu works on cards outside the Directory (`VERegionDirectory.admin`); never make an alternate card. Pictures fill by cron `ve-pulse-pics` (`ve_pulse_pics_tick`, switch `pulse_pics.auto`); the ?pics=1 gate is gone.
Directory's own cards (`VEPulse.hydrate` in `public/ve-pulse-topics.js`: Spotlight with Vote, New in the Directory as a strip with See all, the
episode as the show's row). Never "Friendsgiving" in our Pulse copy (writer rule in `pulse_topic_write`). **Bounty of the day**: `ve_pulse_house`
adds `bounty_day`, one open bounty per city per day, least recently shown first (`ve_pulse_house_log` kind `bounty_day`), skipped while a live
`ve_pulse_features` story links to it. **Story pictures are a preview only** (`?pics=1`, pictures copied by edge function `ve-pulse-pics` into
`vegan-media/media/pulse/stories/`); once Sean approves, remove the gate and run `ve-pulse-pics` on every published Pulse. The non-member note reads
Join free (Explorer survey). Handoff `docs/handoff/2026-11-08-ve-daily-pulse-discussion-visual-pulse-bounty-day.md`.

## The Daily Pulse is the Community Board (Sean, 2026-10-26)

"I would like to see the pulse to really be the community board... the same kind of header that the other pages have... navigate
between the different chapters... like traveling to these different locations." `/pulse` (`pulse.html`, which was `board.html`;
`/board` forwards here, query kept; the old article feed is gone, its pages still open at `/pulse/<slug>` and the shows on
`/media`) wears the city banner (`VECityBanner`, key `pulse`): `?city=<hub>` (an old `?community=` still works), else the
member's home city, else the last pick, else All cities, which lists every chapter (`ve-board` `list` with community `all`; topics
from every city and the national one, posts from every city with their city tag, no How it works posts). Six tabs, the Daily
Pulse first: Daily Pulse, Jobs, Classifieds, Fosters, Rescues, Suggest a Topic. **Requests & Offers left** (Sean: "doing similar
stuff to jobs classified"; it had no member posts); an old request still opens. **Every tab has its own address** (Sean,
2026-10-27): `/pulse`, `/pulse/jobs`, `/pulse/classifieds`, `/pulse/fosters`, `/pulse/rescues`, `/pulse/suggest` (a rewrite in
`vercel.json` before `/pulse/:slug`, so none of these can be an article slug; an old `?lane=` link moves to its address; back and
forward move between tabs). Each tab has its line and its button (Post a job, Post a listing...; on the Daily Pulse, Suggest a
topic), and **the button sits in the banner between View community and Expand** (the banner's `action`, relabelled by
`setAction` as the tab changes), like Submit an event on `/events`; the one under the tabs shows only in a city hub's frame,
which hides the banner. Two cards across beside the ad rail on every tab and post. A post's
conversation is its **Comments** (Add a comment, Post comment); topic cards say Join the conversation. Anyone reads; posting,
commenting, contact details and reports are for members, and anyone else gets the Passport window (`VEVotes.memberPrompt(kind)`:
post, comment, contact, report, job; `/passport?from=board`), never a sign-in box. **Hiring is a perk of a business in the
Directory** (the viewer owns a listing, `listings.owner_member_id`; `ve-board` returns `viewer.business` and refuses a Hiring post
otherwise with `business_only`); any member posts Looking for work. The composer picks the chapter. The dashboard's Daily Pulse
tab frames this page on the member's active city (`#dash-pulse-host`, loaded the first time the tab shows, sized by
`ve-frame-height`); a city hub frames it with `?community=<slug>&hub=1` and hides the banner.

**The Pulse's article pages are episode pages** (Sean, 2026-11-01: "The banner on this page is broken... we have a lot of articles
setup this way... we need to fix the formatting and how people find them"). `/pulse/<slug>` is `api/pulse-article.js` (server-rendered,
cached an hour). 278 of its 279 published `ve_pulse_content` rows are a podcast episode's show notes, and Google sends people to them
(Chris Moore, SoFlo Vegans Ep 006, ranks first). Each page now wears the shared banner (`VECityBanner`, key `pulse`, folded: Daily Pulse
over the show, the picker is our four shows and opens the show's Directory page, Pulse home; a non-episode article picks a chapter's
Pulse), the title as the page's `h1` (the notes wrote it as an h2), and under the summary **the episode**: YouTube, or the show's own
audio from its feed (`ve_pulse_episode(slug)`, public: the show and its feed episode; 277 of 278 play, from 223 before; only the Vegans
Who Lift preview has nothing), Open on the show page (`/directory/<show>?ep=<guid>`) and Every episode; **On this episode**
(`ve_person_credits`, the People profiles); and at the foot **More from <show>** (previous, next and the six nearest, each its own
`/pulse/<slug>`). The rail is `ve-ad-rail.js` (`data-ad-page="pulse"`), so HTML5 ads play (it drew them as a broken `<img>`). Pictures go
through Vercel's resizer (`i.ytimg.com` and `img.youtube.com` added to `images`). Schema.org `PodcastEpisode` in the page; the title
reads "<title> — Vegans Explore". **The way back** (Sean, the same day: "build the show page back-link too"): an episode's view on one of our four
shows' pages (`/directory/<show>?ep=<guid>`, `public/ve-episodes.js` `notes`) adds **Show notes**, its `/pulse/<slug>`, after Play
(`ve_pulse_for_episode(listing, guid)`); the feed's own link becomes On their site. **Both read one table**, `ve_pulse_episode_map`
(migration `20261101_ve_pulse_episode_map.sql`, RLS on, no policies), kept by cron `ve-pulse-episode-map` (every 10 minutes,
`ve_pulse_episode_refresh(60)`, the oldest first, a new article within 10 minutes): matching live took up to 0.9 s and timed out under
load. The match (`ve_pulse_episode_compute`): `ve_content_feed_episode` (title, or date within 2 days), else the feed's episode number
within 120 days sharing a title word (the renamed early SoFlo Vegans episodes); dropped when another article of the show is clearly
closer to that feed title, and one feed episode belongs to one article (the loose date rule had given the wine fining article the
Michelin episode and A Moment of Clarity the NYC Tour Day 01). On 2026-11-01: 266 matched, every one linking both ways.

## Community Board sections (Sean, 2026-10-10)

"In each city, let's set the sections... a jobs board... a classified... a Fosters Board, and then a
Rescues Board... so as people start going into these cities, they actually see stuff." Every city's
board (now `/pulse`, above) has the toggles Daily Pulse, Jobs, Classifieds, Fosters, Rescues and Suggest a Topic
(`/pulse/jobs|classifieds|fosters|rescues|suggest`, the Daily Pulse is `/pulse`; Requests & Offers left on 2026-10-26). A row of tabs on
desktop, three by two on a phone.

- Each section is a `ve_board_posts.kind` (`job`, `classified`, `foster`, `rescue`; Requests & Offers is
  `request`/`offer`). In the new four the category is the post's type: Hiring / Looking for work; For
  sale / Free / Wanted / Trade; Needs a foster / Can foster; Urgent / Needs a rescue / Update. The
  lists live in `LANES` in both `ve-board` and `board.html`; change both together. Rescue and fostering
  left Requests & Offers for their own boards (the old categories are still accepted).
- Every section in every city opens on a pinned "How it works" post (`pinned`, category `guide`),
  shown as from Vegans Explore, held by the `pulse_auto` account. A new city needs its five (migration
  `20261010_ve_board_sections.sql` is idempotent: re-run its insert with the city added).
- "Done" reads per section: Mark resolved, filled, gone, placed, rescued.
- The local Daily Pulse runs for every city (`pulse_auto.communities`, same migration).
- **Suggest a Topic** (Sean, 2026-10-10), the seventh section (`?lane=suggest`, kind `suggestion`): For the Daily Pulse
  (`pulse_idea`), Something to talk about (`talk_idea`), An idea for the board (`board_idea`); done reads Covered. The Pulse
  writer reads the city's open `pulse_idea` posts, most replied first, uses one only with a real source, and sets
  `briefing.suggestion_id`; when that briefing goes live, trigger `trg_ve_board_suggestion_covered` marks the suggestion
  Covered and replies with the link (migration `20261010_ve_board_suggest_topic.sql`). On a phone the toggles are three
  across with Suggest a Topic across the bottom.
- **Areas** (Sean, 2026-10-10: "they can pick specific cities, they can choose all cities, and then people can further
  drill down"): a post is for one area of its city or the whole city (`ve_board_posts.area`, empty = whole city), and an
  area filter beside search shows that area's posts plus the whole-city ones (`ve-board` list `area`, `?area=` in the address
  bar). The areas are `VE_HUBS[].page.boardAreas` in `/public/ve-hubs.js`: South Florida by county, DMV as DC / Maryland /
  Virginia, New York by borough, London by compass point. Change a city's areas there.
- **Hot tips** (Sean, 2026-10-10: "a way for people to leave news, hot tips, letting us know what's going on in their
  cities"): the first Suggest a Topic type (`hot_tip`). The Pulse writer reads open hot tips with the Daily Pulse ideas
  (migration `20261010_ve_board_areas_hot_tips.sql`).

## Daily Pulse on autopilot (Sean, 2026-10-05)

"Have it set up the day before. And then if I look at it, I look at it. If I don't, it goes out."
At 6 PM Eastern (cron `ve-pulse-auto-queue`, 22:00 UTC) `ve_pulse_auto_queue()` queues tomorrow's draft
for each community in the `pulse_auto` row of `lesaruss_dispatch_settings` (`national` and all eight
cities since 2026-10-10; a city joins by adding its slug). The Background writer (dispatcher source
`pulse_topic_write`, Station 2) builds the briefing and its first reply (`ve_board_posts.first_reply`,
also `briefing.first_reply` so the desk shows it). Every 15 minutes `ve_pulse_auto_publish()` (cron
`ve-pulse-auto-publish`) publishes what is due at 7:00 AM local (`auto_publish_at`) the way `ve-board`
`topic_publish` does, under the account in `pulse_auto.member_id` (Sean's). A draft still being written,
failed, missing a part, or more than 12 hours late does not go out on its own. To stop one: Discard in
the Pulse desk (Depot > Inbox). Migration `20261005_ve_pulse_auto.sql`.
