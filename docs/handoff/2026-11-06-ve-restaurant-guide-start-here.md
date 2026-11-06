# ve-restaurant-guide: Start here on every Guide, and the V1 lock-in (2026-11-06)

Playbooks: `ve-restaurant-guide` (Waiting on Sean), `ve-page-guide` (folded into this lock-in).

## What Sean said
- The open task was meant to be the Restaurant Guide, not the Events Guide. He wants Restaurant Guide V1 locked in.
- "It's not teeing up the why." Every Guide must open by saying why they are here, why we do what we do, why the Guide was made, what problem
  it solves, what changes once they are through it, basic how-to for first-timers, and that it is built with them (tell the Guide or send
  feedback; our team sees what they share with the Guide and a person picks up what the Guide cannot). As text on the page, since people may
  not press Play. Make it the template so he never has to explain it again.

## Built (branch `claude/affectionate-planck-jjh7xv`, commit 0404068, NOT on main)
- `public/ve-guide-intro.js`: `VEGuideIntro.html({guide, name, audience, problem, change, how, open})` and `VEGuideIntro.wire(main)`. Six parts;
  Why we do what we do, the how-to basics and It is built with you are shared in the file; each Guide passes audience, problem, change and extra
  steps. Talk to <Guide> opens `VEPageGuide.open`, Send feedback opens `VEFeedback.open({form:true})`. Open for visitors, folded for members.
- Restaurant Guide: `INTRO` and `intro()` in `guide-scripts/vegan-restaurant-guide.js`; on both Overviews (visitor open, member folded). The old
  "does three things" list and the Who we are paragraph were folded into it. Script tag added to `guides/vegan-restaurant-guide.html`.
- `public/ve-page-guide.js`: the member chat's example question no longer mentions a potluck on every Guide.
- Rule written: `docs/guides/BUILD-A-GUIDE.md` (Start here section), `CLAUDE.md` (under Building a new Guide), canon `canon-ve-guide-start-here`.
- Checked locally at 1440 and 390 px: six cards, no script errors, no sideways scroll, Talk to Liz opens.

## Not done
- Not merged to main (Sean's call). Liz's recorded Overview line is the old welcome; matching it needs a new script Sean approves, then a recording.
- The other Guides do not have Start here yet (Events Guide first unless Sean says otherwise; Logan drafts each Guide's three parts as text).
- The Restaurant Guide V1 lock-in: tab-by-tab review (visitor: Overview, Your audit, What to expect, Get in; member: Top challenges, Pulse, Sourcing,
  Claim your page, Your dashboard, Try the demo, Promotions, My list, What's next), then the five emails (https://claude.ai/artifact/819FYdMdKGMUjKSF6UNfeC).
- The three shared inboxes (Vale Healthy Kitchen, FreshOne Kitchen, EZ Eatz by Yaya): default keep each one's main location.
- Talk to <Guide> step 3 unproven: Ask a person (emails the team) and a real member on a phone.
