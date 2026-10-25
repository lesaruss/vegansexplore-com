# One dashboard, a version for each kind of member (proposal 2026-10-24, built 2026-10-25)

Built: steps 1 to 3 below (see Dashboard versions in CLAUDE.md). Not yet: the Depot What's new editor (step 4); cards are rows
in `ve_dashboard_cards` until then.

Sean, 2026-10-24: "the dashboard could actually be the main dashboard, and then we have different versions of it. So if
they're a coach... if they're a pre-Vegan, the dashboard set up a certain way. I want us to look into that."

## Recommendation

Keep one dashboard (`/dashboard`, the universal frame) and give it versions, not separate products. A version decides
three things only: which tiles come first, which What's new cards show, and which tools sit in its menu. Everything else
(the frame, sign-in, points, the Guides, the dock) stays shared, so a tool built once reaches every version.

## Who gets which version

We already ask the two questions that decide it, in the Mission Survey (`/public/ve-mission-survey.js`):

| Version | Who | Decided by |
|---|---|---|
| Business | owns a listing | `listings.owner_member_id`, or "Business owner" in Which best describes you (q3) |
| Coach / pro | coaches, chefs, health pros, creators | q3: Creator, Coach, Chef, Health pro |
| Pre-Vegan | just starting | q6: Curious / pre-Vegan, Flexitarian, Vegetarian |
| Member | everyone else | the default |

A member can be more than one (an owner who is also a coach): the dashboard leads with the first match in that order and
offers a switch to the others. Someone who has not taken the survey gets Member, and the survey is their first action
item, as it is today.

## What each version leads with

- **Business**: their business dashboard (`/public/ve-partner-dashboard.js`, built for Love Life Cafe today): numbers,
  menu, ads, campaigns, the audit. Already live on each listing; the version puts it on their home.
- **Coach / pro**: their Directory listing and its numbers, clients who found them, Opportunities and Bounties they can
  take, the Content index to quote our episodes, and the Guides they can co-create.
- **Pre-Vegan**: Your Guide first (Liz walks them), the Welcome Guide, swaps (the Dairy Guide's free swap), the city's
  Daily Pulse, the nearest 100% Vegan places, and a 30-day path of small steps.
- **Member**: today's dashboard: Daily Pulse, events, the Board, the Directory, points and rewards.

## How it is built

1. The cards are already in place: `ve_dashboard_cards.audience` takes `business`, `member`, `coach`, `pre_vegan` or `all`
   (2026-10-24). A new tool or wizard for one group is one row.
2. Add `members.dashboard_version` (set from the survey and listing ownership, changeable by the member) and a function that
   sets it when the survey is saved or a claim is approved.
3. In `dashboard/center-console.html`, order the tiles and the menu by version (a small map, version -> tile order), and
   load the What's new cards for that audience.
4. Depot gets a What's new editor: write a card, pick who sees it, set its dates.

Default if you do not change it: build steps 2 to 4 next, Business and Pre-Vegan first (Business is ready; Pre-Vegan is the
top of the funnel), then Coach.
