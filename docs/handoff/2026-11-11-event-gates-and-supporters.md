# Event gates and supporting organizations (2026-11-11)

Playbook `ve-events-platform`. Canon `canon-ve-event-gates`. Full record: `docs/history/events.md` (The event gates and many at
once; Supporting organizations). All work is on `main` (last commit c7ec2b5); branch `claude/quirky-allen-mlqi80` holds nothing unmerged.

## What Sean asked

- "I am not going through all 122 of these... why can't we just approve them? Can we put in some gates?" "If they are still active,
  if they have a link to register, it hasn't been canceled, it's not duplicated, I would say we can roll with it."
- "Select multiple and then have an action that I can choose to approve it, to, you know, turn it down."
- Georgia VegFest's two listings: remove the Meetup copy (done).
- Then: "If we have an organization that is also hosting their meetup, let's put it underneath that listing... we can show that these
  are the organizations that are supporting this event. And then they can see, click on it and see their listing... it's almost like a
  referral." "Unless Polar Springs is a sponsor... But we're not there yet." "Yeah, you can go ahead and merge these updates."

## What is live

- **The gates** (`ve-event-check` `gate`, cron `ve-event-gate` every 15 minutes, 10 a run): every waiting event from
  the crawl, a flyer or the team. Same organizer twice is folded ("Duplicate of"); two organizations become one event with a supporter;
  the official page is read: live if it shows the event, off if cancelled, turned down only if the page is gone (404 or 410 twice),
  held if the page loads without the event (built in the browser) or is postponed or unreadable. Members' own events still wait for a
  person (Logan's default, Sean's to change).
- **Supporting organizations**: status `supporting` under `dupe_of`; on the event page under Hosted by and Held at ("Going with one of
  them? Register through them.", logo and name to the Directory, Register with them); kept on the supporter's own Directory page.
  Official pick (`ve_event_official_pick`): the organizer the other's title names, then own site over ticketing over group posts,
  then a Directory listing, then the live one.
- **Depot > Events**: checkboxes, Select all shown, Approve / Turn down many; **Supporting** (Make this the main one, Not the same
  event); **Held**.
- The 122: all through the gates. Most live, about 30 repeats came down, 2 supporting pairs (DC Vegan with Veg Society of DC; Poplar
  Spring with Veg Society of DC), 2 held.

## Proven

- Gate reads matched pages to the minute (JSON-LD, EventScheduled). `ve-event-check` v5 and `ve-events` v14 deployed from commit
  99e9c4f through `ve-function-deploy`, source sha256 matched. The DC Vegan and Poplar Spring event pages return Veg Society of DC as
  a supporter; the DC Vegan page screenshotted live at 1440 and 390; Veg Society of DC's page keeps its row, opening the main event.
- Depot views (bulk, Supporting/Duplicates, Held) screenshotted at 1440 and 390 with sample data only (no super admin sign-in from the
  build session). **Not yet seen by Sean signed in.**

## Mistakes caught the same morning

1. The first run turned down "Cooking with Chef Carole" (Plant Powered Metro New York): its neoncrm page is built in the browser and
   read as "not this event". Now held, never turned down on that read; the event was put back.
2. The first supporter run put Poplar Spring's own event under the Veg Society of DC Meetup post that names it. Fixed with the
   pairwise official pick; Poplar Spring went back through the gate and is now the event.

## Waits on Sean

- Depot > Events > **Held** (2): "Cooking with Chef Carole" and "Plant Powered Dinner Social in Astoria", both neoncrm pages the gate
  cannot read. https://vegansexplore.com/admin/depot/events#held
- Whether members' own submissions should go through the gates too (default: no).
- Sponsors hiding supporters: not built ("we're not there yet").

## Next

Nothing open in this task. The schedule keeps gating new crawl finds every 15 minutes.
