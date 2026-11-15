-- Sean, 2026-11-15: "yes, approve them" (the Christmas Menus drafts, 20261115_christmas_menus_campaign.sql). The same change HQ's Start
-- button makes (lesaruss-hq lib/veOutreachRead.ts startProgram): lock the emails, approve and activate both groups, the program live. Recorded
-- as Sean's approval (his member id). Starts Tuesday, November 17, 60 a day per group, weekdays 9 to 5 Eastern. Safe to run twice.
update public.ve_outreach_campaign_emails set locked_at = now(), locked_by = '72712a4a-ea0e-4ef4-a29e-d382496ef8da', redraft_at = null
 where campaign_slug in ('christmas-2026-vegan', 'christmas-2026-plant') and locked_at is null;
update public.ve_outreach_campaigns set approved_at = now(), approved_by = '72712a4a-ea0e-4ef4-a29e-d382496ef8da', status = 'active',
       paused_at = null, paused_by = null,
       note = note || ' Approved 2026-11-15 (Sean: "yes, approve them").'
 where slug in ('christmas-2026-vegan', 'christmas-2026-plant') and approved_at is null;
update public.ve_campaign_programs set status = 'live' where slug = 'christmas-menus-2026';
