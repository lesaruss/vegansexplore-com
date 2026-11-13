# Handoff 2026-11-13: claims onboarding, the claim form and the business dashboard are live (ve-claims-onboarding)

Playbook `ve-claims-onboarding` (decision rows written through 2026-11-12, all with Sean's words). Previous handoff:
`docs/handoff/2026-11-12-ve-claims-onboarding.md` (branch `claude/loving-sagan-3uiel1`). Everything below is on `main`.

## Not written at wrap (the Supabase connector failed to connect to the session, 502, Fri Nov 13 morning)
The new chat writes these first: a `brief_checkpoints` row (status handed_off, this handoff's path) and a `stream_events` row for the wrap,
then confirms Liz's two emails (below). The playbook rows are already in.

## What Sean decided this session (his words)
- Locked the claims system after a BOSS: "Yes, lock it and build the guided walkthrough first so I can visually see what this is going to be."
  Walkthrough: `/mocks/claims` (13 slides).
- His launch message, saved verbatim in the playbook: "come on board for free, give me feedback, tell me how we can make it better... by the
  time we launch, we're going to have a platform that everybody wants to be a part of."
- "We don't have to say anything about the $11. They don't know about it." The claim only ever says Free.
- Ran a PANEL (5 lenses) at his request; result: give first (their page and post during the claim), Liz walks it, the voice check is live,
  the dashboard parts visible, Share your post in a phone frame.
- Bounties for businesses: "the store should earn" by taking part in campaigns (gift cards good at any location, Thanksgiving menus,
  recommending a business); "that's the only way they can give out their own bounties, by using the points"; member bounties open per
  community "once we are able to lock in a community manager." Weekly update with their community and the World Vegan Expo.
- Dashboards: "I'm okay with the more than 6 things on a dashboard and the navigation if we use the sliding feature" (CLAUDE.md and
  `canon-ve-business-dashboard` nav_v3 updated).
- "Approved, go with your defaults": point values as shown; "A founding business" on the post; the Expo line "Founding businesses hear
  first" HELD until he says yes.
- Business email on Your keys ("encourage them to use their business email address and give them an example").
- The 24-hour clock: "set the expectation and we over deliver" (promise 24 hours, target 2).
- "Is this even the new style?... it's using the old version of Liz": a template-gate repeat; postmortem logged (lesaruss-context
  `console/postmortem-log.md`), CLAUDE.md form row and `canon-template-gate` extended (Guide layout rail, Color Block, show Sean beside the mock
  before live).
- "I approve both businesses... what I want them to land on is what you showed me earlier with Liz... put an email together." Then "go".
- "I need a view as this business. Same way on BCPS Marcom, I can log in as any user."

## Live now (proven live at 1440 and 390 unless noted)
- `/claim`: the free claim for members in three steps (Is this you? with the shared Directory card, Describe it with the live voice check and
  Liz's third-person rewrite, Your keys with Business email), Liz on the Guide layout rail with Hide me, their post preview, never a price;
  the 24-hour clock after sending; a new owner gets their business's survey (restaurant, Pre-Vegan business or organizations) and the claim
  sends itself on return. Brands, podcasts and `?plan=` links keep How to join.
- `/survey?for=claim`: Color Block, Liz on the rail, no Explorer step first.
- `/dashboard/business`: Welcome, <name>. You're a founding business; Getting started with Liz; the seven parts as one sliding row; Media kit
  with their post in a phone feed, downloads, their `/go/` link and caption; a chain's Location switcher. Owners land on it from `/dashboard`.
  (Proven with the sign-in faked in the browser; the first real proof is an owner signing in.)
- The 7 claims approved (Chaska; Next Level Veggie Grill Pasadena, Burbank, Long Beach, Los Angeles Sunset, Tustin, UCLA), Tustin public.
  Migrations `20261112_approve_veggie_grill_chaska_claims.sql`, `20261112_claims_approved_links_and_liz_email.sql`.
- Posts and stories per location: `public/claims/<slug>/post.jpg|story.jpg` (`scripts/brand-templates/find-us.js`). Tracked links
  `go/chaska`, `go/nlvg-pasadena|burbank|long-beach|sunset|tustin|ucla` (initiative ve-claims-onboarding).
- Liz's approval email: HQ program `claims-approved-2026-11`, people campaign `claims-approved-liz` (approved, start Nov 13), two members
  (chaska@chaskaatl.com, Rajendra; marketing@nextlevelvg.com, the team), each with Sean's approved words and its own tracked link to
  `/dashboard/business`. Should have sent with the first `ve-outreach-send` run after 9 AM ET Fri Nov 13. NOT CONFIRMED (connector down).
- Sign In As any member: `ve-switch-account` v2 (deployed; account menu search "Find any member or business"); super admins excluded;
  logged to stream_events. Chaska and Next Level Veggie Grill are on the short list.
- A super admin, or the owner on their own page, is never counted as a listing visitor. The admin preview no longer shows the admin's own
  listings in the Location switcher.

## Waiting on Sean
- Liz's four new claim-form lines, to approve before they are recorded with the current Liz (text only on the page until then):
  isyou, describe, keys, freedone (in `claim.html` LINES).
- The Expo promise "Founding businesses hear first" (held).

## Next, in order
1. Write the checkpoint and stream event (above); confirm Liz's two emails sent (`ve_outreach_campaign_members` send_status, last_sent_at;
   `ve_outreach_events` kind sent, detail.campaign = claims-approved-liz); tell Sean the times in Eastern.
2. Watch for the owners' first sign-in (their `/go/` clicks; `ve_initiative_interest`).
3. The approval checks in `ve-claims` `admin_review` (domain matches website, duplicates, first person), then auto-approve when all pass
   (the 2-hour target).
4. Owner dashboard data from `owner_dashboard` instead of the first group's map in `business-dashboard.html` (POST_OK); render posts at
   approval automatically.
5. Bounties for businesses (earning), the weekly update, the dashboard's other parts in the new look, the designed email template in outreach.
6. The shared Directory card still labels Pre-Vegan places "Vegan options" (`public/ve-region-directory.js` VEGAN_LABEL,
   `public/ve-listing-admin.js`): relabel as Pre-Vegan.
