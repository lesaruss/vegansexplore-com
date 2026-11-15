-- Sean, 2026-11-15: "let's have a field for people who complain, just so I know who it is... I would like to know people who don't
-- want to hear from us." Everyone who marked one of our emails as spam (reason complaint, from the Resend webhook) or unsubscribed
-- (reason unsubscribe, one-click or the landing page), with who they are, which brand they left, and the email that did it.
-- Read by HQ Outreach > Roster > Opted out (lesaruss-hq lib/veOutreachRead.ts readOptedOut). Same shape and lock-down as
-- ve_bounced_people (20261110_bounce_quarantine.sql): service role only. Safe to run twice.
create or replace view public.ve_opted_out_people as
select s.email,
       s.reason,
       s.scope as brand,
       s.source,
       s.created_at as opted_out_at,
       s.note,
       coalesce(
         (select m.person_name from public.ve_outreach_campaign_members m
           where lower(m.person_key) = s.email and m.person_name is not null limit 1),
         (select nullif(btrim(coalesce(g.first_name, '') || ' ' || coalesce(g.last_name, '')), '')
            from public.ve_ghl_contacts_export g where lower(g.email) = s.email limit 1),
         (select l.name from public.listings l where lower(l.email) = s.email limit 1)) as name,
       (select l.slug from public.listings l where lower(l.email) = s.email limit 1) as listing_slug,
       (select string_agg(distinct m.campaign_slug, ', ') from public.ve_outreach_campaign_members m
         where lower(m.person_key) = s.email) as campaigns,
       e.subject as email_subject,
       e.list_ref as email_list
  from public.email_suppressions s
  left join lateral (
    -- The email that did it: the exact send for a spam report, else the last email we sent them before they left.
    select es.subject, es.list_ref from public.email_sends es
     where (s.resend_email_id is not null and es.resend_email_id = s.resend_email_id)
        or (lower(es.to_email) = s.email and es.sent_at <= s.created_at)
     order by (s.resend_email_id is not null and es.resend_email_id = s.resend_email_id) desc, es.sent_at desc nulls last
     limit 1) e on true
 where s.active and s.reason in ('complaint', 'unsubscribe') and s.replaced_with is null;

revoke all on public.ve_opted_out_people from anon, authenticated;
