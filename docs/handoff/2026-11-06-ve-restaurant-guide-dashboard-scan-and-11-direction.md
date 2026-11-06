# ve-restaurant-guide: sample dashboard scan, and Sean's $11 direction

2026-11-06, Logan. Playbooks: `ve-restaurant-guide`, `ve-pricing-points-passport`, `ve-outreach-buckets`.

## Done and live (main 354a462)
- Restaurant Guide emails v2 rebuilt under this account: https://claude.ai/artifact/7TpQNMQXHLNKUMRQLt96MA (drafts; nothing sent, no city on).
  Flow: invitation (Explorer first, as a person) -> Explorer -> "Your Guides" email 2 days later -> restaurant intake notes.
- `/business/sample` (Green Leaf Kitchen) Your page opens the real five-step owner editor in demo mode (`OE_DEMO`, `oeDemo` in
  `directory/listing.html`); every save toasts "nothing was changed". Checked live at 1440 and 390 px.
- Dashboard scan (`public/ve-partner-dashboard.js`): join box and Your plan say membership is free with the Explorer survey, the $11
  Passport the other way in; door Guides read "Free with a short survey" (`DOOR_GUIDES`, `g.door` from `ve-claims`, deployed).
- Restaurant and Creator Guide descriptions fixed (migration `20261106_guide_descriptions_restaurant_creator.sql`, applied).

## Sean's direction, NOT built (2026-11-06, his words)
"Let's move away from the $11 passport and it just be the certification, because then we can just focus on pushing them through
different opportunities. We want to get people through the door and keep them engaged... versus us throttling it because of the $11 charge."
Logan's reading: membership is free (Explorer survey only); the $11 Passport stops being a way in; paid money moves to the
certification (Pre-Vegan Certification) and the business offers. Confirm with Sean before building:
1. Does "the certification" mean Pre-Vegan Certification only, or any paid badge/offer?
2. Keep the optional $11 contribution (What's next tile) or remove it?
3. What happens to the 1,100 welcome points, topic Guides at "$11 or 1,100 points", the Founding line, Partner plan ($111)?
Touches: canon `canon-ve-door-guides` (v7), `canon-ve-pricing` / points rules, `passport.html`, `/business` Get started, nav.js Join,
`ve-auth.js` $11 window, `ve-partner-dashboard.js` join box, policies, Guides' facts and saved answers.

## Still open
- Restaurant Guide's Get in is its own survey, not Explorer-first (v7 build step 5; waits for Explorer to exist).
- Campaigns on a person's profile (active campaigns, upcoming emails, edit) queued in `ve-outreach-buckets`.
- Sean's fresh look at https://vegansexplore.com/guides/vegan-restaurant-guide.
- Liz's group-page lines; re-record her member welcome; V1 tab-by-tab lock-in.
