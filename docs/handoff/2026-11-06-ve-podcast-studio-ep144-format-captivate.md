# ve-podcast-studio: Ep 144 format and the Captivate button (Nov 6, 2026, Eastern)

Playbook: `ve-podcast-studio` (record 9152dfd1). Episode 145 airs Sunday Nov 8; its segments were due Thursday Nov 5.

## Sean's decisions
1. Every episode mirrors Episode 144 as it aired.
2. Yes to "Approve and schedule on Captivate" (no hand step).

## Live now (database)
- Episode 145 (`ve_pod_episodes` 7d59c856-f226-4055-b5f0-50e43b0ea856) runs: opening sound, Your intro, Top stories (Kai), What's new
  in the Directory (Liz), From the community (Dani), Around the world (Nori), Commercial, Your outro, Kai's tag, Closing sound. "Your clips"
  and "Commercial 2" (both empty) were removed. Applied through the one-time `ve-once-pod145`, now the 410 stub.
- Migration `lesaruss-hq/supabase/migrations/080_podcast_studio_ep144_format_captivate.sql` applied: `final_path`, `publish_at`, `shownotes`,
  `captivate_media_id`, `captivate_episode_id`, `captivate_status`, `scheduled_by`, `scheduled_at` on `ve_pod_episodes`.
- Ep 145's `publish_at` was set to Sunday Nov 8, 7:00 AM Eastern (12:00 UTC) when the preview page opened.

## Built, NOT on HQ main (waits for Sean's "merge")
HQ branch `claude/affectionate-keller-gfobbo` (2e4c6ed, then ac3821f merging Studio's Insights link from `claude/adoring-babbage-72vilp` 319baca).
- `lib/podcastStudio.ts`: `TEMPLATE` mirrors 144, `SLOTS` (the four Guide slots), `CAPTIVATE_SHOW`, Eastern time helpers, sections labeled by
  segment and Guide.
- `app/api/branddesk/podcast/route.ts`: `propose_news` fills the four slots (adds any missing ones to older episodes) and leaves a slot with a
  script alone: Kai city leads, Liz our own listings live in the last 7 days (no LESARUSS.ai, no food place still being vetted), Dani member
  submissions then community stories, Nori national leads; `draft` writes 80 to 120 words from all the slot's items and hands off to the
  next Guide (Nori hands back to Sean); `final_start` / `final_done` (finished MP3 to `media/podcast/vep-weekly/<air>/episode-final-vN.mp3`);
  `captivate_schedule` (needs the file, a title and a future time; the button must send the exact saved time; uploads `POST /shows/<id>/media`
  field `file`, then `POST /episodes` with shows_id, title, media_id, status Scheduled, date UTC `YYYY-MM-DD HH:mm:ss`, shownotes,
  episode_type full, explicit clean; saves the ids; a retry reuses the uploaded media). `episode_save` takes `publish_at` and `shownotes`.
- `components/branddesk/PodcastRoom.tsx`: Send to Captivate section (finished file, show notes, date and time in Eastern, confirm dialog with
  the time and any unapproved segments); Insights link from 319baca.
- Preview seen signed in as vegan@lesaruss.com at 1440 and 390 px (session signed out after). React error 418 shows on live main too.

## Not proven
- A real Captivate upload and schedule (first use: Ep 145). Whether Captivate takes `status: Scheduled` (if not, the page says it refused
  and nothing is scheduled; a retry reuses the uploaded media).
- Propose news on real data (not run on Ep 145 yet).

## Next
1. Sean says "merge": merge `claude/affectionate-keller-gfobbo` into HQ main, confirm production READY and the page live.
2. Propose news on Ep 145, Sean approves the four scripts (they voice on approval), drops in intro and outro, picks the commercial.
3. Logan assembles the finished MP3 as for 144 and drops it in; Sean presses Approve and schedule on Captivate; check Captivate's scheduled list.
4. Separate: React error 418 on the BrandDesk podcast page (pre-existing).
