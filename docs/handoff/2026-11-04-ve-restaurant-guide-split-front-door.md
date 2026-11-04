# ve-restaurant-guide: split out of ve-pathways, panel on the front door, audio checked

Date: 2026-11-04. Playbook: `ve-restaurant-guide` (new; Sean: "splinter off the restaurant guide by itself, so we can just finish that development"). Parent it came from: `ve-pathways`. No Guide code changed this session.

## Where the Guide stands
- Live: https://vegansexplore.com/guides/vegan-restaurant-guide (main `ed0e2db`, Version 1 locked). Personal link `?b=<code>` opens it on the business; a real `/go/bo-` link has NOT been tested end to end.
- **Audio checked in a browser**: Liz's `door-overview|audit|featured|demo|join-v1.mp3` all load and play on the five visitor tabs (no media errors, no script errors). `door-next-v1.mp3` is members only and was not tested. Pulse, Promotions and Test yourself have no recording. Desktop only; not a phone.
- Sean listened to the Overview line: it "doesn't tell me what to do... starts with your business, I'm completely lost... let's audit this, does it need all of this?... we're trying to get them through the front door."

## The panel (AI personas reading the page text and a desktop screenshot, not real owners)
Busy cafe owner, conversion strategist, plain-language editor, Vegan-options owner. Agreed 4 of 4: Overview, Your audit and Get in at the front door; The fixes, Pulse and Promotions behind it; Test yourself cut. The Overview has about 14 competing things and should have 3. Split: Try the demo and Claim your page (recommended behind the door). The strategist: run the audit by itself from the personal link, show three findings, then ask for the survey (not yet checked whether the link does this). The Vegan-options owner felt the Guide was not for them; **Sean's answer: for now only 100% Vegan restaurants.** Nobody should promise a survey length: it is not known (one reviewer invented "5 minutes").

## Recommendation, waiting for Sean
1. Front door: Overview, Your audit, What to expect (a short merge of what is coming and the Promotions headlines), Get in. Behind the door (after the survey): The fixes, Pulse, Claim your page, Try the demo, Promotions in full, My list. Cut: Test yourself.
2. Overview: a thank-you, one button (Run my free check), three steps, the promise. Our Story shrinks to two lines. Remove the lock tags ("In the full Guide") and "Nothing here is a pitch to buy a service". Move "$11, 1,100 points or the Partner plan" out of the first visit.
3. Draft Liz line (needs Sean's OK, then re-record; do not re-record before): "Hi, I'm Liz. Thank you for what you do. Here is what to do. Step one, tap Run my free check and see how your place looks online. It takes about a minute. Step two, take the short survey. That makes you a member, and the rest of this Guide opens: your fixes, your page, and what is coming. It's free, no card, and you can stop any time."
4. Also new Liz lines for What to expect and Get in once the words are approved (el-media tts, her roster-profile voice, checked word for word with stt, `-v2` files; her profile voice is read from the HQ roster, never from a page).

## Still open on the Guide (from Version 1)
The four-step What's next (Claim your page; Your points; Spread the word; Optional) is not built; the per-answer Can be shown switch is not built; the Their story section; template-gate screenshots against the Welcome Guide at 1440 and 390; a real `/go/bo-` test with a test contact. Day 0 wording for Vegan-options places is no longer needed now (100% Vegan only).

## Next action
Sean: approve or change Liz's Overview line and the shorter front door. Then Logan builds it on a branch from `main`, copying the Guide's own shell (template gate), shows screenshots at 1440 and 390, records Liz's new lines, and tests a real `/go/bo-` link.
