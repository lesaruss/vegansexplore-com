# Podcast Spotlight reels, the social analysis and the Ideas 111926 folder (2026-11-19, handed off 2026-11-20)

Logan, one session (Thu Nov 19, about 7:20 AM to 7:30 PM Eastern). Playbooks `ve-social-schedule` and `ve-podcast-studio`.
Branch `claude/loving-dirac-a3tpb2`, merged to `main` at wrap.

## Done and proven

- **Ideas 111926** (Drive, 13 screenshots): four events, Lotus Vegan Restaurant's Thanksgiving hours, Madrina Vegana's Christmas catering
  tip, all live and checked (`20261119_ideas_111926_batch.sql`). WildKind Packaging was already a Sourcing supplier; Sourcing stays in the
  Guides (Sean: "I say keep it in the guide"). The primary care search was dropped.
- **Social analysis** (Metricool, Oct 20 to Nov 19): followers flat (Instagram 3,768 to 3,769); people and places win (SoFlo Vegans "show is
  back" 740 reach), Guide promo posts flop (12 to 70). Sean's direction saved: faces first, podcast spotlights, the 2-day reach-out rule,
  no cold collab invites (Next Level collaborator removed from the Austin, Denver and Boston launches, re-sent, read back once each).
- **SoFlo Vegans connected**: `ve_social_brands` `soflo-vegans`, Metricool 8227282, Instagram 11,319 followers (3x Vegans Explore). Proven by
  a live report.
- **Podcast Spotlight reel template LOCKED** (canon `canon-ve-brand-kit-templates` v4, CLAUDE.md template table):
  `scripts/brand-templates/podcast-spotlight-reel.js` (frame and layers) and `podcast-spotlight-cut.py` (parts, captions on the words, lo-fi
  bed ducked under the voice, dissolve joins, held last frame at a camera cut, the close on the guest's real profile page with a slow
  push-in). Title style A (full width) is the default. Every word inside the safe box x 90 to 960, y 300 to 1620 (`--guides`).
  Doctor's tip variant: Guides pink, ink type, the shared art `vegan-media/media/podcast/spotlight/art/doctor-tip/16x9.jpg`.
- **Three reels, in storage** (`vegan-media/media/podcast/spotlight/`): `an-sen-saigon/reel-v4.mp4` (LOCKED, Ep 147),
  `veronica-love-life/reel-v5.mp4` (SoFlo Vegans 114, Wed Nov 25; Sean has not locked v5 yet), `doctor-tips/barnard-b12-v2.mp4` (sample, not
  locked). Specs with parts and captions: `docs/social/spotlight/specs/` (paths marked $SCRATCH were session files; the source videos are
  in Drive Ideas 111926).
- **An's email APPROVED** (Sean: "send"): program `podcast-spotlight`, campaign `spotlight-an-sen-saigon` (people audience, member has no
  listing, which `ve_outreach_campaign_due` requires), sends Fri Nov 20 in the first run after 9 AM Eastern. The link opens her reel.
  `20261119_spotlight_an_email_draft.sql`.

## Not done (next session)

1. Fri Nov 20 afternoon: check An's email went out, opened, clicked (`ve_outreach_campaign_members`, `email_events`, `ve_links`).
2. Cut Dr. Michael Klaper's tips (Ep 59, video in Drive `VEP 0059.mp4`, transcript lines up, outro about 19 s): B12 from soil microbes 37:05,
   B12 dose 39:57, Vegan B12 labels 41:23, iodine 43:42, vitamin D 45:37, protein 56:01, batch cooking 49:14. Then Barnard's rest (Ep 44:
   cheese 3:39, diabetes 6:03, eggs 20:32, soy 14:37). Word timings: `el-media` `upload_url` then `stt` from SQL through pg_net.
3. James Wildman: `James Wildman _ SoFlo Vegans.mp4` (37 min) is NOT the indexed Ep 48; transcribe it, pick moments, point the clips to the
   Vegan Activism Guide (Dani).
4. Veronica: Sean to lock v5; her email (by Tue Nov 24) on the same program, to veronica@lovelifecafe.com (earlier emails show scanner opens only).
5. Ep 147 (Sun Nov 22) and SoFlo 114 (Wed Nov 25) are not built in the studio yet: Today's Spotlight segment (An, then Veronica on SoFlo
   114), the King Tide segment for SoFlo 114 (facts checked against NOAA before voicing).
6. Redraft the social week of Nov 23 on the new direction; targets proposed (not locked): 300 reach per feed post, 5% engagement, +100
   followers a week.
7. Drive: the four videos are shared "anyone with the link"; Sean can switch that off.
