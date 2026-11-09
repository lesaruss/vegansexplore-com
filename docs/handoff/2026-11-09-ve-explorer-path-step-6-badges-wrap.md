# ve-explorer-path: wrap-up, Nov 8 to 9, 2026 (Eastern)

Playbook `ve-explorer-path`. Logan. Everything below is on `main` and live unless marked otherwise.

## Done this session
1. **Welcome Guide tour video**: `vegan-media/media/liz/welcome-guide/tour-video-v2.mp4` (4:5, 2:48; 48 approved frames, Liz's 8 chapters, launch bed
   19 dB under). Frame 14 is Atlanta's Daily Pulse (`v45/f07-chapter-v2.jpg`). On the Overview through `VEVideo.markup({aspect: '4:5'})`
   (new option) and `VEVideo.start(box, at)`; chapter Play and Liz's rail Play drive it (`CH_AT`). Tour `welcome-guide` status `live`.
   Renderer `scripts/tour-video/render.py` (pad each chapter mp3 to its ffprobe length before concat, or the cuts drift).
2. **Chapter hubs**: Get your Passport is Join free (`/survey?s=explorer`, back to the chapter); locked boxes read Members only / Join free.
3. **Step 4, `/paths`** (`paths.html`, parent `/guides`): every path, the member's `x_run` ticks first, Badge earned / Open your Guide after an intake,
   Group leader Coming with Notify me. Liz speaks it (`liz/paths/paths-member-v1.mp3`, `paths-visitor-v1.mp3`, stt matched) in the Holiday
   Guide's layout: desktop the paths left and her 320 px column right; phones the locked Guide mobile card (`ve-guide-corner.js`). The Explorer
   survey's finish leads with See your paths.
4. **Step 5**: path surveys start after Explorer (`PATH_TITLE` in `survey.html`, Step 1 of 2 / Step 2 of 2, sessionStorage `ve_path_next`);
   the catalog shows Starts after Explorer on the five path Guides to visitors.
5. **Step 6, badges** (migration `20261109_member_badges_v10.sql`, applied by fetching the committed file, sha256 checked):
   - Every badge is a `ve_person_tags` tag on the member's email, `ve_tags` kind `badge` with its color: badge-explorer #2D5C27,
     badge-restaurant #C2410C, badge-event-host #7C3AED, badge-creator #DB2777, badge-nonprofit #0E7490, badge-business #B45309,
     badge-ambassador #1D4ED8 (Logan's colors, Sean's to change).
   - Trigger `trg_ve_badge_tag_from_completion` (finishing an intake), `trg_ve_badge_tag_ambassador`; backfilled (2 Explorers, the Ambassadors).
     A tag the team takes back (`ve_tag_remove`) stays off; only a hand add puts it back.
   - `ve_member_badges(member)` rebuilt from the tags: key, badge, color, role, at, main, listing (Restaurant/Nonprofit only for an owned,
     approved listing), explorer. `members.main_badge`, `ve_member_badge_set_main` (never Explorer: `not_held`). `ve-dashboard` v24
     `set_main_badge` (deployed from 4f3fbb3, source sha256 20138c83 matched; live had equalled main before).
   - `public/ve-badges.js`: `seal`, `pills`, `corner`, `seals`; the certification stamp's ring and mark, path name over the top, Vegans Explore
     under. Used on the dashboard (Your badges + main badge picker), the Depot member card (corner on the picture) and People profiles
     (pills + corner on `.listing-hero-avatar`). Sample member Jordan shows Event host (main) and Explorer.

## Not proven / open
- Step 6: take-back and switching the main badge were not run (the connector held a rolled-back test for an approval nobody saw, it timed out);
  run it first next session (the DO block is in this note's git history, or rewrite: two intakes, set main, Explorer refused, ve_tag_remove,
  finish again, all inside a block that raises at the end).
- The badge mock (claude.ai/artifact/QwQRB9sMGVk7GJKB4Whgiz) is not readable from build sessions; built from canon v10's words. Sean to say if it differs.
- `VEBadges.seals` (small seals on cards) is built but on no card yet (Directory cards, leaderboard).
- Profile header redesign (bigger picture, name to its right, pills under it) not done; pills sit above About.
- The path Guides' own Get in screens still say "one short survey".

## Next
1. Rerun the step 6 rolled-back test; fix anything it finds.
2. Step 7, Build your profile (the 31 questions, paid per answer); then 8 (invitation drafts, hero voice) and 9 (policies, Guides' facts, saved answers).
