# Handoff 2026-11-21: the World Vegan Expo Guide (/expo)

Playbook `ve-holiday-guide` (this work grew out of checkpoint 1024). Canon `canon-ve-world-vegan-expo` (created today) holds every lock.

## What is live (main, vegansexplore.com/expo)

- **The Guide's parts:** Overview, Your door, What it will be, The week, The city race, The team, Count me in. It's on the locked Guide
  layout with Liz, in `expo/index.html`.
  - **Overview:** What / Why now / Count in now, the over-500-events line, and six doors.
  - **What it will be:** a map of ten villages (`VILLAGES`). Each village has five pictures (`public/expo/v/<n>.jpg`, 47 new scenes,
    nano_banana_pro with style ref 6c80cc2c), what you find, and a sample schedule.
  - **The week:** five day views (`DAYS`). Each rundown is built from the village schedules, and several villages opening at one time
    read as one "Doors open" line.
  - **The city race:** `ve_expo_road`. Zeros read "Be first", and the race is no longer promised as the deciding rule.
  - **The team:** our record, plus the committees for members only.
- **Count me in:** a tab, plus one button at the end of each door. It's never at the top of every part (Sean: "like a pop-up banner").
- **The locked offer:** "Count in now and you're first: tickets, booths and speaking slots before the public, plus a Founding badge on
  your profile. No fee, no deposit."
  - The badge is `badge-expo-founding`, added by trigger `trg_ve_expo_founding_badge` (migration `20261121_expo_founding_badge.sql`).
    Proven in a rolled-back run.
- **The committees (locked, members only for now):**
  - Nine volunteer committees, each led by a Chair. Invitation first. Good standing is a monthly Zoom meeting; two misses then a
    check-in, a third and you're off the committee.
  - Members in good standing get the All Access Pass. Paid jobs are posted inside the committees, members first.
  - `ve-giving` v11 (sha256 39f18f08...) serves `expo_committees` to signed-in members only. Joining is Count me in with role
    `committee` (tier "Committee: <name>", tag `committee-<slug>`), members only.
  - Proven signed out: no list, and joining is refused. The member view was proven with a stubbed member response.
    **A real member sign-in test is still to do.**
- **Host city rule (Logan's default, not overridden):** the race is the community part of every city's bid, and the final pick weighs
  the city's offer. The 80% gate is retired as the deciding rule.
- **Linked pages brought in line:**
  - `/expo/events`: from February 2027, with South Florida, Central Florida and Philadelphia; Los Angeles removed.
  - `/groups/welcome`: Market at 10%, and clubs invited to our nights. The "contribution to your club" is gone.
- **Audio:**
  - Every view's Play button plays `voices/expo/liz-expo-n-<view>[-<sub>]-v1.mp3` once it exists, and Liz's short line until then.
  - The 28 narration scripts are in the HQ voice booth, set `ve-expo-narration`:
    https://hq.lesaruss.ai/new/branddesk/vegans-explore?view=voices&set=ve-expo-narration

## Waiting on Sean

1. **Record the 28 narration lines.** Then Logan:
   - cleans each take (`scratchpad/expo-audio/clean.py` recipe: trim, fades, pad, -16 LUFS);
   - checks it word for word with stt;
   - uploads it through a one-time function to `vegan-media/media/voices/expo/`;
   - hears it on the page.
2. **Sign in and open /expo#/why** to confirm the committees show for a real member.
3. **Then outreach, last:** the Seed team conversation (brief: `docs/plans/2026-11-21-seed-team-brief.md`), then the club and partner
   list in playbook `ve-we-sponsor-your-events`.

## Parked (decisions for later, not blocking)

- Paying speakers; chef dinners in the All Access Pass.
- The Expo plan's money questions: venue holds, bridge funding, prices, the go-or-scale check.
- Community Night ticket prices; when a club gets its ticket money; refunds.
- The `[TEST]` lead `test-event-sponsor@example.com`: delete on Sean's go-ahead.
- Unlisted drafts `/expo/nights` and `/expo/clubs` still carry the older club model.
