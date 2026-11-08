# ve-holiday-guide: Sean's notes built, Theo's tour recorded, restaurant note being finished (2026-11-08)

Playbook: `ve-holiday-guide`. Logan, Build mode. Everything below is on `main` (merge 2cf0d03, then f6b4f87, b0f4341).

## Done this session
- **Live check** of `/guides/holiday-guide` at 1440 and 390 px. The Events tab asked for the wrong tenant id and was always
  empty; fixed (`VE_TENANT` 00000000-0000-4000-a000-000000000002), live shows 10 events.
- **Sean's notes built**: never the word Friendsgiving (copy, lines, Events filter); plain words, no listing the five ideas in a spoken
  line; holidays open as they get close, closest on top, the rest in a menu; ThanksLiving alone in the email.
- **Tell us about a menu**: members send a place and a link (`#/menus/tell`); `ve-holiday` v5 `tip`, `tips`, `tip_review`; table
  `ve_holiday_menu_tips` (migration `20261108_holiday_menu_tips.sql`); Depot > Holiday menus has Sent by businesses, Spotted by
  members, Add a menu we know (team tips go live at once). Proven 15 of 15, no test rows left.
- **Sanctuary ThanksLiving events** on the calendar and approved: Full Circle Farm (Nov 14), Farm Sanctuary Acton (Nov 21), SARA
  (Nov 24), Luvin Arms (Nov 26) (`20261108_holiday_sanctuary_events.sql`).
- **Theo's Overview tour** (script v2) approved and recorded: `vegan-media/media/voices/holiday-guide/theo-tour-<1..8>-v1.mp3`,
  stt-checked, about 1:25. Overview Play runs all eight; each tab plays its chapter (`TAB_CH`). Tab lines equal the chapters.
- **Canon** `canon-ve-holiday-guide` v2 (`update_2026_11_08`).
- **Restaurant note (step H)**: words approved; no send day (Sean: schedule last, once it is finished). All 96 addresses read by
  eye, 6 off (not the business's own), 90 left. Both versions sent as [Test] to contact@lesaruss.com. Drafts not loaded in Depot >
  Outreach yet, because every draft needs a day.

## Waiting on Sean
1. Read the two [Test] ThanksLiving emails in contact@lesaruss.com; when good to go, pick the send day. ThanksLiving menus close
   at the end of Nov 18, so about a week before that works best.
2. Should the Fort Lauderdale "Vegan Friendsgiving: Rooted In Culture Pop-Up" event come off the main calendar? (It is already out
   of the Guide.)
3. The $25 Meta test stays parked until Sean is paid Friday. Merging to main is Sean's call.

## Logan next
- On Sean's day: load the 90 drafts into Depot > Outreach (campaign `holiday-thanksliving-2026`, each its own tracked link, from the
  team), for his approval. Follow-ups stay light.
- Then: the tour lookbook in Depot > Guides and tours (`ve_video_tours` slug `holiday-guide`), animation and the edit; brand
  sponsorship outreach (idea queued); holiday hours on Your page (E), Give back donation links by Dec 1 (I), wish lists (J), other
  holiday tabs (K), banner (L).
