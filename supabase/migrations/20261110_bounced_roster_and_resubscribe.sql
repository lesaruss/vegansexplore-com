-- Bounced on the Roster, a new email fixes a bounce, and signing up again lifts a block (Sean, 2026-11-10):
-- "create another one that says bounced, and then anyone that is in bounced would be treated like unsubscribed or do not contact... bounce
-- we can fix... if I can find an updated email address or another contact for them, I will add it. Or if they ever should subscribe again,
-- it'll pull it from it. And vice versa. If they're on unsubscribed, they can." And: "If there's somebody that I have in do not contact and
-- they subscribe, we can let them subscribe... I don't have to connect with them."
-- Rules: a subscribe (an account, a confirmed Daily Pulse, a list sign-up) releases that address's bounce, unsubscribe and do-not-contact
-- email blocks, so they get what they signed up for. A Do not contact listing stays out of personal outreach campaigns (its ve_do_not_contact
-- row stays, with a note), since Sean does not have to connect with them. A spam complaint and "Passed away" are never released.
-- Unsubscribing again puts the block back (the existing unsubscribe paths), and a new bounce quarantines again (email_bounce_quarantine).

alter table public.email_suppressions add column if not exists replaced_with text;
alter table public.email_suppressions add column if not exists replaced_at timestamptz;

-- 1. The Roster's statuses gain 'bounced' (before unsubscribed).
create or replace function public.ve_outreach_roster(p_status text[] DEFAULT NULL::text[], p_vegan_only boolean DEFAULT false, p_chapter text DEFAULT NULL::text, p_category text[] DEFAULT NULL::text[], p_campaign text DEFAULT NULL::text, p_q text DEFAULT NULL::text, p_has_email boolean DEFAULT NULL::boolean, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0, p_group text DEFAULT 'open'::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with supp as (
    select lower(email) e, bool_or(reason in ('bounce','hard_bounce')) bounced from email_suppressions where active group by 1
  ), opened as (
    select distinct (regexp_match(campaign_ref, '^ve-outreach-([0-9a-f-]{36})-'))[1]::uuid contact_id
    from email_sends
    where campaign_ref ~ '^ve-outreach-[0-9a-f-]{36}-(c[0-9a-f]+-)?[0-9]+$' and opened_at is not null
  ), base as (
    select l.id listing_id, l.name, l.slug, l.category, l.vegan_status, l.address_city city, l.address_state state, l.business_status,
           ve_chapter_of(l.address_city, l.address_state) chapter,
           coalesce(nullif(c.email,''), nullif(l.email,'')) email,
           c.id contact_id, c.status contact_status, c.email_source, c.door, c.last_sent_at,
           case
             when exists (select 1 from ve_do_not_contact d where d.released_at is null
                          and (d.listing_id = l.id or (d.email is not null and d.email = lower(coalesce(nullif(c.email,''), nullif(l.email,'')))))) then 'do_not_contact'
             when exists (select 1 from supp s where s.e = lower(coalesce(nullif(c.email,''), nullif(l.email,''))) and s.bounced)
                  or c.status = 'bounced' then 'bounced'
             when exists (select 1 from supp s where s.e = lower(coalesce(nullif(c.email,''), nullif(l.email,''))))
                  or c.status = 'opted_out' then 'unsubscribed'
             when l.owner_member_id is not null or c.status = 'joined' or c.joined_at is not null then 'member'
             when c.status = 'interested' or c.interested_at is not null
                  or coalesce(l.claim_status,'unclaimed') not in ('unclaimed','verified','rejected') then 'hot'
             when exists (select 1 from opened o where o.contact_id = c.id) then 'warm'
             else 'cold'
           end as status,
           coalesce((select array_agg(m.campaign_slug order by m.added_at) from ve_outreach_campaign_members m
                     where m.listing_id = l.id and m.removed_at is null), '{}') campaigns
    from listings l
    left join lateral (select * from ve_outreach_contacts x where x.listing_id = l.id order by x.created_at limit 1) c on true
    where l.status = 'approved'
      and case when coalesce(p_group, 'open') = 'closed' then ve_listing_is_closed(l.business_status) else not ve_listing_is_closed(l.business_status) end
  ), f as (
    select b.*, count(*) filter (where b.email is not null) over (partition by lower(b.email)) same_email
    from base b
    where (not coalesce(p_vegan_only,false) or b.vegan_status in ('fully_vegan','vegan'))
      and (p_chapter is null or b.chapter = p_chapter)
      and (p_category is null or b.category = any(p_category))
      and (p_campaign is null or p_campaign = any(b.campaigns))
      and (p_has_email is null or (b.email is not null) = p_has_email)
      and (p_q is null or p_q = '' or b.name ilike '%'||p_q||'%' or b.email ilike '%'||p_q||'%' or b.city ilike '%'||p_q||'%')
  ), shown as (
    select * from f where p_status is null or status = any(p_status)
  )
  select jsonb_build_object(
    'total', (select count(*) from shown),
    'counts', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from f group by 1) x), '{}'::jsonb),
    'rows', coalesce((select jsonb_agg(to_jsonb(r)) from (
        select * from shown order by (email is null), name, listing_id
        limit greatest(1, least(coalesce(p_limit,100), 500)) offset greatest(0, coalesce(p_offset,0))) r), '[]'::jsonb)
  );
$function$;

-- 2. Fix a bounce with a new email: the old address stays quarantined (marked replaced), the new one takes its place on the outreach
--    contact and on any campaign place not yet sent.
create or replace function public.ve_bounce_replace_email(p_old text, p_new text, p_by text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o text := lower(btrim(p_old)); n text := lower(btrim(p_new)); c int := 0; m int := 0;
begin
  if n !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('error', 'bad_email'); end if;
  if n = o then return jsonb_build_object('error', 'same_email'); end if;
  if email_is_suppressed(n, 'vegans-explore') then return jsonb_build_object('error', 'new_email_blocked'); end if;
  update ve_outreach_contacts set email = n, status = case when status = 'bounced' then 'not_sent' else status end,
    stop_reason = case when status = 'bounced' then null else stop_reason end, email_source = 'Replaced after a bounce', updated_at = now()
    where lower(email) = o;
  get diagnostics c = row_count;
  update ve_outreach_campaign_members set person_key = n where lower(person_key) = o and removed_at is null and coalesce(step, 0) = 0;
  get diagnostics m = row_count;
  update email_suppressions set replaced_with = n, replaced_at = now(), note = coalesce(note || ' ', '') || 'Replaced with ' || n || coalesce(' by ' || p_by, '')
    where email = o and active and reason in ('bounce','hard_bounce');
  return jsonb_build_object('ok', true, 'contacts', c, 'campaign_places', m);
end $$;
revoke all on function public.ve_bounce_replace_email(text, text, text) from public, anon, authenticated;

-- 3. Subscribing again lifts the block.
create or replace function public.ve_release_on_subscribe(p_email text, p_source text) returns void
language plpgsql security definer set search_path = public as $$
declare e text := lower(btrim(p_email));
begin
  if e is null or e = '' then return; end if;
  update email_suppressions set active = false, released_at = now(), released_by = 'subscribed: ' || p_source
    where email = e and active and reason in ('bounce','hard_bounce','unsubscribe','manual');
  update people_suppression set active = false, released_at = now()
    where lower(btrim(email)) = e and active and coalesce(reason, '') not ilike '%passed away%';
  update ve_do_not_contact set note = coalesce(note || ' ', '') || 'Subscribed ' || to_char(now() at time zone 'America/New_York', 'YYYY-MM-DD')
      || ' (' || p_source || '): they get what they signed up for; still no personal outreach.'
    where email = e and released_at is null and coalesce(note, '') not like '%Subscribed ' || to_char(now() at time zone 'America/New_York', 'YYYY-MM-DD') || '%';
end $$;
revoke all on function public.ve_release_on_subscribe(text, text) from public, anon, authenticated;

create or replace function public.ve_release_on_subscribe_trg() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'members' then
    perform ve_release_on_subscribe(new.email, 'joined');
  elsif tg_table_name = 've_tasters' then
    if (new.pulse_confirmed_at is not null and (tg_op = 'INSERT' or old.pulse_confirmed_at is distinct from new.pulse_confirmed_at))
       or (new.confirmed_at is not null and (tg_op = 'INSERT' or old.confirmed_at is distinct from new.confirmed_at)) then
      perform ve_release_on_subscribe(new.email, 'confirmed the Daily Pulse');
    end if;
  elsif tg_table_name = 'email_list_members' then
    if new.status = 'subscribed' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
      perform ve_release_on_subscribe(new.email, 'subscribed to ' || new.list_slug);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists ve_release_on_subscribe on public.members;
create trigger ve_release_on_subscribe after insert on public.members for each row execute function public.ve_release_on_subscribe_trg();
drop trigger if exists ve_release_on_subscribe on public.ve_tasters;
create trigger ve_release_on_subscribe after insert or update of pulse_confirmed_at, confirmed_at on public.ve_tasters for each row execute function public.ve_release_on_subscribe_trg();
drop trigger if exists ve_release_on_subscribe on public.email_list_members;
create trigger ve_release_on_subscribe after insert or update of status on public.email_list_members for each row execute function public.ve_release_on_subscribe_trg();

-- 4. The bounced list leaves out addresses already replaced.
create or replace view public.ve_bounced_people as
select s.email, s.reason, s.created_at as quarantined_at, s.note,
  coalesce(
    (select m.person_name from ve_outreach_campaign_members m where lower(m.person_key) = s.email and m.person_name is not null limit 1),
    (select nullif(btrim(coalesce(g.first_name,'') || ' ' || coalesce(g.last_name,'')), '') from ve_ghl_contacts_export g where lower(g.email) = s.email limit 1),
    (select l.name from listings l where lower(l.email) = s.email limit 1)) as name,
  (select l.slug from listings l where lower(l.email) = s.email limit 1) as listing_slug,
  (select string_agg(distinct m.campaign_slug, ', ') from ve_outreach_campaign_members m where lower(m.person_key) = s.email) as campaigns
from email_suppressions s
where s.active and s.reason in ('bounce','hard_bounce') and s.replaced_with is null;
revoke all on public.ve_bounced_people from anon, authenticated;
