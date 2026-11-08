# ve-community-directory: K, L and the New places clear-out (2026-11-08)

Playbook: `ve-community-directory`. Checked in the database after each step. No Google, Apify or Claude spend.

## Done
- **K, Ready to list (44)**: 26 live, 17 set aside, 1 held (Miami Beach Vegan). Sean: "K as recommended, set aside 39 to 44".
  Migration `20261108_ready_to_list_k.sql`. Ou La La was listed under LA by mistake (it is in Phoenix) and taken back off;
  website links taken off Liz's Place (spam), Pulled From Wreckage (domain gone) and The Fresh Beet (now Barrier Beets), old links in
  `details.website_broken` (`20261108_directory_k_corrections.sql`). Nine of the rescues listed have no working site and under 5 reviews
  (Sean approved; default keep). Lesson: read the previous handoff's notes on the same rows before recommending.
- **L**: Pacific Point Preserve (a SeaWorld exhibit) and Humane Association of Ga Removed, reversible (`20261108_directory_l_removed.sql`).
- **New places clear-out**: 2,116 undecided quarantined backlog rows set aside (Not found 783, Closed 156, Not enough to check 178,
  Already listed 60, A person 520, Not a restaurant 419 with no animal or Vegan word in bio or name). 114 person/other rows that do mention
  them are left for a read. Migration `20261108_new_places_clearout.sql`.
- **Event searches**: the five weekly searches (North Florida, Delaware, West Virginia, Maryland, Virginia) ran Nov 8 and found 0 (past or
  undated events only). Added the Richmond Meetup group (`meetup.com/bekind2animals`) as a weekly list source; Baltimore's Meetup was already
  a source; no Meetup group found for Delaware, North Florida or West Virginia.
- **S** (Facebook name search for logos): leave off, closed.

## The order from here (Sean, 2026-11-08: go down in order, stop at the logos until Friday)
Sean answers (defaults in brackets): 1 Miami Beach Vegan [set aside]; 2 Angela Yvonne / Vegan Pop Eats [set aside unless she has been on our
shows]; 3 his 17 held by hand [leave]; 4 the nine thin rescues [keep].
Logan, in order:
1. **T1 Juices for Life** (Styles P and Adjua Styles, from the Nov 6 Blueprint idea `f8adc4c3`): confirm current names and locations (press says
   Bronx x2, Yonkers, White Plains, Brooklyn earlier; a rename to Juices 2 Heal reported), Google look-ups under the $50 cap, How Vegan from their
   menu, add through Add a listing (New York chapter).
2. **T2**: a cold hello draft in Depot > Outreach (ve-outreach, team voice, pointing to the listing); nothing sends without Sean.
3. **Read the 114** person/other rows with animal or Vegan words; list or set aside each.
4. **T3, the listing-request queue** decided in the idea thread: Sean's finds go straight to work; everyone else's are researched and drafted
   first, then show on his dashboard's For you with Publish, Send to vetting, Remove. Build on Add a listing and Join the Directory's Add it.
   Mark the idea done when built.
5. **Stop. Friday Nov 13: M**, the logo hunt on the 382 never searched (about $13; Apify cap $29 from Nov 7; Claude promo credit expires
   Nov 17: check the balance first). Never start it without Sean's go in that chat.
Menu links (207 food places) are worked by the free `ve-menu-links` cron; nothing to do.
