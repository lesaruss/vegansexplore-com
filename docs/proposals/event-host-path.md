# The event host path (Sean's idea, 2026-11-02, not locked)

Captured as Sean said it, so it isn't lost. Not decided, not built. It goes to a concept session with V before anything is locked.

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
