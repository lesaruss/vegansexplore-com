# BrandDesk Social: "Approve the N waiting" said nothing (2026-11-15)

Playbook: `ve-social-schedule`. Session: Fix Depot Social approve not saving.

## What happened
Sean (12:30 to 12:36 UTC) clicked Approve the 19 waiting for Vegans Explore, week of Nov 16. Nothing landed. The approval
was then done server side (ve-social approve, as_member) at 12:37; 19 scheduled.

## Cause (from the logs)
- Depot > Social (`admin/depot/social.html`) is a redirect stub to HQ BrandDesk > Social. The button is in
  lesaruss-hq `public/branddesk/social.html`, framed by `components/branddesk/BrandHome.tsx` (SocialFrame).
- The approve never reached `ve-social`: no slot changed before 12:37, and HQ's route (its `members ... email=ilike` lookup)
  last ran at 11:12 UTC. The `ve-social` 200s at 12:34:53 and 12:36:06 were the vegansexplore.com dashboard's Insights
  `report` reads (`dashboard/center-console.html`).
- The page swallowed the refusal: `wireApproveAll` ignored a top-level `res.error`, and per-post errors were written 600 ms
  later into `#pmsg`, which the redraw replaced. Most likely refusal: Sean's HQ sign-in had run out (HQ middleware answers
  `401 {"error":"Unauthorized."}`). Not provable after the fact because HQ did not log refusals; it does now.

## Fix (lesaruss-hq `e106855`, on main, Vercel production READY)
- `public/branddesk/social.html`: `api()` turns any non-2xx or non-JSON answer into `{ error }`; a whole-call error stops,
  keeps the button and says "Nothing was approved: <why>"; per-post results show after the redraw (`flash`/`showFlash`)
  in plain words (`whyNot`).
- `app/api/branddesk/social/route.ts`: logs every refusal (`console.warn`) and every change (approve, skip, send back,
  delete, save, note) with counts, never post text; `maxDuration = 300` (a week of pushes takes about 90 s).

## Proof
- Repro: a [TEST] slot (far-future week, no channels) and HQ's real page in Playwright, approve sent to the live
  `ve-social` with no valid sign-in (401 `not_authenticated`): old page silent, new page shows the message, 1440 and 390.
  Race repro with a 2 s reload: old page lost per-post errors, new page keeps them.
- Live: `hq.lesaruss.ai/branddesk/social.html` serves the new code; a signed-out POST to `/api/branddesk/social` returns
  `401 Unauthorized.`, the answer the page now explains.
- [TEST] slot removed through `ve-once-social-test-cleanup` (execute_sql delete was held for approval twice); 0 left;
  the function is the 410 stub and refuses calls. Net database change: none (no migration).

## Handed to another session
Sean's feedback on the week's art (Theo fridge on Founding 1 slide 2, LINK IN BIO cut off on SoFlo 112 slide 10 and Ep 146
slide 7, the bare SoFlo "New episode" story, and locking the four-designer panel as the standing design team) was sent
verbatim to the session "Weekly social media schedule and assets", which owns the art, scripts and brief. Founding 1 is
already in Metricool for Mon Nov 16 9 AM ET; its fixed slide has to be re-sent before then.

## Open
- None for the approve bug. Sean's next step is in the "Weekly social media schedule and assets" chat.
