# History: branddesk

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## For businesses and the sample business (Sean, 2026-10-27)

"Let's remove the VE Verify from Love Life Cafe... it has served its purpose of using it as a template... that also means
removing the partner dashboard... create a fictitious listing that shows like the full soup to nuts page... so that way members
can see what it looks like to have the dashboard without it actually being a real person... Or maybe we have a page specifically
for businesses that is a squeeze page for them."

- **Love Life Cafe is a plain listing again**: its comped VE Verified year is canceled (`ve_verified_memberships` status
  canceled, with a note) and Sean's account no longer owns or claims it, so it is unclaimed like any other place: its Menu links
  to its own menu, and its 51 hand-entered menu items, 4 videos and Pulse post stay in their tables for when the business claims
  it (migration `20261027_love_life_cafe_plain_listing.sql`, run through `ve-once-love-life-plain`, now the 410 stub). No listing
  holds VE Verified now; the badge code stays, dormant, in case it returns with our services.
- **`/business`** is the business page: the Passport Guide (`passport.html`, rewrite in `vercel.json`) with its own tabs when
  the address is `/business` (`BIZ` in the page): Overview, Your page, Your dashboard, Get found (each item Live or Coming),
  Partner plan (Front Row Start), Get started (the Passport, $11 with 1,100 points, which cover a claim; then Find your business,
  `/claim`; with `?listing=<slug>`, from a listing's claim box, it claims that listing). Send a business here whenever we ask
  it to join or do something. The Passport's For businesses tab and the ad
  rail's Your ad here link to it. The old Passport Stop / Anchor page ($250 a quarter, the one-thing services) moved to
  `/business/stops` (`business/stops.html`; `/claim` and Depot > Services and Verified link there).
- **`/business/sample`** is the sample business: the real listing page (`directory/listing.html`, rewrite in `vercel.json`) in
  demo mode (`demoSrc`), fed `/business/sample/listing-demo.js`. Green Leaf Kitchen is invented (the same sample business as
  `/claim`'s previews), never a database row, marked Sample with `noindex`. Its bar switches **A visitor** / **The owner**
  (`sampleView`); The owner, Claim Listing, or `?tab=brand` open **Your dashboard**, the real business dashboard
  (`VEPartnerDash.mount` with `call`, answered by the demo file's `dashboard()` on seeded sample numbers, and `onJoin`); anything
  that would save says so in a toast, and joining goes to `/business#/start`. Its logo and four photos (`business/sample/img/`,
  made in Higgsfield 2026-10-28, illustrative like the restaurant) are on the page and its Photos tab, so its dashboard's Get your
  page ready shows them done. A listing's photos (`gallery_urls`) may be full https links or paths on this site.

## BrandDesk, the production wing (LOCKED by Sean 2026-11-01, playbook `branddesk-production-wing`)

Concept session with V, locked by Sean: "lock it" (canon `canon-branddesk-production-wing`; migration
`20261101_branddesk_production_wing_canon.sql`; the full write-up is `docs/proposals/depot-one-desk.md`). **Not built yet.** BrandDesk
is the Studio at hq.lesaruss.ai/studio renamed and made the product, living in HQ (lesaruss/lesaruss-hq). It replaces the Studio, this
site's Depot and Depot > BrandDesk; until each Depot page has a home there, it keeps working here. Brand kit first (approved means
locked; a locked part changes only on a request with a reason, approved by the owner), then launch opens the modules, each a wizard
(Website and Social first; Video, YouTube, Podcast, Book, Mobile app, Pitch deck as we use them; Product launch premium, waiting on
distributor relationships). A marketing plan rolls out dated tasks; every piece is ask, draft, approve, store. Support per wizard:
Self-serve, Supported, Managed (the $500 managed service below is Managed). **Pricing**: BrandDesk is a perk of the $111 Partner
plan; wizards are rented by the month, period or year. **Periods**: 111 days, one shared calendar from January 1, 2027 (Period 1 Jan 1
to Apr 21, 2027; 2 Apr 22 to Aug 10; 3 Aug 11 to Nov 29; 4 Nov 30 to Mar 19, 2028), always "period", never "quarter". Joining on days 1
to 90 is prorated; days 91 to 111 are the Preparation window, full $111 for the next period, spent building the brand kit. **Front Row
Start now charges $111 at sign-up** (the days before January 1 are bonus); anyone already on the old no-charge trial keeps those terms.
Build order: the Partner checkout first, then renaming the Studio, the foundation, Social and Website, the plan engine, our own brands
first.
**The Partner checkout, built and live 2026-11-01** (Sean: "Logan, build it", then "deploy"; pages on `main` at 0b3320a, `ve-claims`
version 44 from the same commit, source sha256 matched). `ve-claims`
`partnerTerms()` is the shared calendar (`PERIOD_DAYS` 111, `PREP_DAYS` 21, Period 1 from 2027-01-01 Eastern) and the public action
`partner_terms` (`at` previews a date); tier `brand` checks out as a one-time line for what is due now plus a $111 price every 111 days
(`interval` day, `interval_count` 111) on a trial to the next shared renewal at noon Eastern; `metadata.offer` front_row | prorated |
preparation and `metadata.period`. Checked 2026-11-01: today $111 renewing April 22, 2027; March 31, 2027 $22; April 1 to 21 the
Preparation window, $111 for Period 2 renewing August 11. The `offer=front-row` URL param is informational now. `claim.html` mirrors the
calendar (`partnerTerms`, `partnerNow`); the Partner wording on `/claim`, `/business`, the listing page and brand tour, the business
dashboard, the Restaurant Guide, the sample business and Preview journeys, and `/policies#business` (The Partner plan) say it; business
outreach's Day 4 email lost "No charge today" (migration `20261101_partner_periods_outreach_day4.sql`, applied; nothing had been sent).
No Partner membership existed, so nobody holds the old no-charge trial. The three lines that said the old terms were lip-synced videos;
they are now the Guide's voice over her still picture, no video (Sean, 2026-11-01: "picture and voice, no video"): Liz's offer on `/claim`
(`liz/partner-tour/j-5-v2.mp3`; `VEGuideTour.narrator` plays a line's `{audio, poster}`), and Maya's last brand tour slide, shared by
every brand (`brand-door/front-row-v2.mp3` before January 1, then `plain-last-first-v2.mp3` or `plain-last-v2.mp3`; `{audio, poster}`
through `voiceAt`). Recorded with el-media tts in their profile voices, called from the database (pg_net) so the admin token never
leaves it, each checked word for word with `stt`. `ve-claims` and the pages go out together. **Proven live 2026-11-01** in Stripe test mode with the
internal QA account on Love Life Cafe (the one-time `ve-once-partner-proof`, now the 410 stub): the session charged $111 today (a one-time
line for Period 1) with the $111 price every 111 days at $0 today on a trial to April 22, 2027, metadata `front_row` and period 1, its
note on Stripe's page; then expired and the claim and membership rows removed.
**The Studio is BrandDesk in HQ, live 2026-11-01** (Sean: "go", then "deploy"; lesaruss-hq commit 4ed90c1): the pages moved from
`/studio` to `/branddesk` (`app/(shell)/branddesk`), with the nav, links, staff routes and labels; `/studio` and `/studio/*` redirect there
(`next.config.ts`, not permanent); the `/api/studio` data routes are unchanged. Checked from the database (this session cannot reach
hq.lesaruss.ai): the old addresses land on the new ones and `/branddesk` asks a signed-out visitor to sign in. Next: each brand's page as
its home, starting with the Social plan.
**The Social room is live in HQ** (2026-11-01, lesaruss-hq main 674727a): BrandDesk > a brand > Social, through `/api/branddesk/social`
(ve-social with `as_member`). Any of Sean's HQ owner accounts (`lib/ownerAccess.ts`) acts as his super admin members row
(`memberIdForEmail` in `lib/social.ts`); `vegan@lesaruss.com` is V's account, not Sean's.
**The foundation** (2026-11-01; migration `20261101_brand_kit_foundation.sql`, `ve-brand-kit` version 8 from 66abd7c): on every kit a
locked part refuses `kit_save` (409 `locked`); changing it is `kit_change_request` {section, reason} then `kit_change_decide` by the owner
(`ve_kit_change_requests`; approved reopens the part); `kit_launch` only with every part locked (status `launched`, the launch gate); the
**mood board** (`kit_mood_save`: pictures in `media/brandkit/<slug>/` tagged style, type or color, their words; `kit_mood_read`: Claude
proposes a style, six colors by role and one of the four pairings, saved as `mood.read`; never locked). `business/brand.html` sends Edit on a
locked part of a real kit to Ask for the change. HQ's **Brand kit** tab (`components/branddesk/BrandKitRoom.tsx`, `/api/branddesk/kit`) shows
the gate, the mood board, the parts, the requests and Launch; live on lesaruss-hq main dc947e5 (2026-11-01,
Sean: "deploy"; vegansexplore-com main 147a39a). The launch gate does not hold back the running Social plans (Logan's default).
**The Website module** (2026-11-01, Sean: "go with your recommendation", client listings first; lesaruss-hq branch
main 598dc6a, live 2026-11-01, Sean: "deploy"): **BrandDesk > Websites** (`/branddesk/websites`, a button on the BrandDesk
wall; `components/branddesk/WebsiteRoom.tsx`, `/api/branddesk/website`, `lib/branddeskSites.ts`): every BrandDesk client
(`ve-branddesk` `list`), then one client's wizard (`?account=<id>`): 1. their brand kit, its parts and state; **Build their website waits
until the kit launches** (Logan's default: the gate is in HQ, the server's `site_start` and the Depot still build from an unlaunched kit),
with **Launch their brand kit** once every part is locked (`ve-brand-kit` `kit_launch` with the listing's slug); 2. their website (build,
look, send for the owner's OK, record an OK given another way); 3. their old addresses; 4. their domain and its records; 5. the final check;
take it down or end it; every step. All of it is `ve-branddesk`'s `site_*` actions as the signed-in person's members row, the same the Depot
runs. Our own brands' websites wait for a brand frame (the frame is a restaurant's). Checked against mocked answers in a browser at 1366 and
390 px; no BrandDesk client existed yet (`list` returned none).

**The plan engine** (2026-11-01, build order item 4; Sean: "go with your recommendation, next step"; migration
`20261101_branddesk_plan_engine.sql`, edge function `ve-plan`; HQ BrandDesk > a brand > **Plan**, `components/branddesk/PlanRoom.tsx`,
`/api/branddesk/plan`, `lib/brandPlan.ts`). A 3, 6 or 12 month plan (`ve_plans`: brand, start, Self-serve / Supported / Managed, the
rhythm: how many of each kind a month) lays out dated pieces (`ve_plan_pieces`), and each piece rolls out its steps backwards from its
due date (`ve_plan_steps`; `KINDS` in `ve-plan`, Logan's defaults: Social post 8 a month, steps from 7 days before; Reel 4, 14 days;
Article 1, 21 days; Email 2, 7 days; Photo shoot every other month, 28 days, with Book the photographer and its request already
written; Podcast episode, Event and Website update off by default). A piece whose steps would start before today moves later in its
month, never two of a kind on one day. **Every piece moves the same way**: its questions (Questions to answer), then the draft (Ready to
write: **Write it for me**, Claude Opus 5.5 in the brand's locked voice and story from its kit, only from the answers and the brief, or a
person writes it and sends it), Waiting for the OK, Approved (a super admin, the owner of our brands; editors ask for changes with a
note, which the next draft reads) or Changes asked, then **Stored**: a social piece goes onto the brand's Social plan as a slot waiting
for approval there (`ve_social_slots` status `proposed`, batch `plan:<plan id>`, the time in Eastern), anything else with a link or a
note. The answers, draft, OK and store steps tick themselves; the rest are ticked by hand. Every move and comment is a `ve_plan_notes`
row. **The launch gate**: a plan is made only for a launched brand kit (`kit_not_launched`), so today only Vegans Explore can have one;
Sean A. Russell's and GeekFon Society's kits are not started. Who: super admins, else the brand's `ve_social_people` role. The tab opens
on Today (late, today, this week, waiting for the OK), then the plans; `?plan=new|<id>&piece=<id>` carry the view. Proven live
2026-11-01 as Sean on a [TEST] Vegans Explore plan (the gate on GeekFon, 4 pieces and 20 steps made, answers, a draft in the brand's
voice, an empty change note refused, changes asked and draft 2 shorter as asked, approve, store refused before the OK and onto the Social
plan at 12:30 PM Eastern after it, a stored piece refused editing, a stranger refused), then removed through the one-time
`ve-once-plan-proof` (now the 410 stub; the connector held the delete). Not yet: plans for client listings' kits, emailing the owner
when a piece waits for them, and the plan's pieces on the Social plan's calendar before they are stored.

## BrandDesk: managed marketing for Vegan businesses (LOCKED by Sean 2026-10-31, playbook `ve-front-of-house`)

**The name is BrandDesk** (Sean, 2026-10-31: "I like brand desk... it could fit for anybody, anything"; canon v7). It was called
Front of House until then; the canon and playbook slugs keep `front-of-house`. One word, B and D capitals. Trademark and domain check
before it goes on a public page (BrandDeck, a brand-management tool, is close).

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-front-of-house`; migration `20261031_front_of_house_canon.sql`).
**Not built yet.** Sean: "they don't have a solid brand presence... You can't find a logo. Their website looks like it was made in 2014...
I want to create a management package for vegan businesses that's accessible... I have had somebody literally say that to me." People
judge whether food is safe by how a place looks online; businesses want marketing help, not more promotion. Restaurants are the way in.

- **The offer**: **$1,500 setup** (at once or over 3 or 6 months; the rest owed on an early cancel): the
  full audit, a logo and brand kit, Google Business Profile claimed and complete, the website on our template fed by their listing, their
  Directory page and dashboard, a starter shoot of up to 15 menu items, two weeks for what we control (Google's verification shows as
  waiting). **$500 a month**: the managed website (the template improves for every client), Google (hours, photos, posts, reviews), a
  monthly Community Manager check-in on a fixed question set, a campaign a month, live results on the business dashboard, the ad console
  with a capped allowance (worded "included the day it opens" until it is live). **Social +$500 a month** for two platforms; the shop's
  one-platform $400 stays for businesses that are not managed. 12 months, then month to month; they own their domain and content.
- **The split**: $250 to the account's Community Manager (gig work, never an amount in public copy), $250 to Vegans Explore. 10 accounts
  per Community Manager to start; a full one means hiring the next. A city opens to BrandDesk when it has a Community Manager.
- **The showroom**: Green Leaf Kitchen (`/business/sample`) gets its website on the real template, exactly what a client gets minus their
  brand; the template changes only through brand slots (fonts, colors, logo, voice, photo look), like LESARUSS.ai's variables. A
  make-it-yours switch shows it in two or three looks. `/business` gets a **Managed by us** module; the Restaurant Guide's audit links every
  Fix to it (Have us do it).
- **Photos shot like Airbnb** from a fixed shot list (outside by day and dusk, inside wide, every menu item on one surface and angle, the
  team; customers only with consent). One shoot feeds the site, Google, the delivery apps and social. New menu item: added on the dashboard,
  a shoot requested, an influencer night launches it.
- **Visits every week** from creators (perk gigs; paid macro creators as an add-on), Community Managers in house where creators are thin,
  and **member visit bounties** open to everyone: the phone's location proves the visit, a phone shooting guide on the gig, team approval
  before points, the best credited on the listing and our socials. Members pay their own meal unless the restaurant offers a perk; a comped
  visit is disclosed (FTC). Members whose shots keep being approved are scouted toward Ambassador and the Gig Board.
- **A monthly rotation** across managed businesses: influencer night, DJ night, customer appreciation, giveaways, a scavenger hunt stop, a
  community night with a coaching sheet.
- **The pitch**: a presence-gap ranking on the monthly check-ups, then a personal guided page per business (their audit, their site mocked
  on our template, the two-week plan, the price), sent from Sean through business outreach, city by city, with his approval.
- **A handshake before the ask** (LOCKED by Sean 2026-10-31, "lock it"; canon v8, migration `20261031_branddesk_handshake_canon.sql`;
  Sean: "is this too heavy of an ask for people who don't even know us?... we need a handshake before we ask them to commit to $500 a
  month"). 1. **Free**: business outreach's first email gives them their page with the top things from their free restaurant check, no
  price. 2. **$11**: the Vegan Restaurant Guide (every fix, Or have us do it; the pitch page's Not now offers it too). 3. **The BrandDesk
  pitch page** only after a sign (clicked their link, claimed, ran the free check, bought the Guide, Have us do it, Talk to someone) or for
  Sean's warm list; never a cold $500 ask. Outreach starts in the chapters with the biggest gaps and the most signs; every city stays off
  until Sean turns it on. **Both built 2026-10-31** (Sean: "then the handshakes"). **The first email** (migration
  `20261031_handshake_free_check_email.sql`): `ve_outreach_free_check(listing)` takes their latest finished audit from the last 45 days (the monthly
  check-ups), the free check's items to fix, three at most, most important first, each in the check's own words, and a link to their whole free
  check in the Vegan Restaurant Guide (`#/audit/r/<id>`, the free view for anyone); `ve_outreach_render` (the old one kept as
  `ve_outreach_render_base`, called first) fills `{free_check}`, now after the guide line in the Day 0 template. No price. A business with no recent
  check-up gets the email as it was: with the check taken back out, all 234 business emails rendered byte for byte as before; 33 of 78 first
  emails carry one. An upgrade to the offer, so it may go in during a city's 15-day commitment. **Made accurate 2026-11-01** (Sean, reviewing
  the walkthrough: "we need to 100% make sure that these things that we're saying are true... That kills our credibility"; "nothing's theirs to
  keep. They can claim it if they're a member"; "what dashboard? They haven't signed up with us"; migration `20261101_handshake_email_accuracy.sql`).
  Rootz Soul Cafe's email had said "Google has no hours" (Google marks it closed for now) and "we could not find the Instagram" (our reader
  missed it). `ve_outreach_free_check` now uses only a check-up from the **last 7 days**, never for a business our check-up or Google marks
  closed, and only the five checks that read a fact straight from Google or their own home page (hours on Google, the Google rating, phone
  speed by Google's own test, the page title, the search description; never Instagram, "no Google profile", photo counts or "the website did
  not open"); the lines are dated ("We also ran our free restaurant check on Pho Boca on October 25"), and the link is
  **`vegansexplore.com/check/<slug>`** (a redirect in `vercel.json` to the Guide's `?check=`, which asks `ve-restaurant-audit` `latest` for
  their latest check and opens it). `ve_audit_sweep_due` checks first every business on a send day in the next 10 days whose check-up is more
  than 5 days old. Day 0 lost "yours to keep" and the Partner Dashboard / Liz line: the listing, the dated check, then "The first step is
  claiming your listing". On 2026-11-01, 7 first emails carried a check. **Signs** (migration `20261031_handshake_signs.sql`):
  `ve_branddesk_signs()`, per listing, each sign with its latest time: clicked (their outreach link or a reply), claimed, checked (ran the free
  check), opened (opened their free check, the email's link), guide (the Vegan Restaurant Guide bought by the owner or the email we write to),
  asked (Have us do it / Talk to our team, by slug or email), talked (I'm ready, Let me think about it or Talk to someone on a pitch page).
  `ve_free_check_events` (RLS on, no policies), written by `ve-restaurant-audit` (v16): every free check asked for a listed business, a reused one
  too (which wrote nothing before), and every opening of a business's check by anyone outside the team, once a visitor a day. The pitch list
  (Depot > BrandDesk > Pitch list) has **Ready for a pitch (a sign or warm)** and **Showed a sign**, each row and each business's page shows its
  signs, and **Send it from me refuses a business with no sign that is not on the warm list** (`no_sign`; ticking warm is Sean's override).
  Proven live 2026-10-31: the cold send refused with the pitch left a draft and checkout still closed, the business's check opened and its sign on
  the list and its page, the filters drawn; the events, the draft and the proof's free check removed.
- **They rent the service, they own the assets** (Sean, 2026-10-31: "they paid for those photos... so they have that peace of mind to know
  that if things don't work out, they can always have the pieces to start fresh again somewhere else"; canon v2). Stop paying and the
  website and management stop; what we made is theirs, downloadable at any time, said in the pitch. **The severance package**: their
  **Library** on the business dashboard (every photo and video at full size, the logo in every format, the brand kit, graphics and menu
  boards; each file or Download everything as a ZIP); the **asset sheet**, kept current (all copy, the menu with descriptions and prices,
  also as a spreadsheet, hours, links, colors, fonts, the Google details); **their original website archived at onboarding** (a snapshot
  of any site, Wix and Squarespace included; WordPress also its export so it can be restored); and always theirs: the domain, the Google
  profile (they are primary owner, we a manager), their socials and their Directory listing (stays free). On notice: the ZIP and asset
  sheet sent at once, a handoff call, 30 days to download, then the library closes and the template site comes down. Every shoot
  agreement assigns copyright to us so we can pass it on; full-size downloads unlock once the setup is paid in full. **Pause**: up to 3
  months a year at $99 a month (V's default), the site and library stay, no management, the $99 to Vegans Explore.
- **The door, the pitch and the reveal** (Sean, 2026-10-31; canon v3). The Restaurant Guide becomes **The Vegan Restaurant Guide**: what we
  can do for your Vegan restaurant, $11 makes them a member, a living manual on the Creator Guide's model (every tab what to click, each
  item Live or Coming), with a **BrandDesk** demo tab and Launch a product (Coming). A client's **premium listing** wears their brand
  with a small Managed by Vegans Explore mark and never buys rank. **Prepared audits**: a quick audit on every food place, a presence-gap
  ranking, the full audit and a person's plan for the next 30 to contact, Sean's warm list first, worded "We looked at your business
  before we reached out", never dressed as an instant scan. The first page sets the tone (this is a lot; you don't have to carry it; the
  infrastructure for the Vegan movement; a marketing team from $500 a month); membership is "$11 to get in", never "$11 a month". **The
  reveal**: a still picture of their own home page on our template, nothing clickable, then **I'm ready** (the setup checkout), **Let me
  think about it** (they pick a follow-up date) or **Talk to someone** (their Community Manager, else Sean), each landing in the Inbox. The
  why is prosperity: the movement grows through commerce.
- **The photo standard, the Cartridge and frames** (Sean, 2026-10-31; canon v4). Every food item and drink has a high-quality photo; our
  Higgsfield photos for the sample restaurants are the standard photographers meet (a paid three-item trial, else the blueprint). The
  **Cartridge** is one file per client (brand, voice, upgraded copy, menu, photos, info, point of sale) that plugs into a fixed, always
  improving **frame**; it is also the severance asset sheet. Ordering feeds their point of sale (Square first; Toast through its partner
  program or middleware, to be researched). The Vault (gift cards as a marketing exchange) is tabled; members do not spend points at
  managed restaurants. Later frames: products, coaches, the media kit. Built in the client's order: **Green Leaf Kitchen's Cartridge**
  (`business/sample/cartridge.js`, `window.VE_CARTRIDGE`, its shape in the header) and **its brand kit** (`/business/sample/brand`,
  `business/brand.html` (a rewrite in `vercel.json`), guided view, `noindex`: cover, the Cartridge and where each part stands, logo and its files, colors with
  contrast worked out on the page, type, voice, story, menu copy (their words struck through, ours, price, tags, photo or To shoot), the
  photo standard and shot list, hours and details, into the frame). The page draws only from the Cartridge, so a second restaurant's kit
  is its own Cartridge on the same page. **The brand kit is the intake and the owner's editor** (Sean, 2026-10-31; canon v5): each
  section is Not started (only What we need: the need, why, who, how long), In progress, or Locked (the content, Edit, and a warning in
  the editor that changing a locked brand part sets them back). `?as=new` opens the sample as a new client with every part empty; the
  sample saves for the visit (`sessionStorage` `ve_cartridge_sample_new|done`, Start over clears it). The kit wears the client's colors
  only once they are chosen. **Colors editor** built: why colors matter, four ready palettes (Fresh neighborhood, Island bright, Night
  lounge, Street heat), their own six colors by role (page, text, accent, soft, highlight, ink; `brand.colors[].role`) with names and hex,
  a live preview, every pair's contrast and a readability score out of 100 (full marks at 4.5:1, half from 3:1), Save draft or Lock it
  in (refused while a pair is under 3:1). **Voice editor**: three steps (what a voice is, with three example businesses; five questions:
  how they greet a regular, three words, the place as a person, what they never want to sound like, a vibe; their voice written from the
  answers and editable: three words, how they sound, never, words to use and leave out, sample lines for the site, Instagram, a Google
  reply and a closed day), then Save draft or Lock it in. **Menu editor**: the list (items, photo or To shoot, Add an item), then one item
  at a time (Menu > item: name, section or a new one, price, tags, what is in it in their words, the description with **Suggest**, the
  photo uploaded onto the item, shrunk to 900 px in the browser for the sample), Remove item, Save draft, Lock it in. **Suggest** is the
  edge function `ve-brand-kit` (`suggest`, kinds `menu_item`, `story`, `voice`; Claude Opus 5.5, structured output, only the owner's own
  words and ingredients, Vegan capitalized, no dashes; 20 a day for a visitor, 200 for a signed-in member; every suggestion logged in
  `ve_brand_kit_suggestions`, migration `20261031_ve_brand_kit_suggestions.sql`, RLS on, no policies). **Every section has its editor**
  (2026-10-31): **Logo** (upload any file or a photo of the sign, the files we make from it listed with their state), **Type** (four
  pairings shown on their own name and menu: Nunito and DM Sans, Fraunces and Work Sans, Archivo Black and Inter, Playfair Display and
  Lato; the kit's Type slide then wears the pair), **Story** (two steps: how it started, what they cook, who comes in, what they are
  proud of, their old About; then Suggest writes the one line, two sentences and About, every word editable), **Hours and details**
  (three steps: each day's hours; street, city, state, ZIP, phone, email, good to know; what they ring orders up on, Square first, and
  where people order online today), **Photos** (every shot of the space and the team takes its upload; menu photos go on each menu
  item; Lock it in waits until every shot is in). Multi-step editors share `stepper()` (step names, Back / Step N of M / Next).
  **Real kits are stored** (2026-10-31; migration `20261031_ve_cartridges.sql`): `/business/brand?listing=<slug>` loads and saves a client's
  Cartridge through `ve-brand-kit` (`kit_get`, `kit_create`, `kit_save`, `kit_photo_url`, `kit_photo_done`, `kit_people_add`,
  `kit_people_remove`; the member token, or ops with `LESARUSS_ADMIN_TOKEN` and `as_member`). `ve_cartridges` (one per listing: `data`,
  `status` building, locked when every part is, launched, paused, ended), `ve_cartridge_people` (an **editor**, every section, or a
  **photographer**, photos and menu photos only; added by the owner or a super admin by the email they sign in with) and
  `ve_cartridge_edits` (every save with what it replaced); RLS on, no policies. Who: a super admin (admin), the listing's owner, or a
  person added; anyone else sees whose kit it is and to ask the owner. A super admin **starts** a kit (`kit_create`), filled from the
  listing (name, city, how Vegan, hours, phone, address, every menu item from `ve_menu_items` with its words as "was", the logo when it
  is in our storage, the tagline and description), every part Not started. Pictures upload to `vegan-media/media/brandkit/<slug>/`
  (logo, menu, space; JPEG, PNG or WebP up to 15 MB, anything else converted in the browser) and a save that points a picture anywhere
  but our storage or this site is refused (`upload_first`). The page loads the guided view only after the kit is read (signed out:
  Sign in; no kit: Start their brand kit for super admins, else it is started when they join). Proven 2026-10-31 on Love Life Cafe
  through the ops path (signed out refused, admin, the kit filled with its 51 items in 11 sections, its hours, logo and tagline, Colors
  locked and logged, a non-storage picture refused, an upload link issued), then removed; the page's states checked against mocked
  answers. Not yet: cuisines show as their slugs (american); a real upload end to end from the browser.
  **The frame** (2026-10-31): `business/site.html`, Green Leaf Kitchen's website at `/business/sample/site`, drawn only from the Cartridge
  (the sample's, plus what was changed in the sample brand kit this visit): its colors by role (`--c-page`, `--c-text`, `--c-accent`,
  `--c-soft`, `--c-highlight`, `--c-ink`) and two typefaces. **Pages, not one long page** (Sean, 2026-10-31: "why are we on a one pager";
  a menu page and a visit page each answer their own search, and the menu has its own link to share): Home, Menu, Order, About and Visit
  (`#/menu`, `#/order`, `#/about`, `#/visit`; the real store serves them as their own paths). Home: the hero (the outside by day, Open now /
  Opens today at / Closed now from the hours in Eastern time, the voice's website line, the story, See the menu, Order, Directions), the
  today strip, Favorites, Our story, **the space with toggles** (Outside, At night, Inside, The team: `photos.space[].set`), Right now,
  Visit. **The menu** filters by section: tabs on desktop, a dropdown on phones (`.mtabs`, `.msel`), 4 to 6 items a section, every item
  with its photo. **Ordering** (`info.ordering`): `state` `connected` is the point-of-sale version: Add on every item, a cart (quantities,
  subtotal, tax, name, pickup time, a note, Pay and place order, which in the sample only shows the order number; live it goes to their
  Square checkout and lands on their kitchen screen); otherwise Order opens their own ordering page. The sample bar switches the two
  (`sessionStorage` `ve_site_order_mode`, the cart in `ve_site_cart`). **Visit**: address, directions and details | a Google map | the
  week's hours with today marked. The footer: the **reversed logo** (`brand.logo.files` Reversed, `logo-reverse.png`), the pages, address,
  today's hours, Managed by Vegans Explore BrandDesk, and Instagram, TikTok and Facebook (`info.links`). On phones a menu button and a fixed
  Call / Directions / Order bar. It writes the Restaurant and its menu as schema.org data. Its 24 menu photos and 7 space photos
  (`business/sample/img/m-*.webp`, `s-*.webp`, Higgsfield 2026-10-31, the same surface and angle for every dish, from the existing photos
  as references; full size in `vegan-media/media/communities/green-leaf-kitchen/`, copied through `ve-off-lookup` `save`, which takes
  pictures up to 12 MB). **Make it yours** (the showroom switch, built 2026-10-31): the sample bar's Their brand / Island bright / Night
  lounge redraws the same site from the same Cartridge with only the brand slots changed, the colors by role and the two typefaces
  (`LOOKS` and `applyLook` in `business/site.html`, the brand kit's ready palettes and type pairings; `sessionStorage` `ve_site_look`); on
  a dark page the header wears the reversed logo. A new look is a `LOOKS` row.
  **Managed by us and Have us do it** (built 2026-10-31): `/business` has a **Managed by us** tab (`managed` in `BIZ` in `passport.html`:
  what we do, Yours to keep, What it costs, the sample site and brand kit; the name BrandDesk stays off it until the trademark check),
  and the Restaurant Guide has **Or have us do it** on every Fix in an audit (`itemRow`) and **Rather we did it?** on each fix page
  (`viewFix`). All open one request window, `/public/ve-managed.js` (`VEManaged.open({from, fix, business, listing})`, or any element
  with `data-managed`), sent to `ve-brand-kit` `managed_interest` (anyone, 3 a day per email): a `ve_initiative_interest` row
  (initiative `branddesk`, `tier_label` the business, `note` what they want, tags `branddesk`, `from-<page>`, `fix-<id>`, `wants-<x>`),
  an email to the team (reply-to them) and a confirmation to them from Vegans Explore. The Inbox shows it as a **Managed marketing
  request** (migration `20261031_branddesk_requests_inbox.sql`; a business starting [TEST] stays out of the Inbox and sends no email).
  Nothing is charged there. Since 2026-11-01 the business dashboard's listing check and check-up flags carry **Have us do it** on every
  flagged item (`doItBtn` in `ve-partner-dashboard.js`, `from: 'fix'`, `fix` the check's id).
  **The contract and Stripe** (built 2026-10-31; Sean: "approve both", test mode first and the agreement as a draft for the lawyer;
  migration `20261031_branddesk_accounts.sql`, edge function `ve-branddesk`). **`/business/agreement`** (`business/agreement.html`,
  `noindex`) is the Managed Marketing Agreement, version `2026-10-31` (`AGREEMENT_VERSION` in `ve-branddesk`; change both together, and
  a change is a new version), written from the locked terms (30 days' notice after 12 months; on an early end only the unpaid setup is
  owed; work pauses 14 days after a missed payment, the agreement may end at 30; Florida law). Approved by Sean 2026-10-31 ("I was able
  to review it, and I'm okay with the terms"); it has no liability or indemnity clause. **`/business/managed?listing=<slug>`** (`business/managed.html`, `noindex`; the reveal's I'm ready lands here)
  is three steps (`?step=`): Your plan (the setup at once, in 3 x $500 or 6 x $250; social +$500; what is due today and each month),
  The agreement (the key points, the full text, full name typed and I agree ticked), Review and pay (Stripe Checkout). Back with
  `&status=done` it waits for the account and welcomes them; a client already with us sees their plan and can **Pause** (1 to 3 months)
  or cancel a pause set. Signed out: sign in; a listing not opened yet: Talk to our team. **Checkout opens only for listings Sean opens**
  (`ve_site_settings` `branddesk.allowed`, `ve-branddesk` `allow`) and for super admins. **Stripe**: one subscription per client
  (`ve_branddesk_accounts`: plan, social, status checkout | active | paused | canceling | ended | abandoned, Stripe ids, the signature
  with name, time, address and version; RLS on, no policies), priced from reusable Prices found by lookup key (`bd_monthly_v1`,
  `bd_social_v1`, `bd_setup_v1` one-time, `bd_setup3_v1`, `bd_setup6_v1`, `bd_pause_v1`; made once per Stripe account by the function).
  Installments are their own monthly item, and a subscription schedule takes it off after 3 or 6 payments; **Pause** is a schedule too
  (from the next billing date, $99 for the months asked, then back, at most 3 months in 12, not while the setup is being paid);
  `cancel` (super admin) ends at the period's end and says what setup is still owed. The function pins `Stripe-Version` 2024-06-20 (the
  LESARUSS test account's default answers schedules with `plans`). The return trip and ve-stripe-webhook (`metadata.type` `ve_branddesk`,
  `confirm_fn` `ve-branddesk`) activate the account once and email the client and the team. **Live since 2026-10-31** (Sean: "go live"):
  `branddesk.live` true, the Vegans Explore Stripe key; false puts it back on the LESARUSS test key. Checked live the same day as a super
  admin on Sobe Vegan (setup in 3 with social: a live session for $1,500 due today), the session expired and the row removed. `allowed`
  is empty, so checkout opens only for super admins until Sean opens a listing (`ve-branddesk` `allow`).
  **Onboarding, the Library and the asset sheet** (built 2026-10-31; migration `20261031_branddesk_onboarding.sql`). Activation sets
  `setup_paid_at` when the setup is paid at once (installments: once their paid invoices reach 3 or 6, checked on read) and starts the
  **website archive** of the listing's website at once: `ve-branddesk` reads every page on their site (up to 40) and the pictures,
  styles, fonts and scripts they use (500 files, 60 MB, two minutes; analytics left out), points the links at the copies so it opens
  offline, adds `manifest.json` and `README.txt`, and saves one ZIP in their Library (`ve_branddesk_archives`: platform, pages, files;
  a WordPress site is noted so the team asks for its own export). Proven on Love Life Cafe's site: 15 pages and 40 files, 9.7 MB, its home
  page opening offline. **The Library** is `ve_branddesk_files` in the private bucket `branddesk-library` (`<slug>/<kind>/<file>`; kinds
  photo, video, logo, brand, graphic, menu_board, document, archive): signed links an hour long, a 900 px preview for pictures, and
  full-size downloads of what we make only once the setup is paid in full (their archive and documents always). **The onboarding
  checklist** (`STEPS` in `ve-branddesk`, `ve_branddesk_accounts.onboarding`): welcome call (within 2 days), confirmed they run it, website
  archived (on its own), brand kit started (on its own, a `ve_cartridges` row), Google manager access, domain access, social access (with
  social only), starter shoot booked, first files in the Library (on its own). Actions `client`, `step`, `archive`, `file_upload_url`,
  `file_done`, `file_remove` (the owner reads `client`; the rest are super admin). **The client sees it** on their business dashboard as
  **Managed by us** (`?tab=brand&pd=managed&bd=start|library|sheet`, shown when `ve-branddesk` `plan` finds their live account), drawn by
  `/public/ve-branddesk-client.js` (`VEBrandDesk.mount`): Getting started, Your Library (by kind, Download, and **Download everything**, a ZIP
  made in the browser with the asset sheet and the menu as a spreadsheet inside) and **Your asset sheet** (from their Cartridge, else their
  listing: the business, hours, links, story, colors, type, logo files, voice, the menu; Download the menu as CSV, Download the asset sheet
  as HTML). The sample business shows Green Leaf Kitchen's (`VEBrandDesk.sampleData`, its 34 photos and logos). **Depot > BrandDesk**
  (`/admin/depot/branddesk`, Directory in the Go to menu): Clients (`#list`), one client (`#a/<id>[/library|sheet]`: the signature, plan,
  links, End it, then the same three views with Mark done, Archive it now and Add to their Library) and **Who can sign up** (`#open`,
  `branddesk.allowed`). **My brand** (`#mine`, `#mine/<kit>`; Sean, 2026-11-01: "Go with the owner panel") is Sean's owner panel: his seanarussell.com
  media kits (the `sar-kits` edge function, `list`) with Edit and Open the kit, and Edit opens the one kit editor, loaded from
  `https://www.seanarussell.com/assets/js/sar-kit-editor.js` (`SARKitEditor.mount`, `backLabel` Back to my kits) so the kit page and the
  Depot share one editor and one save (`sar-kits` `edit_get`, `kit_save`). It signs with the Depot session: `ve_token` is the same HMAC
  session as seanarussell.com's `lr_token`, and `sar-kits` re-checks `members.is_superadmin` on every read and save. Not a BrandDesk
  client account: no `ve_branddesk_accounts` row, no billing. **Preview journeys > BrandDesk** (`JOURNEYS.branddesk` in `admin/depot/preview.html`, Sean 2026-10-31: "see all
  the components visually without having to go through the whole process myself"): 25 steps from Managed by us to the Inbox, on the
  sample business; `/business/managed?preview=plan|agreement|pay|done|client|closed|signin` (a sample owner, nothing charged),
  `/business/sample/site?look=island|night`, and `?managed=preview` on any page with `ve-managed.js` (opens the request window, sends
  nothing). The whole build is also written up in the playbook `ve-front-of-house` (the BUILD RECORD row, migration
  `20261031_branddesk_build_record.sql`). Not yet: emailing the client when a file lands, the 30-day download window after an end (`ended` closes the
  Library), and a Community Manager's view of their accounts. Proven 2026-10-31 in test mode through `ops_test_activate`
  (Stripe's test card): setup in 3 with social charged $1,500 first and its schedule ran 3 months then dropped the setup item; paid in
  full charged $2,000; Pause refused during installments, set from the next billing date for 2 months with the schedule matching, a
  second refused, cancelled cleanly; cancel reported $1,000 still owed; a real Checkout session opened, an unpaid return went back as
  unpaid, a second sign-up and a signed-out checkout were refused. Test subscriptions canceled and rows removed.
  **The photographer shot list on the Gig Board** (built 2026-10-31; migration `20261031_photo_shoot_gigs.sql`). A client's starter shoot
  is a gig, `ve_bounties.gig_kind` `photo` with `shoot_listing_id`, posted from **Depot > BrandDesk > a client > The starter shoot**
  (`ve-bounties` `shoot_get`, `shoot_post`, `shoot_cancel`; super admins): the fee (default $450, plus 250 points on delivery), an optional
  paid trial (default $75), when applications close and when it is shot by, a note, and the menu items in it (Favorites first, 15 ticked,
  items with a photo unticked; their brand kit must exist first). It shows on the Gig Board in their chapter (kind Photo shoot);
  photographers apply with a pitch, examples and their rate and dates. **The paid trial** is the ask `trial`, never asked up front: Ask for
  the paid trial (decision `audition`, the three dishes in the note) lets them send the link to their trial photos (`apply` then takes only
  that; an audition gig's audition now works the same way). **Book them** makes them the kit's photographer (`ve_cartridge_people`; an
  editor is never downgraded), records `photos.shoot.booked`, ticks the client's onboarding step `shoot` and emails them the shot list.
  **The shot list** is `/business/shoot?listing=<slug>` (`business/shoot.html`, `noindex`; sample `/business/sample/shoot`, Green Leaf
  Kitchen on a shoot day, saved for the visit): the standard (`brand.photo`, `photos.spec`), progress, To shoot / Shot / All, the space and
  the team, then each item in `photos.shoot.items` ("Section|Name"); one shot per view (`#shot/<n>`, Back / Shot N of M / Next shot): what it
  is, the parts of the standard that apply, a note for the team, and each dish twice (three-quarter `photo.src`, the one the site uses;
  overhead `photo.overhead`). An upload keeps a 1920 px web copy on the kit and the full-size original in their Library (`kit_photo_url`
  kind `full`, `branddesk-library/<slug>/photo/`, 40 MB; `kit_photo_done` `full` writes the `ve_branddesk_files` row; only with an
  account); under 3000 px on the long side it says so. A photographer's save changes only photos and never moves a section's state; no
  logo. **Tell the team it is done** (`ve-brand-kit` `shoot_done`) stamps `photos.shoot.done_at` and emails the team. My gigs opens a booked
  shoot's shot list; the sample board has it as Kai's booked gig (`g11`). `ve-bounties` now takes the ops token with `as_member`. Proven
  2026-10-31 on Love Life Cafe with a [TEST] client and the Logan test account (post, second post refused, apply without the trial, trial
  asked, a non-link refused, trial sent, booked, photographer added, onboarding ticked, web copy and original uploaded, a rename and a lock
  from the photographer ignored, the logo refused, done, a stranger refused). Not yet: paying the photographer (Stripe Connect payouts; by
  hand until then) and the client seeing the shoot's progress on their dashboard.
  **The presence-gap ranking and the pitch pages** (built 2026-10-31; migration `20261031_branddesk_pitches.sql`). **Depot > BrandDesk >
  Pitch list** (`#pitches`, `ve-branddesk` `ranking`, `ve_branddesk_ranking(chapter)`): every open food place (Restaurants, Bakeries &
  Cafes, Food Trucks, Vendors, Catering, Meal Prep, Markets; main listings only, no grocery chains, no LESARUSS.ai listings, no current
  client, no closure flag) with a finished full audit (the monthly check-ups), ranked by **gap x worth**: the gap is 100 minus their
  presence (audit score over its maximum), the worth weighs how Vegan (1.0, 0.75, 0.65), Google reviews (on a log scale to 500), rating
  (1.0 from 4.3 down to 0.55) and our members' votes (up to 1.5x) (Logan's defaults, Sean's to change). Sean's **warm list** comes first.
  Filters: chapter, Warm list, Not prepared yet, We have their email, Sent no answer, Answered; each row with presence, Google, their
  biggest gap and the pitch's state. On 2026-10-31 it ranked 225 businesses (South Florida 84, New York 43). **One business**
  (`#pitch/<slug>`, `pitch_admin`, `pitch_save`, `pitch_send`): what we found (presence by area and the fixes their page will show), then
  their name and email (from Business outreach's contact or the listing), the look their home page is shown in (`PITCH_LOOKS`: Fresh
  neighborhood, Island bright, Night lounge, Street heat), Sean's opening in his own words, the warm tick; Prepare their page (a
  `ve_branddesk_pitches` row: a code, their latest full audit), See their page, Copy the link, Send me a test, Send it from me (through
  `email-send`, brand `lesaruss`, from Sean, replies to contact@lesaruss.com, the unsubscribe and postal footer, subject "We looked at
  <business> before reaching out", their own tracked link `/go/bd-<code>`, initiative `branddesk-pitch`; **sending also opens checkout for
  that business**, `branddesk.allowed`), and What happened (sent, opened how often, their answer, the follow-up date), Close or Open it
  again. **Their page** is `/business/pitch?c=<code>` (`business/pitch.html`, guided view, `noindex`; `pitch_view` counts a view unless the
  viewer is a super admin or `&preview=1`): Prepared for you ("We looked at <business> before we reached out", Sean's opening, the tone:
  running a Vegan business is a lot, you don't have to carry all of it), What we found (presence and its four areas, what already works,
  their Google rating), What is holding you back (up to six fixes in plain words), **their home page on our frame as a still** (an iframe
  of `business/site.html?pitch=<code>`, scaled, nothing clickable; `pitch_site` builds a Cartridge from their Directory page: name, logo,
  tagline, description, hours, address, menu items, gallery photos, the chosen look's colors and type; the frame skips Favorites and The
  space when there are no photos), Your first two weeks (`PLAN`), What it costs and Yours to keep, and **the choice** (`pitch_choice`): I'm
  ready (goes to `/business/managed?listing=<slug>`, checkout opened), Let me think about it (a date, required), Talk to someone (an email
  or phone), Not now. Each choice is emailed to the team (reply-to them), confirmed to them, and lands in the **Inbox** (`ve_inbox_items`
  source `branddesk_pitch`, linking to the pitch in the Depot; a contact name starting [TEST] stays out). `/business/pitch?c=sample` is
  Green Leaf Kitchen's, in Preview journeys > BrandDesk with the pitch list and the shot list. The pitch page's words never name BrandDesk. **The same look all the way** (Sean, 2026-10-31: "it feels like it takes me to a completely different environment... keep it in the same
  look and feel"; "let's not lose the visual elements"): the stage wears the business's chapter art, dark (`pitch_view` returns `chapter`;
  `VE_HUBS[].page.banner`), the logo sits centered on the cover with the city under it, the fixes sit beside their site on a phone, the two
  weeks and Yours to keep carry pictures (the sample restaurant's, captioned as such on a real business's page), and the choice is one of
  four picked cards (only the picked one is green; `data-vg-path`). **I'm ready stays on the page**: its path is Your plan, The agreement (the
  full text opens in a window on the page) and Review and pay beside a mock-up of their home page (`#su-plan`, `#su-agree`, `#su-pay`); Pay
  records the choice, then `checkout` with `back` (`/business/pitch?c=<code>`), so Stripe returns to the pitch (`&status=done|cancelled|unpaid#su-pay`).
  Let me think about it, Talk to someone and Not now are their own slides with their forms (`#ch-think`, `#ch-talk`, `#ch-no`). **Not now offers the Vegan Restaurant Guide** (Sean, 2026-10-31: "I don't get... your Vegans Explore page stays yours
  free... maybe we're sharing the vegan restaurant guide with them"): its card (Liz's banner, what is in it, Open the Guide at
  `/guides/vegan-restaurant-guide?from=pitch`, $11 or 1,100 points, the free check open to everyone) sits beside the form, so a
  business that says no can still start on its own (`guideCard` in `business/pitch.html`).
  `/business/managed` stays for direct links. Green Leaf Kitchen's made-up owner is Alex Rivera, said so on the sample.
  **Proven live 2026-10-31** on a [TEST] pitch for On the Run Vegan with the Logan test account: I'm ready recorded and checkout opened for
  it, a live Checkout session opened with the pitch as its way back, Stripe's return for the unpaid session landed on
  `/business/pitch?c=<code>&status=unpaid#su-pay`, and the live page showed the unpaid, cancelled and paid screens on Review and pay; the
  session was expired and every row removed. The paid return's Welcome aboard reads the account only for the signed-in owner (who had to
  sign in to pay); a return in a browser with no sign-up saved goes to The agreement.
  The brand kit's last slide links to it. Then the real store per listing, Launch (check, connect, build with previews,
  domain, SSL, sweep), and a second restaurant in another city.
  **Visit bounties** (built 2026-10-31; migration `20261031_visit_bounties.sql`). A weekly visit to a managed restaurant is a claim gig,
  `ve_bounties.gig_kind` `visit` with `visit_listing_id`, posted from **Depot > BrandDesk > a client > Member visits** (`ve-bounties`
  `visit_get`, `visit_post`, `visit_cancel`; super admins): points a visit (default 150), visits a week (3), an optional perk the restaurant
  offers our members, a note, and Post a new one every week (`repeat_weekly`: when this week's claims close, the hourly `cron` posts next
  week's with the same settings while the client's account is active, waits while it is paused, and stops when it ends; Stop after this week,
  Take it down now). Claims are open 6 days, uploads 2 more (`VISIT_DEFAULTS`, Logan's defaults, Sean's to change). It shows on /bounties
  (More jobs) and the Gig Board (kind Visit) in the restaurant's chapter, for Passport holders. The holder's **visit guide** (`event_details`):
  the address, go as a regular guest and pay for the meal unless there is a perk, the phone shooting guide (three-quarters and overhead, no
  flash, the room, the outside, people only with their yes), and the FTC line (a meal on the house is said so when posted). **I'm here**
  (`visit_here`): the phone's location within 150 m of the listing's pin plus up to 100 m of its accuracy, a fix worse than 500 m refused,
  only the distance kept (`ve_bounty_submissions.visit_at`, `visit_distance_m`, `visit_accuracy_m`). **Submit** needs I'm here, at least 3
  photos, a line on what they had and **Was your meal on the house?** (`visit_comped`), and the license covers the restaurant too. Depot >
  Bounties shows the reviewer the visit and the meal. **Approve** pays the points and copies the photos (images up to 40 MB) into the
  client's Library (`ve_branddesk_files` kind photo, `branddesk-library/<slug>/photo/visit-<date>-...`, `library_at`). Proven 2026-10-31 on
  Love Life Cafe with a [TEST] client and the Logan test account (post, second post refused, claim, submit before I'm here refused, 36 km
  away and a 900 m fix refused, I'm here at 23 m, one photo and no meal answer refused, submitted, approved for 150 points with 3 photos in
  the Library, next week posted by the cron, a non-admin refused), then removed. Not yet: crediting the best photos on the listing and our
  socials, and the scouting list (members whose visits keep being approved, toward Ambassador and the Gig Board).
  **The monthly check-in and report** (built 2026-10-31; migration `20261031_branddesk_checkins.sql`). One `ve_branddesk_checkins` row a
  client a month (RLS on, no policies). Cron `ve-branddesk-checkins` (13:07 UTC daily, `ve-branddesk` `checkin_sweep`, x-cron-secret) opens
  this month's for every active or canceling client that joined before the month began, assigned to the chapter's active Community Manager
  (else the team inbox), and emails them the link; from the 10th, one reminder if it is not sent. **`/business/checkin`** (`business/checkin.html`,
  `noindex`): with no id, the person's check-ins; `?id=<check-in>&step=1..4`, one step per view, Save and next: How the month went (how it was,
  required; busiest and quiet times; what sold best, required; what customers said), What's coming (menu changes, hours and closures, what they
  host), Next month (the campaign from the rotation, required; what they thought of our work; what they need), then **The report**: what the
  month meant and what we do next (both required) beside the report as the owner sees it, Save draft, **Send it to them**. Questions are
  `CHECKIN_STEPS` in `ve-branddesk` (Logan's defaults, Sean's to change). Who: a super admin, the assigned Community Manager or the chapter's
  (`checkinTeam`). Sending freezes the month's numbers (`ve_branddesk_month_numbers(listing, from, to)`: page views, people, what they did next
  by kind, member check-ins, approved member visits, new Library files, against the month before), emails the owner the summary with a link,
  and the report opens on their dashboard: **Managed by us > Monthly reports** (`&bd=reports&r=<id>`, `VEBrandDesk.reportHtml`; the owner reads
  only sent ones). In Depot > BrandDesk a client's Monthly reports has **Open this month's check-in** (`checkin_start`). Actions `checkin_list`,
  `checkin_get`, `checkin_save`, `checkin_send`. The sample business shows last month's made-up report; Preview journeys > BrandDesk has the
  check-in (`?preview=1`) and the report. Proven 2026-10-31 on a [TEST] client (opened by the cron, a wrong secret refused, the reminder once,
  the owner refused before sending and when editing, a missing answer and an off-list choice refused, sent with the numbers frozen, the owner
  reading it and seeing it in their reports, a change after sending refused), then removed. Not yet: Google and social numbers in the report
  (the page says they join as we connect them), and a Community Manager's view of all their accounts beyond the check-in list.
  **The monthly rotation** (built 2026-10-31; migration `20261031_branddesk_rotation.sql`). One campaign a client a month from the **idea
  library** (`CAMPAIGNS` in `ve-branddesk`: influencer night, DJ night, customer appreciation, giveaway, scavenger hunt stop, community night
  with a coaching sheet for the host, and the photo night), each with a **blueprint** (what the restaurant provides, then each step by when:
  4 weeks before ... After) and the same **results** (`RESULT_FIELDS`: how many came, posts, new followers, how sales compared, what worked,
  what to do differently). Rows in `ve_branddesk_campaigns` (one per client, month and kind; RLS on, no policies): status planned, scheduled
  (a date is set), done, skipped; `checks` (the blueprint steps ticked, with when), `results`, `event_id`, `from_checkin`, `assigned_to` (the
  chapter's active Community Manager, else the team). **Sending a check-in plans next month**: the check-in's campaign answer becomes next
  month's campaign, and a **photo night** is added every two months counted from the month they joined (months 2, 4, 6...). **`/business/campaign`**
  (`business/campaign.html`, `noindex`): with no id, the campaigns waiting on the person; `?id=<campaign>&view=plan|blueprint|results`, one
  view at a time: **The plan** (the date and time, a note, **Put it on our calendar**: an approved Vegans Explore `events` row hosted by the
  restaurant, `host_listing_id`, so it shows on `/events` and their page; moved if the date changes), **The blueprint** (tick each step; a
  community night adds the coaching sheet with Print it), **How it went** (the results, then **Mark it done**, refused without a date).
  `?preview=1` is Green Leaf Kitchen's, nothing saved. Who: a super admin, the assigned Community Manager or the chapter's (`checkinTeam`);
  the owner reads their own (no blueprint or note) and never edits. The owner sees them on their dashboard: **Managed by us > Your campaigns**
  (`&bd=campaigns`, coming up and done with how it went; super admins get Add a campaign). **Depot > BrandDesk > Rotation** (`#rotation`,
  `#rotation/<status>`): every client's campaigns by month, newest first, with the client, the campaign, the date (and On the calendar), the
  status, the Community Manager and Open; a table on desktop, one card a campaign on phones. Actions `campaign_library` (public), `campaign_list`
  (super admin every client or one `account_id`; a Community Manager theirs), `campaign_get`, `campaign_create` (super admin, a live client),
  `campaign_save`, `campaign_calendar`. Preview journeys > BrandDesk has the three campaign views, Your campaigns and the rotation board. The
  blueprints, the results fields and the photo night's timing are Logan's defaults, Sean's to change. **Proven live 2026-10-31** on a [TEST]
  client on Love Life Cafe (the Logan test account as the owner, Sean through the admin token): the check-in sent and planned November's
  community night and the due photo night; the date saved (status Date set, an out-of-range step dropped); Put it on our calendar made an
  approved event hosted by the listing; results saved and Mark it done; a negative count and done with no date refused; the owner saw both
  campaigns and the results without the blueprint, and was refused editing and adding; a stranger (the Liz account) was refused reading and
  listing; then every row and the event removed. Deployed from commit b7c8c11 (source sha256 matched). Not yet: a reminder to the Community
  Manager as a step comes due, the owner's choice of campaign on their dashboard, and paying creators for an influencer night.
  **The social add-on, phase 1** (built 2026-10-31; Sean: "Start on the social add-on"; migration `20261031_branddesk_social.sql`). The canon
  locks +$500 a month, two platforms "so customers who stay off Meta still find them", offered in a city once we have the talent; the rest is
  Logan's defaults, Sean's to change: 12 posts a month, the 48-hour OK, the four platforms, at least one off Meta. **Setup** (`ve_branddesk_social`,
  one row a client, RLS on, no policies): two platforms of Instagram, Facebook, TikTok and YouTube, one of them TikTok or YouTube (`PLATFORMS` in
  `ve-branddesk`), their handles (a pasted link becomes the @handle), the **social manager** (an account by the email they sign in with, never
  a Guide account), posts a month, Setting up / Running / Paused (Running needs a manager). Set in **Depot > BrandDesk > a client > Social**.
  **Posts** (`ve_branddesk_social_posts`): when, where (the client's platforms), photo / carousel / video / story, the caption (2,200
  characters) and up to 10 pictures from their Library; Draft, then **sent for the owner's OK** (one email a send), Approved (by the owner, or
  **on its own 48 hours before its date** if they say nothing: `socialApproveDue`, run by the daily `checkin_sweep`, `social_sweep` and every
  read), Change asked (their note, emailed to the manager), Posted (the live link on each platform, checked against that platform's site), or
  Skipped. A change after sending makes it a draft again. Posting is by hand; nothing goes through the platforms' APIs yet. **The team** is a
  super admin, the client's social manager or the chapter's Community Manager (`socialTeam`); the social team may add photos, videos and
  graphics to the client's Library (`accountForFiles`). **`/business/social`** (`business/social.html`, `noindex`): their clients (this month
  against the target, drafts, waiting, change asked, to post), one client's month (`?account=&month=YYYY-MM`, Send N for their OK, New post),
  one post (`&post=<id>|new`: the editor beside their Library, Mark it posted with the links); `?preview=1` is Green Leaf Kitchen's. **The owner**
  sees **Managed by us > Your social** (`&bd=social`, shown only with the add-on): Waiting for your OK (Looks good / Ask for a change), Coming
  up, Posted with its links; every post not yet out whatever the month, and what went out this month. **Social at checkout opens by chapter**
  (`ve_site_settings` `branddesk.social_chapters`, set in Depot > BrandDesk > Who can sign up > Where social is open; super admins always):
  `plan` returns `social_open`, `/business/managed` and the pitch page's sign-up hide the option where it is closed, and `checkout` refuses
  it (`social_not_open`). Every write to the `branddesk` setting now merges (`saveSettings`), since `allow` used to write the whole value
  back. Actions `social_platforms`, `social_chapters`, `social_list`, `social_get`, `social_setup`, `social_post_save`, `social_send`,
  `social_decide`, `social_posted`, `social_skip`, `social_sweep`. Preview journeys > BrandDesk has the planner, a client's month, a post and
  Your social. Deployed from commit 1e65808 (version 15, source sha256 matched). **Proven live 2026-10-31** on a [TEST] client on Love Life
  Cafe (the Logan test account as the owner, Cookbook Tester 1 as the social manager, Sean through the admin token): Meta-only and one platform
  refused, the owner and a stranger refused setup and reading, `social_open` false for the owner and true for a super admin; set up with the
  link and the email's capitals cleaned; three posts drafted, a picture from outside the Library and a platform they do not have refused; sent;
  the post 30 hours away approved on its own, one approved by the owner, an empty change note refused, a change asked, the owner refused
  editing and a stranger refused approving; a TikTok link on Instagram and posting an unapproved post refused, one posted with its link; the
  reworked post back to draft; the manager's list right; the sweep refused a wrong secret; then every row removed (through the one-time
  `ve-once-social-cleanup`, now the 410 stub, as the connector held the delete). **Not yet (phase 2)**: social numbers (followers and reach)
  in the monthly report, paying the social manager (gig work, Stripe Connect), a reminder when a post is due to go out, and posting through
  the platforms' APIs once the Meta tokens are in.
  **The website launch, the real client site** (built 2026-10-31; Sean: "we're going to go ahead with the website launch"; migration
  `20261031_branddesk_websites.sql`). Each client's site is their Cartridge (`ve_cartridges`) on the same frame as `business/site.html`, only the
  brand slots changing. **One shared hosting project serves every client**: Vercel `branddesk-sites` (`prj_fwcoroEU9vkhwbWNChxQf2Bi1JhF`, this repo,
  root directory `branddesk-sites/`, `ve_site_settings` `branddesk.sites` {project, host}). Its build (`branddesk-sites/build.js`) copies the frame in
  and writes Vercel's Build Output: one Node function (`branddesk-sites/server.js`) answers every request by the domain asked for, calling
  `ve-branddesk` `site_public`, and serves each page at its own address (`/`, `/menu`, `/order`, `/about`, `/visit`) with its title, description,
  canonical, share picture, schema.org Restaurant and menu and a plain-text version of the page written on the server, plus `robots.txt` and
  `sitemap.xml` per domain; the frame draws over it (`window.VE_SITE`: `href()` for real addresses, ordering on their own ordering page or a call,
  since the point-of-sale cart is not connected; the sample and pitch stills are unchanged). A push that changes the frame or that folder rebuilds
  it (`commandForIgnoringBuildStep`), so **every client gets the improved frame at once**. Project defaults checked: Vercel made it with login
  protection on every `vercel.app` address (`all_except_custom_domains`), which would have hidden the preview; it is `preview` only now, so
  `branddesk-sites.vercel.app` is public; Node 22. **The steps** (`ve_branddesk_sites`, one per client, and `ve_branddesk_site_events`, every step with
  who and when; RLS on, no policies): **Build their website** (`site_start`, super admin, needs their brand kit; status building) -> **Send it to them for
  their OK** (`site_send`: the owner is emailed the private preview, `https://branddesk-sites.vercel.app/p/<token>/`, always the brand kit as it is now,
  never indexed or cached; review waiting) -> the owner **approves** on their dashboard, typing their name, or **asks for changes**
  (`site_decide`; a super admin can record an OK given another way only with a note saying how). Approving freezes the Cartridge as `published` (a
  version number) and records the name, version and address: **their domain serves only what they approved**, and a later brand kit change goes live
  only after it is sent and approved again (the live site stays up meanwhile). -> **Add their domain** (`site_domain`, super admin, after approval:
  attached to the hosting project through the Vercel API with the server's `VERCEL_TOKEN`; a bare domain also gets www sent to it with a 308; our
  own domains refused; status connecting) with the records they add at their domain company (A `@` and CNAME `www`, or a CNAME for a subdomain, from
  Vercel's own recommendation) -> **Check the domain** (`site_domain_check`: on our hosting, DNS pointed, SSL, which Vercel issues on its own once DNS
  points) -> **Run the final check** (`site_check`: every page over https on their domain with their name, its own canonical address and open to
  search; robots.txt pointing at the sitemap; the sitemap listing every page; http sent to https; www sent to their domain; every picture in the
  approved Cartridge loads). All passing makes it **Live** (`launched_at`), emails the owner and the team, and ticks the new onboarding step **Your
  new website, live on your domain** on its own. `site_status` takes it down for now (a plain page on their domain), puts it back, or ends it (their
  domain comes off our hosting). Their domain is served only while their account is active, paused or ending. **Where**: the client's
  **Managed by us > Your website** (`&bd=website`; the preview, Approve my website with their name, Ask for changes, the domain's state, the final
  check, every step) and **Depot > BrandDesk > a client > Your website** (`#a/<id>/website`: the same view with Build their website, the look, Send it
  for their OK, Record their OK, Add their domain with the records, Check the domain, Run the final check, Take it down, End it); both are
  `VEBrandDesk.mount` view `website`. Preview journeys > BrandDesk has the owner's approval (the sample) and the team's view. **Proven live
  2026-10-31** on a [TEST] client on Love Life Cafe (the Logan test account as the owner, Sean through the admin token): building with no brand kit
  refused, a stranger refused reading it, the kit started from the listing (11 menu sections, the logo), built, the preview served by the hosting
  project (home and menu written on the server with all 51 items, noindex, no-store, robots disallowing, an unknown token 404), approving before it
  was sent refused, sent (the owner emailed), Sean's OK with no note refused, changes asked by the owner, sent again, approved by the owner as
  version 1 with the name recorded, the owner refused adding a domain; the preview and both views rendered in a browser with no errors; then every
  row removed (the connector held the delete, so through the one-time `ve-once-bd-sites`, now the 410 stub). **The domain, proven live the same day** (Sean: "go
  ahead with the domain proof"): a DNS-only CNAME `bd-test-lovelife.lesaruss.com` on Cloudflare, our own domain refused without the test
  flag, then added (typed as `https://BD-TEST-LOVELIFE.lesaruss.com/` and cleaned), verified and pointed at once, SSL issued within a minute, the
  final check 9 of 9 and Live on its own, the owner and team emailed, the onboarding step ticked; a preview path on their domain answers 404.
  **Take it down** shows "This website is not here" within about a minute (`s-maxage=30, stale-while-revalidate=30`; the first proof had 600 and
  served a page 110 s stale), though a page's cached copy can show once more on its first visit after that; the hosting function keeps only working
  sites in memory (30 s), so a site put back up answers at once. Then the domain was taken off (it keeps a taken-down site down), the DNS record and
  every row removed, `ve-once-bd-sites` back to the 410 stub. `ve-branddesk` v19 (commit 434f81a), the hosting project's production build from
  4e0e6d1 (it builds from `main` on its own; the proof's builds were sent from the branch). Not built yet: the point-of-sale cart on a live site, a
  branded preview address, purging Vercel's cache on a takedown, and the client's own Google Search Console.
  **The brand kit is step 1 and their old addresses keep their traffic** (Sean, 2026-11-01: "What about that wizard, the actual brand deck... I
  don't see that part there"; "run a scan of their domains on their previous site... so they don't lose that traffic"; migration
  `20261101_branddesk_old_site_map.sql`). Your website opens with **1. Their brand kit** (each part Locked, In progress or Not started, from
  `data.meta.approvals`; `site_get` `kit.parts`; Open the brand kit), then **2. Their website**. **Their old website's addresses**: at Build their
  website (and at Add their domain if never done) `ve-branddesk` reads their current site (`oldScan`: sitemap.xml, sitemap_index.xml,
  wp-sitemap.xml and the ones robots.txt names, then the home page's links; up to 300 addresses, titles for 60) into
  `ve_branddesk_sites.old_pages` [{path, title, to, how}], each matched to home, menu, order, about or visit by its address, then the title's
  own part (`OLD_RULES`, `oldMatch`; how `same`, `words`, `home` when nothing matched, `team`). The Depot changes any match or adds an address
  the scan missed (`site_old_save`), Read their old site again (`site_old_scan`, refused once live: the old site is gone); `site_old_probe {url}`
  (super admin) reads any site without saving. `site_public` sends live sites `moved`, and `branddesk-sites/server.js` answers each old address
  (and WordPress `/?page_id=`) with a **301** to its new page. The final check adds **Their old addresses** (never read fails it; up to 12 tried
  for the 301). The owner sees the list read-only. Proven 2026-11-01: Love Life Cafe's site read 15 addresses from its sitemap (/drinks,
  /catering, /menu/kids-menu to Menu, /values to About, /accessibility to Home); sobev.com did not open (said so); the server's 301s tested
  against the real handler. `ve-branddesk` v20 and v21 (commits 6f14409, 4e950aa, source sha256 matched). The pitch list's Their biggest gap shows what the check found (`top_fixes[].found`), not the check's goal-worded label.
- **Brand kits and the podcast frame** (built 2026-10-31; Sean: "Vegans Explore has its own branding... we need to have it as part of
  this as well"; migration `20261031_brand_cartridges.sql`). A kit's **frame** decides its parts (`FRAMES` in `ve-brand-kit`, `FRAME_SECS`
  in `business/brand.html`): `restaurant` (unchanged), `brand` (logo, colors, type, voice, story) and `podcast` (cover art, colors, type,
  voice, story, **the cast**, **sound**); the page shows only the frame's slides. **A brand that is not a listing** keeps its kit in
  `ve_brand_cartridges` (by `brand_slug`, super admins only; `kit_get` / `kit_create` / `kit_save` with `brand` instead of `slug`; its saves
  are `ve_cartridge_edits` rows with `brand_slug`), opened at `/business/brand?brand=<slug>`. **Vegans Explore's own kit**
  (`?brand=vegans-explore`): the logo files (`/public/logo-ve-landscape-v1.svg`, `-inverted.svg`, `ve-logo-mark.svg`), the logo's colors
  (forest #2D5C27 on light, bright #3A9B3E on dark and buttons, mint #E8F5E9, orange #F69820, ink #1A1A1A, night #0F1F14; Sean,
  2026-10-31: "the green is the same as our logo") and Montserrat, locked; its voice and story were locked and the kit launched on 2026-11-01 (Sean: "approved"), so a change is a request with a reason. **A listing's kit can
  name a parent** (`data.meta.parent`): a podcast listing's `kit_create` starts the podcast frame with the parent's colors, pairs and type.
  **The Vegans Explore Podcast's kit** (`?listing=vegans-explore-podcast`, parent `vegans-explore`): cover B locked (the night city with a
  broadcast tower, no characters, the title set in Montserrat; `vegan-media/media/podcast/brand/`), the description locked, the cast (Sean
  hosts; Kai, Liz, Dani, Nori and, when the week has their story, Maya, River and Theo), and the sound (intro and outro as MP3s in
  `media/podcast/sound/`, a bed per segment, the commercial bed and airplane effect, the Airport Guide commercial, Kai's tag), each playable;
  cast, sound and voice are drafts. Its stage wears the cover's art without words. **The frame's outputs** are `business/podcast-frame.html`: `?kind=episode` (3000 square,
  the tower art with the episode title in the sky), `youtube` (1920 x 1080, the studio scene, the ON AIR sign beside the title), `story`
  (1080 x 1920) and `carousel` (1080 x 1350), with `&title= &sub= &n= &date= &kicker=`, screenshotted at the kind's size. No characters,
  no words in the art, Montserrat, the logo's colors.
- **LESARUSS.ai business services** (LOCKED by Sean 2026-10-31, canon v6). BrandDesk is the framework for LESARUSS.ai's business
  services too: the same prices on every brand, the $111 Diplomat included while they subscribe, named BrandDesk on every brand and for every kind of business. The promise: a real person does every hard part and the owner only keeps the brand kit
  current. Data across clients predicts what grows a business; every improvement reaches every member. **Photo nights** every two
  months after launch (a buffet-style influencer night, a few dishes shot in a set-aside area), included and part of the rotation; the
  restaurant provides the food, the starter shoot stays. An **idea library** of campaigns clients pick from, each with a blueprint the
  Community Manager follows.
- **Pilot**: the business that asked Sean, plus two in South Florida, at the founding price as case studies. **Later**: a booth package
  through a reseller, our own delivery app.
- **Build order**: Green Leaf Kitchen's site on the template; the make-it-yours switch; Managed by us in `/business` and Have us do it;
  contract, Stripe (setup installments, monthly and Pause), onboarding with the website archive, the Library and the asset sheet; the photographer shot list on the Gig Board (built 2026-10-31); the ranking and pitch
  pages (built 2026-10-31); visit bounties, the monthly check-in and report, and the rotation (built 2026-10-31); the social add-on, phase 1 (built 2026-10-31); the website launch (built 2026-10-31, the
  domain step waiting on its live proof). Then the two handshake builds, social phase 2 and the ad console.

## The demo showroom: Green Leaf Kitchen's site (Sean, 2026-11-08, playbook `ve-demo-showroom`)

"I feel like doing a little bit of extra work to customize it is going to help enroll people." Every demo is deep enough that a business
clicks around and wants in; Green Leaf Kitchen's website (`/business/sample/site`, the frame `business/site.html`, data
`business/sample/cartridge.js`) is first, then the sample group, Kai's Gig Board and the sample pitch. Live on `main` 2026-11-08: the leaf
mark in the header; favorites and News from the kitchen as 3-across rails with votes; a narrated photo video in Our story (Liz, `story-v2.mp4`);
News on About in a window; each dish its own page (`#/menu/<key>`: allergens, nutrition estimate, ingredients and where each comes from in
`menu.ingredients`, real Directory brands linked, made-up farms and makers; a 3-photo row; section breadcrumb); a sample login
(demo@vegansexplore.com / explore11, or the visitor's own Vegans Explore session) with daily votes, Save (Favorite pill) and an As a member /
As the owner switch (the owner edits a dish's ingredients from the Directory's brands); a compact order page with a − n + stepper, Vegans Explore
Delivery coming soon and a tracker; Sign in with Vegans Explore and a Vegans Explore circle in the footer. Frame features read optional Cartridge
keys (`story.video`, `posts`, `menu.ingredients`, item `ing`, `nutrition`, `gallery`, `votes`) and stay off on live client sites
(`window.VE_SITE`), where votes, saves and sign-in need the one-time-code handoff (not built). **BrandDesk pricing relocked the same day**
(canon `canon-ve-front-of-house` v9 `pricing_v9`): BrandDesk Site $500 a quarter, no setup; photos $250, video $250; Managed $500 a month as the
step up; not yet changed in Stripe, `/business/managed`, the pitch page, `/business` or the agreement. **The Community page, built on the sample 2026-11-08** (Sean: points unlock "a coupon or a giveaway... the owner can set
what that is... take it out of the checkout... first come, first serve or limited quantity. The club is essentially just another guide";
canon `canon-ve-front-of-house` v10 `community_page_v10`, migration `20261108_community_page_rewards_cm_fee.sql`): `#/community`, shown only
when the Cartridge has `community.rewards` and never on live client sites. **Rewards**: owner-set items with a points price and a quantity,
first come first served; a signed-in member sees a sample balance (`points_demo`), Unlock gives a code to show at the counter; the owner
sees Take it down and Add a reward with our suggestions (`community.suggestions`); kept in `sessionStorage` (`ve_site_rewards`,
`ve_site_unlocked`, `ve_site_spent`). Never cash, never money off at checkout. **The club** is a Guide on Vegans Explore (no paid club, no
rolling credit). Check-ins every two weeks is unanswered. Live rewards (a table, redemption, the owner's dashboard) are not built.
**The Community Manager onboarding fee on Site is $150 per client** (Sean, 2026-11-08). **The tour is a Guide Overview with V's video** (Sean, 2026-11-08: "a tour button... a similar vibe as our guides... the overview page of the
holiday guide... what's going to be said from V... is going to be in the video section. The rest is going to be on the left-hand side"; it replaced a
slideshow built the same day): `/business/sample/tour` (`business/tour.html`, rewrite in `vercel.json`, `noindex`), copied from `guides/holiday-guide.html`
with its styles, one tab (Overview). Left: Start here, Try it, and the demo's parts as picture pills in four groups (See it as a customer, as a member, as the
owner, Work with us); each opens the sample in the state it needs (`site.html` reads `?as=member|owner` and `?look=<key>`). Right: V (she narrates BrandDesk,
canon-ve-guide-tour-standard v2) in her scene picture (`business/sample/img/v-tour.jpg`), her 2:12 tour video in the frame (`vegan-media/media/business/sample/
v-tour-v1.mp4`, captions `business/sample/v-tour-v1.vtt`; nothing plays until Play; Expand on phones), Play the tour and Talk to our team (`VEManaged`, from
`sample-tour`); a hidden `[data-vepg-talk]` stops `ve-page-guide.js` adding "Talk to Liz", since V is not one of its chat Guides. The sample site's bar has a
green **Take the tour** button. Script and recording notes: `docs/proposals/green-leaf-tour-script.md`. **Sean rejected the video the same day** ("a choppy scroll... I want to see every 3 seconds a different shot"): v1 panned full-page captures; re-cut as `v-tour-v2.mp4` from viewport stills with slow zooms, a new shot about every 3 s, same voice files (canon `canon-video-shot-pace`; handoff `docs/handoff/2026-11-08-ve-demo-showroom-tour-video-redo.md`). Then the owner's BrandDesk view, then the pricing build. Handoff `docs/handoff/2026-11-08-ve-demo-showroom-green-leaf-site.md`. **v3 (Sean, 2026-11-08)**: no zoom, the site whole in a phone frame (and a laptop frame for a few shots, mostly mobile), 25 frames about 5 s each, still frames with 0.4 s crossfades, V's recordings and bed unchanged (`scripts/tour-video/v3/`, lookbook frames `v3-01..25.jpg`); the demo Sample bars collapse to one row (More opens them) and the lookbook Pause holds (live, main ee33c022). The 20 s sample is approved; the full render, `v-tour-v3.mp4` on the tour page (v1 kept), is next. Handoff `docs/handoff/2026-11-08-ve-demo-showroom-tour-v3-sample-approved.md`. **Live 2026-11-08**: `v-tour-v4.mp4` on the tour page (v3 plus a point-of-sale terminal on the counter shot and a steady two-song bed; captions `v-tour-v3.vtt`), and the owner's BrandDesk gained Insights and Your brand kit (`public/ve-branddesk-client.js`). Next: pricing_v9 (handoff `docs/handoff/2026-11-08-ve-demo-showroom-pricing-v9-next.md`).

## Brooke Sellers, our first founding partner (Sean, 2026-11-05, playbook `brooke-sellers`)

Brooke (Meatless Muscle, Vegans Who Lift) is the first and only founding partner at $200 a month, never sold as hosting (never write "hosting" about
her plan where she can see it). Her BrandDesk is the `meatless-muscle` brand kit (`ve_brand_cartridges`, logo, colors, type locked from her Edition 01;
voice and story drafts), the first client desk duplicated from Vegans Explore. Her billing is HQ's client billing link (`client_billing_plans`, live row,
"Vegans Explore Founding Partner", first charge 2026-11-30). We write to her at bsellersotss@gmail.com through Depot > Outreach. **A Guide made for one
person**: `/guides/creator-guide?p=<token>` adds a For <first name> tab (`ve_guide_previews`, `ve_guide_preview(token, guide)`; `viewYou` in
`guide-scripts/creator-guide.js`), merged to `main` 2026-11-06 (7dc75a0, checked live; its "Not shared yet" badge comes off before she gets it). **The Creator Guide is free with the creator survey** (2026-11-06, Sean): `ve_surveys` `creator-guide`, 16 questions, 6 required, 250 points, `ve_guides` door true (migration `20261106_creator_guide_door_survey.sql`, applied); the page wording is live on `main` since 2026-11-06 (merge 687b0c2: Free with the creator survey, the comment fixed for v6, "It makes you a member" only for someone not yet a member). Handoffs: `docs/handoff/2026-11-05-brooke-sellers.md`, `docs/handoff/2026-11-06-brooke-sellers.md`.

**Her BrandDesk, B1 and B2 live (2026-11-08, playbook `brooke-sellers`; handoff `docs/handoff/2026-11-08-brooke-sellers-b1-b2-live.md`).** **B1, client sign-in**
(HQ main 63f04eb): a live row in `branddesk_client_people` (HQ migration 084; Brooke's is the only one) lets a signed-in viewer who is not staff open BrandDesk >
<brand> at the address staff use, `/branddesk/brands/<slug>`; `middleware.ts` Part 6 rewrites it to `app/client-desk/[brand]` (outside the LOCKED shell layout),
sends every other staff page to their desk, and staff APIs answer them 403. Staff open `/client-desk/<slug>` as a labelled read-only preview. Tabs: Get set up (real
state: Done by us, Your turn, We are on it), Brand kit, Clients, and the rest marked Being built; V's lines are text drafts. **B2, Clients** (HQ main af2f2ad,
`lib/coachOs.ts`, `components/branddesk/client/ClientsRoom.tsx`): her Coach OS read live from the `coach_os_*` tables (nothing moved; her old `dashboard.html`
keeps working): tiles, Clients, Check-ins (by date, by client), Purchases, Leads, one client (profile save, log a check-in), one check-in. The client reads and
writes with her own session, so Coach OS's own row rules decide (`coach_os_has_access`; purchases need role admin). Her Gmail was made a Coach OS admin (Sean).
**GoHighLevel is closed** (around 2026-09-05); her intake is only her own website; the daily order pull (cron job 20) is paused. **Prices locked**
(`canon-ve-front-of-house` v14, `hot_labs_v12`): do it yourself $500 a quarter; managed $500 a month plus a $250 setup done on one Hot Lab call; a group Hot Lab
included for every client; a one-on-one Hot Lab $250 ($150 to the Community Manager); managed split $250/$250. Brooke stays at $200 (we absorb $50), her plan gets
no added features, and Sean is her Community Manager for now. Next: new website people join her client list automatically, Show me how pages (video plus steps,
I'm stuck adds it to her next Hot Lab), then B3 Insights. Nothing sent to her; email draft 4fbbd9f4 held.

## Client billing links (Sean, 2026-11-05, playbook `brooke-sellers`)

A monthly subscription for one client on the **LESARUSS** Stripe account, with the card taken now and the first charge on a date we set. Built in HQ
(lesaruss/lesaruss-hq main `ed0d443`): table `client_billing_plans` (migration `068_client_billing.sql`, RLS on, no policies), `lib/clientBilling.ts`, public page
`hq.lesaruss.ai/pay/<token>`. A row is one client, one amount, one `first_charge_at`, `mode` test | live. The page shows what they pay and "Nothing is charged
today. Your first charge is <date>"; the button opens Stripe Checkout with `trial_end` at that date (Stripe words it "Free for N days", which cannot be changed, so
a plain sentence is under the button via `custom_text`). Confirmed on the return from Stripe (the page waits on `session_id`, never shows Add my card to someone who
just paid) and by the LESARUSS.ai webhook (checkout kind `client_billing`). A new client is a new row; there is no staff form yet, so Logan makes the row. Test mode
first, then set the row's `mode` to live. Never write "hosting" where a client reads it. **Not proven live**: a real (live) charge. Proven in test mode with a Stripe
test card (the row went `paid`, subscription and customer saved). The claude.ai Stripe connector shows `connect_incomplete`, so a session cannot see or cancel anything in
Stripe: cancelling a client's old subscription is Sean's. First use: Brooke Sellers, $200 a month from Nov 30, 2026 (her old subscription is on the Vegans Explore account).

- **pricing_v9 built and live, 2026-11-12** (canon `canon-ve-front-of-house` v9 `pricing_v9`, v14 `hot_labs_v12`; canon v15 marks it built).
  Stripe Prices by lookup key, made by the new `prices_ensure` action in the live and test accounts: `bd_site_v9` $500 every 3 months
  (interval month, count 3), `bd_managed_v9` $500 a month, `bd_managed_setup_v9` $250 once, `bd_photos_v9` and `bd_video_v9` $250 once;
  `bd_social_v1` and `bd_pause_v1` stay for Managed, every `bd_*_v1` kept. `ve-branddesk` v23 (commit 598c1b0, source sha256 matched);
  before it, the repo was synced to live v22, which held creator-onboarding code (Brooke Sellers: `CREATOR_STEPS`, `kitFor`, billed
  outside) that was never merged (commit 06130a8). Migration `20261112_branddesk_pricing_v9.sql`: `plan` (managed_v1 | site | managed,
  every older row managed_v1), `addons`, `setup_plan` gains `none`. Checkout takes `{plan, photos, video, social}`; social and pause are
  Managed only. **Owner checkout on v9 waits on `branddesk.terms_v9`** (false): the live agreement (2026-10-31) still names the $1,500
  setup, so until Sean approves the v9 draft (`docs/legal/managed-marketing-agreement-v9-draft.md`) an owner who tries gets "our team
  will reach out" and the team gets an email; super admins can check out. On approval: publish the draft at `business/agreement.html`
  (old text kept beside it), set `AGREEMENT_VERSION` to 2026-11-12, set `terms_v9` true. Pages: `/business/managed` (plan step: Site or
  Managed, photos and video, social on Managed; `?plan=site|managed`), the pitch page's What it costs and in-page sign-up, `/business`
  Managed by us, the sample BrandDesk plan text (`planText` in `ve-branddesk-client.js`, which also shows an account's `plan_line`), and
  Depot > BrandDesk's plan column. The name BrandDesk stays off what owners see (eyebrow "Work with us", Stripe product "Site plan").
  Proof: two [TEST] live Checkout Sessions (Site with photos and video; Managed with photos) read back from Stripe through
  `ve-once-pricing-v9` (both $1,000 due today, intervals right), then expired; rows removed; the once function is the 410 stub. Pages
  checked live at 1440 and 390. The $150 Community Manager onboarding fee on Site is internal and appears nowhere public.

## The LESARUSS.ai shop live (2026-11-13, Logan)
Sean, 2026-11-13: "Vegans Explore advertises, LESARUSS.ai sells" (canon v16 `sales_route_v16`). lesaruss.ai/shop (lesaruss-ai-site) lists
`lr_shop_items` (lesaruss-hq migration 109); `lesaruss-shop` charges the LESARUSS Inc. account (acct ...HzdnUn). Photos, video and press
release buy now; Site, Managed, social and PR outreach take a request until the v9 agreement. /business/managed, the pitch page, /business
and the Business Guide hand off to the shop; the VE `bd_*_v9` Prices are inactive. Photographer jobs live in Fort Lauderdale and
Philadelphia. Handoff `docs/handoff/2026-11-13-lesaruss-shop-live.md`.
