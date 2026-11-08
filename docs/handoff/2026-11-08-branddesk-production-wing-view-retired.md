# branddesk-production-wing: blueprint_ideas view retired, one open question (2026-11-08)

## Done this chat
- **The `blueprint_ideas` view is retired** (migration `20261108_retire_blueprint_ideas_view.sql`, applied live). Checked first: no code on
  main in vegansexplore-com or lesaruss-hq reads it; the deployed `ve-ideas` (v10) reads `ve_ideas`; no database function, view, cron job or
  foreign key refers to it; no API request to it after the switch (last 2026-11-07 13:16 UTC). The unmerged HQ branch
  `claude/keen-hamilton-7bia8n` (75b8223, "Where I looked") only changes `IdeasView.tsx`; a trial merge onto HQ main leaves no reader, so it is
  safe to merge. After: `ve-ideas` list answered 200 with all 31 ideas; `blueprint_idea_events` (73 rows) and `blueprint_ideas_retired_20261108` kept.
- Branch `claude/confident-hopper-52qjlc` (a863a62 and this doc): the migration file and the CLAUDE.md line. Not on main yet.

## How to say it to Sean (he was confused this chat)
One list of ideas (`ve_ideas`). Two screens show it: **Depot > Ideas** (vegansexplore.com) and **BrandDesk > Vegans Explore > Blueprint >
Ideas** (hq.lesaruss.ai). An idea added on either shows on both. **Send it to** is only on the Depot screen. Name the screen by its full path
every time; never say "the Blueprint" or "BrandDesk" alone when talking about ideas.

## Open question for Sean (asked, not answered)
Take the Ideas screen out of BrandDesk so ideas live only in Depot > Ideas (his 2026-11-07 call: "this is where the ideas should live instead
of the blueprint")? Logan's recommendation: yes, on its own HQ branch, shown to him before it goes live. Nothing is lost; the ideas stay in
`ve_ideas`. If he says no, the alternative was adding Send to on the BrandDesk screen (recommended against).

## Still waiting on Sean
1. J: click the Ideas sort buttons once as an owner (only matters if the BrandDesk screen stays).
2. Merge HQ `claude/keen-hamilton-7bia8n` (75b8223); then Logan checks it live at 1440 and 390 px.
3. The 19 decisions in Depot > Guides and tours (the Depot tour lookbook) and the rewritten chapter 5 line; then Logan makes the tour video.
4. Merge `claude/confident-hopper-52qjlc` to vegansexplore-com main (docs only; the migration is already live).

## Logan next
- When Sean approves a Daily Pulse draft from Send to, check it lands in that chapter's Pulse the next morning (he names the chapter and date).
- Queue: the Outreach Roster "who" filter, a BrandDesk Clients room in HQ, a read-only member list in the Depot.
