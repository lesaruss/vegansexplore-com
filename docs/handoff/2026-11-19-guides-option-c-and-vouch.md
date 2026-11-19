# Handoff: every Guide on option C, and vouch for everything (2026-11-17 to 2026-11-19)

Playbooks `ve-holiday-guide` (Guides) and `ve-vouch-points` (vouching). Canon `canon-ve-guide-templates` v2 and `canon-ve-vouch-everything`
(both always loaded). Earlier handoff: `docs/handoff/2026-11-17-guide-templates-sweep.md`.

## What Sean decided, in his words
- Two panels on the Guide pages (users, then designers), four mocks at `/mocks/guide-panel2/{a,b,c,d}/`. Sean: "I love C. I had a chance to
  play around with it. The real thing first, that's the winner for me." Option C is canon v2.
- Members' search: "take the search out of that bar, because I really want it to be a slim strip, and we put it to the right of the
  button... the top can just be the navigation."
- "yes, roll C out to the other Guides"; "go ahead, fix the tabs and push it live" (the bar stays one slim line; many tabs slide).
- Welcome Guide main button: "Like start here." (opens Search and the Directory).
- Vouching: "keep it vouch for everything... If people know that people only can vote for things once, then it makes it a little bit
  easier to trust the rankings. That's what we figured out in the [Nearectory]."
- "yes, change vote to vouch on those pages" (policies, business agreement).
- Nonprofit Guide pass: "let's do the Nonprofit Guide pass now"; "keep the Activism Guide button as is".
- "Did you need me to tell you to move forward?" Lesson logged: when the next step is Logan's, start it in the same turn.

## Live
- **Option C on all 15 moved Guides** (`body.gf-c` in `/public/ve-guide-frame.css` Part 5 and later, `/public/ve-guide-frame.js`): slim
  pink bar = name, who it is for, every part as a tab (slides on desktop and phones), quiet Sign in; title, one line, the Guide as a small
  card, ONE orange action with one price line (members get the search there instead), then the real content. Verified live at 1440 and
  iPhone 13. Final audit of the 13 rolled Guides vs live: only intended removals.
- **Vouch everywhere**: ve-votes v15 (chapters and next places one vouch per member with undo), migration `20261118_vouch_chapters.sql`,
  ve-signature-dishes v3 (Top dishes counts every vouch), ve-cookbook v14, ve-bounties v20 (members, not Passport holders); 176 strings in
  57 files; policies and business agreement; Sean's 16 recorded lines (8 Guide lines incl. Maya's four Dairy clips re-made, 8 video
  sentences) and all nine narrated videos re-made (Welcome sec-directory-v3, sec-city-v3, sec-media-v3, sec-founder-v2, tour-video-v3;
  home launch-v6, next-v4, next-taste-v2; Green Leaf tour v-tour-v5).
- **Nonprofit Guide, The movement** (`#/movement`): programs, educators, talks, history, campaigns from the Activism Guide through the
  shared `guide-scripts/activism-data.js` (no copies). Dani's new line (no recordings in that Guide yet):
  `docs/proposals/2026-11-19-nonprofit-pass-lines.md`.

## Open
- **Holiday Guide to option C**: after ThanksLiving (Nov 26), start Nov 27. Baseline issues: no orange action on most phone views; four
  recipe pages scroll sideways at 390.
- Supermarket Guide stays unpublished (ve_guides published=false), so its unlock call 404s; Sean's call to publish.
- Food Photographer and Creator overview actions end at 585 / 581 px on iPhone 13 (bottom bar starts 577).
- Not tested anywhere: a real signed-in member session.
- WIP branches safe to delete (all merged or superseded): claude/homepage-vouch-video-wip, claude/dairy-vouch-clips-wip,
  claude/vouch-sweep-wip, claude/option-c-rollout-wip, claude/option-c-pilot-wip, claude/finder-guides-wip,
  claude/serene-allen-wijgxo-wip-batch2 (the git proxy refuses deletes from this session).
- Still pending from 2026-11-16: NYE menu outreach waits on Sean locking the page.
