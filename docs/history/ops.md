# History: ops

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## Google costs: a $50 monthly hard stop and standing approval (Sean, 2026-11-04, playbook `ve-spend-budget`)

"I wasn't fully aware of all of this." **The rule now** (Sean, 2026-11-04: "I'm willing to put a $50 budget for Google on that... that's the cap... All I ask for is a report of the
activity, what's been spent, at the end of each week"; canon `canon-ve-spend-budget`). **Google is a hard $50 a month**, counted at list price with no
free tier (the free amounts are unverified; Google's own bill, Cloud Billing > Reports, filter Places API, is the truth). Sean raises the cap when things
move faster (`ve_site_settings` `google_budget` `monthly_cap_usd`). **Standing approval**: Logan runs any Google scan whose quote fits what is left under
the cap, without asking, and reports it weekly; a scan that would cross the cap stops and asks. This replaces the 2026-11-01 rule to ask before any scan of
about 200 calls. **A quote is a ceiling**: a one-time scan is approved with `ve_google_approve('once:<task>', searches, details, note)`, which refuses
(`over_cap`, with what is left) when its list cost is more than the ledger's left, and the scan checks `ve_google_once_room('once:<task>', 'search'|'details')`
before every batch and stops at 0; close it with `ve_google_close`. A batch is counted after it is sent, so a scan can pass its ceiling by at most the one
batch in flight. **The ledger** is `ve_google_ledger()` (cap, spent, regular, approved-not-yet-run, left, every approval; also `ledger` in
`ve_google_report`). **Enforced in the room check** every caller already makes: `ve_google_room` is the smaller of the day's cap and the month's, background
jobs stop at 60% of the month's cap (`background_month_share`) so a person's action and an approved scan keep room, and at the cap everything reads 0.
**Daily caps raised to 120 searches and 100 details** (background 60% of it); an approved one-time scan runs outside the daily cap, as before. Google's own
limit is 500 text searches a day across the project. Migration `20261104_google_hard_cap_ledger.sql`. Proven 2026-11-04 in a rolled-back transaction (no
approval no room; over-cap, bad-name and duplicate approvals refused; room and committed fell with usage; past the cap every room read 0). Month to date
2026-11-04: $14.00 at list, $36.01 left. Not yet: the weekly snapshot and Sunday email, the BrandDesk Costs module, Apify and Higgsfield usage in the ledger
(`ve-spend-budget` steps 2 to 4). The earlier rule's text follows for history.

Google Places bills the Google Cloud account's card monthly past its free monthly amount (Text
Search about $32 per 1,000 past about 5,000 a month; Place Details and PageSpeed have their own). The project's cap is 500 text searches a
day, shared by every job (the backlog check every 2 minutes, the nightly essentials pass, the audits, Add a listing, imports). **Before any
scan of more than about 200 Google calls, give Sean the call count and the estimated cost, and wait for his go.** Schedule big imports right
after the midnight-Pacific reset and split them across nights rather than raising the cap. Sean sees the bill in Google Cloud > Billing >
Reports (filter Places API); a budget alert lives in Billing > Budgets & alerts.
**The meter and caps** (Sean, 2026-11-01: "we need to be monitoring this carefully and setting caps"; migration
`20261101_google_spend_meter.sql`): every Places request from `ve-discover`, `ve-listing-about`, `ve-restaurant-audit` and `ve-venues` is
counted in `ve_google_usage` (day, search | details, job; `ve_google_count`), and each job checks `ve_google_room` before it starts: a
background job (backlog check, essentials, About writer, check-ups) runs only a batch that fits its share of the day's cap and otherwise waits
for tomorrow (so nothing is marked not found for lack of an answer), and what a person starts (Add a listing, the free and full audit, Find on
Google) gets `google_limit` only when the whole cap is used. Caps, the background share, list prices, free monthly amounts and the monthly
budget are `ve_site_settings` `google_budget` (Logan's defaults: 40 searches and 40 place details a day, background 60%, $15 a month).
**Depot > Analytics > Google costs** (`#google`, `ve-analytics` returns `ve_google_report`) shows today against the caps, the month's
requests and estimated cost against the budget, and every day by job. A one-time scan Sean approves runs outside the daily cap but counts
toward the month (`once:<task>`). Other Google services we use (YouTube, Books, Analytics, sign-in, PageSpeed) are free and not metered.

## Domains we own (Sean, 2026-11-09)

"These tend to pop up out of nowhere and we're not ready for the charge." Every domain is a row in `lr_domains` (registrar, expiry,
brand, what it is used for, an idea for it, renew / review / let lapse; RLS on, no policies; HQ migration
`088_domains_catalog_renewals.sql`), from Sean's Namecheap list of 2026-11-08 (50 domains, the list's page size was 50, so check for a
second page). Each has a reminder in HQ's Finance Hub (`finance_actions`, group Domain renewals, due 30 days before it expires; HQ >
Revenue > Deadlines). A new domain is a row in both. Vegans Explore's: vegansexplore.com (expires 2027-01-26) and .org, the city domains
nyvegans, lavegans, cflovegans, ukvegans, soflovegans (no Atlanta, Philadelphia or D.C. domain on the list), prevegans, seasonedvegans,
soflocuisine, humblecabbage, relaxitsvegan, compassiondeck, compassionetarian, vegangameshow, vegnightout, vegantsunami, vhfexpo,
worldveganexpo, veganswholiftacademy and veganswholiftpodcast (Vegans Who Lift ended; the podcast domain expires 2026-12-22, Sean decides).
The ideas in the table are Logan's drafts until Sean picks a use; none points anywhere new yet.
