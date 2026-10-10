-- Business outreach sender (Sean, 2026-10-10: "go ahead and build the sender"). ve-outreach `tick` (cron
-- ve-outreach-send, every 10 minutes) sends what ve_outreach_due() returns, on weekdays 9 AM to 5 PM Eastern, a few at a
-- time, through email-send (suppression, one-click unsubscribe, postal address, one email_sends row each). Before every
-- tick ve_outreach_sync() reads what each business did, so the next email never goes to someone who already answered:
--   a real click on their personal /go/ link      -> interested (routed to the Community Manager or Sean)
--   a reply in contact@lesaruss.com (not an auto-reply) -> interested
--   a claim or an application for their listing   -> joined
--   their address unsubscribed or blocked          -> opted_out
--   a bounce                                       -> bounced

create or replace function public.ve_outreach_sync() returns jsonb
language plpgsql security definer set search_path to 'public' as $fn$
declare n_click int := 0; n_reply int := 0; n_join int := 0; n_out int := 0; n_bounce int := 0;
begin
  -- Joined: a claim on their listing made after our first email, or the listing now has an owner.
  with j as (
    update ve_outreach_contacts c set status = 'joined', joined_at = now(), stop_reason = 'claimed their page'
    where c.status in ('in_sequence', 'finished', 'interested') and c.step > 0
      and (exists (select 1 from listings l where l.id = c.listing_id and (l.claimed_by_member_id is not null or l.owner_member_id is not null))
        or exists (select 1 from ve_listing_claims k where k.listing_id = c.listing_id and not coalesce(k.test, false)
          and k.created_at > (select min(e.created_at) from ve_outreach_events e where e.contact_id = c.id and e.kind = 'sent')))
    returning c.id)
  select count(*) into n_join from j;
  insert into ve_outreach_events (contact_id, kind, detail)
    select id, 'claimed', '{}'::jsonb from ve_outreach_contacts where status = 'joined' and joined_at > now() - interval '1 minute'
      and not exists (select 1 from ve_outreach_events e where e.contact_id = ve_outreach_contacts.id and e.kind = 'claimed');

  -- Opted out: their address is on the do-not-email list for Sean's sender or everywhere.
  with o as (
    update ve_outreach_contacts c set status = 'opted_out', stop_reason = 'unsubscribed or blocked'
    where c.status in ('not_sent', 'in_sequence', 'finished')
      and exists (select 1 from email_suppressions x where x.active and lower(x.email) = lower(c.email) and x.scope in ('global', 'lesaruss'))
    returning c.id)
  select count(*) into n_out from o;

  -- Bounced.
  with b as (
    update ve_outreach_contacts c set status = 'bounced', stop_reason = 'the email bounced'
    where c.status in ('in_sequence', 'finished')
      and exists (select 1 from email_sends s where s.campaign_ref like 've-outreach-' || c.id || '-%' and (s.bounced_at is not null or s.status = 'bounced'))
    returning c.id)
  select count(*) into n_bounce from b;

  -- Replied (a person, not an auto-reply) after our first email.
  with r as (
    update ve_outreach_contacts c set status = 'interested', stop_reason = 'replied'
    where c.status in ('in_sequence', 'finished')
      and exists (select 1 from email_replies m where lower(m.from_email) = lower(c.email) and not coalesce(m.is_auto_reply, false)
        and m.received_at > (select min(e.created_at) from ve_outreach_events e where e.contact_id = c.id and e.kind = 'sent'))
    returning c.id)
  select count(*) into n_reply from r;
  insert into ve_outreach_events (contact_id, kind, detail)
    select id, 'replied', '{}'::jsonb from ve_outreach_contacts where stop_reason = 'replied'
      and not exists (select 1 from ve_outreach_events e where e.contact_id = ve_outreach_contacts.id and e.kind = 'replied');

  -- Clicked their personal link (link previews and scanners are logged as bots and never count).
  with k as (
    update ve_outreach_contacts c set status = 'interested', stop_reason = 'clicked their page'
    where c.status in ('in_sequence', 'finished') and c.link_code is not null
      and exists (select 1 from ve_links l join ve_link_clicks x on x.link_id = l.id where l.code = c.link_code and not x.is_bot
        and x.clicked_at > (select min(e.created_at) from ve_outreach_events e where e.contact_id = c.id and e.kind = 'sent'))
    returning c.id)
  select count(*) into n_click from k;
  insert into ve_outreach_events (contact_id, kind, detail)
    select id, 'clicked', '{}'::jsonb from ve_outreach_contacts where stop_reason = 'clicked their page'
      and not exists (select 1 from ve_outreach_events e where e.contact_id = ve_outreach_contacts.id and e.kind = 'clicked');

  -- A send day is Sent once everyone in it has had their first email or stopped.
  update ve_outreach_batches b set status = 'sent', updated_at = now()
  where b.status = 'approved' and not exists (select 1 from ve_outreach_contacts c where c.batch_id = b.id and c.status = 'not_sent');

  return jsonb_build_object('clicked', n_click, 'replied', n_reply, 'joined', n_join, 'opted_out', n_out, 'bounced', n_bounce);
end $fn$;
revoke all on function public.ve_outreach_sync() from public, anon, authenticated;
grant execute on function public.ve_outreach_sync() to service_role;

-- Sent today per city (Eastern day), for the city's daily cap.
create or replace function public.ve_outreach_sent_today()
returns table (community_slug text, n bigint)
language sql stable security definer set search_path to 'public' as $fn$
  select c.community_slug, count(*) from ve_outreach_events e join ve_outreach_contacts c on c.id = e.contact_id
  where e.kind = 'sent' and (e.created_at at time zone 'America/New_York')::date = (now() at time zone 'America/New_York')::date
  group by 1
$fn$;
revoke all on function public.ve_outreach_sent_today() from public, anon, authenticated;
grant execute on function public.ve_outreach_sent_today() to service_role;

-- Every 10 minutes; the function itself only sends on weekdays, 9 AM to 5 PM Eastern, and only for approved send days in
-- cities that are switched on.
select cron.schedule('ve-outreach-send', '*/10 * * * *', $c$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-outreach',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"tick"}'::jsonb, timeout_milliseconds := 120000)
$c$);
