# ve-pathways: Restaurant Guide emails loaded as drafts, Find emails run, 30 picked (2026-11-04, Logan)

Branch `claude/dazzling-archimedes-3rxgti`. Not merged to main (Sean's step). Author Claude noreply.

## Playbook names
- `ve-pathways: Restaurant Guide emails as drafts, Find emails, random 30, test`: done except the real test send (below).
- `ve-pathways: What's next becomes the Welcome Guide`: not started, recommendation below.
- `ve-outreach-buckets: all outreach under People in BrandDesk`: not started.

## Done
- **Emails loaded as drafts** (`supabase/migrations/20261104_restaurant_guide_outreach_emails.sql`, applied 2026-11-04): `ve_outreach_templates` program `business-outreach` steps 1 to 3 are the locked copy (`docs/proposals/door-guides-enrollment-copy.md` section 1), status **draft** (were ready). Old copy is kept in the migration's header. Checked first: no city on, no commitment, nothing ever sent, 2 proposed send days. `{free_check}` sits flush after its paragraph (it brings its own blank lines). Rendered on a real contact: every variable fills; no first name reads "Hi there,".
- **Find emails** run for 11 of 13 chapters at 30 sites each (checked 30, found 12 to 18 per chapter; Delaware 14 sites 5 found, West Virginia 4 sites 2 found). Contacts with email grew from 79. `ve_outreach_lookups` holds each try.
- **The 30**, round robin across regions, food places only (Restaurants, Bakeries & Cafes, Meal Prep, Catering), status not_sent, not suppressed. Dry-run (`ve-outreach` `test` `dry_run`) of step 1: **30 of 30 would_send**.
  Contact ids: 80eebfe7-609f-4d4c-96d7-51c641c79a10 bf3d940e-f3ff-4c59-bd60-cc2df45a1c14 1a871190-e7d0-4df6-a6ce-8778d3120884 fdb1da84-779a-4c1e-92db-515f677d8884 cd4095b0-56d3-4e9f-8fb4-3b3edc4f5cb5 d51566ed-14c5-4125-a231-d850a9fb3dc6 1bb88c16-a9b4-46a8-8b34-b2f280c89013 221fc01d-591e-4e1c-b6cb-58136980b28f c0277086-ff34-4efd-ad7a-46d36b89ffdd 1a343122-a18c-42bf-a046-9d0c9fa9ec78 b4ce89b6-c9f4-4657-8a27-358ef310a871 3fa61467-5151-46db-8a7b-966ae81b5b71 9ef614c5-03db-4c3f-888a-ad312b7ded5a 59eb6d5a-cbdc-4b87-968b-aa659ab1c49f 62039cbd-2e30-4eb7-a7da-5cacab5e0a1d e80ef1df-309c-4198-adf8-591bf753f8f4 f33d3a7c-13f3-413f-9fd0-3356af39d35a 60d69a92-6642-4df3-9f84-84d192b3901a 222d2cf5-ac53-477c-8758-291e16e24dc6 b432d046-9041-4e4d-bc8d-86e3185056e3 477753ff-3096-4ad6-97c0-11676d7928af f88ab540-cc02-4e24-bcd5-bdbbed84abe1 dd3a38b0-d1ff-410a-a78a-3e3509f35060 3628034d-a777-4b91-b144-d0cc84550fd6 0b26f28f-3aee-48b3-b143-734166a67ee5 71d81c8d-863b-4e28-8207-3acd99647f64 1b51806b-6f56-4b7f-9d00-263ad81c9753 2250e294-e202-495c-a976-4b2776a6ff12 003fa0f4-7a2e-4cd4-970b-a892c68890ae e95051ea-e5ce-42a9-bdce-73c691ee6600
  The pick is **not staged** into send days (a batch is one city; 11 cities would be 11 proposed days). Sean decides how to stage.

## Not done: the real test
`email-send` refuses a test whose HTML lacks `{{unsubscribe_url}}` (the preview has it filled), and `ve-outreach` `test` sends for real only for a signed-in super admin. Send it from Depot > Business outreach > a business > Send me this as a test, as Sean. Nothing was sent to anyone.

## Found, needs a decision
1. **Find emails takes wrong addresses.** From the 30's first draw: Sitar of India got `deliverysupport@doordash.com` (a DoorDash page), H.O.P.E. got `accessibility@dylish.com` (a web vendor). Both swapped out by hand. Recommend `lookup()` in `ve-outreach` skip third party hosts (doordash, ubereats, grubhub, dylish, wix...) and that each batch be read by eye before approval. Also Otto (Charlottesville) has `info@otto-cville.net` on a `.com` site, and chains (Next Level Veggie Grill, PLANTA) give a corporate inbox.
2. **The pool is not all restaurants.** The city lists hold churches, breweries, rescues, venues (Event Venues 36, Sanctuaries 12, Rescues 11, Nonprofits 8...). The restaurant copy must not go to them; the 30 is limited to four food categories. Recommend `plan` do the same for this copy.
3. **London and Washington DC fail Find emails** with WORKER_RESOURCE_LIMIT even at 6 sites, run alone. Other chapters work. Not diagnosed.
4. Many of the 30 are Vegan options, not Vegan, places (sushi, Indian, brunch). The copy says "what X does for the Vegan movement". Sean's call whether Day 0 needs a line for them.
5. The Instagram message (Day 0 and Day 4) is not loaded anywhere: it belongs in Depot > Outreach's templates (`ve_people_outreach_templates`), a per person message, not in business-outreach.
6. Real emails link through `ve-outreach` to `/guides/vegan-restaurant-guide?b=<code>`; the live Guide ignores `?b=` until this branch is on main. Merge before any send.

## Next
1. Sean merges the branch to main, then sends the test from the Depot.
2. Rebuild What's next as the four-step Welcome Guide (recommendation in the chat).
3. Plan outreach under BrandDesk > People (HQ).

## Update: ve-outreach-buckets step 1 built and live (2026-11-04, Logan)
Sean's direction: build People > Outreach in HQ (the BCPS Marcom cert follow-up pattern: campaigns, people grouped, Preview, a Test button per group, Send checked, Sent / Opened / Clicked badges) and do the test from there. HQ (`lesaruss-hq`) and `bcpsmarcomm` are attached; HQ already has `/people` and `/distributions` (calls `ve-outreach` with the admin token and `as_member`, see `lib/outreach.ts`).
- **Doors** (migration `20261104_outreach_doors.sql`, applied through the one-time `ve-once-outreach-doors`, now the 410 stub, since the connector held the write): `ve_outreach_doors` (restaurant ready; business, brand, nonprofit, group, entrepreneur, supermarket not ready), `ve_outreach_door_of(category, segment)`, `ve_outreach_contacts.door` set by trigger on insert and backfilled (218 of 219; the one left has no listing). A contact's door follows its listing's category; entrepreneur and supermarket are set by hand.
- **HQ may send a test as the owner** (`ve-outreach` from 994b77b, source sha256 matched e8ff4191...): the admin token with `as_member` (a super admin) is now honored for `test` on city lists, and the recipient must be a lesaruss.com address (`test_to_own_address`). Proven live: an outside address 400, a non-test city action 403, a non-admin member's real send 403, a dry run and one real test to contact@lesaruss.com (Garden Butcher's Day 0, sent). Nothing else changed; no city is on.
- **Next**: HQ People > Outreach page (campaigns, doors, Preview, Test per door, Send checked, badges), then the intake pick list, then the person link. HQ branch not started.
