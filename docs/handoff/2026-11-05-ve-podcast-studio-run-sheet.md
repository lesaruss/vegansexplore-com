# ve-podcast-studio: Episode 145 run sheet does not match Episode 144 (Nov 5, 2026, evening Eastern)

Playbooks: `ve-podcast-studio` (main), `podcast-network-transcript-upload` (ownership check only).

## What happened
- The ownership check Sean asked for had already been done and recorded by the 1:50 PM chat (records d1094ff4, 6ebff3b8; handoff
  `2026-11-04-podcast-network-transcript-upload.md` part 6). Nothing was re-recorded. Counts: VE Podcast Network 19 records, Studio 1.
- Sean opened the Episode 145 page:
  https://hq.lesaruss.ai/branddesk/brands/vegans-explore?view=podcast&pod=vegans-explore-podcast&ep=7d59c856-f226-4055-b5f0-50e43b0ea856
  (HQ's sign-in drops the query; after sign-in he may land on the overview).
- Sean: "you're not allotting slots for the segments... mirror the format from the last episode."

## Episode 144 as it aired (stt of `vegan-media/media/podcast/vep-weekly/2026-11-01/episode-v4.mp3`, about 14.5 min)
| Time | Segment | Who |
|---|---|---|
| 0:00 | Opening sound | |
| 0:09 | Your intro (about 9.5 min) | Sean |
| 9:46 | Top stories (Miyoko's recall, Toblerone suit) | Kai |
| 10:30 | What's new in the Directory | Liz |
| 11:10 | From the community (Huge Vegan Survey) | Dani |
| 11:44 | Around the world (Oxford study, World Vegan Month) | Nori |
| 12:18 | Commercial: Airport Guide | |
| 12:46 | Your outro | Sean |
| 13:59 | Kai's tag ("You've been listening...") | Kai |

Each Guide hands off to the next. One commercial.

## What is wrong in HQ (`lib/podcastStudio.ts` TEMPLATE, main 74ef142)
- Its comment says it is ep 144's run sheet; it is not. No voiced segment slots; two commercials and a "Your clips" slot 144 never had;
  Kai's tag before Sean's outro (144: after).
- `propose_news` (`app/api/branddesk/podcast/route.ts`) inserts new segments before the first commercial; it does not fill named slots, and
  the Directory slot (Liz) has no news lead to draft from.

## Ep 145 rows today (unchanged)
Opening sound, Your intro, Commercial 1, Your clips, Commercial 2, Your outro, Closing sound, Kai's tag. A reorder to mirror 144
(Opening, Intro, Kai, Liz, Dani, Nori, Commercial, Outro, Kai's tag, Closing) was attempted through execute_sql; the connector held it
for an approval that never showed, and a re-read confirmed nothing changed. Use a one-time function (`ops-supabase-write-once-function`).

## Open for Sean
1. Format: mirror 144 (Logan's recommendation) or his own: opening, segment, commercial, one or two segments, commercial, one segment, closing.
2. Captivate: Sean wants the agent to upload, publish and schedule the approved episode on Captivate (no hand step). Logan's proposal: an
   "Approve and schedule on Captivate" button at the bottom of the episode, showing date and time first. Not built; Captivate's episode
   create/media upload API not yet probed. Owner: ve-podcast-studio.
3. Studio's Insights link (HQ branch `claude/adoring-babbage-72vilp` 319baca) still not seen or merged.

## Deadline
Segments due Thursday Nov 6 (Eastern); Episode 145 airs Sunday Nov 8.
