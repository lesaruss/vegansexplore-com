# BOSS analysis: Vegans Explore navigation, especially the Directory

Sean, 2026-11-10: "Something is not right about this... something's not been sitting right with me about our navigation, especially in the
directory section. I don't feel like it is the best possible way to sort everything... run a boss on it... if it isn't, I want to see a mock-up
of what it should be. And I'll make a decision if we switch it out."

Mock: `/mocks/directory-nav/` (guided view, white stage). Live counts read 2026-11-11 (approved, not permanently closed).

## Step 0: The challenge

The top menu is fine in shape (Directory, Events, Daily Pulse, Media, Guides, Communities, plus universal search). The Directory is not:

- **It opens on Local Food, and the other six sections hide in a small dropdown** beside the breadcrumb ("Local Food ▾"). 1,349 of our
  2,499 open listings live in those hidden sections: 665 sanctuaries, rescues and nonprofits; 214 studios, venues and services; 197 books,
  podcasts and films; 113 people and groups; 152 products; 8 cruises. A visitor who does not open the dropdown never learns they exist.
- **Sections are named by our filing system, not by what people come to do**: Local Food, Products, Services, Media, Community, People,
  Travel. Two of those names repeat the top menu with a different meaning: Directory "Media" (books, podcasts) vs the top menu's Media (our
  shows), and Directory "Community" (nonprofits, rescues) vs the top menu's Communities (city hubs). This is likely what read as "why is this
  in communities" on 2026-11-10.
- **The sections are lopsided**: Restaurants holds 984; 15 of 38 sub-sections hold fewer than 10 (Animal Care 1, Promoters 1, Marketing &
  Growth 2, Health Professionals 2, Chefs 3, Coaches 3, Vendors 5, Marketplaces 5, News Outlets 6, Health and Wellness 7, Meal Prep 7,
  Cruises 8, Physicians 8, Health Experts 8, Catering 10). Thin pills make the Directory feel empty where it is not.
- **Related things are split**: Groups and Events (organizers) sit under Community while People is its own section; Physicians and Health
  Experts are people while Health Professionals and Health and Wellness are services; Food Trucks and Vendors are apart with 16 between them.

Root cause: the Directory was grown section by section as categories were added (canon history in `docs/history/directory.md`), and its
front door was never redesigned for the whole. The structure mirrors how listings are stored, not how people look for them.

## B: Best practice

1. **Top tasks** (Gerry McGovern, "Top Tasks", 2018; NN/g, "Top Tasks Management"): a small set of tasks drives most visits; navigation
   should put those tasks on the surface in the visitor's words. Applied: doors named for what people come to do (Eat, Shop, Help animals,
   Watch and listen, Meet people, Book a service, Travel).
2. **Hidden navigation hurts discovery** (NN/g, Pernice and Budiu, "Hamburger Menus and Hidden Navigation Hurt UX Metrics", 2016): when
   navigation is hidden behind a menu, people use it less and find content less often than when it is visible. Applied: every section is a
   visible tile on the Directory's front page, never only in a dropdown.
3. **Information scent** (Pirolli and Card, "Information Foraging", Psychological Review, 1999; NN/g, "Information Scent"): people follow
   labels that predict what is behind them; vague or repeated labels make them give up. Applied: one meaning per word across the site; a
   count and two or three example sub-sections on every tile.
4. **Category entry points on local discovery sites**: Yelp's home page and Google Maps' category chips lead with a short row of visible
   categories (restaurants, shopping, things to do, hotels) before any list; Airbnb leads with category icons. Applied: a Directory home of
   seven tiles, then the list.
5. **Facets over deep trees** (NN/g, "Filters vs. Facets", 2014): keep the tree shallow (door, then sub-section) and let filters (location,
   How Vegan, cuisine, sort) narrow it. Applied: two levels only; location, 100% Vegan and sort are filters on every door where they make sense.
6. **Test the tree before shipping it** (NN/g, "Tree Testing: Fast, Iterative Evaluation of Menu Labels and Categories"): give people
   find-it tasks on the bare structure and count first clicks. Applied: the outcome test below, on the old tree and the new.

## O: Outcome

- **Every section is one click from the Directory's front page**, visible without a dropdown, at 1440 and 390 px.
- **No word means two things**: no Directory door repeats a top-menu name.
- **No thin pills**: a sub-section shows as its own pill only with 5 or more listings; smaller ones fold into a neighbor or a More pill.
- **First-click test** (8 tasks, Sean plus at least 5 members, old tree vs new): at least 80% correct first clicks on the new tree, and
  better than the old. Tasks: find a sanctuary near you; a Vegan bakery; a Vegan podcast; a protein powder; a nutritionist; a studio to film
  in; a Vegan cruise; a Vegan activist to follow.
- **After launch, 30 days**: the share of Directory visits that open a non-food door goes up (baseline taken before the switch).

## S: System

Design Thinking with a tree test (the scientific loop on the structure): mock to Sean; on his OK, run the first-click test on old and new;
build the Directory home and the new doors on the shared component (`/public/ve-region-directory.js`, its `CAT_CONFIG`), which also serves
city hubs, the dashboard and LESARUSS.ai; stored categories do not change, only which door shows them (the same move as Local Food and
Products, 2026-11-01).

## S: Simplify (the standard)

- **Seven doors, two levels**: door, then sub-section. Everything else is a filter.
- **Doors** (names are Sean's call; these are the recommendation):
  Eat (Restaurants, Bakeries & Cafes, Food Trucks & Vendors, Markets, Catering & Meal Prep);
  Shop (Food & Drink, Supplements, Clothing, Beauty, Marketplaces);
  Animals & Causes (Sanctuaries, Rescues, Nonprofits);
  Watch, Listen & Read (Books, Podcasts, Films, YouTube, News);
  People & Groups (Founders, Athletes, Activists, Creators, Health Experts, Chefs, Groups, Event Hosts);
  Services & Spaces (Studios, Event Venues, Health & Coaching, Business Help, Animal Care);
  Travel (Cruises).
- **The front page** of the Directory: search, the location chip, the seven doors as tiles with counts, then Top voted near you.
- **One meaning per word**: Directory "Media" becomes Watch, Listen & Read; Directory "Community" becomes Animals & Causes. The top menu keeps
  its names.
- **A new category** goes into an existing door; a new door needs Sean's OK and its own tile.

## Iteration plan

Round 1: Sean reviews the mock. Round 2: first-click test on old and new (a short form to members), build the front page and doors. Round 3:
fix what people trip on; measure the 30-day share; repeat up to three rounds.

## Conclusion

Recommendation: keep the top menu, rebuild the Directory's front door as seven visible doors named for what people come to do, merge the
thin sub-sections, and stop repeating top-menu words. Confidence: high on visibility and naming (well-established patterns, and 1,349
listings are hidden today); medium on the exact door names and splits until the first-click test runs.
