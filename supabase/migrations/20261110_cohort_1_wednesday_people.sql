-- Sean, 2026-11-10: "keep the Wednesday follow-ups". Cohort 1's people, by how they engaged with the invitation (clicked beats opened),
-- leaving out every bounce and every blocked address. 4 clicked, 35 opened, 55 no open. Drafts until Sean starts them. Applied 2026-11-10.
with s as (
  select lower(s.to_email) e, bool_or(s.opened_at is not null) op, bool_or(s.clicked_at is not null) cl, bool_or(s.bounced_at is not null or s.status = 'bounced') bo
  from email_sends s where s.list_ref = 've-outreach-campaign:founding-cohort-1-2026-11' group by 1
), t as (
  select s.e, case when s.cl then 'clicked' when s.op then 'opened' else 'quiet' end g,
    (select m.person_name from ve_outreach_campaign_members m where m.campaign_slug = 'founding-cohort-1-2026-11' and lower(m.person_key) = s.e limit 1) nm
  from s where not s.bo and not email_is_suppressed(s.e, 'lesaruss')
)
insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, step, send_status)
select 'founding-cohort-1-wed-' || g, e, nm, 0, 'waiting' from t
where not exists (select 1 from ve_outreach_campaign_members x where x.campaign_slug = 'founding-cohort-1-wed-' || t.g and x.person_key = t.e);
