# Handoff 2026-11-12: the claims job (ve-claims-onboarding), split into its own chat

Playbook: `ve-claims-onboarding` (new). Related: `ve-business-dashboard` (handoff `2026-11-12-business-dashboard-shell-home.md`),
canon `canon-ve-door-guides` v12 (membership free, claiming free for members), `canon-template-gate`.
Branch with today's work: `claude/loving-sagan-3uiel1` on vegansexplore-com (b27f7ca), not merged to main.

## Why this job exists
Sean, 2026-11-12: "Veggie Grill, a huge, probably one of the biggest vegan chains, signed up on our platform, and they've claimed a couple of
their listings... we need to process these things and make sure that we're not missing on these opportunities... What are they getting? What
was their experience?... we need to get them access to their stuff." Then: "Let's lock that experience in now before we just send it to them,
because Veggie Grill is a big deal. So if they're impressed by our process and we can get Veggie Grill, at least to share a post or do something
with us, that can get a lot of other people on board with us." And: "pull this job, this whole job with the claims, the whole claims process, and
then the outreach to the ones that did claim... as its own job, so that way we can continue through the list."

## Sean's rules from this session
- **Third person always** (now in CLAUDE.md Writing): "We need to keep all of our texts in the third person. So even if they give us something in
  the first, we just change the tense so it's in the third person."
- **Tell them on the form** (open item 1): "We need to make sure that those instructions are on the page when they're filling out their
  information, so that way we don't have to change their word. They can just do it from the start. And if we do change it, they understand why
  we did that."
- **No mixed price message** (open item 2): "it says $0 for the claim... it could be talking about the $11 claim. And if they see that, it might
  be sending them mixed messages."

## Where the claims stand (live, checked 2026-11-12 evening Eastern)
| Claimant | Account | Claims waiting (`ve_listing_claims` status `submitted`) |
|---|---|---|
| Next Level Veggie Grill, "Marketing", @nextlevelvg.com, email verified, member `bb861387-f0bd-475f-8e8b-fdbaa2aa4c76`, joined 2026-11-12 2:23 PM | free member, survey not taken | 6: `veggie-grill` (UCLA, Ackerman Union), `next-level-veggie-grill` (Pasadena), `next-level-veggie-grill-burbank-d55b` (4300 Riverside Dr), `next-level-veggie-grill-long-beach-b4fc`, `next-level-veggie-grill-los-angeles-9f8d` (Sunset Blvd), `next-level-veggie-grill-tustin` (new location, quarantined until approved) |
| Chaska, Rajendra Jain (Manager), @chaskaatl.com, email verified, member `24be090f-3cee-4f68-abfb-8df8b7a73513` | free member, survey not taken | 1: `chaska` (Marietta GA, Pre-Vegan) |

Done this session (migration `supabase/migrations/20261112_claims_veggie_grill_chaska_third_person.sql`, applied and checked):
- Chaska: they made an "Add your business" application at 8:32 PM and claimed the existing listing a minute later. The application
  (`chaska-indian-vegetarian-restaurant`) is closed as the same place; their own description, tagline and @chaskaatl are on `chaska`, rewritten in
  the third person with Pre-Vegan copy.
- Veggie Grill: every description they wrote is rewritten in the third person (Vegan capitalized) in the claim's `proposed` (approval copies
  `proposed` onto the listing) and on the UCLA page. Toluca Lake application closed (same phone and place as 4300 Riverside Dr). Tustin filled:
  2955 El Camino Real, Tustin CA 92782 (The Market Place, Irvine Company Retail), placed with the chain's other locations.
- Nobody approved, nobody emailed.

## What a business gets after approval today (the gap)
- `ve-claims` `admin_review` approve sets owner and copies `proposed`; it emails **only Brand Partner (tier `brand`) claims**. A restaurant hears nothing.
- No walkthrough for restaurants (Brand Partners get Maya's Getting Started). The business dashboard (`/dashboard/business`) is built but Sean
  paused it until it is restyled to the brand kit.

## The post-claim experience (proposed by V, waiting on Sean's "lock it")
1. "Your page is yours" email, hello@vegansexplore.com, signed by Liz (the bridge to businesses), straight to their dashboard, their own words
   already on the page; one email per business, not per listing.
2. First sign-in: Liz's Getting Started, copied from the Welcome Guide (template gate), five rows, one button each: check your page (photos,
   hours, menu); feature up to 3 signature dishes; add your holiday menu to the Holiday Guide; see who is finding you; share it (a ready "Find us
   on Vegans Explore" post in their shapes from the locked brand templates, their tracked link, a caption to copy).
3. Day 2: a short personal note from Sean.
4. The ask is step 5: share the post we made for them.
5. Veggie Grill only: we set up their brand page with every location under it, and Liz's "new in the Directory" slot on podcast Episode 146
   (Sunday 2026-11-15) mentions them.
Timing default: approve all 7 together once the email, Getting Started and restyled dashboard are ready, not before.

## Open, in order
1. **Third-person guidance on the form**: `claim.html` (claim and Add your business: description and tagline fields) and wherever an owner edits
   their page (`ve-listing-admin.js`, the owner view on `directory/listing.html`, the business dashboard's Your page): a line at the field ("Write
   it the way a guide would describe you: 'Chaska serves...', not 'We serve...'") and a note that we may adjust wording to the third person.
   Sean approves the wording first.
2. **Remove the $11 claim wording**: `claim.html` (the "Your membership: from $11" step, plan cards at about lines 240, 373, 395 to 409, notes
   429 to 436, errors 576 and 665) and `directory/listing.html` about line 4877 ("Own this business? Claim it with the same $11"). Claiming is
   free for members (canon v12); check what a signed-in member and a signed-out visitor each see, at 1440 and 390.
3. **Approval flags first-person text** in `ve-claims` `admin_review` (and Depot > Claims shows the flag) so the rule does not rest on memory.
4. **Lock the experience** above with Sean, then build: the approval email for every claim (not only brand), Liz's Getting Started (Welcome
   Guide template), the share post (brand-kit templates, `scripts/brand-templates/`), Day 2 note draft.
5. **Restyle the business dashboard** to the brand kit (open item 1 of the `ve-business-dashboard` handoff) so owners land in the new look.
6. **Veggie Grill brand page**: one Next Level Veggie Grill page with all locations under it (today they hang under Long Beach); UCLA stays a
   location (still open per veggiegrill.com/locations/ucla).
7. **Approve the 7 claims** with Sean, send the emails he approved, prove signed in as a real owner at 1440 and 390.
8. **Outreach to every listing** (Sean: "reach out to every business that's in our listings... they're on our listings, they can claim it.
   All they got to do is register... land them on that first page with me talking"): a BrandDesk Outreach campaign program in HQ
   (template row: `ve_campaign_programs`), tracked `/go/` links, landing on Sean's intro page. **Outreach is paused** until Sean lifts it;
   he paused it until every page they would land on is in the new look ("I looked through a few today... it wasn't consistent"). Nothing sends
   until Sean approves.

## Start here (new chat)
```sql
select slug, kind, body, created_at from playbook_records where slug = 've-claims-onboarding' order by created_at;
select l.slug, c.status, c.created_at from ve_listing_claims c join listings l on l.id = c.listing_id where c.status = 'submitted' order by c.created_at;
```
