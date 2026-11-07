# branddesk-production-wing: lookbook locked, Depot home extras, Depot clean-up (2026-11-07)

## Done
- **Lookbook format locked** (canon `canon-ve-guide-tour-standard` v4 `lookbook_format_v4`; migration `20261107_lookbook_frames.sql`). Depot > Guides > Guides and tours > a tour > Lookbook: white player (frame, words, time, Play the tour through the chapter recordings, Back / Next, a progress bar you can tap, numbered frame buttons), a legend, one card per frame with readiness (Ready, Recapture, Mock, B-roll) kept apart from the decision (Waiting, Approved, Redo). On main (c52f3bf).
- **Depot home extras** (main a8202ee): My list (stars, `ve-depot` `pin_set`, `ve_site_settings` `depot_pins`), Logos back inside Directory, a thumbnail on every tool (demo pictures `public/depot/demos/`, taken signed out; admin captures only in the private bucket `depot-thumbs`, handed out as one-hour links by `ve-depot` `home`), each tool's own waiting count, Guide banners on the Guides section.
- **Depot clean-up** (branch `claude/compassionate-newton-md1a49`, a40da58, **not on main**): Social, Playbooks and Business outreach went to the trash bin (they still open by address and can be restored); a BrandDesk section of six links opens HQ rooms in a new tab. Nothing in HQ was changed. `ve-depot` is deployed from a40da58 (source sha256 matched) and is safe on main.

## Decisions (Sean)
- The podcast stays in BrandDesk. Its platform side (the content index, Books, the Pulse's episode pages) stays in Depot > Content.
- All people work goes into BrandDesk Outreach as filters: partners, Founding Members, Ambassadors, members, leads, role applications. All analytics go into BrandDesk Insights: Analytics, Community Insights, Platform health. BrandDesk clients does not belong in the Depot. The Depot keeps a read-only member list.
- Logan pushed back on timing and Sean agreed: a Depot page is retired only on the day its BrandDesk version works. That covers commission payouts, invites, referral credit and client onboarding.

## Next (in order)
1. Merge a40da58 to main when Sean says so.
2. Analytics into BrandDesk Insights, on an HQ branch: the chapter ranking, the Directory, Events and Media sections, Guide tabs, Google costs, Community Insights (under Insights > Members) and Platform health. Then retire the Depot pages.
3. Outreach Roster gets a "who" filter: Members, Leads, Invited, Founding, Nonprofit and Group Partners, Community Managers, Role applications, Referral claims, Ambassadors. Commission payouts move to Insights.
4. A BrandDesk Clients room in HQ.
5. A read-only member list in the Depot.

## Also open
- A Podcast tile in the Depot.
- Picture headers for the busy admin pages.
- The 3-second tour plan (about 40 frames). It uses sample-data captures only, because the video goes public and must show no member data.
- The rewritten chapter 5 line, for Sean to approve before it is recorded.
- Sean's 19 lookbook decisions.
- The BrandDesk tour script.
- Merging Ideas: `ve_ideas` versus `blueprint_ideas`.

## Not verified
- The admin thumbnails and the pins, signed in on live data.
