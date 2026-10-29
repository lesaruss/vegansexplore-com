-- Groups, live (Sean, 2026-10-29): "build the live announcements for real groups" and "a way where the organizer can gift a Vegans
-- Explore membership. It would cost whatever our half of the $11 would be based on where they are in the commission split. It would
-- be deducted from their payout and be applied by them issuing an invite link to a specific address."
--
-- 1. Joining a group: ve_group_members. Any Passport holder joins any group, from any city; the announcement email is an unticked
--    yes of its own (email_ok), as every partner message is (canon-ve-member-profiles-partner-windows).
-- 2. Announcements: ve_group_announcements, on the group's Overview under About; ticked, emailed through us to the members who said
--    yes (ve_group_announcement_deliveries, a token each for Stop emails, Leave and Report). A report pauses the group's emails
--    (ve_group_mail_holds) until the team looks.
-- 3. Group Partner earnings (canon-ve-group-partners): each partnership's link code (/r/<code>), members.referred_by_group, and
--    ve_affiliate_earn paying the group by the ladder (20% to 50% by lifetime members brought in), group_partner_id on the row.
-- 4. Gifts: the organizer gives one person a Passport. It costs our share of the $11 at the group's rate today, taken from the
--    group's earnings as a negative commission row (product 'gift', ref 'gift:<invite>'), and goes out as a universe_invites row
--    (points_to 'gift', the group's listing_id) for that one email. A gift that expires, is canceled or is declined is given back.
-- Everything through the edge function ve-group; no table has a public policy.

-- ---------------------------------------------------------------- settings (Logan's defaults, Sean's to change)
insert into ve_site_settings (key, value) values ('group_partner_program', jsonb_build_object(
  'ladder', jsonb_build_array(jsonb_build_array(0, 20), jsonb_build_array(25, 25), jsonb_build_array(75, 30), jsonb_build_array(150, 35),
    jsonb_build_array(300, 40), jsonb_build_array(600, 45), jsonb_build_array(1000, 50)),
  'products', jsonb_build_array('passport', 'guide'),
  'emails_per_week', 2, 'posts_per_day', 5, 'gift_points', 1100, 'gift_days', 30, 'gift_open_max', 20,
  -- How far below zero a group's balance may go for gifts (0: gifts come only from what the group has earned).
  'gift_credit_cents', 0))
on conflict (key) do nothing;

-- ---------------------------------------------------------------- the partnership's link
alter table ve_group_partners add column if not exists code text unique;
alter table ve_group_partners add column if not exists started_at timestamptz;

create or replace function public.ve_partner_code(p_name text)
returns text language plpgsql stable security definer set search_path to 'public' as $function$
declare base text := ''; w text; c text; k int := 1;
begin
  foreach w in array regexp_split_to_array(trim(both '-' from regexp_replace(upper(coalesce(p_name, '')), '[^A-Z0-9]+', '-', 'g')), '-') loop
    exit when w = '' or length(base) + length(w) + (case when base = '' then 0 else 1 end) > 21;
    base := base || case when base = '' then '' else '-' end || w;
  end loop;
  if base = '' then base := left(split_part(trim(both '-' from regexp_replace(upper(coalesce(p_name, '')), '[^A-Z0-9]+', '-', 'g')), '-', 1), 21); end if;
  if length(base) < 3 then base := 'ORG-' || upper(substr(md5(random()::text), 1, 4)); end if;
  c := base;
  while exists (select 1 from members where referral_code = c) or exists (select 1 from ve_nonprofit_partners where code = c)
     or exists (select 1 from ve_group_partners where code = c) loop
    k := k + 1; c := base || '-' || k;
  end loop;
  return c;
end $function$;

-- A partnership gets its code the moment it starts (onboarding or active), named for the group.
create or replace function public.ve_group_partner_code()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  if new.status in ('onboarding', 'active') then
    if new.code is null then new.code := ve_partner_code((select name from listings where id = new.listing_id)); end if;
    if new.started_at is null then new.started_at := now(); end if;
  end if;
  return new;
end $function$;
drop trigger if exists trg_ve_group_partner_code on ve_group_partners;
create trigger trg_ve_group_partner_code before insert or update of status on ve_group_partners
  for each row execute function ve_group_partner_code();
update ve_group_partners set status = status where status in ('onboarding', 'active') and code is null;

alter table members add column if not exists referred_by_group uuid references ve_group_partners(id) on delete set null;

create or replace function public.ve_referral_visit(p_code text, p_visitor text, p_path text default null)
returns void language sql security definer set search_path to 'public' as $function$
  insert into ve_referral_visits (code, visitor, path)
  select upper(btrim(p_code)), left(p_visitor, 64), left(p_path, 200)
  where p_code ~* '^[A-Z0-9-]{3,24}$' and p_visitor ~ '^[A-Za-z0-9-]{8,64}$'
    and (exists (select 1 from members where referral_code = upper(btrim(p_code)))
      or exists (select 1 from ve_nonprofit_partners where code = upper(btrim(p_code)) and status = 'active')
      or exists (select 1 from ve_group_partners where code = upper(btrim(p_code)) and status in ('onboarding', 'active')))
  on conflict (code, visitor, day) do nothing;
$function$;

-- ---------------------------------------------------------------- commissions for groups, and gifts
alter table ve_affiliate_commissions add column if not exists group_partner_id uuid references ve_group_partners(id);
alter table ve_affiliate_commissions drop constraint if exists ve_affiliate_commissions_who_check;
alter table ve_affiliate_commissions add constraint ve_affiliate_commissions_who_check
  check (affiliate_id is not null or partner_id is not null or group_partner_id is not null);
alter table ve_affiliate_commissions drop constraint if exists ve_affiliate_commissions_route_check;
alter table ve_affiliate_commissions add constraint ve_affiliate_commissions_route_check check (route = any (array['self', 'nonprofit', 'partner', 'group']));
alter table ve_affiliate_commissions drop constraint if exists ve_affiliate_commissions_product_check;
alter table ve_affiliate_commissions add constraint ve_affiliate_commissions_product_check check (product = any (array['passport', 'guide', 'gift']));
-- A gift's row has no buyer until someone accepts it (ve_group_gift_status fills it in).
alter table ve_affiliate_commissions alter column buyer_id drop not null;
create index if not exists ve_affiliate_commissions_group_idx on ve_affiliate_commissions (group_partner_id) where group_partner_id is not null;

-- The group's place on the ladder today: lifetime members brought in (joined with its link or its gift), its rate and the next rung.
create or replace function public.ve_group_rate(p_group uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare cfg jsonb; brought int; r jsonb; rate numeric := 20; nxt jsonb := null;
begin
  select value into cfg from ve_site_settings where key = 'group_partner_program';
  select count(*) into brought from members where referred_by_group = p_group and membership_status = 'active' and merged_into_member_id is null;
  for r in select * from jsonb_array_elements(coalesce(cfg->'ladder', '[[0,20]]'::jsonb)) loop
    if brought >= (r->>0)::int then rate := (r->>1)::numeric; elsif nxt is null then nxt := r; end if;
  end loop;
  return jsonb_build_object('brought', brought, 'rate_pct', rate, 'next', nxt, 'ladder', coalesce(cfg->'ladder', '[[0,20]]'::jsonb));
end $function$;

create or replace function public.ve_affiliate_earn(p_buyer uuid, p_product text, p_product_ref text, p_ref text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare b members; a members; p ve_nonprofit_partners; g ve_group_partners; lv jsonb; cfg jsonb; gcfg jsonb; rate numeric; sale int; cents int; v_id uuid;
begin
  select value into cfg from ve_site_settings where key = 'affiliate_program';
  select * into b from members m where m.id = p_buyer;
  if b.id is null or (b.referred_by is null and b.referred_by_partner is null and b.referred_by_group is null) then return jsonb_build_object('skipped', 'not_referred'); end if;
  if b.created_at < now() - make_interval(days => coalesce((cfg->>'window_days')::int, 365)) then return jsonb_build_object('skipped', 'window'); end if;
  sale := coalesce((cfg->>'sale_cents')::int, 1100);
  -- A group's link (Group Partners, Sean 2026-10-29): the ladder's rate on the day, counted before this member, paid to the group.
  if b.referred_by is null and b.referred_by_partner is null then
    select * into g from ve_group_partners where id = b.referred_by_group;
    if g.id is null or g.status not in ('onboarding', 'active') then return jsonb_build_object('skipped', 'group_not_active'); end if;
    if g.lead_member_id = b.id then return jsonb_build_object('skipped', 'self'); end if;
    select value into gcfg from ve_site_settings where key = 'group_partner_program';
    if not coalesce(gcfg->'products', '["passport","guide"]'::jsonb) ? p_product then return jsonb_build_object('skipped', 'product'); end if;
    rate := (ve_group_rate(g.id)->>'rate_pct')::numeric;
    cents := round(sale * rate / 100);
    insert into ve_affiliate_commissions (affiliate_id, group_partner_id, buyer_id, product, product_ref, ref, sale_cents, level, rate_pct, commission_cents,
      route, route_listing_id, hold_until)
    values (null, g.id, b.id, p_product, p_product_ref, p_ref, sale, 0, rate, cents, 'group', g.listing_id,
      now() + make_interval(days => coalesce((cfg->>'hold_days')::int, 30)))
    on conflict (ref) do nothing returning ve_affiliate_commissions.id into v_id;
    return jsonb_build_object('earned', v_id is not null, 'commission_cents', cents, 'group', g.id);
  end if;
  -- An organization's link (Nonprofit Partners, Sean 2026-10-29): the partnership's own rate, paid to the organization.
  if b.referred_by is null then
    select * into p from ve_nonprofit_partners where id = b.referred_by_partner;
    if p.id is null or p.status <> 'active' then return jsonb_build_object('skipped', 'partner_not_active'); end if;
    if p.lead_member_id = b.id then return jsonb_build_object('skipped', 'self'); end if;
    if not (p_product = any(p.products)) then return jsonb_build_object('skipped', 'product'); end if;
    cents := round(sale * p.rate_pct / 100);
    insert into ve_affiliate_commissions (affiliate_id, partner_id, buyer_id, product, product_ref, ref, sale_cents, level, rate_pct, commission_cents,
      route, route_listing_id, hold_until)
    values (null, p.id, b.id, p_product, p_product_ref, p_ref, sale, 0, p.rate_pct, cents, 'partner', p.listing_id,
      now() + make_interval(days => coalesce((cfg->>'hold_days')::int, 30)))
    on conflict (ref) do nothing returning ve_affiliate_commissions.id into v_id;
    return jsonb_build_object('earned', v_id is not null, 'commission_cents', cents, 'partner', p.id);
  end if;
  if b.referred_by = b.id then return jsonb_build_object('skipped', 'self'); end if;
  select * into a from members m where m.id = b.referred_by;
  if a.id is null or a.membership_status is distinct from 'active' or coalesce(a.member_class, '') = 'agent' or a.merged_into_member_id is not null then
    return jsonb_build_object('skipped', 'affiliate_not_active');
  end if;
  lv := ve_member_level(a.id);
  if not coalesce((lv->'products') ? p_product, false) then return jsonb_build_object('skipped', 'level', 'level', lv->'level'); end if;
  rate := (lv->>'rate_pct')::numeric;
  cents := round(sale * rate / 100);
  insert into ve_affiliate_commissions (affiliate_id, buyer_id, product, product_ref, ref, sale_cents, level, rate_pct, commission_cents,
    route, route_listing_id, hold_until)
  values (a.id, b.id, p_product, p_product_ref, p_ref, sale, (lv->>'level')::smallint, rate, cents,
    a.affiliate_route, case when a.affiliate_route = 'nonprofit' then a.affiliate_listing_id end,
    now() + make_interval(days => coalesce((cfg->>'hold_days')::int, 30)))
  on conflict (ref) do nothing returning ve_affiliate_commissions.id into v_id;
  return jsonb_build_object('earned', v_id is not null, 'commission_cents', cents, 'affiliate', a.id);
end $function$;

-- What the group can spend on gifts (changed the same day by 20261029_group_gift_cleared_balance.sql: cleared earnings only).
create or replace function public.ve_group_balance(p_group uuid)
returns int language sql stable security definer set search_path to 'public' as $function$
  select coalesce(sum(commission_cents), 0)::int from ve_affiliate_commissions where group_partner_id = p_group and status in ('pending', 'ready');
$function$;

alter table universe_invites drop constraint if exists universe_invites_points_to_check;
alter table universe_invites add constraint universe_invites_points_to_check
  check (points_to = any (array['none', 'dinner', 'community_manager', 'ambassador', 'founding', 'nonprofit', 'group', 'gift']));

-- A gift that will not be used gives its cost back to the group; a gift that is used makes its person one the group brought in
-- (when no one else did) and a member of the group (no announcement emails until they say yes).
create or replace function public.ve_group_gift_status()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare g ve_group_partners;
begin
  if new.points_to <> 'gift' or new.status is not distinct from old.status then return new; end if;
  if new.status in ('expired', 'canceled', 'declined') then
    update ve_affiliate_commissions set status = 'reversed', settled_at = now(),
      note = coalesce(note || ' ', '') || 'Given back: the gift was ' || new.status || '.'
      where ref = 'gift:' || new.id and status in ('pending', 'ready');
  elsif new.status = 'joined' and new.claimed_member_id is not null then
    select * into g from ve_group_partners where listing_id = new.listing_id;
    if g.id is not null then
      update members set referred_by_group = g.id, updated_at = now()
        where id = new.claimed_member_id and referred_by is null and referred_by_partner is null and referred_by_group is null;
      update ve_affiliate_commissions set buyer_id = new.claimed_member_id where ref = 'gift:' || new.id;
    end if;
    insert into ve_group_members (listing_id, member_id, via) values (new.listing_id, new.claimed_member_id, 'gift')
      on conflict (listing_id, member_id) do update set left_at = null;
  end if;
  return new;
end $function$;

-- ---------------------------------------------------------------- members, announcements, holds
create table if not exists ve_group_members (
  listing_id uuid not null references listings(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  email_ok boolean not null default false,
  email_ok_at timestamptz,
  via text check (via is null or via in ('page', 'gift', 'event')),
  primary key (listing_id, member_id)
);
alter table ve_group_members enable row level security;
create index if not exists ve_group_members_member_idx on ve_group_members (member_id);

drop trigger if exists trg_ve_group_gift_status on universe_invites;
create trigger trg_ve_group_gift_status after update of status on universe_invites
  for each row execute function ve_group_gift_status();

create table if not exists ve_group_announcements (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  author_id uuid references members(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 1000),
  pinned boolean not null default false,
  emailed boolean not null default false,
  recipients int not null default 0,
  sent int not null default 0,
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references members(id) on delete set null
);
alter table ve_group_announcements enable row level security;
create index if not exists ve_group_announcements_listing_idx on ve_group_announcements (listing_id, created_at desc) where removed_at is null;

create table if not exists ve_group_announcement_deliveries (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references ve_group_announcements(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  token text not null unique default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  email_status text, email_id text, sent_at timestamptz, read_at timestamptz, reported_at timestamptz, report_note text,
  created_at timestamptz not null default now(),
  unique (announcement_id, member_id)
);
alter table ve_group_announcement_deliveries enable row level security;

create table if not exists ve_group_mail_holds (
  listing_id uuid primary key references listings(id) on delete cascade,
  paused_at timestamptz not null default now(),
  reason text
);
alter table ve_group_mail_holds enable row level security;

-- Gifts nobody opened in time expire every night, which gives their cost back.
create or replace function public.ve_group_gift_sweep()
returns int language sql security definer set search_path to 'public' as $function$
  with x as (update universe_invites set status = 'expired', updated_at = now()
    where points_to = 'gift' and status in ('ready', 'sent', 'opened') and expires_at < now() returning 1)
  select count(*)::int from x;
$function$;
do $$ begin
  perform cron.unschedule('ve-group-gift-sweep') where exists (select 1 from cron.job where jobname = 've-group-gift-sweep');
  perform cron.schedule('ve-group-gift-sweep', '23 7 * * *', 'select public.ve_group_gift_sweep()');
end $$;

-- ---------------------------------------------------------------- the organizer's dashboard, in one call
-- The shape ve-partner-dashboard.js draws (see its Group Partner views): announcements and members for any group's owner;
-- group (the partnership: members, rate, link, events, earnings, gifts) once the group is a partner.
create or replace function public.ve_group_dash(p_listing uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare g ve_group_partners; l listings; rate jsonb; out jsonb; cfg jsonb; bal int; cost int;
begin
  select * into l from listings where id = p_listing;
  select value into cfg from ve_site_settings where key = 'group_partner_program';
  out := jsonb_build_object(
    'announcements', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'at', a.created_at, 'title', a.title, 'body', a.body, 'pinned', a.pinned,
        'emailed', a.emailed, 'sent_to', a.sent, 'recipients', a.recipients) order by a.pinned desc, a.created_at desc)
      from ve_group_announcements a where a.listing_id = p_listing and a.removed_at is null), '[]'::jsonb),
    'group_members', (select count(*) from ve_group_members where listing_id = p_listing and left_at is null),
    'group_email_ok', (select count(*) from ve_group_members where listing_id = p_listing and left_at is null and email_ok),
    'mail_paused', exists (select 1 from ve_group_mail_holds where listing_id = p_listing),
    'limits', jsonb_build_object('emails_per_week', coalesce((cfg->>'emails_per_week')::int, 2),
      'emails_left', greatest(0, coalesce((cfg->>'emails_per_week')::int, 2) - (select count(*) from ve_group_announcements
        where listing_id = p_listing and emailed and created_at > now() - interval '7 days')), 'max', 1000));
  select * into g from ve_group_partners where listing_id = p_listing and status in ('onboarding', 'active', 'paused');
  if g.id is null then return out; end if;
  rate := ve_group_rate(g.id);
  bal := ve_group_balance(g.id);
  cost := round(1100 * (100 - (rate->>'rate_pct')::numeric) / 100);
  return out || jsonb_build_object('group', jsonb_build_object(
    'status', g.status, 'code', g.code, 'link', 'vegansexplore.com/r/' || coalesce(g.code, ''),
    'members_total', (out->>'group_members')::int,
    'new_this_month', (select count(*) from ve_group_members where listing_id = p_listing and left_at is null and joined_at > now() - interval '30 days'),
    'brought', (rate->>'brought')::int, 'rate_pct', (rate->>'rate_pct')::numeric, 'ladder', rate->'ladder',
    'guest_passes', jsonb_build_object('used', 0, 'joined_after', 0),
    'members', coalesce((select jsonb_agg(x order by x->>'joined' desc) from (
      select jsonb_build_object('name', split_part(m.name, ' ', 1) || coalesce(' ' || left(nullif(split_part(m.name, ' ', 2), ''), 1) || '.', ''),
        'joined', gm.joined_at, 'via', case gm.via when 'gift' then 'Your gift' when 'event' then 'An event' else case when m.referred_by_group = g.id then 'Your link' else 'Joined on your page' end end,
        'events', (select count(*) from event_rsvps r join events e on e.id = r.event_id where r.member_id = m.id and e.host_listing_id = p_listing and r.status = 'going'),
        'chapter', coalesce(m.home_community, '')) x
      from ve_group_members gm join members m on m.id = gm.member_id where gm.listing_id = p_listing and gm.left_at is null limit 500) s), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'starts_at', e.starts_at, 'location_name', e.location_name, 'city', e.city,
        'price_cents', coalesce(e.price_cents, 0), 'capacity', null, 'guest_passes', 0,
        'going', (select count(*) from event_rsvps r where r.event_id = e.id and r.status = 'going')) order by e.starts_at)
      from events e where e.host_listing_id = p_listing and e.status = 'approved' and e.starts_at > now() - interval '365 days'), '[]'::jsonb),
    'earnings', jsonb_build_object(
      'passports_cents', (select coalesce(sum(commission_cents), 0) from ve_affiliate_commissions where group_partner_id = g.id and product <> 'gift' and status <> 'reversed' and created_at >= date_trunc('year', now())),
      'tickets_cents', 0, 'fee_cents', 0,
      'gifts_cents', (select coalesce(-sum(commission_cents), 0) from ve_affiliate_commissions where group_partner_id = g.id and product = 'gift' and status <> 'reversed'),
      'ready_cents', (select coalesce(sum(commission_cents), 0) from ve_affiliate_commissions where group_partner_id = g.id and status = 'ready'),
      'holding_cents', (select coalesce(sum(commission_cents), 0) from ve_affiliate_commissions where group_partner_id = g.id and status = 'pending'),
      'w9', exists (select 1 from finance_payees fp join members lm on lower(lm.email) = lower(fp.email) where lm.id = g.lead_member_id and fp.w9_received_on is not null),
      'payouts', coalesce((select jsonb_agg(jsonb_build_object('at', settled_at, 'cents', c) order by settled_at desc) from (
          select date_trunc('day', settled_at) settled_at, sum(commission_cents) c from ve_affiliate_commissions where group_partner_id = g.id and status = 'paid' group by 1) p), '[]'::jsonb),
      'recent', coalesce((select jsonb_agg(jsonb_build_object('at', created_at, 'kind', case when product = 'gift' then 'gift' else 'passport' end,
          'what', case when product = 'gift' then 'A gift' when product = 'guide' then 'A Guide through your link' else 'A Passport through your link' end, 'cents', commission_cents) order by created_at desc)
        from (select * from ve_affiliate_commissions where group_partner_id = g.id and status <> 'reversed' order by created_at desc limit 20) c), '[]'::jsonb)),
    'gift', jsonb_build_object('cost_cents', cost, 'rate_pct', (rate->>'rate_pct')::numeric, 'balance_cents', bal,
      'credit_cents', coalesce((cfg->>'gift_credit_cents')::int, 0), 'points', coalesce((cfg->>'gift_points')::int, 1100),
      'days', coalesce((cfg->>'gift_days')::int, 30),
      'can', g.status in ('onboarding', 'active') and bal + coalesce((cfg->>'gift_credit_cents')::int, 0) >= cost),
    'gifts', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'email', i.email, 'status', i.status, 'sent_via', i.sent_via,
        'created_at', i.created_at, 'expires_at', i.expires_at, 'joined_at', i.joined_at, 'code', i.code,
        'cost_cents', (select -c.commission_cents from ve_affiliate_commissions c where c.ref = 'gift:' || i.id),
        'given_back', exists (select 1 from ve_affiliate_commissions c where c.ref = 'gift:' || i.id and c.status = 'reversed')) order by i.created_at desc)
      from universe_invites i where i.points_to = 'gift' and i.listing_id = p_listing), '[]'::jsonb)
  ));
end $function$;
