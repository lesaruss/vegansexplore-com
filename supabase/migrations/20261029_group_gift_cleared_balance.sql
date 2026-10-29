-- Gifts from cleared earnings only, or by card (Sean, 2026-10-29): "It would be coming from the balance. So even if it's not paid out,
-- they would have a balance, running balance based off of what's happening, and that balance will only count after the 30-day period...
-- If they're in a negative, they should get a prompt to purchase the membership."
-- 1. ve_group_balance counts only commissions past their 30-day hold (status 'ready'), not paid out, less gifts. Money on hold never
--    counts, so a gift can never take the balance below zero.
-- 2. Short of it, the organizer buys the gift by card at the same price (our share of the $11 at their rate): ve-group gift_checkout,
--    confirmed once by universe_invites.paid_session. A card gift has no commission row.
-- 3. A card gift that expires, is canceled or is declined goes back to the group's balance (a 'ready' row, ref 'gift-back:<invite>'),
--    so it can fund the next gift, never a card refund (Sean, 2026-10-29: "keep it going to the balance, no refund").

create or replace function public.ve_group_balance(p_group uuid)
returns int language sql stable security definer set search_path to 'public' as $function$
  select coalesce(sum(commission_cents), 0)::int from ve_affiliate_commissions where group_partner_id = p_group and status = 'ready';
$function$;

alter table universe_invites add column if not exists paid_session text;
alter table universe_invites add column if not exists paid_cents int;
create unique index if not exists universe_invites_paid_session_key on universe_invites (paid_session) where paid_session is not null;

create or replace function public.ve_group_gift_status()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare g ve_group_partners;
begin
  if new.points_to <> 'gift' or new.status is not distinct from old.status then return new; end if;
  if new.status in ('expired', 'canceled', 'declined') then
    update ve_affiliate_commissions set status = 'reversed', settled_at = now(),
      note = coalesce(note || ' ', '') || 'Given back: the gift was ' || new.status || '.'
      where ref = 'gift:' || new.id and status in ('pending', 'ready');
    if new.paid_session is not null and coalesce(new.paid_cents, 0) > 0 then
      select * into g from ve_group_partners where listing_id = new.listing_id;
      if g.id is not null then
        insert into ve_affiliate_commissions (group_partner_id, product, product_ref, ref, sale_cents, level, rate_pct, commission_cents, route,
          route_listing_id, status, hold_until, note)
        values (g.id, 'gift', new.id::text, 'gift-back:' || new.id, 1100, 0, 0, new.paid_cents, 'group', new.listing_id, 'ready', now(),
          'Back to your balance: a gift you paid for by card was ' || new.status || ' (' || new.name || ', ' || new.email || ').')
        on conflict (ref) do nothing;
      end if;
    end if;
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

create or replace function public.ve_group_dash(p_listing uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
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
