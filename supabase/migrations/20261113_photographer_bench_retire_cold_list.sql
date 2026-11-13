-- 2026-11-13: the cold photographer list is retired before anything was sent. Sean: "Why aren't we just reaching out to content creators?
-- I want to stay within our ecosystem. We should be more of a referral network than going to these big companies... Let's show them
-- exactly what we want and help them become better food photographers... we could reach out to colleges... Let's create the demand."
-- The campaign is finished unsent, its one member removed, the DMs marked done unsent, the five pb-* links switched off. Safe to run twice.
update public.ve_outreach_campaigns set status = 'finished', note = coalesce(note, '') || ' Retired unsent 2026-11-13 (Sean: stay within our ecosystem).'
 where slug = 'photographer-bench-2026-email' and status <> 'finished';
update public.ve_outreach_campaign_members set removed_at = now(), send_status = 'stopped', stop_reason = 'retired unsent: ecosystem first (Sean 2026-11-13)'
 where campaign_slug = 'photographer-bench-2026-email' and removed_at is null;
update public.ve_campaign_dms set status = 'done', done_at = now(), note = coalesce(note, '') || ' Retired unsent 2026-11-13.'
 where program_slug = 'photographer-bench-2026' and status = 'to_send';
update public.ve_links set active = false where initiative_slug = 'photographer-bench-2026' and active;
update public.ve_campaign_programs set note = 'RETIRED UNSENT 2026-11-13. Sean: stay within our ecosystem; train our own creators, members and students. ' || coalesce(note, '')
 where slug = 'photographer-bench-2026' and note not like 'RETIRED%';
