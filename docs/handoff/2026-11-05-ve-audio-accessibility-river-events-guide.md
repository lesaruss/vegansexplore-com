# ve-audio-accessibility: River voices the Vegan Events Guide (2026-11-05)

Playbooks: `ve-audio-accessibility`, `ve-events-guide`. Branch `claude/funny-cori-thdm61` (head after this doc). **Not on `main`**: a push to `main`
from this session was refused by the session's safety check. Sean merges, or says "push it to main" in a session that allows it.

## Decided by Sean today
- **A Guide on every page, not Liz everywhere.** Each page is voiced by its own Guide, guiding, never a reader of the screen. This version: the
  Guide's voice over a still picture that can change by tab, outfits mixed up to fit the tab. Animation and B-roll later. (CLAUDE.md section
  "A Guide speaks on every page".) Clothing: Sean said mix outfits up; Logan's default, no logos but ours. The 2026-11-01 store-only rule was not
  formally retired; ask Sean if it still holds for banners and ads.
- **River's Events Guide script approved as V1**, with three changes: Gear invites suggestions, Vendors (like Venue) invites adding one, The word
  says "flyer or a link". Every Guide is an intake.
- **Tabs as one dropdown at every width**, locks kept; the join button reads **Take survey**; on phones the bubble beside River is as tall as his
  picture and scrolls.

## Built (branch)
- 29 recordings in River's roster voice `btaSeNTVh1pGx4pjFzub` (`eleven_multilingual_v2`, Vegan sent as Veegan), `vegan-media/media/voices/events-guide/river-<tab>-v1.mp3`
  and `river-<tab>-member-v1.mp3`; Gear is one line for both. **All 29 checked word for word with stt** (differences only capitals, punctuation,
  "12", "breakeven"). They are already in storage, so they play once the page is live.
- 15 stills of River, one per tab (Higgsfield, nano_banana_pro with his square art and the Events banner as references), `public/guides/events-guide/still-<tab>.jpg`
  at 960 px; My list uses Overview. Contact sheet sent to Sean.
- `guide-scripts/vegan-events-guide.js`: `TABS` say and sayMember equal the recordings; `riverAudio`, `riverStill`, Play / Pause River, the tour keeps
  playing across tabs until paused; Gear's **Missing something?** form posts to `ve-feedback` kind missing (Depot > Feedback and the Inbox); the tab
  dropdown (`drawMenu`, `setDD`). `guides/vegan-events-guide.html`: Play under River's name in the fit layout, the dropdown styles, the phone bubble.
- Script doc: `docs/proposals/liz-audio-scripts.md` Guide 2 (River's lines, decisions, recording plan, stills).
- Checked locally at 1440 and 390 px: no script errors, still changes per tab, audio plays, dropdown opens and picks, no sideways scroll.

## Open
1. **Merge the branch to `main`** (Sean or a session allowed to push), then check the live page.
2. **Cleanup in the database**: the temporary cron `tmp-river-tts` (every 20 s, does nothing now), function `public.tmp_river_fire()` and table
   `public.tmp_river_tts`. The connector held the drop; run it through a one-time function (`scripts/supabase-once/once.template.ts`, then the 410 stub):
   `select cron.unschedule('tmp-river-tts'); drop function if exists public.tmp_river_fire(); drop table if exists public.tmp_river_tts;`
3. **Grouping proposal, waiting on Sean**: 15 tabs into 6 group pages with tiles: Start here; Plan it (Kinds, The plan, Money); Line it up (Venue,
   Vendors, Gear); Run it (The word, Day of, After); Learn from hosts (Elephants, Hosts); Work with us (Claim, Sponsorship, Get access or My list).
   Cost: 6 new River lines (script to Sean first), no new pictures (reuse stills). Old `#/<tab>` links keep working.
4. Not done: the template-gate screenshot beside the Dairy Guide, the next Guides' scripts (order: Creator, Nonprofit, Nutrition, Stadium and Arena,
   Airport, Theme Park, Dairy, Supermarket, then the main pages), each in its own Guide's voice.
