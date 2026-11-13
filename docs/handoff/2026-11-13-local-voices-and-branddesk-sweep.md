# Handoff: SoFlo 113 cards, Local Voices, People > Intake, the BrandDesk sweep (2026-11-12 to 2026-11-13)

Logan, build mode. Playbooks: `ve-podcast-studio` (113, Local Voices, Intake), `ve-podcast-marketing` (112 promotion),
`hq-experience-redesign` (the BrandDesk sweep). Times Eastern.

## Live now
| What | Where | Proof |
|---|---|---|
| SoFlo 113 cards drafted for Sean's review (Kai x2: Brad's kale chips recall, Starbucks drops the Impossible sandwich; Liz: Juice Bar & Cafe, Holistic Holiday at Sea, Animal Activism Collective; River: Hippocrates Thanksgiving Dinner and the Holiday Guide; commercial Holiday Guide v3; intro and outro drafts for Sean's Rode). Dolphins held until Gabriella confirms. | BrandDesk > Podcast > SoFlo 113 | ve_pod_segments, status script |
| Personal note on a comment page (text + Sean's recording), `?look=1` never counts an open | vegansexplore.com/comment/<code> (main d765b5e, 763793e); ve-comments v4 | open_count stayed 0, 2026-11-12 |
| Sunni's and Carla's notes written from Sean's words, flow readings in his Higgsfield voice (HQ only) | media/outreach/notes/<code>/flow-v1.mp3 | |
| Mock: Local Voices, from mention to reply (9 slides, approved) | vegansexplore.com/mocks/local-voices | |
| People > Intake: every lead (our shows' episode mentions, nominations, event leads) sorted by type; outside finds wait for Sean's yes | HQ Outreach > Intake | ve_intake; cron ve-intake-refresh hourly |
| Local Voices pipeline: Queued (listing + picture first; logo hunt runs on Queued first), Ready for your OK, Scheduled, Sent, Closed; picture check puts the picture on the listing and drafts the messages (Claude); Approve one or many; Not interested / Not now / Never contact | HQ Outreach > Campaigns > Podcast: Local Voices | 13 in Queued; cron ve-voices-pictures every 15 min |
| Poderosa Minded on do-not-contact (Sean's words) | ve_do_not_contact | |
| BrandDesk sweep: Web, Outreach, Insights and the Social planner in the new look; every brand wears its kit or its brand guide colors; Guides per brand (Liz and River, Logan on GeekFon, Brandon on K12 Unlocked, V on LESARUSS and the rest); rows spaced, phone rows fixed | hq.lesaruss.ai/new/branddesk/<brand>; HQ main d49a6cc | signed in at 1440 and 390, sent to Sean |
| Rule: canon-branddesk-new-look (always loaded) | knowledge_records | |

## Waiting on Sean
1. Read and approve the SoFlo 113 cards; record his intro and outro (Rode, Record it here). Run sheet locks about Sat Nov 14.
2. Sunni and Carla: check their picture, record his note, Approve, send the opener DMs (Local Voices). Answers needed by Mon Nov 16; else Liz records a tip-line ask.
3. 112 still waiting: 9 slots in Depot > Social (batch soflo-112), the brand-green cover swap, the 112 kit DMs.
4. Which brand kits next: Logan's default is LESARUSS and K12 Unlocked first (15 brands have no locked kit).

## Next, in order (Local Voices build order)
1. First real drafts: watch the first picture check draft for voice; fix the prompt if Sean flags it.
2. Email sends through the scheduler for email-reached people; the Sent tracking columns (opened, clicked, replied, story in, claimed).
3. Outside sources into Intake: five podcast RSS feeds Sean picks, then news through ve-web-reader.
4. Nominations and Instagram follows flow into Intake once they have rows (wired already).

## Unmerged
- vegansexplore-com `claude/exciting-wozniak-5nm6kr`: the podcast pack mock (/mocks/podcast-pack), its renderer (scripts/brand-templates/podcast-pack), docs/podcast-pack/soflo-112.md. Merge when Sean says.
- Everything else from this session is on main in both repos.

## Learned
- ve-logo-hunt marks "nothing found" as pick -1: never read it as an index (fixed in ve_voices_pictures).
- Full-page screenshots draw a fixed bottom bar mid-page; prove phone layouts with viewport captures.
- A rule that lives in one tool's CSS (pd-line in Podcast) does not load on other tools: shared rules go in KIT_CSS.
