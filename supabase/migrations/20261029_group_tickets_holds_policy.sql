-- Group Partners tickets, before outreach (Sean, 2026-10-29: no invitations until he has reviewed everything and picks who gets
-- one; playbook ve-group-partners). Two things:
--   1. Seats are held at checkout. A checkout that is open counts against a ticket type's limit for 35 minutes (Stripe expires
--      the checkout at 30), so two buyers can never both pay for the last ticket. ve_ticket_order_open locks the type's row,
--      counts what is left and writes the order in one step; ve-group calls it instead of inserting the order itself. A stale
--      pending order is never canceled here: a payment that lands late must still confirm.
--   2. What the Guides know about tickets and Group Partners, and three saved answers, matching /policies.

-- 1. Seats.
create or replace function public.ve_ticket_left(p_event uuid)
returns table (type_id uuid, left_count int)
language sql stable security definer set search_path = public as $$
  select t.id,
    case when t.quantity is null then null
      else greatest(0, t.quantity - t.sold - coalesce((select sum(o.quantity) from ve_ticket_orders o
        where o.ticket_type_id = t.id and o.status = 'pending' and o.created_at > now() - interval '35 minutes'), 0))::int end
  from ve_ticket_types t where t.event_id = p_event;
$$;

create or replace function public.ve_ticket_order_open(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare t ve_ticket_types; q int := (p->>'quantity')::int; held int; avail int; oid uuid;
begin
  select * into t from ve_ticket_types where id = (p->>'ticket_type_id')::uuid for update;
  if t.id is null or not t.active then return jsonb_build_object('error', 'not_found'); end if;
  if t.quantity is not null then
    select coalesce(sum(quantity), 0) into held from ve_ticket_orders
      where ticket_type_id = t.id and status = 'pending' and created_at > now() - interval '35 minutes';
    avail := greatest(0, t.quantity - t.sold - held);
    if q > avail then return jsonb_build_object('error', 'sold_out', 'left', avail); end if;
  end if;
  insert into ve_ticket_orders (event_id, ticket_type_id, member_id, group_partner_id, quantity, unit_cents, fee_cents, processing_cents,
    total_cents, group_cents, pass_fee, test)
  values (t.event_id, t.id, (p->>'member_id')::uuid, (p->>'group_partner_id')::uuid, q, t.price_cents, (p->>'fee_cents')::int,
    (p->>'processing_cents')::int, (p->>'total_cents')::int, (p->>'group_cents')::int, t.pass_fee, coalesce((p->>'test')::boolean, false))
  returning id into oid;
  return jsonb_build_object('ok', true, 'id', oid);
end $$;

revoke all on function public.ve_ticket_left(uuid) from public, anon, authenticated;
revoke all on function public.ve_ticket_order_open(jsonb) from public, anon, authenticated;

-- 2. What the Guides know, and saved answers.
update public.knowledge_records
set body = jsonb_set(body, '{facts}', to_jsonb((body->>'facts') || ' Group Partners: a community group in the Directory (a social club, meetup, potluck or dinner club) can be invited by the team to host its community and events on Vegans Explore (invitation only). The group is the partner: its link earns a share of the $11 Passport and of Guides bought through it, 20% at first, rising with the members it has brought in (25% at 25, 30% at 75, 35% at 150, 40% at 300, 45% at 600, 50% at 1,000), paid as referral earnings; its organizer gets a complimentary Founding Membership. Event tickets: some Group Partner events sell tickets on Vegans Explore, for Passport holders. The buyer pays the ticket price and card processing (about 2.9% plus 30 cents); our fee is 5% of the ticket price, from the group''s share unless the group passes it on. Door codes come by email. Refunds follow the group''s own policy shown on the event; a refund gives back the ticket price, our 5% included, never card processing. Guest pass: someone without a Passport can come to one free Group Partner event as our guest, once ever; from the second event they join with the $11 Passport, and paid events need the Passport from the start.')),
    updated_at = now()
where slug = 've-guide-platform-facts' and body->>'facts' not like '%Group Partners: a community group in the Directory%';

insert into public.guide_kb_answers (topic, question, also_asked, answer, link_url, link_label, status, source, created_by)
select 'events', 'How do event tickets work on Vegans Explore?',
  array['Can I buy tickets on Vegans Explore?', 'What fees are on a ticket?', 'Can I get a refund on my ticket?', 'Where is my ticket?'],
  'Some events hosted by our Group Partners sell tickets right on the event''s page, for Passport holders. You pay the ticket price plus card processing (about 2.9% plus 30 cents); the group may also pass on our 5% fee, and checkout shows it if so. Your door codes come by email and are on the event''s page. Refunds follow the group''s own refund policy on the event: a refund gives back the ticket price, but not card processing.',
  '/policies#membership', 'Event tickets in our policies', 'live', 'logan', 'logan'
where not exists (select 1 from public.guide_kb_answers where lower(question) = lower('How do event tickets work on Vegans Explore?'));

insert into public.guide_kb_answers (topic, question, also_asked, answer, link_url, link_label, status, source, created_by)
select 'events', 'Can I go to a group''s event without a Passport?',
  array['What is a guest pass?', 'Can I bring a friend who is not a member?', 'Do I need a Passport to go to an event?'],
  'Once. Anyone without a Passport can come to one free event hosted by a Group Partner as our guest: take the guest pass on the event''s page with your name and email, and your code comes by email. From your second event, you join with the $11 Passport. Events with paid tickets need the Passport from the start.',
  '/passport', 'The $11 Passport', 'live', 'logan', 'logan'
where not exists (select 1 from public.guide_kb_answers where lower(question) = lower('Can I go to a group''s event without a Passport?'));

insert into public.guide_kb_answers (topic, question, also_asked, answer, link_url, link_label, status, source, created_by)
select 'involved', 'Can my group partner with Vegans Explore?',
  array['What is a Group Partner?', 'Can my meetup host events on Vegans Explore?', 'Can my social club earn from Vegans Explore?'],
  'By invitation. A Group Partner is a community group in our Directory (a social club, meetup, potluck or dinner club) that hosts its community and events here. It gets its own link and earns a share of every $11 Passport bought through it, from 20% up to 50% as it brings in members, plus tickets for its events and a guest pass that lets newcomers try one free event. If your group is not in the Directory yet, add it, then write to us at contact@lesaruss.com.',
  '/groups/welcome', 'The Group Partner Guide', 'live', 'logan', 'logan'
where not exists (select 1 from public.guide_kb_answers where lower(question) = lower('Can my group partner with Vegans Explore?'));
