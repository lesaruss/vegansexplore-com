# brooke-sellers: wrap-up, 2026-11-06

Playbook `brooke-sellers`, brand `meatless-muscle`, owner Logan, Waiting on Sean.

## brooke-sellers: done this session
- **For Brooke merged to main and live** (Sean: "merge it"; main 7dc75a0). Checked at 1440 and 390 px with her token
  (`/guides/creator-guide?p=6dd1990c69e580883b84b606af562d21`): 5 pages, 76 views, 4 votes, no errors. Her open count reset to 0 after.
  The tab still shows a **"Preview, not shared yet"** badge; take it off before she gets the link.
- **The Creator Guide is free with the creator survey** (Sean: "the creator guide is free with the survey... so it doesn't say $11").
  - Database (applied through the one-time `ve-once-creator-survey`, now the 410 stub; migration `20261106_creator_guide_door_survey.sql`):
    `ve_surveys` `creator-guide`, 16 questions from the creator application (`public/ve-gigs.js` FORM), 6 required, 250 points;
    `ve_guides` `creator-guide` door true, `survey_slug` creator-guide. `/survey?s=creator-guide` works now.
  - Page (branch `claude/optimistic-mendel-box698`, 7898a4f, **not on main**): the gate, the header box (Free with a short survey / Take
    survey), Get access and the catalog card say free with the survey; the For Brooke preview now shows the survey too; the survey page's
    signed-out line names the Guide's subject (it said "your events" for every Guide). Checked at 1440 and 390 px, no $11, no errors.
  - Kai's Get access recording said eleven dollars, so that tab is text until Sean approves a new line and it is recorded (`-v2`).
  - Logan's defaults: the questions and points. A member who paid $11 still opens the Guide without the survey (door rule unchanged;
    membership rule v6's "members finish the intake too" is not built).

## brooke-sellers: open
- **Sean**: say "merge" for the branch (then Logan merges and confirms live).
- **Sean**: approve the email in Depot > Outreach (`ve_people_outreach` 4fbbd9f4-..., draft, day 2026-11-06, campaign `brooke-resend`).
  Logan's recommendation, waiting on Sean: swap the creators paragraph for her own Guide (new tracked link `brooke-guide` to her token
  link, "free when you take the short creator survey"), send Sean a new test, take the "Not shared yet" badge off first.
- Sean's question answered: one email to a client is sent from Depot > Outreach today (Approve and schedule, 10 AM Eastern on its day,
  sends as Sean through brand lesaruss). Client campaigns belong in HQ BrandDesk under her brand; that People section exists only for
  Vegans Explore, on an unmerged HQ branch. Recommendation: send this one from the Depot, then make Brooke the first client People section
  as its own build.
- Logan after the email: watch opens and clicks; write the 20-minute call questions. Still queued: her branded money-in email.
- Billing line name and the $200 founding rate stand as Logan's defaults.

## ve-feedback: what happens after any Guide survey (queued, not built)
Sean: finishing any Guide's intake should make them a member at once and send an automatic email to the orientation (what to do
next). Keya (VeganKween) sent the creator application Nov 2 and John Thomas Nov 1; both still New, nothing happened. The creator
application (`ve_creator_applications`) is separate from the new creator survey and admits no one. Decide: one shared orientation
email or one per Guide, and whether the application folds into the survey.
