# ve-restaurant-guide: the two after-membership notes built as drafts; first send day reviewed

Date: 2026-11-05 (Thursday). Playbook `ve-restaurant-guide`. Branch `claude/happy-galileo-w9ajk0` (merged `claude/gifted-rubin-ek818o` in). **Nothing sent. No city on.**

## Built
- **"You're in" and Day 7** in `ve-nurture` (deployed from 55f05c22, source sha256 37cd30cc... matched): kinds `door-rg-in` (the day they finish the restaurant survey, never more than 3 days late) and `door-rg-7` (day 7 to 14), recorded in `ve_door_emails`. **Their own switch and approval**: `nurture.rg_door_on`, `rg_door_approved_hash` (`settings` with `rg_door_approve` / `rg_door_on`); the Events Guide notes stayed approved and on (hash unchanged). Draft and off now. Depot > Challenges > Taster emails shows the card with Approve, Switch on and Read links; preview takes `listing_slug` and `first` for a real business.
- The business: the listing they own, else the outreach contact at their email (gives their `?b=` Guide link). Founding line only for a Founding Member and only before 2027-01-01 05:00Z. Signed Vegans Explore team (default; Sean's placeholder answers were not filled in). One word changed from the draft: "If we can help" (was "I") since it is signed by the team.
- **Fixed on main's page**: an unescaped apostrophe ("Guide's") had broken the whole script on Depot > Challenges.
- **Fixed the outreach subjects**: `ve_outreach_render` now fills `{first_name}` in the subject (Day 4 would have gone out as "Your page is waiting, {first_name}"); no name drops ", {first_name}". Migration `20261105_outreach_subject_first_name.sql`, applied. Base function unchanged.

## First send day (South Florida, Tue 2026-11-10, proposed, 19 contacts)
Only 4 are 100% Vegan restaurants (Sean's rule for now): Darbster, Sobe Vegan, The Rabbit Hole, Vegan Cuban Cuisine. Flags: Darbster name Derrick vs breanna@; all four names and emails come from the listing with no source; Rabbit Hole also has Sean's personal draft to chefsam@therabbithole.life (Depot > Outreach); sobev.com did not open in an earlier scan; Florida Animal Rescue Alliance is opted out but still on the day; Rose of Sharon uses a roseofsharonla.com address with no website; Garden of Life (brand door, an orders inbox); Motek and Zak the Baker catering@ inboxes; Turning Point info@tpbbl.com shared by two contacts; Cafe Sapori email domain differs from its website.
A dry run made two spare tracked links for Darbster (bo-k8fmwwb, bo-yd8jwkf), switched off; the contact keeps bo-tyfraan.

## Open for Sean
Sender of the notes, the Founding line, approval of the notes; the cleaned send day; which city goes on.
