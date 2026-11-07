# ve-community-directory: Ready to list worked, 15 events cleared, retreat code line (2026-11-07)

Playbook: `ve-community-directory`.

## Done (checked in the database)
- **Ready to list, 330 rows**: 279 listed (186 Rescues, 49 Sanctuaries, 29 Nonprofits via the Google track; 4 food places as Vegan options; Philly Vegan Market; 9 from Instagram),
  8 set aside with reasons, 44 left for Sean. Light check only, no Google calls: open on Google, website answers (read through pg_net) or 5+ reviews. Category and How Vegan are
  a best guess, every listing carries a team note saying so. Shelter branches went in as locations of their listed parents (Brandywine Valley SPCA, Furkids, Dogs Trust).
  Dead website links (Candle, Pet Haven St Lucie, Vintage Paws) were left off. Migrations `20261107_ready_to_list_google_batch.sql`, `20261107_ready_to_list_instagram_batch.sql`.
- **15 events waiting**: official pages read; 12 approved, 3 turned down (Joy Cafe Nov 4 and Zoom Vegan Support Group Nov 5 already over; VegfestUK Brighton over today, page returned 520).
- **Vegan Squad Retreat** now says: "Save $250 off your ticket with the exclusive Vegans Explore code VEGANSEXPLORE at checkout. Vegans Explore earns a commission on tickets bought with this code."
  (Sean's wording: no amount for us; the short disclosure stays because of the FTC rule.)
- **Port Richey and Orange Springs** added to Central Florida: `ve_outreach_cities` (live), `public/ve-hubs.js`, `directory/listing.html`, `ve-claims` HUBS. Migration `20261107_events_waiting_central_florida_cities_retreat_code.sql`.

## Open
- **ve-claims is not deployed**: its HUBS change is in the repo only; deploy from `main` after the merge (check no unmerged branch has a newer version first). The page files ship on merge.
- **Scratch table `ve_tmp_sitecheck`** (my pg_net website check) still exists: the connector wants an interactive confirmation for `drop`. Run `drop table if exists ve_tmp_sitecheck;` or confirm it.
- **44 left in Ready to list for Sean**: Google track (22): Karamel N22 (Google matched the arts venue), The Fresh Beet (site is now Barrier Beets), Miami Beach Vegan (matched Aura Miami Beach, already listed),
  Liz's Place (site hijacked by spam), Pulled From Wreckage (domain gone), and 17 with no working site and under 5 reviews. Instagram track (22): Laughing Pig, Empty The Cages Orlando,
  Operation Liberation, Climate Healers, Live Freely and Three 7's (no city or personal account), Ou La La Vegan Cuisine x2 (Phoenix, outside our chapters), and the Foodie Fest vendors that do not say they are Vegan.
- Angela Yvonne People profile: waiting for Sean.
- Next (Logan's recommendation): 6 Needs support, 123 on hold, 595 to check, 177 event leads, 627 with no logo.
