# History: directory

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## Campaigns on a listing (Sean, 2026-10-04)

A brand's campaign runs on its Directory listing: `directory/listing.html` shows a campaign banner,
a Campaign tab (tasks with points, your progress, a city leaderboard, the creators), an Events tab
and a sidebar card whenever the listing carries a campaign (`l._campaign`), and Food Brands get
their Menu tab labeled Products. The demo, `/campaign-engine/fieldhouse-protein` (rewrite in
`vercel.json`), is that real page in demo mode: `?demo=<slug>` or `/campaign-engine/<slug>` loads
`/campaign-engine/<slug>/listing-demo.js` instead of the database, labels it Illustrative, turns
off votes, saves and claims, adds a member / brand view switch and a week stepper (the demo's
`campaignAt(week)` returns the campaign as it stood that week, 1 to 10, then Final), and starts a
`ve-tour.js` spotlight tour of the campaign. `/campaign-engine/fieldhouse-protein/social` shows the
campaign in our Instagram, TikTok, Community Board, Daily Pulse and member feeds. Campaign rules:
everyone starts at zero, a capped points total, joining Vegans Explore is how you enter, a grand
prize for the most points, prizes for each city's top 10, and digital rewards (coupons) at set totals. Live campaigns are not wired yet: `ve_bounty_campaigns.host_listing_id`
links a campaign to a listing, but the table has no public read, so it needs to come through the
`ve-bounties` function first.

## Explore and the Directory (Sean, 2026-10-04)

The homepage hero offers two ways in: Start Your Journey (the Passport Guide, `/passport`, since Sean 2026-10-26;
the guided tour stays at `/welcome`, which the footer's About opens) and Explore Now (`/explore`), a one-screen overview for visitors who want to look around first: Guides,
Directory, Communities and Community Board cards, the $11 Founding Membership, and a link to the tour.
Log In stays in the nav. Explore cards use our illustrations, never photos.

`/directory` is open to everyone again (it was locked to super admins and redirected to
`/communities`). Anyone can browse, search and see vote counts. A signed-out Vote first opens a small window (Sean, 2026-10-26: "a prompt
that explains why they're going to the passport page"): Members only, Voting is for Passport holders, why it matters, **Explore
the Passport** (`/passport?from=vote&back=...`), Not now, and Sign in for members (`/login?next=...`). Voting again too soon opens
the same window: You've voted for this one today, with when the next vote opens in the visitor's time zone, and Got it. A
signed-out Save gets the same window for saving (Sean, 2026-10-26: "do the same for the save button"; Saving is for Passport
holders, `/passport?from=save`, where the Passport Guide shows a Saving is for members note), and so does a signed-out Check in
(Check-ins are for Passport holders, 10 points a visit, `/passport?from=checkin`); checking in again the same day opens
You've checked in here today, with when the next one opens (midnight Eastern, in the visitor's time zone); a signed-out Give
(the Give points box) opens Giving points is for Passport holders (`/passport?from=give`). They are
`VEVotes.passportPrompt()`, `VEVotes.savePrompt()`, `VEVotes.checkinPrompt()`, `VEVotes.checkedInPrompt()`, `VEVotes.givePrompt()` and `VEVotes.votedPrompt(next)` in `/public/ve-votes.js`, styled like the $11 window in `ve-auth.js`;
the Directory cards, the listing page and `nav.js`'s members-only gate (for `.vote-hero-btn` and the phone's sticky vote) all
use them (Save: the listing's Save and the phone's sticky save). The Guides' Save buttons show only to the Guide's owners. Since 2026-10-25 `/passport` is the Passport Guide, no longer a redirect to `/welcome`.

The Directory runs on `/public/ve-region-directory.js`, the same component as the city hubs (rebuilt
2026-10-04 after an audit; the old page had its own out-of-date sections, region list and copy). One
component means the sections, badges, vegan filters, search, the public vetting rule
(`/public/ve-trust.js`) and the hidden `lesaruss-ai-directory-candidate` listings match everywhere:
change the Directory there, not in the page. The page adds a city picker from `VE_HUBS`
(`/public/ve-hubs.js`), a hero with that city's art (New York for all cities), `?city=<hub slug>` and
`?tab=<section>` in the address bar, and the Founding Membership box for non-members.

Chapters a listing serves (Sean, 2026-10-24: Florida Animal Rescue Alliance "covers the entirety of Florida... PETA, that
would be a global organization. It could have its headquarters notated, but it should show up in all the community
sections"). The address puts a listing in its home chapter; `listings.communities` adds more (hub slugs from `VE_HUBS`, or
`all` for every chapter, new ones included; migration `20261024_listing_communities.sql`). `ve-region-directory.js` shows a
listing in a chapter when either says so (callers pass `hub: <slug>`), the card reads like a brand, by its reach, never its headquarters' city (Sean, 2026-10-27, Be An Animal Hero "still says Jupiter"):
Every chapter, All of Florida (every chapter of a state with more than one), the two chapters by name, or N chapters (`reachOf` in
`ve-region-directory.js`). Statewide and national organizations were set the same day: Florida Animal Rescue Alliance and the
Muscovy Sanctuary of Florida all of Florida, sixteen national advocacy groups (Animal Welfare Institute, IFAW, Farm Animal Rights
Movement...) every chapter, and the listing page adds "Serves every chapter" or "Also serves Central Florida". Set it in the listing
editor's Chapters section (`ve-listing-admin.js`, saved by `ve-claims` `admin_listing`). Passport Challenge and Tours stops
still go by address.
**PETA and the national organizations** (Sean, 2026-10-28: "PETA. I haven't seen it on the website at all... that's a glaring
omission"; migration `20261028_national_organizations.sql`). PETA, the Physicians Committee, Sea Shepherd, Vegan Outreach, The Vegan
Society, DxE and Anonymous for the Voiceless had sat quarantined since the June Instagram import: the backlog check filed them as
"A person" (Instagram leaves the business flag off big accounts) or "Not a restaurant", lists that only offer Set aside. They were listed
and fifteen missing ones added (Animal Legal Defense Fund, Best Friends, In Defense of Animals, Compassion in World Farming, United
Poultry Concerns, Born Free, Sentient Media, Animal Outlook, Last Chance for Animals, Food Empowerment Project, The Good Food Institute,
Veganuary, Faunalytics, Nonhuman Rights Project, and Animal Place, a sanctuary in Grass Valley): headquarters from Google Places where
Google has them, the rest online, every chapter (Animal Place by address only), each with an About from its own description. Ten smaller
animal groups the same check buried (Fish Defender, UnchainedTV, Karma Farm Sanctuary, Hogs & Kisses...) went to New places > Ready to
list for Sean to confirm. Before trusting "A person" or "Not a restaurant" on an Instagram row, read its bio: an organization's
account often has no business flag.

Vetting (Sean, 2026-10-25: "they're not all vetted... it requires 10 different people, not one person 10 times... Otherwise,
it's just... in its own section that only shows up for members... I can overrule that"). A Vegan-friendly or Vegan-options food
place (Restaurants, Bakeries & Cafes, Food Trucks & Vendors, Catering, Meal Prep; brands and markets never) is public only once
10 different members vote for it (`listings.voter_count`), its business claims it, or a super admin ticks **Vetted by us** in
the listing editor (`listings.vetted_at`, `ve-claims` `admin_listing` `vetted`). Until then it sits in the members-only **Being
vetted** section of the Directory and every hub (`vetting` in `CAT_CONFIG`, closest to 10 first, each card with "N of 10 member votes" on its own line under the details) and its page asks visitors to
join. The rule is `/public/ve-trust.js`, switched on and its number set in `ve_site_settings` `directory_trust` (Depot > Claims);
migration `20261025_directory_vetting.sql`.

Directory review (Sean, 2026-10-25: "have these businesses quarantined in a place where I can go through them manually... I
just wanted to remove and not even mark as permanently closed... the idea of permanently closed is I would like people to be
able to look at those from a nostalgic point of view"; migration `20261025_directory_review.sql`). Every listing has four
outcomes, all through `ve_listing_set_state` (Depot > **Directory review**, `/admin/depot/directory-review`, `ve-outreach`
`listing_state`; the listing editor's Hold for review and Remove buttons): **on the Directory** (status approved), **On hold for
review** (status `pending`, `details.review` with the reasons), **Removed** (status `rejected` with `details.removed_*`: off
everywhere, not under Closed, never deleted, put back from the Removed list) and **Permanently closed** (kept under Type > Closed,
for memory). Never use Permanently closed just to take a listing down. Red flags (`ve_directory_review_flags()`): Google says it
is closed, the monthly check-up's closed or quiet flag, no socials, no hours, no street, no website, a website that does not
open (a site that only blocks our scanner does not count). The strong ones (Google says permanently closed, the check-up flag, or
no socials with no hours or no working website) are held every night by `ve_directory_auto_hold()` (cron
`ve-directory-auto-hold`, 08:30 UTC), never a claimed or owned listing; one Sean puts back stays off the list for 90 days
(`details.review_ok_until`). Off the Directory also takes it off the email list (`trg_ve_outreach_listing_hidden`). **Google vouches** (Sean, 2026-11-01: "fix the nightly check"; migration
`20261101_directory_auto_hold_google_verified.sql`): No socials with No website or No hours holds a place only when Google does not
vouch for it (its Google place, a street and hours, Google not saying closed); it still shows flagged in Directory review. The same day
the 87 held for a dead website or no socials were checked on Google (78 Place Details calls): 34 open with 50 or more reviews and one
since May 2026 went back, 6 Google calls permanently closed were Removed (Sean: "remove any"), 2 temporarily closed and 36 with few or
old reviews stay on hold; Google lists no website for most, so a website alone cannot vet them (its reviews field is its five most
helpful, not the newest). Those 36 stay on hold for now (Sean: "keep those where they are... a bounty to give people things to do"). **They are a bounty** (Sean, 2026-11-01: "Make the 36 on hold a
bounty"; migration `20261101_bounty_still_open.sql`): **Is it still open?**, one Bounties campaign a chapter (`still-open-<chapter>`, nine:
Atlanta 7, South Florida, London and Philadelphia 5, New York 4, North Florida, Los Angeles and Virginia 3, Central Florida 1), one job a
place ("Is <name> still open?", the address and a Google Maps link by its place, since a held listing's page does not open), in person:
the outside today, and if open the menu, counter or receipt and the hours on the door; closed counts too. 50 points, one person each,
until 2026-12-01 (Logan's defaults, Sean's to change). **Approving updates the listing** (Sean, 2026-11-01: "make approving it update
the listing automatically"; migration `20261101_bounty_still_open_apply.sql`): each job carries its listing (`ve_bounties.check_listing_id`),
the member answers **What did you find?** (open and serving / closed or gone, `ve_bounty_submissions.check_result`) and must upload a photo,
and Depot > Bounties shows the answer with a **Listing** choice beside Approve and pay (the reviewer can change it from the photos). Approving
runs `applyCheck` in `ve-bounties`: open puts the place back on the Directory (`ve_listing_set_state` live, 90 days off the nightly hold),
closed takes it off as Removed, each with a note naming the visit and the day, once per submission (`check_applied_at`). A new "Is it still
open?" job needs `check_listing_id` set. **Announced in each chapter's Daily Pulse** (Sean, 2026-11-01: "post the bounty in the Daily Pulse"): nine
draft topics, one a chapter ("Is it still open? 50 points a stop in <city>", a See the places button to
`/bounties?community=<city>&campaign=still-open-<city>`, the first reply set), made as drafts with no `auto_publish_at`. **Published
2026-11-01** (Sean: "publish them all now"), all nine the way `ve-board` `topic_publish` does it (status open, `published_at`, `reply_count`
1, the first reply posted under Sean's account), straight in SQL because `topic_desk` and `topic_publish` refuse the admin token's
`as_member`. Each is first on its chapter's `/pulse` (checked through `ve-board` `list` and in a browser), and its See the places opens its
campaign on `/bounties` in a new tab (members only; signed out it is the Bounties gate). Atlanta's text says 7 places; its campaign has 8
since the listing check added Chi Chi Vegan Taco Shop. **Closed comes
off, open comes back, without asking** (Sean, 2026-11-01: "anything temporarily closed or permanently closed, let's leave it off... You
don't even have to ask me... if... the status changes, then we can put it back"; migration `20261101_closed_off_open_back.sql`): the nightly
hold also takes off a place Google says is temporarily closed, and every Monday at 9:17 AM Eastern `ve_closed_recheck_send` looks up on
Google (Place Details, `businessStatus` only, job `closed-recheck`, within the background cap) every listing held or Removed because
Google said closed; ten minutes later `ve_closed_recheck_read` puts back on the Directory any Google shows open again, with a note
(`ve_closed_rechecks` keeps each answer). The first run, 2026-11-01: all eight (Coco Lov and Seasoned Green temporarily, six permanently)
still closed. **The listing check, in Sean's order** (Sean, 2026-11-01: "the first best indicator is Google Maps... If they pass that, they can move
on to their website... if it doesn't have the right security, automatic flag... then it's Instagram... a grace of 6 months... a bounty... If they confirm they're
open... we flag them for special support"; migration `20261101_listing_health.sql`, edge function `ve-listing-health`). 1. Google says closed: off (above).
2. **The website**: every local place with a website (not grocery chains, not LESARUSS.ai) is read once a month (cron `ve-listing-health`, every 10 minutes 2:00 to
3:50 AM Eastern, 25 a run): gone (the address no longer exists, nothing answers, 404, 410 or 5xx, a parked or for-sale page) or no working security (no https, a bad
certificate) fails; a site that turns scanners away (401, 403, 406, 429, 503) passes, and a slow or refused answer is read again the next day, never held on one
try. No website at all is Google's job. 3. **Instagram**, only for a failed website (Apify, many handles in one run): a post in the last 6 months passes, and the
place goes to **Needs support** (its website needs fixing); otherwise it is **held** (On hold, `details.review.by` Listing check, the reasons) and a still-open
bounty goes up in its chapter's campaign (`ve_listing_still_open_bounty`, made if missing, 50 points, 30 days). 4. Held places are read again every week and
come back on their own when they pass; a member's visit settles it (`applyCheck` in `ve-bounties`), and a place found open goes to Needs support. A claimed or
owned listing, or one put back by hand within 90 days, is never held, only flagged. Results in `ve_listing_health` (web and Instagram status, reasons, verdict,
history, `support_at`/`support_why`/`support_done_at`). **Directory review > Needs support** lists them with Done and Open (`ve-listing-health` `support`,
`support_done`); `one` (`slug`, `save: false` to only read) checks a single listing. Proven 2026-11-01: Chi Chi Vegan Taco Shop (dead domain, no Instagram post
since January 2024) held with its Atlanta bounty; Happy Zoe Vegan Bakery (broken certificate, posting on Instagram) left on and flagged for support; Kroger and
QFC (Akamai turns scanners away) no longer read as down. **The listing check on the dashboard** (Sean: "use that mechanism that we use for BCPS Marcom... one that has
passed the audit and one that hasn't"): the business dashboard's Audit view opens with **Your listing check** (`healthCard`, `healthBlock` in
`ve-partner-dashboard.js`): each check by area (Google, Website, Instagram, Your Directory page) as a pass mark, a flag or a Check, with what we found and the
fix, the score, On the Directory or In review, and What happens next. The sample business shows two made-up places (`healthSamples` in
`business/sample/listing-demo.js`): Green Leaf Kitchen passing everything and Corner Sprout Cafe in review (with a made-up check-up). **Live and free on claim since
2026-11-01** (playbook `ve-listing-check`, the ANSWER row; Sean: "when somebody unlocks their claim, they get access to this information...
with a button: do you want us to fix these issues?"): `ve-claims` `owner_dashboard` returns `health` to every owner, member or not, built
by `listingHealth` from the listing itself, its `ve_listing_health` row and its latest monthly check-up (`ve_audits` source `checkup`):
Google (open, profile complete; places people walk into only), Website (opens, https, menu online for food places), Instagram (last post),
Your Directory page (logo, photos, story, hours; member check-ins). A listing never checked gets its first website check started in the
background (`ve-listing-health` `one` with the cron secret; on the Vegans Explore Podcast it ran in 4 seconds). **Our monthly check-up**
shows under it: each flagged check with what we found and the fix (`ve_audit_criteria.how`), most important first, never the score; **See
your full score** (the $49 full audit and the $149 Secret Shopper) sits beside **Have us do all of it**. **Have us do it** is on every item
that is not passed and every check-up flag (`doItBtn`), opening `VEManaged.open` (loaded on first tap) with `from: 'fix'` and the fix id, so
it lands in the Inbox as a Managed marketing request; the sample toasts what would happen. The Audit view is no longer members only and
shows for any listing with checks (non-food: the listing check and Have us do all of it). Home has the score strip (`healthStrip`).
`only: 'health'` returns just the check (the member dashboard's Your business). Proven 2026-11-01 as Sean on the podcast he owns (its
website, vegansexplore.com/vepodcast/, answered 404. Its official page is its own Vegans Explore listing (Sean, 2026-11-01: "Just because it's a directory listing doesn't mean it's
not a profile"), so its website is `https://vegansexplore.com/directory/vegans-explore-podcast`; a listing whose website is its own page shows no
Visit Website link, and the editor still gets the stored value, `l._website` in `directory/listing.html`) and as
admin on Happy Zoe Vegan Bakery (8 checks and 5 check-up flags). **Tomorrow's outreach is read first** (Sean, 2026-11-01: "we know we're
going to be reaching out to 30 people a day. We can prioritize those people in the check, you know, the day before... So when that potential
client clicks on it, they're seeing the information they should be seeing"; migration `20261101_listing_check_outreach_first.sql`):
`ve_listing_health_due` puts first every business in a send day (`ve_outreach_batches` proposed or approved) for today or tomorrow in
Eastern time that has not had its first email, and reads it again whenever its last check is more than two days old, monthly check due or
not. The sweep runs 2:00 to 3:50 AM Eastern, before the sender starts at 9. A business the check holds comes off the email list on its own
(`trg_ve_outreach_listing_hidden`). It reads the website and Instagram only, no Google calls. Proven 2026-11-01 in a rolled-back transaction
(a contact on tomorrow's send day came first; checked a day earlier, not read again; its send day six days out, not read early). **One-time scans sit outside the daily cap** (migration `20261101_google_room_skips_once.sql`): `ve_google_room` leaves out
`once:*` jobs, which had used up the day's cap after the held-listings check.
Fix it there too (Sean, 2026-10-25: "right now it's allowing me to review but not fix... I want to be able to input it here so it
updates the listing and unflags it"): a listing's **What it shows** is a form (about, website, Instagram, Facebook, TikTok, phone,
street, ZIP, menu link, each day's hours; missing ones marked), saved by `ve-outreach` `listing_fix` (only what changed, each a
`ve_listing_edits` row, `details.fixed`), with **Save and put it back on the Directory** for a held one. A new website clears "The
website did not open" (the flag counts only for the site the check-up read); a menu link goes to `listings.menu_crawl_url` and
queues `ve_menu_imports` with that `menu_url`, where the Background writer starts (migration `20261025_directory_review_fix.sql`).
The form also sets the **Kind** (any Directory sub-section) and **Online only, no storefront** (Sean, 2026-10-25, Axiology: "an
online beauty and personal care brand... they wouldn't necessarily be a listing with hours of operation"): the street, city, state,
ZIP and map pin come off (`location` Online, the same as the listing editor's Online only), it shows in every chapter, and with no
city it is never flagged or held again; a held one drops No hours and No street address. The menu link shows for food places only.
**Being vetted** is a list there too (the food places waiting on member votes) with **Vetted by us** (`listing_vetted`). The
Directory and every hub also have a **Review** tab for super admins (Sean, 2026-10-25: "could we have a review tab that has all of
those features in there, just so I'm doing it from one place? Because I rarely go into the depot"): `review` in `CAT_CONFIG`
(`adminOnly`, `frame`), which frames Directory review without its nav, footer or Depot header (the page hides them when its
parent is `/directory` or a hub) and grows to fit (depot-tabs.js `ve-frame-height`). Every card shows admins **Edit** and
**Review**; Review opens that listing in the Review tab (in Being vetted when it is waiting on votes), and the listing editor has
Open in Directory review.
Adding listings (Sean, 2026-10-27: "I'm not sure exactly how I would do that"). Directory review's home has **Add a listing**
(`#add/1` to `#add/5`, one step per view): Find it on Google (name and where, `ve-discover` `add_search`: up to six Google places
with address, phone, website, hours and pin, each marked if already listed), or fill it in by hand. **Find it also takes a link and
screenshots** (Sean, 2026-10-27: "I typically find a lot on Instagram... add a field for the URL... upload an image, like a
screenshot"): the link (an Instagram profile, read through Apify, or any page, read as text with its structured data and social
links, plus the site an Instagram bio links to) and up to three screenshots (dropped, pasted or chosen, shrunk to 1600 px in the
browser) go to the edge function `ve-listing-intake` (`read`, super admin; Claude Opus 5.5, structured output, only what the sources
show), which returns **What we found** (name, kind, how Vegan, address, phone, website, socials, hours, about, a note on where each
came from) and the Google search to run. Pick its Google listing (what Google leaves empty is filled from what we found) or **use what
we found**; its Instagram picture joins the logo choices, and What it is offers the suggested kind and How Vegan with Use it, never
picked for you. Nothing is saved until Add it. Proven 2026-10-27 on an Instagram link (14 s), an Instagram screenshot (4 s) and a
website (9 s); The details (all of it
editable, Online only, and their Instagram, Facebook and TikTok, filled from the links on their own home page, `add_site`, Sean
2026-10-27: "you should be able to pull their social media"; builder template links like facebook.com/wix are skipped); **Logo**
(the logo editor below, with up to four pictures from their website to load into it, an `<img>` that says logo, the app icon,
the share picture or the page icon, SVGs included; left empty, the first letter); What it is (the kind and how Vegan, both picked on purpose, "Not a Vegan business" for a store or service;
an optional about); Add it (`add_create`: live at once, refused as `already_listed` with the slug when the same Google place or name
and city is on the Directory; a business waiting in the backlog with the same place goes live instead of a second copy;
`crawl_source` `admin`, `details.added_by_hand`, a team note). The nightly essentials pass fills what is still empty. **Paste a
list** (`#paste`, `paste_list`, up to 200 lines): one business a line, "Name, City, State" or an Instagram handle; each becomes a
quarantined listing (`crawl_source` `paste`, `details.pasted`) and a `ve_backlog_checks` row, checked by the backlog cron like the
import backlog and waiting in Business outreach > New places to add or set aside. Nothing pasted goes live on its own; a line
already on the Directory or in New places is left out and listed.
**Logos** (Sean, 2026-10-27: "a review of any business that doesn't have a logo... I could just drop whatever image that I find
and then you do that for me... crop it and size it so it looks good, maybe drop a background in it if it's a transparent image";
266 of 490 open listings had none that day). Directory review's home has **Logos** (`#logos`, `ve-discover` `logo_queue`: every
open listing with no logo, most voted first, search and city) and one listing per view (`#logo/<id>`): links to look on (their
website, Instagram, Facebook, Google Images, and the logo we set aside on 2026-10-10 when there was one), then the **logo editor**,
`/public/ve-logo-editor.js` (`VELogoEditor.mount(el, {fetchUrl, onChange})`): drop a picture, choose a file, paste one (Copy image,
then Ctrl+V), drag one from another tab, or paste its link (fetched server side by `logo_fetch`, JPEG, PNG, WebP, GIF or SVG, so the
canvas is never tainted); an 800 x 800 square to drag, zoom (slider or wheel), Fit, Fill, Trim edges and Center; the background
fills what the picture does not (Match its edges by default for a solid picture, white for a transparent one, black, our green or
any color); a preview at card and listing size. **Cut out** (Sean, 2026-11-03, Lettuce Stain's logo sitting inside a menu picture: "crop it so I can just select the section that I want... diagonal patterns... it automatically will fill the background"): **Box** (drag) or **Shape** (click points, so diagonals work; close on the green first point, Enter or a double click; Backspace takes a point back; Shift and drag moves the picture, the wheel zooms), then **Cut it out** crops to the selection and fills what a shape leaves outside with the most common color along its edge, which also becomes Match its edges (a see-through edge stays see-through and takes the white default); **Undo cut** steps back and cuts can follow one another (proven on Lettuce Stain's real logo, 2026-11-03: worked first try; a busy background still fills only approximately, and no freehand lasso or magic wand until a real logo needs one). It is inside `ve-logo-editor.js`, so Depot > Logos, the listing editor's Replace the logo, New places and Add a listing all have it. **Save and next** uploads the square as a JPEG (`add_logo_url`, staged in
`vegan-media/media/listings/_new/`) and `logo_set` copies it to `media/listings/<slug>/logo-*` (never hot-linked; under 200 px on
the shorter side is refused), sets `details.logo_source` admin and `details.logo_checked`, moves a set-aside logo to
`details.logo_replaced`, and logs a `ve_listing_edits` row (field `logo`). **The letter is fine** (`logo_skip`,
`details.logo_letter_ok`) takes one off the list; Skip for now leaves it.
The listing editor's **Upload a logo / Replace the logo** (`ve-listing-admin.js`, every Edit listing button; Sean, 2026-10-27: "Can
we implement that into the replace logo button?") opens the same logo editor under the logo, with the logo as it is loaded in, and
links to look on (their website, Instagram, Facebook, Google Images); **Save logo** saves it the Logos way (`add_logo_url`,
`logo_set`), so it shows in Logos > Done. Copy it into our storage and Remove stay as they were.
**Contact and links in Edit listing** (Sean, 2026-11-06, playbook `ve-feedback`: "I don't have a way of updating that information... from my phone"): every listing that is not a person has one line, about, website, Instagram, Facebook, TikTok, YouTube, X, LinkedIn, phone, email and booking link; food places add menu link, Uber Eats and DoorDash; places with a storefront add each day's hours. Only what changed is sent, through `ve-outreach` `listing_fix` (each change a `ve_listing_edits` row, `where: listing_editor`); on phones the editor fills the screen, fields stack and inputs are 16px. `ve-outreach` v28 from 0d6eb2b.
**The listing editor follows what it is** (Sean, 2026-10-27: "the main section... should come after the logo... based off what you
choose, the next part populates"). Name, Logo, then **What it is** (main section, sub-section, Also show it under); nothing more
shows until a main section is picked, and Save asks for one. Media (Podcasts, YouTube, News Outlets, Other media, Documentaries &
Films, Books) hides Location, Locations, Chapters and How Vegan, is saved as every chapter (`communities` `['all']`), its address
left as it is; a brand hides Locations. Only the parts shown are sent to `admin_listing`. `business_status` keeps its three values,
in the kind's words (`kindOf` and `STATUS` in `ve-listing-admin.js`, `STATUS_WORDS` in `ve-region-directory.js`, `statusWords` in
`directory/listing.html`; change all three): a place Open / Temporarily closed / Permanently closed, a show Active / On hiatus (never
Ended), a book or film Available / No longer available, a brand In business / Paused / Out of business.
**The logo sweep** (Sean, 2026-10-27: "do a sweep and see which ones you can do similarly... so I'm not going through all 200...
the clean logo, no food in the background, just the actual logo"; migration `20261027_ve_logo_suggestions.sql`). Cron
`ve-logo-sweep` (every 5 minutes, `ve-discover` `logo_sweep`, five listings a run, each looked at once) gathers each listing's
logo pictures from its website (`readSite`) and its Instagram profile picture (Apify), and shows up to five to Claude (Opus 5.5,
structured output) with the business's name: it picks the business's own clean logo (never food, a storefront, people, a logo
inside a photo, a builder's or a platform's icon, or another business's logo) or none, and the background to square it on
(`match`, `white`, `black` or a color). The pick is a `ve_logo_suggestions` row (found, none, used, rejected), never saved to the
listing by itself. One it found nothing for is looked at again 30 days later (a check that did not run, a day later; `relookDue`),
never-looked-at ones first; a used or turned-down pick never comes back. **Chains share one logo** (Sean, 2026-10-28: honeygrow's
14 locations got 14 different picks, the faint ones "broken"; "same business, different location. It should have the same logo"):
before every sweep and after every logo saved, `chainFill` gives a listing with no logo the logo we hold for the same business (its
main listing or another of its locations, or a listing with the same website or Instagram and the same name, `siteKey` and
`chainName`), in Suggested as "The logo on <name>, <city>", with no new pick. The pick itself never takes a faint, low-contrast or
tiny logo, and prefers a clean Instagram picture over a website's share picture. **Look now** (Sean, 2026-10-28: "is it possible... for me to
trigger the push?") on every Logos tab runs the sweep on the next ten at once (`logo_sweep` takes a super admin too), and the head says
how many are waiting or when the next look again is due (`logo_queue` `sweep.relook`, `sweep.next_relook`). Logos has two tabs: **Suggested** (`#logos/suggested`): every pick squared in the browser by
`VELogoEditor.auto` (the editor's own trim, fit and background), ticked by default, **Save the N ticked** saves them all through
`logo_set` (`from_suggestion`, the row turns `used`), **Adjust** opens it in the editor already trimmed and on its background
(`#logo/<id>/s`), **Not this** (`logo_suggest_reject`) sends it to To find; and **To find** (`#logos`): the rest, each with what the
sweep said and the pictures it looked at (SVGs included, which Claude does not read) to load into the editor.
**Done** (`#logos/done`, Sean, 2026-10-27: "Is there a way that I can see what logos have been created... I want to do some quality
control"; `ve-discover` `logo_done`): every logo made here (`details.logo_checked`), newest first, each at full size and at card
size, with who saved it and when, From the sweep when it was a sweep pick, and **Redo** (`#logo/<id>/redo`: the logo as it is,
loaded into the editor; saving replaces it) and **Remove** (`logo_clear`: the letter again and back on To find, the old logo kept in
`details.logo_removed`, a `ve_listing_edits` row, a sweep pick marked rejected so it does not come back to Suggested).

Member check-ins (Sean, 2026-10-25: "making a way that members can verify listings... every time they check in, they can get
like 10 points... We can see a record of how many people are actually visiting, which members are visiting... if a business
wants to run a campaign with us, we can target those people first... an ongoing bounty that stays there"; migration
`20261025_ve_checkins.sql`, edge function `ve-checkin`). A member taps **Check in** on a listing's page while there
(`directory/listing.html`, shown where the listing has `latitude`/`longitude`, which `ve-restaurant-audit` `essentials` fills from
the Google place): the phone's location must be within 150 m (plus up to 100 m of its own uncertainty; a fix worse than 500 m
is refused), once per place a day (Eastern), 10 points for up to 5 places a day, more recorded at 0 (`ve_checkin_save`, rows in
`ve_checkins`; points move both balances, `points_ledger` reason `checkin`). Who sees what (Sean, 2026-10-25: "Only registered member
businesses who've claimed their listings can see that information... You can choose... in your settings, whether you want
people to see where you've checked in. So we can leave it on by default"): the public sees counts only ("Member check-in N
days ago · N members this month", `ve_listing_checkins`); members also see "Recently here: Sam R., Maria L. and 3 more", only
members who leave **Show my check-ins to other members** on (My Account > Privacy, `members.show_checkins`, on by default,
`ve-checkin` `privacy`); the owner of a claimed listing (claim approved, member or plan) sees **counts only, never who**
(Sean, 2026-10-28: "treat check-ins the same way" as saves, the locked rule of `ve-member-profiles-partner-windows`) on the
business dashboard's **Check-ins** view (`ve-claims` `owner_dashboard` `checkins`: last 30 days, members, members who came back,
12 months, by week and by the members' home chapter; no names or member ids leave the function); a business reaches members only
through the yes at save, during a campaign (Your audience). The team sees who in Depot > Directory review (`review_get` `checkins`). A check-in in the last 30 days keeps a place from
being held automatically. On `/bounties` it is the always-open first card in every city (**Check in where you go**,
`?campaign=check-ins`): how it works, Open the Directory, and the member's own check-ins (`ve-checkin` `mine`).

On a city hub the banner bar's crumb is a community picker (All cities, then each `VE_HUBS` city; Sean, 2026-10-25): a city
keeps the section you are on, All cities opens `/directory` from the Directory section, else `/communities`. No "Communities /"
before it, so it fits a phone (Sean, 2026-10-25). The hub's hero buttons (Sean, 2026-10-25: "anybody can be a part of any
community"): signed out, **Get Passport** (`/passport?community=<slug>#/join`) and **Page tour** (the hub's spotlight tour,
`ve-tour.js` `hub`), with a Preview badge; signed in, **Dashboard** (`/dashboard`, the green button) and **Page tour**, the badge
Member for an active member. The bar under the hero (Sean, 2026-10-26) is the city picker on the left and Collapse on the right,
one row at every width, nothing else in it (no Get Passport, no Dashboard, no Page tour). Under the title, the hero rotates the cities that have open Directory listings at an address in the hub,
three at a time, most listings first, fading every 4 seconds and looping (Sean, 2026-10-25: "as new ones are added, it will update
that automatically"; `heroCities` in `hub.html`); three or fewer cities keep the hub's written areas (`VE_HUBS[].page.regions`,
South Florida's are its counties). The hub passes an axe-core WCAG 2 AA check at phone and desktop width (2026-10-25): muted text
`--ve-text-50` is 0.68 black, `.btn-join` is the dark green, the hero's words carry a soft shadow over the photo, and the
nav's Join button has dark text on its bright green (`public/nav.js`).

Listing pages (Sean, 2026-10-25: "every listing needs to have a background... we need to make sure that their contrast is ADA"):
every listing's header wears city art (`heroArt` in `directory/listing.html`): the city its address is in by `VE_HUBS[].match`
(`page.banner`), else South Florida's art, under a dark overlay never lighter than 0.8, so every header line holds WCAG AA on the
brightest pixel of any picture (checked 2026-10-25 on South Florida, New York, Atlanta, DMV and a listing with no city; the
tagline is the tightest at 4.7:1). A new city's banner must pass the same check. Anyone who is not a member also sees the
Directory's **Your votes rank them** box at the foot of the page (`.lv-vote`), opening the Passport Guide
(`/passport?from=vote&back=...#/join`). Signed out, `nav.js`'s members-only gate sends a gated click to `/passport` (back here
after sign-in), never the old sign-in pop-up, and lets any link that already goes to `/passport` through.

Directory filters (Sean, 2026-10-24: "the sort menu should be custom to each one"). `/directory` opens on the full banner
and folds it to one bar (city picker, Directory home, Submit listing, Expand) after the first click into a section; Collapse/Expand is
kept for the visit (`sessionStorage` `ve_dir_hero`). Every city filters by region (`VE_HUBS`), then that region's cities; a
listing counts in a region by its address or the chapters it serves (`data-hubs`). **Every section opens on All**
since 2026-11-01 (Local Food and Products, below; from 2026-10-26 it was "All last", to bring Food Brands back to Food, and Food
Brands and Nutrition & Supplements now live in Products). Food's list as it stood then: Restaurants, Bakeries & Cafes, **Food Trucks**, **Vendors** (apart since 2026-10-27, Sean: "you might be just looking for a food truck"), Food Brands, **Nutrition & Supplements** (new: supplement and
nutrition brands, sold everywhere, so no location filter; Brand Partner like a Food Brand), Markets, Catering, Meal Prep.
Products is Food & Drink, Nutrition & Supplements, Clothing and Fashion, Beauty and Personal Care, Marketplaces (see Local Food and Products); **Services** is Health and Wellness, **Health Professionals** (doctors, dentists, dietitians and nutritionists, chiropractors, therapists and counselors, other practices: `details.health_type`, a **Practice** filter, `HEALTH_TYPES` in `ve-region-directory.js`, `ve-listing-admin.js` (the editor's Kind of practice) and `ve-listing-media`, which saves it), Coaches and Consultants, **Animal Care** and Marketing & Growth, the catch-all for agency work (Sean, 2026-10-27: "we have too many things"; AI & Automation, Web & Development, Content Creation & Media, Branding & Creative Assets and Business Operations left the menu, their two Vegan businesses moved to Marketing & Growth, the supplement brands in Health and Wellness to Nutrition & Supplements, migration `20261027_services_trim.sql`; the SaaS tools still filed under the old names are the LESARUSS AI directory's and never show here); **Brands is
retired** (its three listings were re-filed the same day; an old `Brands` row still shows under Products > All). Change these
together: `CAT_MAP` and `CAT_CONFIG` in `ve-region-directory.js`, `SECTIONS` in `ve-listing-admin.js`, `KINDS` in Directory
review, `CATEGORIES` in `ve-claims`, `LISTING_CATEGORIES` in `ve-outreach`, `CATEGORIES` in `ve-discover`, `FOOD_CATS` in
`directory/listing.html` and `CATS` in `claim.html`. **Brands that vend** (Sean, 2026-10-26: many sell nationally online "but
they still show up at... farmers markets and special events, festivals... a tool for promoters who are looking to find vendors"):
a Food Brands or Nutrition & Supplements listing with Vendors in its extra categories (the listing editor's Also show
it under, with a note saying so) stays in its brand section, also shows under Vendors with the location filter, and
its card reads **Markets & events** (`vendsAt` in `ve-region-directory.js`). In the brand sections, **Sells at**
(Anywhere, Markets & events, Online & stores) filters them, and Markets & events brings the location filter back. Vetting goes by the main category only, so a vending brand never lands in Being vetted. A sub-section can have its own filters
(`SUB_FILTERS` in `ve-region-directory.js`): **Food Brands** by what they make (**Makes**), never by city (`listings.product_kinds`:
dairy, meat, egg, seafood, snacks, drinks, protein, pantry, baked, frozen; set in the listing editor; migration
`20261024_listing_product_kinds.sql`), **Markets** by national chain (tag `ve-grocery-store`) or local market.
**Every section and sub-section has its own address** (Sean, 2026-10-27: "if I wanted to send somebody to the markets section of
our food directory, I couldn't... when I'm going back, it's taking me to the main page"): `?tab=<section>&sub=<sub-section>`
(`/directory?tab=food&sub=markets`, `bakeries-and-cafes`; the first sub-section leaves `sub` out), pushed on every click so back and
forward move through them, on `/directory` and the dashboard's Directory tab (`/dashboard/directory?tab=...`; `url` in
`VERegionDirectory.init`, `pushSection` and `applySection` in `ve-region-directory.js`; a city hub, whose `?tab=` is its own
section, uses `?dir=` instead since 2026-11-01: `/communities/<slug>?tab=directory&dir=food&sub=markets`, `tabParam: 'dir'`, Sean:
"In Communities when you use the Directory, it doesn't show the unique URLs... so that traffic is tracked"; leaving the hub's
Directory drops `dir` and `sub`, and the city picker keeps them). **Traffic by section**: Google counts each address change, and
Depot > Analytics > Directory lists **Sections**, and **Events** and **Media** have their own tabs (Sean, 2026-11-01: "Do the same
for Events and Media": an event's own page is `?event=<id>` on `/events` and `/dashboard/events`, an old `#event/<id>` link moves
there, `#event/<id>/tickets` and the calendar's other `#` views stay; the kind and Upcoming / Past are history steps, the dashboard's
Events tab keeps its address (`url` in `VEEvents.mount`), a hub's Events keeps `?when=past` and each event's name opens its page; the
dashboard's Media keeps `?type=` through the banner's `path` option; `ve-analytics` `ev_sections`, `ev_pages` named from `events`,
`media_types`), (`ve-analytics` `dir_sections`, read from `pagePathPlusQueryString`, since Top
pages' `pagePath` drops the query) by place: the Directory, the dashboard and each city hub. **The city is not in the address**: the same link opens in whichever chapter the visitor picked (kept for
the visit, `sessionStorage` `ve_dir_city`), and an old `?city=` link opens on that city before the address drops it. A listing's
breadcrumb links back to its sub-section. **Submit listing** (the banner's green button, Sean 2026-10-27; one row on a phone) opens Join the
Directory's Add it (`/claim?add=1`): $11 or 1,100 points a listing (Guide pricing, below).
Layout (Sean, 2026-10-27: "hide the filter options... as an icon to the right of the search... When they click the icon again it
closes. The search and the icon should be below the tabs"): the section tabs, then one row with the search and a **filter icon** at
its right (`.vrd-tools`, `[data-vrd-filter]`). The icon opens a dropdown under it (`.vrd-filter-pop`): first the section's
sub-sections (Restaurants, Bakeries & Cafes, Food Trucks...; Sean, 2026-10-27: "It should also have the Restaurant, Bakeries, Food
Truck options in the icon as well"), then Sort by and every filter (Area, the sub-section's own, Vegan, Type) as 40 px dropdowns with
our chevron, three across on desktop and two on phones, then **Reset filters** and **Done**. The icon again, Done or Escape closes
it; the icon shows how many filters are set (`countFilters`), and the search names the sub-section showing ("Search Markets..."). Under the cards, the page
numbers (first, last and two either side of the current one) sit in the middle and Show 24 / 48 / 111 at the far right (shown
only when there is more than a page of 24).

**Community is the animals first** (Sean, 2026-10-27: "there's a lot of backlash on brands that don't put the animals first...
I really want that to be what the community directory is all about... nonprofits... events... rescues... sanctuaries"). Community's
sub-sections are **All** (first here, the one exception: Sean, 2026-10-27, "I don't mind people seeing all of the community listings
in one slot"; `allFirst` in `CAT_CONFIG`), **Nonprofits, Rescues, Sanctuaries, Events** (the same lists as Food's, above; migration
`20261027_community_resort.sql`). Community Partner was never a kind of listing: its 29 rows (a June spreadsheet import) were
re-filed from Google and their Instagram bios the same day (14 into Vendors, Food Trucks, Restaurants, Bakeries, Health and
Wellness, Coaches, Beauty, Clothing; two closed for good), and the 15 with nothing to go by are On hold in Directory review, each
with what we know. Rescues, sanctuaries and nonprofits are organizations: no How Vegan (`vegan_status` null). From Sean's Instagram
list (the `ve_businesses` import) the ones Google and their own website confirm were listed (Muscovy Sanctuary of Florida, Rowdy
Girl Sanctuary, UFAR Animals Rescue; Mercy For Animals, The Humane League and Humane World for Animals in every chapter); the 15
known only on Instagram wait in Business outreach > New places > Ready to list for Sean to confirm and add. **The community
search** (Sean, 2026-10-27: "go"; migration `20261027_community_search.sql`): Google searches for farm animal sanctuaries, animal
rescues and Vegan or animal rights nonprofits in all eight cities, filtered (open only; no zoos, petting or city farms, wildlife
parks, county animal services, clinics or unrelated charities; nothing already listed or waiting), made 215 quarantined listings
(`crawl_source` `community-search`, `details.community_search` with the hub and a guess of Rescues, Sanctuaries or Nonprofits),
each waiting in Business outreach > New places > Ready to list with the guess in its note and its category picked from it
(Rescues, Sanctuaries, Nonprofits and Events hide How Vegan there and list with none). Nothing went live. Six from South
Florida's search are national organizations elsewhere, and their note says so. Run it again by city with new searches the same way.
**The newer chapters** got the same search on 2026-10-28 (Sean: "run the community search for the newer chapters"; migration
`20261028_community_search_new_chapters.sql`): 24 searches in North Florida, D.C., Maryland, Virginia, Delaware and West Virginia,
each place in the chapter of its own state, 146 quarantined in Ready to list (North Florida 45, Virginia 34, Maryland 27, West
Virginia 21, Delaware 14, D.C. 5). The filter also leaves out working and petting farms, wildlife rehab, pet stores, boarding,
breeders, thrift stores and charities for people. Nothing went live. **The other seven chapters** got a wider second pass the same day (Sean: "run the community
search for the other chapters"; migration `20261028_community_search_other_chapters.sql`): 40 searches, 157 quarantined (Central
Florida 36, South Florida 28, Los Angeles 26, New York 26, Philadelphia 25, Atlanta 15, London 1). City and county shelters are left
out too, and a name that matches any listing, set-aside ones included, never comes back.
**London and Philadelphia, a wider pass** the same day (Sean: "run the community search for London and Philadelphia too"; migration
`20261028_community_search_london_philadelphia.sql`): 60 searches, London borough by borough and Pennsylvania city by city, 123
quarantined in Ready to list (London 12, Philadelphia 111; London's big rescues, Battersea, Mayhew, Celia Hammond, Dogs Trust, were
listed already). RSPCA is left out. Google gives many Greater London places their postal town (Croydon, Bromley), so they count as
London and carry `communities` ['london']; the London chapter itself matches only the city London.
Philadelphia's ticked Ready to list (Sean: "add the ticked ones from Ready to list for Philadelphia") went live the same day, all 136
through `backlog_decide` as Add the ticked does (88 Rescues, 25 Sanctuaries, 23 Nonprofits, no How Vegan). Sent all at once from SQL,
31 of the calls failed to boot the function (503 BOOT_ERROR) and nothing saved; re-sent, all landed. Six had no town from Google
and got it from Google's address.

**Studios** (Sean, 2026-10-29, playbook `ve-business-hub-ad-console`: a studio directory for production, podcast and photo
studios, prompted by Trisha, each claimable with the $11 Passport). Services > Studios, after Animal Care (`CAT_MAP`, `CAT_CONFIG`,
`SECTIONS`, `KINDS`, `CATS` and the functions' category lists). A studio is usually Not a Vegan business. The first South Florida
search (`20261029_studio_search.sql`) put 129 in Business outreach > New places > Ready to list (91 video and production, 25 podcast,
13 photo). **123 went live the same day after a preliminary check** (Sean: "I'm not going to click through 129 studios... is it open?
Is it active?... If it fits that... Add them. We can always remove them later on"; migration `20261029_studios_live.sql`, run through
the one-time `ve-once-studios-live`, now the 410 stub): all 129 were open on Google; a studio went live with a phone or website and
either a Google review in the last two years or a website that loads, and the six that did not are set aside with why (two dead
websites, four with no website and no recent review). The Directory's **Is your business in here?** strip (under the vote box, shown to everyone, members
included) and the listing's claim box say the claim takes the $11 Passport, whose 1,100 points cover it.

**Diplomats open every Guide** (Sean, 2026-10-29, canon `canon-lesaruss-ai-subscription-guide-wizard-model`
UPDATE_2026_10_29_ONE_MEMBERSHIP_UNLIMITED_GUIDES and _DIPLOMAT_NAME_LOCKED): the one $111 LESARUSS.ai membership, named Diplomat,
includes every Guide from every LESARUSS community. `ve-guide-unlock` `access()` opens a paid Guide (`via` `diplomat`) for an
account whose email has a LESARUSS-tenant `members` row active on premium or advanced, or cancelled and paid through
(`isDiplomat`, the rule in lesaruss-hq `lib/memberAccess.ts`). A Diplomat still needs a Vegans Explore account to sign in here;
signing in with the LESARUSS account everywhere is the next build.

**Groups** (Sean, 2026-10-29: "I want to add groups... the same way we have nonprofit rescue sanctuaries... when you click on it,
it's all of their events will be tied to their profile, and their profile will be tied to all their events... eventually get them to
have their community exclusively on Vegans Explore"; migrations `20261029_community_groups.sql`, `20261029_community_groups_seed.sql`).
Community's sub-sections are All, Nonprofits, Rescues, Sanctuaries, **Groups**, Events: social clubs, meetup groups, potluck and dinner
clubs. A group is an organization like a rescue (no How Vegan), votable and savable like any listing, in its chapter by `communities`
(a group known only by its chapter gets its state as well). **Events belong to the group that hosts them**: `events.host_listing_id`
(any approved listing can host; Groups, Nonprofits, Rescues, Sanctuaries and Events come first in the picker). A listing's Overview shows
**Upcoming events** (soonest first, each opening `/events#event/<id>`, with Tickets & info) and the last six **Past events**
(`loadHostedEvents` in `directory/listing.html`; always shown for a group, else only once it has hosted something), and an event's page
says **Hosted by <group>** linking to its page (`event.host` from `ve-events` `event`). **A group's events page is a crawl source tied to
it** (`ve_event_sources.listing_id`): every event `ve_event_intake` saves from that source is the group's, and a duplicate found again
there gets the group as its host. Depot > Events has **Hosted by** on each event (`ve-events` `hosts`, `host_listing_id` on `update`,
`review` and `save`) and **The group whose events these are** on each crawl source. Groups often post only on Instagram, Meetup,
Partiful or Linktree, which this build session cannot reach; the Background writer reads them. **The first sweep** (2026-10-29): 14 live
(Vegan Social Club in South Florida, from the June Instagram import; NYC Vegetarian & Vegan Meetup, NYC Vegan Spirituality, Plant Powered
Metro New York; Veg Society of DC, serving D.C., Maryland and Virginia; Baltimore Veg/Vegan Meetup; Vegan Club RVA; Vegan Social Clubs and
Atlanta Veggie Eats; Vegetarians of Central Florida; Vegan Spirituality Group of Philadelphia; Los Angeles Vegan Gatherings, Vegans of
Los Angeles; London Vegan Meetup), each with a dated 2025 or 2026 event, and 5 On hold for review in Directory review with why (Afro
Vegan Social, Center City Philly Vegans, LGBTQ+ Vegans London, London Vegans, Vegan Squad: no dated event seen). **Philly Vegan Social
Club** (Sean gave its Partiful, `partiful.com/u/VrM8jI2gyGMs9BJWvXNi`; migration `20261029_philly_vegan_social_club.sql`) went live the
same day with its 32 upcoming Partiful events. Partiful is readable from the database server (pg_net) though not from the build
session: a host page's `__NEXT_DATA__` lists `initialPublishedEvents`, and each `partiful.com/e/<id>` has the description and an
approximate place (`locationInfo.mapsInfo.approximateLocation`, the neighborhood; the address only after an RSVP). North Florida, Delaware and West Virginia had none confirmed.
**A group's history counts** (Sean, 2026-10-29: "show past, because it's a good indicator to people that it's a good group to join
if they have a lot of past events... by default, it shows upcoming, and then they would have to click past"; migration
`20261029_group_past_events.sql`). The page's Events has two tabs, **Upcoming (N)** first and **Past (N)**, newest first, each scrolling in
its box; a past row's button is **Event page**, their own page, kept even if it no longer opens. `ve_event_intake` saves an event that is
over only with `past: true`, a host listing and a start on or after 2020-01-01; anything else over is still `already_over`. The 2026
history went in the same day: 709 Meetup events for the 16 Meetup groups (2026 to date and the next 180 days; Vegan Social Clubs' weekly
market is scheduled years out), read from Meetup's GraphQL (`https://api.meetup.com/gql-ext`, no sign-in: `groupByUrlname(urlname)
{ timezone events(filter:{status: PAST|ACTIVE, afterDateTime, beforeDateTime}, first: 100) }`, no more than 100 a call, so split a busy year
by date range); Philly Vegan Social Club's 36 from Partiful; and from Instagram (Apify `instagram-scraper`, posts since 2026-01-01) 16 for
the Vegan Social Club (its Partiful host is a personal account with no public list) and 9 for Vegan Club RVA, each linking to its post,
a recap with no announced date dated the day it was posted with Time to be announced. Afro Vegan Social, Center City Philly Vegans,
LGBTQ+ Vegans London and London Vegans went live then (Meetup shows 2026 events); Vegan Squad stays on hold.
The goal, not built yet: a group runs its community on Vegans Explore (its members, its events, its board).

Logos (Sean, 2026-10-10: "I would prefer it just to have the thumbnail with the letter if it's not the official
logo"): a listing shows a logo only when we hold it in our own storage (`vegan-media`: logos checked by eye, the curated
`directory/logos/` files, or one an admin picked in the media library). **Every logo is our own copy** (Sean, 2026-10-27: "any
logo that we pull, let's not use it from where it was hosted from. Let's make a copy of it immediately as part of the process
once we've accepted it. That way nothing disappears"): every way a logo is saved copies it (`ve-discover` `logo_set`, `ve-claims`
owner photos, `ve-media-library`), and the edge function `ve-logo-keeper` (cron `ve-logo-keeper`, hourly, x-cron-secret) copies any
`logo_url` outside `vegan-media` into `media/listings/<slug>/logo-copied-*`, keeps the old link in `details.logo_copied_from` and logs
a `ve_listing_edits` row; a link that fails stays, noted in `details.logo_copy_error`, and is tried again after a day. On 2026-10-27
it copied the 55 podcasts' Apple covers, the last logos hosted elsewhere.
Logos linked from elsewhere (Instagram pictures, whose links expire; website share images) were set aside on 2026-10-10
into `listings.details.logo_unverified` (143 listings) and show the letter. Restore one after checking it with the line in
`20261010_listing_logos_letter_unless_ours.sql`; a new logo is copied into our storage, never hot-linked.

Locations (Sean, 2026-10-25: "how are we accounting for restaurants that have multiple locations. Should they extend from the
same listing and show a section for additional locations so they are all tied together. Also creating additional locations can
be done from within the listing so it copies the majority of the content"; migration `20261025_listing_locations.sql`). A group
is one main listing (`parent_id` null) and its locations (`listings.parent_id` = the main one, `location_label` "West Village").
Each location stays its own listing (street, city, hours, phone, Google place, map pin, votes, check-ins, review state, its own
city hub); the main listing holds what they share. A location page fills what it leaves empty (about, logo, socials, website,
order links, cuisines, menu) from the main listing (`withMain`, `SHARED_FIELDS` in `directory/listing.html`), and every page in a
group shows **More locations** in the sidebar (`loadLocations`; closed ones last, tagged Closed). In the listing editor's
**Locations** section: Part of (the main listing's address), this location's name, and **Add a location** (`ve-claims`
`admin_location_add`, `ve_listing_add_location()`: copies the shared content into a new live listing named "<Business> -
<Location>"; the nightly essentials pass fills its hours, Google place and pin). One level only. Branches are locations, never
duplicates to merge. The restaurant search of 2026-10-27 added chains unlinked; on 2026-10-28 179 listings were linked under 77
main listings (same website and same name, food places and animal organizations only; migration `20261028_chain_locations.sql`,
each a `ve_listing_edits` row, field `parent_id`). Left unlinked on purpose: sister restaurants (Doomie's, Kitchen Mouse, Essential
Vegan), Tofutti, Viva!, Whole Foods and Loving Hut's listing with no street. The Directory card does not read the main listing, so a
location keeps its own `logo_url` (chainFill fills it).

**Shared kitchens** (Sean, 2026-11-01: "some vegan restaurants... serve fully vegan food, but they're based out of a non-vegan
restaurant... we should mention this on their profiles... it doesn't have to be this whole big production... as a service to the
community"). A food place that runs its own Vegan menu inside a restaurant that is not Vegan carries `listings.details.shared_kitchen`
`{host, host_slug, separate, source: owner|team|member, note, confirmed_at}`, set in the listing editor's **Shared kitchen** block (food
places only, `vla-p-shared` in `ve-listing-admin.js`) and saved by `ve-listing-media` `save` `shared_kitchen` (a `ve_listing_edits` row;
`null` clears it). The listing page shows a **Shared kitchen** badge in the header and, in the Overview, **A Vegan menu in a shared
kitchen**: "<name> runs its own 100% Vegan menu inside <host>, a restaurant that is not Vegan", "Their food is prepared separately" only
when ticked and told by the owner or our team, the optional line, who confirmed it and when, and Let us know (`sharedKitchenHtml` in
`directory/listing.html`). The Directory card adds "· Shared kitchen" after the city (`sharedTag` in `ve-region-directory.js`). How
Vegan stays the menu's. First two (2026-11-01, migration `20261101_shared_kitchen.sql`): Aisha's Plant-Based Eatery inside House of Mac,
prepared separately (Sean), and Vegan Planet (Miami), host not named yet. Vegan Planet's website pointed at vegansexplore.com and was
cleared the same day. Not yet: a question for owners on Your page, and a way for members to tell us.

Duplicates (Sean, 2026-10-10: "merge the duplicates"): a listing is never deleted. A duplicate gets status `rejected` with
`details.merged_into` (the listing that stays), `merged_at` and `status_before_merge`, and what pointed at it (outreach,
votes, saves) moves to the listing that stays; a second queued outreach for the same business is `skipped`. 168 were
merged on 2026-10-10 (`20261010_listing_duplicates_merged.sql`): three public pairs (BunnieCakes, The Rabbit Hole and
Soulicious Vegan Kitchen, whose "Community Partner" copies became an extra category) and 165 hidden import copies of a
listed business. Branches in different cities are not duplicates. Hidden import copies can share a slug with the public
listing, so look a listing up by slug and `status = 'approved'`. An old link to a merged copy forwards to the listing that
stays: `directory/listing.html` asks `ve_listing_merged_to(slug)` (migration `20261010_listing_merged_redirect.sql`)
when a slug has no approved listing, keeping the address's tab and hash.

**Ready to list worked 2026-11-07** (Logan, playbook `ve-community-directory`; handoff `docs/handoff/2026-11-07-ve-community-directory-ready-to-list-events.md`): 279 of the 330 listed after a light check (open on Google, website answers or 5+ reviews, no Google calls), 8 set aside, 44 left for Sean; the 15 waiting events cleared (12 approved, 3 turned down); Port Richey and Orange Springs are in Central Florida (`ve-claims` HUBS waits for a deploy from `main`); the Vegan Squad Retreat page carries the $250-off code line.

**The logo hunter, 2026-11-07** (Sean: "if a logo exists, you should be able to pull it"; playbook `ve-community-directory`; edge function `ve-logo-hunt`, table `ve_logo_hunts`, migrations `20261107_ve_logo_hunts*.sql`). Replaces the old logo sweep (cron `ve-logo-sweep` paused 2026-11-07: it sent full-size pictures to Claude for 282 listings a day while the Anthropic API account had $43.73 of a $260 promotional credit left, expiring 2026-11-17, auto-reload off). Per listing: their website (read in a real browser, Apify `rag-web-browser`, when it refuses us or draws with scripts), Google Images (`hooli~google-images-scraper`), their Facebook and Instagram pictures; each candidate stored in `vegan-media/media/logo-hunt/<run>/<slug>/`, Claude (Opus 5.5) sees 512 px copies (Supabase `render/image`) and picks; `auto` only when two sources agree and confidence is high, else `review`. `start` queues a run and works it three groups of five at a time (each group its own call, `nextGroup`); `export` writes `report.json`; `apply` / `apply_zip` save squared JPEGs (squared outside, `stage` gives signed upload links) the way `logo_set` does, `details.logo_source = 'logo-hunt'`, a `ve_listing_edits` row each. Facebook name search exists but is off (`fb_search: true`): it rarely found the right page. Cost measured: about 2 cents Apify and 1.3 cents Claude a listing (`cost_usd`, `claude_usd`). Apify's Starter plan has a hard $29 a month cap (cycle from the 7th). Results 2026-11-07: 10 from the 30-listing sample, then 250 listings (100% Vegan first): 111 confirmed, 97 to check, 42 none; 202 saved after Logan checked every pick by eye and Sean approved the 14 doubtful ones (La Charrita shrunk on white); 6 wrong picks left on the letter. **On hold** (Sean, 2026-11-08: the 250 were a test, the rest waits until he says go). A run started by mistake on 2026-11-08 (`batch-1108`) was stopped at 45 ($1.06 Apify, $0.59 Claude); 35 saved (31 after a check by eye, 4 doubtful ones Sean approved; Animal Acres left on the letter), 382 never searched. Never start a run without Sean's go in that chat.

**N to R worked, 2026-11-08** (playbook `ve-community-directory`; handoff `docs/handoff/2026-11-08-ve-community-directory-n-to-r-worked.md`): Needs support 6 done; On hold 123 down to 98 on purpose (4 back live, 22 Removed); event leads 186 cleared (9 linked, 15 added); backlog "check" 595 cleared (20 listed, 575 set aside with reasons); weekly event searches added for North Florida, Delaware, West Virginia, Maryland, Virginia; `ve-claims` v52 from main (Port Richey and Orange Springs in Central Florida). Left for Sean: K (44 Ready to list), L (Pacific Point Preserve, Humane Association of Ga), M (the logo hunt on the 382, on hold), then S, T, U.

**T1 to T3 worked, 2026-11-08** (playbook `ve-community-directory`; handoff `docs/handoff/2026-11-08-ve-community-directory-t1-t3-listing-queue.md`): Juices For Life listed
(Castle Hill main, Throggs Neck and Juice 2 Heal White Plains as locations, Vegan options, vetted); a cold hello to @juice2heal waits as a draft in Depot > Outreach; the 114
read (8 listed, 106 set aside); **the listing-request queue**: `ve_listing_requests`, edge function `ve-listing-requests` (submit, research, queue, decide), cron
`ve-listing-requests`. Sean's own requests (Request a listing on his For you) go straight to work; everyone else's are drafted by the worker through `ve-listing-intake`
(which now takes the cron secret) as quarantined `listing-request` listings, then show on Sean's For you with Publish, Send to vetting (Being vetted for a food place
with Vegan options, else On hold for review), Remove; a place already listed is never drafted twice. Visitors: search's empty state, `/public/ve-listing-request.js`. **Merged to `main` 2026-11-08 (eb15f89).** Not proven: decide pressed as a signed-in super admin, the For you tiles in a browser.
**Feedback feeds the queue (2026-11-08)**: a Feedback item of kind Something is missing on `/directory`, `/search`, `/dashboard/directory` or a chapter hub's Directory (`?tab=directory` or `?dir=`) also makes a `ve_listing_requests` row (source `feedback`, `feedback_id`; the message's first link or @handle is its link, else its words stand in for the name; inside the queue's `per_day`), and the feedback item's note says so. `ve-feedback` v4 from 50070fd (sha256 ac3e2ad8 matched), merged to `main` 2026-11-08 (0dc35c2), so main's ve-feedback equals live. Proven live with [TEST] rows (a Directory page queued, the Events page not), removed.

## Directory navigation (LOCKED by Sean 2026-10-30, playbook `ve-directory-navigation`)

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-directory-navigation`; migration
`20261030_directory_navigation_canon.sql`). Sean: "what should be in this drop down is the actual directory main navigation... the
first thing in the filter would be choosing the city... continent, then... the country, and then... the city... grayed out until you
choose the first one." Built the same day on `/directory` and the dashboard's Directory tab; the city hubs are unchanged (their
Directory is their chapter's).

- **The banner's dropdown is the Directory's menu**: Food, Products, Services, Media, Community, People, Being vetted (members),
  Review (super admins) (`config.sectionMenu`; `tellSection` passes `subs.sections` and `subs.open(key)`; the banner's `setChoices`).
  The line under the title is the section and, where it applies, the location ("Food · South Florida"); the banner wears the
  chapter's art (`VECityBanner` `setArt(slug)`, which leaves the picker alone).
- **The row under the banner is the section's sub-sections** (`.vrd-subtabs`, the pills as tabs; the section tab row is hidden,
  `.vrd-menu-out`), out of the filter. On phones (768 px and under) it is one full-width dropdown (`.vrd-subsel`, which clicks the
  matching tab and follows it), never a sideways scroll (Sean, 2026-10-31: "a little clanky").
- **The filter button reads Filters** with how many are set, wider, 16px after the search (every page with the component, hubs too).
- **Location is first in the filter** (`config.location = {initial, onChange(loc, hub)}`): Continent, Country, Chapter
  (`VE_HUBS[].continent`, `.country`, set in `ve-hubs.js` from `WHERE`; a chapter in a new country adds its state code there),
  each disabled until the one above is picked, a level with one choice filled by itself (Europe fills the United Kingdom and London),
  All at every level, then Area (the chapter's cities). Every listing loads once and the location filters the cards by `data-hubs`
  (`LOC`, `locSet`, `locApplies` in `ve-region-directory.js`), so a pick redraws nothing. A **tag by the search** names the location
  with an x that clears it (`[data-vrd-loc-clear]`); the location never hides inside the filter and is not counted on the button.
- **Where it applies**: Food, Products, Services, Community, Being vetted (`LOC_SECTIONS`); not Media or People; not Food Brands or
  Nutrition & Supplements unless Sells at is Markets & events (`geoApplies`). Where it does not apply, the location filters nothing.
- **Remembered across visits**: `/directory` keeps it in `localStorage` `ve_dir_loc` (a first visit takes the member's home chapter,
  else every location), and since 2026-11-01 writes it in the address too (Every view is a link, below): `?city=<chapter>`. The dashboard starts on its
  active city, and a chapter picked there becomes the active city (`switchActiveCity(slug, member, true)`), every location widening
  only the tab (`DASH_ALL.directory`).
- **The ad rail follows it**: the chapter's two banners where the location applies and a chapter is picked, else the All cities pair.
- **Events got the same navigation the same day** (Sean: "Let's do something similar to the events so we improve on that
  experience"; canon `canon-ve-directory-navigation` v2): `/events` and the dashboard's Events tab mount `VEEvents` with
  `filterMenu: true`. The banner's dropdown is the kind of event (All events, then the kinds on the calendar; `onState` hands the
  page the kinds, `cal.setCat(kind)`, the kind stays in the address as `?cat=`), **Upcoming / Past** are the tab row (`.vev-tabs`),
  and **Filters** (`.vev-fbtn`, the count is Sort only) holds Location (Continent, Country, Chapter from the events on the calendar
  and `VE_HUBS[].countryCode`) and Sort; a tag by the search names the location. **Kinds are pills too** (Sean, 2026-11-01: "Do the same pills on the Events filters"): Filters has **Kind of event**, any number picked (`?cat=` comma separated), each a pill between the search and Filters: tap it to turn it off and on (grey, struck through), its x to take it away (`paintKinds`, `st.off` in `ve-events.js`); the count on Filters is Sort plus the kinds on, and the banner reads the one kind or "N kinds". Picking from the banner's dropdown sets one kind. **Duplicate events** (Sean, 2026-11-01): Vegan Social Clubs (Atlanta) posts its weekly Wednesday meetup on Meetup twice; "Vegan and Friends" (Atlantucky Brewing) is the official one, and the 68 "The Vegan Social of Atlanta" copies on the same days were turned down (`rejection_reason` "Duplicate of ...", migration `20261101_atlanta_vsc_duplicates.sql`). `ve_event_intake` treats an event turned down as a duplicate as already listed that day, and refuses (`known_duplicate`) a title its host has had turned down as a duplicate three times or more, new dates included. To retire a recurring copy, turn three down with a reason starting "Duplicate of". The line under the title reads "Festivals · South
  Florida" and the banner wears the chapter's art. **The chapter never fills itself here** (events happen everywhere, not only in
  our chapters, so United Kingdom shows every UK event); a country with one choice still does. `/events` keeps the location in
  `localStorage` `ve_ev_loc` (a member's home chapter on a first visit) and in the address since 2026-11-01 (`?city=`, else
  `?continent=` and `?country=`; `syncUrl`), so a shared link opens on the same place; an old `?where=` link opens on it once. The dashboard starts on its active city, and a chapter picked there becomes it (`switchActiveCity(slug,
  member, 'events')`). LESARUSS.ai's Events and Funding (`VE_BRAND.calendar`) keep their own banner; the old toolbar (Where, Sort,
  Upcoming / Past, the kind pills) stays for any mount without `filterMenu`.
- **Not done**: LESARUSS.ai's `/directory` (lesaruss-ai-site) still mounts the component without `sectionMenu` or `location`, so it
  keeps its old layout until that page passes them (its sections fill the banner menu in brand mode). South Florida's counties are not
  an Area step in location mode (Area is the chapter's cities).

## Local Food and Products (LOCKED by Sean 2026-11-01, playbook `ve-local-food-products`)

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-local-food-products`; migration
`20261101_local_food_products_canon.sql`). **Built 2026-11-01** (Sean: "Logan, build Local Food"). Sean: "Why are we putting restaurants above everybody else? They should
see everything and then filter for what they want... the products are the products you can purchase anywhere."

- **Food becomes Local Food** and opens on All: what is here, in the picked location ("Local Food · South Florida"). National grocery
  chains stay under Markets (a store in the chapter is here). The location applies to every listing in it, no brand exceptions.
- **Food Brands (shown as Food & Drink) and Nutrition & Supplements move to Products**: All, Food & Drink, Nutrition & Supplements,
  Clothing & Fashion, Beauty & Personal Care, Marketplaces (trimmed the same day, below). The stored category values do not change,
  only the section they sit under. Old `?tab=food&sub=food-brands` links land on Products.
- **Every section opens on All**, replacing "first sub-section first, All last" (Directory filters, above), which existed only because
  of Food Brands.
- **Products opens on every location**; Sells at gains **Near me** (Anywhere, Near me, Markets & events, Online & stores) for local shops
  with a storefront.
- **No place on a Products card** (Sean, 2026-11-01: "if they're in a product section... by default, we don't see the city, and we
  don't need to see online... If it is sold in only certain places, that could be reflected inside of the profile"): in Products a card
  has no city, Online or Every chapter line, and its label is the Products shelf it sits on (`shelfOf`; Mama Chea Cafe reads Food & Drink
  · Nutrition & Supplements there, Restaurants in Local Food). `makeBrowseCard` / `makeClosedCard` take the section (`cfg.everywhere`).
  Local Food keeps the city; selling online, or only in some places, is said on the listing itself. The Type filter has no Online
  choice anywhere (All and Closed; Sean, 2026-11-01).
- **Products trimmed** (Sean, 2026-11-01: "I moved most of what was in fitness and athletics... over to services. So we can remove
  that category... change it to marketplaces... those listings would probably be better served on LESARUSS.ai. We're looking for more
  vegan marketplaces"; migration `20261101_products_marketplaces.sql`). **Fitness and Athletics** left the menu (its one open row,
  Switch4Good, on hold, became Nonprofits). **E-Commerce & Marketplaces** is now **Marketplaces**, for Vegan marketplaces only (V
  Collective); the stored value on Vegans Explore is `Marketplaces`. Amazon, Etsy, Instacart, Fiverr and Lemon Squeezy carry
  `lesaruss-ai-directory-candidate` (hidden here, kept for LESARUSS.ai, their category unchanged); Amazon's and Instacart's Vegan aisles
  still open by link. Both old names stay in `CAT_MAP` and the functions' lists for older and LESARUSS.ai rows, never as a pill. The edge
  lists (`ve-claims`, `ve-outreach`, `ve-discover`, `ve-listing-intake`) gained `Marketplaces`.
- **Filled 2026-11-01** (Sean: "add the Vegan marketplaces, then do Clothing and Beauty"; migrations
  `20261101_nutrition_supplements_brands.sql`, `_2.sql`, `20261101_marketplaces_clothing_beauty.sql`): only brands whose whole line is
  Vegan, checked by web search. Marketplaces: V Collective, Vegan America, Vegan Essentials, Alternative Stores, Vegancuts. Clothing adds
  NAE, Vegetarian Shoes, Save The Duck, Angela Roi, Doshi, Plant Faced Clothing. Beauty adds e.l.f., Milk Makeup, KVD Beauty, Youth To
  The People, Acure, Lime Crime, Jecca Blac. Left out on purpose: PlantX, The Vegan Kind and Will's Vegan Store (closed or unknown),
  Hourglass, INIKA, Versed and OSEA (not confirmed fully Vegan). A Food & Drink round the same day (`20261101_food_drink_round.sql`): Beyond Meat, Field Roast, Gardein, HIPPEAS, Koia, Partake, Abe's and Navitas Organics listed from the June import, Konscious Foods (seafood), Simply Eggless and Crackd (egg) added, and four untagged brands given their type. Left out: Good Catch, Sophie's Kitchen, Upton's Naturals (no current sign of trading), Lightlife (not confirmed fully Vegan), Impossible Foods was listed on Sean's word with the 2017 rat testing of its heme said in its description. Immaculate Vegan and Noize are marked Permanently closed; Immaculate
  Vegan is out of business (PitchBook), Noize shows 2026 sales.
- **Meal Prep & Delivery** (Sean, 2026-11-01: "Products < Food & Drink < Meal Prep & Delivery"; migration `20261101_meal_prep_delivery.sql`):
  a product kind, `meals`, under Food & Drink (`KINDS` in `ve-region-directory.js` and `ve-listing-admin.js`, `KINDS` in `ve-claims`, the
  `listings_product_kinds_known` check), picked in Food & Drink's Makes filter (the switch under the search went 2026-11-01, below). The five Local Food Meal Prep listings were national
  shippers with stand-in Los Angeles addresses and moved here (Purple Carrot, Sakara Life, Splendid Spoon; Mosaic Foods and Trifecta Nutrition
  as Vegan options), with Daily Harvest added. Local Food > Meal Prep is for local meal preppers. Noize was marked open again the same day.
  **The local meal prep search** (2026-11-02, migration `20261102_meal_prep_search.sql`, scripts in `scripts/meal-prep-search/`): 78 Google
  searches, every chapter, `once:meal-prep-search`. Few local preppers are on Google under Vegan words: 15 matched the rules, 8 were listed
  after a look at each (`crawl_source` `meal-prep-search`): Vegan Vibes (Atlanta), PHAT Vegan (Maryland), Remedy Kitchen Vegan Food Co.
  (Philadelphia), Righteous Life (West Virginia), 100% Vegan; Planthood (London), GURU MEALS and Little Green Forks (Los Angeles), Ambrosia
  Meals (New York), Vegan options, in Being vetted. Pizza places match on Google's takeaway type, so read every match before listing it.
- **Live filters are pills, and every Products shelf has its types** (Sean, 2026-11-01: "if I were to choose... egg alternatives, I would
  expect where it says meal prep delivery to say egg alternatives... Put it in that little pill, and if you hit X on it, it clears the
  filter... the search bar just shrinks"; "I don't want 1,000 categories"; migration `20261101_products_shelf_types.sql`). Every filter set
  away from where it started shows as a pill between the search and Filters, each with an x that clears it (`paintChips`, `liveFilters`,
  `[data-vrd-chips]` in `ve-region-directory.js`; sort is not a filter, the location keeps its own tag). **Tap a pill to turn it off and on**
  (grey and struck through while off, not filtering; `sel._paused`, `fv`), its x to take it away (Sean, the same day: "If you select them
  green, they're all on. If you select one off, it unsorts... when you're done, you just click the X's"). **A shelf's types pick more than
  one** (Sean: "I can add multiple of them and see a filtering of different categories together"): Filters shows them as buttons
  (`[data-vrd-kinds]`), a listing shows if it has any type picked and on, and each picked type is its own pill (`panel._kinds`
  {key: on}). The Markets choice (Local markets / Supermarkets) is a pill like any filter (Sean: "You can keep what you did with the
  markets"). The rule: a filter is a pill; a switch under the search is only for a view a section always has (none today); the search shrinks to make room
  (at least 160 px), and on phones the pills take their own row. The Meal Prep and Markets switches are gone (Clear all left Meal Prep &
  Delivery showing). The Makes filter follows the shelf (`KIND_GROUPS`, `SUB_FILTERS` `kind`): Food & Drink **Makes** (as before);
  Nutrition & Supplements **Type**: Protein, Vitamins & minerals, Meal replacements, Greens & superfoods, Sports & performance; Clothing and
  Fashion: Shoes, Streetwear & casual, Outerwear, Suits & formal, Bags & accessories; Beauty and Personal Care: Makeup, Skincare, Hair care,
  Fragrance, Body & bath. A type shows only when at least one listing on the shelf has it (Suits & formal has WILDA.ECO, 2026-11-03; search reads suit, blazer, tuxedo and formalwear through `ve_search_vocab`, migrations `20261103_suits_formal_wilda.sql`, `20261103_search_vocab_suits.sql`). All are
  `listings.product_kinds` (keys `vitamins`, `meal_replace`, `greens`, `sports`, `shoes`, `streetwear`, `outerwear`, `formal`, `bags`,
  `makeup`, `skincare`, `haircare`, `fragrance`, `bodycare`; `protein` is shared with Food & Drink), set in the listing editor per shelf
  ticked (`KIND_SETS` in `ve-listing-admin.js`) and saved by `ve-claims` `admin_listing`. Every listing on the three shelves was tagged from
  its own description the same day, each a `ve_listing_edits` row. Logan's lists, Sean's to change.
- **Both shelves**: a local business with a product line keeps its local main category and adds Food Brands under Also show it under; a
  brand that vends keeps Vendors (`vendsAt`).
- Products wears the All cities ad pair (the national sponsor space), Local Food the chapter's. The Guide tab map and vetting are
  unchanged. Change the section lists together (see Directory filters); LESARUSS.ai shares the component, so check both sites.
- **How it is built** (`public/ve-region-directory.js`): `CAT_MAP` files Food Brands and Nutrition & Supplements under `products`;
  Food's label is Local Food (its key and `?tab=food` unchanged); every pill row starts with All (the old `allFirst` flag is gone);
  `SUB_LABELS` / `subLabel` show Food Brands as Food & Drink on the pills, the phone dropdown, the search, the card and the address
  (`?tab=products&sub=food-and-drink`); a section with `everywhere: true` (Products) has no location until Sells at is **Near me**
  (`near`: listings with an address in the location, never online or every-chapter ones) or Markets & events (`sellsHere`);
  `applySection` sends an old `?tab=food&sub=food-brands` or `nutrition-and-supplements` link to Products. Also changed: `SECTIONS` in
  `ve-listing-admin.js`, `KINDS` in Directory review, the banners' `allTitle` on `/directory` and the dashboard, the listing breadcrumb
  (Products > Food & Drink) and the Nutrition Guide's Directory link. Flat category lists in the edge functions and `claim.html` needed
  no change. Checked in a browser: Local Food opens on All and follows the location (South Florida only), Products shows every brand
  whatever the location, Near me narrows Products to South Florida shops with the banner reading Products · South Florida, the old link
  lands on Food & Drink, a city hub shows Local Food | Products, no script errors.

## The Guide tab on every listing (LOCKED by Sean 2026-10-31, playbook `ve-listing-guide-tab`)

Concept session with V, locked by Sean: "lock it, go with your defaults" (canon `canon-ve-listing-guide-tab`; migration
`20261031_listing_guide_tab_canon.sql`). **Built 2026-10-31** (Sean: "hand it to Logan, build it"): `/public/ve-guide-tab.js`
(`VEGuideTab.pick`, `VEGuideTab.mount`; `GUIDES` and `MAP` there), loaded after the page shows by `loadGuideTab` in
`directory/listing.html`, which then draws the right column's banner. Not on LESARUSS.ai (`VB`). A demo page shows it without
counting. Ownership is `ve-guide-unlock` `status`. Views and clicks are `ve_promo_events`, promo `gt-<guide slug>`, cta `tab`, with the
listing (`ve_promo_funnel('gt-vegan-dairy-guide', since)`). **Depot > Analytics > Guide tabs** (`#guidetabs`, built 2026-10-31,
Sean: "build the Depot view for the Guide tab numbers") shows them for the page's period against the one before: By Guide (saw it,
before, change, clicked, click rate, how many listings) and By listing (each listing's Guide, saw it, clicked, click rate), people
counted once each; `ve_guide_tab_stats(from, to, prev_from, prev_to)` (migration `20261031_guide_tab_stats.sql`, service role only)
through `ve-analytics` `guide_tabs`. `?tab=guide` opens it. Sean: "this is how we can
continue to put those guides in front of people's faces. And if they already purchased it, it's right there in front of them."

- **Every listing gets a Guide tab, for everyone**, named for its Guide (Dairy Guide, Creator Guide): a short squeeze page (the
  Guide's banner, its one line, three or four things inside, **Open the Guide** to the full Guide page in the same window, never
  framed). Someone who owns the Guide sees **Open your Guide** and no price box.
- **The Partner Dashboard stays its own tab**, right after the Guide tab, for the owner and super admins (and a brand on its door
  link, as today). Super admins see the Guide tab too.
- **The map** (one table in one file, a new Guide is one row): food places and Food Brands, the Vegan Dairy Guide; Content Creators,
  YouTube and Podcasts, the Creator Guide; Activists, Nonprofits, Rescues and Sanctuaries, the Nonprofit Guide; Groups, the Group
  Partner Guide; Nutrition & Supplements, Physicians and Health Experts, the Nutrition Guide (live 2026-10-31);
  anything else, the Welcome Guide (the Passport Guide).
- **Restaurants**: visitors see the Dairy Guide; the owner and super admins also see the Vegan Restaurant Guide on that tab.
- **No repeat**: the right column's house banner (`guideBanner`) never shows the tab's Guide; with the Dairy Guide on the tab it
  rotates to another Guide (Airport, Stadium & Arena).
- **Guides to make**: sections with no real match (Nutrition, Products such as clothing and beauty, Services, Studios), Nutrition
  first.
- Tracked like the house banners: views and clicks per Guide per listing.

## Signature dishes (LOCKED by Sean 2026-11-06, playbook `ve-signature-dishes`)

Sean's idea, his four calls answered with Logan's recommendations (canon `canon-ve-signature-dishes`; A-to-Z list in
`docs/playbooks/ve-signature-dishes.md`). A perk of claiming: **any owner of a food listing** (Restaurants, Bakeries & Cafes, Food Trucks,
Vendors, Catering, Meal Prep) whose claim Sean approved (`owner_member_id`), member or Partner, features up to 3 dishes on its Overview for
free; **slots 4 and 5 are 50 points a slot for 30 days** from the owner's own balance, never renewing on their own (a lapsed slot's dish stays
saved, not shown); up to 20 saved. A featured dish needs a name, a real photo at least 800 px on the shorter side (measured on the server) and one
line; price, up to 5 tags and a link to a menu item are optional. **The owner sets the order; votes never change it.** Passport holders vote once
per dish and can take it back; the counts show; owners cannot vote on their own dishes; signed out gets the Passport window. **It never replaces the
menu** (`ve_menu_items` and the Menu tab are untouched).
- **Data** (migration `20261106_signature_dishes.sql`; RLS on, no policies): `ve_signature_dishes` (a check refuses featured without a photo and
  line), `ve_dish_votes`, `ve_dish_slots`; `ve_dish_cap(listing)` (3 plus each running slot), `ve_dish_slot_buy(member, listing, slot)` (50 points
  from both balances, ledger reason `dish_slot`, ref `dish-slot:<id>`; refused while that slot has more than 7 days left, then the new 30 days start
  where it ends; slot 5 needs slot 4; frozen accounts refused).
- **Edge function `ve-signature-dishes`** (verify_jwt off, the VE token checked inside, standing check on writes): public `list` (featured, owner's
  order, cut to the cap, with counts and the viewer's own votes), `vote`, and the owner's `owner_get`, `save`, `remove`, `order`, `photo_url`,
  `photo_done` (pictures in `vegan-media/media/dishes/<slug>/`), `slot_buy`.
- **The owner** edits on the business dashboard's **Signature dishes** view (`?tab=brand&pd=dishes`, `&item=<id|new>`; `drawDishes`, `drawDish`,
  `wireDishes` in `public/ve-partner-dashboard.js`, copied from its Menu view): featured in order with up and down arrows, saved ones, More slots.
- **The page** shows **Signature dishes** under About (`#sig-dishes`, `loadSigDishes` in `directory/listing.html`), a card grid (two across on
  phones), the line clamped to two rows. The sample business shows Green Leaf Kitchen's three (`dishes` in `business/sample/listing-demo.js`).
- **Proven live 2026-11-06** through the one-time `ve-once-dishes-proof` (now the 410 stub; script `scripts/supabase-once/signature-dishes-proof.ts`):
  [TEST] dishes on Love Life Cafe with the Logan test account as owner for the run: a 458 px photo and a photo from another site refused, featured
  with no photo refused, a fourth featured refused until slot 4 was bought (50 points once, slot 5 first refused, a second slot 4 refused), the order
  changed by the owner and not by a vote, one vote counted once and taken back, the owner's own vote, an unpaid account's and a signed-out one refused,
  a stranger refused reading and saving; then every row and file removed, the 50 points given back and Love Life Cafe unclaimed again. Checked in a
  browser at 1440 and 390 px on the sample business beside its About and its Menu view. **Merged to `main` 2026-11-06** (Sean: "Merge to main"); the
  playbook is **Done**. **J and K, done 2026-11-06** (Sean: "we can move forward if it looks good"; `docs/proposals/signature-dishes-j-k.md`):
  **the slot reminder** is `ve-nurture` kind `dish-slot` (`dishTick`): 3 days before a paid slot ends, one note to the member who paid while they still own
  the listing, only when a featured dish would come off the page and the slot is not already kept; any day 10 AM to 5 PM Eastern; claimed by
  `ve_dish_slots.reminded_at` / `remind_result` (migration `20261106_dish_slot_reminder.sql`); campaign `ve-dish-slot-ending`; its own approval and switch
  (`nurture.dish_approved_hash`, `dish_on`, both set), so a change to its words puts it back to draft. **Top dishes** on every chapter hub's Overview
  (`#hub-ov-dishes` in `communities/hub.html`, the listing's `.sd-*` card): `ve-signature-dishes` `top` (public) returns each place's most voted shown dish
  over the last 90 days with 3 or more votes, ties to the dish that reached its count first then A to Z, never boosted; the hub keeps its chapter's
  (address by `HUB.match`, or `communities`) and shows up to six only once there are 3. Not yet: a real owner using any of it.

## Finding new places: the backlog check (Sean, 2026-10-10)

"Can the scan also look for new Vegan restaurants as well?" then "Go, start with the backlog". About 2,970 listings sat
quarantined since the May and June imports, never reviewed: 2,386 from our `ve_businesses` list (Instagram handles, no
address, many of them people and creators), 441 from the spreadsheet (244 with a city or "South Florida", 174 a name only),
129 from the SoFlo Vegans Facebook group (city and website), and a few others. `ve-discover` sorts them; nothing is listed
until someone decides (migration `20261010_ve_backlog_checks.sql`, table `ve_backlog_checks`, one row per listing).

- Tracks: **google** (a place: looked up on Google Places by name, kept only in the same state and, when we know which of our
  cities it is in, the same city area), **ig** (only a handle: read with Apify's Instagram profile scraper; a food business
  with one of our cities in its bio or post locations then goes to Google too), **thin** (a name only: nothing to check).
- Matching rules learned on the first batches: one name inside the other, or most real words shared with at least two of them
  (one shared word matched "Green Bar and Kitchen" to "Living Green Cafe"); our state only (Inca Chicken, Hollywood FL, matched
  Maryland); our city area only (South Florida's "Third Culture" matched Titusville); a renamed place ("Meraki Juice Kitchen is
  NOW Christopher's Kitchen") is a duplicate of the listing it became. Instagram leaves the business flag off for many
  restaurants, so a category or food words count as a business; creator categories (artist, writer, musician...) are people.
- Verdicts: **Ready to list** (open, and Vegan by Google's Vegan restaurant category or the business's own name or Instagram
  bio; Google's description saying "Vegan options" is only a Check), **Check**, **Not a restaurant**, **Closed** (Google, or an
  Instagram quiet for over a year with no Google profile), **Already listed**, **Not found**, **A person**, **Not enough to check**.
- Runs by cron `ve-discover-backlog` (every 2 minutes, 40 Instagram accounts and 25 Google lookups a run); with nothing
  pending it costs nothing. Keep it on: Directory review's Paste a list feeds it (the import backlog finished 2026-10-27).
- **Depot > Business outreach > New places** (`#places/<verdict>[/<city>]`, `#place/<listing>`, a card on the home): each
  verdict a tab with its count, by city; one business opens with what Google and Instagram said, links, and its website framed.
  **Add to the Directory** needs a category and how Vegan it is (100% Vegan, Vegan options, Vegan friendly), picked on purpose,
  and fills Google's address, place id, phone and website (`backlog_decide`). Since 2026-10-27 (Sean: "they're a rescue and they're
  a nonprofit... I should be able to add multiple categories... and to manipulate the logo with the new logo feature") the screen
  has the **logo editor** (`VELogoEditor`, with up to four pictures from their website, `add_site`; saved after the listing through
  `add_logo_url` and `logo_set`, so it shows in Logos > Done) and **Main category** plus **Also show it under** (any others,
  saved as `extra_categories` through `ve-claims` `admin_listing`); How Vegan hides only when every section ticked is Rescues,
  Sanctuaries, Nonprofits or Events; **Add the ticked** (Sean, 2026-10-27: "Build the Add all ticked button"): Ready to list has a tick box on every row
  and its own Add as (the category from the guess, `guessCatOf`; How Vegan for anything but an organization), and one button that
  adds every ticked row through `backlog_decide`, on whichever city tab is open. Organizations start ticked; a food place starts
  unticked until its How Vegan is picked (never guessed), and the button waits until every ticked row is complete. The logo and
  other sections are left to the place's own page (the logo sweep suggests a logo afterwards); a place's own page and Directory review's What it
  shows both have a **Name** field (Sean, 2026-10-27: "I wanted to change the title and I couldn't"), saved through `ve-claims`
  `admin_listing` like the listing editor; **Set aside** makes it `rejected` with a note,
  never deleted. Closed, Not found, A person, Not enough to check and Already listed have **Set these aside** for the page. A
  newly listed business joins its city's outreach through Find emails on the city card.
- **Ready to list, sorted by Logan** (Sean, 2026-10-27: "take a good estimated guess... populate it... once I see it up and running, I
  can go ahead and make adjustments"; migration `20261027_ready_to_list_bulk.sql`, run through a one-time function because the
  connector held it): 242 listed with a best-guess category and How Vegan and a note saying so, 19 set aside with why (duplicates,
  one closed, MorningStar Farms as vegetarian, American Humane and RSPCA for their farm labels), 11 left for Sean (no location to
  go by, or Google matched the wrong business). A listing with no address reads as online and shows in every chapter, so a local
  group known only by its chapter gets its state as well as `communities`.
- Next (approved by Sean the same day): the monthly search for new places in each city, after the check-ups.
- **The restaurant search for the newer chapters** (Sean, 2026-10-28: "Philadelphia doesn't have any restaurants, and neither does
  London... West Virginia, Maryland, Delaware, Washington, D.C., and North Florida... do a scan of those areas and start populating
  them"; Virginia had none either; migration `20261028_restaurant_search_new_chapters.sql`). 59 Google Places text searches ("vegan
  restaurant / cafe / bakery in <city or neighborhood>") listed 359 places live (`crawl_source` `restaurant-search`, Google place, address
  and map pin, a team note): **100% Vegan** when Google's main type is Vegan restaurant or the name says Vegan (not Vegetarian or -ish),
  public at once; **Vegan options** when Google tags it Vegan or Vegetarian as a second type, so it waits in Being vetted for 10 member
  votes. Bakeries and cafes by Google's type, caterers to Catering, the rest Restaurants; stores and places with no Vegan label left out;
  two branches with one name in one city get their neighborhood (or street) after a dash. By chapter: London 97, Virginia 64,
  Philadelphia 61, Maryland 54, Florida (the North Florida searches) 43, Washington, D.C. 18, Delaware 16, West Virginia 6. The logo
  sweep, the menu link finder and reader, and the essentials pass fill them in; the essentials cron was widened the same day to every 10
  minutes, 6 to 10 AM UTC, 30 a run (it costs nothing once nothing is due). A listing outside the US shows no empty state in its address
  (`directory/listing.html`). Run it again for a new chapter the same way: searches, then the same rules. **Atlanta and Los Angeles** got the same search the same day (Sean: "run the restaurant search for Atlanta and Los
  Angeles"; migration `20261028_restaurant_search_atlanta_los_angeles.sql`): 194 live, Atlanta 64 and Los Angeles 130. The Los Angeles
  chapter matched only five city names, so its list was widened to the cities found (Pasadena, Long Beach, Santa Monica, Burbank,
  Glendale, Culver City...; `LA` in `ve-hubs.js`, `LA_CITIES` in `directory/listing.html`, `HUBS` in `ve-claims`, `ve_outreach_cities`). **New York and Central
  Florida** the same day (migration `20261028_restaurant_search_new_york_central_florida.sql`): 191 live, New York 105 (a borough with no
  city of its own takes the borough, Brooklyn, Queens, Bronx, Staten Island) and Central Florida 86 (13 nearby cities joined `CF`, and
  `CFL_CITIES` in `directory/listing.html` is now the whole list). **South Florida** the same day (migration
  `20261028_restaurant_search_south_florida.sql`): 101 live (18 100% Vegan, 83 Vegan options; most of its Vegan places were listed
  already), and Naranja, North Bay Village, Opa-locka, Tavernier and Stock Island joined `SF` (the county slices in `SF_COUNTIES` moved
  with them; `SF_CITIES` in `directory/listing.html` is now the whole list). It took the Directory past 1,000 approved listings, which
  showed that `fetchAll` in `ve-region-directory.js` had never paged: its second request asked for the first page again, forever, and
  every Directory view stayed empty for about 30 minutes until it was fixed (`(offset || 0) + 1000`, `order=id`). The Directory reads
  1,000 listings a request and pages until a short page.
  **London and Philadelphia, a second pass** the same day (Sean: "run the restaurant search for London and Philadelphia again... make
  sure that there's something in each listing"; migration `20261028_restaurant_search_london_philadelphia_2.sql`): 88 searches by
  neighborhood (and Pennsylvania's other cities, since the chapter is the whole state), 102 live, London 62 and Philadelphia 40. The
  field mask now asks for `regularOpeningHours`, so hours are saved at insert from Google's opening periods (never from its display
  text, which writes "12:00 to 11:00 PM" for noon), and a name we set aside never comes back. **Every new listing has something in
  it** (Sean: "when people click in it, that they're actually getting something... hours... basic information, and a menu"): hours
  and phone from Google at insert, the About line and kinds of food from **`ve-listing-about`** (below), and a Menu tab: their menu
  link when the link finder found one, else their own website (a food place with no menu link; `menuLinkOut` in
  `directory/listing.html`, "opens their website, where they post their menu").
- **The About reader** (Sean, 2026-10-28; edge function `ve-listing-about`, migration `20261028_ve_listing_about.sql`). The Background
  writer's `listing_essentials` pass had fallen 850 behind, so new listings showed no About. This does that job on the server: it reads
  the business's home and about pages, asks Google Places for the place's own summary and what it serves, and Claude (Opus 5.5,
  structured output) writes one or two plain sentences (130 to 240 characters, Vegan capitalized, no dashes, never upgrading how Vegan
  our listing says it is) and one to four cuisines, saved through `ve_listing_essentials_save` (only empty fields, never over an owner's
  words, a `ve_listing_edits` row each). A site that cannot be read gets a line from Google and our listing only, said so in its note.
  Queue: `ve_listing_about_due()` (ve_listing_essentials rows still queued, restaurant-search listings first); cron `ve-listing-about`,
  12 every 2 minutes. `one` (`slug`, `save: false` to preview) for a single listing. Its notes flag a How Vegan that disagrees with
  their own site (Sweet Love: "many Vegan options", listed 100% Vegan).

## Grocery stores and Vegan aisles (Sean, 2026-10-08)

"As we're bringing different products into these guides, it should automatically map to a supermarket
that carries them, and that supermarket should then show that product." Each supermarket is a Directory
listing (category Markets, tag `ve-grocery-store`, "Grocery store" on its card) whose page opens on a
**Vegan aisle**: every Guide product mapped to it, grouped by type, `?product=<id>` picks one out.

- Data (migration `20261008_ve_grocery_stores.sql`): `ve_products` (brand listing + product type),
  `ve_product_stores` (store carries product; `removed_at` when a Guide stops naming it, never deleted),
  `ve_store_aliases` (how a Guide writes the store: "Kroger family", "HEB"), `ve_guide_product_sources`
  (which `listings.details` key holds a Guide's products; Dairy is `dairy_guide`).
- It fills itself: a trigger on `listings.details` runs `ve_products_sync()`, and a new alias re-maps
  everything. A new Guide with products is one `ve_guide_product_sources` row; a new store is a listing plus
  its aliases. In a Guide, a store named in a product's "where" text links to its aisle inside the Guide.
- Buy link, best first: an affiliate deal (`affiliate_link_code`, a `/go/` tracked link), the product's own
  page at that store (`buy_url`), the store's search (`details.store.search_url`, used only when
  `search_checked` is `results` or `loads`; most chains block automated checks and say `blocked` until
  someone confirms the search in a browser), then the store's website.
- **A chain shows only in the chapters where it has stores** (Sean, 2026-11-01: "we have Atlanta and there's like 20 different markets
  listed. Are these all in Atlanta?"; migration `20261101_market_chain_footprints.sql`). A chain has no address, so it used to read as
  online and show in every chapter. Its `communities` is now its footprint, checked on Google Places (486 searches, the chain's own store
  in the chapter's metro; namesakes, offices and warehouses left out), and `everywhere()` in `ve-region-directory.js` keeps any listing
  with no address that names its chapters in those chapters only (only Vegan Squad and VegFest Productions were affected besides the
  chains). A chain with no store in any chapter (Jewel-Osco, Hannaford, QFC, H-E-B) is `['none']`: on All locations and its aisle, in no
  chapter; the listing editor shows no chip for it, so saving its Chapters there drops it. Amazon and Instacart sell online and moved to
  Products > E-Commerce & Marketplaces, every chapter (their Vegan aisles key off the tag, not the category); the same day both went to
  LESARUSS.ai only (Products trimmed, under Local Food and Products). Each change is a
  `ve_listing_edits` row. A new chain needs its footprint set when it is added, or it shows nowhere but All locations. Giant is Giant
  Food (D.C., Delaware, Maryland, Virginia); The GIANT Company in Pennsylvania is a sister chain, not counted.
- **Supermarkets live under Markets only** (Sean, 2026-11-01: "I don't like seeing the supermarkets mixed in with the local because
  they're not all vegan... pull them out of the all listing in Local and just have them on the Market Tab and have a toggle where
  people can see Local Markets and Super Markets. But by default you see both together"). A section's All never shows a chain
  (`data-chain` 1, tag `ve-grocery-store`; `applyPanelFilters` in `ve-region-directory.js`). Markets has a visible switch under the
  search, **All markets · Local markets · Supermarkets**; since 2026-11-01 it is the **Markets** filter in Filters (`data-vrd-chain`,
  All by default), shown as a pill when set (below); the same in every city hub's Directory.
- The Vegan aisle is one category at a time: department and category dropdowns, search, Sort by (most
  voted brand first), 12 cards then Show all. Each card opens the product's page.
- Brand pages (Sean, 2026-10-08: "so we don't have like a thousand different pages let's just make it a little mini
  web experience for Oatly"): a brand with products in our Guides (a `listings.details` key in `VEProducts.SOURCES`,
  the same keys as `ve_guide_product_sources`) is one page, its Directory listing, with tabs Overview (about the brand
  from `details.about`, its products, where to find them), Products (the list, then one product: Products > Oatly
  Milk, `?tab=products&product=<slug>&v=<version>`; Products again goes back to the list), and For <Brand> for the
  brand alone (below). No Gallery tab (Sean, 2026-10-09: "all we have for products is a main page, products, and
  then... a for Oatly page that only Oatly sees"; `details.videos` stays in the data). The Campaign, Video and Pulse
  tabs appear only once the brand partners with us. The right column holds the open product's Nutrition Facts on top (Sean, 2026-10-08: "put the barcode back on
  the right-hand side and push the billboard down") and the billboard under them, pinned while the page scrolls. It
  wears our city art (South Florida for now). Code: `loadBrandSite` in `directory/listing.html`.
- Brand Partner (Sean, 2026-10-08): "build these out for brands that we're actively pursuing... $111 a quarter just to
  have a seat at the table." Every product brand gets a basic page (Overview, Products). A **featured** page adds our city
  art: a brand we are pursuing is granted it (`listings.details.brand_featured`, Oatly first), and a Brand
  Partner keeps it. Brand Partner is `ve-claims` tier `brand`, $111 a quarter, the same quarterly Stripe subscription and
  claim path as Passport Stop and Anchor (no founding spots, no Passport results sheet). `/claim?listing=<slug>&plan=brand`
  offers it, and a Food Brands or Brands listing is offered only that plan. The tier checks were widened by
  `supabase/migrations/20261008_brand_partner_tier.sql` (applied 2026-10-09 through the Supabase connector). Schema
  changes are applied by Logan through the connector and checked in the database, never handed to Sean to paste.
- **For <Brand>** tab (`?tab=brand`): the brand's door. It shows to the owner, a super admin, and anyone arriving on the
  link we send (it then stays for the visit). The offer is a narrated tour, seven slides since round 5 (Sean, 2026-10-09,
  run past a panel each round; consensus: never show planned things as live, being early is the asset, the brand's own
  numbers are the proof, the gift comes before the price, no dollar budgets on the tour): 1. we built your page, yours to
  keep whatever you decide; 2. from the guide to the shelf (live scaled previews of the Guide, the product and a store's
  Vegan aisle, `?preview=1` so they are not counted); 3. your numbers, counting from day one (the page is brand new,
  `brand_door.made`; `ve_listing_totals()` for anyone on the link, the breakdown behind `brand_stats`; they grow by joining
  campaigns: Guides, events, social and creators, podcasts, ads and videos, our animated programming, all Coming);
  4. the sample ad, unpublished, nothing runs without the brand's approval; 5. campaigns, every card marked Coming
  (`CAMPAIGNS` in `loadBrandSite`, checked in canon: the Plant-Based Showcase on Miami Dolphins game day at Hard Rock
  Stadium, Sunday, November 29, 2026; community nights from November; the World Vegan Expo, city and date not set; our
  Q1 2027 campaigns; a dated card drops off once it passes) and what a partner picks in each (products, a featured Guide
  spot, ad slots on chosen pages, their own ads or ours, a spend to their budget, an assigned campaign manager);
  6. where the membership goes (events, Community Managers doing gig work, the apps) and how they see it (live dashboard, a
  report within 7 days of every event they join), Live now beside Brand Partners only; 7. **Front Row Start** (the early
  offer, named by the panel): join before January 1, 2027 and the rest of 2026 is on us, no charge today, the first $111 in
  January for Q1 2027 with a front-row seat on its campaigns. The button goes to `/claim?...&plan=brand&offer=front-row`;
  `ve-claims` turns that into a Stripe trial ending January 1, 2027 (brand tier only, only before the deadline). After
  January 1 slide 7 is the plain offer (Be our first Brand Partner, $111 a quarter, `brand_door.first`) and plays
  `brand_door.tour_plain_last`. Buttons: the offer, Ask Sean a question, Not yet, send me the numbers. Nothing plays until the
  visitor presses Start the tour (Sean, 2026-10-09); after that every Next or Back plays the slide. Slide 3 is a snapshot of
  the real dashboard (totals live, the rest in outline, locked) that opens it. Maya says "Vegan" right only when the text
  is spelled "Veegan" (el-media, her voice); every clip gets a 0.25 s lead-in and a fade-in so it never starts with a pop.
  The clips are `brand_door.tour` (round 5: `r5-slide-<n>.mp4` for 1, 3, 5, 6, 7; `t-slide-2` and `-4` kept; round 4's six in
  `tour_r4`). Round 5 clips are cut with `scripts/brand-door/assemble_r5.py`, which ends each clip where her mouth is
  closed; check the last second and the lip sync by eye (face close-ups against the voice level) before uploading. A start
  picture with a toothy grin gives a frozen grin, so start from a closed-lip smile. The email that carries the link is the gift (no price), and the
  follow-up brings the brand's real numbers. The brand's Guide narrates in the right column (the billboard steps aside): Maya for the Dairy Guide
  (`VEProducts.GUIDES[..][2]`), her words on each slide (the slide's `say` in `loadBrandSite`, which must match the
  recording) and a clip per slide (`listings.details.brand_door.clips`, `[{video, poster}]`, in
  `vegan-media/media/brand-door/<slug>/`; `brand_door.audio` is the voice-only fallback). Round 2 (Sean, 2026-10-09):
  no b-roll for now ("strip the B-roll for now so we can be strategic with it... less than 10 second clip of her talking,
  I'm okay with that"), so each slide is Maya alone on camera, under 10 seconds, each from a different pose (her start
  pictures are made in Higgsfield from her square art, mid shot, hands drawn right), and the poster is the clip's first
  frame, with a small shift as the slide changes so she reads as moving. She just starts talking: opening the tab and
  every Next or Back plays the slide unless the visitor paused her (a browser that blocks sound waits for a tap). Nothing
  in the tour links away (Sean: "let's keep it just here"). The dark panels wear our city at night, faintly
  (`vegan-media/media/communities/south-florida-night.jpg`). Lines 2 to 8 are shared by every brand
  (`vegan-media/media/maya/brand-door/s-<n>.mp3`); slides 1 and 9 name the brand (`<slug>-s-1`, `<slug>-s-9`), so a new
  brand needs those two recorded and lip-synced. Making a clip: el-media tts, Wan 2.7 (720p, 1:1, `start_image` and
  `audio_references`) in Higgsfield, trim at the end of speech with `scripts/brand-door/assemble_door.py` in Higgsfield's
  sandbox, upload, then ve-off-lookup `save` (it now takes `brand-door/` video and `communities/` art). A lip-sync line
  needs about 3 seconds or more (shorter ones failed). `brand_door.sample_ad` is the sample ad (Sean, 2026-10-08: "show our characters
  consuming their products in the ads just for their pages"); it shows only in the tour, never as a live ad. On a brand
  page's other tabs the billboard carries our own ad for its Guide (`houseAd`, `/go/ve-dairy-guide`): the Guide's
  ad picture (`VEProducts.GUIDES[..][5]`, Maya in a store's dairy-free aisle, no words in the picture), words on top. The Dashboard (`?door=dashboard`): views, visitors, products
  opened and store aisles opened, by day and by source, from `ve-claims` `brand_stats` for the owner or a super
  admin; everyone else sees the outline and Claim. Counts come from `ve_listing_events` through `ve_listing_track()`
  (migration `20261008_ve_listing_events.sql`): every listing logs views, and brand pages log products, store aisles,
  videos and the gallery; one count per visitor and item every 30 minutes; automated browsers are not counted.
- **Partner Dashboard on every listing** (Sean, 2026-10-09: "instead of getting started, it should be a dashboard...
  partner dashboard. And then underneath it is a sub menu"). **Its tab is hidden from the tab row** (Sean, 2026-10-27: "remove the partner
  dashboard and then just whenever somebody clicks own this business, our claim listing, that's where it goes"); since
  2026-10-27 (Sean: "link the claim boxes to /business too") the two claim spots, At a Glance's **Own this business? Add
  details** and the sidebar's black **Claim Listing** box, open `/business?listing=<slug>` (`claimHref`, `data-claim-open`),
  whose Get started claims that listing (`/claim?listing=<slug>`); the tab still opens by `?tab=brand` (`pdHref`); the header's "Is this your business? Claim it" and the Build Out This
  Profile card are gone. The tab shows for the owner, super admins and a brand's partner or link. The claim box and the claim
  page say "Before anything is approved, our team carefully reviews each claim to make sure it is accurate." (`CLAIM_REVIEW`). One tab, `data-tab="brand"`, after Products on a brand page and
  last elsewhere. Locked for visitors (`partnerLocked`): claim this page (a brand's claim carries Front Row Start before
  January 1), or, for a business that is not listed, **Apply to be listed** (Join the Directory, below: `ve-claims` `listing_apply`, any
  Vegan business, anywhere; it makes an unlisted (quarantined) listing tagged `ve-application` and a claim in Depot > Claims, labelled
  Application to be listed; approving lists it and makes the applicant its owner). A non-brand owner and super admins get
  the business dashboard (`loadPartnerHome`, see **The business dashboard** below). A brand's partner gets the sub-menu (`.pd-subnav`, `PD_SUBS`): Getting started, **Insights** (the
  numbers from `brand_stats` once the claim is approved, and Campaigns: clicks and each report within 7 days of an event,
  empty until the first campaign), **Your products** (swap a product's or a version's photo and its description in their own
  words; photos under 1000 px on the shorter side are refused in the page and again in `ve-claims` `product_update`, which
  reads the size from the file; name, ingredients and the cited Nutrition Facts stay ours; every change is a row in
  `ve_product_edits` with the value it replaced, migration `20261009_ve_product_edits.sql`), Opportunities, Media, Ask Maya,
  Ad console (Coming). On a brand page, the For <Brand> offer still shows under Partner Dashboard to anyone on the brand's link.
- **Liz walks the locked Partner Dashboard and /apply** (Sean, 2026-10-09: every Guide is walked through on camera; Liz
  is the general Guide, Maya stays with the Dairy Guide brands). The shared component is `/public/ve-guide-tour.js`
  (`VEGuideTour.mount(el, {guide, title, narr, slides:[{t, h, body, pic, say, clip}]})`), laid out like the For <Brand> tour
  (Sean, 2026-10-09: "set up just like how Oatly set up"): the words and a picture of what she is talking about in a dark
  panel, the Guide in the page's right column (`narr`; on a listing she takes the sidebar's place while the tab is open,
  `pdRail`), on top of the slide on a phone. Back / N of M / Next; nothing plays until Start the tour. `mountPartnerLocked` in `directory/listing.html` runs it on every listing's
  locked Partner Dashboard (5 slides, clips pt-1 to pt-5); `/apply` runs pt-4, pt-3, pt-6. Clips in
  `vegan-media/media/liz/partner-tour/` (`pt-<n>.mp4`, `pt-poster-<n>.jpg`); Liz's voice is
  `character_agents.elevenlabs_voice_id` for liz (Sean picked it, sample 3). A slide's `say` must match the recording.
  Liz's face sits higher in frame than Maya's, so `assemble_r5.py`'s mouth search misses on her: check each ending by eye.
- **Join the Directory** (`/claim`, Sean, 2026-10-09: "it should be one form... already have a business listed? Search to see if
  it's there... if they don't see their business... that's when they add their information"). One page, Liz on the right
  (`VEGuideTour.narrator`, clips `j-1` to `j-5` with `pt-6`), paginated: Find it (search and pick, or **Add it**, `?add=1`;
  `/apply` forwards here), Your business (new businesses only: name, kind, city), The details (how Vegan, one line, about),
  About you (and the website, Instagram and phone), **How to join**; then "You're in" with what comes next. Sign-in comes last,
  at the button, with no sign-in window: signed out, About you asks for a password and the button makes the account from the
  name and email already typed (`VEAuth.signup`), then goes on to checkout; an email that already has an account gets
  Sign in instead with the email filled in (Sean, 2026-10-09: "what's the easiest, simplest way to do that handoff").
  A cancelled checkout comes back to How to join with what they typed (`sessionStorage`). On a phone the step change scrolls
  to just under the sticky menu bar (measured, it is taller there), so Liz is never cut off.
  Depot > Preview journeys > **Join the Directory** walks every screen (Sean, 2026-10-09: "so I don't have to fill out the
  form"): `/claim?preview=<picked|details|you|join|join-member|add|add-details|add-join>` opens that step signed out with a
  sample owner (Alex) and Cinnaholic or a sample new business (Green Leaf Kitchen), and the button says nothing is charged;
  `/directory/<slug>?tab=brand&preview=member-owner` shows a member owner's Partner Dashboard. A new screen gets a preview
  and a line in `JOURNEYS.join` (`admin/depot/preview.html`).
- **How to join, Partner or member** (Sean, 2026-10-09: "we got to figure out what would be the difference... without it
  sounding like you don't get anything"). Two cards side by side. **Partner** ("The full experience", Front Row Start before
  January 1): the page claimed and theirs to update, the Partner Dashboard numbers, a front-row seat on every campaign, their
  Guide on the dashboard (Coming for businesses that are not brands), ads (Coming), Founding Member. **Become a member** ("Start
  with the basics", from $11 one time): the page claimed and theirs to update, Founding Member, and add the Partner side any
  time. Since 2026-10-24 the $11 opens the dashboard and its numbers (canon `canon-ve-business-dashboard`, replacing the
  Partner-only rule): the member card lists the dashboard, the Partner card the front-row seat, ads placed for them and a
  campaign manager. `brand_stats` answers `partner_only` only to an owner with neither the membership nor a plan, and the
  page shows `partnerUpsell` (what they can add, never what they lack).
- **The Partner plan for every business** (Sean, 2026-10-09: "I would rather give everybody the Oatly style offer... the way in...
  they can get access and take control knowing that it's going to activate come January... invested in the platform because of
  the platform, not because of 11 bucks"). `ve-claims` tier `brand` is the $111 quarterly Partner plan for any listing: **Brand
  Partner** for a product brand, **Partner** (Vegans Explore Partner on Stripe and in email) for everyone else (`tierName`). Front
  Row Start applies to all: no charge today, first quarter in January 2027. It is the default on Join the Directory, for a claim
  and for a new business (`listing_apply` with `tier: 'brand'` runs the same subscription checkout); "Just claim it for now"
  (a contribution from $11, Founding Member) is the second choice, and Passport Stop and Anchor show only when the link asks
  (`?plan=verified|plus`). A brand returns to its page (Maya's Getting Started); any other Partner and every new business to
  `/claim?...&claim=submitted&joined=partner`. The $11 is the member offer; members join through the Guides.
- **The business dashboard** (Sean, 2026-10-24, Love Life Cafe as the prototype: "there should be two versions of the partner
  dashboard. One is the preview with Liz explaining, and then the other is the actual dashboard"; canon
  `canon-ve-business-dashboard`). Visitors get Liz's tour (`mountPartnerLocked`; on a claimed listing it says whose dashboard
  it is). The owner and super admins (labelled Viewing as admin; `?as=visitor` shows them the tour) get `/public/ve-partner-dashboard.js`,
  one view at a time (`?tab=brand&pd=<view>`): **Home** (30 days against the period before, Get your page ready with what is
  left as cards and what is done on one line, What's new), **Insights** (7, 30, 90 days or a year, a chart, what people did,
  where they came from, a day-by-day table that sorts by any column), **Your page** (the four-step editor), **Menu** (by section,
  one item per view, `&item=<id|new>`), **Ads** (their campaigns: `ad_businesses.listing_id` -> `ad_sponsor_campaigns` ->
  `ad_campaigns` -> `ad_impressions`; each ad spot with its monthly views; Ask about this spot emails Sean and the account
  manager and logs `ve_initiative_interest` `ad-placement`), **Opportunities** (our campaigns, the same slugs as the brand
  `OPPS`, and open roles), **Audit** (free on claim since 2026-11-01: the listing check and our monthly check-up's flags, each with Have us
do it; the full score is the paid audit; see The listing check, in Sean's order),
  **Guides**, **Your plan**. The $11 Founding Membership (or a live plan) opens it; an owner who is not a member edits the page
  and menu and is offered the $11. Server: `ve-claims` `owner_dashboard` (everything in one call), `menu_list` / `menu_save` /
  `menu_delete` (each a `ve_listing_edits` row, field `menu_item`, undone from the Depot by `ve-outreach`), `ad_request`.
  **What's new** is `ve_dashboard_cards` (audience business, member, coach, pre_vegan or all; kind new, wizard, offer, tip;
  live between `starts_at` and `ends_at`): a new tool reaches every dashboard as a row, no code. **By kind of listing** (Sean, 2026-10-29: the
  Vegan Social Club's dashboard offered "Check your restaurant for free"; migration `20261029_dashboard_cards_by_kind.sql`): a business
  card's `listing_kinds` names who it is for (null: every listing): food, group, organization (Nonprofits, Rescues, Sanctuaries, Events),
  show, work, brand, person, service (`dashKind` in `ve-claims`; the dashboard's `kindOf` calls groups and organizations `org`: no hours,
  their own Get your page ready words and Opportunities, `ORG_OPPS`). Groups see Host your group on Vegans Explore (the group program,
  interest only until its terms are set), Your events on your page, the Nonprofit Guide, bounties and the Daily Pulse. Every listing counts what a
  visitor does next (`trackActions` in `directory/listing.html`: call, directions, website, order, social, menu, photos;
  `ve_listing_track`), and `ve_listing_stats` returns each day's views, visitors and actions plus the period before
  (migration `20261024_partner_dashboard.sql`). The headline tile reads **Taps and clicks** with what it is made of under it ("2 social links, 1 menu opened"; `actsBreak`), and
  the BrandDesk monthly report says Taps and clicks on your page (Sean, 2026-11-01: the old label, "Calls, directions, orders and clicks",
  read as phone calls on a listing whose taps were a menu and social links). A call is a tap on the phone number on our page, never a
  connected call; on 2026-11-01 no listing had one yet, and one had a directions tap (Aisha's Plant-Based Eatery, 2026-10-27). A super admin's **Edit listing** on a listing page is a green pencil on the name's row on phones (`.vla-edit-ico`, `has-vla`;
  Sean, 2026-10-27: it "pushes the other buttons to the left"), the text button under Vote and Save on desktop. A listing's Photos, Video and Pulse tabs show only once they have something
  in them (Sean, 2026-10-24: "I'm not a big fan of the coming soon sections").
- **Menus are linked, not copied** (Sean, 2026-10-27, replacing the copying below: "how do we know if they're updated?... if
  she changes just one of them, we're presenting wrong information... a tab that says menu, and... when they click it, it takes
  them out to wherever their menu is listed... not until they claim it"; migration `20261027_menu_links_not_copies.sql`, run
  through `ve-once-menu-links`). A food place (Restaurants, Bakeries & Cafes, Food Trucks, Vendors, Catering, Meal Prep;
  `PLACE_MENU_CATS` in `directory/listing.html`) that is not claimed has a **Menu** tab that links out (`#tab-btn-menu-link`,
  `listings.menu_crawl_url`, counted as a `menu` action; a location uses its main listing's); a claimed one shows the menu its
  owner keeps on the Partner Dashboard (and any the team entered), never a copied one. Brands keep their Products list. **Then,
  the same day** (Sean: "if we can get an accurate menu, we can use that... only if we can keep the menu up to date with our
  processes"; migration `20261027_menu_monthly_recheck.sql`, run through `ve-once-menu-check`): an unclaimed place shows the menu
  we copied while it is current, each item's `ve_menu_items.checked_at` under 35 days old ("From their website, checked <date>. We
  check it every month."); older, the Menu tab links out instead. The copying runs again (crons `ve-menu-reader`,
  `ve-menu-import-queue`, dispatcher `menu_import`), and with nothing new to read the reader's sweep re-reads the stalest copied
  menu from the page it came from (`ve_menu_refresh_due`: unclaimed, oldest over 28 days, a failed re-read retried after a week): a
  good read replaces the copied items, a failed one changes nothing, so the menu ages out to a link. The **link finder** (`ve-menu-reader` `link` / `link_sweep`, cron `ve-menu-links`, 15 every
  10 minutes, no AI) reads their home page and takes their menu PDF, else their menu page, else their own ordering page (Toast,
  Square `/s/order`, Clover...; through their own Order page when that only points there), never a marketplace; it fills only an
  empty `menu_crawl_url` (a `ve_listing_edits` row) and notes what it found (`ve_menu_imports.link_checked_at`, `link_note`). The
  75 places whose menu had been copied took that page as their link. Directory review's list is **No menu link** (`#menu`,
  `ve_menu_missing()`): Not found, No website, Not checked yet; Menu link + Save, **Find the link again** (`menu_retry`) and
  **No menu online** (`menu_none`). Connecting a point of sale for claimed owners is researched, not built (2026-10-27): Square's
  Catalog API by self-serve OAuth with a catalog webhook is the one any owner can connect; Clover needs an approved app; Toast
  needs its partner program (an owner's own Standard API credentials may not be shared with a third party under its terms).
- **Menus on every listing** (Sean, 2026-10-24: "I would love to see the menus on all the listings"; migration
  `20261024_ve_menu_import.sql`). `ve_menu_items.source` is `manual` (the team), `owner` (their dashboard) or `import`. The
  Background writer (dispatcher source `menu_import`, Station 2, batch 5) works through `ve_menu_imports` (food places with a
  website and no menu; `ve_menu_import_queue()` adds new ones) and copies the menu each business publishes on its own site,
  never a third-party listing and never guessed, through `ve_menu_import_save`, which saves once and refuses a listing that
  already has a menu. Cron `ve-menu-import-queue` (07:17 UTC) queues new food places every night
  (none did after 2026-10-24); on 2026-10-27 274 bare-domain websites (guanabanas.com) were made https:// links (logged in
  `ve_listing_edits`), which let 98 more places queue (migration `20261027_menu_queue_nightly.sql`). **The menu reader** (Sean, 2026-10-27: "build the menu
  reader"; edge function `ve-menu-reader`, migration `20261027_ve_menu_reader.sql`) takes what the writer left at `none` (a picture,
  a PDF, an ordering page that loads only in a browser): it reads their home and menu pages, follows their own ordering links
  (Toast, Square `/s/order`, Clover, ChowNow, order.online...; never DoorDash, Uber Eats, Grubhub or Yelp), opens script-only pages
  in a real browser (Apify `rag-web-browser`, three a listing), takes the menu's PDFs and pictures (Wix and Squarespace originals,
  18 MB a read) and any menu data on the page, and Claude (Opus 5.5, structured output) copies the menu word for word. A Vegan
  place keeps its whole menu; any other keeps only what its menu marks Vegan. Saved through `ve_menu_import_save`; each listing is
  tried once (`reader_at`, `reader_note`, `reader_read`). Cron `ve-menu-reader`, one every 5 minutes in the background; `read`
  with `save: false` keeps a test in `reader_preview`. Proven 2026-10-27: Cafe Gratitude 144 items from its PDF, Under the Mango
  Tree 28 and Blue Tree 19 from their Square pages. Toast's own ordering pages return nothing to an automated browser, so a menu
  that is only on Toast is still missing. An Instagram pass was built and switched off the same day before it read anything (Sean: "I don't think it's probably the best route"); `ve_menu_imports.ig_at` stays unused. **No menu yet** (Sean, 2026-10-27: "Go with the No menu yet list in Directory review";
  migration `20261027_ve_menu_missing.sql`) is a Directory review tab (`#menu`, `ve_menu_missing()` through `ve-outreach`
  `review_list` `menu`): every open food place with no menu (locations left out, they show their main listing's), Not found first,
  then No website, then Being read, most voted first. A listing's **Menu** card says what the reader found and opened, and offers
  **Add it by hand** (the business dashboard's Menu, `?tab=brand&pd=menu`), **Read it again** (`menu_retry`: the writer, then the
  reader) and **No menu online** (`menu_none`: `details.menu_none_ok` and a team note; it leaves the list). A Menu link saved there
  re-queues both readers, and the reader starts from it. The Menu tab says "From their website, checked <month>" for an imported menu. 168 queued on 2026-10-24.
- **Restaurant essentials** (Sean, 2026-10-25: "just because it's vegan doesn't tell the whole story... all the restaurant listings
  have, 250 character about us... the hours... the socials... the address that you can click and go to Google Maps... and then
  the menus... media... can come later once they become members"; migration `20261025_restaurant_essentials.sql`). Food places
  carry **what kind of food** (`listings.cuisines`, up to four: American & comfort food, Soul food, Caribbean... Global mix for a
  place that is not one thing; the list is `CUISINES` in `ve-listing-admin.js`, `ve-region-directory.js`, `ve-claims` and the
  table check, change all four), set in the listing editor, shown as badges beside how Vegan it is, and a Food filter on
  Restaurants, Food Trucks and Catering in the Directory. The address on every listing opens Google Maps (`mapsUrl`: their
  Google place when we hold `google_place_id`). `ve_restaurant_essentials` lists every open food place and what it lacks (about
  of 150 characters or more, hours, socials, street, menu, cuisine). Filled from what the business publishes, never invented,
  only into empty fields and never over an owner's own words, each change a `ve_listing_edits` row the Depot can undo:
  `ve-restaurant-audit` `essentials` (cron `ve-listing-essentials`, 8 AM UTC) takes hours, street, place and website from Google
  and the socials their home page links to; the Background writer (dispatcher source `listing_essentials`) writes the about (up
  to 250 characters) and the cuisines from their own site through `ve_listing_essentials_save`; menus come from `menu_import`.
- **The partner's home** (Sean, 2026-10-09: "once they're in... their dashboard is essentially their page"). When the
  signed-in visitor holds the listing's Brand Partner membership (Front Row Start's trial counts) or owns it (`ve-claims`
  `partner_status`), For <Brand> becomes **Getting Started**: Maya's onboarding tour, six slides with clips in
  `brand_door.start_tour` (welcome to the front row and where things stand; this page is your home; game days, the Dolphins
  model: five or six brands sampling with fans, coupons, content before, the community watch party and tailgate, packaged
  for the next one; the Plant-Based Showcase at events that are not Vegan, college games, festivals, tours like Warped Tour
  being explored; why we do it, Sean's words; next steps), with a Dashboard pill (full once Sean approves the claim). New
  tabs: **Opportunities** (`OPPS` in `loadBrandSite`, every card Coming; I'm interested writes `ve_initiative_interest`,
  `sponsor_tier`, tags `brand-partner` and the slug, emails the account manager; shows on `/dashboard/leads`), **Media**
  (uploads to the private `brand-partner-media` bucket through one-object signed URLs, rows in `ve_brand_media`, migration
  `20261009_ve_brand_media.sql`; the account manager is emailed each file), **Ask Maya** (free saved answers from
  `ve-auth` `guide_ask`; with none, `ve-claims` `partner_ask` emails the question to the account manager,
  `listings.details.brand_door.account_manager_email`, else Sean, Reply-To the brand, logged as `sent_to_person`), and
  **Ad console** (Coming). `?partner=preview` shows the partner's home to anyone, labelled; its buttons work only for a real
  partner or a super admin. A super admin sees the offer by default. Checkout for a brand returns to
  `/directory/<slug>?tab=brand&welcome=1`; approving a brand's claim emails them that the dashboard is open; the claim form
  skips the restaurant questions for a brand.
- A product (`/public/ve-product-view.js`): the photo with its versions (`ve_products.variants`) as round thumbnails
  under it, the chosen version's name, the brand's own description and ingredients, certifications, its Nutrition
  Facts (each version's own, cited; `ve_products.nutrition` only from a cited source such as USDA FoodData Central),
  the USDA record in full, also per version (`variants[].fdc`, else `ve_products.fdc` for the first; from
  `fdc.nal.usda.gov/portal-data/external/<id>`, found with a POST to `/portal-data/external/search`, both of which work
  when the api.nal.usda.gov DEMO_KEY is rate limited; a version with no record says so), Where to find it (each store a button, logo and name, to its Vegan aisle
  on Vegans Explore; never the store's own site: "we want to keep them in our environment"), and more from the brand.
  `/products/<slug>` (`directory/product.html`, rewrite in `vercel.json`) is the shareable link and forwards to the
  brand page with that product open. In a Guide it opens as `#/product/<slug>`. Shared helpers: `/public/ve-products.js`.
- Pictures: product photos are copied into `vegan-media/media/products/<slug>/` from the brand's own product page and
  Open Food Facts (credit CC BY-SA); Sean, 2026-10-08: brand photos are fine to use, and we reach out to the brand.
  Store and brand logos are copied into `vegan-media/media/logos/` (`listings.logo_url`), each checked by eye. Videos
  are the brand's own uploads, checked through YouTube oEmbed (`author_url`). The edge function `ve-off-lookup` (admin
  token) looks at and copies pictures; it writes no rows.
- A new listing gets `vegan_status = 'fully_vegan'` by default. Set it on purpose (null for a store, which is
  not a Vegan business), or the Directory calls it 100% Vegan.
- Next: the sponsorship offer to a store (its page with deals for our members). Amazon Associates is set (`vegansexplore-20`,
  2026-10-29): a product's Amazon link made as a `/go/` link carries it.

## Comment requests: by voice or in writing (Sean, 2026-11-08, playbook `ve-community-voices`)

"Send out an email to them for a comment... the option to complete using a voice recording or writing it out. If they use the voice, we may use it
in our article... ready so we can use it in the future as well for comments from our community on different items... a way to spotlight people
and organizations in our listings." **`/comment/<code>`** (`comment.html`, parent `claim.html`, `noindex`): the ask, then Your comment (record in
the browser up to the request's limit, or attach a voice memo, or write it), About you, Review and send (the release: we may quote it, play it and
edit it for length in the Pulse, our shows, social and Directory pages; 18+), then Thank you with Claim <listing> and Join free. `?preview=1` is
a sample. Edge function **`ve-comments`** (verify_jwt off; public `get`, `upload`, `submit`; team `list`, `create` (takes `listing_slug`),
`update`, `get_admin`, `response_set`), tables `ve_comment_requests` and `ve_comment_responses`, private bucket `community-comments` (migration
`20261108_comment_requests.sql`). One answer closes a request unless `multi` (anyone with the link). **Depot > Comments**
(`/admin/depot/comments`, Content). First: `honest-cuban`, for Honest Cuban by VCC (formerly Vegan Cuban Cuisine, renamed in the Directory and
led the South Florida Pulse on 2026-11-08). Its email is the BrandDesk campaign `honest-cuban-comment-2026-11` (one business, from Sean, `link_path` `/comment/honest-cuban`), never Depot > Outreach: outreach goes through BrandDesk campaigns. Handoff `docs/handoff/2026-11-08-ve-community-voices-honest-cuban.md`. Not built: a Guide voice
on the page, an Inbox row for a new answer (it emails contact@lesaruss.com).

## What connects to a listing: our episodes, other shows, people (Sean, 2026-11-08, playbook `ve-community-directory`)

"The directory listing is designed for discovery. So anytime we can have something that's related or connected, it needs to be there."
`ve_listing_related(listing)` (public RPC) reads `ve_listing_related_cache`, built by `ve_listing_related_build` and refreshed by cron
`ve-listing-related` (every 2 hours at :17, 25 listings, each rebuilt after a day; migration `20261108_listing_related.sql`): **ours** (our four
shows' episodes that name the listing, from `ve_content_mentions`, matched to the feed through `ve_pulse_episode_map` so they play), **elsewhere**
(other Directory podcasts' episodes whose title or show notes name it, 40 at most, `how` featured when the title names it or one of its people,
else mentioned; organizations and groups only), **people** (People listings whose title or bio names it, those whose title names it first) and,
on a person, **orgs** (the reverse). Names (`ve_listing_related_names`): the name without "The" or a parenthesis, the same without a trailing
Sanctuary / Rescue / Inc / Foundation / Society, and `details.aka`; two words and 9 letters or more, or a name that is wholly capitals (PETA); a
name of only generic words ("animal advocates") counts only as a full name of three words or more or one that goes by "The"; any other listing's
longer name that contains it is blanked first, so Farm Sanctuary does not match Woodstock Farm Sanctuary. A wrong match is fixed by `details.aka`
or the listing's name. **The page** (`loadRelated` in `directory/listing.html`): People (or Organizations on a person) as Directory cards, then On our
podcast and On other podcasts as episode rows with Play in a docked player, right after About; then **In the Pulse**, which had no caller on real
listings until now, draws the articles that are not episodes shown above. Films and books keep their own episode sections. First built 2026-11-08:
834 listings, 74 with our episodes (playable), 70 with other shows (582 episodes), 14 organizations with people and 14 people with their organizations. Rachel Black's pending People listing was Removed on Sean's call (2026-11-08: no public presence, an employee at the time); a People listing is for someone who is a personality in their own right.

## Social links and price on listings (Sean, 2026-11-08, playbook `ve-feedback`)

"$2" on listings and "Facebook opens the plain Facebook page, Instagram a broken page". Fixed and live on `main` (ec8f871).
- **Price**: `listings.google_price_level` held Google's raw level (1 to 4) from an old import. It is stored and shown as `$` to `$$$$`
  (migration `20261108_price_level_dollars.sql`: `ve_price_level_dollars()`, trigger `trg_ve_listings_price_level` turns any raw number or
  `PRICE_LEVEL_*` name written later into dollar signs; 48 rows changed, each a `ve_listing_edits` row). Hand-entered ranges ("$10–20") stay.
  The listing page maps 1 to 4 too. No function writes the column today.
- **One link builder**: `socialUrl(net, value)` in `directory/listing.html` builds every social link (the sidebar Follow buttons, the
  "Find them on" icons, schema.org `sameAs`). It takes a full link, `@handle`, `handle` or `site.com/handle`, drops trailing text and a link
  to the wrong network. Before, a bare Facebook handle became a link relative to our own site. `esc()` now escapes quotes.
- **The stored values were the real problem.** Scan of every approved listing (tables `ve_social_link_checks`, `ve_social_scan_ig`, run
  `social-2026-11-08`): Instagram through Apify's profile scraper (885 handles, $2.04, misses run twice): 34 accounts that no longer exist
  (Honest Cuban's `@vegancubancuisine` among them; `@honestcuban` exists with 9 posts but is not confirmed theirs), 15 `@rsrc.php` and one
  `@accounts`, all cleared; `fish_defender,` fixed. Facebook: 25 system pages (16 `facebook.com/docs`, 5 `/login`, `/help`, `/2008`, `/external-redirect`...)
  cleared (27 listings), Blue Moon Cafe's trailing text trimmed. Every removed value is kept in `listings.details.social_removed` and logged in
  `ve_listing_edits` (`meta.playbook` ve-feedback). Migration note `20261108_social_links_cleanup.sql`.
- **Where the junk came from**: the home-page readers (`ve-restaurant-audit` essentials, `ve-discover`, `ve-logo-hunt`) matched
  `instagram.com/` anywhere in a link, so `static.cdninstagram.com/rsrc.php/...` read as `@rsrc.php`, and took Facebook's own pages from site
  footers. Both now require `instagram.com` as the host and skip Facebook's and Instagram's system paths (`TEMPLATE_HANDLES`). Deployed from
  2abef85 (ve-restaurant-audit v22, ve-discover, ve-logo-hunt v11; source sha256 matched). ve-discover's live copy had been behind main
  (no Google meter, max_tokens 4000, no Event Venues or Promoters); v23 brought it level.
- **The rest of the Facebook review, 2026-11-08**: Sean found 4 by search (Coconutz, Darbster, Divine Leaf, Bar Bombón; replaced). The other 36 are hidden until confirmed (`social_removed.facebook.why` starts "Hidden until confirmed"); a Community Manager confirms them by search, queued in `ve-community-directory` with Honest Cuban's new handles. Handoff `docs/handoff/2026-11-08-ve-feedback-facebook-hidden-queued.md`.
- **Checking a Facebook page from the server is not reliable**: logged out, Facebook answers a search-crawler request for a real page with
  its title and a missing one with the login wall, but after about 60 requests it sends everything to login. Apify's pages scraper says
  "not available" for real people whose profiles hide from logged-out visitors (Tabitha Brown, Isa Chandra). Never remove a Facebook link on
  "not available" alone; list it for a person to look at. Instagram's own API returns 404 or 429 to our server, so Instagram checks go
  through Apify.

## What connects to a listing, brands and food places too (2026-11-08, playbook `ve-community-directory`)

`ve_listing_related` (cache `ve_listing_related_cache`, cron `ve-listing-related` every 15 minutes, 25 a run) feeds `loadRelated` in
`directory/listing.html`: People / Organizations cards, On our podcast, On other podcasts. Organizations use `ve_listing_related_names`; brands and
food places (main listings only, not grocery chains or LESARUSS.ai) use the stricter rule (`20261109_listing_related_brands_food.sql`): exact case,
two words and 9+ letters unless every word is generic, one-word names only from `details.match_names` (a list checked by hand), food places need their
city in the notes (a checked name counts in a title alone), a whole-domain or @handle match counts, 5+ notes-only mentions on one show is one
"Show sponsor" row, and a show whose name contains the name never counts. Preview a rule change with `ve_listing_related_strict_elsewhere(id)`
before it reaches the cache; a big preview times out over about 70 listings a call. Handoff `docs/handoff/2026-11-09-ve-community-directory-ve-holiday-guide-wrap.md`.

**One call to action at the foot of the Directory** (Sean, 2026-11-10: "I'd rather there just be one call to action box at the bottom,
the first one that's black, and then we could have three buttons in there... join free, claim your business, suggest the place").
`directory/index.html`: the three boxes (Your votes rank them, Is your business in here?, Know a place we are missing?) are one black
box, "Find your way in.", with Join free (orange), Claim your business and Suggest a place (the listing-request window). Members see it
without Join free. Commit 1354c39.

**Points only to claimed listings** (Sean, 2026-11-10: "only businesses that claim their listing can receive points... remove that
feature until they've claimed... that becomes a perk for them"; "Anyone that's received points already, let's just leave it").
`ve_listing_contribute` refuses an unclaimed listing (`not_claimed`, migration `20261110_holiday_for_dairy_and_points_claimed_only.sql`,
applied live); an unclaimed listing's Community Support card shows the total and "Giving points opens once this business claims its page"
with a claim link instead of Give. Points given before stay: Dina's Vegan Deli & Desserts 625, Love Life Cafe 500 (both unclaimed).

**The Holiday Guide on food listings** (Sean, 2026-11-10: "wherever there's a dairy guide, let's put the holiday guide... come
Christmas, the holiday guide is going to go on hiatus until Valentine's Day"). `public/ve-guide-tab.js` `FOOD_GUIDE = 'holiday-guide'`
(food places' Resources tab, free, Theo); the right column banner shows the Holiday Guide on every listing through Christmas. After
Christmas steps: `docs/history/ads.md`.

## Travel, the full door (2026-11-11)

Sean: "I want us to start filling up the travel directory. So I'm going to start feeding you some information." The Travel door now has
the five sections from his Directory notes: Cruises, Retreats, Stays, Airlines, Travel Apps (`CAT_CONFIG` / `VE_CAT_MAP` in
`/public/ve-region-directory.js`, `SECTIONS` in `ve-listing-admin.js`, `KINDS` in Directory review, `CATS` in `claim.html`, the doors preview,
`CATEGORIES` in `ve-claims`, v54 deployed from d7e5b3a through `ve-function-deploy`, source sha256 matched). A travel card with no one address
reads Sails worldwide (Cruises), Flies worldwide (Airlines), Online (Travel Apps) or Worldwide (Retreats, Stays). A hotel, B&B, villa or
aparthotel is a Stay. First batch: 18 stays from myvegantravels.com/travel-tips/vegan-hotels (15 at 100% Vegan, 3 filed as plant-based
(Pre-Vegan) options), migration `20261111_travel_stays_hotels.sql`, all **on hold** (status pending, Depot > Directory review) until each is
checked on its own site; the session's network blocked the hotels' sites. Website is always the business's own site, never a source's
affiliate link. The source URL is kept in `details.source_url`.

**The first Stays batch, checked (2026-11-11, later the same day).** Read through `ve-web-reader` (below), no network change. Approved
on their own sites (11): Agrivilla I Pini, Casa Albets, Koukoumi, Harmony Hill, Bluedothotel, Il Mansio (address_city Lake Garda), Kapuhala,
Beck Hall, Casa Mauna, Mother Earth Vegan Hotel (Vegan in its own domain, booking and Facebook names), The House of AïA (plant-based
(Pre-Vegan) options). Kept on hold with the reason in `admin_notes` (7): HOY (its site no longer says Vegan), Dreamers Welcome, Jean-Michel
Cousteau Resort, Finca Victoria (only breakfast Vegan), Plantonia (later the same day listed as Vegan-friendly, Sean: "List Plantonia as Vegan-friendly"; migration `20261111_travel_plantonia_vegan_friendly.sql`), The Farm at
San Benito (now a Marriott page that refused the read), Mikasa (no website). Migration `20261111_travel_stays_checked.sql`, written through
`ve-once-travel-stays` (now the 410 stub). Proven live at 1440 and 390: Travel shows the five sections and "19 trips listed".

## ve-web-reader: reading the sites Sean feeds (2026-11-11)

Sean: "What can we do so you can easily access these websites I'm feeding you without me having to add it every single time?... I don't
want to put us at risk. Can we put a safety net in?" (switching the session to full access offered to delete the 51 allowed domains). BOSS
`docs/proposals/2026-11-11-web-reader-boss.md`. `supabase/functions/ve-web-reader` (admin token or super admin; Logan calls it from SQL
through pg_net so the token stays in the database): `register` a link Sean sent (`ve_web_sources`), `read` (text and links, scripts,
comments and hidden elements stripped, marked untrusted; `browser: true` opens it in Apify's browser), `unregister`, `log`. Scope: a
source, a link found exactly on a source page (one hop), or any page of a listing's own website (approved or on hold); anything else is
refused. Address guard: http(s) on 80/443, private, loopback, link-local, carrier, multicast and metadata addresses refused for literals and
resolved hosts, at most 3 redirects each re-checked, 15 s, 2 MB, 300 reads a day. Every attempt is a `ve_web_reads` row (migration
`20261111_ve_web_reader.sql`). Proven live: no token 403; an unrelated site, 127.0.0.1 and 169.254.169.254 refused as out of scope;
registering the metadata address, localhost and localhost:8080 refused by the guard; a decimal loopback address stopped by Supabase's own
firewall first (the reader's handling proven in a local test). Not proven live: a cross-host redirect into a private address (httpbin and
httpbingo both refuse Supabase's servers); the code refuses it by scope before the guard. `ve-menu-reader`'s open `get` action is retired
(410, "use ve-web-reader"), v13.

## Booking.com first: the Book card (2026-11-11)

Sean: "Go Booking.com first" (research `docs/proposals/2026-11-11-travelpayouts-coverage.md`). `bookCta` in `directory/listing.html`, copied
from the Give card (`giveCta`): on a Stays, Retreats or Cruises listing, "Book your stay at <name>", a disclosure ("We may earn a small
commission at no cost to you; it never decides what we list") and one Book button through our own tracked `/go/` link
(`details.book_link_code`, a `ve_links` row, initiative `travel-booking`), `rel="sponsored"`. It shows only when `book_link_code` is set:
nothing shows until Sean approves. `details.book` {provider, url} holds the stay's Booking.com page for 7 stays (migration
`20261111_travel_book_booking_pages.sql`, through `ve-once-travel-stays`, now the 410 stub); Il Mansio's page is to be found in the
Travelpayouts link tool. Previewed (browser-only test data on Beck Hall) at 1440 and 390 beside Farm Sanctuary's Donate card: same family.
Waiting on Sean: Booking.com connected in the Travelpayouts account, and the account's partner marker for the links.

## Playbook ve-travel (locked 2026-11-11, Eastern)

Sean: "Go with your recommendations, lock it into the playbook." Playbook `ve-travel` (HQ BrandDesk, vegans-explore), built from the
active playbook template (v3) by filling its placeholders in SQL (migration `20261111_playbook_ve_travel.sql`, run through
`ve-once-travel-stays`, now the 410 stub); Decision History read from its six `playbook_records`. Locked: listed on merit, direct-first
booking, every paid link labelled, data for destinations; Global Tour 2.0 pilot is one co-branded Europe departure in **September 2027**
(Asia 2028) through a licensed operator who holds all traveler money; Sean's LESARUSS travel on its own budget with a dedicated host;
the outreach pause lifted for three first contacts only (World Vegan Travel, Il Mansio, Beck Hall), each drafted for Sean's approval.
Sources: `docs/proposals/2026-11-11-travel-partnerships-boss.md`, `-travel-and-global-tour-panel.md`, `-travelpayouts-coverage.md`.
Checked in a browser from the stored HTML (HQ needs a signed-in member): stage row, sections, Pending and Completed tabs, groups and
Decision History work at 1440 and 390.

**ve-travel queue, started 2026-11-11 (Sean: "Go ahead and start on the Logan queue").** `bookCta` follows the booking order: a direct
partner first (`details.book_direct` {url, code, perk} and `details.book_direct_link_code`, labelled **Partner link**, "We earn a small
referral fee"), then Booking.com (`details.book_link_code`, labelled **Paid link**), each label at its button; hidden when the user agent
carries `VegansExploreApp` (the native app, when built, must never show a Booking.com link: its terms allow our website only). Previewed
with browser-only test data on Beck Hall (direct) and Koukoumi (Booking.com) at 1440 and 390. `ve_travel_report(from, to)` (migration
`20261111_ve_travel_report.sql`, service role only): views, visitors, website clicks and Book clicks per Travel listing and destination;
first run 20 listings, 11 destinations. Drafts of the three first contacts: `docs/outreach/2026-11-11-ve-travel-first-contacts.md`, waiting
on Sean. Travelpayouts: the LESARUSS account (contact@lesaruss.com) now has a Vegansexplore project, Booking.com applied for; Drive stays off.
Note: three merge commits on main that day were authored "Claude" (the session's default identity); the repo's git config is now Sean.
