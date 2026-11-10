-- Bounce quarantine (Sean, 2026-11-10: "anybody that bounces, let's pull them out just across the board and put them and quarantine them so
-- that way they don't impact our delivery moving forward. And that way I can also see who's bounced... reach out to them via Instagram").
-- Founding cohort 1 bounced 30 of 126 (24%). resend-webhook only suppressed hard bounces; now every bounce (hard or soft) is a global
-- suppression with reason 'bounce' (or 'hard_bounce'), which email-send, ve-outreach, ve-nurture and ve-people-outreach already honor.
-- A quarantined address is released by setting active false, released_at and released_by (never deleted).

alter table public.email_suppressions drop constraint if exists email_suppressions_reason_check;
alter table public.email_suppressions add constraint email_suppressions_reason_check
  check (reason = any (array['unsubscribe','hard_bounce','complaint','manual','bounce']));

-- 1. Backfill: every address that ever bounced (Resend events, email_sends, the old GoHighLevel "hard bounced" tag).
insert into public.email_suppressions (email, scope, reason, source, note)
select e, 'global', case when hard then 'hard_bounce' else 'bounce' end, 'bounce_quarantine', 'Quarantined 2026-11-10: ' || src
from (
  select e, bool_or(hard) hard, string_agg(distinct src, ', ') src from (
    select lower(btrim(to_email)) e, coalesce(bounce_type,'') = 'Permanent' hard, 'bounced (' || coalesce(bounce_type,'unknown') || ')' src
      from public.email_events where event_type = 'email.bounced' and to_email is not null
    union all
    select lower(btrim(to_email)), false, 'bounced on send' from public.email_sends where (bounced_at is not null or status = 'bounced') and to_email is not null
    union all
    select lower(btrim(email)), true, 'GoHighLevel hard bounced tag' from public.ve_ghl_contacts_export where tags ? 'hard bounced' and email is not null
  ) x group by e
) y
where e <> '' and not exists (select 1 from public.email_suppressions s where s.email = y.e and s.active and s.scope = 'global');

-- 2. From now on: any bounce event quarantines the address the moment it lands.
create or replace function public.email_bounce_quarantine() returns trigger language plpgsql security definer set search_path = public as $$
declare e text := lower(btrim(new.to_email));
begin
  if new.event_type = 'email.bounced' and e is not null and e <> ''
     and not exists (select 1 from email_suppressions s where s.email = e and s.active and s.scope = 'global') then
    insert into email_suppressions (email, scope, reason, source, resend_email_id, note)
    values (e, 'global', case when coalesce(new.bounce_type,'') = 'Permanent' then 'hard_bounce' else 'bounce' end, 'bounce_quarantine',
            new.resend_email_id, 'Bounced (' || coalesce(new.bounce_type,'unknown') || ') on: ' || coalesce(new.subject,''));
  end if;
  return new;
end $$;
drop trigger if exists email_bounce_quarantine on public.email_events;
create trigger email_bounce_quarantine after insert on public.email_events for each row execute function public.email_bounce_quarantine();

-- 3. Who bounced, by name, to reconnect by Instagram (HQ > Outreach > Bounced).
create or replace view public.ve_bounced_people as
select s.email, s.reason, s.created_at as quarantined_at, s.note,
  coalesce(
    (select m.person_name from ve_outreach_campaign_members m where lower(m.person_key) = s.email and m.person_name is not null limit 1),
    (select nullif(btrim(coalesce(g.first_name,'') || ' ' || coalesce(g.last_name,'')), '') from ve_ghl_contacts_export g where lower(g.email) = s.email limit 1),
    (select l.name from listings l where lower(l.email) = s.email limit 1)) as name,
  (select l.slug from listings l where lower(l.email) = s.email limit 1) as listing_slug,
  (select string_agg(distinct m.campaign_slug, ', ') from ve_outreach_campaign_members m where lower(m.person_key) = s.email) as campaigns
from email_suppressions s
where s.active and s.reason in ('bounce','hard_bounce');
revoke all on public.ve_bounced_people from anon, authenticated;
