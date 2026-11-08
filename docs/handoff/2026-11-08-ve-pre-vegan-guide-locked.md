# ve-pre-vegan-guide: locked, handed to Logan (2026-11-08)

Locked by Sean ("lock it") in a concept session with V. Canon `canon-ve-pre-vegan-guide` v1 holds every decision and the full Days 1 to 7.
Migration note `supabase/migrations/20261108_pre_vegan_guide_canon.sql` (canon, playbook record, index row; applied).

## What it is
A free door Guide for people ready to go Vegan who do not know where to start. Maya narrates. Parent: the Vegan Dairy Guide (template gate).
The Pre-Vegan survey = Explorer's questions + 5 Pre-Vegan questions in one flow, 250 points, admits. Replaces the Coming soon Pre-Vegan Guide card.
Inside: the members-only course **111 Days to Going and Staying Vegan**.

## Decisions
- **Free**: Overview tour, phase map titles, Day 1, Is it Vegan? scan, Near me, Swap of the week. **Members**: the course, challenges, points, unlocks, Swap Library, My list, the Library and badges.
- **Phases**: 1 Start here (1-7), 2 Breakfast and dairy (8-21), 3 Your plate (22-35), 4 Shopping and the pantry (36-49), 5 Eating out and people (50-63), 6 Cooking confidence (64-77), 7 The deeper why (78-91), 8 Your community (92-104), 9 Staying Vegan (105-111). Each ends on a capstone that unlocks the next.
- **Points**: open 5, ticked 5, scan 10, save 10, check-in +15 over the usual 10, approved photo 25, approved voice or reflection 25, approved capstone 50. One paid action per type per day. About 2,500 in all (Level 2 at the finish, about 1,100 by Day 45).
- **Unlocks**: 7 Pre-Vegan badge, 14 Swap Library, 21 Maya's Starter Shelf, 35 plate builder, 49 shopping lists, 63 Eating Out kit, 77 five meal plans, 104 Founder or Ambassador path card, 111 the Library and the 111 Days badge.
- **Never a Vegan badge.** Day 111: they choose "I'm Vegan" or "Still Pre-Vegan, still going"; I'm Vegan updates their own journey answer.
- **Day clock**: Day 1 on Start, then 5 AM their time, only once yesterday was opened. No backlog, no bingeing ahead. Proofs open 7 days. Days you showed up, never a broken streak. One gentle note after 3 quiet days. Pause up to 14 days once per phase.
- **Question map**: about 22 Build your profile questions, one roughly every 5 days on the day it fits, plus their why (Day 1), what is hardest (each capstone) and the Day 111 choice. Course data, not code.
- **After Day 111**: Maya's two-line check-in ("Hi <first name>, it's Maya. Just checking in. How's it going? Anything we can help with?") at 1 week, 1 month, 3 months, 6 months, then every 6 months. Says a person reads every reply. Replies to the team Inbox, the chapter's Community Manager, 24-hour clock. Stop any time; 2 quiet in a row drops to yearly. Those who stop partway get one note 30 days after going quiet. Draft and off until Sean approves.

## Build order (Logan)
1. Brand-neutral engine data model: programs, days, enrollments, progress, proofs, unlocks, question map (Vegans Explore first, 111 Day Theory second). Proofs reuse the bounty and check-in review queues and the Scan and Saves logs.
2. The Guide shell from the Dairy Guide (Overview tour, mobile card) and the Pre-Vegan survey.
3. The daily drop and notifications: opt-in daily email, one weekly reminder if unopened; push when the app ships.
4. Days 8 onward in batches by phase, each batch to Sean.
5. After-111 check-ins, and email replies routed into the Inbox (new, useful everywhere).

## Waiting on Sean
Approve Maya's Day 1 to 7 lines (text drafts in the canon), then they are recorded in her roster voice.
