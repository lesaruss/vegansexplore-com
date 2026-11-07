# ve-podcast-studio: Episode 145 final v3, music under Sean's intro (2026-11-07)

## What changed
- Sean (2026-11-07): the opening music runs under his intro on every episode. It starts at full volume, ducks under his voice to the Guides' bed level (about 19 dB under the voice), runs the whole time he talks, and fades out as the next segment starts.
- Ep 145 remixed as `vegan-media/media/podcast/vep-weekly/2026-11-08/episode-final-v3.mp3`
  - only the first 44 s differ from v2: music at full until 7.5 s, ducks 23.7 dB by 9.3 s, Sean comes in at 9.5 s, music fades out 42.6 to 44.0 s, Kai at 44.35 s
  - whole episode at -16.5 LUFS, peaks at -1.5 dBFS, 788.9 s, 192 kbps
  - link: https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/podcast/vep-weekly/2026-11-08/episode-final-v3.mp3
- `ve_pod_episodes` 7d59c856: `final_path` now points to v3, so **Approve and schedule on Captivate** sends v3. `captivate_media_id` is still null, so nothing has been uploaded yet.
- Intro segment (position 20): `bed_path` is `media/podcast/sound/intro-v1.mp3`.
- Where the rule is saved: playbook record b4465044 (`ve-podcast-studio`) and CLAUDE.md (commit f475f3e). Ask Sean before leaving the music off a very long intro (Ep 144 ran about 10 minutes).
- One-time upload function `ve-once-pod145` is back to the 410 stub.

## How to remix (so it can be repeated)
1. Decode the pieces to raw f32 with ffmpeg.
2. Find where each piece sits in the mix by FFT cross-correlation in numpy (scipy is not installed).
3. Measure the existing Guide bed against the voice and match it.
4. Upload through a one-time edge function that returns `createSignedUploadUrl`, PUT the file to that URL, then stub the function again.

## Next
- Sean: listen to v3, then press Approve and schedule on Captivate (BrandDesk > Vegans Explore > Podcast > Episode 145), for Sun Nov 8, 7:00 AM Eastern.
- Logan: confirm on Captivate that it reads Sun Nov 8 at 7:00 AM Eastern and that the uploaded file is v3. Then start Ep 146 with the new rules: one story per segment, each Guide's own bed, and music under the intro.
