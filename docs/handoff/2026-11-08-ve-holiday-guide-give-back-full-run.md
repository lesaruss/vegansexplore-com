# ve-holiday-guide: Give Back full run done (2026-11-08)

Playbook: `ve-holiday-guide`. No code or schema change in this chat; the run used `ve-giveback` as built (v2, commit 62a9988).

## What ran
A temporary job `tmp-giveback-wave` (pg_cron every 6 minutes, `tmp_giveback_wave()` and table `tmp_giveback_fired`) sent 48 listings a wave to
`ve-giveback` `batch` in groups of 4 with the cron secret, never the same slug twice, from about 3 PM to 4:43 PM Eastern. It was started by another
chat (no record of it in the repo); this chat watched it, read the results and checked the rules. By 4:59 PM Eastern the job, its function and its
table were gone, and every failure had one retry pass (4:42 to 4:43 PM Eastern).

## Totals (673 open Nonprofits, Rescues and Sanctuaries)
- 558 have **Why support** (`details.support`): median 425 words, 345 at 400 or more, 23 under 200 (thin sites), max 550.
- 480 have a tracked **Donate** link (`details.donation_link_code`, `give-<slug>`).
- 47 failed after one retry (`details.support_try`): 21 not usable, 10 site answered 403, 5 404, 1 429, 1 503, 9 did not open.
- 53 have no website, 7 only a social page (left alone, as built), 8 others never qualified.
- Rule checks over all 558: 0 tax claims, 0 dashes, 0 "Friendsgiving"; 35 use the word Vegan, all in the organization's own words.

## Failures worth a hand fix before Giving Tuesday (Dec 1)
- Blocked our reader (403/429): PETA, Animal Place, Animal Welfare Institute, Compassion in World Farming, Rosie's Farm Sanctuary, Farm Animal
  Rescue Sanctuary, Vegan Los Angeles, Korean K9 Rescue, Homeless Pets Foundation, Erie Trap Release, FOAL Farm.
- Not usable (site is not theirs or says nothing): includes Jungle Friends Primate Sanctuary, Lifeline Animal Project, Animal Acres,
  Animal Defenders International (two listings, likely duplicates), Florida Humane Society, Thai Animal Sanctuary.
- 404 (website on file is dead): National Greyhound Adoption, Ark Rescue at Brightside Acres, Vegan Impact, Second Chance Farms, Project VetRelief.

## Listings to look at (from the writer's own notes)
- Probably not Give Back: Fund for Animals (merged into Humane World for Animals), lovelovinglove (human health coaching), Pet Rehoming Network
  Philadelphia (a paid rehoming service), PETS Washington DC (newest figures 2001), Thinking Animals United (2018 summit).
- Town differs from the site: Freedom Hearts (Gerrardstown), Rude Ranch (Millersville), Loving Acres (Chester), Phoenix Animal Rescue
  (Philadelphia), Project Paws Alive (Braselton, GA; from the pilot).
- Site has template text: Hogs & Kisses (146 words, no Donate), Bosley's Place, Freedom Acres.

## Next
- Sean: say whether the five "probably not" listings come out of Give Back (default: they stay, flagged for Directory review).
- Logan: hand-fix the big blocked names (PETA, Animal Place, AWI, CIWF) only on Sean's go; the function reads a site server side, so a
  hand-written section needs its own path.
