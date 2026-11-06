# brooke-sellers: playbook opened, billing link live in test mode (2026-11-05)

Playbook slug `brooke-sellers`, brand `meatless-muscle`, owner Logan, status Waiting on Sean. Page: `hq.lesaruss.ai/branddesk/brands/meatless-muscle/playbook/brooke-sellers`
(not yet opened in a browser; the page is a `briefings` row, id `d33b066c-3fcf-4b7f-b1cd-40030b722044`, filled from the active playbook template v3).
Moved out of `ve-feedback` on Sean's word (queue item 2 grew into a project). The Vegans Explore queue is now 8 pending.

## brooke-sellers: what Sean locked (2026-11-05, voice)
- Brooke Sellers (Meatless Muscle, Vegans Who Lift) is the **first and only founding partner** at $200 a month. Not a hosting sale: hosting is a feature, like Go High Level. The value is a subscription with a concierge, at a steep discount because AI does the work, and a doorway to our other services.
- Give her the **Creator Guide tailored to her**, like the Restaurant Guide is tailored to a restaurant: her dashboard, her page's traffic, and what campaigns will mean after January 1. Build it in a **preview** and hold it back to build anticipation. Show her where she is moving to (LESARUSS.ai) but not yet.
- It is the prototype for a **coaching website template**: a community, a book module she can do herself or have the team do, and one login across LESARUSS.ai and Vegans Explore where a change in one shows in the other (a Vegans Explore visitor is never thrown into LESARUSS.ai). The mirror is a bigger build and is parked until the conversation with her.
- Membership by the survey door is enough. No special comp.
- A 20 minute conversation with her, after she is in, to learn what is valuable. Sean runs it; Logan writes the questions.

## brooke-sellers: built and live
- lesaruss-hq `main` `ed0d443` (first `a68a47f`): table `client_billing_plans` (migration `068_client_billing.sql`, applied), `lib/clientBilling.ts`, public page `app/pay/[token]`, confirm on return and by the LESARUSS.ai webhook (kind `client_billing`, `lib/stripeEventRules.ts`). Stripe Checkout subscription on the **LESARUSS** account, `trial_end` at `first_charge_at`, so nothing is charged today. Test mode until a row's `mode` is `live`. Stripe's "Free for N days" label cannot be changed; a plain sentence sits under the button.
- Test row `ae323cda-2d1e-4eab-aaa5-91455c018532` (token `ae45fb07371d46d68a4c2543427feebf32d2e510`): Brooke Sellers, CRM + Web Hosting, 20000 cents, first charge 2026-11-30 17:00Z (noon Eastern), mode test. **Sean paid it with a Stripe test card; the row is `paid`** with subscription and customer saved. Found by Sean and fixed: the page after Stripe showed Add my card again; it now shows Saving your card and updates itself.
- Email to her: a draft row `4fbbd9f4-9c2b-4b3d-b597-d8de794999cd` in `ve_people_outreach` (no recipient, day 2026-11-06, status draft, campaign `brooke-resend`). A test copy went to contact@lesaruss.com. It has two blanks, `[PORTAL LINK]` and `[DATE]`. **Not sent.** Real links are `/go/brooke-profile` and `/go/brooke-creators`.

## brooke-sellers: open
- Sean: cancel her old subscription in Stripe on the Vegans Explore account (CRM + Web Hosting, $200 a month, next charge Nov 30). Logan cannot see Stripe: the claude.ai Stripe connector shows `connect_incomplete`.
- Sean: her email address (not in our records; no `members` row under her name).
- Sean, Logan's defaults to confirm: rename her billing line to **Vegans Explore Founding Partner** (no hosting wording where she can see it); hold $200 through 2027, reviewed Jan 1, 2028, said in writing as a founding rate.
- Then Logan: her live row and link, the email with the real link and Nov 30, a new test copy; nothing goes to her until Sean approves.
- Logan next: the tailored Creator Guide preview, the welcome page after she saves her card (wording to Sean first).

## brooke-sellers: pieces to pull out into their own playbooks
Client billing links (HQ, needs a staff form); the tailored Creator Guide (`ve-ambassadors-talent-shop`); the coaching site template (`branddesk-production-wing`, idea); one login across LESARUSS.ai and Vegans Explore (`lesaruss-ai-front-door`).

## Paste prompt for the new chat
```
brooke-sellers: open Sean's Brooke Sellers project. Open as Logan ("Logan here").
Playbook slug brooke-sellers, brand meatless-muscle, owner Logan, Waiting on Sean. Read it from the database, not memory: project fwbhwfxpncrsfhttimna, table briefings (slug brooke-sellers, brand_slug meatless-muscle), playbook_records (slug brooke-sellers, newest first), and ve_playbook_index. Then read docs/handoff/2026-11-05-brooke-sellers.md in lesaruss/vegansexplore-com (main). Time is Eastern (TZ=America/New_York date). Commit author Sean A. Russell <contact@lesaruss.com>. Name every handoff line "brooke-sellers: <task>". stream_events station 'vegans-explore', status 'completed' | 'in_progress' | 'blocked'.
The project: Brooke Sellers is our first and only founding partner at $200 a month. Not a hosting sale (never write "hosting" where she can see it). We give her the Creator Guide tailored to her, built in a preview and held back, and what we learn from her becomes the coaching site template. The billing link (lesaruss-hq main ed0d443, /pay/<token>, table client_billing_plans) is live and proven in Stripe test mode. Do not send her anything. Do not touch the Blueprint or the theme park guide. The Stripe connector is not connected in sessions, so you cannot see Stripe; you can only use the billing link code and the database.
Open with where it stands and the one next action. Sean's open items are in the playbook (cancel her old Vegans Explore Stripe subscription before Nov 30, her email, the billing line name, the founding rate). Default next build: the preview of her tailored Creator Guide (copy guides/vegan-dairy-guide.html and the Creator Guide; docs/guides/BUILD-A-GUIDE.md; the template gate in CLAUDE.md applies). Bring Sean a recommendation for anything bigger than that.
```

---

# brooke-sellers: second session, 2026-11-05 (her BrandDesk, live billing row, email ready, Creator Guide preview)

## brooke-sellers: what Sean said
- Her old Vegans Explore subscription already expired October 31. Nothing to cancel.
- Use the address we have always written to; do not guess a new one. If she does not open or click, regroup.
- Send it through the People platform (Depot > Outreach), to test how we reach clients.
- Set up a BrandDesk for her as a client from what we have; Vegans Explore is the prototype, its improvements get ported to Meatless Muscle later.
- "Approved, go ahead and build the Creator Guide preview." (Read as approval of the build, not of the email.)

## brooke-sellers: done and checked
- **Her address**: bsellersotss@gmail.com (HQ People: 13 emails through contact@ and srussell@, latest 2026-09-14).
- **Her BrandDesk**: `ve_brand_cartridges` row `meatless-muscle` (frame brand, building; migration `20261105_meatless_muscle_brand_kit.sql`, applied).
  Logo, colors, type locked from her Brand Guidelines Edition 01 (approved by Brooke and her marketing lead 2026-09-23); logo and portrait copied to
  `vegan-media/media/logos/meatless-muscle-*.jpg`; voice and story drafted from her own site words, in progress. Meatless Muscle was already a HQ
  CLIENT_BRANDS entry, so the wall card now opens her desk. Not seen in a browser signed in. Not added: People, Podcast, Social tabs (Vegans Explore
  only; Social needs a Metricool brand).
- **Live billing row** `fb28f444-cf66-45f8-bf80-00fd1744990e` (mode live, "Vegans Explore Founding Partner", $200 a month, first charge 2026-11-30 noon
  Eastern, her email). /pay page checked live. Line name and the $200 founding rate are Logan's defaults until Sean says otherwise.
- **Tracked links**: `brooke-card` (her pay page) and `brooke-books`, beside the existing `brooke-profile` and `brooke-creators`.
- **The email** (`ve_people_outreach` `4fbbd9f4-9c2b-4b3d-b597-d8de794999cd`): to her, every link a `/go/` link, no "hosting" about her plan, date
  filled, still **draft** for 2026-11-06 at 10 AM Eastern. A test copy went through `ve-people-outreach` `test` to contact@lesaruss.com.
- **Her tailored Creator Guide preview** (branch `claude/jolly-tesla-q16c04`, commit cc62d52, **not on main**): `/guides/creator-guide?p=<token>`
  adds a For Brooke tab (her five pages and their numbers since each went up, her Creator Dashboard via the sample walkthrough, After January 1 as Coming,
  Write to us); the $11 box and Get access tab hidden for her; the token leaves the address on load. Data: `ve_guide_previews` and
  `ve_guide_preview(token, guide)` (migration `20261105_guide_previews.sql`, applied; her token is in the table). Template gate: checked at 1440 and
  390 px beside the Creator Guide, same family, no errors. Copy and Kai's line are text drafts.

## brooke-sellers: open
- Sean: approve the email in Depot > Outreach (or tell Logan to).
- Sean: how she opens the rest of the Creator Guide (tips and Pulse stay locked; $11 or 1,100 points; comps are off).
- Sean: review For Brooke, then "merge" and Logan merges the branch to main and confirms it live with her token.
- Sean: line name and the $200 founding rate (defaults stand until he says).
- Logan: after the email goes out, watch opens and clicks (People > Campaigns, `brooke-resend`); the 20-minute conversation questions.
