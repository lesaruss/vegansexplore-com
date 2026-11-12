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

**Fresh pictures per page (Sean, 2026-11-09: "we're using the same images over and over... focused more on media")**: each page's video gets its own
Guide scenes about that page, made with the locked recipe (CLAUDE.md, Guide scenes), never the same Liz shot or illustration cards from earlier pages.
Page 5's are `public/guides/welcome/liz-media-*.jpg` (studio, sofa, film, books, network, share, party; 14 Higgsfield credits).

**Nominate Someone, Kai's Overview (2026-11-09, approved by Sean; playbook `ve-nominate-someone`)**: `cap-nominate.js` captures `/nominate?preview=1`
(sample answers, so every capture shot carries the SAMPLE stamp, `c.stamp`); `render-nominate.py` is `render-city.py` with Kai's scenes
(`public/guides/nominate/kai-*.jpg`) and the form's shots. Voice `vegan-media/media/kai/nominate/overview-v1.mp3` (stt matched), 0.5 s lead, bed 19 dB
under, loudnorm then a limiter at -1.5 dBTP (-15.4 LUFS); files `overview-v1.mp4` (old look), `overview-v2.mp4` and `-v2-poster.jpg` (2026-11-12, recaptured in the Color Block look; same voice, captions `overview-v1.vtt`) in the same folder. The four step clips
(`who`, `why`, `you`, `send` `-v1.mp4`) are Higgsfield `wan2_7` lip sync from that page's Kai outfit, cut just after the last word on a frame with
her eyes open and mouth closed.
