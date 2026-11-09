# ve-community-directory and ve-holiday-guide: wrap-up (2026-11-08, about 8:55 PM Eastern)

## ve-community-directory: what connects to a listing, brands and food places on other shows
- `claude/epic-heisenberg-jjndg1` merged to main (74bc5be) on Sean's "merge". Checked live at 1440 and 390 px, no script errors, no sideways
  scroll: Rowdy Girl (People: Renee King-Sonnen, Brett Christoffel; On our podcast; On other podcasts), The Humane League (Vicky Bond),
  Renee King-Sonnen (Organizations: Rowdy Girl; her episode; other shows).
- Stricter name rule built and live (Sean: "Go on the name rule"): `20261109_listing_related_brands_food.sql`, applied through the one-time
  `ve-once-related-names` (now 410). New: `ve_listing_related_strict_names`, `ve_listing_related_hit_strict`, `ve_listing_related_strict_elsewhere`;
  `ve_listing_related_build` and `_refresh` now cover brands and food places (main listings only). Rules and the fixes found by eye are in
  `docs/proposals/listing-related-name-rule.md`. Checked list `details.match_names` on 16 listings. Page label "Show sponsor" (main 665447a).
- Cron `ve-listing-related` now `7,22,37,52 * * * *`, 25 a run (about 0.5 s a listing). 1,083 brands and food places were waiting at 8:50 PM;
  they finish about 9 AM Eastern Nov 9.
- Seen: the Rowdy Girl breadcrumb reads "Directory / Directory" (older bug, for the ve-feedback queue).

## ve-holiday-guide: Give Back
- Sean's decisions applied (`20261108_give_back_flag_decisions.sql`, one-time `ve-once-giveback-flags`, now 410; each a `ve_listing_edits` row):
  6 Removed, 2 On hold, Donate off on Rude Ranch and 101 Paws and Claws, 5 location fixes. Detail in
  `docs/handoff/2026-11-08-ve-holiday-guide-hogs-and-kisses.md`.
- Hogs & Kisses (Sean has worked with them): Why support kept, website now the home page, writer found nothing usable, no Donate. Comment request
  `hogs-and-kisses` to Anne Molina: vegansexplore.com/comment/hogs-and-kisses. No published email, so Sean sends the link himself (message drafted in chat).
  Source for later: Anne on Ella Magers' Rise & Thrive (Buzzsprout 14007119).

## Next
- Logan, Nov 9 after 9 AM Eastern: confirm the related cache finished for brands and food places (no row of those categories left unbuilt), spot-check
  Oatly, Miyoko's, Vedge and Beyond Meat pages at 1440 and 390 px; check Freedom Hearts, Phoenix and Project Paws kept their cleared street and pin.
- Sean: send Anne the Hogs & Kisses link. When she answers (Depot > Comments), Logan writes Why support from her words and adds her Donate link.
- Optional second try for the 47 Give Back listings that failed (403, 404, did not open), only on Sean's go.
