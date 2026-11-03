-- Abuse watch: canon and playbook rows (Sean, 2026-11-03: "I'm the judge"; wrap-up sweep). Data only, safe to run twice.
-- The tables and functions are in 20261103_abuse_watch.sql and 20261103_abuse_watch_devices.sql.

insert into public.knowledge_records (slug, title, category, subcategory, body, status, owner, always_load, version, tags, created_by, updated_by, change_summary)
select 'canon-ve-abuse-watch',
  'Vegans Explore: abuse watch, a human judge decides (LOCKED by Sean 2026-11-03)',
  'decisions', 'product',
  $q${
  "why": "Sean: have some sort of security mechanism that looks for abuse; if an account is suspected of gaming the system, track it internally; if it abused the system its points are null and void and it is suspended or banned. Replaces a fixed cap on survey-door referral points.",
  "rules": [
    "The system only gathers evidence and watches quietly. Voiding points, suspending and banning are always a human decision: Sean is the judge, any super admin can carry it out, always with a written note, always logged.",
    "Suspend freezes points and participation and can be reversed (reinstate). Ban closes the account and sign-in but can be undone (reinstate). Void zeroes balance and lifetime points, keeps a snapshot, and can be restored. Nothing is deleted.",
    "Starts in log-only mode (ve_site_settings abuse_watch.mode log_only) for the first week to 2026-11-10: signals are recorded, no case opens. Sean turns on opening cases after reading the Would flag list.",
    "Signals: referral_burst, fast_survey, disposable_email, points_velocity, checkin_pace, survey_only_referrals, shared_browser, shared_ip. A score is each kind once over 14 days; a case opens at 40 (Logan default, Sean to change); watch 30 days.",
    "Devices: salted IP and browser hashes written at sign-up (ve_member_devices). Hashes only, never raw."
  ],
  "built": "Tables ve_abuse_cases, ve_abuse_signals, ve_abuse_events, ve_member_devices; members.standing; ve_abuse_scan, ve_abuse_scan_devices, ve_abuse_watch, ve_abuse_decide; trg_ve_members_freeze_guard; ve-auth and ve-votes refuse a suspended or banned account; Depot > Watchlist and the ve-abuse function. All live on main.",
  "not_built": [
    "Cron loops ve_vault_settle and ve_challenge_settle and the third-party point grants still raise account_frozen for a frozen member: fix before the first suspension.",
    "One shared standing check in the board, check-ins, bounties and the other token-only functions.",
    "The /policies#community paragraph (Sean approves the wording) before any enforcement."
  ],
  "docs": "CLAUDE.md section Abuse watch: a judge decides; docs/handoff/2026-11-03-abuse-watch.md"
}$q$::jsonb,
  'active', 'sar', false, 1,
  array['vegans-explore','abuse','points','moderation','watchlist','standing'],
  'logan', 'logan', 'First version, built and live 2026-11-03'
where not exists (select 1 from public.knowledge_records where slug = 'canon-ve-abuse-watch');

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select v.slug, 'vegans-explore', 'Logan', v.body, 'text', 'decision'
from (values
 ('ve-abuse-watch', $q$DECISION 2026-11-03 (Sean: "I'm the judge... suspend with freeze points... ban, but we could unban them... log only for a week... I agree with those, everything"; canon canon-ve-abuse-watch): referral farming through the free survey door is handled by detection and a human judge, not a cap. The system gathers evidence, watches quietly and never acts; Sean decides every void, suspend and ban, with a note. Suspend freezes points and taking part and is reversible; ban is undoable; void keeps a snapshot and can be restored. Log-only until 2026-11-10, then Sean decides whether to turn on opening cases.$q$),
 ('ve-abuse-watch', $q$BUILT 2026-11-03 (migrations 20261103_abuse_watch.sql, 20261103_abuse_watch_devices.sql; ve-auth v71, ve-votes, ve-abuse): cases, signals and events tables, members.standing, the daily scan and device scan (crons 9:09 and 9:11 UTC), the judge functions, a trigger that freezes a suspended or banned account's points, sign-in and vote refusal, salted IP and browser hashes at sign-up, and Depot > Watchlist. Proven live on a test account and in rolled-back transactions. public/ve-auth.js sends the browser id.$q$),
 ('ve-abuse-watch', $q$OPEN 2026-11-03 (found reading the loops, not yet fixed): ve_vault_settle would pick a suspended bidder and roll back every 15 minutes; ve_challenge_settle and ve_challenge_sweep raise account_frozen for a frozen member and stop the sweep; ve_points_grant, universe_join_from_purchase, ve_bounty_pay, ve_recipe_review and ve_hunt_award raise for a frozen member, which could fail a webhook or an admin approval. ve_referral_on_admit is safe (it catches the error). Fix in one migration before the first suspension: ve_points_grant returns granted false instead of raising, the settle loops skip and hold, per-item exception blocks. Then one shared standing check in the token-only edge functions, then the /policies#community paragraph.$q$)
) as v(slug, body)
where not exists (select 1 from public.playbook_records p where p.slug = v.slug and p.body = v.body);
