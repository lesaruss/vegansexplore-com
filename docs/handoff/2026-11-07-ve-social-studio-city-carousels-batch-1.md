# ve-social-studio: city carousels batch 1, collaborators, Directory slides (2026-11-07)

## Done
- **Template locked**: Canva `DAHaJ8TQI0I` "5 Vegan Restaurants to Try in Philadelphia" (https://www.canva.com/d/guajso5HpEO7bgZ), in Vegans Explore > Directory (`FAHaPcBW8w8`). Canon `canon-ve-city-carousel` v1, `canon-template-gate` v4, CLAUDE.md template table.
- **Batch 1 for ten chapters** (all in the Directory folder):
  | City | Design | Restaurants |
  |---|---|---|
  | Philadelphia | DAHaJ8TQI0I | Vedge, Monster Vegan, HipCityVeg, Batter & Crumbs, Miss Rachel's Pantry |
  | Central Florida | DAHaPjFQ2Rk | Winter Park Biscuit Co., Vegetation Plant Food, Soulicious Vegan Kitchen, Earthy Picks Vegan Cafe, Vegan Scoops |
  | Atlanta | DAHaPuxtuWI | Tassili's Raw Reality, Plant Based Pizzeria, La Semilla, Vegan Wangs, Dulce Vegan Bakery & Cafe |
  | New York | DAHaPsYrfLg | Anixi, Next Stop Vegan, Al-Andalus, Beyond Sushi, Hangawi |
  | Los Angeles | DAHaPlTEGpQ | Crossroads Kitchen, The Grain Cafe, Doomie's NextMex, Âu Lạc, Monty's Good Burger |
  | London | DAHaPlTTe2U | Naifs, Veva Vegan, Purezza Camden, Beza Ethiopian Food, Plates |
  | Maryland | DAHaPkMrvYE | Dodah's Kitchen, Oleum, Black Baltimore Vegan, My Mama's Vegan, Ci Su Vegan |
  | Washington, D.C. | DAHaPr1LrYM | DC Vegan, Elizabeth's, Pow Pow, PLANTA, Glizzy's Vegan Food Co. |
  | Virginia | DAHaPlNPbtM | Taco Vegana, The Green Cat, Green Leaf Vegan Kitchen, Beyond Vegan Cell Food, My Vegan Sweet Tooth |
  | South Florida | DAHaPsnXGxY | Dina's Vegan Deli, Love Life Cafe, Christopher's Kitchen, The Rabbit Hole, Greens and Grains |
- **Instagram collaborators**: `ve_social_slots.collaborators` (migration `20261107_ve_social_collaborators.sql`), Depot > Social form field, `ve-social` v13 (sha256 6c78bfd0...), proven against Metricool.
- **Directory slides** on Philadelphia only (slides 7 to 9): Directory list on a phone, Vedge's page on a phone, "Your vote ranks them". Vote counts hidden in the screenshots.
- **Planner**: Philadelphia slot `bb84ccd8-9197-4b86-be96-a3a0704900de`, proposed for Mon Nov 9 12:30 PM Eastern, collaborators @vedgephiladelphia @monsterveganphilly @hipcityveg @batterandcrumbs @missrachelspantry. Holds the old 7-slide export (`communities/carousels/philadelphia-b1-slide-1..7.jpg`).
- Monster Vegan's listing got its Instagram (@monsterveganphilly, a `ve_listing_edits` row).

## How a city is made (repeatable)
1. Picks: open 100% Vegan food places with an Instagram in the chapter (query `listings`).
2. One Apify `instagram-scraper` run (posts, resultsLimit 8 to 10) from the database with pg_net; copy the photo options to `vegan-media/media/communities/carousels/<handle>-<n>.jpg` with `ve-off-lookup` `save` (admin token); look at them on a contact sheet; swap places with only flyers or selfies.
3. Canva: upload the chapter art and the five photos (`upload-asset-from-url`), copy `DAHaJ8TQI0I`, edit with the same locators (ids carry over), crop each photo to cover the 1094x1367.5 frame, names and cities 680 wide at left 362.54, commit, move to `FAHaPcBW8w8`.
4. Directory slides: Playwright at iPhone 13 size on `/directory?tab=food&sub=restaurants&city=<chapter>&area=<City>` and `/directory/<first restaurant>`, CSS hides `.vote-count`, `.vote-badge`, `.vrd-tools`; frame as a phone in PIL; upload through `ve-social` `asset_upload` (admin token + Sean's member id as `as_member`), since Canva's upload host and Instagram's CDN are blocked from the build session; import to Canva.
5. Export (jpg) and copy the slides to storage right away (Canva export links expire), then the planner slot.

## Waiting on Sean
- Approve the three Directory slides on Philadelphia; then roll them to the other nine.
- Weak slides to swap or drop: Glizzy's (D.C.), Beyond Vegan Cell Food (VA), Tassili's (ATL), Monty's and Doomie's (LA), Plates (London), The Rabbit Hole (SoFL), Next Stop Vegan (NY, soft).
- Cut the closing slide's survey line (it repeats slide 9)? Outline slide 9's card?
- "The places you vote for most go into our next 5 to try": add or not.
- E3 Vegan (London) says it is closing on Instagram: put the listing on hold?
- @soflovegans weekly read: pause or cap at 5 posts.
- The rhythm: carousels Mon/Wed/Fri 12:30 PM, podcast clips Tue/Thu, a spotlight on weekends.

## Next (Logan)
- After Sean's edits: re-export Philadelphia (10 slides), update its slot; add the Directory slides to the nine others; create their proposed slots on the rotation with collaborators and captions; per-city tracked links (/go/<city>-directory) for link in bio.
- Fri Nov 13: if the nightly ve-listing-posts-weekly reads ran clean, set the playbook to Watching with a decision record.
- North Florida, Delaware, West Virginia when they have 5 places.
