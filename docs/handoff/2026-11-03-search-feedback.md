# Handoff: search queue, Feedback button, referral tiers (2026-11-03, Logan)

Stores written at wrap-up: `playbook_records` (slugs `ve-universal-search`, `ve-pricing-points-passport`), canon `canon-ve-search-questions` v2 and
`canon-wrap-up-standard`, `brief_checkpoints` (latest handed_off for vegans-explore), CLAUDE.md sections "When search has no answer" and "Feedback button".

## Done (main, Supabase fwbhwfxpncrsfhttimna)
- Referral reward tiers in the database (migration file `20261103_referral_reward_tiers.sql`), "Did someone send you?" sponsor field.
- Dashboard polish: full-width page bar, footer pinned, Admin eyebrow, ad rail under the controls (`ve-ad-rail.js` `align()`).
- Search dead end: Liz card, queue (`ve_search_questions`, `ve_search_ask`), `ve-search` v4.
- Feedback button: `public/ve-feedback.js`, `ve-feedback` edge function, `ve_feedback` table, buttons in `nav.js` and the dashboard top bar (commit 721858ca).

## Not done, in order
1. Confirm the Vercel deploy of 721858ca and that the Feedback button shows on the live site (never confirmed).
2. Depot > Feedback queue view and an Inbox row (copy `admin/depot/social.html` / a Depot page; one thing per view, status chips new/working/fixed/set_aside/spam).
3. Search queue: require an email for a submitted question, `quarantined` status, rate limit; Depot view to work it; email askers when answered.
4. Referral tiers: wording in Ambassador Guide, Points and levels, Guides facts, /policies, CLAUDE.md; live test; Sean confirms a Level 2 sponsor gets the 111 points on a survey join.
5. Depot view of conflict/unresolved referral claims; sponsor field on the survey registration step.
6. First vegan suit brands in Clothing & Fashion; verify Liz's picture on the search card live.

## Cautions
- A parallel session built the survey door and Founding levels 5 to 8 (`docs/handoff/2026-11-03-survey-door.md`); read it before touching `ve_referral_on_admit` or `ve_affiliate_levels`.
- apply_migration can be held by the connector; use the one-time function route in CLAUDE.md if it expires.
- Push to main non-force: fetch, merge origin/main, `git push origin HEAD:main`. Commit author Sean A. Russell <contact@lesaruss.com>.
