# Wrap: the business dashboard on the kit, Media kit, Opportunities, the weekly email, the outreach wording audit (chat of 2026-11-13)

Written 2026-11-21 when Sean cleared his queue ("make sure that whatever wasn't captured is captured, as long as it doesn't overwrite any
new things"). Playbook `ve-business-dashboard` had nothing after checkpoint 991 (2026-11-12); this chat's work is recorded here and in its
playbook rows (added, nothing replaced). The old-look sweep and the Guide art audit from the same chat were wrapped separately:
`docs/handoff/2026-11-21-wrap-near-me-old-look-guide-art.md` (checkpoint 1039). Nothing here overrides a newer decision.

## Done and live (checked on main 2026-11-21)
- **The dashboard on the brand kit** (Sean: "Approved, merge it and start the Media kit"): `business-dashboard.html` band with the stripe,
  one flat orange action, white ink-outlined buttons, Needs you / New rows, Show N more instead of boxes that scroll.
- **Media kit** (Sean: "approved"): from the database, `ve_media_kit_items` and rpc `ve_media_kit(uuid)` (migrations
  `20261113_ve_media_kit.sql`, `20261113_ve_media_kit_veggie_grill_holiday.sql`); `?tab=media-kit&pd=<key>`. The featured-business render
  script `scripts/brand-templates/featured-business.js` (`--kind holiday|podcast|pulse`); first kit: Veggie Grill's Holiday Guide post and story.
- **Opportunities** (Sean: "go ahead with Opportunities"): rpc `ve_business_opportunities(p_kind)` over `ve_dashboard_cards` (`opp_kind`,
  `interest_slug`; migration `20261113_ve_business_opportunities.sql`); filter `?k=`; I'm in writes through `ve-claims` `partner_interest`.
- **Outreach wording audit** (Sean: "go with your defaults, fix them all"): `docs/audits/2026-11-13-outreach-wording.md`, migration
  `20261113_outreach_wording_fixes.sql`; kit email look in ve-holiday, ve-badges, ve-event-headsup, ve-mission-survey, ve-pulse-subscribe;
  ve-claims and ve-stripe-webhook wording; ve-nurture on the kit look with business dashboard links.

## Later sessions built on it (keep theirs)
- Holiday hours joined Needs you (40fe5e6, 16da82a); 11 Days of Giving and the new chapters touched the dashboard (ve-giving v5 to v7).
- The KJ community manager dashboard (`/mocks/kj-dashboard`, 2026-11-19) is a copy of this shell; it is its own playbook.

## Still waiting on Sean (unchanged as of 2026-11-21)
1. **The weekly business email** (`ve-business-weekly`, migration `20261113_ve_business_weekly.sql`): built, OFF
   (`ve_site_settings.business_weekly` on false, approved_hash null, nothing ever sent). Each Monday 9 AM Eastern, one email per claimed
   business: its visitors, new opportunities, new features; a quiet week sends nothing. To start it: Sean approves the sample, then it is
   switched on (settings `{approve:true}` then `{on:true}`).
2. **The Vegan Events Guide's two member emails** (ve-nurture door track): paused. The approved wording (hash 93c13f21...) is the old
   look; the live words hash to 6ef5a8fe... (computed from main 2026-11-21), so nothing sends until Sean presses "Approve this wording" in
   Depot > Challenges > Emails. The dish-slot reminder was re-approved and sends.

## Not carried forward
- "Send my picks" on the Guide art page and the Maya and Theo skin tones: done by later sessions (picks `ve_feedback` 75188017; avatars
  theo-v4 and maya-v5, see `docs/handoff/2026-11-21-nutrition-guide-wrap.md`). The 25 Update redraws stay open under checkpoint 1039.
- New tall pictures for Liz, Nori and Kai (Sean, 2026-11-13: "Liz's doesn't. Nori's doesn't, and Kai doesn't even have one"): not made
  (Higgsfield was unreachable that day); still open, added to checkpoint 1039's list in this wrap's checkpoint. Pascal's stays.
