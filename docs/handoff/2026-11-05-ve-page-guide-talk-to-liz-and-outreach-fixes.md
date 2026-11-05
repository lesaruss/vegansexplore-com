# ve-page-guide and ve-restaurant-guide: Talk to Liz, suggestions, outreach email fixes (2026-11-05)

Playbooks: `ve-page-guide` (new, opened 2026-11-05), `ve-restaurant-guide`. Live on `main` at 3baec6a9 (Vercel READY, checked live).

## ve-page-guide: Talk to Liz (phase 1, built and live)
- Feedback button, for a super admin signed in as themselves (not View As), opens **Talk to Liz** (`public/ve-page-guide.js`). On a Directory
  listing she reads the listing, its outreach contacts, team notes and the page text, answers, asks when unsure, and lists exact changes
  (from, to, why). Tick and Apply. Edge function `ve-page-guide` (verify_jwt off, super admin token, Claude Opus 5.5): `chat` proposes,
  `apply` re-checks and saves. Listing fields through `ve-outreach` `listing_fix` with Sean's own token (each a `ve_listing_edits` row);
  name and email written directly, logged `where: page_guide`; team notes to `details.admin_notes`; outreach contact name (sets
  `ve_outreach_contacts.name_confirmed`), email, do not email (`held`). Every turn in `ve_page_guide_log`. Migration `20261105_page_guide.sql`.
- Proven live as Sean (one-time `ve-once-page-guide-proof`, now 410): no token 401; Chef Sam message proposed exactly name, email and a note;
  "update the phone" asked for the number; a forbidden field refused. **Nothing applied yet**: Sean's first real use is The Rabbit Hole
  (Samuel goes by Chef Sam, chefsam@therabbithole.life, the Gmail is old). Panel checked at 1440 and 390 px against mocked answers only.
- Everyone else: Feedback form starts with **A change to this page** (kind `suggestion`), emailed at once, in the Inbox. Depot > Feedback has a
  **daily digest** switch (`ve_site_settings` `feedback.digest`, off; cron `ve-feedback-digest` 13:23 UTC). Migration
  `20261105_feedback_suggestions_digest.sql`, `ve-feedback` sha 5759d515.
- Leftover: a test row "[TEST] Logan checking the suggestion kind. Ignore." is in Depot > Feedback (delete was held by the connector). Mark Spam or delete.
- **Next (step 2)**: Talk to me on the Guide panels (`#dgRail` pages: Guides, Events Guide, Partner Dashboard tour, Resources tab), same
  chat, that page's Guide; then members (saved answers first, then the AI Guide at 4 points) and visitors (suggestions only).

## ve-restaurant-guide: outreach email fixes from Sean's review (drafts, nothing sent, no city on)
- Day 0 no longer carries `{free_check}`: Darbster's line ("title and headline do not say West Palm Beach") came from the monthly check-up's
  machine read (`s_title_local`); too risky for a first email. The full check stays in the Guide.
- Greeting: first name only when the email address contains it (`ve_outreach_name_ok`) or the name is confirmed; else "Hi there," and no
  name in the subject. Migration `20261105_outreach_fixes_greeting_unsub.sql`.
- Unsubscribe: business outreach sends as new email brand `ve-business-outreach` (Sean A. Russell, sean@mail.lesaruss.ai, replies
  contact@lesaruss.com, unsubscribe vegansexplore.com/unsubscribe); city lists `sender_brand` set to it; people lists stay `lesaruss`;
  partner onboarding moved too. `ve-outreach` v26 sha 48ce18b0; dry run on Darbster confirmed the link.
- The two after-membership notes (`door-rg-in`, `door-rg-7`) are built as drafts and off (earlier handoff 2026-11-05).
- Findings for Sean: FARA has one address on file (opted out; text Carol by hand). Rose of Sharon kept. Garden of Life is a supplement
  brand with an orders inbox, off the restaurant campaign. Unreconcilable contacts: skip now, keep Instagram and phone for Community Managers.
- Still waiting on Sean: who signs the two notes (team default), Founding line after Jan 1 (drops, default), approve the three outreach
  emails, campaign-based sending (cities as a filter) is the next outreach build (`ve-outreach-buckets`).
