# vegans-explore-initiative-business-certification: A1 Pre-Vegan door, A3 Standard V1.2 doc, A8 job posting

Handoff, 2026-11-05. Logan, build mode. Nothing sent, nothing charged, no city on.

## Done

- **A1, Pre-Vegan places off restaurant outreach** (migration `supabase/migrations/20261105_pre_vegan_door.sql`, applied after a
  rolled-back dry run; live counts matched it). New door `pre_vegan` (not ready). 71 food places that are not 100% Vegan moved off the
  restaurant door (61 not sent, 10 held). 23 contacts on not-ready doors taken off South Florida's proposed send days (21 Pre-Vegan places
  incl. the five pilot picks, plus Garden of Life on the brand door and Rose of Sharon on the nonprofit door): Nov 10 now 5 (4 not sent and one
  opted-out row), Nov 11 now 9, all 100% Vegan, both still proposed. `ve_outreach_plan` and `ve_outreach_due` skip a contact whose door is not
  ready (no door, a people list, passes). New contacts get their door from `vegan_status` on insert (`ve_outreach_door_of(category, segment,
  vegan_status)`: a food place that is fully_vegan goes to restaurant, anything else incl. unknown to pre_vegan). Turning Point Boynton Beach
  held, merged into the Wellington contact (same inbox). 95 `ve_outreach_events` note rows.
- **The six names, read on their own sites through pg_net** (the build session cannot reach outside sites): Soul Vegetarian No. 2 ("100%
  VEGAN") and Ci Su ("All Vegan") set to 100% Vegan on Sean's word (`20261105_soul_veg_cisu_fully_vegan.sql`, a `ve_listing_edits` row each);
  Garden Butcher (chicken, turkey, ham, eggs), Bakaris, Leonor's and Govinda are correctly not 100% Vegan and moved.
- **A3**: Standard V1.2 as one Claude Doc, https://claude.ai/artifact/Xq9dNKRvsSMPFupWqXAUa9 . E1 to E8, the 14 contract clauses and the
  incident plan are Logan's drafts from the locked gates; the Legal Research Report V1 (Word) was not in the session, so check them against it.
- **A8**: the Verifier and second-approver job posting, https://claude.ai/artifact/76Vk7EVHwsN6uMfM8eZDbY . Not posted.
- Both migrations on `main` (dacf6bc), production deploy READY.

## Found

- The live `ve_outreach_due` joins `oc.kind = 'people'`, a guard in no repo migration before today: city lists (business outreach) cannot
  send at all. Kept exactly as found. Before any city is turned on, someone must decide whether that guard stays.
- Garden Butcher's Directory description says "Vegan options are available"; its own site never says Vegan. Not changed.

## Next

- **Sean**: final check of the Standard doc and the job posting; A4 name the attorney; A2 entity (dissolution on hold until counsel answers
  conversion to an LLC and the board vote).
- **Sean**: merge `claude/fervent-hamilton-fc48qo` (CLAUDE.md "Pre-Vegan Certification" section and the earlier handoff); not on `main`.
- **Logan after A4**: B1 Verifier visit form and desk-review checklist, B2 pre-assessment questions.
