# History: membership

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## Who sent you, and credit for shared links (Sean, 2026-11-03)

"The name of the person that registered you, so we can do a double check to make sure they get credit." **Tested end to end 2026-11-03**: a
signed-in member's Share link carries `?ref=<referral_code>` (`VEShare.url()`), the code is kept for the visit (`sessionStorage` `ve_join_ref`)
and counted once a visitor a day (`ve_referral_visit`), the sign-up sets `members.referred_by`, and the friend's payment pays the sharer 111 points
once (`trg_zz_referral_on_admit`; commission from Level 2). **Where credit slips**: a link opened on one device and joined on another, or a later
visit with no link. So the $11 window asks **Did someone send you?** (`/public/ve-referrer.js`, mounted by `showActivateModal` in `ve-auth.js`,
which every email and Google sign-up passes through; since 2026-11-03 the same field is on the invitation's One step left, the challenges' signed-in banner (its own session, `mount(el, {token})`) and the dinner's seat-held panel, each hiding itself once the account has paid):
the field says who the link already credits, suggests members as they type (first name, last initial, chapter; no emails; unpaid accounts only,
the active members of class member or internal, `ve_referrer_search`) and records the pick through the edge function `ve-referrer`
(`status`, `search`, `claim`; migrations `20261103_referrer_claims*.sql`). **Rules**: a claim sets `referred_by` only when the link did not; a
claim that disagrees with the link keeps the link's sponsor and is saved as `conflict`; typed words that match no one are saved as `unresolved`
(`ve_referral_claims.status`: credited, matched, conflict, unresolved, self), one claim per member, refused once the account has paid
(`already_member`). **Depot > Referral claims** (`/admin/depot/referral-claims`, People in the Go to menu; built 2026-11-03; `ve-referrer` `admin_list`, `admin_get`, `admin_find`, `admin_decide`, super admin token; migration `20261103_referral_claims_review.sql`): To review, Conflicts, Not found, Decided, All; one claim per view with who joined, what they typed, who the link credits and who they named, and the decision: keep the link's sponsor, credit the person they named, credit another member you pick, or dismiss, with a note. `ve_referral_claim_decide` is atomic and once per claim; it changes `members.referred_by` only while the friend is still `pending_payment` (the 111 points and commission are paid when the account turns active), else it records the decision and you give points by hand. Proven in a rolled-back transaction. Not yet: a duplicate-account filter (Sean has several internal accounts that suggest as "Sean R.").
Sign-up from one address is limited to 3 an hour (`ve-auth` `signup`), which a test run hits.

## Registration is the Passport (Sean, 2026-10-27)

"People can view everything without logging in. He probably wanted to become a Passport member and was just given a free
membership. Let's fix that so they can only register through the Passport program." (Joshua Mattey had made an account with
Continue with Google, closed the $11 window and kept a free account.) There is no free account any more:

- An account that has not paid (`membership_status` `pending_payment`) is only the checkout's account. `VEAuth.isLoggedIn()` is
  false for it (`isPending` in `/public/ve-auth.js`), so every page treats it as signed out; its token is kept only to pay.
  Making an account (email or Google) or signing in to an unpaid one goes straight to the $11 Passport window ("One step left:
  your Passport..."), and closing that window signs them out (`hideActivateModal`). The sign-up tab reads **Get your Passport**
  and its button **Continue to checkout**, except on a page that finishes the join itself (`VE_ACTIVATE_HANDLER`: an invitation,
  a dinner seat, a Guide's own $11), where they read Create Account. `/login` does the same for both sign-in paths.
- The server agrees: `ve-auth` sends the welcome email only to an account that is active at sign-up (an invited one); the
  webhook's "Your Passport is active" is everyone else's welcome. Guide chat refuses an unpaid account (`payment_required`, no
  monthly allowance). Participation was already gated (`requireActiveMembership`).
- Still working as before: Join the Directory makes the account and goes to its own $11 or Partner checkout; a Guide's $11 makes
  the buyer a member; any $11 purchase admits (`ve_member_admit`). 12 unpaid accounts existed on 2026-10-27; they meet the
  Passport window at their next sign-in. "Free Passport" and "free account" left the site's words the same day.
- **The one other way in is an invitation on us** (Sean, same day: "I do want the ability to invite people to give a
  complimentary account with points of my choosing"): **Depot > Invites** (`/admin/depot/invites`; People in the Go to menu),
  one view at a time: the list by status (`#list/<status>`: Not sent yet, Sent, Opened, Joined, Expired, Canceled), **New invite**
  (`#new`: one person a line, "Name, email" with an optional number for that person's points; Points for everyone, 0 to
  100,000, quick picks None, 1,100, 2,500, 5,000, 10,000; a line from Sean that opens the email), and one invite (`#invite/<id>`:
  the email exactly as it goes, **Send it from me**, **Copy the link**, **Cancel it**). Nothing is sent until Send. The points are
  `universe_invites.points`, granted once at the claim through `ve_points_grant` (`comp_membership`, ref `invite:<id>`; migration
  `20261027_invite_points.sql`); the email and `/invite` say "on us, with N points to start". An email whose account never paid
  can be invited (they sign in on `/invite` to accept); a paid member is left out ("Already a member"). `ve-invites` `list` feeds
  the page; HQ > People makes the same invitations with `points`.

## Invites and free memberships (Sean, 2026-10-04)

Sean invites people who aren't confirmed yet (no account anywhere in the universe) from HQ > People
(super admins only): select people, Invite, pick the brand, what it points to (membership, a dinner
seat, the Community Manager role) and, per person, whether the membership is on us ("in recognition
of their work and contributions to the community"). Invites are made "Not sent yet"; HQ > People >
Invites sends them from Sean (or copies the link). From then they work once, for 30 days.

- Data: `universe_invites` (migration `20261004_universe_invites.sql`); `ve-invites` edge function
  (view and accept for `/invite?c=<code>`, and the admin actions HQ calls with
  `lesaruss_secrets.INVITES_KEY`). Each invite gets a personal tracked link (`ve_links`).
- Claiming: `universe_invite_claim()`, run when the invited email signs up (members insert triggers
  `trg_zz_universe_invite_*`), when they accept on `/invite`, or when they hold their dinner seat. A
  free membership opens everything an $11 Founding Membership does, with no points (Sean,
  2026-10-04: points come from contributing, which is how a free member is encouraged to give).
- Dinners: a dinner seat needs a free account (Hold my seat opens the account window). Depot > Dinner
  guests sets each guest's membership (on us by default) and holds the dinner's budget ($500 cap).
- Contribute any time: active members have a Contribute tile in the dashboard's Your tools and a Contribute link in the
  nav's account menu, both opening the same window (`/dashboard?contribute=1`; ve-entry-checkout, $11 or more). It left
  the dashboard header on 2026-10-26 (Sean: "we don't need it to be in that top part"). "Member since" (`entry_paid_at`) never moves for an active member. Always a
  contribution, never a tax-deductible donation.

## The homepage: launching January 1, 2027 (Sean, 2026-11-01)

"Make it a little bit more apparent that we're officially launching January 1st, 2027... right now is the best opportunity for you to
help steer the direction... locking yourself in as a founder... reviewed by our panel as a video on the homepage... a countdown clock to
January 1st, 2027. But the call to action to become a founding member for $11." The hero (`index.html`, `.hero-wrap`) keeps the rotating
city art and now holds: **Officially launching January 1, 2027**, "Help build the Vegan community's home base.", a line on building it
city by city and how to help, a **countdown** to 2027-01-01T05:00Z (midnight Eastern, `DEADLINE` in the page), **Become a Founding
Member · $11** (`/passport?from=home#/join`), Explore Now and the locked Founding line; beside it (above it on phones) the **video**.
After the deadline the countdown and Founding line hide themselves and the button reads Get your Passport · $11.
- **The video** (66 s, 1280 x 720): the script was written by Logan and revised by a five-person panel (first-time visitor, Vegan
  restaurant owner, skeptical non-Vegan, brand marketer, clarity editor); Liz narrates (el-media tts, her voice, "Veegan"), checked word
  for word with `stt`, over an ElevenLabs music bed, about -15 LUFS; title cards over the Guide banners and chapter art. File
  `vegan-media/media/home/launch-v1.mp4` (voice `launch-liz-v1.mp3`, bed `launch-bed-v1.mp3`); captions `public/home/launch-v1.vtt`
  (on by default), poster `public/home/launch-poster.jpg`. Nothing plays until Watch the video; playing pauses the city rotation and
  sends GA `video_start` / `video_complete`. A new cut is `launch-v2.mp4` with its own VTT; a script change is recorded again.

## Guide pricing, points and levels (LOCKED by Sean 2026-10-25, playbook `ve-pricing-points-passport`)

Concept session with V, locked by Sean: "lock it". This replaces Guide credits (canon `canon-ve-guide-pricing` v3, 2026-10-10).

- **$11 is the price of admission.** Any purchase of $11 or more makes the buyer a member: the Passport, a Guide, an event
  ticket or merchandise (`ve_member_admit`: `active`, `entry_paid_at`). After joining, members buy only what they want.
- **The Passport is $11 one time** (the Founding Membership, `ve-entry-checkout`) and comes with **1,100 welcome points**
  (`ve-stripe-webhook` `entry_contribution`, `ve_points_grant(member, 1100, 'welcome', 'welcome')`, once per member). Other ways
  in (a Guide, a ticket) give membership and the purchase, no welcome points. No monthly Passport is offered.
- **Founding Members close at midnight Eastern on January 1, 2027, and no more comps** (Sean, 2026-11-01: "I'm not going to comp
  anybody... your chance of becoming a founding member expires at midnight on January 1st... that's a thing that sits on your profile";
  migration `20261101_founding_member_deadline.sql`, playbook `ve-pricing-points-passport`). Anyone whose `entry_paid_at` is first set
  before `ve_founding_deadline()` (`ve_site_settings` `founding_member`, 2027-01-01T05:00Z) gets `founding_member` (trigger
  `trg_ve_founding_on_paid`; Guide accounts never); until that day only invitations set it, so paying members were unmarked (backfilled).
  Comps already given stay. **Built and live the same day** (migration `20261101_founding_words_no_comps.sql`; `ve-dashboard` v17 and
  `ve-invites` from commit 297fd8b, source sha256 matched):
  - **Give points** on the dashboard's member card (super admins): quick picks 111, 500, 1,100, 2,500, 5,000, an amount and why, a
    confirm, the last 10 gifts listed (`ve-dashboard` `give_points`: 1 to 100,000, `ve_points_grant` reason `admin_adjust`, ref
    `founder:<uuid>:<note>`, refused for super admins and Guide accounts; `member_card` `gifts`).
  - **Find a member** (Recent activity, first line, super admins): name, username or email, up to 20, an exact email first, Guide and
    quarantined accounts left out (`ve-dashboard` `member_search`); a pick opens their card. `wireFindMember` in center-console.
  - **The line**, "Founding Membership closes at midnight Eastern on January 1, 2027. Join before then and Founding Member stays on your
    profile for good.", on the Passport Guide (Overview and Get your Passport, `FOUNDING_LINE`), the $11 window (`VE_FOUNDING_OPEN` in
    `ve-auth.js`; after the deadline its title and button read Passport), `/policies#membership` (Founding Members), the Guides' facts
    and the saved answer When can I become a Founding Member? (What is a Founding Member? reworded; the two answers about a membership
    on us retired), the nav announcement, the dashboard welcome for non-members, the Founding Member and Ambassador invitation emails,
    their follow-ups and `/invite`, and Depot > Founding Members. Every one of them drops the line by itself after the deadline.
  - **The member's own dashboard reads `founding_member`**: the eyebrow says Founding Member, the plan Founding Member Passport and the
    welcome "Thank you for being a Founding Member." only when it is set; any other active member reads Member, Passport and "Thank you
    for being a member." (`ve-dashboard` `home` returns `founding_member` and `member_id`; `dashApplyFounding`).
  - **No comps in the Depot**: On us is gone from Invites (its plain kind is now An invitation to join, at $11), Founding Members and
    Ambassadors, and `ve-invites` `create` makes every founding, ambassador and plain invitation `comp` false while `founding_member.comps`
    is false (`compsAllowed`). Nonprofit and Group Partner leads keep the membership their locked canon gives; dinner seats and the
    Community Manager role keep their own choice for now (Sean's call).
  - **An Ambassador invitation without a comp** (Logan's default, Sean's to change): someone who has not paid says yes (`accepted`), pays
    the $11 on `/invite`, and on payment (`ve_founding_invite_paid`, through `universe_invite_claim`) becomes an Ambassador with the
    level, profile and the points Sean set (reason `admin_adjust`, ref `invite:<id>`, on top of the Passport's 1,100); a member who
    already paid becomes one at once. Founding Member comes only from paying before the deadline, never from an invitation. Proven
    2026-11-01 in a rolled-back transaction.
  - Still to do: Dani's recorded line on the Ambassador Guide's Your membership tab says the membership is on us (true for the comps
    already given, not for a paid Ambassador): new words and a new recording need Sean.
- **Every Guide is $11 or 1,100 points**, yours to keep (`ve_guides.access_rule = 'points'`, `cost_lesars` 1100;
  `ve-guide-unlock` `checkout` for $11, `unlock` for points; `ve_guide_purchase_paid` admits the buyer). Free Guides (the Welcome
  Guide, the Partner Guide) stay open to everyone.
- **Submitting or claiming a listing is $11 or 1,100 points, each one** (Sean, 2026-10-27, on claims: "it's like a guide or any
  other thing... If they come in as a business wanting to claim their listing, that's what their 1100 points is used for... they
  can ultimately decide not to use it for that thing and use it for something else"; `ve-claims` `start` takes `pay: 'points'` the
  same way, and Join the Directory shows Use your points on a claim too. However someone comes in, the $11 is what the 1,100
  points are for: the thing they came for, or anything else points buy. Sean, 2026-10-27, on listings: "you get 1100 points when you register. So you
  could use that for submitting your listing... if you want to submit multiple listings... 1100 points each time... or you can just
  pay for the listing"). Join the Directory's How to join, when adding a business, has **Use your points** beside the Partner plan and
  the $11 (the live balance from `ve-auth` `me`); `ve-claims` `listing_apply` `pay: 'points'` saves the application, then
  `ve_listing_submit_points(member, claim)` takes 1,100 from both balances once per application (`points_ledger` reason
  `listing_submit`, ref `claim:<id>`; migration `20261027_ve_listing_submit_points.sql`), and it waits in Depot > Claims like any
  application. The policy (`/policies#membership`), the Guides' facts and a saved answer say the same.
- **Super admins see every paid Guide unlocked** (Sean, 2026-10-30: "if I want to see how it looks otherwise, I can change my view"): `ve-guide-unlock` `access()` returns `via` `admin`; a View As preview sends no token, so The public or Member shows it locked.
- **Every purchase earns a flat 25-point thank-you** (`ve_purchase_thanks(member, ref)`, reason `purchase_thanks`, once per
  ref: `stripe:<session>`, `guide:<id>`, `tour:<order>`).
- **Points are given, never bought.** They come from taking part: Bounties, competitions and campaigns, the Daily Pulse, the
  Community Board, referrals. They unlock Guides, pay for Guide chat (4 a message) and can be **given to a business or
  nonprofit as a boost, never money** (`ve-votes` `contribute`, `ve_listing_contribute`, 1 to 10,000; the listing's total is
  `ve-votes` `points`, `ve_listing_points`; the Give box on every listing page).
- **Levels 1 to 4 on lifetime points** (`member_points.total_points`, which never goes down): Level 2 from 2,500, Level 3 from
  10,000, Level 4 from 25,000 (`ve_affiliate_levels.min_lifetime`, read by `ve_member_level`; the dashboard's `VE_LEVEL_AT`; change
  both together). Spending or giving points never lowers a level. Sean confirmed 2,500 and 10,000 on 2026-10-25; Level 4 came with
  the affiliate ladder (below), its 25,000 a default Logan set. A level the team sets (`members.level_override`) is the least they have.
- **Levels are the affiliate ladder** (Sean, 2026-10-28: "level one, with your link, you get points and allows you to level up
  quicker to level two, where you can start getting commissions... 20%... level three... 25%... level four... 30%, and we max out at
  30%... when they get level three... the guides now become open... route their commissions to a nonprofit of their choosing... So they
  get the credit for the donation"; migration `20261028_affiliate_levels.sql`, run through `ve-once-affiliate`, now the 410 stub). Every
  member's link is `/passport?ref=<referral_code>`. Level 1: 111 points when a friend becomes a member. **Level 2 gets the commission instead when the friend pays, but still the 111 points when the friend joins free by the survey door; Level 3 and up get both** (Sean, 2026-11-03: "they should get the 111 points if that person completes the survey"; `ve_referral_on_admit`, proven 2026-11-03 in a rolled-back transaction: a Level 2 sponsor got 111 points on a survey join and none extra on a paid join). Level 2: 20% of the Passport
  bought through the link; Level 3: 25%, and Guides bought with money too; Level 4: 30%, the top (`ve_affiliate_levels`: `rate_pct`,
  `products`, one row a level; change a rate or what a level opens there). Defaults Logan set, Sean's to change: the commission is a
  share of the $11 price (`sale_cents`), never of anything given on top; it counts for purchases by someone who joined with the link
  within 12 months of joining (`window_days`), at the referrer's level on the day; it waits 30 days for refunds (`hold_days`), then
  turns Ready (cron `ve-affiliate-release`, daily); it is paid once $25 is ready (`min_payout_cents`) and after a W-9 (the finance
  module's `finance_payees`, `finance_request_payout`, `finance_1099_list`); never on your own purchases or for a Guide account (all in
  `ve_site_settings` `affiliate_program`). `ve_affiliate_earn(buyer, product, product_ref, ref)` writes `ve_affiliate_commissions` (one
  row a sale, once per ref): the Passport from `ve-stripe-webhook` `entry_contribution` (first join only, ref `passport:<member>`), a
  Guide from `ve_guide_purchase_paid` (ref `guide:<member>:<guide>`). Statuses: pending, ready, paid, given, reversed (a refund, marked
  by hand for now). **Where it goes** (`members.affiliate_route` self | nonprofit, `affiliate_listing_id`): a member can send everything
  their link earns to a Nonprofit, Rescue or Sanctuary in the Directory, given in their name (we never call it tax-deductible to them).
  **Points and levels** (`/dashboard/levels`, `levels.html`, a Your tools tile and the Dashboard banner's Level; `ve-affiliate` `me`,
  `route`, `orgs`): Your level (the ladder, their progress, their link), How points come, What your link earned, Where it goes.
  **Depot > Ambassadors > Commissions** (`#commissions/<status>`; `ve-affiliate` `admin_list`, `admin_settle`, `admin_launch`): every
  commission, Mark paid / Mark given / Refunded, and **Launch it for members**. Until launched (`affiliate_program.live` false) members
  see only Your level and How points come, with no rates; super admins see it all marked Preview. Commissions are recorded either way.
  **Launched 2026-10-28** (Sean: "launch the affiliate program"; migration `20261028_affiliate_launch.sql`): `affiliate_program.live`
  true, the terms in `/policies#membership` (Your link and commissions, with the FTC rule that sharers say they earn, no spam or bidding on
  our name, rates may change going forward), the Guides' facts and a saved answer (Can I earn money from my link?), and a line in the Passport
  Guide's Bring people in and the Ambassador Guide's Your link.
- **Credits are retired.** `trg_ve_founding_credit` is dropped, `ve-guide-unlock` `buy_credits` answers 410, the dashboard's Buy
  Guide credits is gone. The credit tables and functions stay so history reads; no member held a credit on 2026-10-25.
- Points live in two places (`members.lesars_balance` and `member_points.available_points`); every points function moves both
  (`ve_points_grant` does). A new points function does the same.
- **A signed-out Vote goes to `/passport`** (`public/ve-votes.js`, the listing page), the **Passport Guide**: the Dairy Guide's
  layout, nine tabs (Overview, Find your places, Your community, Guides, Points and levels, What your $11 supports, Bring people
  in, For businesses, Get your Passport), a Guide's picture on each tab (`VEGuideArt` square), no clips, sign-up at the end.
  `?from=vote&back=<path>` shows the voting note and returns there after sign-in.
- **`/passport` is the one Passport** (Sean, 2026-10-25: "make sure that that version is the default version for passport... it does
  a better job than what we had before"). The nav's Join button, every Get your Passport button, the city hubs' Get Passport
  (`/passport?community=<slug>#/join`), the Directory, Explore, the path pages, login and the Guide gate all go there; `/join` (the
  old Get Your Passport page) and `/passport/join` forward to it. An invite code (`?ref=`) or a city (`?community=`) in the link is
  kept for the visit (`sessionStorage` `ve_join_ref`, `ve_join_community`) and sent with the sign-up window's signup
  (`public/ve-auth.js`), as `/join` used to. `/welcome` stays the guided tour (Start Your Journey); its last slide, Take your
  founding seat, now opens the Passport Guide instead of its own open contribution (Sean, 2026-10-25), members give more from the
  dashboard's Contribute, and the nav's announcement (`ve_nav_announcements`) reads "Your Passport: $11 one time, with 1,100 welcome
  points" and links to `/passport`.
- **The Passport is the Founding Member flow, four pages** (Sean, 2026-11-01: "bring this down to 4 total pages... Our focus is become a
  founding member before January 1st"; copy revised by the panel, approved by Sean before it went live): **Why now** (the cast; 13 chapters,
  $11 one time with 1,100 welcome points, the countdown, three step tiles with topic pictures, `TOPIC`), **What you can do** (Theo: vote,
  earn points with check-ins and bounties, give points, your first Guide covered by the welcome points, join your city, share your link),
  **Why join now** (Dani: shape it, Founding Member for good, keep your city growing, the locked line), **Get your Passport** (Liz).
  `FOUNDING` in `passport.html`. **Become a Founding Member · $11** sits under the Guide's words on every page (`#dgCta`), the Guide sits in
  the corner on phones (`ve-guide-corner.js`, `#dgRail`), and the header's $11 box is hidden on phones. A members-only prompt
  (`?from=vote|save|checkin|give|board|tickets`) lands on Why now with its note, never the checkout; old tab links land on the page that holds
  them (`OLD`). The nine-tab ensemble is the **Welcome Guide** at `/passport?guide=welcome` (`WELCOME`; the catalog card opens it).
  `/business` is unchanged. After the deadline the pages drop the countdown and the Founding words.
- Migration `20261025_ve_points_levels_admission.sql` (functions, contributions table) and `20261025_ve_guides_points_rule.sql`
  (Guides to points, the Guides' facts, saved answers, canon). What the Guides say about prices lives in
  `ve-guide-platform-facts` and `guide_kb_answers`; change them with this.

## Earn your Passport (LOCKED by Sean 2026-11-01, playbook `ve-pricing-points-passport`)

Concept session with V, locked by Sean: "lock it" (canon `canon-ve-earn-your-passport`; migration
`20261101_earn_your_passport_canon.sql`). **Parts 1 to 4 are built and live (below); 5 to 7 are not.** Sean: "people can earn their membership... not for what they did in the past,
but for what you're doing right now"; "I actually would prefer people to do that than pay the $11." Browsing stays free, taking part stays
the $11 Passport or a membership earned now; no free account that can take part, and comps stay ended (the Depot cannot give memberships).

- **The Taster account**: a name and email make it. It opens only the sampler Guide, their challenges, check-ins while a challenge runs and
  their own link; the rest of the site as signed out (no votes, posts, saves or points to spend). Finishing a challenge or paying the $11
  turns the same account into a membership. A Taster is "on the list", never a member.
- **The sampler, A Taste of Vegans Explore**: every Guide's free piece (B12, the Buttermilk swap, Hard Rock Stadium, FLL, tip 1, the free
  restaurant check) and what Vegans Explore is, the whole cast narrating, the For the animals side included; each page ends with "the rest
  of this Guide comes with your Passport". Three sign-up questions (what brings you, your city, your Vegan journey) pick the suggested Guide
  and chapter news. The Welcome Guide stays public.
- **Three challenges** (pick 1 to 3, Start, 30 days, one restart; every task proven like a bounty and approved): **Support Local** (3
  check-ins at Vegan places, one action each, I bought something at least once; in a stops month, 3 of the month's stops), **The Connector**
  (3 people join with the $11 through your link), **The Advocate** (a free event on the guest pass, a sanctuary or rescue visit or
  volunteering, a Fosters or Rescues share). Each is worth 1,100 points: one challenge pays the Passport; all three are a membership, 2,200
  points on top and Level 2 by lifetime points. A profile badge (working name Trailblazer).
- **The new check-in, for everyone**: after I'm here, What are you doing here today?: What I ordered (a photo, upload only while checked in),
  I bought something (a receipt, card number covered), Post it (an Instagram or TikTok link tagging the place and @vegansexplore), a
  shout-out (a positive prompt, read by a person first), and the bounties open there. Photos also reach the restaurant. Owners and staff earn
  nothing at their own place. Starting points (Sean's to change): check-in 10, meal photo 15, receipt 25, post 25, shout-out 10, capped per
  place per day.
- **Monthly Passport Challenge stops**: up to five featured businesses per chapter a month plus one free community stop (a sanctuary, rescue
  or nonprofit event). Slots open about six weeks ahead, locked by the 10th of the month before, no back-to-back when there is a waitlist,
  live on the 1st; the first check-in of the month pays the most. Pilot South Florida.
- **The business offer**: four $25 digital gift cards for a slot, a Promotion in the Vegan Restaurant Guide and on `/business` (five slots,
  the deadline, the ask, why, their card as it will look). It gives membership (Founding before January 1, 2027, paid in value) and covers
  the claim. The form is the agreement: promotional, $25 off, one per visit, no cash back, expiring 12 months after won, removed if the
  business closes, Florida law (the lawyer reads it once before the pilot). A two-day follow-up on the business's tracked link (not opened,
  opened not chosen, chosen), from the team, leftovers to the Inbox.
- **Cards and the Vault**: the card lives in the member's dashboard (logo, $25, their name, a code, expiry); staff redeem by typing the
  restaurant's short PIN on the member's phone, one use, the PIN changed when staff leave; owners see counts only. **The Vault is un-tabled**
  (it was tabled 2026-10-31 in BrandDesk): members bid points for a week, one win a month, only the winner pays; a public Vault page shows
  every prize by city, bidding for members; unwon cards stay up until won or expired.
- **The content gig** a month ahead per stop: a 15 to 30 second vertical owner clip and someone eating, cut into a reel, from an example page.
- **Points rule change**: a business may spend the points it has received on our services (Partner plan, BrandDesk, the shop, a Diplomat
  membership) at 1 cent a point, up to half the price, never cashed out ($25 off is 2,500 points). Replaces "a boost, never money".
- **Not-ready-yet emails** for Tasters: Day 0, 3, 7, 14, then the weekly Daily Pulse for their chapter; three December notes on the Founding
  deadline; at most one a week otherwise; London consent box; paying ends the track. Reuse the outreach people-list engine.
- **Build order (Logan)**: the check-in menu; the business sign-up, agreement, cards, PIN and Vault for the South Florida pilot; the Taster
  account and sampler; the challenges; the follow-ups and emails; the content gig; the business points rule.
- **Built and live 2026-11-01, parts 1 to 4** (parts 3 and 4 below them) (Sean: "Logan, build it"):
  - **1. The check-in menu** (migration `20261101_checkin_actions.sql`, `ve-checkin` from commit 8ce1037, source sha256 matched). After I'm
    here the listing opens **What are you doing here today?** (`openMenu` in `directory/listing.html`; the button reads Checked in · what
    now? and reopens it): What I ordered and I bought something (a photo shrunk to 1600 px, uploaded only while the check-in is open, private
    bucket `checkin-photos`), Post it (an Instagram or TikTok link), a shout-out (10 to 280 characters, a positive prompt) and the bounties
    open at that place (`check_listing_id`, `visit_listing_id`, `partner_listing_id`). One of each per check-in, open for `window_hours` (3)
    after I'm here; rows in `ve_checkin_actions` (RLS on, no policies). Nothing pays until the team approves it in **Depot > Check-ins**
    (`/admin/depot/checkins`, Directory in the Go to menu): Approve pays `ve_site_settings` `checkin_actions` (meal 15, receipt 25, post 25,
    shout-out 10) through `ve_points_grant` reason `checkin`, ref `checkin-action:<id>`; an approved shout-out shows on the listing under
    **What members say**. `ve_checkin_save` now returns `checkin_id` and pays an owner nothing at their own place, and `act` refuses them.
    `ve-checkin` actions `today`, `photo_start`, `act`, `review_list`, `review`.
  - **2. Passport Challenge stops, the cards and the Vault** (migrations `20261101_passport_challenge_stops_vault.sql`,
    `20261101_vault_owner_no_bid.sql`; edge function `ve-vault` from commit 3ea6ed1, sha256 matched). **`/business/challenge`**
    (`business/challenge.html`, `?listing=<slug>`, else a search): The offer (slots left in the chapter for the month still open: next month
    until the 10th, then the month after; the deadline; what they get), Your card (how it looks on a member's phone), The agreement (version
    2026-11-01: the terms, full name, a 4 to 6 digit staff PIN, I agree; an account is made at the button with `VE_ACTIVATE_HANDLER`, so no $11
    window), Sent. `ve_pc_slots` keeps the signature, IP, version and the PIN as sha256 of `<slot>:<pin>`; South Florida only
    (`passport_challenge.pilot_chapters`); the team and the business are emailed (a name with [TEST] sends nothing). **Depot > Passport
    Challenge stops** (`/admin/depot/challenge-stops`): by month and chapter, Pick them (up to five) or Not this month, each emailing the
    business, and Settle the Vault now. Picking (`ve_pc_slot_approve`) admits the signer (`ve_member_admit`, Founding before 2027-01-01 by
    `entry_paid_at`), makes them the listing's owner when nobody owns it (claim `verified`) and makes four `ve_vault_cards` that open on the
    1st at midnight Eastern with a week's bidding. **`/vault`** (`vault/index.html`, public): cards by chapter, the top bid and time left,
    Bid for members (`ve_vault_bid`: at least 100 points, above their own last bid, within their balance, never on their own place's cards),
    Your cards (the code, Good until, and **Use this card**: staff type the PIN on the member's phone, used once), and the stops. Cron
    `ve-vault-settle` (every 15 minutes, `ve_vault_settle`): opens cards on their day, gives a closed auction to the highest bid (earliest on a
    tie) whose member is active, still has the points and has not won this month, takes the points then (`points_ledger` reason
    `redemption`, ref `vault:<card>`), sets a code and an expiry 12 months out; no winner, another week. The Vegan Restaurant Guide's
    Promotions has **Be a Passport Challenge stop** (Live, Get started opens `/business/challenge`). Proven 2026-11-01 on Love Life Cafe with
    the Logan test account and Sean's (every guard, a pick, the claim, cards opened early, bids, a settle charging only the winner, a wrong and
    a right PIN, a second use and a second win in a month refused, owner bidding refused, the pages in a browser), then every row removed and
    Love Life Cafe put back unclaimed.
  - **3. The Taster account and A Taste of Vegans Explore** (built and live 2026-11-01, Sean: "go ahead with part 3"; migration
    `20261101_taster_accounts.sql`, edge function `ve-taster` from commit 58447de, sha256 matched). **A Taster is not a `members` row**: an
    unpaid members row would make ve-auth refuse their real sign-up later ("An account with that email already exists"), so a Taster is a
    `ve_tasters` row (email, name, the three answers, `suggested_guide`, `consent_basis` notice or checkbox, `confirmed_at` when they open the
    emailed link, `unsubscribed_at`; RLS on, no policies), and trigger `trg_ve_taster_link` links it (`member_id`, `converted_at`) the moment
    the same email becomes an active member. Their **Taster key** is a 400-day HMAC token signed with a different secret (bytes 32 to 64 of
    the service key), kept in `localStorage` `ve_taster`, so no member function ever takes it for a member session. **`/guides/taste`**
    (`guides/taste.html`, indexed, in the sitemap, a Free card first in the Guide catalog after the Welcome Guide): the sign-up in two steps
    (`?step=`: name and email; what brings you, your city, your Vegan journey; London asks for the unticked box, everywhere else a plain line
    says they will get our emails), then the sampler in the guided view, ten slides: the cast's hello, Maya's Buttermilk swap, Theo's B12,
    Liz's free restaurant check, River's Hard Rock Stadium, Nori's Fort Lauderdale airport, Kai's creator tip 1, Dani's animals (rescues and
    sanctuaries, the Fosters board, the Nonprofit Guide's tip 1), Pascal's city (their chapter's hub, Pulse and events), and Picked for you
    (the suggested Guide, Earn your Passport coming, the $11 with the Founding deadline line). Each Guide slide ends "The rest of this Guide
    comes with your Passport." A returning Taster or a signed-in member goes straight to the sampler. Day 0's email (from Vegans Explore,
    reply to contact@lesaruss.com, `List-Unsubscribe`) carries `/guides/taste?t=<key>`, which signs them in on any device and confirms the
    email; `?unsub=<key>` stops our emails. An email that belongs to a member is told to sign in; joining again within a minute is refused;
    a name with [TEST] sends no email. `ve-taster` actions `join`, `me`, `confirm`, `unsubscribe`, `admin_list` (super admins). Proven
    2026-11-01 (every guard, a forged key, a member key in its place and the Taster key at `ve-dashboard` all refused, the link on conversion
    in a rolled-back transaction, the page on desktop and phone), then the test rows removed.
  - **4. The three challenges** (built and live 2026-11-01, Sean: "continue Earn your Passport"; migration
    `20261101_earn_your_passport_challenges.sql`, applied through the one-time `ve-once-challenges`, now the 410 stub; edge function `ve-challenge`
    and `ve-checkin` from commit 9825760, sha256 matched). **`/challenges`** (`challenges/index.html`, indexed, in the sitemap; the Taste's Picked
    for you links it): Support Local, The Connector and The Advocate as three cards, Start, 30 days each, one restart (`#c/<kind>`, `#c/advocate/<task>`).
    **Start makes the account**: a Taster whose email is confirmed (their Taster key, `localStorage` `ve_taster`; `/challenges?t=<key>` confirms like
    the Taste link) gets a `members` row waiting on its Passport (`pending_payment`, no password, `email_verified`, their chapter as home;
    `ve_tasters.account_id`) and a session the page keeps apart from the site's sign-in (`localStorage` `ve_challenge_token`), so the rest of the site
    still treats them as signed out. The Taster key opens that account again on another device only while it is not a member and has no password;
    after that they sign in (once a member, **Set your password** on the page, `set_password`, or Continue with Google). An unpaid account signs in
    with its own token; a member who paid the $11 is told the challenges are not for them (`ve_challenger_ok`; a member through a challenge can do the
    other two). **Support Local** (on the page: Find places near me, the food places with How Vegan set within 400 m, check in through `ve-checkin`,
    then the check-in menu right there): 3 food places (Restaurants, Bakeries & Cafes, Food Trucks, Vendors, Catering, Meal Prep, Markets), each with at
    least one menu item approved in Depot > Check-ins, and one approved receipt; in a month when their chapter has Passport Challenge stops, only
    those stops count. A challenger's check-ins and menu items pay 0 points (`ve_checkin_save` `p_pay`; an approval pays only an active member); the
    Depot marks them Challenge, no points. **The Connector**: 3 friends who signed up with their `/r/<code>` link and paid during the 30 days (a friend
    who earned their membership does not count). **The Advocate**: a free event from our calendar with a photo (a guest pass checked in at the door
    counts on its own), a sanctuary, rescue or animal nonprofit with a photo (the phone's distance kept when shared), and a share of a Fosters or
    Rescues post or a rescue or sanctuary page (the link to where they shared it); proofs in the private bucket `challenge-proofs`. **Settling**
    (`ve_challenge_progress`, `ve_challenge_settle`; on every read, on each approval and by cron `ve-challenge-sweep` every 15 minutes): met, the
    challenge is done and pays 1,100 (`points_ledger` reason `challenge`, ref `challenge:<id>`); the first one finished by someone not yet a member
    spends those points on the Passport (`challenge_passport`, so lifetime points keep them) and `ve_member_admit` makes them a member (Founding
    before the deadline, the Taster linked); each one after adds 1,100 to spend; all three set `members.trailblazer_at` (the Trailblazer badge, on
    the page). Out of time, it is Time ran out; Restart gives 30 more days once, approved work kept. **Depot > Challenges** (`/admin/depot/challenges`,
    People in the Go to menu): Proofs waiting / Approved / Not approved (Approve, Not approved with a note they see) and Running / Done / Time ran out
    with each one's progress. `ve-challenge` actions `state`, `start`, `restart`, `nearby`, `pick`, `proof_start`, `proof`, `set_password`,
    `admin_list`, `proof_list`, `proof_review` (super admins or the ops token); `ve-checkin` `review_list` and `review` take the ops token too.
    Amounts and days in `ve_site_settings` `challenges`. Logan's defaults, Sean's to change: who may take them, food places only, the restart keeping
    approved work, the share counting a rescue's page (the Fosters and Rescues boards had no posts yet), and no check-in points for challengers.
    **Proven live 2026-11-01** with [TEST] Tasters: Start refused before the email was confirmed and a forged key refused; the account made at Start;
    a check-in 11.7 km away refused, three at 0 points, a bad post link refused, a receipt photo uploaded, the menu approved through `ve-checkin` with
    the ops token, and Support Local finished on the last approval (member, Founding, 1,100 lifetime and 0 to spend, Taster linked); the Taster key
    then refused (sign in); The Advocate with a photo missing and a vegansexplore.com link refused, a share declined, sent again and approved, done
    for +1,100; a running challenge refused a restart, an expired one restarted once and refused a second; the password set and `ve-auth` login
    working; in a rolled-back transaction The Connector stayed open at 2 paid friends with 1 unpaid and finished at 3, all three gave Trailblazer
    and 3,633 lifetime points (Level 2), an expired challenge closed, and a paid member was refused. `/challenges` on desktop and an iPhone (no
    errors, no sideways scroll) and Depot > Challenges in the dashboard frame; then every row and test photo removed.
  - **5. The business offer, its follow-up and the not-ready-yet emails** (built and live 2026-11-01, Sean: "Approved, go with your defaults
    and build it"; migration `20261101_earn_your_passport_emails.sql`; edge function `ve-nurture` from commit 6cff6e0, sha256 matched;
    `ve-vault` from 91c8c26). **Off until Sean turns each on** (`ve_site_settings` `nurture`: `offers_on`, `tasters_on`; the switches are on
    the two Depot pages below). **They send through HQ's email system** (Sean, 2026-11-01: "where is this living? Do we have an email
    system in the HQ?"; they first called Resend directly, fixed the same day): every one goes through `email-send`, brand `vegans-explore`
    (VEGANS EXPLORE <hello@mail.lesaruss.ai>, replies to contact@lesaruss.com), signed Vegans Explore team, never Sean's name, with the
    brand's one-click unsubscribe, the postal address, its suppressions and an `email_sends` row. Each email is one campaign (`refOf`:
    `ve-pc-offer-<YYYY-MM>`, `ve-pc-still-open-<YYYY-MM>`, `ve-pc-what-it-costs-<YYYY-MM>`, `ve-taster-day-3|7|14`,
    `ve-taster-pulse-<date>`, `ve-taster-founding-<date>`), registered in `email_campaigns` as an automatic campaign (status sent, so
    `email-dispatch` never picks it up) on its first real send, so **HQ > Email** lists it with delivered, opened and clicked. Send me a
    test goes through `email-send` `test_to`. Not moved yet: the Taster's Day 0 email (`ve-taster`) and the stop emails in `ve-vault`
    still call Resend directly. **The business offer**: Depot > Passport Challenge stops > **Offers
    we send** (`#offers[/<status>]`, `#offers/new`, `#offers/preview/<kind>[:<offer>]`): New offer (a listing, their email, a name) makes a
    `ve_pc_offers` row and its own tracked link (`ve_links` `pc-<8>`, initiative `passport-challenge-offer`, to `/business/challenge?listing=`);
    **Send it** sends email A ("Be a Passport Challenge stop in <month>") by hand, always. Two days later, on a weekday from 10 AM Eastern
    and only with `offers_on`, one follow-up goes on its own to every business that has not applied, "<Month> Passport Challenge stops in <chapter>"
    (worded by the review panel: no guess at why they have not answered, the deal in one line, greeting the contact by first name or Hello).
    An application (`ve_pc_slots` after the send) makes it **Applied**; nothing two days
    after the follow-up makes it **In the Inbox** (`routed`, a `pc_offer` row of `ve_inbox_items` for the chapter's Community Manager).
    **Stop these emails** (`/business/challenge?stop=<code>`, `offer_stop`) stops it and adds an `email_suppressions` row. The apply
    confirmation is now email D ("You applied to be a <month> stop", three next steps; `ve-vault`). **Taster emails**: Depot > Challenges >
    **Taster emails** (`#emails`, `#emails/preview:<kind>[:<taster>]`): with `tasters_on`, from 10 AM Eastern, Day 3 (this week in their
    city: events, new places, the Pulse topic; `ve_nurture_city_week`), Day 7 (an episode that fits why they came, `ve_nurture_story`), Day 14
    (their suggested Guide), then the Daily Pulse every Thursday (`ve_nurture_pulse`, never two emails within six days), and on December 1,
    18 and 30 the Founding deadline notes; one row per Taster and email in `ve_taster_emails`, claimed before sending. Paying, earning a
    membership, a [TEST] name, a suppression or `?unsub=<key>` ends the track. Cron `ve-nurture` (every 15 minutes, `tick`, x-cron-secret).
    Send me a test on every preview. Actions `tick`, `settings`, `offers`, `offer_create`, `offer_send`, `offer_cancel`, `offer_stop`
    (public), `preview`, `test`, `tasters`. Logan's defaults, Sean's to change: the sender and signature, 10 AM, weekdays for businesses,
    Thursdays, the December dates. **Proven live 2026-11-01** (outside sending hours, switches off): every preview, a bad email and a second
    offer to the same business refused, the tick refused without its secret and the admin actions without a super admin; two [TEST] offers
    sent (no email), a test application made one Applied and a backdated one went to the Inbox on the cron-secret tick (checked in a
    rolled-back transaction, since test offers stay out of it); its stop link stopped it and wrote the suppression, a bad code 404; both Depot
    views on desktop and iPhone, no errors; every test row removed. Not yet proven: a real follow-up and a real Taster email going out (the
    first window after a switch is turned on).
    **Sean's review of the tests, 2026-11-02** (Sean: "go"; migration `20261102_nurture_fixes.sql`; `ve-nurture` version 5 from 85710a0,
    sha256 matched): **Day 14** says why they got it ("When you signed up for A Taste of Vegans Explore, you told us you're here for ...
    That points to <Guide>"), a line on what the Guide does (`GUIDE_LINE`) and that they tried a piece in their Taste. **Day 7** opens the
    episode on its show's own listing (`/directory/<show>?ep=<guid>`, where they vote and save; `ve_nurture_story` now takes only episodes in
    `ve_pulse_episode_map`), never the Pulse article or a video. **The December notes** say "It's $11, one time. Or earn it free: finish one
    of our three challenges within 30 days (check in at Vegan places, bring three friends, or show up for the animals)." **Email C ("What a
    stop really costs") is dropped** as presumptive. **The weekly Daily Pulse is opt-in**: Day 14 ends with "Want your city's Daily Pulse
    every Thursday? Yes, send it", opening `/guides/taste?pulse=<key>` (`ve-nurture` `pulse_optin`, public with the Taster key, sets
    `ve_tasters.pulse_opt_in_at`); only those Tasters get it. The December notes still go to every Taster. **`/business/challenge`**: Liz on
    each of the three steps, her picture and her voice with Play (nothing plays until pressed, then each step plays its line until Pause,
    `sessionStorage` `pc_liz`; `LIZ` in the page, `vegan-media/media/liz/passport-challenge/pc-offer|card|agree-v1.mp3`, el-media tts in her
    profile voice, each checked word for word with stt; a line's text must match its recording), and **Your card** runs full width. Fresh
    [Test] copies of all nine sent to contact@lesaruss.com. Lesson: a find-and-replace on `not_opened` matched refOf's line first and cut
    out the send functions; a syntax check does not catch a missing name, so type-check an edge function (`tsc --noEmit`) before deploying.
    A [TEST] Taster ("Sean [TEST]") is kept so the test Day 14's Yes link works; it is never sent to (the tick skips [TEST] names). Next, as
    its own build: email preferences in My Account for members.
    **Then, the same evening** (Sean: "just have the episode, literally the episode isolated by itself there... the horizontal podcast
    episode, like where we have in the listings... and then we could have the text below"): Day 7's button, **Play the episode**, opens
    **`/listen?show=<listing slug>&ep=<feed guid>`** (`listen.html`, `noindex`): the show's name, the episode row (`VEEpisodes.row`: the
    show's art, Play in the player docked above it, Save, **Vote for the show** with its count through `VEVotes`), the episode's notes from
    the feed under About this episode, and Every episode of the show. `ve-nurture` version 6 from 38a5438. Any episode of any show in the
    Directory opens there; use it wherever we send one episode (emails, the Pulse).
  - **The Taste page is the Welcome Guide's shell** (rebuilt 2026-11-02 under the template gate; Sean: "we haven't made something like this in months... We need a system"): `/guides/taste` copies `passport.html`'s Guide layout and CSS (the tabs are the tour, a Guide on the right of each tab with their words, Back / N of M / Next, the joinbox reading Free). Ten tabs (`#/<tab>`): Overview (the cast), Dairy swaps (Maya, the Buttermilk swap), Nutrition (Theo, B12), Game day (River, Hard Rock Stadium), Travel (Nori, FLL), The animals (Dani), Your city (Pascal, their chapter), Restaurants (Liz, the free check), Creators (Kai, tip 1 word for word from `cg-public`), and **Get your taste** (the two-step sign-up, `ve-taster` `join` as before), which becomes **Picked for you** (the video, their Guide, the challenges, the Passport) once they have their taste. Until then each Guide's tab is locked the Dairy Guide way (`gated()`: the piece blurred, a card on top, Get my free taste; never over a picture with a face). `?t=`, `?unsub=`, `?pulse=` and old `?step=` links still work. **Panel pass, 2026-11-02** (Sean: "go"): only our own pieces are locked (B12, Creator tip 1); the Buttermilk swap is open to everyone, and anything already public (Hard Rock, FLL, the restaurant check, the city and animal links) is never blurred. Tabs are named for what is in them, one green button a screen (Open all 8 free pieces in the header; the rail's button only on phones), the email terms under the email field, Nothing is charged said once, the Founding deadline before sign-up, each Guide's tab ending "Get the full <Guide> for $11, or open it with the 1,100 welcome points that come with the Passport, our $11 membership", Picked for you leading with the Passport and the challenges under it, and after sign-up a business lands on Restaurant check, a creator on Creator tip 1, animals on The animals, everyone else on Vitamin B12. The Guides' lines are text drafts for Sean. `nurture.tasters_on` turned on the same day (Sean: "You need to turn something on"), so Day 3, 7 and 14 and the opted-in Pulse go out to Tasters from 10 AM Eastern.
  - **Still to build**: 6. the content gig, 7. the business points rule.

## Three doors, one Welcome, campaigns on people (LOCKED by Sean 2026-11-03, playbooks `ve-pathways`, `ve-pricing-points-passport`)

Concept session with V, locked by Sean: "we can lock it" (canon `canon-ve-people-campaigns-doors`; migration
`20261103_people_campaigns_doors_canon.sql`; the full write-up, build order and open question are
`docs/proposals/people-campaigns-doors.md`: read it before building any of this). **Built so far (below): the member card, the survey door, Pulse subscribe (dark) and the people sender. Not built: the updated Welcome, profiles with groups, campaign homes.**
Sean: "people don't have to pay to get in, but they do have to show some effort."

- **Three doors, no comps**: a free **Daily Pulse subscription** (an email; cities picked; not a membership); the **survey**
  (membership, full access, 250 points); the **$11** (membership, full access, 1,100 points). Bonus points are given by hand from a
  member's card. **Founding Member (Sean, 2026-11-03: "Yes, anyone who becomes a member before January is a founding member.")**: either door, before midnight Eastern on 2027-01-01, makes a Founding Member (the survey door too, not only the $11).
- **One Welcome**: the Welcome, the Passport and the Taste merge into one free, public guide that explains how to use Vegans
  Explore and ends with the two paths. The Taster account type goes away; `ve-taster`, `/guides/taste` and the Taster emails keep
  working until then, and Pulse subscribers get no Taster sequence.
- **Pulse subscribe** (first to build): a box on every Pulse page and article, a desktop-only exit pop-up once per visitor per 30
  days, double opt-in, daily or weekly per city, a short issue with a From Vegans Explore slot for campaigns.
- **Campaigns on people**: a person enters a campaign on a real action, with a source (banner, Pulse, email, form) and a stage
  (Noticed, Interested, Committed); default follow-up Day 0, 3, 7, 14; a two-week calendar approved once; a campaign lives in
  BrandDesk (its Plan tab becomes **Playbook**) with Overview, People, Assets, Messages, Playbook, Results.
- **The people sender** (BCPS Marcom's way, rebuilt on Depot > Outreach): pick people and make drafts, Sent / Opened / Clicked on
  every row and a campaign table, then a week view. Nothing sends until Sean approves each message.
- **Built 2026-11-03**: the dashboard's member card opens from a Recent Members, Votes, Leads, Leaderboard or Inbox picture or name
  (Recent Members lists only Vegans Explore members, `identity_source` `members`), and **Take back** points sits beside Give
  (`ve_points_take`, `ve-dashboard` `take_points`: spendable only, never lifetime, never below zero, a reason required, once per
  ref). The button was proven in the database, not yet clicked in a browser. Hover rings are no longer clipped in the dashboard's
  scrolling boxes.
- **The survey door, built 2026-11-03** (Sean: "move forward"; migration `20261103_survey_door.sql`, applied through the one-time `ve-once-survey-door`,
  now the 410 stub). An account waiting on its Passport (`pending_payment`) opens `/survey?door=1` (the join window's **Take the survey instead - free**),
  `ve-mission-survey` `door_start` (`ve_survey_door_start`) sets `members.survey_door_at`, and `ve_profile_answer` then accepts its answers (it refused anyone
  not active before). Each answer pays its points as always (250 in all, the survey's own, never the 1,100); the last one admits the account
  (`ve_survey_door_admit`: `membership_status` active, `entry_via` `survey`, `entry_paid_at` stays null, since nothing was paid). **Founding**:
  `ve_founding_on_paid` now also fires when a survey door account turns active before `ve_founding_deadline()`; the brand membership is its own kind,
  `survey` (not a comp). `ve_referral_on_admit` already pays the sharer 111 points for a join with no payment (Level 2 gets the commission only on a payment).
  `members.entry_via` is `passport` for everyone who paid (backfilled) and `survey` here; older comps are null. Proven 2026-11-03 in a rolled-back transaction
  (refused before the door, 250 of 250 admits, active, `survey`, no `entry_paid_at`, Founding, brand membership `survey`). Wording: the join window, the Passport's
  Get your Passport tab, `/policies#membership`, `ve-guide-platform-facts` (`knowledge_records` `body.facts`, its old 30% top rate and "everyone joins with the $11"
  fixed) and six saved answers. **Not yet**: the page checked in a browser as an unpaid account, `/claim` and the pages with their own join step (`VE_ACTIVATE_HANDLER`)
  do not offer the survey, nothing stops one person making many unpaid accounts to farm the 111-point referral (Sean's call), and the three challenges are not retired.
- **The survey door waits for a person, built and live 2026-11-03** (playbook `ve-pathways`; Sean: "Yes, go with your defaults on the review gate"; migration `20261103_survey_review_gate.sql`; `ve-mission-survey` from 751dbd0, sha256 matched). **Replaces "the last answer admits".** An account on the survey door saves its answers but they pay nothing yet (held); with all 31 answered it can **Finalize** (`finalize`, `ve_survey_finalize`: `survey_review` `pending`, `survey_submitted_at`, emails contact@lesaruss.com), after which answers are locked (`under_review`). A super admin approves or sends back in **Depot > Profiles > Waiting for review** (`#review`, `#r/<id>`; `review_list`, `review_decide`): **Approve** pays every answer's points once, makes the account active (`entry_via` survey) and emails the member; **Send back** needs a note the member reads and emails it, and they edit and finalize again. **Founding Member follows the day they finalized** (`survey_submitted_at` before the deadline), not the day we approve; the $11 path is unchanged. Active members' answers still pay at once; a Guide's own survey (`ve_survey_answer`) is unchanged. **The questionnaire** (`public/ve-mission-survey.js`): a progress line (question N of 31, answered count; no time-left estimate, Sean 2026-11-04), **Save and exit** beside Save and next, an exclusive **None apply** on multi-select questions (q8, q9, q11, q16, q23, q24), q12 asks 100% Vegan, Vegan options or Vegan friendly, q15 searches the Directory as they type (`place_search`) and a name that matches nothing is saved as a lead (`place_lead`: a quarantined listing, `crawl_source` `survey-suggestion`, plus a `ve_backlog_checks` row, so it shows in Depot > Business outreach > New places; 15 a day), the page scrolls to the top after Next and `survey.html` reports its height to the dashboard frame, and a finished survey opens a review page (answers listed with Edit, **Finalize**) then a pending page. A video slot exists (`opts.video`, `opts.poster`); **no video is recorded** (Sean's call). Proven live 2026-11-03 through the one-time `ve-once-survey-review-proof` (now the 410 stub) as Test Manager: save 250 of 250, finalize, a second finalize, an answer refused while pending, a non-admin refused the list, send back refused without a note and sent with one (email sent), answers editable again and refinalized, place search, a lead made and a repeat known, no points paid; Test Manager and the lead rows restored and removed. **Not proven**: approve and its email on a live account (the approve function was proven in a rolled-back transaction), the pages were checked in a browser at 1440 and 390 px against mocked answers only (no overflow, no script errors: question view, places dropdown, review, pending, sent-back, Depot one-person view); a signed-in run as a real unpaid account on the deployed site is still unproven. Live on main 3ea172c (Vercel READY, 2026-11-04).
- **Pulse subscribe, built 2026-11-03 and deployed, dark** (commit e3348b1, migration `20261103_pulse_subscribe.sql`, `ve-pulse-subscribe` v2, cron `ve-pulse-subscribe` every 15 minutes, `public/ve-pulse-subscribe.js`, `pulse-preferences.html`): the subscribe box and desktop exit pop-up on `pulse.html` and `api/pulse-article.js`, double opt-in, daily or weekly per city (up to 3), a subscriber is a `ve_tasters` row with source `pulse-subscribe` and the Taster sequence skips it; sends through `email-send` brand `vegans-explore`. **Shown and sent only while `ve_site_settings` `pulse_subscribe.on` is true: it is false, with 0 subscribers.** Checked live 2026-11-03: status `open:false`, subscribe `not_open`, counts `forbidden` without an admin, `/pulse` and `/pulse-preferences` answer 200. **Not proven**: a real subscribe, confirm and first send, and the issue preview and test (super admin only). Sean previews the issue and turns it on.
- **The people sender, built 2026-11-03** (playbook `ve-pathways`; `ve-people-outreach` v7 from c5e3e981, source sha256 matched; PRs #138 and #139), on Depot > Outreach: **Pick people** (`pick`: `ve_founding_candidates`, HQ People with an email and unpaid accounts, no members, no one invited, nobody suppressed, Tasters not in it; search, a pool filter, tick, a pager; each shows where they already stand in a campaign), **Write the drafts** (`draft_batch`: a bucket, a campaign name, a day, a subject and a message; `{first_name}` filled in; one draft each, status draft and personal, never approved here; a person already in that campaign, suppressed or picked twice is skipped and listed; any link must be a tracked vegansexplore.com `/go/` link; `{link}` with a destination makes each person's own `ve_links` link, `pp-<code>`, initiative the campaign, so a click names them, and Send me a test swaps it for the page so a test never counts), **Campaigns** (`campaigns`, `campaign`: people, needs you, scheduled, sent, opened, clicked, bounced, open rate against sent and click rate against sent plus done by hand; a click counts only on a message sent or done, since the first version counted drafts and read 300%; opens are the email system's, so a floor) with Opened, Clicked and Bounced chips on every row, and the **Week** view (`week`, `move`, `approve_range`: Monday to Friday, buckets as colors and labels, drag a message to another day or use its Move menu, a moved message goes back to Needs you and gets its new day's time when approved again, **Approve the day** and **Approve the week** behind a confirm, email drafts from today only, each through the same checks as one approval via `approveMessage`, any that fail left and listed). Proven live with made-up 2099 drafts, then removed (approve scheduled it for 10 AM Eastern on its day, move after approve returned it to Needs you, a past day refused, a non-/go/ link refused, `{link}` with no destination refused). **Not proven**: a real pick and draft run as Sean in the browser (the page was checked at 1440 and 390 px against mocked answers; dragging was not clicked). **Not built**: sources beyond unpaid accounts and the HQ People pool, a campaign filter on the week view, replied and joined counts.
- **The updated Welcome, built 2026-11-03, on a branch, not yet on `main`** (playbook `ve-pathways`; `passport.html`, no migration). `/passport` is now the one Welcome: free and public,
  the Passport Guide's shell with its nine tabs (Overview, Find your places, Your city, Guides, Points and levels, What it supports, Bring people in, For businesses,
  **Enter the room**), each tab a different Guide (all eight once, their lines text drafts), the header box reading **Free to look around** with Enter the room. It replaces
  the four Founding Member pages; `?guide=welcome`, `#/can` and `#/now` still land on it. Rewritten to match the site as it is (the search box, the Directory's sections,
  the Daily Pulse and its boards, Share, four levels, the survey's 250 points beside the $11's 1,100). **Guides** has **Try a piece of each, free** (the Buttermilk swap, B12,
  Hard Rock Stadium, Fort Lauderdale, the free restaurant check, Creator tip 1, Nonprofit tip 1, each straight to its free page: no sign-up), which is what the Taste was.
  **Enter the room** is the two paths as equal cards: **Take the survey** (`/survey?door=1`, which makes the free account for a signed-out visitor) and **Get your Passport · $11**
  (the sign-up and $11 window as before), with the Founding line saying either door before January 1, 2027 makes a Founding Member; a member sees You are in and their dashboard.
  A members-only prompt (`?from=vote|save|checkin|give|board|tickets`) still lands on the Overview with its note, now naming both ways. `/business` is the same file with its own tabs and
  was checked unchanged. **Taster and challenges retired the same day** (Sean: "Go retire the Taster and challenges"; migration `20261103_retire_taster_challenges.sql`): `nurture.tasters_on` false (the Events Guide's `door_on` notes untouched), `/guides/taste` and `/challenges` redirect to `/passport` (`/guides/taste?unsub=` still opens, so an old unsubscribe link works), both left the Guide catalog and the sitemap. Nothing deleted: `ve_tasters`, `ve_challenges`, Depot > Challenges and the `ve-taster` and `ve-challenge` functions stay (one test Taster, no challenge existed); a direct call to their start actions still works, since no function was changed. **Not done**: the
  40-second video on Enter the room (`next-v1`) still says Passport, a new cut is Sean's call; the Passport Guide's old four-page copy lives only in git history.
- **Profiles with groups, step 1 built 2026-11-03** (playbook `ve-pathways`; Sean: "Go with your recommendation on all four"; migration `20261103_people_tags.sql`, applied; nothing on a page yet).
  The proposal's **group** is called a **tag** so it never clashes with community groups (`ve_group_*`). **Only people we have touched get a profile**, keyed as Depot > Outreach keys them
  (`ve_people_outreach.person_key`: a lower-case email, `ig:<handle>`, or a key we set); the profile page is step 2, pick-by-tag step 3. `ve_tags` (seeded: Sponsor interested `sponsor-interested`,
  Vendor, Volunteer, Pre-ticket `pre-ticket`; Logan's list, Sean's to change), `ve_person_tags` (one row a person and tag, `source` hand or rule, who and when; **taking one off keeps the row with
  a reason, `removed_at`**, so history reads and **a rule never puts it back**; adding it by hand does) and `ve_tag_rules` (kind `link_click`, `match` any of `initiative_slug`, `tag`,
  `code_prefix`, all must match, an empty match matches nobody; **every rule starts off**). All RLS on, no policies; the functions are service role only: `ve_tag_add`, `ve_tag_remove` (a note
  required), `ve_tag_rule_matches(rule)` and `ve_tag_rules_run(apply)`, which with `apply` false only reports who each rule **would** tag (a log-only preview, on or off) and with `apply` true tags
  for rules that are on. Cron `ve-tag-rules` (every 15 minutes) applies only rules that are on, so it does nothing until Sean turns a rule on. No rule exists yet; the first (clicks on the sponsor
  ad tag Sponsor interested) waits for a real sponsor link. Proven 2026-11-03 in rolled-back transactions as Test Manager: preview with the rule off, applying while off tagged nobody, on tagged the one
  matching person and nobody for the empty rule, a second run added none, remove with no note refused, a removed tag not rebuilt by a rule and put back by hand, a bad tag refused. **Not built**:
  rule editing in the Depot (rules are rows; every one is off).
- **Profiles step 2, the person page, built and live 2026-11-03** (playbook `ve-pathways`; main merge pending; `ve-person-profile` v1 from 8d6a5c9, verify_jwt off, super admin token checked inside, or the ops token with `as_member`;
  `admin/depot/people.html`, **Depot > People > People** in the Go to menu, copying the Watchlist's shell). **List** (`#list/<tag>`): everyone we have touched (a `person_key` on a Depot > Outreach message, or an active tag), search over name,
  email, handle and organization, the tag as chips, each card with its tags and last contact. **A person** (`#person/<key>`, the key URL-encoded): one timeline, newest first (every email and message sent, drafted or done by hand with its
  campaign, opened and bounced from `email_events`, a click on their tracked link, the other emails we sent that address from `email_sends`, actions from `ve_initiative_interest`, tag adds and removals, notes, and a member's points ledger), then
  who they are (the member found by email: how and when they joined, Founding, chapter, standing), **tags** (add with an optional reason; take off with a required reason; a removed tag stays in the history and a rule never puts it back, a hand add does),
  **notes** (`ve_people_outreach_notes`, the same ones Depot > Outreach shows) and, for a member who is not a super admin or a Guide, **Give** and **Take back** points (the same `ve_points_grant` and `ve_points_take` as the dashboard's member card, a
  reason required, spendable only on take back). Actions `list`, `get`, `tags`, `tag_add`, `tag_remove`, `note_add`, `give_points`, `take_points`. A person with no outreach rows, tags or notes who is not a member answers 404. Limit: a person whose only
  record is a removed tag drops out of the list (they still open by address). Proven live 2026-11-03 through the one-time `ve-once-person-proof` (now the 410 stub): no token 401, a non-admin 403, unknown person 404, a bad tag, a removal with no reason and an
  empty note refused, tag then note on a throwaway key, removal kept as history, give 50 and take 50 on Test Manager (lifetime points there are 50 higher; spendable back to 0), too many refused, a non-member refused for points; throwaway rows deleted.
  The page checked at 1440 and 390 px against mocked answers beside the Watchlist (same family, no sideways scroll, no script errors).
- **Profiles step 3, pick by tag, built and live 2026-11-03** (migration `20261103_pick_by_tag.sql`; `ve-people-outreach` v8 from 1156f14 through `ve-function-deploy`, source sha256 matched; `admin/depot/outreach.html`).
  Depot > Outreach > Pick people has a **Tag** row of chips (Any, then each tag) beside the pools, and each person shows their tags as badges. `pick` takes `tag`: the people holding it (active, by email) are the only candidates, still minus members,
  invited, suppressed and unsubscribed. `ve_founding_candidates` gained `p_emails text[]` (null means everyone; an empty list means nobody); its other callers pass named arguments and are unchanged (3,199 candidates before and after). Proven
  live with a throwaway Volunteer tag on one candidate (volunteer returned just them with their badge, vendor none, no tag all 3,199; the row deleted). The phone layout hides each row's badges, as it already did the pools (existing behavior).
  **Not built**: campaign homes in BrandDesk (waits for Sean to pick the first campaign, the Plant-Based Showcase at the Dolphins game on Nov 29 being the proposed pilot), a tag rule (the first, sponsor-ad clicks, waits for a real sponsor link), tags
  for people who are only in a campaign by Instagram handle in the pick list (the pick list is email-only).
- **Build order**: Pulse subscribe (built, dark), the people sender (built), the survey door (built), the updated Welcome (live), retire the Taster and challenges (done), profiles with groups (steps 1 to 3 built: tags and rules, the person page, pick by tag), campaign homes (next, waits for the first campaign).

## The Explorer path and badges (LOCKED by Sean 2026-11-06, playbook `ve-outreach`)

"Lock it" (canon `canon-ve-door-guides` v7, key `explorer_path_v7`; voice canon `canon-ve-voice-hero-guide`; migration
`20261106_explorer_path_v7_canon.sql`). **Not built yet; queued behind Checking in's Monday sends and the Hot Lab meetings merge.** Sean: "if
I was on that list, what would you give me? I'm a business owner, I do events, I have groups, I'm a content creator... you're going to guess."
So we stop picking a door per person: everyone takes Explorer, then chooses their own paths. It replaces the parts of v6 and of "Three doors"
above that it contradicts (the person check at the door, the 31 questions as the door).

- **Explorer is everyone's door and path** (part 1): the Welcome tour (about 3 minutes) plus the 8-question `explorer` survey (about 2
  minutes). Finishing it makes them a member at once, with the **Explorer badge**; no person check, the abuse watch is the guard. The 31
  questions become **Build your profile**, filled in over time and paid per answer.
- **The paths page** comes next: every path as a card to preview and start (Creator, Restaurant, Event host, Nonprofit, Business, later Group
  leader), ordered by "Do you run any of these?", never hidden. People take as many as fit.
- **Path Guides are part 2**, about the path only. Locked in the catalog until Explorer ("Starts after Explorer"); reached early, Explorer opens
  inside the Guide as its first step; with the badge that step shows done and they go straight to the path's intake. Topic Guides ($11 or 1,100
  points) are not gated. Existing members take Explorer too.
- **Points**: every survey is 250 for answering everything; required questions are few and worth less, optional and open ones more, weighted
  by how useful the answer is. Explorer: chapter 15, journey 15, Do you run any of these 20 (required); what brings you 30, what you want more
  of 35, how to hear from us 15, a place or person to add 45, in your own words 75. Add "I organize a group or community" and "Another kind of
  business" to Do you run any of these.
- **Badges**: Explorer, then Registered creator, restaurant owner, event host, nonprofit, business (automatic on finishing the intake), Group
  leader later; Ambassador invitation only; each badge a `ve_person_tags` tag. A badge opens its Guide and its opportunities, never money.
- **One invitation for everyone**, plus a restaurant version on the business's personal link (Explorer first, then their Restaurant path).
  **Voice: they are the hero, we are the guide** (Sean: "It's about them"): open on what they do for the community, say what opens for them;
  never open on our launch or ask them to support us or join our journey. Every email is a draft for Sean.
- **Build order**: 1 re-weight Explorer and add the two options; 2 tag Explorer as the shared questions; 3 the Welcome ends in Explorer,
  straight-in admission; 4 the paths page; 5 path Guides gated with Explorer inline; 6 badges on profiles and as tags; 7 Build your profile;
  8 the invitations as drafts; 9 policies, the Guides' facts, saved answers. Step 1 (the re-weight) is built; the rest is not.
- **v10, its own playbook `ve-explorer-path`** (Sean, 2026-11-06, concept session with V, "lock it"; canon `canon-ve-door-guides` v10 key
  `explorer_badges_v10`, `canon-ve-group-partners` v5; migration `20261106_explorer_path_playbook_badges_v10.sql`; handoff
  `docs/handoff/2026-11-06-ve-explorer-path-badges-locked.md`). The Explorer build moved here from `ve-outreach`. Added to v7: a new optional
  question, **"What is one of the toughest things you are dealing with on your Vegan journey?"** (35 points, taken from "worth it" 75 to 40): it
  suggests a Guide, and a person reads the answers into a monthly "what people ask for" list beside the search queue that feeds new Guides,
  podcast topics and social. **Badges look like the Pre-Vegan Certification stamp** (ring, mark, dashed stamp card; path name over the top and
  "Vegans Explore" under the bottom, both upright), **a color per path**, Explorer in the stamp green; mock
  https://claude.ai/artifact/QwQRB9sMGVk7GJKB4Whgiz. A member sets a **main badge** (default: the path finished most recently), shown on the
  corner of their picture and never repeated; others as small seals with their name on hover or tap; Explorer never on cards or as the main
  badge. The profile header: a bigger picture, the name to its right, badge pills in up to two rows. A Restaurant or Nonprofit badge links to a
  listing only after the claim is approved. Each badge also opens that path's own bounties. The review gate is v7's straight-in (Sean
  confirmed). **Group Partners v5**: the guest pass retires once Explorer is live; no exclusivity rule; ticketing open to any group; perks by
  activity here (a monthly chapter ranking of events held, tickets sold, members brought in). Ideas filed elsewhere: the event booth program
  and scavenger hunt (`ve-events-guide`, extend `ve-hunt`, the Vault's PIN as purchase proof), event food delivery and colleges (Blueprint,
  parked), Elle Jimenez and Vegans in Clermont (`ve-outreach`). No Explorer Guide exists yet: today it is two pieces, `/passport` (the Welcome)
  and `/survey?s=explorer` (8 questions, still person-reviewed); step 3 joins them.
- **Steps 2 and 3 live 2026-11-07 (main cad2dc5)**: journey, chapter and runs are shared questions; Explorer admits on finishing (no review); `x_tough` (35) added and `x_worth` 40, nine questions, 250 points. **Step 4, the paths page, live 2026-11-09** (Sean: "go"): `/paths` (`paths.html`, parent `/guides`: the same banner and Guide card; in the sitemap). Every path (Restaurant, Event host, Creator, Nonprofit, Business, Group leader Coming with Notify me, `guide-waitlist-group-leader`); a member's `x_run` ticks come first, tagged Picked from your answers (`ve-mission-survey` `survey_get` for explorer and each path survey); a finished intake shows Badge earned and Open your Guide; Start this path opens the path's survey and comes back to its Guide (`ve_after_survey`). Not an Explorer yet: a Join free / Take the Explorer survey box first. The Explorer survey's finish has See your paths. Liz speaks it, in the Holiday Guide's layout (desktop: the paths left, her 320 px column right; phones: the locked Guide mobile card through `ve-guide-corner.js`; Hide me `ve-guide-min.js`, Talk to Liz `ve-page-guide.js`) (approved and recorded 2026-11-09: `liz/paths/paths-member-v1.mp3` for an Explorer, `paths-visitor-v1.mp3` otherwise; stt matched). The chapter hubs' Get your Passport is Join free (the Explorer survey, back to the chapter) since the same day. **Step 5, path surveys start after Explorer, live 2026-11-09** (Sean: "then step 5"): every path Guide sends people to `/survey?s=<its survey>`, so the gate is in `survey.html` (`PATH_TITLE`): someone without a finished Explorer survey (signed out, or `survey_get` explorer not completed) takes Explorer first (Step 1 of 2, sessionStorage `ve_path_next`), its finish leads with Next: <Guide> survey, and the path survey reads Step 2 of 2; with the Explorer badge, straight to the path survey. Opening `/survey?s=explorer` directly clears `ve_path_next`. The catalog shows **Starts after Explorer** on the five path Guides to visitors (`PATH_GUIDES` in `ve-guide-catalog.js`). The Guides' own Get in wording is unchanged. **Step 6, badges, live 2026-11-09**: every badge is a `ve_person_tags` tag (`ve_tags` kind `badge` with its color; migration `20261109_member_badges_v10.sql`): finishing an intake adds it (`trg_ve_badge_tag_from_completion`), Ambassadors carry theirs, a tag the team takes back stays off. `ve_member_badges` returns key, badge, color, role, main, listing, explorer; the member picks the main badge (`members.main_badge`, `ve-dashboard` `set_main_badge`): any badge they hold, **Explorer included** (Sean, 2026-11-09: "Explorer is a badge they earned"; migration `20261109_main_badge_explorer.sql`, proven rolled back); until they pick, the main badge is their most recent path badge, and a badge the team took back cannot be picked. Explorer still stays off card seals. Drawn by `public/ve-badges.js` (the certification stamp's ring and mark, path name over the top, Vegans Explore under): the dashboard's Your badges, the Depot member card, People profiles. Take-back and switching main proven 2026-11-09 in a rolled-back run (`scripts/supabase-once/badges-proof.ts`, six of six). **Step 7, Build your profile, live 2026-11-09** (Sean: "go on step 7 with your defaults"; migration `20261109_profile_carry_explorer.sql`): the 31-question profile (250 points, `ve_profile_answer`) carries two Explorer answers so nobody answers twice: chapter to `q1_city` (not Somewhere else) and journey to `q6_stage` only where exact (Pre-Vegan or Just curious to Curious / pre-Vegan, Vegetarian to Vegetarian; Vegan is left, since the profile asks how long); each counts as answered and pays its profile points once (ref `profile:<q>`), never over an answer they gave (`ve_profile_carry_explorer`, trigger `trg_ve_profile_carry_explorer` on Explorer completion insert or admitted). `q3_roles` is not carried (a different question). The survey door's review and finalize views are gone from `public/ve-mission-survey.js`. The Explorer finish and `/paths` (`#pa-prof`, Keep building with points so far) offer Build your profile (words approved by Sean); the profile gate reads Join free. Handoff `docs/handoff/2026-11-09-ve-explorer-path-step-7-build-your-profile.md`.

## Abuse watch: a judge decides (Sean, 2026-11-03)

"Have some sort of security mechanism that looks for abuse... if an account is suspected of trying to game the system, internally we can
start tracking them... if it turns out they have abused the system, any points they have will be null and void, and they will be either
suspended or banned." Sean is the judge: every suspend, ban and void is his decision, never the system's. Migration
`20261103_abuse_watch.sql` (applied through the one-time `ve-once-abuse-watch`, now the 410 stub).

- **Tables** (RLS on, no policies): `ve_abuse_cases` (one open case a member: watching, cleared, voided, suspended, banned), `ve_abuse_signals`
  (one row a member, kind and day, with its evidence) and `ve_abuse_events` (every move, who and why). `members.standing` is good, suspended
  or banned.
- **The scan** `ve_abuse_scan()` (cron `ve-abuse-scan`, 9:11 UTC daily) records signals: `referral_burst` (5 sign-ups on one link in 24 hours, 30),
  `fast_survey` (survey door finished in under 2 minutes, 40), `disposable_email` (20), `points_velocity` (over 3,000 earned in 24 hours, 25),
  `checkin_pace` (4 places in an hour, 25), `survey_only_referrals` (3 or more survey joins and no paid one, 15). A score is each kind once over
  14 days. Only `member_class` member, never super admins. **Log-only until Sean turns it on** (`ve_site_settings` `abuse_watch`: `mode`
  `log_only` | `on`, `open_at` 40, `watch_days` 30, `log_only_until` 2026-11-10): in log-only it opens no case and the scan returns who would
  have opened. Logan's defaults, Sean's to change.
- **The judge's functions** (service role only, a super admin and a note required, all logged): `ve_abuse_watch` (open a case by hand),
  `ve_abuse_decide` with `clear`, `void`, `restore_points`, `suspend`, `ban` and `reinstate`. **Suspend freezes points and participation and is
  reversible; a ban is permanent but can be undone with `reinstate`.** A void sets the balance and lifetime points to zero, writes an
  `abuse_void` ledger row and keeps what it took in `void_snapshot`, so `restore_points` puts it back (`abuse_restore`). Nothing is deleted.
- **The freeze** is `trg_ve_members_freeze_guard`: a suspended or banned account's `lesars_balance` cannot change, so every function that earns
  or spends points raises `account_frozen` (proven in a rolled-back transaction; void and restore pass a transaction-local bypass). Risk to
  check before the first suspension: a cron that loops over members (`ve_vault_settle`, `ve_challenge_settle`) would stop at a frozen one.
- **Devices** (migration `20261103_abuse_watch_devices.sql`, `ve-auth` version 71 from c7ddf70, source sha256 matched): every email and Google
  sign-up writes a `ve_member_devices` row (`recordMemberDevice`: the IP's salted hash, the same one `ve_signup_attempts` keeps, and a salted
  hash of the browser id the page keeps in `localStorage` `ve_visitor`, sent by `public/ve-auth.js` as `visitor`; best effort, never blocks a
  sign-up; RLS on, no policies). Five existing sign-ups were backfilled with their IP hash. `ve_abuse_scan_devices()` (cron
  `ve-abuse-scan-devices`, 9:09 UTC, before the scan) adds `shared_browser` (three or more accounts on one browser in 30 days, 35) and `shared_ip`
  (four or more on one network in 7 days, 20: offices, homes and events share one, so it is weak alone). Browser ids reach the server only once
  the page's `ve-auth.js` is on `main`; until then only the IP signal fills. Proven in a rolled-back transaction.
- **Standing is enforced at sign-in** (`ve-auth` and `ve-votes` from e2c549c, source sha256 matched): `standingBlock` in `ve-auth` refuses email
  login (after the password is right), Google sign-in, `me` (so a session in a browser drops) and `requireActiveMembership`; `ve-votes` refuses a
  vote. A suspended account reads "suspended while our team reviews it, your points are on hold"; a banned one "this account has been closed";
  neither says why, both give contact@lesaruss.com (403, `code` `account_suspended` or `account_banned`). Checked: the normal paths still
  answer live. The 15 token-only functions that take part now refuse writes the same way (below); the rest check only the token, so an old
  session could still do something there until it expires, while points are frozen everywhere regardless.
- **Depot > Watchlist** (`/admin/depot/watchlist`, People in the Go to menu, built 2026-11-03 on the Feedback page's shell; edge function `ve-abuse`
  from 7a4085a, source sha256 matched, verify_jwt off, super admin token checked inside, the signed-in admin is the judge): tabs Watching, **Would
  flag** (log-only: who the scan would have opened a case for), Suspended, Banned, Points voided, Cleared, All cases, and **Watch someone**
  (`#new`: find a member by name or email). A banner says whether opening cases is on (**Turn on opening cases** / Back to log only, `set_mode`).
  One case per view (`#case/<id>`, `#member/<id>` before a case exists): who they are and how they joined, **Why they were flagged** (every
  signal with what we saw), **Points** (balance, lifetime, the ledger), **People around them** (who they joined through, who they brought in with
  how each joined, other accounts on the same browser or network; a busy network is counted, not named), the history, and **Your decision**: a
  required note, then Clear, Void their points, Restore their points, Suspend, Ban or Reinstate as the case allows, each behind a confirm
  that says what it does. `ve-abuse` actions `list`, `get`, `find`, `watch`, `decide`, `set_mode`; you cannot open a case on or decide your own
  account. Proven live 2026-11-03 as Sean through a one-time function on the Test Manager account (no token 401, a non-admin 403, list, find,
  get, watch with no note and on yourself refused, watch, a second watch refused, void, a second void refused, restore, suspend, reinstate, ban,
  unban, the history, a bad decision and a bad mode refused; then every row removed). The page checked at 1440 and 390 px beside Feedback.
- **Freeze safety, built and live 2026-11-03** (migration `20261103_abuse_freeze_safety.sql`, applied through the one-time `ve-once-freeze-safety`, now the 410 stub): `ve_member_frozen(member)`; `ve_points_grant` returns `{granted:false, frozen:true}` for a frozen member instead of raising; `ve_vault_settle` only lets members in good standing win and settles each card in its own block (a freeze that lands mid-run extends the card); `ve_challenge_settle` returns `{status:'held'}` for a frozen member (not paid, not expired) and `ve_challenge_sweep` handles each challenge on its own; `ve_hunt_award` returns false; `ve_bounty_pay` and `ve_recipe_review` (approve) return `account_frozen` before changing anything; `universe_join_from_purchase` still takes the order but pays 0 points to a frozen buyer. Proven 2026-11-03 in a rolled-back transaction on Test Manager (a suspended bidder and a suspended challenger: vault extended not raised, grant frozen, challenge held and not expired, balance untouched; a good bidder still won). **Direct-balance writers left as they were** because a person starts them and the edge-function check below stops a frozen member first: `award_points_bounty`, `back_campaign_with_points`, `credit_points_purchase` (credits are retired), `donate_points_to_nonprofit`, the `spend_points_for_*` functions, `ve_checkin_save`, `ve_credit_from_points`, `ve_listing_contribute`, `ve_listing_submit_points`. If one of them gains a caller that is a cron or a webhook, give it the same `ve_member_frozen` guard.
- **The standing check in the token-only edge functions, built and live 2026-11-03** (commits e7d3bce and 30bdda7, deployed through `ve-function-deploy` from 30bdda79, source sha256 matched on all 15): `ve-board`, `ve-checkin`, `ve-bounties`, `ve-events`, `ve-venues`, `ve-products`, `ve-cookbook`, `ve-vault`, `ve-challenge`, `ve-group`, `ve-guide-unlock`, `ve-podcast`, `ve-referrer`, `ve-mission-survey` and `ve-claims` (owner actions; super admins skipped). Each has an inlined `standingBlocked` and a `READ_ACTIONS` set at one choke point after the member token is verified; **anything not in the set is a write and is refused with 403 `account_not_in_good_standing`** (fails closed, so a new action is blocked for a frozen member until it is added to the read list). Ops-token `as_member` calls, Taster keys, public actions and crons are never checked (`ve-group` `msg_*` link-token actions stay open so a frozen member can still stop emails). Proven live 2026-11-03 with a session for Test Manager suspended for a few seconds: a write on each of the 15 answered 403 and reads on `ve-board`, `ve-vault`, `ve-checkin`, `ve-cookbook` and `ve-mission-survey` answered 200 (`ve-once-standing-proof`, now the 410 stub; standing put back to good). Other edge functions (`ve-dashboard`, `ve-affiliate`, `ve-bounties` aside, `ve-people-outreach`, `ve-nonprofit`, `ve-ambassador`...) still check only the token; points are frozen everywhere by the trigger regardless.
- **`/policies#community` paragraph written 2026-11-03** (Sean approved the wording): **Earning points fairly**, between Don't and Reporting (points gained by gaming are voided, an account can be put on hold, serious or repeated cases can be closed, a person decides, every decision can be undone). It is live once this branch is on `main`; it must be live before opening cases is turned on. **Not built yet**: the standing check in the functions not listed above. Canon
  `canon-ve-abuse-watch`, playbook `ve-abuse-watch`.

## The survey is the only way in (LOCKED by Sean 2026-11-07, playbook `ve-pricing-points-passport`, canon `canon-ve-door-guides` v12)

"We don't want to inhibit them from being able to complete the survey, and we really don't even want them to bypass the survey...
Stopping them at the door for $11." Replaces "Registration is the Passport", "Guide pricing, points and levels" and the two-door parts of
"Three doors" where they conflict. **Built and live 2026-11-07**:
- **Membership is free; the survey is the only way in** (the Explorer survey, or a business Guide's survey), 250 points, no welcome points.
  The $11 window in `public/ve-auth.js` leads with Take the survey; its $11 button shows only for another brand's account the server sent to
  checkout (`_needUrl`). The sign-up tab reads **Join free**, its button Continue to the survey. `/passport` Enter the room is one card (the
  survey, `/survey?s=explorer`); `/business` Get started is Join free, then claim free. `ve-votes.js` members-only prompts say join free.
- **The Vegan Dairy Guide is LOCKED as the prototype** (Sean, 2026-11-07: "beautiful... the prototype... it has value right now for $11"): Maya opens and explains it, the animation makes the difference; other Guides keep still images for now, animation later. Change it only on Sean's word. The front pages of the topic Guides no longer state the price (the $11 box in the header already says it): no "The full Guide is $11 or 1,100 points" line, and the venue Guides' button reads Get the Guide.
- **Topic Guides' buy box** (Sean, 2026-11-07: "just like an airline... pick either or. Anything else other than that is complicating it"): the public sees **$11** and **Member? Sign in**; a signed-in member sees **$11 or 1,100 points** and picks (Use 1,100 points / Pay $11; short of points, $11 with their balance and a bounties link). No copy says buying a Guide makes you a member, in the six topic Guide scripts (Dairy, Nutrition, Airport, Stadium & Arena, Theme Park, Supermarket). The server still admits a Guide buyer (`ve_guide_purchase_paid`) on purpose: an account that is not a member is treated as signed out on every page, so without it someone who paid could not open what they bought.
- **The $11 is an optional give once in** (contribute, events, topic Guides, ads). `ve-stripe-webhook` (v67 from eb1f4e6, sha256 c7281e93)
  no longer grants 1,100 welcome points on a first $11; the receipt says Your membership is active. Paying a topic Guide does not admit (policy
  wording; the server's `ve_guide_purchase_paid` still admits a buyer, Logan's open item).
- **Claiming or adding a listing is free for members** (`ve-claims` from eb1f4e6, sha256 6769848e, `start` `pay: 'member'` for any listing;
  `claim.html` offers Claim it free / Add it free first and the Partner plan second; a non-member goes to the survey and back, `_add_` for Add it).
- **Cash commissions paused** (`ve_site_settings` `affiliate_program.paused` true and `live` false; `ve_affiliate_earn` returns `skipped: paused`;
  migration `20261107_survey_only_door.sql`). Referral points (111) continue. Earned commissions are still paid.
- `/policies#membership` (Last updated November 7), the Guides' facts (v25, `20261107_survey_only_facts.sql`) and 30 saved answers
  (`20261107_survey_only_answers.sql`) say it. Keep: $111 Partner plan; topic Guides $11 or 1,100 points; Founding until midnight Eastern Jan 1, 2027.

## The Welcome Guide is our About us and the free front door (Sean, 2026-11-08, playbook `ve-explorer-path`)

**The Overview is one card, 2026-11-09 (Sean: "there's way too much going on the first page... no one's reading any of this").** The Overview is a single card
(`slider()`, `SLIDES` in `guide-scripts/welcome-guide.js`): Liz's eight beats, each its own picture, title, a summary of 250 characters or less and its section buttons
(Find your way carries Directory, Your City, Events, Media, Guides; Become a Founder the button). Desktop: picture a third, text two-thirds, the text box as tall as the
picture and scrolling inside; phones stack them. The tour video plays in Liz's frame on the right (`setVideo`, the Holiday Guide's way, Expand on phones), never in the
middle, and the card follows the chapter she is on; arrows, dots or a swipe take over for 12 seconds (`HOLD_MS`), then it goes back to her. Watch first, Read the tour and
the section rows are gone. The page scrolls as one on desktop (only Liz's words and the card's text scroll inside). The menu is a dropdown (more than 5 tabs).
**Then the same day, replaced** (Sean: "I would prefer the body to be longer than the right hand side... it reads like the pulse"): the Overview is **Getting started** (how to
use the page: watch Liz's tour in her frame, read on, join; a 240 px picture, `gettingStarted()`) and then every section as a short article under its group's eyebrow, read like
the Pulse's story rows (a 132 x 99 picture, the title, about 250 characters, Read more; `articles()`, `SUMMARY`). The sub-section buttons live on each section's page. The tour
still plays in Liz's frame. The dropdown has 18 px under it on desktop. Next (Sean's idea): each section page gets the same shape, a short video summary and 3 to 5 sub thumbnails. **Tightened the same day** (Sean): summaries at 150 characters or less; on phones the Getting started picture shows whole (square, full width) and the
article thumbnails are 96 px squares (desktop keeps 132 x 99); Liz's bubble on the Overview is a short instruction ("Watch this video to get a full overview of Vegans
Explore. Then click through each section to learn more about it.") and no longer changes to each chapter's words while the tour plays.

Proposal `docs/proposals/explorer-welcome-guide.md` (approved). `/passport` (`passport.html`, `guide-scripts/welcome-guide.js`) is the Welcome Guide, copied
from the Holiday Guide (template gate). Liz hosts. The Overview is enough on its own (Start here, Become a Founder, the tour: Liz's eight chapters, approved
script v3, text until the video is made); ten optional section pages go deeper (Directory, Your City, Events, Media, Guides, Points and Levels, Your Path,
Make It Better, For the Animals, Become a Founder), each What it is / How to use it today / What members get, Liz's line a text draft. Every page ends on the
**Explorer card** (`public/ve-explorer-card.js`, `VEExplorerCard.html({back, member, next})` and `wire(root)`): the bridge any Guide can end on; it sets
`sessionStorage` `ve_after_survey` (survey.html's `pageBack` now takes a `#/` hash) and opens `/survey?s=explorer`. A member on Become a Founder sees their
first steps. `/business` moved to `business-guide.html` (rewrite in `vercel.json`, `BIZ` always true). The footer's ABOUT, `/about` and `/welcome` open
`/passport`. Old hashes (`#/join`, `#/places`...) land on their new page; `?from=vote|save|...` notes kept. The Explorer question `x_hear` now reads "How should
we reach you with founder news?" (the founder list). Not done: the Overview video and section videos, Liz's recordings, the paths page.

**The sample member, built 2026-11-08 (playbook `ve-explorer-path`; merged to `main` 2026-11-08, cee2b62).** `/dashboard/sample` (a rewrite
to `dashboard/center-console.html`, `X-Robots-Tag: noindex`) is the real member dashboard run as **Jordan Ellis**, an invented South Florida Founding Member at
Level 2. `dashboard/sample/demo.js` loads before `ve-auth.js` (a `document.write` gate at the top of the dashboard; `guide.html` and `levels.html` load it when
`window.top.VE_SAMPLE_MEMBER` is set): it swaps the session keys (`ve_token`, `ve_member`, `ve_view_as`, `ve_switch_from`) for Jordan's **in memory only** (never
written or removed, proven: a real visitor's session is unchanged after the sample), answers every edge function call from `SAMPLE` (public reads such as
`ve-votes chapter_stats` and `ve-events list` go to the live site with no token), toasts "nothing is saved" on anything that would save, keeps the address on
`/dashboard/sample`, and stamps the page **Sample** (bottom left). Jordan's points are worked out from his history (`H`), so lifetime, balance and level always
agree. Shows: the Explorer and Registered event host badges, Level 2, For you, the leaderboard (invented names), My Saves with real Directory places and real
episodes, Points and levels with **Your points**, and Liz's earlier conversation (`VE_SAMPLE.conversation`). **Your points** is a real feature: `ve-affiliate` `me`
now returns `history` (the member's latest 60 `points_ledger` rows) and `levels.html` shows the tab only when it is sent; `ve-affiliate` v5 deployed from main
86648e3 (source sha256 37e50d7e matched), proven for a real member (the Logan test account, 7 rows, through the one-time `ve-once-levels-proof`, now 410). A new call
the dashboard makes needs a `SAMPLE` entry, else it reads as a failed load. Jordan's picture is `dashboard/sample/img/jordan.jpg` (Higgsfield, approved by Sean
2026-11-08). Checked live 2026-11-08 at 1440 and 390 px: stamp, Dashboard, My Saves, Points and levels > Your points, Talk to Liz, no errors, no sideways scroll,
a real session unchanged. Not done: check-ins on the Bounties page (bounties.html has no loader; check-ins show in Your points), Preview journeys entry.

**Liz's scenes on the Welcome Guide, live 2026-11-08** (approved by Sean; main 9082b75): eleven Higgsfield pictures, one per page, in
`public/guides/welcome/liz-<tab>.jpg` (960 x 1192, 4:5), set as each tab's `scene` in `TABS` (`guide-scripts/welcome-guide.js`); `drawLiz` puts the open tab's scene
in her rail picture, her square art the fallback. A tab's `pic` is still its section pill picture. Shirts change page to page (black, white, cream, pink, a long sleeve,
jackets), the mark always showing. The Points scene was redone the same day with blank boards (`?v=2`). **The Overview tour is recorded** (2026-11-08, main e35f774): Liz's eight chapters of script v3 in her roster-profile voice, `vegan-media/media/liz/welcome-guide/tour-<1..8>-v1.mp3` (about 3 minutes), each checked word for word with stt (chapter 4 re-recorded once for a stray "Um"); Play the tour (rail) and Listen to the tour (the tour card) run them back to back, each chapter in Read the tour has its own Play, the bubble follows the chapter; GA `audio_start` / `audio_complete` `welcome_tour`. The section pages' lines stay text. **The tour is a video, live 2026-11-09** (Sean approved): `vegan-media/media/liz/welcome-guide/tour-video-v2.mp4` (4:5, 2:48, the 48 approved frames, Liz's 8 chapters, the launch bed 19 dB under; renderer `scripts/tour-video/render.py`), on the Overview through `VEVideo.markup({aspect: '4:5'})`; chapter Play and Liz's rail Play drive it (`VEVideo.start`, `CH_AT`). **The lookbook is loaded** (2026-11-08, migration `20261108_welcome_guide_tour_lookbook.sql`, tour `welcome-guide` in Depot > Guides and tours, `/admin/depot/guides#t/welcome-guide/lookbook`): 8 chapters, 2:32, 22 frames and 24 decisions: three on-camera moments for Liz from her page scenes (ch 1 "Hi, I'm Liz.", ch 6 "This is the part that matters most.", ch 8 "is to join today."), 19 live page captures at 1920 x 1080 in `vegan-media/media/tours/welcome-guide/` (the voting and points frames use the Sample business and Jordan Ellis, stamped Sample), two illustration ideas (ch 2 ten years in the community, ch 7 a sanctuary) and one orange note (the paths page is not built). The dead-end search frame made a queue row, removed. The lookbook's intro and On camera line now name the tour's narrator (they said V). **Rebuilt the same day as 45 beats** (Sean: "switching scenes every 3 seconds... not going to animate it... I'm sitting there watching it for 20 seconds thinking that the player broke"; migration `20261108_welcome_guide_tour_beats.sql`): no lip sync and no on-camera shots; a new picture about every 3.4 s (beats split on the stt word timings at a natural pause, 1.6 to 4.6 s), each held with a slight slow zoom, captures mixed with Liz's page scenes, Guide banners and chapter art, all pictures already made (no credits). The lookbook player zooms each frame the same way and crops portrait scenes high so faces stay in. **The rule for every tour video now: image to image about every 3 s, a slight zoom allowed, never a picture held past about 5 s, no animation.** Waiting on Sean's approvals, then the edit. The Become a Founder button no longer clips on phones (stacked under the price at 480 px and under).

**Guides in scenes, a different look on every page (Sean, 2026-11-08, every Guide).** "I don't want to see them in the same uniforms from each photo.
Let's mix it up and make it look like a scene because they're videos, and we want the video to really lay out what's on that page." Each page of a
Guide gets its own picture of its Guide in a scene about that page (the Holiday Guide's Theo per page is the model), never the same plain shot on every
tab. A page's video lays out what is on that page, and where a feature needs something fully built to show (a member's view, a business's view), we build
a demo first and edit the video after. **Clothes (Sean, same day):** the Vegans Explore mark is the one branded item and always shows; the shirt comes in
colors (black, white, cream, pink...) and as a long sleeve, with different pants and a jacket over it as the scene needs, as long as the mark can be seen.
No other brand's logo. This loosens "only clothes from our store" (2026-11-01). **A sample member** (approved): an invented member like Kai, so the member
side can be shown fully built.
