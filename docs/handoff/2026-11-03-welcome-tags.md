# Handoff 2026-11-03: ve-pathways: the Welcome, retiring the Taster, and tags

Playbook `ve-pathways` ("Three doors and campaigns on people"). Index row, playbook records, canon note and checkpoint written at wrap-up.

## Done
- **ve-pathways: the updated Welcome**: `/passport` is the one free, public Welcome (nine tabs, a Guide each, free pieces of every Guide, **Enter the room** with the survey and the $11 as equal cards). Live (PR #141, d06326d region; checked on vegansexplore.com at 1440 and 390 px). `/business` unchanged.
- **ve-pathways: retire the Taster and challenges**: `/guides/taste` and `/challenges` redirect to `/passport` (`?unsub=` exempt), out of the catalog and sitemap, `nurture.tasters_on` false. Nothing deleted. Live (PR #142, d06326d). Migration `20261103_retire_taster_challenges.sql`.
- **ve-pathways: profiles with groups, step 1**: tags, not groups. `ve_tags` (4 seeded), `ve_person_tags`, `ve_tag_rules` (all off, preview first), `ve_tag_add/remove/rule_matches/rules_run`, cron `ve-tag-rules`. Migration `20261103_people_tags.sql` applied and proven in rolled-back transactions as Test Manager. No page, no edge function yet.

## Sean decided (2026-11-03)
Tags (not groups); touched people only; seed Sponsor interested, Vendor, Volunteer, Pre-ticket; Depot for now.

## Not done / Sean's to do
- Real survey path as a signed-out visitor was only clicked against mocks.
- `next-v1` video still says "Passport"; a new cut is Sean's call.
- `ve-taster` and `ve-challenge` start actions still answer if called directly (no function was deployed).
- The first tag rule (sponsor-ad click tags Sponsor interested) waits for a real sponsor link; every rule starts off.
- Sean's earlier to-dos still stand: preview and switch on Pulse subscribe (`pulse_subscribe.on`), first real Depot > Outreach batch, Nov 10 Watchlist decision.

## Next (Logan)
Step 2: the profile page, Depot > People > a person (`#person/<key>`): who they are, tags (add and remove with a reason), every email sent, opened and clicked, notes, actions, Give and Take back points for a member, one timeline. Needs an edge function (read `ve_people_outreach`, `ve_people_outreach_notes`, `ve_initiative_interest`, `ve_links`, the member by email, `ve_person_tags`); copy `admin/depot/social.html`'s shell and Depot > Outreach's person views. Step 3: tag chips and a tag filter in Pick people. Then campaign homes in BrandDesk.

## Lessons
- `ve_initiative_interest.source` only allows form, link or email; a proof row needs one of those.
- A count in the same SELECT as a function that writes reads the snapshot from before the write: check in a separate statement.
- Merge `main` into the branch before pushing: another session was pushing to `main` all day (Door Guides canon v3, ve-feedback).
