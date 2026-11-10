-- Welcome to the community goes out to everyone who becomes a member after Sean's approval (Sean, 2026-11-10: "approved").
-- Copies ve_orientation_sync: a 15-minute cron enrolls real members (member_class 'member', active, an email) whose joining moment
-- (sign-up, an invitation or payment, or the survey door) is after the campaign's approval. Each is sent about an hour after enrollment.
-- The orientation notes from the team follow from the next day. Keya (VeganKween) joined before the approval and is enrolled by hand.

create or replace function public.ve_welcome_sync() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r record; joined int := 0;
begin
  for r in
    select m.id, lower(btrim(m.email)) email, m.name
    from members m
    join ve_outreach_campaigns cp on cp.slug = 'welcome-community' and cp.status = 'active' and cp.approved_at is not null and cp.paused_at is null
    where m.member_class = 'member' and m.membership_status = 'active' and m.merged_into_member_id is null and m.deleted_at is null
      and coalesce(m.email, '') like '%@%'
      and greatest(m.created_at, coalesce(m.entry_paid_at, m.created_at), coalesce(m.survey_door_at, m.created_at)) >= cp.approved_at
      and not exists (select 1 from ve_outreach_campaign_members x where x.campaign_slug = 'welcome-community' and x.person_key = lower(btrim(m.email)))
    order by m.created_at
  loop
    insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, person_id, step, send_status, next_send_at)
      values ('welcome-community', r.email, r.name, r.id, 0, 'in_sequence', now() + interval '1 hour');
    joined := joined + 1;
  end loop;
  return jsonb_build_object('joined', joined);
end $$;

select cron.unschedule('ve-welcome-sync') where exists (select 1 from cron.job where jobname = 've-welcome-sync');
select cron.schedule('ve-welcome-sync', '*/15 * * * *', 'select public.ve_welcome_sync()');

-- Sean's approval (2026-11-10, in chat: "approved"), set the way HQ's Approve does it.
update ve_outreach_campaign_emails set locked_at = now(), locked_by = '72712a4a-ea0e-4ef4-a29e-d382496ef8da'
where campaign_slug = 'welcome-community' and step = 1 and locked_at is null;
update ve_outreach_campaigns set status = 'active', approved_at = now(), approved_by = '72712a4a-ea0e-4ef4-a29e-d382496ef8da',
  start_on = (now() at time zone 'America/New_York')::date
where slug = 'welcome-community' and approved_at is null;

-- Keya: the welcome instead of her old invitation email (she joined on her own the same morning).
insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, person_id, step, send_status, next_send_at)
select 'welcome-community', 'kyonakey@yahoo.com', 'Keya', '19f67b83-9368-40d5-af00-87084b0f3fae', 0, 'in_sequence', now() + interval '1 hour'
where not exists (select 1 from ve_outreach_campaign_members where campaign_slug = 'welcome-community' and person_key = 'kyonakey@yahoo.com');
update ve_outreach_campaign_members set removed_at = now(), send_status = 'stopped', stop_reason = 'She joined on her own; she gets Welcome to the community instead'
where campaign_slug = 'creator-welcome-keya' and person_key = 'kyonakey@yahoo.com' and removed_at is null;
