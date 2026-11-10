-- Sean, 2026-11-10: "Let's end founding cohort and move those remaining people into the... explorer batch. I want them to get the new
-- campaign." The 9 still waiting join holiday-launch-explore; their cohort 1 places are stopped (kept, never deleted); cohort 1 is finished.
-- Applied 2026-11-10.
insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, step, send_status)
select 'holiday-launch-explore', m.person_key, m.person_name, 0, 'waiting' from ve_outreach_campaign_members m
where m.campaign_slug = 'founding-cohort-1-2026-11' and m.send_status = 'waiting' and m.removed_at is null
  and not exists (select 1 from ve_outreach_campaign_members x where x.campaign_slug like 'holiday-launch-%' and x.person_key = m.person_key);
update ve_outreach_campaign_members set send_status = 'stopped', stop_reason = 'moved to holiday-launch-explore (Sean, 2026-11-10)'
where campaign_slug = 'founding-cohort-1-2026-11' and send_status = 'waiting' and removed_at is null;
update ve_outreach_campaigns set status = 'finished', paused_at = null where slug = 'founding-cohort-1-2026-11';
