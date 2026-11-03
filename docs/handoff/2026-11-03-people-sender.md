# Handoff 2026-11-03: the people sender (and Pulse subscribe, checked)

Playbook `ve-pathways` ("Three doors and campaigns on people"). Index row and playbook records updated.

## Done and live
- **Pulse subscribe** was already built earlier the same day (commit e3348b1). Checked live, not rebuilt. Dark: `ve_site_settings` `pulse_subscribe.on` false, 0 subscribers.
- **People sender**, all three steps, on Depot > Outreach (PRs #138 and #139, `ve-people-outreach` v7 from c5e3e981):
  1. Pick people and make drafts (`pick`, `draft_batch`).
  2. Campaigns table, Opened / Clicked / Bounced chips, a tracked link per person (`{link}` plus a destination), a test that never counts as a click.
  3. Week view: move, Approve the day, Approve the week (`week`, `move`, `approve_range`).
- Bug caught before Sean saw it: the first Campaigns table read outreach-nov at a 300% click rate (clicks on drafts counted). Fixed; clicks count only on messages sent or done.
- No migrations: the work used existing tables (`ve_people_outreach`, `ve_links`, `ve_founding_candidates`).

## Not proven
- A real pick, draft and approve as Sean in the browser. Nothing was approved or sent. Tested only with made-up 2099 drafts and mocked pages.
- Pulse subscribe's real subscribe, confirm and first send, and its issue preview (super admin only).

## Sean's to do
- Preview the Pulse issue and switch Pulse subscribe on (`pulse_subscribe.on`).
- Make a first real batch: Depot > Outreach > Pick people. Start with the 178 Suggested for Vegans Explore or the 26 On our shows, not all 3,199.
- Nov 10 (Eastern): read Depot > Watchlist > Would flag and decide whether to turn on opening abuse cases.

## Next (Logan)
The updated Welcome: the Welcome, the Passport and the Taste merged into one free guide that ends in the two paths (the survey, or the $11). Copy `passport.html`'s Guide shell (template gate). Read `docs/proposals/people-campaigns-doors.md` section 2 first. Then profiles with groups, then campaign homes in BrandDesk.

## Lessons
- Check the repo and database before building from an index row's next action: the row said Pulse subscribe was next while it was already built.
- `ve-function-deploy` needs the full 40-character commit sha.
- pg_net can be slow rather than stuck: check that `net.http_request_queue` is draining before touching the worker.
- A force push is blocked here; a branch whose tip is already merged needs only a plain push after resetting onto `main`.
