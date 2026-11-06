# ve-signature-dishes: J (slot reminder) and K (Top dishes on hubs), live

2026-11-06, Logan. Sean: "No, we can move forward if it looks good." Proposal and draft: `docs/proposals/signature-dishes-j-k.md`.

## J, the slot reminder (live, switched on)
- `ve-nurture` kind `dish-slot` (`dishTick`, `dishEmail`, `dishOff`): 3 days before a paid slot (4 or 5) ends, one email to the member who paid,
  only while they still own the listing and only when a featured dish would come off the page. Any day, 10 AM to 5 PM Eastern.
- Claimed by `ve_dish_slots.reminded_at` (with `remind_result`, `remind_send_id`; migration `20261106_dish_slot_reminder.sql`); a failed send frees the claim.
- Through `email-send` brand vegans-explore, campaign `ve-dish-slot-ending`, signed Vegans Explore team.
- Own switch and approval: `nurture.dish_on` true, `nurture.dish_approved_hash` set (Depot > Challenges > Taster emails). Any wording change puts it back to draft.
- Deployed `ve-nurture` v10 from 89936dd (source sha256 matched). Test sent to contact@lesaruss.com. Not proven: a real send (no paid slot exists).

## K, Top dishes on every chapter hub (live)
- `ve-signature-dishes` action `top` (public): each place's most-voted shown dish over the last 90 days with 3+ votes; ties to the dish that reached
  its count first, then A to Z; never boosted. Deployed from 05810a3 (sha256 matched).
- `communities/hub.html` `#hub-ov-dishes`: the chapter's (address by `HUB.match`, or `communities`), up to six, shown only once there are 3.
- Checked in a browser with mocked data at 1440 and 390 px. Live today: no dish qualifies, so the section stays hidden.

## Open
- Nothing to build. Watch for the first paid slot (reminder) and the first chapter with 3 qualifying dishes (hub section).
