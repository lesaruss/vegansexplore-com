-- ve-outreach-buckets: fill the three Wednesday Nov 11 Holiday Guide follow-ups from founding cohort 1, by engagement.
-- Clicked beats opened beats quiet. Left out: anyone never sent, bounced, complained, or on an active suppression.
-- Safe to run twice: anyone already in a Wednesday campaign is skipped. Run Wednesday morning (Eastern) through the
-- one-time function scripts/supabase-once/founding-wed-fill.ts (step "fill"), after its step "show". Opens are a floor.
with s as (
  select m.person_key, m.person_name, m.person_id,
         bool_or(e.clicked_at is not null) clicked,
         bool_or(e.opened_at is not null) opened,
         bool_or(e.bounced_at is not null or e.complained_at is not null) bad,
         count(e.id) filter (where e.sent_at is not null) sent
  from public.ve_outreach_campaign_members m
  left join public.email_sends e
    on e.list_ref = 've-outreach-campaign:founding-cohort-1-2026-11'
   and e.campaign_ref like '%-c' || left(replace(m.id::text, '-', ''), 8) || '-%'
  where m.campaign_slug = 'founding-cohort-1-2026-11' and m.removed_at is null and m.step >= 1
  group by 1, 2, 3),
ok as (
  select s.*, case when clicked then 'founding-cohort-1-wed-clicked'
                   when opened then 'founding-cohort-1-wed-opened'
                   else 'founding-cohort-1-wed-quiet' end as bucket
  from s
  where sent > 0 and not bad
    and not exists (select 1 from public.email_suppressions x where x.active and lower(x.email) = lower(s.person_key))
    and not exists (select 1 from public.ve_outreach_campaign_members w
                    where w.campaign_slug like 'founding-cohort-1-wed-%' and w.removed_at is null
                      and lower(w.person_key) = lower(s.person_key)))
insert into public.ve_outreach_campaign_members (campaign_slug, person_key, person_name, person_id, step, send_status)
select bucket, person_key, person_name, person_id, 0, 'waiting' from ok;
