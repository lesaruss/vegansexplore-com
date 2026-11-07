# The Depot and BrandDesk: audit and gap analysis

Playbook: `branddesk-production-wing` (the Blueprint). Logan, 2026-11-07, for Sean.
Goal: retire the Depot into BrandDesk without losing anything that works. Nothing has been changed yet; this is the read.

## How this was checked

- **Depot**: every page in `admin/depot/` and every row of `TABS` in `public/depot-tabs.js` (the Go to menu), with the edge function each page calls.
- **Is it used**: the Depot only counts use in your own browser (`localStorage`), so the server cannot see clicks. Instead I read the data each page
  works on: how many rows, when it last changed, how many are new in 30 days. A page whose queue is empty because the program has not launched yet
  is marked **Waiting**, not junk.
- **BrandDesk**: `lesaruss/lesaruss-hq` at `main` 2458e72: `components/branddesk/*`, `app/(shell)/branddesk/*`, and the HQ modules beside it
  (People, Distributions, Leads, Ad console, Library, Pulse).

## The short version

- **They are mostly not competing.** The Depot is how Vegans Explore **runs the platform** (review queues, programs, moderation, content upkeep).
  BrandDesk is how a brand **markets itself** (brand kit, plan, social, web, podcast, insights, outreach), for every brand and client.
- **They really overlap in five places**: Social, Ideas, Playbooks, Outreach (three versions of it), and Analytics vs Insights.
- **The Depot has 54 pages plus 8 dashboard admin pages.** 12 pages can be retired; the rest are either in real use or built and waiting for their program to launch.
- **Nothing in the Depot has a home in BrandDesk yet except Social** (copied in unchanged) and part of Outreach (BrandDesk > People reads the same tables).

## Step 1: what can be retired

Old ideas the canon has already replaced, or duplicates. Data stays; only the page leaves (a redirect where someone might have a link).

| Depot page | Why it can go | Evidence |
|---|---|---|
| Challenges (`/admin/depot/challenges`) | The three Earn your Passport challenges were retired 2026-11-03 | 0 challenges ever |
| Passport Challenge (`challenge`, `challenge-card`, `challenge-kit`) | The scavenger hunt is not running (already off the menu) | 0 hunts, 0 scans |
| Pulse (`pulse`) | The old article Pulse; the Daily Pulse is the Board now (off the menu) | 0 new articles in 30 days |
| Pulse Cities (`pulse-cities`) | City news retired 2026-10-05 (off the menu) | 0 new city news in 30 days |
| Passport Partners (`verified`) | The $250 / $500 plans, replaced by the $111 Partner plan (off the menu) | 1 old row, canceled |
| Logos (`logos`) | Directory review > Logos does it (off the menu) | duplicate |
| Tours (`tours`) | 2027 idea (off the menu) | 0 tours |
| Services (`services`) | The old one-thing services; the shop is BrandDesk's now | 0 orders |
| Dinner guests (`dinners`) | Dinner seats on us ended with comps | 1 dinner (Oct 4), 0 invites |
| Import narration (`narration`) | Part of Onboarding (off the menu) | last change Oct 5 |
| Profiles > Waiting for review | The survey door now admits straight in (Explorer v7); the review queue is dead | keep the profile view, drop the queue |

## Step 2: the clean list, and where each would live in BrandDesk

**Status**: **Used** (real activity), **Waiting** (built, empty until its program launches), **Light** (rarely changes).
**BrandDesk today**: **Same** (already there), **Part** (BrandDesk has some of it), **None** (no home yet).

### Insights and planning

| Depot | Status | Evidence | BrandDesk today | Home |
|---|---|---|---|---|
| Playbooks | Used | 65 playbooks, edited today | Part: Blueprint > Playbooks and guides, Work queue | Blueprint |
| Analytics | Used | live Google numbers | Part: Insights > Web has traffic; Depot alone has Communities ranking, Directory sections, Events, Media, Guide tabs, Google costs | Insights (add those tabs) |
| Ideas | Light | 1 idea | Same idea: Blueprint > Ideas (merge already decided 2026-11-06) | Blueprint > Ideas |
| Feedback | Light | 1 item | None (it is the `ve-feedback` small-fixes queue) | Blueprint > Work queue |

### Marketing (the real overlaps)

| Depot | Status | Evidence | BrandDesk today | Home |
|---|---|---|---|---|
| Social | Used | 12 slots, edited today | **Same page**, copied into BrandDesk > Social by `sync-branddesk-social.py` | Retire the Depot copy |
| Social posts (listing posts) | Used | 1,359 posts | Part: BrandDesk > Social > Index shows them | Social > Index |
| Business outreach | Used | 219 contacts, 3 send days, 1 city on | Part: BrandDesk > People (Roster, Campaigns, Cities, Send days) reads the same tables | People |
| Outreach (one-to-one, people sender) | Used | 80 messages (77 drafts) | None. HQ > Distributions and HQ > People are a third and fourth outreach place | People |
| People (person page, tags) | Light | 0 tags | Part: HQ > People module | People |
| Links | Used | 332 tracked links | Part: HQ > Leads shows the clicks | People or Insights > Campaigns |
| Brand campaigns, ad slots | Waiting | 0 campaigns | Part: HQ > Ad console, Insights > Ads | Ad console |
| BrandDesk (Depot page: clients, pitch list, rotation, check-ins, who can sign up) | Waiting | 0 clients, 0 pitches | Part: BrandDesk > Websites, Brand kit | BrandDesk > Clients |

### Running the Directory (no BrandDesk home yet)

| Depot | Status | Evidence |
|---|---|---|
| Directory review (incl. Logos, Being vetted, Needs support, Add a listing, No menu link) | Used, heavily | 8,116 listing edits and 1,214 logo decisions in 30 days |
| Events (queue, crawl sources, claims, From our events, Weekly check, Heads-up) | Used, heavily | 861 reviewed in 30 days, 34 waiting, 219 leads |
| Claims | Waiting | 0 claims |
| Venues (reports, maps, barcodes) | Waiting | 0 reports |
| Check-ins | Waiting | 0 actions |
| Passport Challenge stops and offers | Waiting | 0 slots |
| Event sponsors (applications, Compare, host stories) | Waiting | 0 |
| Business badges | Waiting | 0 |
| Pre-Vegan Certification | Waiting | 0 (by design until the pilot) |

### Content upkeep (no BrandDesk home yet)

| Depot | Status | Evidence |
|---|---|---|
| Inbox (requests, Pulse desk, news leads) | Used | 3,677 leads, 35 decided in 30 days; 10 requests worked |
| Sources (news feeds) | Used | 46 feeds |
| Content index | Used | 132 transcripts |
| Books | Used | 130 books (cron fed) |
| In this story (mentions) | Used | 254 matches |
| Cookbook | Used | 61 recipes, 16 new |
| Search questions | Light | 2 questions |
| Library (`/admin/depot`, media library) | Used | 278 files |

### Community programs (no BrandDesk home yet)

| Depot | Status | Evidence |
|---|---|---|
| Bounties | Used | 92 bounties (0 submissions yet) |
| Ambassadors (incl. Creators, Commissions, Paid work, Stories) | Waiting | 3 creator applications, 0 commissions (paused) |
| Founding Members | Light | 2 invitations |
| Invites | Light | same 2 invitations |
| Nonprofit Partners | Waiting | 0 |
| Group Partners | Waiting | 0 |
| Community Managers, Onboarding, Dashboard checklist | Light | onboarding audio last changed Oct 5 |
| Profiles (the person view) | Light | queue retired, view stays |
| Referral claims | Waiting | 0 |
| Watchlist | Waiting | 0 cases (log-only) |

### Site and QA

| Depot | Status | Note |
|---|---|---|
| Preview journeys | Used as a QA tool | Keep; BrandDesk has nothing like it |
| Demos (13 links) | Links only | Keep as a list |
| Dashboard admin pages: Leads, Members, Submissions, Role applications, Guest reviews, Platform health, Community Insights, Secret Shopper | Not audited page by page | Leads overlaps HQ > Leads; the rest have no BrandDesk home |

## What BrandDesk does that the Depot does not

Brand kit (and launch gate), Blueprint (Strategy, Score, This period's plan, Work queue, Calendar), Web health, the Podcast studio, Insights for
Podcast, SEO and the written Analysis, the Websites wizard, Tasks, the universe report, and every brand and client side by side. None of these
need anything from the Depot.

## Where they compete, and a recommended fix for each

1. **Social**: two copies of one page. Default: open it only in BrandDesk; the Depot menu item goes to BrandDesk.
2. **Ideas**: Depot > Ideas and Blueprint > Ideas. Default: Blueprint (already decided 2026-11-06); move the one Depot idea.
3. **Playbooks**: Depot > Playbooks (status board) and Blueprint > Playbooks and Work queue. Default: one board in the Blueprint.
4. **Outreach**: four places (Depot Business outreach, Depot Outreach, BrandDesk > People, HQ > Distributions, plus HQ > People for profiles).
   Default: BrandDesk > People is the one home; Depot Outreach (one-to-one and the people sender) moves in as a fourth tab; HQ Distributions and
   the Depot pages retire after.
5. **Analytics vs Insights**: Default: Insights is the home; it gains the Depot's Communities ranking, Directory, Events, Media, Guide tabs and
   Google costs as tabs before Depot > Analytics retires.

## Recommended order (my default unless you say otherwise)

1. **Retire the Step 1 list** (12 pages) from the code, with redirects. Data untouched.
2. **Collapse the five overlaps** above, one at a time, each checked live before the Depot copy goes.
3. **Give BrandDesk an Operations room on the Vegans Explore desk** with five groups (Directory, Content, Community programs, Site and QA, Admin),
   opening the existing Depot pages inside it first (the way Social was moved: no rewrite, nothing lost), then rebuilt natively one by one as
   each is touched. The Depot's address keeps working until the last page has moved.
4. When the Go to menu is empty, the Depot retires.

Open question for you: is the Operations room right, or would you rather each group land in an existing BrandDesk tab (Directory under Web,
Content under Social, programs under People)? My recommendation is the Operations room: these are platform jobs, not marketing, and only Vegans
Explore has them, so mixing them into the marketing tabs is what made the two feel like they compete.
