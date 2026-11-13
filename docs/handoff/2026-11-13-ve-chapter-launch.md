# Handoff 2026-11-13: launching the next chapters with the Seattle recipe (ve-chapter-launch)

Playbook `ve-chapter-launch` (new). Canon `canon-ve-chapter-launch` (the recipe, step by step). Record: `docs/history/communities.md`,
section "Seattle". Checkpoint 1014.

## Sean's words
- "Each place we open up into is another opportunity for us to swing momentum in our favor... Maybe we use this as a sign to open up in
  those cities where they have a location." (the Next Level Veggie Grill cities)
- "We build the cities in real time. We're not holding it back."
- "I would prefer to see the horizontal image... even on mobile." Then "yes, go wide on all of them."
- "Let's continue working on launching the other chapters that we mentioned using the same format as what we did with Seattle."

## Done (live, proven at 1440 and 390)
- Seattle (`/communities/seattle`, all of Washington State): 69 listings, the hub, 21 edge functions, the database lists, Daily Pulse on,
  marked opened on the next-chapters board. Launch post and story drafted (`public/chapters/seattle/`), parked in `ve-social-schedule`.
- Wide 16:9 city art on all 14 cities (`communities/<slug>/wide.jpg`, `VE_HUBS[].page.wide`).

## The queue (Logan's order; each one: search, build, show Sean beside Los Angeles, then "open")
1. **Portland** (Oregon). Next Level Veggie Grill: Downtown Portland, Hawthorne. Art ready: `communities/next/oregon/` (wide, vertical, square).
   Decide the name and reach the way Seattle did (named for the city, matching the whole state).
2. **San Francisco Bay Area**. Next Level Burger Potrero Hill and Concord, Next Level Veggie Grill San Jose. Art ready: `communities/next/san-francisco/`.
   California is already the Los Angeles chapter's state, so this one must match by a city list, not the state (LA matches by its city list
   too; check `ve_outreach_cities` and `ve-claims` HUBS so the two never overlap).
3. **Austin** (Texas). Next Level Burger Austin. Art ready: `communities/next/austin/`.
4. **Denver** (Colorado). Next Level Veggie Grill Denver. No art yet: make it in the same style (all five shapes at once).
5. **Boston** (Massachusetts). Next Level Veggie Grill Cambridge. No art yet.
Bring Sean one recommendation on how many to open at once; the recipe is the same for each.

## Lessons from Seattle (all in the canon)
- A chapter is listed by hand in about 45 places: 21 edge functions, about 20 pages and scripts, and the database (two check constraints,
  `ve_outreach_cities`, which drives `ve_chapter_of`, and three functions: `ve_chapter_stats`, `ve_pulse_auto_queue`,
  `ve_creator_application_link`). Missing the three functions left the city card blank until patched.
- Before deploying from main, compare each function live against main: 10 of 21 were behind main with merged work never deployed. Check
  every RPC and table that work needs, then deploy through `ve-function-deploy` and match each sha256.
- A business's location that falls outside a chapter's city list (Tustin, Carlsbad, El Segundo near LA) shows only in search: a decision
  for Sean on Southern California.

## Open from this session
- Carrie Davis (Next Level Veggie Grill): Christmas pickup dates and Christmas Day hours (Sean has the note to send).
- Owner tools, parked: Add a location and copy a menu to every location, in the business dashboard.
- The social week (Nov 16 to 22): playbook `ve-social-schedule`, checkpoint 1013.

## Start here (new chat)
```sql
select slug, kind, body, created_at from playbook_records where slug = 've-chapter-launch' order by created_at;
select body from knowledge_records where slug = 'canon-ve-chapter-launch';
select slug, name, status from ve_next_chapters where slug in ('oregon','san-francisco','austin') order by slug;
```
