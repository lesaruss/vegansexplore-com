# ve-podcast-studio: Kai's Founding tag, Episode 145 final v4 (Nov 7, 2026, Eastern)

Playbook `ve-podcast-studio`. Episode 145 (`ve_pod_episodes` 7d59c856-f226-4055-b5f0-50e43b0ea856), "Ballots, Marathons and Jane
Velez-Mitchell Unchained", airs **Sunday Nov 8, 7:00 AM Eastern** (`publish_at` 2026-11-08 12:00 UTC). Supersedes the v2 notes in
`2026-11-07-ve-podcast-studio-ep145-final-ready-to-schedule.md`.

## Where it stands
- **Final file**: `media/podcast/vep-weekly/2026-11-08/episode-final-v4.mp3` (13 min 12.6 s, -16.5 LUFS, peak -1.5 dBFS), set as `final_path`.
- **Scheduled and confirmed on Captivate.** Sean pressed Approve and schedule at 9:44 AM Eastern. `GET /shows/5f0184ac-771d-41be-9db2-49f08fc0b880/episodes/scheduled`
  reads 2026-11-08 07:00 (7:00 AM Eastern), status Scheduled; Captivate episode 902d9d96-bfd3-49b6-ab13-31e91b1365f3, media_name episode-final-v4,
  original_media_id 04918ac7 (ours); its active copy runs 798.7 s, about 6 s longer than v4 (likely the network tag pre-roll). Playbook record ec24dcf3.

## What happened this session
- **Who made v3**: Claude session `016TNa9TGZ1qb9KHiHy6u3Yk`, 8:21 AM Eastern Nov 7, on Sean's instruction (music under his intro, record b4465044,
  commit f475f3e). Checked: v3's intro has the bed under every pause; after 0:44 the audio is the same as v2, about 0.2 dB quieter from saving the MP3 again.
- **Kai's tag replaced** (Sean: "it's still promoting the passport program"; approved). Old: `media/podcast/tags/kai-get-involved-v2.mp3` ("Get your Passport...
  $11 one time... 1,100 points"). New: `media/podcast/tags/kai-founding-v1.mp3`, 31 s, Kai's voice `cgSgspJ2msm6clMCkdW9`, el-media tts, stt word for word:
  > You've been listening to the Vegans Explore Podcast. Here's your reminder: Founding Membership closes at midnight on January first. Join before then, and
  > Founding Member stays on your profile for good. We have big things in store for 2027, and we want you to have a front-row seat. Don't miss your chance to be
  > part of this community from the very start. Join at Vegans Explore dot com. Follow us at Vegans Explore on Instagram and TikTok. New episodes every Sunday. See you next week.
  (Recorded with "Veegans", "January first", "twenty twenty-seven".) Sean's outro also mentions the January 1st deadline; he kept the tag whole.
- **v4 built** from v3: unchanged to 12:27.269 (where the old tag sat), then the new tag (first 60 ms trimmed, 40 ms fade in, +4.1 dB, limiter at -2 dBFS,
  dual mono) over the closing sound (`media/podcast/sound/outro-v1.mp3`, which starts at 11:21.008 with Sean's outro, continued from 66.262 s at -24 dB, ramp
  over 1.5 s to -5.5 dB after Kai's last word, 3 s fade at the end), whole file +0.2 dB. Levels match v3 (whole -16.5, tag region -15.7 vs -15.8, swell -22.1
  vs -22.0). The last minute of the uploaded file was checked with stt.
- **Database**: `final_path` is v4; Kai tag segment (19b09f7b) `audio_path`, `script`, `note` updated, still locked and approved. Playbook record 9dd22512.
- **HQ template**: `lib/podcastStudio.ts` `TEMPLATE` now starts new episodes with the new tag, on HQ branch `claude/vibrant-franklin-mibljs` (d1ea7f8),
  **not on HQ main** until Sean says merge. Merge it before making Episode 146, or 146 starts with the Passport tag.
- A check clip `media/podcast/vep-weekly/2026-11-08/check-v4-tail.mp3` is left in storage (Storage will not delete through SQL); harmless.

## How-tos learned
- Captivate from the database without printing the key: `net.http_post('https://api.captivate.fm/authenticate/token', json {username, token})` with both
  read from `analytics_connections` and `lesaruss_secrets` inside the SQL, then `net.http_get` with `'Bearer '||token` built in the same query.
- Find a known clip inside a mix: decode both to 8 kHz mono and cross-correlate with numpy FFT (scipy is not installed).
- Saving an MP3 again costs about 0.2 dB (v2 to v3 lost it too); measure and add it back.

## Next (Ep 146, after Sunday's airing)
Rules from the earlier handoff: one story per segment with its own 100-second bed, stories 60 to 90 seconds with background from the full article, music under
every segment but commercials, music under Sean's intro, pronunciations (foie gras normal, Vellez Mitchell, Veegan(s), Vegans Explore dot com, dates as ordinals),
no prices, short samples before re-recording, Nonprofit Guide spot parked. Lower priority: Directory adds (De Nieuwe Melkboer, Vegan Society of Aotearoa New
Zealand, Vegconomist, Pro-Animal Future), UnchainedTV's 501(c)(3), React error 418 on the BrandDesk podcast page.
