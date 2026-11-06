# ve-events-guide: Resources tab live, organizer account dropped for Sean's membership rule (2026-11-05/06)

Playbook: `ve-events-guide` (the rule below also touches `ve-pathways` and `ve-pricing-points-passport`).

## Done and live on main
- The Resources tab on Event Venues and Community > Events listings opens the Vegan Events Guide: `vegan-events-guide` in `GUIDES` and
  `MAP` of `public/ve-guide-tab.js`, a `door` Guide (chips "Free with a short survey", "Rain plan free"; ownership read from
  `ve-guide-unlock` status, which opens a door Guide for any active member). Script cache bumped to `?v=2` in `directory/listing.html`.
  Commit 866554c (author Sean A. Russell), merge 29eb511 (merge commit authored Claude, not rewritten), note 88c3886.
- Checked live at 1440 and 390 px: the-rotunda (Event Venues) and vegan-street-fair (Events) show the Events Guide card, no page errors,
  no sideways scroll; be-an-animal-hero still shows the Nonprofit Guide.

## Sean's membership rule (2026-11-05, stated, NOT locked; canon unchanged)
1. Getting in: a visitor becomes a member by finishing a Guide's survey (250 points) or paying the $11 (then prompted, not required, to take
   the survey for 250 points).
2. Once a member, Guides are bought for $11; the survey is no longer a way to unlock a Guide.
3. Exception: the business Guides (Restaurant, Creator, Events, Nonprofit). Their survey is the application; a member who came in through one
   and wants another fills out that one's application.
4. After that, members are guided toward giving their time or money in exchange for our services and promotion.

Open question for Sean (asked, not answered): Logan's reading is topic Guides (Dairy, Nutrition, Airport, Stadium & Arena, Theme Park,
Supermarket) are $11 (or 1,100 points) for members with no survey route, and the four business Guides are intakes that anyone, members
included, opens by finishing that Guide's application. Confirm, and say "lock it".

If locked, the build in order: Guide survey points 100 to 250; the Creator and Nonprofit Guides become free with their application (Creator's
application exists at `/gigs/sample#join/1`); a member who has not done a business Guide's application sees it first; a "Take your survey,
250 points" prompt after the $11; the policies page, Guides' facts and saved answers. Canon to update: `canon-ve-door-guides` (v6),
`canon-ve-people-campaigns-doors`.

## Dropped
- The free organizer account for a claimed host with no account: not needed under the rule. A host takes the event survey (the survey door
  makes the account; `trg_ve_event_claim_link` links the approved claim when the account appears). Remaining small task: make sure the claim
  emails point hosts to the event survey.

## Still open on this playbook
- Save the 12-week plan to the account (now `localStorage` `ev_checks`); a Depot view of `ve_door_guide_stats`.
- This month: question of the month, your story, good news, private struggling clip.
- Host path steps 3 to 5 (`ve-event-host-path`).
- Watch: nobody had finished the event survey as of 2026-11-03.
