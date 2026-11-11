# Handoff, 2026-11-10 to 11: Holiday launch, Outreach cleanup, Directory doors, the Color Block lock

Playbook: `ve-outreach-buckets` (decision rows for every item below). Next project: the Vegans Explore brand kit (new playbook).

## State right now
- **All outreach campaigns are PAUSED** (Sean, 2026-11-11: "pause all campaigns until we lock this in"), 12 campaigns, 2,009 people waiting;
  only `welcome-community` (people who join on their own) runs. Migration `20261111_pause_all_campaigns_for_brand.sql`. Resume per campaign
  in HQ Outreach only when Sean says so.
- **The look is LOCKED: Color Block** (canon `canon-ve-look-color-block`; concept `/mocks/directory-looks/bold`). Order Sean set: brand kit
  (every element) > homepage > every page in the preview > live > every LESARUSS brand. Nothing applied piecemeal before the kit is locked.
- Sandy Pukel (Holistic Holiday at Sea) personal email: on hold with the pause; reminder `trig_01JjrFkBdpGneu9Zxjddj1P5` only reminds.

## Built this session (all live and proven unless noted)
- **Holiday launch**: `/hello` landing (video, voice notes), five launch groups (Registered 38, Business 425, Foodie Fest 277, Everyone Else
  1,269; Creators empty), copy run through PANEL twice (who we are, SoFlo Vegans recognition, Founding Member deadline, reply line).
  Subjects: "From Sean at Vegans Explore (SoFlo Vegans)" (Everyone Else, Business, Creator, Foodie Fest), "A quick note from Sean at Vegans
  Explore" (Registered). 12 Business emails went out on 2026-11-10 before the pause. Migrations `20261110_holiday_launch_*`.
- **HQ Outreach**: decision-first home, six status words, campaigns with parts, group pages with Select all and Move to review, People >
  Review (put back / Do not contact / remove), backup emails off lists (lesaruss-hq up to 365f327; DMs to send also handle Messenger).
- **Duplicates**: primary and backup emails (`ve_outreach_backup_emails`, 63 pairs; a bounce on the primary brings the backup in by trigger
  `ve_backup_on_bounce`); Sean's own four addresses and an Apple relay removed. Migration `20261110_outreach_backup_emails.sql`.
- **Tracked DM**: David Schwartzberg (South Florida Vegans) by Messenger, link `holiday-david-sfv`.
- **Directory Travel > Cruises**: 8 listings (3 Vegan cruises, 5 lines with Vegan menus), logos, "Sails worldwide". `20261110_travel_cruises.sql`.
- **Directory navigation**: BOSS (`docs/proposals/2026-11-11-directory-navigation-boss.md`), PANEL, mock `/mocks/directory-nav`, working
  preview `/directory-preview` (seven doors, live counts by location, merged pills; unlinked, noindex). `/directory` itself is unchanged.
- **Design panel**: four looks at `/mocks/directory-looks/{warm,bold,editorial,app}`; Sean picked bold (Color Block).

## Waiting on Sean
- Lines the Color Block designer added: "Members vote. The best rise to the top." and "Your vote moves the list."
- Nouns vs verbs door names (test planned; may be settled in the brand kit work).
- Travel: research (retreats, stays, apps, airline Vegan meals), travel agency BOSS, airline media note; affiliate rule (list on merit,
  Book with us where we can sell, disclose, label Sponsored).
- When to lift the campaign pause.

## Next chat
Brand kit for Vegans Explore on the Color Block look: foundations, imagery (incl. the Guide scene recipe; ask Sean what he meant by the
GeekFon image), templates (social frames, carousels, stories, reels, thumbnails, video open/close/lower thirds, podcast cover, email header,
ad banners), the Guide roster with locked art, bios and voices. Then the homepage, then each page in the preview.
