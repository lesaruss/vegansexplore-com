# History: dashboard

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## Dashboard versions (Sean, 2026-10-24; built 2026-10-25)

"The dashboard could actually be the main dashboard, and then we have different versions of it. So if they're a coach...
if they're a pre-vegan, the dashboard set up a certain way." One `/dashboard` with four versions: **Business**, **Just
starting** (`pre_vegan`), **Coach or pro** (`coach`) and **Member**. **The survey picks it, not a dropdown** (Sean, 2026-10-28: "I
don't get the drop down... we should know who they are... using a survey to figure out how to tailor this experience for them...
a detailed survey where they can get 250 points... They could save it and come back to it"; migration
`20261028_member_survey_drafts.sql`): the version switch is gone and `members.dashboard_version` is no longer read (`ve-dashboard`
`home` returns `ve_dashboard_version()` and `survey {completed, at, active}`). **Your survey** is the Mission Survey on its own page,
`/dashboard/survey` (`survey.html`, `openSurvey`), the first For you tile until it is done. **It is the member's profile, built like a
dating profile** (Sean, the same day: "treat it like a dating profile where it asks different questions about themselves that will be
added to their profile... a combined 250 points for every question they answer with some questions being worth more than others";
migration `20261028_member_profile_points.sql`): **Your profile** (`VEMissionSurvey.profile`) shows every question as a card, answered
in any order, one question per view (`#q/<id>`, Save and next, Save, Back to your profile), with points earned out of 250 and Answer
the next one. 31 questions: **In your words** (`p_meal`, `p_why`, `p_day`, `p_meet`, `p_fact`, 300 characters, 15 points each) and
the old survey's, now none required; the ones marked `team` (market research) sit under **Help us build your city**, "for the team,
not your profile". The points live in `ve_profile_questions()` (`PTS` in the script only draws them); `ve_profile_answer` saves each
answer the moment it is given (`members.mission_survey_answers` and the columns it maps to) and pays it once (`ve_points_grant`,
reason `profile_answer`, ref `profile:<question>`), never again on a change; complete (`mission_survey_completed_at`) means all 250
earned. `ve-mission-survey` `profile`, `answer`, `save` (`draft`, `draft_save` and `submit` still work). The Guide's setup asks the
same questions one after another (`VEMissionSurvey.mount`, each Next saves and pays that answer, Save and finish later moves the setup
on). The For you tile reads Build your profile / Keep building your profile with the points left (`ve-dashboard` `survey {earned,
total}`). The old survey's 250 had never paid anyone (`award_points_bounty` had no `mission_survey_completed` rule); its two finishers
were paid for their answers by the migration. No other member sees a profile yet. **What matters to you** (q23 to q26) counts Health or
medicine and Coaching or fitness as Coach or pro. `ve-mission-survey` is in the repo since 2026-10-28.
**Your numbers** (Sean, 2026-10-28: "under your role, it says platform health... For the members... what are the three things that
they're going to want to see... their points and their level. And if they're an ambassador, their... commissions"): every member but a
super admin gets three tiles on the Dashboard tab, Your points, Your level (points to the next) and, for an Ambassador, **Earned in
<year>** (this year's commissions but refunds, from `ve-affiliate` `me`), else Joined with your link (`renderMyNumbers`; each opens
Points and levels). Your Role (Platform Health) stays for super admins, Today's Pulse for Community Managers. A version decides only which cards join For you
(`renderVersion` in `dashboard/center-console.html`) and the order of Your tools (`DASH_TOOLS_FIRST`); everything else is
shared.

**Every tab wears the city banner** (Sean, 2026-10-27: "the dashboard and the depot and my saves... and even guides... should have
the same header as events directory... when you expand it to see something there, even if we still use just the city that's
selected"): the Dashboard (Welcome back, <name>; it replaced the welcome row), Guides, My Saves and the Depot join Directory, Events,
Communities and Media (`mountTabBanners` in center-console). The picker is the dashboard's active city on every one; open, each
shows its own numbers (`setTabStats`: points, lifetime and level; your points and the Guides they unlock; episodes and places
saved; Events waiting and New places ready to list, which open them). The Depot's Go to is the site's dropdown (white, 6px corner,
our chevron; `depot-tabs.js`), and Take the tour (`ve-tour.js` `.ve-tour-launch`) has a 6px corner, not a pill.

The menu (Sean, 2026-10-27): Dashboard, Directory, Events, Daily Pulse, Media, Guides, Communities, My Saves, then Depot for
super admins (`data-tab-order` on each section; `data-tab-superadmin` hides one from everyone else and from a View As preview).
View As moved from the welcome row to the avatar's account menu.

The Dashboard tab (Sean, 2026-10-26): **For you** (it was Action items) is one list of tiles, the checklist tiles (Set up
your Guide, New here?, the Community Manager ones) and then the version's cards (`ve_dashboard_cards`) as the same tile, each
with a flat line icon (`FICON`; Sean: "make sure the icons are flat. I don't like the colorful ones"). Five show, the rest
scroll inside; the version switch sits beside the title. The **Leaderboard** beside it is one board for everyone (no This City
/ Global: "people aren't really locked to any particular community anymore") and on desktop is exactly as tall as For you,
scrolling inside (`syncHome`). **Your tools** holds every tool, with flat icons (`memberTools`; the Community Manager ones for
staff, Contribute for active members, the admin cards first for super admins). The Tools tab left the menu: its section stays
only as the place a tool opens (Bounties, Campaigns, My List...), with "Dashboard" as the way back, and `/dashboard/tools`
lands on the Dashboard tab. **Guides** is a tab in the top menu, after Dashboard (`/dashboard/guides`; "one of the big things
that we're selling"), and a tile in Your tools.

**Insights beside For you, the Depot at the bottom** (Sean, 2026-11-03, playbook `ve-feedback`, live on main c905155): the Depot left the
top right of the super admin's Dashboard tab for the bottom, below Recent activity (`#dash-depot-block`, still `renderDepotBlock`, its own box
of about 330 px that scrolls inside and no longer matches For you's height), and in its place beside For you is **Insights**
(`#dash-insights-block`, `renderInsights` in `dashboard/center-console.html`): Web, Social and SEO tabs over the last 30 days against the 30
before, scrolling inside a box that `syncHome` sizes to For you. **Web** is visitors, page views, new members and top source plus the five
most visited pages (the same `ve-analytics` `report` Depot > Analytics reads, bots left out). **Social** is Vegans Explore's views, posts,
followers and their change, likes, top post and followers by channel (`ve-social` `report`, Metricool). **SEO** is Organic Search visits
against before, their share of all visits and the top content pages; there are no search terms or indexing numbers because Search Console is
not connected, and the tab says so. **See full insights** in the block's header follows the tab: Depot > Analytics, Depot > Social >
Analytics, Analytics > Traffic sources (`INS_FULL`). Order down the tab: For you and Insights, Revenue, the draggable Recent activity boxes,
the Depot. Same day: `.dash-tools-bar[hidden]{display:none}`, since `display:flex` had kept the Your tools search box showing to super admins.
Checked in a browser at 1440 and 390 px against mocked answers only; real numbers are Sean's first live look. The paragraph below is the
Depot's history; where it says beside For you, read bottom of the tab.

**The super admin's Dashboard tab** (Sean, 2026-10-30). Beside For you, in the Leaderboard's place, was **The Depot** (Sean, the same day:
"the most used depot tools that I use... sortable... most recently used... by the different topics"; `renderDepotBlock`,
`#dash-depot-block`): every row of `TABS` in `public/depot-tabs.js` as small tiles two across, with a search and Most used, Recently used,
By topic or Only one topic (kept in `localStorage` `ve_dash_depot_sort`). Use is counted in the browser (`localStorage` `ve_depot_use`,
`VE_DEPOT_USE`): a Depot page counts itself as it loads, the dashboard counts the Admin pages and Demos as it opens them. **Your tools is
gone for super admins** ("all of the items that are listed below in the your tools really should just be part of the depot"): Secret
Shopper, the Community Board and Guides left (the Daily Pulse and Guides are in the menu). `TABS` gained two groups: **Admin** (kind
`dash`: Leads, Members, Submissions, Role applications, Guest reviews, Platform health, Community Insights, opened in the dashboard's
frame; from a Depot page's Go to through a `ve-open-tool` message) and **Demos** (kind `demo`, each in a new tab: the sample business,
group and Gig Board, the Campaign Engine and its four Fieldhouse Protein pages, the Partner walkthrough and the five pitch decks). A new
admin page or demo is a `TABS` row. The **Inbox** is the first **Recent activity** box (`inboxCard`, the same rows as the other boxes, a
filter in its head in place of View all, late ones first; a box new to the saved order now lands first) (migration `20261030_ve_inbox.sql`): "anything that comes through, period, even if it's assigned to somebody
else... so nothing falls through the cracks". `ve_inbox_items()` is every request a person sent, wherever it came in (meeting
requests and Group Partner applications, Ask a person questions, leads that are not link clicks, Ambassador stories, Podcast
Network applications, profile requests, listing claims and applications, nonprofit surveys, events members submitted; tests and
LESARUSS.ai's own items left out); a new kind of request is a new `union all` there. `ve_inbox_state` holds what happened to each
one: assigned to the chapter's active Community Manager (the request's chapter, else the requester's home chapter), else the team;
**Opened** only when that person opens it (with no Community Manager, a super admin); **Replied** or **Closed, no reply needed**, by
hand (`ve-dashboard` `inbox`, `inbox_open`, `inbox_set`). The reply clock is **24 hours from when it came in** ("no more than... 24
hours... sooner the better", `INBOX_DUE_HOURS`); the head shows open, late and the average reply time, which is how a Community
Manager's work will be measured. Filter Open, Late, Not opened, Done, All (it opens on Open, or on All when nothing is open, Sean
2026-10-31; a filter picked by hand stays for the visit); a row opens the request in a window (who, chapter,
assigned to, opened, reply by, a team note, the reply box, Mark replied, Close, Open where it came in). **Replying from the Inbox**
(Sean, 2026-10-30: "go with your recommendation"; migration `20261030_ve_inbox_replies.sql`): the window's **Reply to <name>** (a
subject and the message, a blank line a new paragraph) sends an email from VEGANS EXPLORE <hello@vegansexplore.com>, signed with the
sender's first name and "Vegans Explore team", never Sean's name for anyone else; replies come back to contact@lesaruss.com and to the
Community Manager who sent it (`ve-dashboard` `inbox_reply`, Resend, 50 a day per sender). Sending it is the reply: `replied_at` is set,
so the 24-hour clock stops itself. Every reply is a `ve_inbox_replies` row (RLS on, no policies; `inbox_replies` lists them under the
box). **Send me a test first** (`test: true`) sends it to the sender alone with [Test] and stops nothing. Mark replied stays for an
answer given another way. **A Community Manager's own Inbox**: their Dashboard tab shows **Your inbox** above Your tools, the same box
with only the requests assigned to them (`ve-dashboard` `inbox` filters to theirs); a requester's picture opens their member card for
super admins only.
**Recent activity** has the **Leaderboard** as one of its boxes, the same size (it stays beside For you for everyone else), and every
box has a drag handle (mouse, touch, or the arrow keys) to put it where Sean wants; the order is kept in the browser
(`localStorage` `ve_dash_recent_order`, `dashReorder`). **Every member thumbnail is a rounded square that opens who they are**
(`memberCard`): Recent Members, the voter on Recent Votes, Recent Leads (`ve-dashboard` `recent_leads`), the Leaderboard
(`leaderboard`) and the Inbox. A member's picture is their People profile photo when one names them (`details.person.member_id`),
else their account picture (`pictures()` in `ve-dashboard`). **Your tools**: the search on the left and the category filters to its
right, wrapping to another row; on phones the filters sit behind a filter icon beside the search (`#dash-tools-filter`).
**Vegans Explore only** (Sean, 2026-10-30: "It's showing votes for things that are on LESARUSS.ai... we need to make sure those
stuff stay separate"): LESARUSS.ai's listings (tags `lesaruss-ai-directory`, `-candidate`, `-business-member`) are left out of Recent
Votes, a member's latest votes, the inbox and the Depot's Logos (`ours` in `ve-discover`: To find, Suggested, the sweep, chain logos
and Done). They share the database; LESARUSS.ai's own Depot is to be set up the same way on its side.

- Which one: the member's choice (`members.dashboard_version`, the switch on the block; picking the suggested one clears it),
  else `ve_dashboard_version()`: owns a listing or Business owner in the Mission Survey (q3), business; q6 Curious / pre-Vegan,
  Flexitarian or Vegetarian, pre_vegan; Service provider, coach; else member (migration `20261025_dashboard_versions.sql`).
- Its cards: Business shows each listing they own, opening its business dashboard (`/directory/<slug>?tab=brand`), or Join the
  Directory; Just starting shows its `wizard` cards as numbered first steps; every version shows its What's new. Cards are
  `ve_dashboard_cards` rows by `audience` (business, pre_vegan, coach, member, all): change what a version shows with a row,
  no code. A business card's link that starts with `?` opens on their first listing's dashboard.
- Edge function `ve-dashboard` (`home`, `set_version`, `recent_votes`, `member_card`; verify_jwt off, the member token checked inside).
- **Your business first** (Sean, 2026-11-01, playbook `ve-listing-check`: "the dashboard on that profile becomes their dashboard"): anyone who
  owns a listing (any version) sees **Your business** at the top of the Dashboard tab, under the banner (`#dash-biz`, `renderBusinessFirst`):
  each listing (up to four) with its logo, Yours or Waiting for our approval, its listing check score (`ve-claims` `owner_dashboard` with
  `only: 'health'`), **Open your business dashboard** (`/directory/<slug>?tab=brand`) and **Your listing check** (`&pd=audit`). It replaced
  the Business version's listing tiles in For you; a Business member with no listing still gets Is your business in the Directory?.
- **Recent activity and the tools search** (Sean, 2026-10-30: "a log of user votes... an icon of the person that voted... a light box
  of who that person is... I don't have to go off this page"; "a little eyebrow... your tools, and then it has a search... put these in
  categories"). Super admins get **Recent activity** above Your tools: Recent Members, **Recent Votes**, Recent Leads, Events waiting and
  Guest Reviews, each the latest 100 scrolling inside a box of the same height (`#dash-recent`, `dpRows`). A vote row is the listing (its
  name opens it under the Directory tab), who and when, and the voter's picture on the right (`ve-dashboard` `recent_votes`, from
  `listing_daily_votes`). Any member picture there opens **who they are** in a lightbox (`memberCard`, `ve-dashboard` `member_card`, super
  admins only): status, Founding Member, role, level and points (a super admin's read ∞: they earn none; Sean, 2026-10-30), votes given,
  votes received (on their pages: listings they own, or a People profile naming them in `details.person.member_id`, which links a person
  without making them its owner; Sean's profile carries his, migration `20261030_people_member_link.sql`), places they checked in, saves,
  joined, home chapter, Instagram, their link, their pages, **Who voted for them** (the latest 25 votes on their pages, each voter's picture
  and name opening that voter's own card, and the page voted for; `voted_by`), **Who saved their pages** (the latest 25 saves of their pages
  or of an episode on them, the same rows, `saved_by`, `saves_received`; the team's view only, an owner's dashboard never names who saved),
  their latest votes, Copy email. **Your tools** has a search (every word must match title, line or category; Enter opens the first;
  Escape clears) and category filters (`TOOL_CATS`, `TOOL_CAT_OF`: Community, Guides and learning, Your account, Admin, Depot pages, Coming
  2027; a new tool takes `cat` or a `TOOL_CAT_OF` row). For super admins every Depot page is a tool too, read from `TABS` in
  `public/depot-tabs.js` (the dashboard loads it with `window.VE_DEPOT_LIST_ONLY`, which only exposes `window.VE_DEPOT_TABS`), opening
  under the Depot tab (`openDepotPage`), so a new Depot page joins the search with its `TABS` row.
- **Proven live as Sean, 2026-10-30** (a 15-minute session from the one-time `ve-once-dash-proof`, now the 410 stub; every
  `ve-dashboard` action and the page in a real browser). Fixed the same day: **Events waiting** (the Recent activity box, the Depot
  banner's count and the Event Submissions badge) read `ve-rewards` `list_pending_events`, which returns every tenant, so it listed
  LESARUSS.ai's 13 funding and business events as ours; it reads `ve-events` `queue` now (`veEventsWaiting`, Vegans Explore's tenant).
  A super admin's Dashboard and Guides banners read ∞ like the member card. **One search for super admins** (Logan's default, Sean's to
  change): the Depot panel; Secret Shopper joined `TABS` under Admin, the last super admin tool that was only in Your tools.
- **Linking a member to their People profile**: the listing editor's About them has **Their Vegans Explore account** (the email they
  sign in with; `ve-people` `save` `account_email`, `account`), which sets or clears `details.person.member_id`, one profile per account,
  never a Guide account, logged in `ve_listing_edits` (field `person.member_id`). It never sets `owner_member_id`.
- **A listing opened in the dashboard has its own address** (Sean, 2026-10-27: "if somebody just wanted to share a link to their
  page"): `/dashboard/directory/<slug>` (rewrite in `vercel.json`; back and forward move between the Directory and the listing),
  **Copy link** beside the breadcrumb copies the public `/directory/<slug>`, and the address opened signed out goes straight to
  the public listing (`listingSlugFromPath` in center-console). The public Directory already opens `/directory/<slug>`.

**Recent activity first, everything else as tiles** (Sean, 2026-11-10: the dashboard is "very jumbled"; Recent activity is what he uses
most; Your business "I don't need it to be as big and to the top like that"). Mock `/mocks/dashboard` (6 slides), then "Let's go ahead and
approve it. I want to see what it looks like live, and then if we need to make adjustments, we'll make adjustments." Live from commits ab739e14
and e2de9507 (`dashTilesLayout`, `dashApplyView` in `dashboard/center-console.html`; `dashLayout` was already a name there, the saved module
layout). **Super admins**: the banner, then **Recent activity** (moved up at run time, four boxes across, three under 1200 px, two under 1000;
on phones one box at a time, picked from a row of box names, `dashRecentChips`, the pick kept in `sessionStorage` `ve_dash_recent_pick`),
then **Your tiles**, one grid of same-size tiles: Your business (its logos and the listing with the fewest checks passed), Revenue (this month),
Insights (visitors, 30 days), the Your role row's three tiles moved in as they are (Platform health, Submissions, This week), For you (how many,
and the first) and The Depot (your most used page). **A tile opens its own view** under Dashboard &rsaquo;: `/dashboard/business`, `/revenue`,
`/insights`, `/for-you`, `/depot-pages` (rewrite in `vercel.json`), showing the block that used to sit on the page, unchanged; Back returns to
the dashboard. **A member who owns a listing**: Your business as a tile beside Your numbers' three tiles; For you and the Leaderboard stay as
they were. Everyone else: unchanged. No section use is counted anywhere (only the Depot's browser counter), so the order is from Sean's words
and the measured page. Measured as Sean before and after: at 1440, Recent activity from 2,074 px down to 172, the page from 3,883 px to 1,504;
at 390, from 4,840 px to 214, the page from 8,112 to 1,575.

## Sign In As: switch into another account (Sean, 2026-10-26)

"The same way I do view as, I want to have that option to choose from the super admin... so I can log in and see that
experience." View As only paints the page over the super admin's own session; **Sign In As** (the avatar's account menu,
under View As, `public/ve-account-menu.js`) is a real sign-in, so every call the page makes runs as that member. Only accounts in `ve_switch_accounts` can
be switched into (Logan Russell, Sean's founding-member walkthrough account, and the six Guides), only by a super admin signed in
as themselves, through `ve-switch-account` (`list`, `switch`; an 8-hour token carrying `switched_by`, refused for another switch;
each switch logged to `stream_events`). The super admin's own session waits in `localStorage` `ve_switch_from`; the
**Back to my account** pill (bottom left) or the account menu puts it back, and Sign out clears it. Add an account with a
`ve_switch_accounts` row. The Guide accounts (`<guide>.guide@vegansexplore.com`, `member_class` agent, no password, playbook
`ve-guide-accounts`) cannot vote, check in or give points (`ve_refuse_agent_actions` triggers on `listing_daily_votes`,
`ve_checkins`, `ve_listing_point_contributions`). Anything posted while signed in as a Guide is live and, until the Guide
badge is built, reads like any member's post. Migration `20261026_ve_switch_accounts.sql`.

**Any member, 2026-11-12** (Sean: "I need a view as this business. Same way on BCPS Marcom, I can log in as any user. I would like to be
able to do that to help diagnose and fix things"): `ve-switch-account` v2 (deployed 2026-11-12, source in the repo) switches into any member
who is not a super admin; `ve_switch_accounts` stays the short list shown first (Chaska and Next Level Veggie Grill added, kind member), and the
account menu's **Find any member or business** box (`list` with `q`) finds anyone by name, email or a business they own. Every switch is
still logged to `stream_events`, 8 hours, never chained, and Back to my account returns. A switched session is a real sign-in: anything
done there is done as that member. Also: a super admin previewing a business dashboard (`?l=`) no longer sees their own locations in the
Location switcher, and a super admin or an owner looking at their own listing page is never counted as a visitor.

## Money in: an email for every payment (Sean, 2026-11-01)

"John registered as a creator and made a payment, and I didn't get any notification that he made a payment... Is there something that
can be sent to me whenever we receive money?... branded and let me know what was purchased and by whom." Every live payment on the **Vegans
Explore** Stripe account that the webhook (`ve-stripe-webhook`) receives sends one email to
contact@lesaruss.com (since 2026-11-05, Sean: "I just want to see transactions from Vegans Explore": payments on the Meatless Muscle
and LESARUSS accounts send none, nor does a customer tagged `revenue_class: client_services`, Brooke's billing; `moneyAlert`) from VEGANS EXPLORE <hello@vegansexplore.com>, before any product's own branch runs, so a new product is covered with
no change: a paid Checkout session (`checkout.session.completed` or `async_payment_succeeded`, amount over $0) and a subscription renewal
(`invoice.payment_succeeded` other than `subscription_create`, which is its Checkout session). Subject "$11.00 in: <product> from <name>";
the email (`moneyEmail`): the brand's header (Vegans Explore's mark, else the brand's name), Money in or Renewal paid, the amount, the
product (`MONEY_LABELS` by `metadata.type`, else the line item), their first payment when it is, What (Stripe's line items), Who (name and
@username), Email, Member (Founding Member or Member, role, home chapter, account since), When (Eastern), Paid to (which Stripe account),
**See it in Stripe**, and This month so far (Eastern month). `ve_money_alerts` (migration `20261101_ve_money_alerts.sql`, RLS on, no
policies) keeps one row per payment (`stripe_id` unique), so a Stripe retry never sends twice; `sent_at` or `send_error`. Test mode sends
nothing. A new product reads best with a `MONEY_LABELS` row. **Preview** any real session: POST
`ve-stripe-webhook?money_preview=<cs_...>` with `Authorization: Bearer <LESARUSS_ADMIN_TOKEN>` ([Preview] subject, no row). **Labels by what it is** (2026-11-01, v63 from commit 46ab777, source sha256 matched): `moneyLabel` names the one type that covers several
products from the session itself: `ve_verified` is the Partner plan ($111 every 111 days, with its offer and period) or Passport Stop or Anchor by
`metadata.tier` (it was "VE Verified (yearly)" for all of them); `entry_contribution` is a listing claim when it carries `claim_id`, a contribution
when the buyer was a member over an hour before, else the Passport. HQ's LESARUSS-account kinds have labels (`lr_passport`, `listing_claim`,
`guide_order`, `business_membership`, `campaign_pledge`), and a renewal is labeled from its subscription's metadata
(`parent.subscription_details`, else `subscription_details`) instead of the raw invoice line. **This month** counts from midnight Eastern on the
1st, read from the zone (04:00Z under EDT, 05:00Z under EST; it was always 04:00Z, which would have put Nov 30 11 PM in December). Untyped
sessions (payment links such as the LIVE Donation) read well from their own line item and need no label. Payments before
2026-11-01 2:36 PM Eastern sent nothing; John Thomas's $11 Passport (11:00 AM that day) was sent as the first preview. Deployed as version 62
from commit 3292d5a (source sha256 matched; the deployed source was checked against main first).

## Revenue on the dashboard (Sean, 2026-11-02)

"I just want to be able to see that revenue coming in through Vegans Explore in real time... just some little module... Eventually
we'll create a financial back end where we could do P&Ls... that's for another day." The super admin's Dashboard tab opens with
**Revenue** above Recent activity (`#dash-rev`, `renderRevenue` / `revDraw` in `dashboard/center-console.html`): Today, This month (against
the same days of last month, with last month in full), This year and All time, each gross with payments and what is left after Stripe's
fee; a bar chart (Last 30 days, Last 90 days, By month; each bar's tooltip says the day, the total, the payments and after fees; drawn at
its own width so a phone reads it); and the latest 15 payments, each named by its Checkout line item or its invoice's first line, opening
in Stripe. Read live by `ve-dashboard` `revenue` (super admins only) from the **Vegans Explore Stripe account** (`STRIPE_SECRET_KEY`):
every succeeded live charge, less refunds, by Eastern day, `balance_transaction` for the fee; cached 5 minutes in `ve_analytics_cache`
(`ve-revenue-v1`), **Refresh** reads Stripe now (about 3 s for 97 charges). It counts everything on that account, which on 2026-11-02
included **CRM + Web Hosting for Miss Meatless Muscle** ($200 a month) and VWL Monthly Podcast Donations; the LESARUSS and Meatless Muscle
Stripe accounts are not counted. Not a P&L: no costs. `ve-dashboard` v20 from commit af6254b (source sha256 matched).
**Client services apart** (Sean, 2026-11-02: the Meatless Muscle hosting "always probably should have been set up through LESARUSS";
Vegans Explore Inc. is a Florida nonprofit corporation that never applied for 501(c)(3)). A charge whose Stripe customer carries metadata
`revenue_class: client_services` is left out of the tiles and the green bars and shown on its own line ("Client services billed through
Vegans Explore Inc."), grey on top of the bars and tagged in Latest payments (`client` in `ve-dashboard` `revenue`, cache key
`ve-revenue-v2`). Tagged 2026-11-02, with an `internal_note` each (Stripe metadata, never shown to the customer): Brooke Sellers' CRM +
Web Hosting subscription (`sub_1R8j48P0w5C9oZhvfxwBZw8p`, $200 a month, active, 20 payments, $4,000), the two Vegans Who Lift "donation"
subscriptions (Brooke Sellers and John Thomas, $125 a month each, 10 payments each, $2,500, ended 2026-04-15) and their three customers. To
move another payer apart, tag their customer the same way. Live 2026-11-02, `ve-dashboard` v21 from commit 4397d90 (source sha256 matched):
client services $6,500 from 40 payments; Vegans Explore $6,416.02 all time from 57, $108 this year. The CPA memo is a private Claude Doc
(Sean's), not in the repo. Still open: moving Brooke's billing to the LESARUSS Stripe account before the 2026-11-30 charge (Sean's call on
how to tell Brooke), and the CPA's answers. Proven live
2026-11-02 as Sean through a one-time function (`ve-once-rev-proof`, now the 410 stub): $12,916.02 all time from 97 payments, $2,358
this year, $11 today; cached 0.3 s; a member who is not a super admin refused (403).
