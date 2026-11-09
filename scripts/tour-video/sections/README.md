# Welcome Guide section videos (playbook ve-explorer-path)

One per page 2 to 11, Liz's approved line (`docs/proposals/welcome-guide-section-scripts.md`), recorded with el-media tts from the database and
checked with stt. `cap-<page>.js` captures the live pages at 390 x 703, 3x; `render-<page>.py` (run beside `cap/`, `voice.mp3`, `bed.mp3` and a copy of
`../v3/compose.py` as `v3compose.py`) puts them in the v3 phone frame on white, Liz's scenes full bleed with a slow zoom, a new shot about every 3 s
cut on her stt word timings (`S`), 0.4 s crossfades; then ffmpeg mixes the voice (0.5 s in, -15 LUFS) over `media/home/launch-bed-v1.mp3` well under it.
Files: `vegan-media/media/liz/welcome-guide/sec-<page>-v1.mp3` and `.mp4`. Page 2: `sec-directory-v1`, 50 s.

**v2 look (Sean, 2026-11-09)**: behind every phone and illustration shot, one of our chapters' tall city pictures (`CITIES`, a different one each
shot) slowly zooms in, drawn at 2x and sampled down so the zoom is smooth; the phone or card is a clean layer drawn at 2x (no shadow, no glow) placed
on top and never moves. Liz's scenes stay full bleed with their own slow zoom. Re-encode with `-crf 26 -movflags +faststart` for the web.

**v3 (Sean, 2026-11-09: "if she talks about a different subject, then the background now switches")**: `GROUP` names each shot's subject; shots
that share a subject share one city and one continuous zoom, and only the phone or card changes on top (a 0.4 s fade). A new subject, a new city.
A long subject (more than about 3 shots) splits into two.
