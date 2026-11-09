# History: partner-programs

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## Ambassadors (Sean, 2026-10-27)

"I want him to be an early ambassador and share it with other people. Let's actually give him an Ambassador account. Once I use
the invite option, it should create an onboarding for Ambassadors. The points amount will be set by me during the invite
process." (Migration `20261027_ambassadors.sql`, run through `ve-once-ambassadors`, now the 410 stub.)

- An **Ambassador** is a Founding Member whose job is to bring people in: `members.ve_role` `ambassador` (the check widened), with
  `founding_member` true. The dashboard calls them Ambassador and puts **Your Ambassador link** first in Your tools.
- **Invite one**: Depot > Invites > New invite, What it is: **An Ambassador** (the default) or **A membership on us**, with the points
  Sean sets (`universe_invites.points_to` `ambassador`). The email asks them to be one of the first Ambassadors; accepting makes
  them an active Founding Member and an Ambassador (never over a staff role) with their points, and opens the onboarding.
  Every comped claim is a Founding Member (`universe_invite_claim`).
- **The Ambassador Guide**, `/ambassadors/welcome` (`ambassadors/welcome.html`; Sean, 2026-10-27: "everything should really be like
  a guide... Create it like the Passport but tailored to someone who has been hand selected to join the community because of their
  contributions to the movement"): the Passport Guide's layout (tabs are the tour, a Guide's picture and words on the right, Back / N
  of M / Next, their points and Copy your link in the header), ten tabs (`#/<tab>`): Overview (You were hand selected), **Why it matters** (Sean, 2026-10-27: "Did it really explain to him why being
  an ambassador matters?... he doesn't need money... He probably just wants to support the community": local places get found
  through member votes and vetting, the city comes alive, the $11 keeps the community running, their voice carries, and points as
  support they can give away; the points are a footnote everywhere, never the pitch; then, the same day, "balance the conversation
  between what we're doing in a lifestyle side of things and what we're doing to provide support for the animals": two halves,
  For the animals (rescues and sanctuaries found in the Community section, the Fosters and Rescues boards, points given to
  organizations, and campaigns behind the cause marked Growing) and For the community; Your role and Who to invite carry the
  animals' people too), Your
  membership (on us, points, level, what points do), Your role, Your city (home chapter, `set_home_community`, its hub, Pulse and
  Events), Your link (`/passport?ref=<referral_code>`, the four steps to the 111 points), Who to invite, What to share (four messages
  with their link), Answering questions (straight answers, do and don't), Your progress (`ve-auth` `referrals`: members and waiting
  accounts who signed up with their link, first name and last initial, and the referral points paid). Old `?step=1..4` links land on
  the matching tab. For Ambassadors and super admins only; the dashboard's tile is The Ambassador Guide. No Higgsfield art or clips. The Overview's tiles wear flat line icons (`ICONS`), never Guide pictures (Sean, 2026-10-27: "I don't like the guide icons... Liz in the
  corner... works well").
- **Community Managers are never volunteers** (Sean, 2026-10-27: "we're for profit and we intend to pay them. More like gig work"):
  the site's words call it gig work, paid as the community grows, never an amount (the Passport's What your $11 supports, the Ambassador
  Guide, the brand tour's slide 6, and since 2026-10-28 the role pages: `/lead`, the account page's Opportunities, the handbook, the
  Community Manager onboarding, the city hub's Opportunities, the recruiting deck, the role rows in `opportunities`, the Guides' facts and
  four saved answers; migration `20261028_cm_gig_work_and_affiliate_canon.sql`, which also took out the account page's "$4,000 a
  month" promise). **Every Passport holder is a Vegan Explorer** (Sean, 2026-10-28: "Vegan Explorers can be the name for our community members in
  general. So everyone is a Vegan Explorer that has a passport"): no longer a role anyone applies for (its city openings are closed);
  `/lead`'s one application is for Community Manager, the account page tells a member they already are one, the Passport Guide
  names it, and the Guides' facts and saved answers say so (migration `20261028_vegan_explorer_is_every_member.sql`). Maya's line on that slide was re-recorded voice only on 2026-10-28 (below).
- **Voices, not animation, for tours** (Sean, 2026-10-28: "we could still have the voices, but the animation I don't think is
  necessary... save the animation for the guides"; a lip-synced clip is about 20 to 25 Higgsfield credits, a voice line none). A brand
  tour slide can be `{audio, poster}`: her voice over the slide's still picture, beside clips on the other slides (`voiceAt` in
  `loadBrandSite`). Oatly's slide 6 is `brand-door/oatly/v6-slide-6.mp3` (el-media `tts`, Maya's voice, levelled to the clips, about
  -13.5 LUFS, a 0.25 s lead-in; checked word for word with `stt`), the old clip kept in `replaced`. New tour lines are voice only;
  a Guide gets at most one animated welcome.
- **The short link and ready-to-send messages** (Sean, 2026-10-28: "make this URL a little bit shorter and easier to read... at the
  very least separate it from the text... So they don't have to make any adjustments on their end"). Every member's link reads
  `vegansexplore.com/r/<referral_code>` (a redirect in `vercel.json` to `/passport?ref=<code>`, where the visit is counted): the
  Ambassador Guide (`link()`), Points and levels (`ve-affiliate` `me`) and the Depot's Ambassador page (`ve-invites` `ambassador`).
  What to share shows each message's words, then **Your link** in its own box, with **Copy message** (the words, a blank line, the
  link) and **Copy link** (`messages()` returns `{title, text, link}`, `messageText`).
- **The Ambassador Guide is in Guides** (Sean, 2026-10-28: "this should show up on their guides, under their guide section. Only
  available to them"): first in the catalog for Ambassadors (and super admins), a green megaphone banner, Ambassadors only, opening
  `/ambassadors/welcome` as its own page (`AMBASSADOR` in `ve-guide-catalog.js`, `render` option `ambassador`), on `/guides` and the
  dashboard's Guides tab, besides its tile in Your tools.
- **Referrals pay when the friend becomes a member** (111 points, `points_earn_rules` `referral_signup`): trigger
  `trg_zz_referral_on_admit` on `members` (insert or `membership_status` turning active) through `award_points_bounty`, once per
  friend; `ve-auth` no longer pays at sign-up, since an unpaid account is not a member. Continue with Google now keeps the `?ref=`
  too (`loginWithGoogle` sends it; `ve-auth` `google` sets `referred_by`).
- **Joshua Mattey** (joshmatteymgl@gmail.com, signed up 2026-10-27 with Google) was made an active Founding Member and Ambassador
  with 1,100 points directly (ledger `comp_membership`, ref `sean-2026-10-27`); Sean tells him on a call. He signs in with Google.
- **The platform comes before the ask** (Sean, 2026-10-28, on Jordi Casamitjana: "their response to me sharing the website is
  going to be how I determine if they're going to be ambassadors"). For someone Sean is weighing as an Ambassador: first we do
  something for them and send the platform on a personal tracked link (`ve_links`, one per person); a plain thank-you means move
  on; real interest means Sean asks them himself, "would you like to be an Ambassador?"; only a yes gets the invitation in Depot >
  Ambassadors. Never make the invitation ahead of that. First case: Jordi, the Huge Vegan Survey as the lead national Daily Pulse
  (2026-10-28), his link `/go/jordi-hvs`, the survey's `/go/huge-vegan-survey` (initiative `huge-vegan-survey`).
- Not decided yet (Sean's call): what an Ambassador earns beyond the referral, and any Ambassador-only perks or levels.
- **Depot > People > Ambassadors** (`/admin/depot/ambassadors`, after Community Managers in the Go to menu; Sean, 2026-10-28: "the
  ambassador program really is invite only... see my current ambassadors... how many people have visited their link... signed up
  underneath them, what level they're on... adjust... invite at level two... see the draft... voice dictate it... see when they've
  read it... accepted it... declined it... copying the link, but it would only be assigned to their email address"; migration
  `20261028_ambassadors_console.sql`). One view at a time: **Ambassadors** (`#list`: totals, then each one's level, points, link
  visitors, signed up, became members; `ve_ambassadors_overview()`), one Ambassador (`#a/<member>`: the numbers, their link, **Their
  level** (By their points, Level 2, Level 3) and **Give points** (spendable, `ve_points_grant` reason `admin_adjust`, ref
  `ambassador:<uuid>:<note>`), visitors by day for 30 days, who signed up with their link, their points), **Invitations**
  (`#invites/<status>`: Not sent yet, Sent, Read, Opened the link, Accepted, Declined, Expired, Canceled), **Invite an Ambassador**
  (`#new`: name, email, the level they start at, points, and a note typed or spoken, Speak using the browser's speech recognition)
  and one invitation (`#invite/<id>`: Made, Sent, Read, Opened the link, Accepted or Declined with their note; the draft is editable
  until accepted, `ve-invites` `update`; the email as it goes; Send it from me, Copy the link, Cancel it). All through `ve-invites`
  (`ambassadors`, `ambassador`, `ambassador_save`), super admin only.
  - **Levels set by the team**: `members.level_override` (1 to 4) is the least they have; `ve_member_level` returns the higher of it
    and what lifetime points earn (`set_by_team`, `earned_level`), and the dashboard's `veLevelFor(lifetime, member.level_override)`
    agrees (`ve-auth` `me` returns it). An invitation's `level` sets it at the claim.
  - **Read** is the email opened: `send` keeps the email's provider id (`universe_invites.resend_email_id`) and `list` / `ambassadors`
    copy its first `email.opened` from `email_events` into `email_opened_at`. A copied link has no Read; Opened the link is `/invite` seen.
  - **One email only**: `universe_invite_claim` returns `wrong_email` unless the account's email is the invitation's, so a copied link
    works for that person alone; the email names the address and `/invite` shows it masked (`email_hint`) and signs a different
    account out. **No thanks** on `/invite` (`ve-invites` `decline`, with an optional note) closes it as Declined (status `declined`,
    `declined_at`, `decline_note`; the Invites page has the tab too).
  - **Link visits**: `/passport?ref=<code>` (any page with `?ref=`) calls `ve_referral_visit(code, visitor)` once a visit
    (`refVisit` in `public/ve-auth.js`; the visitor is a random id in the browser, `localStorage` `ve_visitor`), one row per visitor a
    day in `ve_referral_visits`. Counting started 2026-10-28.
  - **Profiles** (Sean, 2026-10-28: "I should be able to check the type of person they are... she might not be as moved about the
    animal side of things... lean more on the building community, helping local businesses, supporting nonprofits that support the vegan
    mission, and... an extra income opportunity... create different profiles"; migration `20261028_ambassador_profiles.sql`): Balanced (none),
    **Animals first** (`animals`), **Community builder** (`community`), **Creator** (`creator`), **Health and fitness** (`fitness`), picked on
    the invitation (`universe_invites.profile`, the claim copies it to `members.ambassador_profile`) and changeable on the Ambassador's page
    (`ambassador_save` `profile`). It words the email's "why you" paragraph (`ambassadorWhy` in `ve-invites`), the `/invite` page's opening
    (`WHY`), the Ambassador Guide's Overview reason, Why it matters (`PROFILES` and `BLOCKS` in `ambassadors/welcome.html`: each profile's blocks
    in its order: animals, community, business, nonprofits, income, creator, fitness), Liz's and Dani's lines there, the first ready-to-share
    message, and the dashboard tile's line (`AMB_LINE`). The facts and terms are the same in every profile. A super admin previews one with
    `/ambassadors/welcome?profile=<key>` (See their Guide). From Level 2 every ready-to-share message says "I earn a little when you join with
    my link" (the FTC rule). The invitation email spaces every paragraph inline and bolds the Ambassador ask, the membership on us, the
    points and the level (Sean, 2026-10-28).
  - **Depot > Preview journeys > Ambassador** (Sean, 2026-10-28: "I would like to see every step from top to bottom for ambassadors... without
    me having to sign up and register"), with a Profile picker: You invite them (`#new`), The email they get (`#sample/<profile>`, `ve-invites`
    `sample`: `emailFor` on a sample person, never saved), their invitation page, another email, No thanks and You're in (`/invite?preview=
    open|wrong|declined|done&profile=`, a sample invitation, Accept turned off), the Ambassador Guide's ten tabs (`?profile=`, as your own
    account), Points and levels, the dashboard and the Depot's Ambassadors list. A new screen gets a step in `JOURNEYS.amb`.
  - A member can be invited to be an Ambassador (only Already an Ambassador is left out); other invitation kinds still leave paid
    members out. A personal note is up to 2,000 characters, a blank line a new paragraph.

## Founding Member invitations (Sean, 2026-10-28)

"Reference the people that we have listed, for me to maybe eyeball a few people that will be good candidates to be the first members
of our community... watch if they click it, if they don't, if they decline, if they don't respond... instead of it just being a bulk
email blast"; then "go ahead with the $11 founding member invites" (migration `20261028_founding_member_invites.sql`). **Depot > People >
Founding Members** (`/admin/depot/founding`, after Ambassadors in the Go to menu; super admins), the Ambassadors console's layout, one
view at a time: **Invitations** (`#list/<status>`: totals Invited, Read it, Opened the link, Said yes, Joined, Declined; tabs Ready for a
follow-up, Not sent yet, Sent, **No reply yet** (sent by email 7 days ago, never read), Read, Opened the link, **Said yes, not paid**,
Joined, Declined, Expired, Canceled), **Pick people** (`#pick`, `ve_founding_candidates(q, pool, limit, offset)`: HQ > People with an email
and accounts that never paid, leaving out members, anyone with an invitation already (but canceled or expired), the do-not-contact list,
the unsubscribed, quarantined, archived and merged; each tagged where we know them from: Suggested for Vegans Explore
(`people.recommended_brand`), On our shows (their name is a People listing), Signed up never paid, Emailed with you, SoFlo Vegans,
Mailing list, Other lists; suggested and guests first, then most emails with Sean; search, tick, kept for the visit in `sessionStorage`
`ve_founding_picked`), **Write to them** (`#new`: one card per person picked, with what HQ already knows about them, **On us** (free, 1,100 points) and
**What you know about them**, typed or spoken; Sean, 2026-10-28: "I don't want to focus on the structuring of the sentence. I can let you
know a little bit about that person... something positive that only I would know"; no note shared by everyone. **Write their invitations**
makes the drafts, then `ve-invites` `draft_note` writes each one's personal opening (`reason`) in Sean's voice from his notes
(`universe_invites.context`, migration `20261028_founding_invite_context.sql`) and the person's HQ > People record, one at a time with
progress: Claude Opus 5.5, effort medium, 2 to 4 sentences, his notes first, nothing invented (no feelings, favorites or superlatives he did
not say), nothing private from the summary, no description of Vegans Explore since the email says that next; about 7 s a person. Nothing
sent) and one invitation (`#invite/<id>`: Made, Sent, Read, Opened the link, Said yes, Paid the $11 and joined, or Declined with their
note; the draft: What you told me about them (Speak), **Write it again**, and **Their opening**, any word changeable; the email as it goes, Send it from me, Copy the link, Cancel it; **Follow up**: one short note from Sean worded for where they
stopped, at most 2, 5 days apart, each keeping the link open 14 more days, `ve-invites` `nudge` / `nudge_preview`). An invitation is
`universe_invites.points_to` `founding` (`pool` records where they came from): the email asks them to be one of the first Founding Members at
$11, one time, with 1,100 points; accepting on `/invite` is **Said yes** (`status` `accepted`, `accepted_at`; `universe_invite_claim` returns
`accepted`) and the page goes straight to the $11 checkout (`ve-entry-checkout`, back to `/invite?c=<code>&paid=1`, which waits for the payment
and says Welcome, Founding Member); a return visit says One step left with Finish joining. Paying any way (trigger
`trg_ve_founding_invite_paid` on `members`, the account turning active) makes it **Joined** and sets `founding_member`. One on us claims like
any comped invitation. `ve-invites` `founding`, `founding_candidates`, `nudge`, `nudge_preview`; `create` takes `points_to: 'founding'`
(comp only when ticked) and `pool`. Proven 2026-10-28 with an internal unpaid account (draft, copied link, opened, said yes, the test-mode
checkout opened, a payment inside a rolled-back transaction turned it Joined), then removed.

## Nonprofit Partners (LOCKED by Sean 2026-10-29, playbook `ve-nonprofit-partners`)

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-nonprofit-partners`). **The organization is the
partner** (its Directory listing: Nonprofits, Rescues or Sanctuaries), never a person: its own link (separate from the lead's), a
flat 20% of the $11 Passport and Guides bought through it (the opportunity's rate, not a member level), points it holds for our
services (Sean sets the amount on the invitation; members can give it more), a marketing kit (ready-to-post messages, a website button
and banner, an email blurb), a Nonprofit Partner badge and its own Guide on the Ambassador Guide's pattern. If the lead changes,
everything stays with the organization. Paid to the organization after its W-9 at $25 (the affiliate defaults), worded as referral
earnings, never a donation or tax-deductible. **The lead on the account** (Sean, 2026-10-29: "it doesn't impact the person's
individual status. They just happen to be the person assigned as the lead") gets a complimentary Founding Membership when the
organization says yes and keeps their own standing (Level 1, their own link and points). Invitation only, from Depot > People >
Founding Members (Founding Member, Ambassador or Nonprofit Partner). First: Susan Hargreaves, Animal Hero Kids (`be-an-animal-hero`), at animalherokidsrock@gmail.com (Sean, 2026-10-29: the address he uses, the
most reliable; HQ holds three others for her).

**Built 2026-10-29** (Sean: "go"; migrations `20261029_nonprofit_partners.sql`, `20261029_nonprofit_partner_code_words.sql`; edge function
`ve-nonprofit`). `ve_nonprofit_partners` (one row per organization: `listing_id`, `lead_member_id`, `code`, `rate_pct` 20, `products`
passport and guide, `points`, `status` active | paused | ended) and `ve_nonprofit_partner_points` (the organization's points, through
`ve_partner_points_grant`). Its link is `/r/<code>` (`ve_partner_code`: the name in capitals, whole words, BE-AN-ANIMAL-HERO); `ve-auth`
sets `members.referred_by_partner` when a sign-up's `?ref=` is an organization's (`partnerFromCode`), `ve_referral_visit` counts its
visits, and `ve_affiliate_earn` writes its commissions (`ve_affiliate_commissions.partner_id`, route `partner`, no `affiliate_id`, the
partnership's rate), shown in Depot > Ambassadors > Commissions under the organization's name and marked paid there. The invitation is
`universe_invites.points_to` `nonprofit` with `listing_id` (a Nonprofits, Rescues or Sanctuaries listing, not already a partner; members
can be invited): **Founding Members > Write to them** has **Invite as** for each person (Founding Member, Ambassador, Their organization as a
Nonprofit Partner, with the organization picked from the Directory and its points; Ambassadors get a level and points), and the
Founding Members list shows all three kinds (`founding` returns Nonprofit Partner invitations and Ambassadors picked there, `pool` set).
The email, `/invite`, the opening writer and the follow-up are worded for an organization. Accepting (`universe_invite_claim`) joins the
invitation, comps the lead (a Founding Membership and 1,100 points, only if they were not a member) and runs
`ve_nonprofit_partner_start` (the partner, its code, the invitation's points as the organization's, the listing tag
`ve-nonprofit-partner`, which draws the **Nonprofit Partner** badge on the listing page and the Directory card, `partnerTag`). The lead's
**Nonprofit Partner Guide** is `/nonprofits/welcome` (the Ambassador Guide's layout; Overview, Why it matters, Your link, Your kit (four
messages, a website button and a banner as HTML to copy), Your numbers, Where the money goes, Your points (Ask to use our points:
`ve-nonprofit` `use_points`, a `ve_initiative_interest` row, initiative `nonprofit-partners`, and an email to Sean), Your account; super
admins preview one with `?partner=<id>`). **Depot > People > Nonprofit Partners** (`/admin/depot/nonprofit-partners`, after Founding
Members): every partner with its numbers and the open invitations, and one partner (`#p/<id>`): its link, status (Paused or Ended takes the
badge off and stops its link earning), rate, code, a new lead by account email, team note, Give points, who joined and its earnings.
`/policies#membership` has Nonprofit Partners; the Guides' facts and a saved answer (Can my nonprofit partner with Vegans Explore?) say
it. Proven 2026-10-29 end to end with a [TEST] organization and the internal QA account (the invitation and its email and opening, the
accept, the partnership with its points and badge, a visit and a sign-up through its link, a Passport paying $2.20 to the organization
once, the lead's own earnings and Level 1 untouched, pause and resume, points, the Guide, the badge, the picker), then removed. The same
day `ve-affiliate` `orgs` was fixed: it asked for `city` and `state`, which listings does not have, so the organization search (also
Points and levels' Where it goes picker) had always come back empty.

**The Nonprofit Guide** (LOCKED by Sean 2026-10-29, playbook `ve-nonprofit-guide`, canon `canon-ve-nonprofit-guide`; launched
2026-10-29, below). The Dairy Guide's layout for people who run Vegan nonprofits, rescues and sanctuaries, built from Sean's Canva **Vegan Nonprofit
Survival Guide** (design `DAGx8V9AvKE`): the 10 tips one per view (Tip 1 free), the Pulse (Vegans Explore Podcast 111 and 123 to 127,
the nonprofit leaders on our shows, played in place), the Directory's Nonprofits, Rescues and Sanctuaries, Get found, Business
partners, Events, a peer-to-peer kit, burnout and support, My list, and **Become a Nonprofit Partner** at the end. $11 or 1,100
points, included for Nonprofit Partner leads; Dani narrates; it replaces the Coming soon card. Susan Hargreaves is invited only
once it is live.
**Built 2026-10-29, not launched** (Sean: "hand it to Logan"; migration `20261029_nonprofit_guide.sql`). `guides/nonprofit-guide.html`
and `guide-scripts/nonprofit-guide.js`, the Restaurant Guide's shell (`noindex`, Dani on the right, her lines as text drafts for Sean,
no clips), ten tabs (`#/<tab>`): Overview, **The 10 tips** (`#/tips/<id>`: the Canva lesson word for word where it holds, its case or
pro tip, a This week checklist kept in the browser (`ng_checks`), On Vegans Explore, and the episode behind it; story is free), **Pulse**
(Our nonprofit series: Vegans Explore Podcast 111 and 123 to 127; Nonprofit leaders: Susan Hargreaves, Ingrid Newkirk, Rachel Black,
Rowdy Girl, the Florida sanctuaries, Kudo, Jordan David, Jane Velez-Mitchell, Compassion in Action, Liz Jones, Honey LaBronx; `PULSE_PICKS`
with each feed guid, played in a docked player), **Directory** (Nonprofits, Rescues and Sanctuaries with the Directory's card, a chapter
picker, `localStorage` `ng_chapter`; a listing opens framed in the Guide), **Get found**, **Businesses** (Food Brands and the chapter's
100% Vegan restaurants, and the pitch to copy), **Events** (our calendar, Promote your event, vendors; and the Peer-to-peer kit: World
Vegan Day, Giving Tuesday, Earth Day), **Support** (the three weaknesses from episode 123, Share the load from 126, where to find help),
**Become a Partner** (the partnership, and **Tell us about your organization**: `ve-nonprofit` `survey` / `survey_get`, one row per
member in `ve_nonprofit_surveys`, 100 points once, reason `nonprofit_survey`, ref `np-survey:<member>`, emailed to Sean, active members
only; `SURVEY_POINTS` is Logan's default), My list (saves through `ve-cookbook`: tips as kind `fix`, `episode`, `listing`) and Get
access. Tips 2 to 10, the kit, the pitch and the support plan are `ve_guides.content_html` (`<script id="ng-data">`, no public read),
written from the session, never in the repo; the page holds the intro, the titles and tip 1 (`#ng-public`). The `ve_guides` row
`nonprofit-guide` is published ($11 or 1,100 points) so it sells and opens; `ve_nonprofit_partner_start` gives the lead the Guide
(`ve_guide_purchases` `paid_with` `nonprofit_partner`) and Sean holds a comp copy to review it. Banner `public/guides/nonprofit-guide.jpg`
(Dani seated in her chair holding a rescued rabbit, the locked banner style). Two of the Canva doc's claims were corrected against their
sources: Facebook's birthday fundraisers had raised more than $1 billion by 2019 (not "billions"), and the Mercy For Animals and VegFund
examples say only what their own pages show. **Launched 2026-10-29** (Sean: "good as a V1... launch it"; migration
`20261029_nonprofit_guide_launch.sql`): indexed, its card sixth in the Guide catalog (label Nonprofits, replacing the Coming soon
card; `ve-guide-catalog.js`), in the sitemap. Susan Hargreaves' invitation can go out now. Dani's lines are still text drafts.

## Group Partners (LOCKED by Sean 2026-10-29, playbook `ve-group-partners`)

Concept session with V, locked by Sean: "lock it, go with your defaults" (canon `canon-ve-group-partners`; migration
`20261029_group_partners_canon.sql`). **Not built yet.** A community group (Community > Groups) hosts its community and events on
Vegans Explore and brings us members; the group is the partner, its organizer the lead, comped a Founding Membership with their own
standing unchanged. The group gets a community page (members, events, board), its events and history on its page and the calendar, our
ads, featured status, preferential bounties, and anyone anywhere can join it. **Commission** on Passports and Guides bought through its
link, by lifetime members brought in: 20%, then 25% at 25, 30% at 75, 35% at 150, 40% at 300, 45% at 600, 50% at 1,000 (the cap), from
the day reached, never back-paid. **Tickets**: our fee 5% of a paid ticket (free events free, card processing passed to the buyer, the
group may pass our fee on too), the rest to the group (2026 market: Eventbrite 3.7% + $1.79 plus processing, Luma 5%, Posh 10% + $0.99,
Partiful reportedly about 10% + $2). **Guest pass**: a non-member comes to one free event; from the second they join with the $11
Passport; paid-ticket events need the Passport from the start. **Exclusivity is earned into**: hosting exclusively here and sharing the
link unlocks the ladder, featured status, our ads and bounties; every group stays listed regardless. Payouts after a W-9 (the
organizer's when the group has no entity) at $25, 30-day hold, worded as referral earnings. Named Group Partners, never Community
Partner. Prototype: the Vegan Social Club (South Florida), then Philly Vegan Social Club; our own communities use the same structure
later. To build: Stripe Connect for ticket money, the group community page, the policy text and the Guides' facts. Not decided: whether
counts reset, what featured placement and ad support include. The dashboard's Host your group on Vegans Explore card collects interest until then.

**Tickets, guest passes and check-in, live 2026-10-29** (Sean: "Move forward"; migration `20261029_group_tickets.sql`, applied through
the one-time `ve-once-group-tickets`, now off; `ve-group`; `public/ve-events.js` `drawSale`; the dashboard's Events views in
`ve-partner-dashboard.js`). Only on an approved event hosted by a Groups listing whose Group Partnership is onboarding or active
(`saleOf`). **Ticket types** (`ve_ticket_types`, up to six an event, $1 to $1,000, an optional limit, `pass_fee`; a type's price is
fixed once one sells), set by the lead, the owner or a super admin (`ticket_type_save`). **Buying** is for active Passport holders only
(`ticket_checkout`, up to 10 an order, `ticket_max_per_order`): the buyer pays the tickets, our 5% only when the group passes it on, and
card processing (2.9% + 30 cents, grossed up so it is covered: a $20 ticket is $20.91, or $21.94 with the fee passed on); the money
lands on the Vegans Explore Stripe account (no Connect yet). The return trip and ve-stripe-webhook (`metadata.type` `ve_ticket`,
`confirm_fn` `ve-group`) run `ve_ticket_order_paid` once: an 8-character door code per ticket (`ve_tickets`, no 0, O, 1, I or L),
emailed, the buyer going and in the group (`via` event), and the group's share as a commission row (product `ticket`, route `group`,
held 30 days like every commission; `ve_ticket_orders.group_cents`). **Guest pass** (`guest_pass`, `ve_guest_passes`): a free event
(no ticket types) and someone without a Passport, one pass a person ever at any group (unique on the email), its code emailed;
someone who came on one and later joins counts toward the group's rate (`trg_ve_guest_pass_ref` sets `referred_by_group`).
**The door** (`checkin`, `undo`): a ticket or guest pass by its code, once; a refunded code says so. **Refunds** (Sean, 2026-10-29):
the group writes its own policy (`events.refund_policy`, shown at checkout and in the ticket email); a refund (`ticket_refund`, the
organizer) gives back what the tickets cost, our 5% included, never card processing, through Stripe first, then
`ve_ticket_order_refunded` voids the codes, puts the count back, cancels the RSVP and reverses the group's commission (a negative row
if it was already paid out). `ve_group_dash` shows each event's price, tickets sold, going and guest passes, ticket earnings and our fee.
Proven 2026-10-29 on a [TEST] group with internal accounts: guards (non-organizer, unpaid account, 11 tickets, a guest pass at a paid event
or for a Passport holder's email, a second pass at another group event), a test-mode checkout ($41.51 for two $20 tickets) and its
unpaid return refused, paid twice in a rolled-back transaction (once only, wrong session refused), then a real Stripe test payment
marked paid, the door, the dashboard, and a Stripe test refund of $40.00 with $1.51 kept; then removed. The Stripe card form itself
was not paid (checkout.stripe.com and api.stripe.com are blocked from the build session; the test payment went through pg_net).
**Seats are held at checkout** (migration `20261029_group_tickets_holds_policy.sql`): an open checkout counts against a type's limit
for 35 minutes (Stripe expires it at 30); `ve_ticket_order_open` locks the type's row, counts what is left and writes the order in one
step, and `ve_ticket_left` gives the page the same count. A stale pending order is never canceled, so a late payment still confirms.
The same migration put tickets, the guest pass and Group Partners in the Guides' facts and three saved answers, and `/policies` has
**Group Partners** and **Event tickets** under Membership and the guest pass and door list under Privacy.
**No invitations yet** (Sean, 2026-10-29: "we're not going to send to anybody just yet... I just need to make sure I get my hands on
everything once it's locked in. I'm selectively sending it out"): no Group Partner invitation goes out until Sean has reviewed the
program and picks who gets one; keep building so every piece is ready.

**The sample group, the Guide and the console** (Sean, 2026-10-29: "Let's not bank on Vegan Social Club... I want us to create our
own mock club so people can go through it... the same way we did the business... a general username and password... in the depot...
a groups one, where I could... personalize the message, select people... do a crawl for all these community groups... send them
messages one by one... it lays out pretty much as a guide... they can click on what it would be like from a user perspective... from
the owner's perspective").
- **`/groups/sample`** is Sprout Social Society, an invented group (never a database row, marked Sample, `noindex`): the real listing page
  (`directory/listing.html`, rewrite in `vercel.json`) in demo mode (`demoSrc`), fed `/groups/sample/listing-demo.js` (`VE_DEMO.group`).
  Its bar switches **A member** / **The organizer**. Its logo (Sean picked option A from a look book, 2026-10-29) and photos are in
  `groups/sample/img/`, the photos realistic, as a real group would post them (never our illustrated Guides). Tabs (Sean, 2026-10-29):
  Overview, **Board** (the Message Board: posts with replies, the organizer's pinned welcome, `VE_DEMO.board`) and **Media** (the Photo
  Gallery: one album per past event, Halloween Costume Potluck and Sunday Brunch in the Park, five photos each, `VE_DEMO.galleries`;
  `?tab=media&album=<id>`, Media > event, each photo in the page's lightbox; `groupDemoTabs` in `directory/listing.html`). The brunch
  is at George English Park, on the Intracoastal, to match its photos. **Announcements** (Sean, 2026-10-29: "send messages to their members and have it appear
  on the overview page below About"): the organizer's dashboard has an Announcements view (`drawAnnounce` in `ve-partner-dashboard.js`,
  `?tab=brand&pd=announce`, New announcement: title, message up to 1,000 characters, Also email it to your members, Pin it to the top),
  sent through `group_announce`; the Overview shows the newest three under About, one pinned first (`gdAnnRender`). The sample answers
  `group_announce` itself and keeps what is sent for the visit (`sessionStorage` `ve_group_ann`); a live group's version (a table, the
  email through us, the page section for real listings) is part of the Group Partners build.
- **Groups, live** (Sean, 2026-10-29: "build the live announcements for real groups"; migration `20261029_group_live.sql`, run through the
  one-time `ve-once-group-live`; edge function `ve-group`, verify_jwt off, the member token checked inside, ops by the admin token with
  `as_member`). **Joining**: every Groups listing's sidebar has a Join card (`loadGroupLive` in `directory/listing.html`): Passport holders
  join (`ve_group_members`), with an **unticked** "Email me <group>'s announcements" (`email_ok`), and leave or change it there; signed out it
  is the members-only window (`VEVotes.memberPrompt('group')`). **Announcements** (`ve_group_announcements`): the listing's owner, the
  Group Partner lead or a super admin writes them on the dashboard's Announcements (any group's dashboard, `drawAnnounce`); the newest three
  show under About, a pinned one first; ticked, they go by email from Vegans Explore with the group's name to the members who said yes
  (`ve_group_announcement_deliveries`, replies to us), at most 2 emails in 7 days and 5 posts a day (`ve_site_settings`
  `group_partner_program`). The email's link is `/messages#g/<token>`: Stop these emails, Leave the group, Report this (a report pauses the
  group's emails, `ve_group_mail_holds`, and emails Sean; delete its row to resume). **Group Partner earnings**: a partnership gets its code at
  onboarding (`ve_group_partners.code`, `/r/<code>`, `trg_ve_group_partner_code`); `ve-auth` sets `members.referred_by_group` for a sign-up
  through it; `ve_affiliate_earn` pays the group the ladder's rate on the day (`ve_group_rate`: lifetime members brought in, 20% to 50%),
  rows with `group_partner_id`, route `group`, held 30 days like every commission. The dashboard's Group Partner views read the real numbers
  (`ve_group_dash`). **Gift a membership** (Sean, same day: "It would cost whatever our half of the $11 would be based on where they are in
  the commission split... deducted from their payout... an invite link to a specific address"): the lead's dashboard view `gift`
  (`drawGift`): our share of the $11 at the group's rate today ($8.80 at 20%, $5.50 at 50%), taken from the group's earnings at once as a
  negative commission row (product `gift`, ref `gift:<invite>`). **Only cleared earnings count** (Sean, same day: "that balance will only
  count after the 30-day period... If they're in a negative, they should get a prompt to purchase the membership"; migration
  `20261029_group_gift_cleared_balance.sql`): `ve_group_balance` is commissions past their 30-day hold (`ready`), not paid out, less gifts,
  so a gift never takes it below zero (`gift_credit_cents` 0). Short of it, the dashboard says what is on hold and when the next of it
  clears, and offers **Pay $X by card**, the same price (`ve-group` `gift_checkout`, Stripe; `GET ?confirm=` from the return trip and
  ve-stripe-webhook makes the gift once, `universe_invites.paid_session` and `paid_cents`; no commission row). A card gift that expires, is
  canceled or declined goes to the group's balance (a `ready` row, ref `gift-back:<invite>`) for its next gift, never a card refund (Sean,
  2026-10-29: "keep it going to the balance, no refund"). Gift rows are settled with the group's payout in Depot > Ambassadors > Commissions (mark them paid with it). A `universe_invites` row (`points_to` `gift`, the group's `listing_id`, 1,100 points, 30 days, one email), emailed from
  Vegans Explore with the organizer's name or a link they copy; `/invite` words it as their gift. Accepting makes them a Founding Member, one
  the group brought in (it counts toward the rate) and a member of the group (`trg_ve_group_gift_status`); expired (nightly
  `ve-group-gift-sweep`), canceled or declined gives the cost back (the row turns `reversed`). Not for a member who already has a Passport.
  Proven 2026-10-29 on a [TEST] group with internal accounts (join, the organizer-only post, a real email, the email link, gift pricing,
  balance, cancel giving back, the claim, a commission at 20%), then removed. The cleared rule the same way: held money refused with the card
offer, a test-mode checkout opened, an unpaid return sent back, a gift from cleared money, a card gift's cancel crediting the balance and a
second confirm of one session refused (the card form itself was not paid: checkout.stripe.com is blocked from the build session). The real dashboard's views were checked in the sample, which
  draws the same code. A member's side: About, the Events tabs from the demo file (6 upcoming, 16 past), a **Group Partner** card with its members and **Join the group**, and every RSVP, ticket and join as a simulation
  window (`demoEvent`, `demoJoinGroup`; See it as Someone new or A Passport holder: the guest pass on a first free event, the $11
  Passport after it or for a paid event, the ticket with card processing on the buyer). The organizer's side opens with the **demo
  sign-in** (`VE_DEMO.login`: demo@vegansexplore.com / explore11, `groupDemoLogin`, kept for the visit in `sessionStorage`
  `ve_group_demo`; it is not an account, so nothing it does can touch live data) and is the real business dashboard with the Group
  Partner views (`ve-partner-dashboard.js`, shown when the server sends `D.group`): **Your members** (members, joined through you, guest
  passes and how many joined after, the rate ladder with progress, the group's link, the member list), **Events** (coming up and past,
  New event, one event with guests, guest passes or ticket money after our 5%, Write to your guests, the guest list, Copy the event
  link), **Earnings** (earned this year, ready, held 30 days, paid; Passports and tickets apart; payouts), plus Home's group tiles,
  Insights, Your page, Opportunities and Guides; hours, menu, audit, check-ins, ads and the Partner plan are hidden for a Group Partner.
  Every number in the demo follows `canon-ve-group-partners`; every button that would save says so in a toast (`demo_only`).
- **`/groups/welcome`** is the **Group Partner Guide** (`groups/welcome.html`, the Nonprofit Partner Guide's layout, Dani narrating in
  text, `noindex`, public). Seven tabs since 2026-10-30 (Sean: "a little drab... Do we need it to be that much?... lead with the community
  itself"): **The community** (a short pitch, three chips, then real groups from the Directory with the Directory's card, most upcoming
  events first, and their next events, at most two a group; read live with the anon key), **Try the demo** (slim As a member / As the
  organizer tiles and the demo sign-in on the left, a live scaled preview of `/groups/sample` on the right sized to fit without scrolling;
  the organizer preview sets `ve_group_demo` so it skips the sign-in), What you get (Why it matters and What your group gets merged; the
  cards beside four of the sample club's photos, which step aside while Dani shows, `.gp-art`), The numbers (the ladder as bars, tickets,
  and the guest pass), **Your part** (slim cards and a preview of the organizer's Your members), Questions, and **Apply** (Sean, 2026-10-30:
  "It needs to be an intake... take this seriously. Answer these questions. Let us determine if you're a right fit"; migration
  `20261030_group_applications.sql`): five steps, one per view (`#/yes/1` to `/5`, `FORM` in the page): Your group, Your people, How you run
  it, You, The fit; Next checks the step, answers kept in the browser (`localStorage` `gp_apply`) until sent through `ve-group` `apply`
  (three a day per email; `APPLY_FIELDS` and `APPLY_REQUIRED` there match `FORM`), saved in `ve_group_applications` (RLS on, no
  policies), emailed to Sean with every answer and a confirmation to them; from an invitation (`?c=`) it ends on Open my invitation.
  **Depot > Group Partners > Applications** (`#apps/<status>`, `#app/<id>`; `ve-groups` `applications`, `application_get`,
  `application_save`): New, Reviewing, Accepted, Declined, every answer, a private note; marking one sends nothing. **Request a meeting**
  (Sean, 2026-10-30: "I don't want to be in the mix like that... it would be my goal to get community managers who can be that person they
  speak to... don't put my name in there. Make it general"; migration `20261030_group_meeting_requests.sql`): Apply's first step offers
  it (`#/meet`, `MEET` in the page, not a tour tab): name, email, group, where it meets, phone, good times, what to talk about, sent
  through `ve-group` `meet` (three a day per email) as a `ve_group_applications` row with `kind` `meeting`, emailed to the chapter's
  active Community Managers (`home_community`), else the team inbox, reply-to the requester; they are told only that our team will be in
  touch. Depot > Group Partners > **Meeting requests** (`#meets/<status>`: New, Set up, Met, Closed). **No public copy names Sean**: a
  page or email a group reads says our team; a person who wants to talk is routed to a Community Manager, else the team. Old `#/why` and `#/guest`
  land on What you get and The numbers (`ALIAS`). A preview, a group card, an event or See every group opens full screen in the page
  (`openView`, with Open in a new tab and Close or Escape). **Dani steps aside** when someone clicks around on their own: following her
  tour (Back / Next, a page's Next button, Take the tour with Dani, her picture) keeps her; any other move folds her into the corner, and
  brought back by hand she stays for the visit (`gp_dani_pinned`).
- A listing's sidebar shows Follow only when it has a social link (it was an empty card on listings with none).
- **Depot > People > Group Partners** (`/admin/depot/group-partners`, after Nonprofit Partners; migration `20261029_group_partners.sql`,
  run through the one-time `ve-once-group-partners`, now the 410 stub; edge function `ve-groups`, super admin or the admin token). One view
  at a time: **#list/<tab>** (every Groups listing: chapter, contact email or No email yet, events past and upcoming, invitation and
  partner status; tabs All, No email yet, Ready to invite, Not sent yet, Sent, Opened the link, Said yes, Declined; search and chapter),
  **#g/<listing>** (the organizer's name and email, **Find their email** (`find_contact`: their own site's home, contact and about pages,
  then the Instagram bio through Apify; only an email they publish, with where it was found), the partnership's status and note, and the
  invitation: What you know about them, typed or spoken, Write their opening (`ve-invites` `draft_note`), the email as it goes, Send it
  from me, Copy the link, Cancel, Follow up), **#pick** then **#new** (tick several groups, one card each), and **#discover** (`discover`:
  Meetup's public group search around each chapter's centers for Vegan or plant-based groups active since 2025, not ours or already held;
  each saved quarantined, `crawl_source` `group-discover`, until **Add to the Directory** (approves it, makes its Meetup events page its
  crawl source and brings in this year's past events and the next 180 days) or **Set aside**). A group invitation is
  `universe_invites.points_to` `group` with `listing_id` (an approved Groups listing not already onboarding, active or paused); the email
  and `/invite` are worded for a group and link the Guide (`/groups/welcome?c=<code>`) and the demo (`/groups/sample`). Sending it makes the
  group `invited` (`trg_ve_group_invite_sent`); accepting (`universe_invite_claim`) comps the organizer a Founding Membership and 1,100
  points if they were not a member, makes them the lead and the group `onboarding` in `ve_group_partners` (an active or paused group keeps
  its status), and emails Sean. Proven 2026-10-29 in a rolled-back transaction (wrong email refused, the comp and the lead, an existing
  member gets no points). The first discover (South Florida) found six for review, a yoga group among them: discover's filter is a first
  pass, so read each before adding it.

## Pathways (LOCKED by Sean 2026-10-29, playbook `ve-pathways`)

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-pathways`; migration `20261029_pathways_canon.sql`). **Not built
yet.** Sean: "let's find these email addresses, the social media handles... send them the email, but then also follow up with the
Instagram, and then automatically be cued on when to do follow-ups... nurturing each of these people until they become members...
see what they're going to see... a report of how many people have opened it... track that over time." Every way into the community
is a **pathway**, worked by one engine in **Depot > Pathways**, a tab each: Founding Members, Ambassadors, Community Managers, Nonprofit
Partners, Group Partners, **Content Creators** (new) and Coaches (later). A new category is a new pathway, never its own console; the
existing consoles become each pathway's detail view.
- **Four views per pathway**: the people (a board by stage: Found, Ready to invite, Invited, Followed up on Instagram, Read it, Opened
  the link, Said yes, Joined, Next step; beside them Declined, No reply, Resting with a date; each person's page with email, handles,
  where we found them, every touch and what is due); **Today** (the daily work list); **the journey** (every screen they see in order,
  See what they see on each, like Preview journeys, Not built where a step is missing, ending in **Introduce LESARUSS.AI**, a short note
  from Sean); **the report** (found, invited, read, opened the link, replied, said yes, joined, declined, no reply, week by week, by
  source, pathways side by side).
- **Leads**: a finder per pathway into Found for Sean to look over (Meetup discover for groups, the community search for nonprofits,
  YouTube, Instagram and our podcasts and People for creators, the Coaches section and Instagram for coaches); published emails only.
- **Pace and sequence**: 5 new a day per pathway, weekdays. Day 0 email, Day 2 Instagram, Day 5 follow-up email, Day 12 last note, then
  No reply, resting 6 months before one more try; Declined is final unless they come back. Every email from Sean, its opening drafted
  per person (like Founding Members), the day's batch approved by Sean (like Business outreach send days). **Instagram is never
  automated** (its rules forbid automated first messages; the account is at risk): a task in Today with the message written, Copy and
  open Instagram, Mark sent.
- **Content Creators is not its own program** (Sean, 2026-10-29; see Ambassadors for everyone, below): it is a lead finder feeding the
  Ambassador pathway with the Creator profile set. Coaches wait. Each pathway's LESARUSS.AI step is shaped later. Mailing list
  reactivation is a separate project.
- **Build order**: 1. the hub and journey view for the five that exist (shows every gap); 2. the board, Today, Instagram tasks and the
  report on those five; 3. a lead finder per pathway; 4. Content Creators; 5. Coaches. Reuse `ve-outreach` (lists, sender, sync,
  warm-up), `universe_invites` and its consoles, `ve-invites` `draft_note` and Preview journeys.

## Ambassadors for everyone, the talent bench and the shop (LOCKED by Sean 2026-10-29, playbook `ve-ambassadors-talent-shop`)

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-ambassadors-talent-shop`; migration
`20261029_ambassadors_talent_shop_canon.sql`). **The door is built (below); the rest is not built yet.** Sean: "the ambassador program being for everyone and you fitting in
based off of your results"; "these prices will be coming from LESARUSS.ai... any discount will come from them using points"; "a shop...
if they choose this, this is what happens"; "turn into a marketing agency for the 21st century."
- **One Ambassador program, never a separate Creators program.** The team sets each Ambassador's profile (Balanced, Animals first,
  Community builder, Creator, Health and fitness) and can change it in the background. People climb by results (levels, jobs, campaigns).
- **One Opportunities board**: points jobs (every Ambassador), perk jobs (a dinner, a ticket, a cause, plus points), paid jobs (invited,
  active Ambassadors with a rate card). From Level 2, bounties include professional work (social, editing, design, outreach), skill
  tagged, vetted with a small paid trial job. The Community Manager is the client's one contact.
- **Activation for paid work**, a self-updating checklist: profile, platforms (numbers read where we can), rates (team only), get paid
  (Stripe Connect hosted onboarding; W-9 and 1099s through Stripe's W-8/W-9 product, in preview and to be requested, else its manual
  W-9 request). Not active yet until all four; reminders Day 2, Day 7, then weekly; Active with a notification when done.
- **Scouting**: our own campaigns, dinners, events and tours; HARO (Featured.com's free reporter requests) matched by topic; other
  marketplaces only as heads-ups from public posts, never scraping logged-in platforms.
- **We produce campaigns**: we pick the talent (a brand may hand-pick for 10% more), creators get their full rate, 50% on yes and 50% when
  their posts are live, the brand pays creator fees up front (held until delivered), our fee 25% on top; FTC disclosure on sponsored posts;
  rates and numbers stay with the team, names go to a brand only after a creator says yes.
- **The shop** is the LESARUSS.ai service list, one price list for every brand: each item a workflow (intake, deposit, assignment, a
  Community Manager, delivery, sign-off), offered **AI-led** or **people-led** (vetted Vegan professionals, about 1.5 times). AI-led
  rate card: press release written and pitched $500; PR outreach $750 a month; social media, one platform, $400 a month; brand or product
  launch quoted from $1,500; custom agency work quoted per project. Members (Partners, Diplomats, Ambassadors Level 2 and up) save 20%;
  points (1 point = 1 cent, earned by promoting us) cover up to half. Prices may be tuned to delivery cost before each service opens.
- The Partner plan is on us for Creator-profile Ambassadors at Level 2 and up while active; they earn 20% commission from day one.
- **We make it right**: a professional who fails to deliver is replaced and we finish it; refunds stay deposit only. Contractors are judged
  on deliverables and deadlines, never hours or methods (a labor attorney reviews the agreement once).
- **Reveal bit by bit**: now the door (the Guide, the account, the profile, the checklist); then one service at a time with its case study
  and a Daily Pulse announcement: books (Bob Leonard, then Brooke), courses (Dr. Klaper), event promotion, PR, social, brand launch.
- **First**: Torre Washington; Gabriela Reyes once the platform comes first (confirm her name and handle); then Philly's creators ahead
  of a dinner. **Build**: the Creator Guide from Sean's Canva Vegan Content Creator Survival Guide (`DAGx86FyHyw`), profile claim and
  the checklist, the Opportunities board, Stripe Connect and campaign production, the shop, the lead finder by city.
- **The Official Creator Guide** (Sean, 2026-10-30, for professional creators such as Gabriela Reyes: "get straight to the business
  point of it... these are business professionals... We want to register you as one of our official content creators"):
  `/creators/welcome` (`creators/welcome.html`, the Group Partner Guide's layout, River fixed on the right, his lines as text, `noindex`,
  open by link). An official creator is an Ambassador with the Creator profile, never a separate program. Eight tabs: Overview, Where
  we're going (thirteen chapters, the Directory, our shows, brands and events as one buyer), The work (paid campaigns, collaborations,
  professional work Coming; hosting open now; events with the Dolphins showcase; the sample campaign), How it pays (this canon's terms),
  Every city, What you tell us (the door's four steps), Questions, Register (`?c=<code>` opens `/invite?c=<code>`; an Ambassador gets
  their checklist; anyone else mails contact@lesaruss.com). In the Guides menu for Ambassadors and the team. **Comping a creator** (Sean, 2026-10-31): Depot > Ambassadors > Invite an
  Ambassador with the profile **Creator**, the level and points: the membership is on us, the email links the Official Creator Guide
  (`/creators/welcome?c=<code>`), and accepting on `/invite` says Welcome, official creator, and opens the Creator Guide.
- **The Gig Board** (Sean, 2026-10-30: "the actual mechanism for them to find gigs... like Casting Networks or Backstage where they
  can go on daily and see what opportunities are available... whatever we create, I want become the way the bounties work as well...
  submit some proofs, some examples... audition... a certain requirement of followers... opportunities that are just for points...
  rise up the rankings if you're reliable"). One board for every way we pay a creator or member: `/public/ve-gigs.js` (`VEGigs.mount`,
  `VEGigs.live`), one view at a time (`#board`, `#gig/<id>`, `#apply/<id>/<step>`, `#mine[/<status>]`, `#profile`, `#how`), filters
  (pay: paid, perks, points; kind: paid campaign, collaboration, hosting, event, content, bounty; my cities or every city; Only gigs I
  qualify for; newest, closing soon, highest pay). A gig is **claimed** (first come, the old bounty), **applied** to or **auditioned**
  for; it asks for a pitch, examples, an audition link or a rate; each requirement (followers on given platforms, a level, a city) is
  checked against the creator's profile and shown as You qualify or what it needs. **How you rise**: New, Rising (one delivered),
  Reliable (five delivered, 9 in 10 on time, no open strikes), Featured (Reliable, Level 3, clicks per 1,000 followers at least twice the
  board's average; sees new paid gigs a day early), counted from each creator's own tracked link (Logan's defaults, Sean's to change).
  **`/gigs/sample`** (a rewrite to `gigs/index.html`, `noindex`) is the sample: **Kai Monroe**, an invented creator drawn in our style
  (`gigs/sample/img/`, Higgsfield 2026-10-30, 26 credits; sources kept in `vegan-media/media/communities/kai-sample/`), illustrative
  brands, ten gigs from `gigs/sample/demo.js` (dated from today), My gigs in every status, her profile as partners see it (platforms,
  work with products, results per 1,000 followers, reliability, rates for the team); applying and claiming work for the visit and send
  nothing. Since the same day (Sean: "my gigs should look the same way... three columns"; "what they would see and what we would see and
  what the sponsors would see, and then what the public will see"): the board and My gigs are the same tile, three across (two under 1100
  px, one on phones), My gigs filtered by status chips; **Your profile** switches four ways (`#profile/you|partner|team|public`):
  **Your dashboard** (what an official creator's dashboard shows: paid this year, gigs in play, standing and the next step, Up next,
  results, work, rates, checklist), **Partners** (no rates or contact), **Our team** (everything) and **The public** (their People
  directory page: no rates, results or contact). How you rise opens beside Kai hosting a stage.
  **The Creator Dashboard** (Sean, 2026-10-30, the same day: "train our audience to know that the drop-down menu at the top navigates
  this particular section... this should be the creator board, our creator dashboard... the green part could be demo... it's essentially
  their media kits... she gets to be the prototype"): the page is the **Creator Dashboard** (`gigs/index.html`; the line under the title
  reads **Demo** on `/gigs/sample`), and **the banner's dropdown is its only menu** (Overview, Open gigs, My gigs, Your media kit, How you
  rise; no tabs inside the page). **Overview** (`#overview`, the default) explains how to use it: four tiles (open gigs you qualify for,
  gigs in play, how complete your media kit is, your standing), Up next and How it works. **Your media kit** (`#profile/you|partner|
  public|team`) is the creator's media kit and the prototype for their People listing: a cover with their photo, tagline, tags and a
  booking button, total reach and each platform, then About, what they make (content pillars), featured work, results on past gigs, what
  partners say, audience (ages, top cities), brands worked with, reliability, rates and where they show up; partners see no rates or
  contact, the public sees no rates, results or audience, and **You** adds Make it shine (what would complete the kit; our team helps
  keep it current). Kai's kit data is in `gigs/sample/demo.js` (`tagline`, `cover`, `pillars`, `audience`, `brands`, `quotes`,
  `kit_done`). The same banner-as-the-only-menu pattern is to be weighed for the other demos and the Directory (Sean's note, not done). **The sample is the creator pathway** (Sean, 2026-10-30: "this really should be the guide itself... the
  overview explains the opportunity... a video with one of our guides to the right... Kai Monroe... it should be a next, next, next...
  the last step is the intake"; `VEGigs.mount` with `guide: true`): `/gigs/sample` opens on **Overview** (`#overview`: the opportunity,
  what you get, how it works and how to use the page on the left, Kai on the right with her line), then **Your dashboard** (`#dashboard`,
  the old overview), Open gigs, My gigs, Your media kit (Next steps through its four views), How you rise and **Apply** (`#join/1` to
  `/5`). Every step has Back / Step N of 7 / Next at the top and the bottom and Kai's line on what you are looking at (`TOUR`, `SUBSAY`;
  drafts, Sean's to change). Kai is a character in her own right now, the creator who walks you through; her voice is Jessica (below). **The creator application** (`FORM` in `ve-gigs.js`: About you, Where you post, What you
  make, Working together, Last thing; one step per view, Next checks the step, kept in `localStorage` `vg_creator_apply`) goes to
  `ve-ambassador` `creator_apply` (anyone, three a day per email) into `ve_creator_applications` (migration
  `20261030_creator_applications.sql`: what a campaign will match on, chapters, topics, formats, gig kinds, platforms and reach, in
  their own columns; every answer in `answers`), emailed to Sean with every answer and confirmed to them, in the dashboard's Inbox, and
  read in **Depot > Ambassadors > Creators** (`#creators/<status>`, `#creator/<id>`: New, Reviewing, Accepted, Declined, a team note;
  marking sends nothing). The live `/gigs` opens on Your dashboard and has no Overview or Apply. Matching applicants to a campaign is not
  built yet. It is the Official Creator Guide's **Try the board** tab (pick a screen, a live scaled preview, full screen on tap) and its
  "see it on the sample board" links, and linked from the Creator Guide's Your next step and the Ambassador Guide's Paid work.
  **`/gigs`** (signed in) is the live board: the city's bounties through `ve-bounties` `list`. **The bounty is the gig** (migration
  `20261030_gig_board.sql`): `ve_bounties` gained `gig_kind`, `apply_mode` (claim | apply | audition), `perk`, `partner_name`,
  `partner_listing_id`, `req_min_followers`, `req_platforms`, `req_level`, `remote`, `asks`, `audition_prompt`, `apply_by` (every
  existing bounty reads as a points bounty to claim, unchanged); submissions gained `applied`, `shortlisted`, `audition`,
  `not_selected`, `application`, `applied_at`, `decided_at`, `decided_by`; `ve_gig_fit(bounty, member)` checks followers (the paid-work
  checklist's platforms) and level. `ve-bounties` `apply` (Passport holders, requirements, every ask filled, an audition a full link;
  emails the team), `applicants` and `applicant_decide` (shortlist, audition, book, not selected; booking turns the application into a
  claim and the bounty lifecycle takes over; each emails the creator); `claim` refuses an apply gig (`apply_needed`) and a member who
  does not qualify (`not_qualified`). Not built yet: posting a gig with these fields and deciding applicants in Depot > Bounties, the
  partner's own view of its applicants, results per creator from tracked links, and `/dashboard/gigs`.
- **The Creator Guide is the creator pathway** (Sean, 2026-10-30: "take this, what we created, put it into the creator guide as the
  overview... the drill through everything will just be under overview... the become could take them directly to the intake page").
  Its **Overview** is the `/gigs/sample` walkthrough itself (Kai, the opportunity, then Your dashboard, Open gigs, My gigs, the media
  kit, How you rise and Apply), mounted inside the Guide at `#/overview/<view>` (`VEGigs.mount` with `base`, `external`: the Guide's
  router draws it; `gigView` in `guide-scripts/creator-guide.js`, each mounted once so a visitor's demo applications stay for the
  visit). **Your next step** became **Become a creator** (`#/next`, the application on its own: `start: 'join/1'`, `tour: false`).
  **Kai is the Creator Guide's narrator** (Sean, 2026-10-30: "make Kai the new creator guide and replace River... after the first page,
  she is at the top of the screen... two column where one Kai in the text bubble is on the left and the back and next and open gigs is
  on the right... minimize the top row... we want them to see the full demo"). The walkthrough's landing keeps her on the right; every
  step after it opens with one row of two equal columns (`.vg-top2`, `topRow` in `ve-gigs.js`): Kai, her line and Play on the left, Step
  N of 7 with Back and Next on the right (one column on phones), so the demo below runs full width. Since the same day it is **one guide
  bar** (`.vg-gbar`, Sean: "it doesn't look solid like the other ones... what if we put it in the same section where Kai is"): Kai,
  Step N of 7 over her line, Back and Next on the right, and a seven-part progress line along its foot; Play Kai sits on the bottom of her
  picture (104 px, 88 on phones, `.vg-gbar-kai`; Sean: "put the button at the bottom of the photo... condense it"), and on phones Back is
  left and Next right under them. On every other tab she is in the
  Guide's rail (`data-guide="kai"`, `VE_GUIDE_ART.kai` in `footer.js`, `drawKai`), and on Become a creator her line is the tip for the
  application step on screen. The tabs end My list (members) or Get access, then **Become a creator**, always last. **Her voice**: every
  line is recorded (`LINES` in `ve-gigs.js` for the walkthrough and the application, each tab's `say` and `voice` in
  `creator-guide.js`; `vegan-media/media/voices/creator-guide/kai-<key>-v1.mp3`, el-media tts with the ElevenLabs premade voice Jessica,
  `cgSgspJ2msm6clMCkdW9`, Kai's voice, approved by Sean 2026-10-31 and used by no other Guide, on her HQ roster profile (`artists` kai,
  its Voice module) and `character_agents` kai, migration `20261031_kai_roster_voice.sql`; every line that says Vegan is recorded from text
  spelled "Veegan"), and `VEGigs.voice` plays them: nothing plays until the visitor presses
  Play Kai, then each new view or tab plays its line by itself until they press Pause (`sessionStorage` `ve_kai_voice`). A line's text
  must match its recording; change one and record it again (`-v2`, and its key in `VOICE_VER`). Never write "lives here" in a recorded line: the voice reads it as the verb (Sean, 2026-10-31); say "is right here". Liz's Restaurant Guide clips `rg-m-audit`, `rg-m-pulse` and `rg-mylist` said it; re-recorded 2026-10-31 on Sean's go ("is right here", "is here"). **Liz is never animated in the Restaurant Guide** (Sean, 2026-10-31: "I don't like the animations. It's inconsistent... it looks blurry... I don't want to see her animated at the beginning either"; Maya's Dairy Guide clips stay, "I like Maya's"): all 17 of her clips are MP4s of a sharp still with her recorded line (the audio taken from the clips as they played, the three re-recorded lines from their new mp3s), every pose redrawn crisp at 2048 px with `nano_banana_pro` from its old 640 px frame, same pose, hands and face (2 credits each), stored at 960 px; My list got a new on-model pose (phone up, hand on hip). `CLIP_V` in the Guide script versions them all. el-media refuses more than two recordings at once (ElevenLabs'
  concurrent limit), so send them two at a time. **Every gig has a picture** (Sean: "each one should have a little square with rounded
  corner image... inviting and visual"): `img` on a gig (the sample's are `gigs/sample/img/gig-g<n>.webp`, illustrative, Higgsfield
  2026-10-30), shown square on the board's tiles and My gigs (so Up next too), else the flat icon of its kind (`thumb`, `ICON`); the
  dashboard's four tiles wear flat icons. **The tile** (Sean, 2026-10-30: "clean... compact and not busy and uniformed"): the picture
  (104 px, 84 on phones) with the partner, title, pay and one more line beside it (what it asks on the board, what happens next on My
  gigs; `.vg-tile-h`, `.vg-tile-r`), then every pill in one row under both, colored by what it is and always in this order: how you get
  it (Apply / Audition / Claim it, `.mode`), the kind (`.kind`), where (`.place`), then on the board You qualify or what it needs and the
  facts (closes, spots, applied); on My gigs where it stands (Booked, Audition requested...) comes first. Your Creator Dashboard and Open gigs put
  their title above Kai's strip (`head(active, title)`).
  Not yet (Sean's direction): People doing it marking the creators who have registered with us, and the Pulse tab carrying articles
  for creators beside the podcasts, sortable.
- **The Creator Guide** (built 2026-10-29, the Ambassador door; migration `20261029_creator_guide.sql`). `guides/creator-guide.html` and
  `guide-scripts/creator-guide.js`, the Nonprofit Guide's shell, River narrating in text (no clips), indexed, seventh in the
  Guide catalog (label Creators, banner `public/guides/creator-guide.jpg`), in the sitemap. Tabs: Overview, **The 10 tips** (`#/tips/<id>`:
  the Canva's principle, In Action and three action items word for word, the action items as This week, kept in the browser
  `cg_checks`; On Vegans Explore; an episode; tip 1, purpose, free), **People doing it** (People > Content Creators and the Directory's
  YouTube channels, the Directory's card, a listing framed in the Guide), **Pulse** (`PULSE_PICKS`: our episodes with creators, Building a
  platform and The craft, each matched to its show's feed and played in place), **Your next step** (become an Ambassador: invitation only,
  one program by results, points, perk and paid jobs, the paid-work checklist (Live, `/ambassadors/door`) and services one at a time, each marked Live or Coming, no
  prices; Tell us about you mails contact@lesaruss.com; Already an Ambassador opens `/ambassadors/welcome`), My list (`ve-cookbook` kinds
  fix, episode, listing) and Get access. Tips 2 to 10 are `ve_guides.content_html` (`<script id="cg-data">`), never in the repo. $11 or
  1,100 points; **an active Ambassador has it included** (`ve-guide-unlock` and `ve-cookbook`: `members.ve_role` `ambassador` and active,
  `via` `ambassador`, no purchase row). From the Canva: tip 3's example is Pick Up Limes (Gaz Oakley is no longer Vegan), and its closing
  survey and one-week free trial are left out.

**The Ambassador door, built 2026-10-29** (Sean: "Build the ambassador door"; migration `20261029_ambassador_door.sql`, edge function
`ve-ambassador`, verify_jwt off, the member token checked inside, ops by the admin token with `as_member`). `/ambassadors/door`
(`ambassadors/door.html`, `noindex`): **Paid work: your checklist**, Not active yet or Active in the header, the checklist first, then one
step per view (`?step=profile|platforms|rates|paid`, Back / Step N of M / Next, Next saves the step): **Your profile** (their People
listing: search and **This is me**, or **I'm not in the Directory yet** with their name, what they do and a bio; either waits as a
`ve_profile_claims` row for the team; once theirs, what they do, website, Instagram and a bio of 80 characters or more, each change a
`ve_listing_edits` row, and a photo through `ve-claims` `owner_photo_url` / `owner_photo_done`, 400 px or more), **Your platforms**
(Instagram, TikTok, YouTube, Facebook, podcast; YouTube subscribers read from YouTube's Data API, the rest as they type them), **Your
rates** (post, reel, story, appearance, hosting, a day of social work, notes; what they do and the chapters they can show up in; the team
only) and **Get paid** (Stripe Connect Express onboarding on Stripe's pages, back to `?step=paid&stripe=return`, which asks Stripe whether
payouts are on). A step is done when: a photo, what they do and the bio; one platform with followers; one rate; payouts on. All four make
them Active (`ve_ambassador_door.active_at`) with an email to them and Sean. Reminders (cron `ve-ambassador-remind`, 14:17 UTC): Day 2,
Day 7, then every 7 days, at most 10, naming what is missing, counted from the day they first open the door. Linked from the dashboard's
Your tools (after The Ambassador Guide) and the Guide's Your role (Paid work). **Depot > Ambassadors > Paid work** (`#door`, `admin_list`,
`claim_decide`): totals, the profile requests to **Approve** (an existing People listing becomes theirs, `owner_member_id`, or a new
Content Creators listing is made, every chapter, `crawl_source` `ambassador`) or **Decline** with a note they get by email, and every
Ambassador's checklist with their platforms, rates and skills. **Payouts run on the Vegans Explore Stripe account** (the live
`STRIPE_SECRET_KEY` is `STRIPE_SECRET_KEY_ACCT_VEGANSEXPLORE`; test accounts use the LESARUSS test key, whose account has no Connect, so a
test run is refused with "Payouts are not switched on yet"). Connect is on there. The first live Express account (2026-10-30) was refused
for "suspicious activity" until Sean confirmed it in the dashboard; a refusal like that now tells the member "Payouts could not be set up
right now" and emails Sean Stripe's reason. Proven 2026-10-29 with the internal QA account as an Ambassador (search, a new-profile request,
approval making the listing, the profile, platforms with YouTube read live, rates, Next saving, the Depot view, reminders due none), and
2026-10-30 live as Sean (an Express account made and Stripe's onboarding link returned; the test account `acct_1UW3SU1iCaKwuaVp` is Sean's
to delete in Connect), then removed.

**The Ambassador Guide, reworked 2026-10-30** (Sean: "why would we want to limit them to any particular area?... As an ambassador, you're
just representing the movement and helping us get into as many places as possible, introducing us to business owners and to podcasters
and to people who are on the streets who have a story to be told... we want to interview you and put you on our podcast... different
people hosting... be the voice of your city"; "on the first page, we can ask them if they want the guide... at the bottom, hidden, the
guide will always be there"; "it's got to be clear on what the opportunity is"; "they should be able to submit a question too"). Twelve
tabs: Overview, Why it matters, **The opportunity** (`#/role`: bring people in anywhere, introduce us, tell the stories, be the voice of
your community, paid work, each a picture from `public/guides/thumb-*.jpg` and `creator-guide.jpg`, `PIC`), **Tell the stories**
(`#/stories`: four kinds, Introduce someone, Interview me, I want to host, What is happening here; sent through `ve-ambassador` `story`,
saved in `ve_ambassador_stories` (migration `20261030_ambassador_stories.sql`, 10 a day) and emailed to Sean; nothing promised until we
reach out), **Paid work** (`#/paid`: the four checklist steps, Open your checklist (`/ambassadors/door`), the kinds of work, how it pays,
numbers private, the first paid jobs Coming, the Creator Guide), Your membership, Your link, Who to invite (anyone, anywhere: podcasters,
people with a story), What to share, **Anywhere** (`#/city`, was Your city: not bound to one place, the home base optional), Answering
questions (plus Do I have to stick to one city?, and **Not on the list? Ask us**: `ve-auth` `guide_ask_person`, `agent_slug`
`ambassador-guide`, emailed and kept on `guide_kb_gaps`), Your progress. The Overview asks **Want Liz to walk you through it?** (Walk me
through it / I'll look around myself, `localStorage` `am_guide_mode`); looking around folds the Guide into the corner (`/public/ve-guide-min.js`,
`#dgApp`, `#dgRail` `data-guide="liz"`, `#dgFold`), and Hide me / Show me change the choice too. **The Overview is minimal** (Sean, 2026-10-30: "keep it to three... with a toggle where it just
advances to the next one in that space... the video playing to the right with rounded corners... it's just an image with the audio
playing in the background"): no tile list; the five opportunities three at a time (two, then one, as the column narrows) with arrows
and dots (`OPS`, `drawOps`), and **Liz walks you through it**, her voice over her picture (`OV_AUDIO`: el-media tts in her voice,
`vegan-media/media/liz/ambassador-guide/overview-v1.mp3`, 51 s, checked word for word with `stt`; draft lines, Sean's to change). As she
reaches each one (`OV_AUDIO.cues`, from the recording's alignment) that card lights and slides into view. With the Guide showing, her
picture in the rail is the player (one Liz, not two); folded away, the player sits beside the cards. It pauses when they leave the tab. **Depot > Ambassadors > Stories**
(`#stories/<status>`: New, Contacted, Done; `ve-ambassador` `admin_list` `stories`, `story_status`).
**Then, the same day** (Sean: "don't have the hide me feature. It's just going to be fixed there... when you go to next, you see Dani
and she talks as well... two rows, two columns... more rectangular... equal in length... Theo back to back. I don't like that... compress
it"). The Guide is fixed on the right again: no Walk me through it choice, no Hide me / Show me, no `ve-guide-min.js`, and the Guide's
picture is the player on every tab with a recording (`railPlayer`, `tabAudio`; the Overview's is Liz's walkthrough with its card cues,
the others `TABS[].audio`, `vegan-media/media/voices/ambassador-guide/tab-<tab>-v1.mp3`, word for word as `say`). Ten tabs, a different
Guide on each and never one twice in a row: Overview (Liz), Why it matters (Dani), The opportunity (Nori; Every chapter is open to you
joined it), Tell the stories (River), Paid work (Theo), Your link (Maya; Who to invite joined it), What to share (Liz), Your membership
(Dani; the optional home base, `homeBase`, joined it), Answering questions (Theo), Your progress (River); `#/who` and `#/city` forward
(`OLD_TABS`). Every card grid is two across (`.dg-grid`, `.am-steps`, `.am-kinds`), one on phones, and an odd last card runs the full
width; Why it matters' Points given to the organizations became Their events, on the calendar. Every tab talks: Liz (Overview, What to share), Maya (Your link), and,
since Sean picked their voices in the ElevenLabs Voice Library the same day (the designed samples were "horrible" and were deleted), Dani
(`b5RPB35vTODb3BEmR3Fc`; Why it matters, Your membership), Nori (`rr9oBze1kuNJYeAV7xos`; The opportunity), River (`btaSeNTVh1pGx4pjFzub`;
Tell the stories, Your progress) and Theo (`aFyw0oiXW7dzKF4o7woX`; Paid work, Answering questions), saved in
`character_agents.elevenlabs_voice_id` (migration `20261030_guide_voices.sql`). Each line checked word for word with `stt`; change a
tab's `say` and its line is recorded again (the next `-v2`).

## Member profiles and partner windows (LOCKED by Sean 2026-10-28, playbook `ve-member-profiles-partner-windows`)

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-member-profiles-partner-windows`). **We choose when a profile is
seen; the member chooses what is in it.** The team sees every profile answer, used only to improve the member's experience, never
sold or handed over. Each answer is **Can be shown** or **Just for Vegans Explore** (the In your words prompts, city and journey
shareable by default; the `team` market research questions never, with no switch). No open browsing: a profile shows, only its
shareable parts, inside a window we open: an event's guest list, a campaign, a sponsor invite. **Partner windows**: an event
organizer messages the members who RSVP and opted in, from the RSVP until 7 days after the event; a brand messages members who opted
in to hear from it, for its campaign's run dates; a one-time message to past guests is phase 4. Every message goes through us
(partners never see an email, phone or handle), logged, capped per window, with Mute and Report (reports pause the partner). Consent is
an explicit, rewarded opt-in at RSVP and at save ("Let <organizer or brand> message me about this"); a save alone is never consent,
and the UK (London) needs an unticked opt-in. Without consent partners get counts and segments, never names. The Policies page says
it before any of it goes live. Build order: 1. the switches and the team view in the Depot, 2. the event window, 3. the campaign
window, 4. past guests. **Phase 1 is built** (Sean, 2026-10-28: "go ahead with phase 1"; migration `20261028_profile_visibility.sql`):
every answer about the member has **Who can see this answer** in Your profile (Can be shown / Just for Vegans Explore, saved at once,
`ve-mission-survey` `shown`, `members.profile_shown`) and a tag on its card; the rule is the database's (`ve_profile_switchable()`: the
prompts, city, journey and Vegan since start shown; roles, what drew them, what matters and how they eat start private; the `team`
questions and the Instagram handle have no switch and are never shown), and `ve_profile_public(member)` (first name, last initial and
the shown answers) is the only way a profile may leave the team, for the windows of the next phases. **Depot > People > Profiles**
(`/admin/depot/profiles`, `ve-mission-survey` `admin_list` / `admin_get`, super admins): everyone who has answered (search, city,
answered of 31, points of 250), and one member (`#m/<id>`): every answer with Can be shown, Just for Vegans Explore or Team only, and
What anyone outside the team could see. The Policies page's Privacy says all of it (profile answers, who sees what, partners only
through us in a window they said yes to).

**Phase 2, the event window, is built** (Sean, 2026-10-28: "go ahead with phase 2"; migration `20261028_event_window.sql`, `ve-events`,
`public/ve-events.js`). Every live event has its own view (`/events#event/<id>`, the tile's name; the dashboard's Events tab too):
the details and, for a Passport holder, **I'm going** (`event_rsvps`, which had never been used: every RSVP linked out). When the
event has an organizer (`ve_event_organizers`: the member who sent it as its host or promoter, made on approval, or anyone added in
Depot > Events by account email, with the name guests see), the RSVP offers an **unticked** "Let <organizer> message me about this
event", 25 points once per event (`ve_points_grant` reason `partner_optin`, ref `optin:<event>`; `ve_event_rsvp`). The organizer's
**Guests and messages** (`#guests/<id>`, linked from My events and the event): going, said yes, the shown profile parts of those who
said yes (`ve_event_guests`, `ve_profile_public` only), and messages through us (`message_send`): by email from Vegans Explore with
their name, plain text up to 1,000 characters, 3 per event at least 24 hours apart, until 7 days after the event
(`ve_event_window_open`), never an email address either way (replies come to contact@lesaruss.com), each one logged
(`ve_event_messages`, `ve_event_message_deliveries`). Only the organizer sends; the team reads. A guest's email links to
`/events#message/<token>` (no sign-in): **Stop messages from <organizer>** (`ve_partner_mutes`, every event of theirs) and **Report
this message**, which pauses that organizer on every event (`paused_at`), stops them for the reporter and emails Sean; Depot > Events
shows each live event's **Organizers and guests** with the messages, reports, **Resume** and **Remove**. My events lists the events they
organize, the ones they are going to (with Stop <organizer>'s messages) and the organizers they stopped (Let them message me again).
Defaults set by Logan, Sean's to change: the box unticked everywhere (the law asks it only in London), 25 points, 3 messages a day
apart, 1,000 characters (`MSG` in `ve-events`). Proven end to end 2026-10-28 on a [TEST] event with two internal accounts (RSVP and
points once, the organizer's view, a real send, the second send refused, the guest's link, report, pause, Resume), then removed.

**Phase 3, the campaign window, is built** (Sean, 2026-10-28: "go ahead with phase 3"; migration `20261028_campaign_window.sql`, edge
function `ve-campaign-window`). A save is a bookmark, never consent. Saving a listing a business has claimed (`listings.owner_member_id`)
opens a small window (`askOptin` in `directory/listing.html`) with an **unticked** "Let <name> message me during their campaigns", 25
points once per listing (`partner_optin`, ref `optin:listing:<id>`; `ve_listing_optins`, `ve_listing_optin_set`); unsaving takes it back
(trigger `trg_ve_listing_save_removed`), and **My Saves** has the switch on every saved listing a business claimed (`mine`). A campaign
is a run of Eastern dates the team sets in **Depot > Brand campaigns** (`/admin/depot/brand-campaigns`, Directory in the Go to menu:
Running / Coming / Ended, New campaign, one campaign with its counts, messages, reports, Resume and End it now; `ve_listing_campaigns`).
The business dashboard's **Your audience** (`?tab=brand&pd=audience`, `drawAudience` in `ve-partner-dashboard.js`) shows how many saved
them and said yes, by chapter (`ve_listing_segments`), never names; only while a campaign is live (`ve_listing_campaign_live`) does it
show the members who said yes as `ve_profile_public` shows them, and a message box (the owner only, claim approved): by email from
Vegans Explore with the listing's name, 1 a week, 4 a campaign, 1,000 characters (`MSG` in `ve-campaign-window`), replies to
contact@lesaruss.com, logged (`ve_campaign_messages`, `ve_campaign_message_deliveries`). A member's email links to `/messages#c/<token>`
(`messages.html`, no sign-in): **Stop messages from <name>** (withdraws the yes) and **Report this message** (pauses the campaign, withdraws
the yes, emails Sean). The dashboard's **Saves** view no longer names who saved (it did since 2026-10-27; `ve-podcast` `owner_saves` sends
dates and counts only). Check-ins are counts only for the owner too (Sean, 2026-10-28: "treat check-ins the same way"). Defaults set by Logan, Sean's to
change: unticked, 25 points, 1 a week and 4 a campaign. Proven end to end 2026-10-28 on the Vegans Explore Podcast listing with an
internal test account (no yes before saving, the yes and its points once, unsaving withdraws it, counts by chapter, a real send, the
second send refused, the member's link, report, pause, Resume), then removed. Phase 4, one message to an organizer's past guests,
waits until the first windows have run.

**Members-only tickets** (Sean, 2026-10-28: "Let's do a campaign for the Dolphins event, and I want to open up tickets... link that to
this campaign as well as to the event listing so that it takes them directly there when they log in"; migration
`20261028_dolphins_member_tickets.sql`). Some ticket links are ours alone, a group link with our markup, and must never be public (the
Dolphins playbook: gated to signed-in members, after the public link leaked last time). Such a link lives in `ve_event_member_tickets`
(event, url, initiative; RLS on, no policies, so only the server reads it), and the event's `ticket_url` is our own
`/events#event/<id>/tickets`. The event view shows **Get tickets** ("Through our Vegans Explore group link, for Passport holders") in place
of the official link (`ve-events` `event` returns `member_tickets`, never the url); `ve-events` `tickets` gives the url only to an active
Passport holder or a super admin (else `not_eligible`), logs a `ve_initiative_interest` row (tags `event-tickets`, `event:<id>`), and the
page goes there. Signed out (Sean, 2026-10-28: "this is a member-only event. You must be a member in order to access the tickets"), Get tickets, the tile, a city hub's RSVP and `#event/<id>/tickets` open the Directory's members-only window (`VEVotes.memberPrompt('tickets')`, loaded on first need): This is a members-only event, Explore the Passport (`/passport?from=tickets`, with its own note) or Sign in, both coming back to `#event/<id>/tickets`, which takes a member on to the tickets. First: the Plant-Based
Showcase, Miami Dolphins game day (event `3f6a7e2e-efff-4b0e-80ce-580428d3cb52`, Fevo `Vegansexplore2`, $15 a ticket to LESARUSS Inc.,
organizer Vegans Explore); its campaign page's attend step is **Get Tickets** on the same link (`campaigns/plant-based-showcase-dolphins.html`).
