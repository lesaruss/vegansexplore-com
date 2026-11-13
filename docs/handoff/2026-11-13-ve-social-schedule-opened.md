# Handoff 2026-11-13: the social schedule project opens (ve-social-schedule)

Playbook `ve-social-schedule` (new). Related: `ve-social-studio` (the tools: Depot > Social, `ve_social_slots`, Metricool, collaborators),
`canon-ve-brand-kit-templates`, `canon-ve-city-carousel`.

## Why this project exists (Sean, 2026-11-13)
"Before we add it to the schedule, let's put it in a social media ideas, because we don't have anything scheduled for social, so I would want
to coordinate it with what else we're going to be doing... I want to get everything scheduled for Monday... put together that project, that
playbook, and then we'll go ahead and work on that and get the social media set up for the next, at least for the next week."

## The goal
By Monday Nov 16, the Vegans Explore feed has a full week planned and scheduled (Mon Nov 16 to Sun Nov 22), every post shown to Sean as it
will look and approved by him, then loaded in Depot > Social (`ve_social_slots`, status approved) and pushed to Metricool. Nothing posts
without his yes.

## Where the feed stands
- The last real Vegans Explore posts went out Nov 1 (3 posted). 8 were skipped Nov 1 to 7.
- 10 slots sit `proposed` and stale (Nov 9 to 16): the Philadelphia carousel (Nov 9, old 7-slide export) and the SoFlo Vegans 112 set
  (Nov 14 to 16: Holiday Guide post and story, "Is it still open?" bounty post and story, Madai's Vegan story). Each needs a keep, move
  or skip.
- Proposed rhythm, never locked (from ve-social-studio, 2026-11-07): city carousels Mon, Wed, Fri at 12:30 PM Eastern; podcast clips Tue
  and Thu; an organization or person spotlight on the weekend; never two carousels back to back.
- Content direction (Sean, 2026-11-06): no commercials; content is about the community and ends with a call to action that serves the
  viewer (find places, join free with the survey, vote, give points); a contribution only as an option.

## The ideas waiting (the pool for the week)
1. **Seattle is open** (post 4:5 and story 9:16, drafts approved as drafts by Sean 2026-11-13; held for this plan). Files:
   `public/chapters/seattle/post.jpg`, `story.jpg` (script `scripts/brand-templates/city-open.js`, copied from `find-us.js`). Tracked link
   `vegansexplore.com/go/seattle-open`. Collaborator @nextlevelvg. Logan's timing: a weekday at noon Pacific (3 PM Eastern), after
   Sunday's Episode 146. Caption draft:
   > Vegan Seattle is open. Dozens of places to eat Vegan across Seattle, the Eastside, Tacoma and Everett, now in one place, including
   > @nextlevelvg in Downtown Seattle, Ballard and University Village. Save your favorites, vote for the ones you love, and help build the
   > community: vegansexplore.com/go/seattle-open
   >
   > Want to lead Vegans Explore in Seattle? We're looking for a community manager. Reach out.
   >
   > #VeganSeattle #SeattleVegan #VegansExplore
2. **City carousels, batch 1** (Canva, folder Vegans Explore > Directory `FAHaPcBW8w8`): Philadelphia `DAHaJ8TQI0I` (the template; re-export
   needed), Central Florida `DAHaPjFQ2Rk`, Atlanta `DAHaPuxtuWI`, New York `DAHaPsYrfLg`, Los Angeles `DAHaPlTEGpQ`, London `DAHaPlTTe2U`,
   Maryland `DAHaPkMrvYE`, Washington, D.C. `DAHaPr1LrYM`, Virginia `DAHaPlNPbtM`, South Florida `DAHaPsnXGxY`. Still waiting on Sean from
   2026-11-07: the Directory slides, the weak-slide swaps (Glizzy's, Beyond Vegan Cell Food, Tassili's, Monty's, Doomie's, Plates, The
   Rabbit Hole, Next Stop Vegan), cutting the closing survey line, the most-voted promise, the E3 Vegan hold. The city art is now wide
   (16:9, `communities/<slug>/wide.jpg`): check the carousel covers still read right.
3. **Podcast Episode 146** (Sun Nov 15, 7 AM Eastern): Kai on Chaka Khan's Plantbaed Cafe; Liz on the new listings and Next Level Veggie
   Grill. Clips for Tue and Thu (built in `ve-podcast-studio`).
4. **Next Level Veggie Grill**: 20 locations now listed, Holiday Feast live on ThanksLiving and Christmas menus at 19. Their "Find us" post
   and story per location already exist (`public/claims/<slug>/post.jpg|story.jpg`) for them to share; a Holiday Feast spotlight could
   tag them (ThanksLiving is Thu Nov 26, pickup through Nov 25).
5. **The Holiday Guide / ThanksLiving** (Thu Nov 26): menus submitted by restaurants, the Gift Guide, "Featured in" program
   `gift-guide-2026`.
6. **SoFlo Vegans 112** set (above), if @soflovegans keeps posting.
7. **Creator kit** (KJ, @keyz60, `scripts/creator-kit/`) if a creator spotlight fits the weekend.

## First task in the new chat
Lay the week out as a calendar (one row per slot: day, time Eastern, channel, kind, what, status), from the pool above, on the proposed
rhythm; bring Sean one recommendation for the week, then show each post as it will look for his yes, then load and push.

## Start here (new chat)
```sql
select slug, kind, body, created_at from playbook_records where slug in ('ve-social-schedule', 've-social-studio') order by created_at;
select slot_at at time zone 'America/New_York' as et, status, kind, title, channels from ve_social_slots where slot_at > now() - interval '7 days' order by slot_at;
```
