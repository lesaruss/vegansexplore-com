# ve-community-directory: N to R worked (2026-11-08)

Playbook: `ve-community-directory`. Sean asked Logan to work N, O, P, Q and R so only K, L and M are left (then S, T, U later).
Everything below was done in the database and checked there. No Google calls, no Apify, no Claude API spend.

## N. Needs support (6), done
Each website was read again from the database server (pg_net).
- Happy Zoe Vegan Bakery, The Vegan Joint: security certificate broken on http and https. Website link taken off (kept in
  `details.website_broken`), visitors go to their active Instagram. BrandDesk leads.
- Natuurlik (reopened in Lake Park): natuurlik.net no longer answers (Cloudflare 1001). Link taken off.
- Jolo's Vegan Kitchen, Healthy N' Fresh Cafe: the http address opens; our link is http, so left as is.
- Jay Bhavani: the site opens now; tracking code taken off the link.
Each change is a `ve_listing_edits` row (`where: needs_support`) and a team note; `ve_listing_health.support_done_at` set.
The monthly listing check may flag the two http sites again (no https).

## O. On hold (123 to 98), done
- 4 put back live: Slutty Vegan Atlanta, Switch4Good, Vegan Vibes (meal prep), Ciao Bella @ Organic Farmer's Table (sites open).
- 22 Removed (reversible from Directory review > Removed): June spreadsheet rows with no website, socials, address or description
  (the old Community Partner leftovers, Imo's Bakery, Benevolence Naturals, The Kind Cleaver...).
- Vegan Bowls For All (Long Beach) got a still-open bounty like its Pasadena location.
- What stays on hold, on purpose: 77 with a still-open bounty (waiting on a member's visit), 3 Google calls temporarily closed
  (COCO LOV, Seasoned Green, Vegan Delights; the Monday Google check brings them back), and 17 Sean held by hand (his call).

## P. Event leads (186), done, 0 new left
- Linked to listings we had (9): Farm of the Free, Vegan Street Fair, Christopher's Kitchen WPB, Full Circle Farm Sanctuary, Piggins
  and Banks, Plant Shack, Cafe Sunflower, Greens and Grains, Yellow Green Market.
- Added (15): Event Venues Orange Springs Retreat Center, Larry Bell Recreational Center, Community Cafe (Camden Council, St Pancras),
  Tolworth Recreation Centre, Hofstra University Cultural Center Theater, Hard Rock Stadium, The Lifestyle Building; Nonprofits Florida
  Voices for Animals, Animal Activism Collective, aPlantBasedDiet.org; Events Mindful Matter Market, Holistic Holiday at Sea, Poderosa
  Minded, Vegan Events UK (London); Sanctuaries HenPals.
- The rest set aside with a reason on each: outside our chapters, parks and outdoor spots, homes and private rooms, neighborhoods,
  campuses, landmarks, stores and gyms, closed places, online meetings. Food places (SuTao Cafe, Mangiafolie) are noted for the restaurant path.

## Q. Backlog "check" (595), done, 0 left
- 144 set aside: Instagram unreadable or no post in 6 months or more.
- 20 listed: Curious Cat Bakery, Juice Bar & Cafe (Miami Gardens), Sunni Speaks Vegan, Raw Chef Carla, My V Spot (Jacksonville), Saint Rose
  Sweets, Vegan Ahava, Compton Vegan, Confectionery (NYC), Vegans of LA, Food Yoga International, and brands Go Max Go, Blackbird Foods,
  Big Mountain Foods, Cool Beans, Mrs. Goldfarb's Unreal Deli, Seed Ranch Flavor Co., Rule Breaker Snacks, Wiwa's Tempeh, Every Body Eat.
  Category, How Vegan and place are a best guess from the bio, said so in each note; their About is the bio until the About writer runs;
  brands have no product kinds yet.
- 431 set aside with the reason: bio does not say Vegan, Vegan but a person or creator or outside our chapters or no place, already
  listed, or (Google track) open but Vegan not confirmed. Upton's Naturals is noted: active on Instagram again, worth a second look.

## R. Event venues, set up
Chapters with no venues: North Florida, Delaware, West Virginia (Los Angeles has 1). They had no events with a usable venue, so
weekly event searches were added for North Florida, Delaware, West Virginia, Maryland and Virginia (`ve_event_sources`, queued). Venues
follow as the crawl finds events and they are approved. Not verified yet: the first crawl's results.

## Also
- `ve-claims` deployed from main b0f4341 (v52, source sha256 fc32bbc0 matched): Port Richey and Orange Springs now count as Central Florida in claims.
- I used the wrong tenant id in two checks mid-session (`...0000-0000-...0002`); Vegans Explore's is `00000000-0000-4000-a000-000000000002`.

## Left for Sean
K: 44 Ready to list. L: Pacific Point Preserve, Humane Association of Ga. M: the logo hunt on the 382 never searched (on hold).
Then S, T, U.
