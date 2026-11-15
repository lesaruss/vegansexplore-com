-- My Account (Sean, 2026-11-15: "a my accounts page that should show their purchases... their email address, all that stuff that you
-- would normally see on an account"): one member's purchases, newest first, for ve-account `account`. Card payments on Vegans Explore
-- (ve_money_alerts, by member or email), Guides (money, points, comp or credit), event tickets, services and audits that were paid;
-- test orders left out. Service role only. Safe to run twice.
create or replace function public.ve_member_purchases(p_member uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  with me as (select id, lower(email) email from members where id = p_member),
  rows as (
    select a.created_at at, coalesce(nullif(a.product, ''), 'Payment') what, 'payment' kind, a.amount_cents cents, null::int points, null::text link
      from ve_money_alerts a, me
     where a.brand = 'Vegans Explore' and (a.member_id = me.id or lower(a.buyer_email) = me.email)
    union all
    select g.purchased_at, coalesce(v.title, 'A Guide'), 'guide', null, case when g.paid_with in ('comp', 'credit') then null else nullif(g.lesars_spent, 0) end,
           case when v.slug is not null then '/guides/' || v.slug end
      from ve_guide_purchases g left join ve_guides v on v.id = g.guide_id where g.member_id = p_member
    union all
    select coalesce(t.paid_at, t.created_at), 'Tickets: ' || coalesce(e.title, 'an event') || case when t.quantity > 1 then ' (' || t.quantity || ')' else '' end,
           'ticket', t.total_cents, null, null
      from ve_ticket_orders t left join events e on e.id = t.event_id
     where t.member_id = p_member and t.paid_at is not null and not coalesce(t.test, false)
    union all
    select coalesce(s.paid_at, s.created_at), initcap(replace(s.service, '_', ' ')), 'service', s.amount_cents, null, null
      from ve_service_orders s where s.member_id = p_member and s.paid_at is not null and not coalesce(s.test, false)
    union all
    select coalesce(o.paid_at, o.created_at), 'Restaurant audit (' || coalesce(o.tier, 'standard') || ')', 'audit', o.amount_cents, null, null
      from ve_audit_orders o where o.member_id = p_member and o.paid_at is not null and not coalesce(o.test, false)
  )
  select coalesce(jsonb_agg(jsonb_build_object('at', at, 'what', what, 'kind', kind, 'cents', cents, 'points', points, 'link', link) order by at desc), '[]'::jsonb) from rows;
$$;
revoke all on function public.ve_member_purchases(uuid) from public, anon, authenticated;
grant execute on function public.ve_member_purchases(uuid) to service_role;
