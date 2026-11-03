# Handoff: Depot queues, spam control, referral wording (2026-11-03, Logan, second session)

Stores written at wrap-up: `playbook_records` (slugs `ve-universal-search`, `ve-pricing-points-passport`), canon `canon-ve-search-questions` v3, `brief_checkpoints` (latest handed_off for vegans-explore), `stream_events`, CLAUDE.md sections "Feedback button", "When search has no answer", "Who sent you", "Levels are the affiliate ladder".

## Done (main, Supabase fwbhwfxpncrsfhttimna)
- **Depot > Feedback** (`/admin/depot/feedback`, `ve-feedback` v2 admin actions, Inbox row `20261103_feedback_inbox.sql`).
- **Referral tier wording** (Sean confirmed: a Level 2 sponsor gets 111 points when a friend joins by the survey; Level 3 and up get both). Behavior was already right (`ve_referral_on_admit`); proven in a rolled-back transaction. Wording in /policies, levels.html, passport.html, facts v22, two saved answers (`20261103_referral_tier_wording.sql`).
- **Search queue spam control** (`20261103_search_queue_spam_control.sql`): `quarantined` status, junk screen, 15 an hour and 40 a day per visitor or email, `ve-search` 429.
- **Depot > Search questions** (`/admin/depot/search-questions`, `ve-search` v6 from e816d07: `q_list`, `q_get`, `q_set`, `q_notify`, `q_setting`). Emailing askers is OFF until Sean turns it on (`ve_site_settings` `search_answers`).
- **Depot > Referral claims** (`/admin/depot/referral-claims`, `ve-referrer` v3 from 6b1351d, `20261103_referral_claims_review.sql`, `ve_referral_claim_decide`). The claims table is empty, so only the decision function was proven (rolled-back transaction); the page was checked against mocked answers.

## Not done, in order
1. Sean opens the three new Depot pages signed in and tries one action each (nothing signed-in was run by Logan): Feedback, Search questions (Send me a test), Referral claims.
2. Sean approves Liz's answer-email wording, then turns on emailing askers.
3. First vegan suit brands in Clothing and Fashion (Suits & formal has none; the search question "vegan suit" is the prompt). Only fully Vegan brands, checked by search, as the Clothing round did (`20261101_marketplaces_clothing_beauty.sql`).
4. Verify Liz's picture on the search card live (dead-end card, `VESearch.askCard`).
5. Referral claims: the field on the invitation, challenge and dinner join steps; a duplicate-account filter.
6. Inbox row for answered search questions (left out on purpose; ask Sean).

## Cautions
- Edge functions deploy from a commit through `ve-function-deploy` (one file only; an `import` of a second file fails to bundle). Check the source sha256 after.
- A parallel session built abuse watch (`docs/handoff/` abuse-watch notes, `ve-abuse`, `/admin/depot/watchlist`); read it before touching `members.standing` or the points freeze.
- `apply_migration` confirmations can expire after 2 minutes; retry once, then use the one-time function route in CLAUDE.md.
- Push to main non-force: fetch, merge origin/main, `git push origin HEAD:main`. Commit author Sean A. Russell <contact@lesaruss.com>.
