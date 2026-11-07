# Guide tour: storyboard (lookbook) before video

Nothing is generated until Sean approves the lookbook (Sean, 2026-11-07, as with the GeekFon Ep1 lookbook).

1. Script approved by Sean (`docs/proposals/liz-audio-scripts.md`), one chapter per beat (canon `canon-ve-guide-tour-standard`).
2. Record each chapter with el-media `tts` from the database (pg_net, two at a time), the Guide's roster-profile voice, Vegan as Veegan;
   check each with `stt`. Files: `vegan-media/media/<guide>/<guide-slug>/tour-<chapter>-v1.mp3`.
3. `capture.js`: real pictures of each tab from the live page, the spot the Guide names outlined (locked tabs unblurred; member-only
   content shows placeholders and is marked Recapture).
4. Join the chapters with 0.4 s gaps into one track (ffmpeg concat), then `build_lookbook.py` with `lookbook.tpl.html`: numbered frames,
   timings from the chapter lengths, the voice embedded so Play the tour runs as an animatic. Publish it as a private artifact.
5. Sean notes changes by frame number. Then the video: same frames and voice, B-roll only where he approves credits.

First: the Nonprofit Guide (Dani), https://claude.ai/artifact/2dAgeN98E1R9216hr4oGqi
