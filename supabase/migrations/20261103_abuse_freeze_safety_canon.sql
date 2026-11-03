-- Abuse watch: freeze safety and the standing check are built (Logan, 2026-11-03 wrap-up). Data only, safe to run twice.
-- Code is in 20261103_abuse_freeze_safety.sql and the 15 edge functions deployed from 30bdda79.

update public.knowledge_records
set body = jsonb_set(jsonb_set(body, '{not_built}', $q$[
    "The /policies#community paragraph (Sean approves the wording) before any enforcement.",
    "The standing check in edge functions not listed in built (ve-dashboard, ve-affiliate, ve-nonprofit, ve-ambassador, ve-people-outreach...); points are frozen everywhere by the trigger regardless."
  ]$q$::jsonb), '{built}', to_jsonb($b$Tables ve_abuse_cases, ve_abuse_signals, ve_abuse_events, ve_member_devices; members.standing; ve_abuse_scan, ve_abuse_scan_devices, ve_abuse_watch, ve_abuse_decide; trg_ve_members_freeze_guard; ve-auth and ve-votes refuse a suspended or banned account; Depot > Watchlist and the ve-abuse function. Freeze safety 2026-11-03: ve_member_frozen, ve_points_grant returns granted false for a frozen member, ve_vault_settle skips them and settles each card in its own block, ve_challenge_settle holds and the sweep isolates each challenge, bounty pay, recipe approve and hunt award refuse before changing anything. The standing check on write actions (403 account_not_in_good_standing, fail closed on a READ_ACTIONS list) in ve-board, ve-checkin, ve-bounties, ve-events, ve-venues, ve-products, ve-cookbook, ve-vault, ve-challenge, ve-group, ve-guide-unlock, ve-podcast, ve-referrer, ve-mission-survey and ve-claims. All live, proven on Test Manager.$b$::text)),
    version = 2, updated_by = 'logan', change_summary = 'Freeze safety and the standing check built and live 2026-11-03'
where slug = 'canon-ve-abuse-watch' and version = 1;

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-abuse-watch', 'vegans-explore', 'Logan',
 $q$BUILT 2026-11-03 (later, Logan; the OPEN row above is closed): freeze safety (migration 20261103_abuse_freeze_safety.sql) and the standing check in 15 token-only edge functions. A frozen member's points grant returns granted false, a vault run skips them, a challenge is held (not paid, not expired), the sweeps isolate each item, and two admin approvals return account_frozen before changing anything. Edge functions refuse every non-read action with 403 account_not_in_good_standing (fail closed: a new action is a write until added to READ_ACTIONS). Proven in a rolled-back transaction and live with a suspended Test Manager session (writes 403 on all 15, reads 200), then restored. STILL OPEN: the /policies#community wording (draft waiting for Sean, must be live before any enforcement); the 2026-11-10 review of the Would flag list; the standing check in the functions not yet covered.$q$,
 'text', 'decision'
where not exists (select 1 from public.playbook_records p where p.slug = 've-abuse-watch' and p.body like 'BUILT 2026-11-03 (later, Logan%');

insert into public.brief_checkpoints (brand_slug, station, account, status, summary, files_touched, next_step, session_label, open_items)
select 'vegans-explore', 'claude-code-cloud', 'logan@lesaruss.com', 'handed_off',
 'Abuse watch continued 2026-11-03: freeze safety migration applied and proven; standing check deployed to 15 edge functions and proven live; CLAUDE.md, handoff, canon v2 and playbook updated. Branch claude/sleepy-keller-2hf8t5 (not merged to main).',
 '["supabase/migrations/20261103_abuse_freeze_safety.sql","supabase/migrations/20261103_abuse_freeze_safety_canon.sql","supabase/functions/(15 functions)","CLAUDE.md","docs/handoff/2026-11-03-abuse-watch.md"]'::jsonb,
 'Show Sean the /policies#community wording and publish it once approved; after 2026-11-10 read the Watchlist Would flag tab; Sean decides whether to turn on opening cases. Merge the branch to main.',
 'Wrap-up 2026-11-03: abuse watch freeze safety and standing check',
 '["policies community paragraph awaiting Sean","2026-11-10 Would flag review","merge branch to main","standing check not in ve-dashboard, ve-affiliate, ve-nonprofit, ve-ambassador, ve-people-outreach"]'::jsonb
where not exists (select 1 from public.brief_checkpoints where session_label = 'Wrap-up 2026-11-03: abuse watch freeze safety and standing check');

insert into public.stream_events (owner, station, session_id, summary, keywords, status, context_link)
select 'logan', 'vegans-explore', 'session_016QJoEqr1jaUv4f1N4RXtSu',
 'Abuse watch 2026-11-03: freeze safety migration applied and proven (suspended bidder and challenger), standing check deployed to 15 edge functions and proven live on Test Manager; policies wording drafted for Sean; log-only until 2026-11-10.',
 array['abuse-watch','freeze-safety','standing','vegans-explore'], 'completed', 'docs/handoff/2026-11-03-abuse-watch.md'
where not exists (select 1 from public.stream_events where session_id = 'session_016QJoEqr1jaUv4f1N4RXtSu' and station = 'vegans-explore');
