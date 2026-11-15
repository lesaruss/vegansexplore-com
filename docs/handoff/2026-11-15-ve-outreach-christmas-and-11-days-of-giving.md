# 2026-11-15: Outreach, Christmas Menus and 11 Days of Giving

Playbooks: `ve-outreach-buckets` (sending) and `ve-holiday-guide` (Christmas, 11 Days of Giving). Logan, cloud session, branch
`claude/modest-brown-klnzla` (merged to main each step; nothing unmerged). HQ: `lesaruss-hq` main d685639.

## Sean's decisions, in his words

- Pace: "yes, step it up Wednesday" (Holiday Launch Everyone Else 125 to 195 a day from Wed Nov 18, if Mon/Tue complaints and bounces are clean).
- "let's have a field for people who complain, just so I know who it is... I would like to know people who don't want to hear from us."
- Next Level: "when there's one person who's running multiple accounts, we just send them one communication."
- "shift to how to Christmas... the secondary is we still have a few days if you want to submit for Thanksgiving... once they... claim, then they get information about the 11 days of giving." Then "yes, approve them and build 11 Days of Giving."
- "yes, make it live and build the entry page"; "yes, put it live and record Theo's line."
- "write it up for the attorney. We'll put it on the list... but let's keep moving forward."; "yes, build the prize form."
- "yes, approve the Featured in emails" (they were already switched on from his account at 6:08 AM ET).
- Brands: "reaching out to CPG brands to be giving out holiday packs... a good entry point for them to start working with us" and "We'll run ads on our network... promote it on different pages... give them a report at the end... a social media campaign... a full picture... so they can make an easy choice."

## Done and proven live

| What | Where | Proof |
|---|---|---|
| Campaigns take turns (round robin) | `ve_outreach_campaign_due`, migration `20261115_campaign_due_round_robin.sql` | next batch shows every Holiday Launch group (was all Businesses) |
| One email per address per campaign | same function, `20261115_campaign_one_email_per_address.sql` | every due address unique; Businesses 375 to 369 |
| Second send run at :05 | cron `ve-outreach-send-b`, `20261115_outreach_send_second_tick.sql` | first run 6:05 AM ET answered "outside sending hours" |
| Opted out tab | HQ Outreach > Roster (`?optout=1`), view `ve_opted_out_people` (`20261115_opted_out_people.sql`) | 8 people (3 spam, 5 unsubscribed); API 403 signed out |
| Christmas Menus (approved, starts Tue Nov 17) | program `christmas-menus-2026`, groups `christmas-2026-vegan` (33) and `-plant` (56) | locked, active, renders; menu form countdown follows `?holiday=` |
| Featured in the Holiday Guide (Mon Nov 16) | `gift-guide-2026` program | 28 due Monday; Finchberry listing approved (`20261115_finchberry_listing_approved.sql`) |
| 11 Days of Giving: dashboard opportunity | `ve_dashboard_cards`, button "Give a prize" (`?pd=giving`) | RPC shows it for food, brand, service |
| 11 Days of Giving: entry page | Holiday Guide `#/giving`, Theo scene `theo-giving.jpg`, line `theo-giving-v1.mp3` (stt matched) | live at 1440 and 390; Play Theo plays; rules hidden until reviewed |
| Prize form + review queue | business dashboard Opportunities > 11 Days of Giving; Depot > 11 Days of Giving (`/admin/depot/giving`) | prize renders on the page (stubbed answer); Depot gates |
| Brand walkthrough (for Sean's lock) | `/partners/giving` (noindex), Liz scene `public/partners/liz-giving-brands.jpg`, form into Leads | 6 slides fit 1440x900 and 1366x768; form tested, test row removed |
| Function `ve-giving` v4 (new) | status, enter, entries, my_prizes, prize_photo_url, prize_save, prize_withdraw, prize_queue, prize_review, brand_interest | smoke-tested signed out |
| Attorney write-up | https://claude.ai/artifact/PQMHdQxyCKabWFw7ysdimV ; `legal_questions` (8 on the giveaway) | |

## Built but not proven live

- A signed-in owner saving a prize, and Approve in the Depot (no owner session here). The first real prize tests both.
- A signed-in member entering (entries closed until the attorney's read; a super admin can test-enter).

## Waiting on Sean

1. Lock the brand page `/partners/giving` (the $150 per pack is Logan's proposal). Then: raise the `ve_giving_prizes` value check for packs, build the brand list (137 brand listings, 13 with an email), show the email.
2. The attorney read of the rules (doc above); then `ve_site_settings.giving_2026.entries_open` / `rules_reviewed` on his word.
3. Which brands gave last time (for the list).

## Scheduled

- Wed Nov 18, 8:30 AM ET (send_later `trig_0194UAojsPbSZbkEPzzVqot3`): check Mon/Tue Holiday Launch numbers; if clean (at most 1 complaint, bounces under 5%), raise `holiday-launch-explore` to 195 with `20261118_holiday_launch_explore_pace.sql`.

## Watch

- Friday's 1 spam complaint in 70 (1.4%, over Gmail's 0.3%) and bounces about 6% since Nov 9.
- Founding Cohort Wednesday follow-ups are still drafts and stale (meant for Nov 11); recommend retiring.
