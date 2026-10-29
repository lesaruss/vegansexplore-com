-- Group Partners: tickets, guest passes and check-in (Sean, 2026-10-29: "Move forward", on Logan's recommendation to build Group
-- Partners ticketing next; canon canon-ve-group-partners, playbook ve-group-partners). The terms are the locked canon's:
--   Tickets: our fee is 5% of a paid ticket; free events are free; card processing is passed to the buyer; the group may pass our
--     fee on too (ve_ticket_types.pass_fee). The rest is the group's, paid like its other earnings: a commission row (product
--     'ticket', route 'group') held 30 days for refunds, then ready, paid once $25 is ready and the W-9 is in.
--   Guest pass: a non-member comes to one free event; from the second they join with the $11 Passport. Paid events need the
--     Passport from the start (only an active Passport holder can buy a ticket).
--   Refunds (Sean said "Move forward" on Logan's default the same day): the group sets its own refund policy
--     (events.refund_policy); a refund gives back what the ticket cost, our 5% included; card processing is not given back.
-- Money is collected on the Vegans Explore Stripe account, the way the group's gifts are; no Stripe Connect yet.
-- Edge function ve-group: event_tickets, ticket_checkout, guest_pass (the buyer's side), tickets, ticket_type_save,
-- refund_policy_save, checkin, ticket_refund (the organizer's side), and GET ?confirm= for a ticket checkout (ve-stripe-webhook too).

alter table events add column if not exists refund_policy text;

create table if not exists ve_ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  price_cents int not null check (price_cents between 100 and 100000),
  quantity int check (quantity is null or quantity between 1 and 10000),
  sold int not null default 0,
  pass_fee boolean not null default false,
  active boolean not null default true,
  sort int not null default 0,
  created_by uuid references members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_ticket_types_event on ve_ticket_types (event_id);

create table if not exists ve_ticket_orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id),
  ticket_type_id uuid not null references ve_ticket_types(id),
  member_id uuid not null references members(id),
  group_partner_id uuid references ve_group_partners(id),
  quantity int not null check (quantity between 1 and 10),
  unit_cents int not null,          -- the ticket's price
  fee_cents int not null,           -- our 5% of the tickets
  processing_cents int not null,    -- card processing, paid by the buyer
  total_cents int not null,         -- what the buyer paid
  group_cents int not null,         -- what the group earns
  pass_fee boolean not null default false,
  stripe_session text unique,
  payment_intent text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'canceled')),
  paid_at timestamptz,
  refunded_at timestamptz,
  refund_cents int,
  refunded_by uuid references members(id),
  test boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ve_ticket_orders_event on ve_ticket_orders (event_id, status);

create table if not exists ve_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references ve_ticket_orders(id) on delete cascade,
  event_id uuid not null references events(id),
  code text not null unique,
  checked_in_at timestamptz,
  checked_in_by uuid references members(id),
  voided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ve_tickets_event on ve_tickets (event_id);

create table if not exists ve_guest_passes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  event_id uuid not null references events(id),
  listing_id uuid not null references listings(id),
  member_id uuid references members(id),
  code text not null unique,
  checked_in_at timestamptz,
  checked_in_by uuid references members(id),
  created_at timestamptz not null default now()
);
-- One guest pass a person, ever, at any group.
create unique index if not exists ve_guest_passes_email on ve_guest_passes (lower(email));
create index if not exists ve_guest_passes_event on ve_guest_passes (event_id);

alter table ve_ticket_types enable row level security;
alter table ve_ticket_orders enable row level security;
alter table ve_tickets enable row level security;
alter table ve_guest_passes enable row level security;

alter table ve_affiliate_commissions drop constraint if exists ve_affiliate_commissions_product_check;
alter table ve_affiliate_commissions add constraint ve_affiliate_commissions_product_check check (product in ('passport', 'guide', 'gift', 'ticket'));

-- A door code: eight letters and numbers, nothing that reads two ways (no 0, O, 1, I, L).
create or replace function ve_ticket_code() returns text language plpgsql volatile set search_path = public as $$
declare a text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; c text;
begin
  loop
    c := '';
    for i in 1..8 loop c := c || substr(a, 1 + floor(random() * length(a))::int, 1); end loop;
    exit when not exists (select 1 from ve_tickets where code = c) and not exists (select 1 from ve_guest_passes where code = c);
  end loop;
  return c;
end $$;

-- A ticket order is paid: once only. Its tickets with their door codes, the type's count, the buyer on the guest list and in the
-- group, and the group's earnings held 30 days.
create or replace function ve_ticket_order_paid(p_order uuid, p_session text, p_intent text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o ve_ticket_orders; e events; codes text[] := '{}'; c text;
begin
  select * into o from ve_ticket_orders where id = p_order for update;
  if o.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if o.stripe_session is distinct from p_session then return jsonb_build_object('error', 'session'); end if;
  if o.status = 'paid' then
    return jsonb_build_object('ok', true, 'dup', true, 'codes', (select coalesce(jsonb_agg(code order by created_at), '[]'::jsonb) from ve_tickets where order_id = o.id));
  end if;
  if o.status <> 'pending' then return jsonb_build_object('error', 'status', 'status', o.status); end if;
  select * into e from events where id = o.event_id;
  update ve_ticket_orders set status = 'paid', paid_at = now(), payment_intent = coalesce(p_intent, payment_intent) where id = o.id;
  for i in 1..o.quantity loop
    c := ve_ticket_code();
    insert into ve_tickets (order_id, event_id, code) values (o.id, o.event_id, c);
    codes := codes || c;
  end loop;
  update ve_ticket_types set sold = sold + o.quantity, updated_at = now() where id = o.ticket_type_id;
  insert into event_rsvps (event_id, member_id, tenant_id, status, updated_at) values (o.event_id, o.member_id, e.tenant_id, 'going', now())
    on conflict (event_id, member_id) do update set status = 'going', updated_at = now();
  if e.host_listing_id is not null then
    insert into ve_group_members (listing_id, member_id, joined_at, email_ok, email_ok_at, via) values (e.host_listing_id, o.member_id, now(), false, now(), 'event')
      on conflict (listing_id, member_id) do nothing;
  end if;
  if o.group_partner_id is not null and o.group_cents > 0 then
    insert into ve_affiliate_commissions (group_partner_id, buyer_id, product, product_ref, ref, sale_cents, level, rate_pct, commission_cents,
      route, route_listing_id, status, hold_until, note)
    values (o.group_partner_id, o.member_id, 'ticket', o.id::text, 'ticket:' || o.id, o.unit_cents * o.quantity, 0,
      case when o.pass_fee then 100 else 95 end, o.group_cents, 'group', e.host_listing_id, 'pending', now() + interval '30 days',
      o.quantity || ' ticket' || case when o.quantity = 1 then '' else 's' end || ' to ' || e.title)
    on conflict do nothing;
  end if;
  return jsonb_build_object('ok', true, 'codes', to_jsonb(codes));
end $$;

-- A paid order is refunded (the money went back through Stripe first): its tickets are void, the type's count comes back, and the
-- group's earnings for it are taken back (reversed while held or ready; a negative row if it was already paid out).
create or replace function ve_ticket_order_refunded(p_order uuid, p_refund_cents int, p_by uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o ve_ticket_orders; cm ve_affiliate_commissions;
begin
  select * into o from ve_ticket_orders where id = p_order for update;
  if o.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if o.status = 'refunded' then return jsonb_build_object('ok', true, 'dup', true); end if;
  if o.status <> 'paid' then return jsonb_build_object('error', 'status', 'status', o.status); end if;
  update ve_ticket_orders set status = 'refunded', refunded_at = now(), refund_cents = p_refund_cents, refunded_by = p_by where id = o.id;
  update ve_tickets set voided_at = now() where order_id = o.id and voided_at is null;
  update ve_ticket_types set sold = greatest(0, sold - o.quantity), updated_at = now() where id = o.ticket_type_id;
  update event_rsvps set status = 'cancelled', updated_at = now() where event_id = o.event_id and member_id = o.member_id
    and not exists (select 1 from ve_ticket_orders x where x.event_id = o.event_id and x.member_id = o.member_id and x.status = 'paid' and x.id <> o.id);
  select * into cm from ve_affiliate_commissions where ref = 'ticket:' || o.id;
  if cm.id is not null then
    if cm.status in ('pending', 'ready') then update ve_affiliate_commissions set status = 'reversed', settled_at = now() where id = cm.id;
    elsif cm.status = 'paid' then
      insert into ve_affiliate_commissions (group_partner_id, buyer_id, product, product_ref, ref, sale_cents, level, rate_pct, commission_cents,
        route, route_listing_id, status, hold_until, note)
      values (cm.group_partner_id, cm.buyer_id, 'ticket', o.id::text, 'ticket-refund:' || o.id, cm.sale_cents, 0, cm.rate_pct, -cm.commission_cents,
        'group', cm.route_listing_id, 'ready', now(), 'Refund: ' || coalesce(cm.note, 'tickets'))
      on conflict do nothing;
    end if;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- Someone who came on a guest pass and then joins counts toward the group's rate, the same as joining through its link.
create or replace function trg_ve_guest_pass_ref() returns trigger language plpgsql security definer set search_path = public as $$
declare gp uuid;
begin
  if new.referred_by is not null or new.referred_by_group is not null or new.email is null then return new; end if;
  if tg_op = 'UPDATE' and not (new.membership_status = 'active' and old.membership_status is distinct from 'active') then return new; end if;
  select p.id into gp from ve_guest_passes g join ve_group_partners p on p.listing_id = g.listing_id and p.status in ('onboarding', 'active')
    where lower(g.email) = lower(new.email) limit 1;
  if gp is not null then new.referred_by_group := gp; end if;
  return new;
end $$;
drop trigger if exists trg_ve_guest_pass_ref on members;
create trigger trg_ve_guest_pass_ref before insert or update of membership_status on members for each row execute function trg_ve_guest_pass_ref();

revoke all on function ve_ticket_code() from public, anon, authenticated;
revoke all on function ve_ticket_order_paid(uuid, text, text) from public, anon, authenticated;
revoke all on function ve_ticket_order_refunded(uuid, int, uuid) from public, anon, authenticated;
revoke all on function trg_ve_guest_pass_ref() from public, anon, authenticated;

-- The Group Partner dashboard reads the real ticket numbers: each event's price (its cheapest ticket), going (members going plus
-- guest passes), guest passes per event and for the group (and how many joined after), ticket earnings after our 5%, our fee, and
-- tickets in Lately. Everything else as 20261029_group_live.sql left it.
create or replace function public.ve_group_dash(p_listing uuid)
 returns jsonb language plpgsql stable security definer set search_path to 'public'
as $function$
declare g ve_group_partners; l listings; rate jsonb; out jsonb; cfg jsonb; bal int; cost int; held int; nxt timestamptz;
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
  select coalesce(sum(commission_cents), 0), min(hold_until) into held, nxt from ve_affiliate_commissions where group_partner_id = g.id and status = 'pending';
  cost := round(1100 * (100 - (rate->>'rate_pct')::numeric) / 100);
  return out || jsonb_build_object('group', jsonb_build_object(
    'status', g.status, 'code', g.code, 'link', 'vegansexplore.com/r/' || coalesce(g.code, ''),
    'members_total', (out->>'group_members')::int,
    'new_this_month', (select count(*) from ve_group_members where listing_id = p_listing and left_at is null and joined_at > now() - interval '30 days'),
    'brought', (rate->>'brought')::int, 'rate_pct', (rate->>'rate_pct')::numeric, 'ladder', rate->'ladder',
    'guest_passes', jsonb_build_object('used', (select count(*) from ve_guest_passes where listing_id = p_listing),
      'joined_after', (select count(*) from ve_guest_passes gp where gp.listing_id = p_listing
        and exists (select 1 from members m where lower(m.email) = lower(gp.email) and m.membership_status = 'active'))),
    'members', coalesce((select jsonb_agg(x order by x->>'joined' desc) from (
      select jsonb_build_object('name', split_part(m.name, ' ', 1) || coalesce(' ' || left(nullif(split_part(m.name, ' ', 2), ''), 1) || '.', ''),
        'joined', gm.joined_at, 'via', case gm.via when 'gift' then 'Your gift' when 'event' then 'An event' else case when m.referred_by_group = g.id then 'Your link' else 'Joined on your page' end end,
        'events', (select count(*) from event_rsvps r join events e on e.id = r.event_id where r.member_id = m.id and e.host_listing_id = p_listing and r.status = 'going'),
        'chapter', coalesce(m.home_community, '')) x
      from ve_group_members gm join members m on m.id = gm.member_id where gm.listing_id = p_listing and gm.left_at is null limit 500) s), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'starts_at', e.starts_at, 'location_name', e.location_name, 'city', e.city,
        'price_cents', coalesce((select min(t.price_cents) from ve_ticket_types t where t.event_id = e.id and t.active), e.price_cents, 0),
        'capacity', e.capacity,
        'guest_passes', (select count(*) from ve_guest_passes gp where gp.event_id = e.id),
        'tickets_sold', (select coalesce(sum(t.sold), 0) from ve_ticket_types t where t.event_id = e.id),
        'going', (select count(*) from event_rsvps r where r.event_id = e.id and r.status = 'going') + (select count(*) from ve_guest_passes gp where gp.event_id = e.id)) order by e.starts_at)
      from events e where e.host_listing_id = p_listing and e.status = 'approved' and e.starts_at > now() - interval '365 days'), '[]'::jsonb),
    'earnings', jsonb_build_object(
      'passports_cents', (select coalesce(sum(commission_cents), 0) from ve_affiliate_commissions where group_partner_id = g.id and product not in ('gift', 'ticket') and status <> 'reversed' and created_at >= date_trunc('year', now())),
      'tickets_cents', (select coalesce(sum(commission_cents), 0) from ve_affiliate_commissions where group_partner_id = g.id and product = 'ticket' and status <> 'reversed' and created_at >= date_trunc('year', now())),
      'fee_cents', (select coalesce(sum(fee_cents), 0) from ve_ticket_orders where group_partner_id = g.id and status = 'paid' and paid_at >= date_trunc('year', now())),
      'gifts_cents', (select coalesce(-sum(commission_cents), 0) from ve_affiliate_commissions where group_partner_id = g.id and product = 'gift' and status <> 'reversed'),
      'ready_cents', (select coalesce(sum(commission_cents), 0) from ve_affiliate_commissions where group_partner_id = g.id and status = 'ready'),
      'holding_cents', (select coalesce(sum(commission_cents), 0) from ve_affiliate_commissions where group_partner_id = g.id and status = 'pending'),
      'w9', exists (select 1 from finance_payees fp join members lm on lower(lm.email) = lower(fp.email) where lm.id = g.lead_member_id and fp.w9_received_on is not null),
      'payouts', coalesce((select jsonb_agg(jsonb_build_object('at', settled_at, 'cents', c) order by settled_at desc) from (
          select date_trunc('day', settled_at) settled_at, sum(commission_cents) c from ve_affiliate_commissions where group_partner_id = g.id and status = 'paid' group by 1) p), '[]'::jsonb),
      'recent', coalesce((select jsonb_agg(jsonb_build_object('at', created_at, 'kind', case when product = 'gift' then 'gift' when product = 'ticket' then 'ticket' else 'passport' end,
          'what', case when product = 'gift' then 'A gift' when product = 'ticket' then coalesce(note, 'Tickets') when product = 'guide' then 'A Guide through your link' else 'A Passport through your link' end, 'cents', commission_cents) order by created_at desc)
        from (select * from ve_affiliate_commissions where group_partner_id = g.id and status <> 'reversed' order by created_at desc limit 20) c), '[]'::jsonb)),
    'gift', jsonb_build_object('cost_cents', cost, 'rate_pct', (rate->>'rate_pct')::numeric, 'balance_cents', bal,
      'credit_cents', coalesce((cfg->>'gift_credit_cents')::int, 0), 'points', coalesce((cfg->>'gift_points')::int, 1100),
      'days', coalesce((cfg->>'gift_days')::int, 30), 'holding_cents', held, 'next_clear_at', nxt,
      'can', g.status in ('onboarding', 'active') and bal + coalesce((cfg->>'gift_credit_cents')::int, 0) >= cost,
      'can_buy', g.status in ('onboarding', 'active')),
    'gifts', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'email', i.email, 'status', i.status, 'sent_via', i.sent_via,
        'created_at', i.created_at, 'expires_at', i.expires_at, 'joined_at', i.joined_at, 'code', i.code,
        'cost_cents', coalesce(i.paid_cents, (select -c.commission_cents from ve_affiliate_commissions c where c.ref = 'gift:' || i.id)),
        'by_card', i.paid_session is not null,
        'given_back', exists (select 1 from ve_affiliate_commissions c where (c.ref = 'gift:' || i.id and c.status = 'reversed') or c.ref = 'gift-back:' || i.id)) order by i.created_at desc)
      from universe_invites i where i.points_to = 'gift' and i.listing_id = p_listing), '[]'::jsonb)
  ));
end $function$;

update ve_site_settings set value = value || '{"ticket_fee_pct": 5, "ticket_max_per_order": 10}'::jsonb where key = 'group_partner_program';
