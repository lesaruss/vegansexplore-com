# One Depot, built the BrandDesk way (proposal for Sean to lock)

Status: **draft, not built.** Concept session with V, 2026-11-01. Nothing here changes the site until Sean says "lock it".

Sean: "I think we inadvertently created a new depot with the brand desk when it all should just be one thing. But I like what we
came up with the brand desk because it makes it more of a visual wizard-like experience versus what we have now."

## What we have today

**The Depot**: 37 pages under `/admin/depot/`, 28 of them in the Go to menu (`TABS` in `public/depot-tabs.js`) plus 8 dashboard admin
pages and 14 demos. They are grouped by the *thing they touch* (Directory, Content, People, Site), each page its own list with its own
look. 9 pages are only reachable by address (Logos, Pulse, Pulse Cities, Passport Partners, Tours, Passport Challenge and its card and
kit, Import narration).

**BrandDesk**: one Depot page (`branddesk.html`) with Clients, one client (Getting started, Library, Asset sheet, Monthly reports, The
starter shoot, Member visits), Pitch list, Rotation, Who can sign up and My brand; and the guided pages under `/business/` (brand kit,
managed, pitch, check-in, campaign, shoot, site). It is a **per-brand** workspace: pick a client, then walk its parts.

**Social** (`social.html`) already has a brand picker and treats Vegans Explore, Sean A. Russell, GeekFon Society and clients alike.

### The overlap that caused "a second Depot"

| Job | Lives in the Depot | Lives in BrandDesk |
|---|---|---|
| Brand kit | (none) | client kits; My brand (Sean's media kits); Vegans Explore's own kit at `/business/brand?brand=vegans-explore` |
| Social for a brand | Social (per brand, clients included) | the social add-on, planned |
| Campaigns | Brand campaigns (partner windows), Bounties | Rotation (one campaign a client a month), Member visits (are bounties) |
| Reaching businesses | Business outreach (city send days) | Pitch list (sent through outreach's sender) |
| Photos and files | Library (`/admin/depot`) | client Library (`branddesk-library`) |
| Requests | Inbox | BrandDesk requests already land in the Inbox |
| Who's allowed | Claims, Invites | Who can sign up |

So BrandDesk is not really a new Depot. It is the **brand half** of the Depot that never had a home, built with a better pattern.

## The idea in one line

**One Depot with two doors: The House (running Vegans Explore the platform) and Brands (everything done for one brand, ours or a
client's), every job a guided flow, with a Today screen in front of both.**

## The shape

### 1. Today (the Depot's home, replaces the Go to menu as the front door)

What Sean opens first. One screen, nothing to scroll on desktop:

- **Waiting on you**: one card a job with its count, most urgent first (Inbox late, Claims, New places ready, Events waiting, Cookbook
  photos, Venue reports, Barcodes, Notes for Logan, slots Waiting for approval, check-ins due). A card opens that job's guided flow.
- **This week by brand**: a strip of brand tiles (logo, what's going out, what's waiting).
- **Most used / recently used** (what The Depot panel on the dashboard already does).

### 2. Brands (BrandDesk grows into this)

A **brand picker** at the top, the same one Social has, reading one list: Vegans Explore, the Vegans Explore Podcast, Sean A. Russell,
GeekFon Society, then clients (Green Leaf Kitchen as the sample). Every brand gets the same desk, its parts shown only when they apply:

| Part | Today it is | Who sees it |
|---|---|---|
| Overview | BrandDesk client page (Getting started) | every brand |
| Brand kit | `/business/brand` (Cartridge), My brand (Sean's kits) | every brand |
| Social | Depot > Social, already per brand | every brand in Metricool |
| Website | `business/site.html` (frame) | clients, later our own |
| Library | client Library; the house Library for Vegans Explore | every brand |
| Campaigns | Rotation for clients; Brand campaigns and Bounties for Vegans Explore | every brand |
| Shoots and visits | starter shoot, Member visits | clients |
| Monthly | check-ins and reports | clients |
| Numbers | Social analytics; client month numbers; Analytics for Vegans Explore | every brand |
| Account | plan, signature, billing, Pause, End | clients only |

This answers "Social and BrandDesk clients as brands in one place": the brand row is `ve_social_brands` grown into the one brand list
(it already has house and client), linked to `ve_branddesk_accounts`, `ve_cartridges` / `ve_brand_cartridges` and Metricool.

### 3. The House (running the platform)

Grouped by **the job**, not the table. Each job is a list, then one thing per view, then the next one (BrandDesk's rhythm):

| Job | Pages it takes in |
|---|---|
| **Answer** | Inbox, Claims, profile claims, Notes for Logan, Role applications, Submissions, Guest reviews |
| **Review and approve** | Directory review (held, Being vetted, No menu link, Add a listing), Logos (both the old page and Directory review's), New places (from Business outreach), Events queue, Cookbook and Made it photos, Bounties review, Venue reports and Barcodes, Books, Content index review |
| **Grow** (one pipeline board per pathway: the locked Pathways playbook) | Business outreach, Pitch list, Founding Members, Ambassadors, Nonprofit Partners, Group Partners, Invites, Dinner guests, Links, Creators |
| **Publish** | the Pulse desk, Sources, Pulse Cities, Content index search, Venues editing |
| **Watch** | Analytics (with Google costs, Guide tabs), Platform health, Community Insights, Leads, Members, Profiles |
| **Set up** | Onboarding, Services, Dashboard checklist, Who can sign up, Preview journeys, Demos, Tours, Passport Challenge, Passport Partners, Import narration |

Vegans Explore is also a brand, so its *brand* work (its kit, its social, its campaigns) sits under Brands like everyone else's; The
House is only the platform work no other brand has.

### 4. The pattern every screen follows (taken from BrandDesk)

- A job opens as **a queue then one item per view**, with **Back / N of M / Next** to walk the queue (approve one, the next one opens).
  This is the "wizard" feel: Sean clears a queue by pressing Next, not by hunting a list.
- Breadcrumbs: Depot > Brands > Green Leaf Kitchen > Social > Tuesday's reel.
- Status tags in plain words, one action button in the same place, the address carries the view (Interface defaults).
- The brand picker sits in the banner (the shared `VECityBanner` pattern: the dropdown is the menu), so switching brand keeps the part
  you are on.
- Each part shows **Not started / In progress / Locked** where it fits (the brand kit's states), so a brand's desk reads as progress.

## Migration path (every address keeps working)

1. **Shell, no moves** (small): `/admin/depot` becomes Today; `depot-tabs.js` gains the two doors and the job groups (`TABS` regrouped,
   labels unchanged); the current Library page moves to `/admin/depot/library` with a redirect from its old use. Every existing page
   still opens at its address.
2. **Brands door**: `/admin/depot/brands/<brand>/<part>` (a rewrite to one page, like `/communities/<slug>`). Social's views mount
   inside as the Social part; BrandDesk's client views mount as Overview, Library, Monthly, Account; the brand kit opens in place.
   Redirects: `/admin/depot/branddesk#a/<id>` to the client's brand desk, `#rotation` to Brands > Campaigns (all clients), `#mine` to
   Sean A. Russell > Brand kit, `#pitches` to The House > Grow > Pitch list, `#open` to Set up > Who can sign up;
   `/admin/depot/social#plan/<brand>` to Brands > that brand > Social. Hash redirects are done in the page (a small map in the old
   file that forwards, kept for 90 days), since `vercel.json` cannot read a `#`.
3. **The House jobs**, one at a time, each turned into a queue with Next: Answer first (Inbox + Claims + Notes for Logan), then Review
   (Directory review, Logos merged into it, New places), then Grow (the Pathways board, which is already locked and replaces five
   consoles' lists while their detail views stay).
4. **Retire the duplicates**: the old Logos page (`/admin/depot/logos`) redirects to Review > Logos; the dashboard's Your tools and The
   Depot panel read the same new list.

Nothing is deleted: every old address redirects, every edge function stays (`ve-branddesk`, `ve-social`, `ve-outreach`...); this is a
front end and navigation change. Data change: one column or table to make `ve_social_brands` the one brand list (link to listing,
account, cartridge).

## Decisions for Sean (V's recommendation first; the default is taken if you don't override)

1. **Name**: keep **The Depot** for the whole thing and **BrandDesk** for the client product we sell. Inside the Depot the door is
   called **Brands**. (Default.)
2. **Is Vegans Explore under Brands too?** Yes: its kit, social and campaigns live there like any brand's; only platform work is in The
   House. (Default.)
3. **Today replaces the Go to menu** as the first thing you see; Go to stays as a small search for jumping. (Default.)
4. **Community Managers** get the same Depot narrowed to their brands and their chapter's jobs (their Inbox, their check-ins, their
   clients), instead of separate pages. (Default; built after step 3.)
5. **Build order**: shell and Today, then Brands, then The House job by job. (Default.)

When this is locked it becomes the playbook `ve-one-depot` and a canon entry, and the CLAUDE.md Depot and BrandDesk sections point to it.
