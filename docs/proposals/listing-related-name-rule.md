# ve-community-directory: a stricter name rule for brands and food places on other shows (proposal, 2026-11-08)

Measured live against the 58 Directory podcast feeds (10,561 episodes). Nothing written.

Today's rule (organizations and groups only) applied loosely to brands and food places:
- Brands (136): 40 listings, 644 episodes. Most are wrong: Complement (356), Ritual, Ripple, Silk, Vega, Boldly, Doshi, Treeline.
- Food places (963 main listings): 78 listings, 1,809 episodes. Mostly wrong: Create, Wild, Nourish, Crave, Plates, Otto, Comida, Whole Foods.

## Proposed rule
1. Case-sensitive, whole words, written as the business writes it.
2. Brands: a name of two or more words and 9+ letters counts. One-word names count only when on a reviewed list
   (`details.match_names`, set by the team: Oatly, Tofurky, Miyoko's, Violife, Gardein, Daiya, Noshy, Maizly, Huel,
   Milkadamia, Crackd, Nuzest...). Two-word phrases that are ordinary English (Good Karma, Future Kind, Cool Beans) need the list too.
3. Food places: two or more words and 9+ letters AND the listing's city in the same episode; or the restaurant on the reviewed list
   (Vedge); or its website domain or @handle in the notes. Locations match through their main listing only.
4. Sponsor reads: a name in the notes of more than 30% of one show's episodes and never in a title is a sponsor read, shown once
   ("Sponsor of <show>"), never episode by episode (Vedge Nutrition: 31 episodes on one show).
5. The longer-name blank list stays (Vedge Nutrition never counts as Vedge).
6. Featured only when the title names it; notes only is Mentioned (unchanged).

## Expected result
Brands about 25 listings (13 by name, about 12 from the list); food places about 18 (from 23 with name + city, dropping
Wild, Plates and Grass Fed) plus the list. Domain and handle matches not measured yet.

## Built 2026-11-08 evening (Sean: "Go on the name rule")
Migration `20261109_listing_related_brands_food.sql`, applied through the one-time `ve-once-related-names` (now the 410 stub).
Changes from the proposal, found while checking by eye: a website matches only as a whole domain (kos.com was matching inside
miyokos.com); a sponsor read is 5+ notes-only mentions on one show (any share; Complement's ad reads stayed under 30%); a show whose
own name contains the name never counts (Vedge Your Best is not Vedge), and other listings' names are blanked with and without
"Podcast"; a checked food name (Vedge) counts in a title alone but in notes only with its city (drops "Vedge Vegan Collagen").
Checked list (`details.match_names`): Oatly, Tofurky, Miyoko's, Violife, Gardein, Daiya, Noshy, Maizly, Huel, Milkadamia, Crackd,
Nuzest, So Delicious, JUST Egg, Vedge, PLANTA. Cron `ve-listing-related` now every 15 minutes, 25 a run.
