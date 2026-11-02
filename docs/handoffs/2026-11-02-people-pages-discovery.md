# Handoff: People pages, card sections and the discovery engine (2026-11-02)

Logan's handoff from the session of 2026-11-02. Read `CLAUDE.md` first (People, Linked pages, Podcast episodes, The template gate).

## Where it stands (all live on `main`, last commit 283d82d)

- **Outreach People pages**: Paige Parsons Roache, Elle Jimenez, Vegans in Clermont (Central Florida group), Sherri Johnson.
  `/go/paige` and `/go/elle` open their pages. Migrations `20261102_outreach_people_pages.sql`, `_sherri_johnson.sql`.
- **Card sections** (`details.linked` `[{title, items:[{slug, role?}]}]`, drawn by `cardSections` in `directory/listing.html`,
  the Directory's own card, two across): Founder on Vegans in Clermont, Communities on Elle, Affiliations on Paige (UnchainedTV,
  Plantbased in the Burbs, Plant Based Treaty), People on Jane Velez-Mitchell, Sherri and Paige (each other).
  Migrations `20261102_linked_sections.sql`, `_unchained_people.sql`.
- **No family tabs**: a family's other listings are card sections on the first tab (`loadFamily`). People pages' first tab reads
  **About**; shows go in **Their shows** (`PP_HOSTED` + `PP_FAMSHOWS`). `?tab=books` scrolls to Books. `drawBooks`, `famMenu` unused.
- **Plantbased in the Burbs**: no YouTube embed (Sean asked to remove it); links to UnchainedTV's page
  `https://watch.unchainedtv.com/plant-based-in-the-burbs` (migration `_plantbased_burbz_unchained.sql`).
- **Episodes** (`public/ve-episodes.js`, `epHref`): any episode shown outside its own show's page links its title and artwork to
  `/directory/<show>?ep=<guid>` (People pages, film pages, every Guide, My list). A person's episode lists are two columns
  (one at 760 px and under). Guide scripts pass `slug` on the show object.
- `ve_person_episodes_cache` rebuilds every 6 hours; to see a new credit now:
  `insert into ve_person_episodes_cache (listing_id, data, built_at) select id, ve_person_episodes_build(id), now() from listings where slug='<slug>' on conflict (listing_id) do update set data=excluded.data, built_at=excluded.built_at;`

## Next build, proposed and waiting for Sean's go: Directory cards in articles

Sean: "if somebody's referenced in our articles and they're in our directory, their tile should show up on that page. If a
restaurant's mentioned, their restaurant should show up on that page at the bottom."

Logan's proposal (defaults unless Sean changes them):
1. **In this story** at the foot of every Pulse article (`api/pulse-article.js`): the Directory cards (votes, open their page) of every
   person, restaurant, brand or group it names. The listing's page gets **In the Pulse** linking back.
2. **Matching**, worked out ahead and saved (a mentions table, e.g. `ve_content_mentions`): links in the article to the listing's
   page, website or Instagram; People credited on the episode (`ve_person_credits`); exact full-name matches in the text, leaving out
   one-word names ("Love", "Grain") to avoid false matches.
3. **Review**: a short Depot list to remove a wrong match.
4. **Order**: the 279 Pulse articles (`ve_pulse_content`) first, then each city's Daily Pulse briefings (`ve_board_posts` topics).

## Waiting on Sean

- Go on the article cards (above).
- UnchainedTV under Jane Velez-Mitchell's Affiliations (offered).
- The Taste rebuild (Overview, Sampler, Programs, Earn your Passport; defaults: Scan replaces Buttermilk, Sampler open with no email,
  email only for saving, Programs and Earn).
- A brighter photo for Sherri Johnson (her Instagram one is dark).
- Whether to drop YouTube links entirely (now only a plain Follow link).
- Older: sponsor pitch page and email, Outreach Results view, Logan's proposed 30 a day, a feedback button with voice, Linh's name,
  Carol's phone, Michelle Cocella's page (needs what she does).

## How to work here

- Deploy: push to `main` of lesaruss/vegansexplore-com (also `claude/trusting-cori-x8x9xq`), author `Sean A. Russell <contact@lesaruss.com>`.
- Supabase project `fwbhwfxpncrsfhttimna`; secrets only inside SQL through pg_net; a held write goes through a one-time function (CLAUDE.md).
- Check every change live at 1440 and 390 px with Playwright before reporting it.
