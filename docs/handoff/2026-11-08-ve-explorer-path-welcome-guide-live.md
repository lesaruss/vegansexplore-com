# ve-explorer-path: the Welcome Guide live on the Holiday layout

2026-11-08. Logan. Merged to `main` (0758aa2) on Sean's "merge" and checked live.

## Live
- `/passport` is the Welcome Guide (our About us and the free front door), copied from the Holiday Guide: Liz hosts, Overview complete on its own
  (Start here, Become a Founder free, the tour card with Liz's eight approved chapters as text), ten section pages (What it is / How to use it today /
  What members get), every page ending on the Explorer card (`public/ve-explorer-card.js`, reusable by any Guide).
- `/business` now served by `business-guide.html` (unchanged look). `/about`, `/vegans-explore-mission-statement` and `/welcome` go to `/passport`;
  footer ABOUT opens it. `survey.html` returns to `/passport#/...` after the Explorer survey ("See your first steps").
- Explorer question `x_hear` reads "How should we reach you with founder news?" (live DB).
- Rules in CLAUDE.md: a Guide in a scene on every page; clothes rule (the mark always; black, white, cream, pink, long sleeve, jackets, other pants;
  no other brand logos); sample member approved.

## Not done (in order)
1. Liz's eleven page scenes: Higgsfield has 1.15 credits, needs about 22 (2 each, nano_banana_pro). Waiting on Sean to top up (about 25 covers the
   scenes and the sample member's picture). References already imported: Liz art media `85023ca7-491a-4d75-ac6d-f99b72245ed8`, Theo store scene
   `6c80cc2c-765e-4739-a93b-b9643ce543b8`. Send scenes to Sean before wiring them as each tab's `pic`.
2. The sample member at `/dashboard/sample` (invented, marked Sample, nothing saves), copying `/gigs/sample` and `/business/sample` (template gate).
   Own session. Name: Logan picks unless Sean does.
3. Demos before videos: then the Overview video (script v3 approved), then section videos.
4. The paths page (step 4), Liz's recordings.
