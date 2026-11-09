# ve-holiday-guide: Give Back full run (2026-11-08)

Playbook `ve-holiday-guide`. Ran `ve-giveback` `batch` over every open Nonprofits, Rescues and Sanctuaries listing with a real
website and no `details.support`, about 3:40 PM to 6:45 PM Eastern, Sun Nov 8. No function code changed.

## How it ran
A temporary pg_cron job (`tmp-giveback-wave`, `tmp_giveback_wave()`, `tmp_giveback_fired`) sent 48 listings (12 batches of 4,
cron secret) every 6 minutes; batches of 4 finish inside the edge runtime's background limit. Some batches were cut short, so a
final pass sent every listing still without a write (72) once more in batches of 3. The job, function and table are dropped
(`20261108_drop_tmp_giveback_wave.sql`, through the one-time `ve-once-giveback-drop`, now 410). Writing rules unchanged.

## Totals (673 open organizations)
- **558 have Why support** (19 pilot + 539 today); 480 with a tracked Donate link (`/go/give-<slug>`), 78 written with no link
  (the site publishes no giving page the writer could confirm).
- Words: 112 to 550, median 425; 331 at 400 or more; none over 550. Shorter ones are short because their sites say little.
- **47 not written after one retry**: 21 not usable (too little on the site, or the site is not the organization), 10 refused us (403),
  5 page gone (404), 9 did not open, 1 rate limited (429), 1 down (503). Each keeps `details.support_try`.
- **Left alone**: 53 with no website, 15 whose website is a social page.
- Checked: no tax claims, no banned words; every "Vegan" (44 pages) is the organization's own description.

## For Sean to look at (from the writer's notes)
- **Not animal groups** (likely miscategorized): ena-kindness-in-action, lovelovinglove-inc, velveteen-rabbit-project (people services),
  little-pet-project (a for-profit photo studio's project), pet-rehoming-network-philadelphia (a paid rehoming service).
- **Merged or likely inactive**: fund-for-animals (now part of Humane World for Animals), pets-washington-dc (latest figures 2001),
  thinking-animals-united (still promotes a 2018 summit), rude-ranch-animal-rescue (adoptions stopped 2021).
- **Location differs from our listing**: freedom-hearts-animal-rescue-martinsburg (site says Gerrardstown), rude-ranch (Millersville),
  phoenix-animal-rescue (Philadelphia, listed Chester Springs), loving-acres (Chester, listed Richmond); pilot: Project Paws Alive.
- **Site problems**: hogs-kisses (site body is landscaping template text), 101-paws-and-claws (PayPal account in another name, skipped).
- Five test clicks on /go/give-<slug> (rowdy-girl-sanctuary, the-humane-league, tevaland-sanctuary-farm,
  last-hope-inc-animal-rescue-rehabilitation, pigsburgh-squealers) at about 6:47 PM Eastern were Logan's check; remove from `ve_links` clicks.

## Next
- Logan: remove the five test clicks; optional second try for the 403/404/did-not-open group after Sean decides on the flags.
- Sean: the miscategorized and moved listings above.
