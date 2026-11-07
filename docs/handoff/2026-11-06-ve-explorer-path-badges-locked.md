# ve-explorer-path: Explorer path and badges locked (Nov 6, 2026, Eastern)

Playbook: `ve-explorer-path` (new; the Explorer build moved here from `ve-outreach`). Concept session with V, locked by Sean ("lock it").
Canon `canon-ve-door-guides` v10 (key `explorer_badges_v10`, on top of v7 and v8) and `canon-ve-group-partners` v5.
Migration `supabase/migrations/20261106_explorer_path_playbook_badges_v10.sql` (applied live through the connector; idempotent).

## What was locked
1. **The light survey is the door.** No 31-question survey on the path; deeper questions live in each path Guide's intake. Explorer
   gathers enough to reach out with value, suggest paths and suggest Guides. Paths are suggested, never assigned.
2. **New optional question**: "What is one of the toughest things you are dealing with on your Vegan journey?" 35 points, taken from
   "In your own words, what would make it worth it?" (75 to 40), so Explorer still totals 250. It suggests a Guide; a person reads the
   answers into a monthly list beside the search question queue that feeds new Guides, podcast topics and guests, and social posts.
3. **Review gate**: v7 straight-in stands (Sean confirmed after Logan surfaced v7). The abuse watch is the guard. The `explorer`
   survey's `reviewed` flag comes off at build step 3.
4. **Badges**: Explorer; Registered creator, event host, restaurant owner, nonprofit, business; Group leader once its intake is on
   `ve_surveys`; Ambassador by invitation. Topic Guides earn none. Given on finishing the intake, a person can take one back.
   A Restaurant or Nonprofit badge links to a listing only after the claim is approved.
5. **Badge look** (mock https://claude.ai/artifact/QwQRB9sMGVk7GJKB4Whgiz): the Pre-Vegan Certification stamp's ring, mark and dashed
   card; path name over the top, "Vegans Explore" under the bottom, both upright; a color per path, Explorer in the stamp green;
   never the certification's wording or Certified pill. Main badge set by the member (default most recent), on the corner of the
   picture, never shown twice; the others as small seals with a name on hover or tap; Explorer never on cards or as main.
   Profile header: bigger picture, name to its right, pills under it in up to two rows.
6. **Unlocks**: each badge opens its Guide, 250 points (stacking), its opportunities and its own bounties; follow-ups by badge; one
   nudge for a path previewed and not finished. Not now: badge perks, badge-only events, tiers.
7. **Group Partners v5**: guest pass retired once Explorer is live (until then it stays on); no exclusivity rule; ticketing open to
   any group; featured, ads and bounties by activity (default: monthly chapter ranking of events held here, tickets sold, members
   brought in, shown on the group's dashboard).

## Filed elsewhere
- `ve-events-guide`: event booth program and scavenger hunt (idea, not locked). Extend `ve-hunt`; purchase proof by the Vault's PIN;
  winner's contact to a vendor only with an unticked yes. New Year's Eve possible pilot.
- Blueprint, parked: event food delivery (vegan.express folded in) and Colleges. Idea 60e6b5f8 marked own playbook.
- `ve-outreach`: Elle Jimenez and Vegans in Clermont, a personal message from Sean as a draft.

## Where it stands
- Built: v7 step 1 (Explorer re-weight, migration `20261106_explorer_v7_reweight.sql`).
- No Explorer Guide exists. Today: `/passport` (the Welcome, nine tabs) and `/survey?s=explorer` (eight questions, person-reviewed).
- Sean has not yet clicked through both as a new person would.

## Next
1. Sean: click through `/passport` and `/survey?s=explorer` and say what feels off.
2. Logan: v7 step 2 (tag Explorer's questions as the shared questions), then step 3 (Welcome ends in Explorer, straight-in admission,
   `reviewed` off, the toughest-thing question added and re-weighted). Wording people read goes to Sean first.
