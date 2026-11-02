# The event host path (LOCKED by Sean 2026-11-02, canon `canon-ve-event-host-path`)

Sean: "lock it and then deploy". Locked with the panel's answers below, the $50 ad credit and creative support. Step 1 (the event claim) is built and live 2026-11-02; steps 2 to 5 are not.

## The idea, in Sean's words (condensed)

- Every event we bring in automatically gets an event page better than Partiful's or Eventbrite's, with links to every person,
  venue and group in it. Each new event builds out the Directory somewhere else.
- On the page: **"Are you running this event? Click here."** That opens the Vegan Events Guide, which shows them the page we
  already built for them. We don't say it out loud, but it's ten times better than what they're using now, and they didn't
  have to do anything.
- **The next level**, if they move their events to us:
  - Sell tickets on our platform.
  - Build a community around the people who actually show up, where they can talk to each other between events.
  - Digital meetings between events through Hot Labs.
  - Easy follow-up after an event, reaching guests directly through our portal. People can leave any time; nobody is locked in.
  - Bring them into the group side (Group Partners), or just sell tickets.
  - New features every few weeks.
- **What we put behind them**: ads on our pages, a campaign behind their event, and our 2027 push (sponsorships and funding, so
  we're in more places, all the time).
- **Their link still works either way**: today the page links to wherever they sell tickets, and they can share it like any
  link. Switching to us exclusively is the upgrade.
- **The price**: be a member, no extra fees. They get a back end on the dashboard to update their information, with tips on
  what to do.
- **A la carte, inexpensive ($50, $75)**: social media promotion, a bounty, a feature in the city's Daily Pulse, a press release
  ("we already have media locked in").
- **What they're really paying for**: us working the Directory for them behind the scenes, making connections ("would you
  want this? We'll make this connection"). People could charge points for a connection.
- **Ask the community**: focus groups in Hot Labs, with points for taking part.

## What already exists (as of 2026-11-02)

- Event pages are built on the server, with schema.org Event data and in the sitemap (`api/event.js`).
- Each event page already shows its venue, host, promoter and the people credited (the event feeds, built 2026-11-02).
- **Promote your event**: the packages and options, as interest only, with no prices.
- **Group Partners** ticketing: 5% fee, guest pass, door check-in, refunds.
- Organizer messages through us, within a window (phase 2 of member profiles).
- The **Vegan Events Guide**: built, not launched.
- The **event sponsorship** application.

## What it would need

- An "Are you running this event?" claim on the event page, routed into the Events Guide.
- A way to claim an event (today only listings can be claimed).
- A community space for guests, and Hot Labs on Vegans Explore (that's an HQ feature today).
- Prices for the a la carte options.
- A points-for-connections rule.
- Focus groups.

## Sean's clarification (2026-11-02, same day)

- **Not Group Partners.** Group Partners stays its own give and take: a percentage, and every guest is a member, which keeps the
  community real ("people don't troll and pay money"). It needs more finessing, but separately.
- **This is per event, nothing long term**: "Do you want to do an event with us?"
  - A paid event: a charge per ticket.
  - A free event: they make Vegans Explore a sponsor.
- **Maybe it's branded a Vegans Explore sponsorship.** Part of it is selling through our platform, plus promotion that's clearly
  laid out. Beyond that, sponsors see the full a la carte list of event promotion at steeply discounted prices.
- The point is for them to see what our marketing can do, and some will buy more.
- **Every event we bring in** with an email for its host goes into the daily email queue, with a templated heads-up message
  that sends automatically.

## Logan's notes for the build

- The automatic heads-up fits the outreach people-list engine: a list, its own template, daily cap, warm-up, unsubscribe and
  the postal footer, one email per host per event, never to an address that unsubscribed.
- Business outreach today waits for Sean to approve every send day. Here, Sean approves the template once and the emails then
  go out on their own (Sean's direction).
- This merges with the event sponsorship already built in the Events Guide (booth, comped meals, our promotion). One offer, not
  two.

## Open questions for Sean

1. The per-ticket charge (an amount or a percent), and whether members who host pay less.
2. What a free event's sponsorship asks of them (logo, a booth, a stage mention, our QR cards), and what promotion we give.
3. Which a la carte items, and their regular and sponsor prices.
4. Who the heads-up goes from (Sean, or the team), and whether a host gets one per event or once.

## Panel recommendation (Logan's panel, 2026-11-02; locked by Sean the same day)

Panel: an event promoter, a ticketing marketplace pricing lead, a community lead, an email and compliance lead.

1. **Per-ticket charge: 5% of the ticket price, no flat fee, the same for everyone.** Card processing (2.9% + 30 cents) goes to the
   buyer, and the host may pass our 5% on to the buyer as well. This is the Group Partner number, so we have one rate. It is under
   Eventbrite (3.7% + $1.79), Posh (10% + $0.99) and Partiful (about 10% + $2) on almost every ticket, and level with Luma (5%).
   Member hosts get no lower rate; they get the sponsor package and the extras discount instead. Any ticket of $11 or more
   already makes the buyer a member (`ve_member_admit`), so a host's paid event brings us members as well as the 5%.
2. **A free event's sponsorship.**
   - We ask the host to:
     - put "Sponsored by Vegans Explore" on their flyer and event page;
     - take RSVPs through our page (the guest pass and the door list);
     - give a stage mention;
     - put out our QR cards;
     - tag us in their posts.
     A booth only if there is room.
   - We give them:
     - a featured spot on the calendar for their chapter;
     - a mention in their city's Daily Pulse;
     - one Instagram story;
     - a place in the weekly events roundup;
     - door check-in;
     - a recap post;
     - the sponsor price on every extra.
   - Events of 200 or more people can apply for the full sponsorship in the Events Guide (booth, creator, ad slot, 2 per
     chapter a month).
3. **Extras.** The sponsor price is 30% off. These are set against delivery cost and checked before each one opens.

   | Extra | Price | Sponsor |
   |---|---|---|
   | Featured in their city's Daily Pulse | $50 | $35 |
   | Pinned first on the chapter calendar, 2 weeks | $50 | $35 |
   | Social push: 1 feed post and 2 stories on our Instagram and TikTok | $75 | $50 |
   | A share bounty: members earn points for posting it | $75 | $50 |
   | Our chapter's ad slots, 2 weeks | $100 | $70 |
   | A creator at the event, posting about it | $150 | $105 |
   | A recap reel from their footage | $150 | $105 |
   | Press release, written and pitched (the shop's price) | $500 | $350 |

   Packages (the names already on Promote your event):

   | Package | What's in it | Price | Sponsor |
   |---|---|---|---|
   | Spotlight | Pulse, pinned and the social push | $149 | $99 |
   | Boost | Spotlight, plus ad slots and the bounty | $279 | $199 |
   | Front Row | Boost, plus the creator and the recap reel | $499 | $349 |

4. **The heads-up email.**
   - **From:** the team (hello@vegansexplore.com), signed by the chapter's Community Manager when there is one. Never Sean's name,
     which is the rule we already follow for groups.
   - **When:** at most one email every 14 days per host. Several events get one email together ("We put your 3 events on Vegans
     Explore"). An unsubscribe is permanent.
   - **To whom:** only approved events, and only an email the host publishes themselves. In London, a business's general address
     only (UK email rules).
   - **What it says:** we added your event, here's the page, correct anything or claim it, and do you want to sell tickets with us
     or make us a sponsor. **No prices in the first email** (the handshake rule we locked for BrandDesk). Prices start on the page
     they click.

## $50 in ad credits (Sean, 2026-11-02)

Sean: "$50 in advertising credits that they can use... to get them into the system so they realize they can use this at any time.
They might just run ads and not even sell... introduce them to the platform by giving them a little taste."

Logan's terms (Sean's to change):
- **Who gets it:** once per host, not per event. It lands when they claim their event page, which gives them a reason to claim.
- **What it buys:** our own ad slots only.
- **Expiry:** 90 days.
- **Not money:** no cash value, no refund.
- **Topping up:** they can add their own money on top.
- **What it costs us:** the slots it fills now carry our house ads (Guides, Humble Cabbage), so the cost is what that slot could
  have sold for, not cash.

The ad console needs three things first:
- a credit balance per business (a ledger, like points);
- booking a slot and dates themselves, with a clear price;
- a "spend your $50" step in the claim.

Today the dashboard's Ads view only lists spots and "Ask about this spot".

## Creative support (Sean, 2026-11-02)

Sean: "we don't want them sending us trash... we'll work on making sure that it's the absolute best thing that we can put out there.
And that will then give them a taste of what we can do from a marketing service perspective... and it helps us make sure that we can
keep the look and feel we want for our platform."

Logan's terms (Sean's to change):
- **Included with the $50:** we make their ad from whatever they send (flyer, photos, logo, a line about the event), in every size
  the slots use (300 x 250, 300 x 600 and the phone's wide box). It's a still image, or our animated card on the Guide ads' template.
- **Approval and changes:** they approve it before it runs. One round of changes is included.
- **Every ad on our pages is made or approved by our team**, paid ones too. That is the quality gate. A host's own finished creative
  runs only once it passes our check (sizes, legible, no clutter), else we remake it.
- **What we say:** "We made your ad" is the door to the rest. The approval screen shows what more we can do (the extras, BrandDesk)
  with no push.
- **What it costs us:** a few minutes per ad with our own tools. A remake beyond the included round is an extra (price to be set
  against delivery cost).
