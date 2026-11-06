# ve-idea-intake: step 3 built, folded into branddesk-production-wing (one Blueprint)

Date: 2026-11-06, about 7:30 AM Eastern. Playbooks: `ve-idea-intake` (now parked) into `branddesk-production-wing`.

## Live
- `ve-ideas` v3 (commit 74a4089, sha256 ff0c6367 matched). Actions: list, get, upload_start, create, read, approve, set, and new `next`, `claim`.
  Ops (LESARUSS_ADMIN_TOKEN, optional as_member) may only list, get, next, claim, set. Claim is the lock: one build at a time, oldest first;
  a stale build stops blocking after 6 hours. Done needs a result_url. Proven live on a [TEST] idea; test row deleted.
- Uploads: signed uploads to private bucket `idea-files` (25 MB; pictures, PDFs, audio, video, text). The Claude read sees pictures and PDFs.

## Not live
- Depot > Ideas Building and Done states: branch `claude/dazzling-pasteur-1zrvhn` (b141a0c). Recommendation: do not merge; retire Depot > Ideas
  once BrandDesk > Blueprint > Ideas takes uploads.
- Scheduled task `trig_01XcpkAgN2brjAZTAJB1oREJ` ("ve-idea-intake: build approved ideas (hourly)"): PAUSED. A routine created from a session cannot
  attach connectors in this org and stores no repo; its first run had neither and ran on Sonnet. To use it: claude.ai routines page, add Supabase
  connector + lesaruss/vegansexplore-com + Opus, then enable. Its prompt: `docs/ideas/build-session-prompt.md`.

## The three Blueprint chats, now one
- ve-feedback chat: BrandDesk > Blueprint > Ideas live on HQ main b63cdb3 (table `blueprint_ideas`, 10 New, 13 Parked). Uploads held for Sean's word.
  Handoff `docs/handoff/2026-11-06-ve-feedback-blueprint-ideas.md`.
- branddesk-production-wing chat: Strategy and Score locked, portal taken down, September items audited, projects per period on HQ branch
  `claude/charming-goldberg-kpjmkh` (not merged). Handoff `docs/handoff/2026-11-06-branddesk-production-wing-projects-portal-items.md`.
- This chat: above.

## Recommended first build (after the A-to-Z)
Uploads and a research read on Blueprint > Ideas, reusing ve-ideas' bucket and read, plus "Send to": a chapter's Daily Pulse (`ve_pulse_features`,
dates and chapters) and today's podcast run sheet (HQ PodcastRoom news). The read runs on the API key, so ideas can be captured and read while
Claude Code usage is out. Facts in an idea (e.g. a celebrity opening a restaurant) are checked by the read's web search before anything is published.
