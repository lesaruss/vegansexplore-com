# ve-podcast-studio: Episode 145 scripts, Jane's clip and the Guides spot (Nov 6, 2026, Eastern)

Playbook: `ve-podcast-studio`. Episode 145 (`ve_pod_episodes` 7d59c856-f226-4055-b5f0-50e43b0ea856) airs **Sunday Nov 8 at 7:00 AM Eastern** (`publish_at` 12:00 UTC). Its segments were due Thursday Nov 5.

## Done this chat
- **HQ merged and live.** Branch `claude/affectionate-keller-gfobbo` merged into lesaruss-hq main (5057bdd, production READY): the 144 format, Propose news, Send to Captivate.
  The handoff docs branch was merged into vegansexplore-com main.
- **Propose news fixed** (HQ bdec7d4). It took the 300 newest leads and only then dropped other brands, and LESARUSS.ai's business feeds filled 289 of them. That left Around the world and From the community empty.
  It now filters to Vegans Explore inside the query (600), skips social posts (titles ending "- Facebook", "- LinkedIn", "- YouTube" and so on) and puts real outlets before Google News results.
- **The script writer fixed** (HQ 8a5f332, 25168e1). Opus 5.5 always thinks, and the thinking counts against max_tokens: at 900 every script was cut off mid-sentence, or came back empty (empty_draft, a 502 that Cloudflare dressed as its own page).
  Now max_tokens is 16000, nothing is saved unless stop_reason is end_turn, and failures return 500 with the reason.
- **The run sheet mirrors 144 again.** Six leftover one-story news rows from the old proposal were removed; five of them were Facebook or LinkedIn posts.
- **Sean's notes applied** (2026-11-06):
  - Liz's Directory segment is now "130 new listings went live this week, the goal is to keep it climbing", then a spotlight on UnchainedTV leading into Jane.
  - A new drop-in, **Jane Velez-Mitchell in her own words (VEP 43)**: 43.5 s, `media/podcast/vep-weekly/2026-11-08/jane-unchained-clip-v1.mp3`. It is cut from the episode's own audio at 29:01.95 to 29:45.45, levelled to -16 LUFS, and checked word for word with stt ("I realized with my girlfriend at the time... Oh, bingo. This is what I can do.").
  - Dani opens off Jane.
  - Nori's half-true "soy grown on its own land" was cut (the source says it is also bought in), and Nori now hands to Maya.
  - A new **Our Guides** spot (Maya, 142 words): what the Guides are; the stadium, airport and theme park tools; the Supermarket Guide described as "we're building" (it is pre-launch); the Events and Restaurant Guides free with a short survey. It leads into the commercial.
- **Ideas filed to Blueprint > Ideas** (Sean's routing): "Explorer path and badges" (60e6b5f8, suggested ve-outreach) and "Claude output budgets: check every call" (a198c0e4, suggested ve-feedback).

## Run sheet now (12)
1. Opening sound (approved)
2. Your intro (empty)
3. Top stories, Kai (script)
4. What's new in the Directory, Liz (script)
5. Jane clip (voiced)
6. From the community, Dani (script)
7. Around the world, Nori (script)
8. Our Guides, Maya (script)
9. Commercial (empty; Logan's default is the Dairy Guide)
10. Your outro (empty)
11. Kai's tag (approved)
12. Closing sound (approved)

Episode title still "Episode 145". No show notes yet.

## Waiting on Sean
- Approve the five scripts; each voices on approval.
- Drop in the intro and outro.
- Confirm the commercial.
- Give the episode a real title.

## Then Logan
1. **Assemble the finished MP3 to match 144.**
   - Reference: `vegan-media/media/podcast/vep-weekly/2026-11-01/episode-v4.mp3`, 44.1 kHz stereo, 192 kbps, -16.1 LUFS integrated, about 14.5 min.
   - Each Guide's voice goes over its segment's `bed_path` bed, ducked under the voice.
   - The run sheet order with short gaps, the whole thing levelled to -16 LUFS, peaks at -1.5 dB.
   - Upload through the page's Send to Captivate (`final_start` / `final_done`) as `episode-final-v1.mp3`.
2. **Write the show notes** for Sean to read: the stories with their sources, the Directory spotlight, and Jane linked to her listing and UnchainedTV's.
3. **Sean presses Approve and schedule on Captivate.** Then confirm it with `GET /shows/<id>/episodes/scheduled`, at Sunday 7:00 AM Eastern.
   If Captivate refuses status Scheduled, find the right value; a retry reuses the uploaded media.
   `captivate_schedule` downloads and uploads the whole file inside one Vercel request (200 s limit), so watch the time on a 20 MB file.
4. Lower: React error 418 on the BrandDesk podcast page (also on main before this work).

## How-tos learned
- **Our own episodes' audio.** `episodes.captivate.fm/episode/<guid>.mp3` refuses the sandbox and Supabase edge functions ("Missing redirect URL").
  Read it from the database with `net.http_get`: the response's Location header gives the real `podcasts.captivate.fm/media/<id>/<file>.mp3`, which an edge function can fetch.
- **Timing.** TurboScribe timings are on the YouTube video; VEP 43's podcast audio runs about 6.5 s later. Always stt a window of the podcast audio before cutting.
- **stt and tts.** Call el-media from the database with pg_net and the token in `lesaruss_secrets`; the edge env's LESARUSS_ADMIN_TOKEN is refused.
- **Signed-in checks.** vegan@ via `ve-once-qa-session` (now the 410 stub). HQ page loads rotate the refresh token, so sign-out by refresh fails afterwards; the session expires on its own in an hour.
- `ve-once-pod145` is the 410 stub again.

## Commits
- HQ: 5057bdd (merge), bdec7d4, 8a5f332, 25168e1.
- vegansexplore-com: d6ed14a (docs merge), 167bdf0 (Explorer handoff), this doc.
