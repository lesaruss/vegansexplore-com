-- Nonprofit Partners (LOCKED by Sean 2026-10-29, playbook ve-nonprofit-partners, canon canon-ve-nonprofit-partners; built the same
-- day, Sean: "go"). The organization is the partner, never a person: its Directory listing (Nonprofits, Rescues or Sanctuaries) gets
-- its own link (/r/<code>), a flat 20% of the $11 Passport and Guides bought through it (the opportunity's rate, not a member level),
-- points it holds for our services, a badge and its own Guide (/nonprofits/welcome). One person is the lead on the account: when the
-- organization says yes, the lead gets a complimentary Founding Membership and keeps their own standing (Level 1, their own link and
-- points). The organization's earnings are paid to the organization (after its W-9, at $25), as referral earnings, never a donation.
-- Invitation only, from Depot > People > Founding Members (universe_invites.points_to 'nonprofit', listing_id the organization).
-- Every step is safe to run twice.

-- 1. The partners. One row per organization; the lead can change and everything stays with the organization.
create table if not exists public.ve_nonprofit_partners (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings(id),
  lead_member_id uuid references public.members(id) on delete set null,
  code text not null unique check (code ~ '^[A-Z0-9-]{3,24}$'),
  rate_pct numeric(5,2) not null default 20 check (rate_pct between 0 and 30),
  products text[] not null default '{passport,guide}',
  points integer not null default 0 check (points >= 0),
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  invite_id uuid,
  note text,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ve_nonprofit_partners enable row level security;

-- The organization's points: given by the team (the invitation's amount, Give points in the Depot), spent by the lead on our services.
create table if not exists public.ve_nonprofit_partner_points (
  id bigserial primary key,
  partner_id uuid not null references public.ve_nonprofit_partners(id) on delete cascade,
  delta integer not null,
  reason text not null,
  ref text unique,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
alter table public.ve_nonprofit_partner_points enable row level security;
create index if not exists ve_nonprofit_partner_points_idx on public.ve_nonprofit_partner_points (partner_id, created_at desc);

create or replace function public.ve_partner_points_grant(p_partner uuid, p_amount integer, p_reason text, p_ref text, p_note text default null, p_by uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_id bigint; bal int;
begin
  if p_amount = 0 then return jsonb_build_object('skipped', 'zero'); end if;
  select points into bal from ve_nonprofit_partners where id = p_partner for update;
  if bal is null then return jsonb_build_object('error', 'not_found'); end if;
  if bal + p_amount < 0 then return jsonb_build_object('error', 'not_enough', 'balance', bal); end if;
  insert into ve_nonprofit_partner_points (partner_id, delta, reason, ref, note, created_by)
  values (p_partner, p_amount, p_reason, p_ref, left(p_note, 300), p_by)
  on conflict (ref) do nothing returning id into v_id;
  if v_id is null then return jsonb_build_object('skipped', 'already', 'balance', bal); end if;
  update ve_nonprofit_partners set points = points + p_amount, updated_at = now() where id = p_partner returning points into bal;
  return jsonb_build_object('ok', true, 'balance', bal);
end $$;
revoke all on function public.ve_partner_points_grant(uuid, integer, text, text, text, uuid) from public, anon, authenticated;

-- The organization's link code: its name in capitals, dashes between words (BE-AN-ANIMAL-HERO), never one a member already holds.
create or replace function public.ve_partner_code(p_name text)
returns text language plpgsql stable security definer set search_path to 'public' as $$
declare base text; c text; k int := 1;
begin
  base := left(trim(both '-' from regexp_replace(upper(coalesce(p_name, '')), '[^A-Z0-9]+', '-', 'g')), 21);
  base := trim(both '-' from base);
  if length(base) < 3 then base := 'ORG-' || upper(substr(md5(random()::text), 1, 4)); end if;
  c := base;
  while exists (select 1 from members where referral_code = c) or exists (select 1 from ve_nonprofit_partners where code = c) loop
    k := k + 1; c := left(base, 21) || '-' || k;
  end loop;
  return c;
end $$;

-- Who joined through an organization's link (ve-auth sets it at sign-up when the ?ref= code is an organization's).
alter table public.members add column if not exists referred_by_partner uuid references public.ve_nonprofit_partners(id) on delete set null;
create index if not exists members_referred_by_partner_idx on public.members (referred_by_partner) where referred_by_partner is not null;

-- 2. The invitation: points_to 'nonprofit', with the organization (listing_id); its points are the organization's.
alter table public.universe_invites add column if not exists listing_id uuid references public.listings(id) on delete set null;
alter table public.universe_invites drop constraint if exists universe_invites_points_to_check;
alter table public.universe_invites add constraint universe_invites_points_to_check
  check (points_to = any (array['none', 'dinner', 'community_manager', 'ambassador', 'founding', 'nonprofit']));

-- Start (or hand over) an organization's partnership: the lead, its code, its points, its badge (listings.tags ve-nonprofit-partner).
create or replace function public.ve_nonprofit_partner_start(p_listing uuid, p_lead uuid, p_invite uuid, p_points integer)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare l listings; v_id uuid;
begin
  select * into l from listings where id = p_listing;
  if l.id is null then return null; end if;
  insert into ve_nonprofit_partners (listing_id, lead_member_id, code, invite_id)
  values (l.id, p_lead, ve_partner_code(l.name), p_invite)
  on conflict (listing_id) do update set lead_member_id = excluded.lead_member_id, invite_id = coalesce(excluded.invite_id, ve_nonprofit_partners.invite_id),
    status = 'active', updated_at = now()
  returning id into v_id;
  if coalesce(p_points, 0) > 0 then
    perform ve_partner_points_grant(v_id, p_points, 'invite', 'invite:' || coalesce(p_invite::text, gen_random_uuid()::text));
  end if;
  update listings set tags = array_append(coalesce(tags, '{}'), 've-nonprofit-partner'), updated_at = now()
   where id = l.id and not ('ve-nonprofit-partner' = any(coalesce(tags, '{}')));
  return v_id;
end $$;
revoke all on function public.ve_nonprofit_partner_start(uuid, uuid, uuid, integer) from public, anon, authenticated;

-- The claim: a Nonprofit Partner invitation joins the organization and comps the lead.
create or replace function public.universe_invite_claim(p_invite uuid, p_member uuid)
 returns text
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare inv public.universe_invites; who_email text; who_status text;
begin
  select * into inv from universe_invites where id = p_invite for update;
  if not found then return 'not_found'; end if;
  if inv.status = 'joined' then return case when inv.claimed_member_id = p_member then 'already' else 'used' end; end if;
  if inv.status = 'canceled' then return 'canceled'; end if;
  if inv.status = 'declined' then return 'declined'; end if;
  if inv.status <> 'accepted' and (inv.status = 'expired' or (inv.expires_at is not null and inv.expires_at < now())) then
    update universe_invites set status = 'expired', updated_at = now() where id = inv.id;
    return 'expired';
  end if;
  -- The invitation is for one email (Sean, 2026-10-28: "it would only be assigned to their email address").
  select email, membership_status into who_email, who_status from members where id = p_member;
  if lower(btrim(coalesce(who_email, ''))) <> lower(btrim(inv.email)) then return 'wrong_email'; end if;
  -- A Nonprofit Partner invitation (Sean, 2026-10-29): the organization becomes the partner and the lead's membership is on us.
  -- The lead's own standing does not change: an account that was not a member gets the Founding Membership and its 1,100 points,
  -- a member keeps what they have. The invitation's points are the organization's.
  if inv.points_to = 'nonprofit' then
    if inv.listing_id is null then return 'not_found'; end if;
    update universe_invites set status = 'joined', joined_at = now(), accepted_at = coalesce(accepted_at, now()), claimed_member_id = p_member, updated_at = now() where id = inv.id;
    if coalesce(who_status, '') <> 'active' then
      update members set membership_status = 'active', entry_paid_at = coalesce(entry_paid_at, now()), founding_member = true, updated_at = now() where id = p_member;
      perform ve_points_grant(p_member, 1100, 'comp_membership', 'invite:' || inv.id);
    end if;
    perform ve_nonprofit_partner_start(inv.listing_id, p_member, inv.id, inv.points);
    return 'joined';
  end if;
  -- A Founding Member invitation at $11 (Sean, 2026-10-28): yes now, joined when they pay (trg_ve_founding_invite_paid).
  if inv.points_to = 'founding' and not inv.comp and coalesce(who_status, '') <> 'active' then
    update universe_invites set status = 'accepted', accepted_at = coalesce(accepted_at, now()), claimed_member_id = p_member, updated_at = now()
      where id = inv.id;
    return 'accepted';
  end if;
  update universe_invites set status = 'joined', joined_at = now(), accepted_at = coalesce(accepted_at, now()), claimed_member_id = p_member, updated_at = now() where id = inv.id;
  -- A membership on us is a Founding Membership (Sean, 2026-10-04), with the points Sean chose for this invitation
  -- (Sean, 2026-10-27), none when he chose none.
  if inv.comp and inv.brand = 'vegans-explore' then
    update members set membership_status = 'active', entry_paid_at = coalesce(entry_paid_at, now()), founding_member = true, updated_at = now()
      where id = p_member;
    if inv.points > 0 then
      perform ve_points_grant(p_member, inv.points, 'comp_membership', 'invite:' || inv.id);
    end if;
  end if;
  if inv.points_to = 'founding' and inv.brand = 'vegans-explore' then
    update members set founding_member = true, updated_at = now() where id = p_member;
  end if;
  -- An Ambassador invitation makes them an Ambassador, never over a staff role.
  if inv.points_to = 'ambassador' and inv.brand = 'vegans-explore' then
    update members set ve_role = 'ambassador', founding_member = true, updated_at = now()
      where id = p_member and coalesce(ve_role, 'member') = 'member';
  end if;
  -- The Ambassador profile Sean picked (Sean, 2026-10-28) decides how their Guide speaks to them.
  if inv.points_to = 'ambassador' and inv.profile is not null then
    update members set ambassador_profile = inv.profile, updated_at = now() where id = p_member;
  end if;
  -- The level Sean chose (Sean, 2026-10-28: "certain people I want to invite at level two").
  if inv.level is not null and inv.level > 1 then
    update members set level_override = greatest(coalesce(level_override, 1), inv.level), updated_at = now() where id = p_member;
  end if;
  return 'joined';
end $function$;

-- 3. The organization's earnings go through the same engine as a member's link: one row a sale, the same hold, release and payout.
alter table public.ve_affiliate_commissions alter column affiliate_id drop not null;
alter table public.ve_affiliate_commissions add column if not exists partner_id uuid references public.ve_nonprofit_partners(id);
alter table public.ve_affiliate_commissions drop constraint if exists ve_affiliate_commissions_route_check;
alter table public.ve_affiliate_commissions add constraint ve_affiliate_commissions_route_check check (route = any (array['self', 'nonprofit', 'partner']));
alter table public.ve_affiliate_commissions drop constraint if exists ve_affiliate_commissions_who_check;
alter table public.ve_affiliate_commissions add constraint ve_affiliate_commissions_who_check check (affiliate_id is not null or partner_id is not null);
create index if not exists ve_affiliate_commissions_partner_idx on public.ve_affiliate_commissions (partner_id, created_at desc) where partner_id is not null;

create or replace function public.ve_affiliate_earn(p_buyer uuid, p_product text, p_product_ref text, p_ref text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare b members; a members; p ve_nonprofit_partners; lv jsonb; cfg jsonb; rate numeric; sale int; cents int; v_id uuid;
begin
  select value into cfg from ve_site_settings where key = 'affiliate_program';
  select * into b from members m where m.id = p_buyer;
  if b.id is null or (b.referred_by is null and b.referred_by_partner is null) then return jsonb_build_object('skipped', 'not_referred'); end if;
  if b.created_at < now() - make_interval(days => coalesce((cfg->>'window_days')::int, 365)) then return jsonb_build_object('skipped', 'window'); end if;
  sale := coalesce((cfg->>'sale_cents')::int, 1100);
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
end $$;
revoke all on function public.ve_affiliate_earn(uuid, text, text, text) from public, anon, authenticated;

-- Visits to an organization's link count like a member's.
create or replace function public.ve_referral_visit(p_code text, p_visitor text, p_path text default null)
returns void language sql security definer set search_path to 'public' as $$
  insert into ve_referral_visits (code, visitor, path)
  select upper(btrim(p_code)), left(p_visitor, 64), left(p_path, 200)
  where p_code ~* '^[A-Z0-9-]{3,24}$' and p_visitor ~ '^[A-Za-z0-9-]{8,64}$'
    and (exists (select 1 from members where referral_code = upper(btrim(p_code)))
      or exists (select 1 from ve_nonprofit_partners where code = upper(btrim(p_code)) and status = 'active'))
  on conflict (code, visitor, day) do nothing;
$$;
revoke all on function public.ve_referral_visit(text, text, text) from public;
grant execute on function public.ve_referral_visit(text, text, text) to anon, authenticated;

-- 4. One partner's numbers, for its Guide (the lead) and the Depot. Who joined shows first name and last initial only.
create or replace function public.ve_nonprofit_partner_view(p_partner uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'id', p.id, 'code', p.code, 'rate_pct', p.rate_pct, 'products', to_jsonb(p.products), 'points', p.points, 'status', p.status,
    'started_at', p.started_at, 'note', p.note, 'lead_member_id', p.lead_member_id,
    'org', (select jsonb_build_object('id', l.id, 'name', l.name, 'slug', l.slug, 'category', l.category, 'logo_url', l.logo_url,
        'city', l.address_city, 'state', l.address_state, 'website', l.website) from listings l where l.id = p.listing_id),
    'lead', (select jsonb_build_object('id', m.id, 'name', m.name, 'email', m.email) from members m where m.id = p.lead_member_id),
    'visits', (select count(*) from ve_referral_visits v where v.code = p.code),
    'visitors', (select count(distinct v.visitor) from ve_referral_visits v where v.code = p.code),
    'visitors_30d', (select count(distinct v.visitor) from ve_referral_visits v where v.code = p.code and v.day > current_date - 30),
    'signups', (select count(*) from members r where r.referred_by_partner = p.id),
    'members', (select count(*) from members r where r.referred_by_partner = p.id and r.membership_status = 'active'),
    'joined', (select coalesce(jsonb_agg(jsonb_build_object('name', trim(split_part(coalesce(r.name, ''), ' ', 1) || ' ' || left(split_part(coalesce(r.name, ''), ' ', 2), 1)),
        'member', r.membership_status = 'active', 'at', r.created_at) order by r.created_at desc), '[]'::jsonb)
      from (select * from members where referred_by_partner = p.id order by created_at desc limit 200) r),
    'totals', (select jsonb_build_object(
        'pending', coalesce(sum(commission_cents) filter (where status = 'pending'), 0),
        'ready', coalesce(sum(commission_cents) filter (where status = 'ready'), 0),
        'paid', coalesce(sum(commission_cents) filter (where status = 'paid'), 0),
        'earned', coalesce(sum(commission_cents) filter (where status <> 'reversed'), 0))
      from ve_affiliate_commissions where partner_id = p.id),
    'commissions', (select coalesce(jsonb_agg(jsonb_build_object('product', c.product, 'sale_cents', c.sale_cents, 'rate_pct', c.rate_pct,
        'commission_cents', c.commission_cents, 'status', c.status, 'hold_until', c.hold_until, 'created_at', c.created_at,
        'buyer', trim(split_part(coalesce(bm.name, ''), ' ', 1) || ' ' || left(split_part(coalesce(bm.name, ''), ' ', 2), 1))) order by c.created_at desc), '[]'::jsonb)
      from (select * from ve_affiliate_commissions where partner_id = p.id order by created_at desc limit 200) c left join members bm on bm.id = c.buyer_id),
    'ledger', (select coalesce(jsonb_agg(jsonb_build_object('delta', x.delta, 'reason', x.reason, 'note', x.note, 'at', x.created_at) order by x.created_at desc), '[]'::jsonb)
      from (select * from ve_nonprofit_partner_points where partner_id = p.id order by created_at desc limit 50) x),
    'given', ve_listing_points(p.listing_id),
    'program', (select value from ve_site_settings where key = 'affiliate_program'))
  from ve_nonprofit_partners p where p.id = p_partner;
$$;
revoke all on function public.ve_nonprofit_partner_view(uuid) from public, anon, authenticated;

-- 5. What the Guides know, and a saved answer.
update public.knowledge_records
set body = jsonb_set(body, '{facts}', to_jsonb((body->>'facts') || ' Nonprofit Partners: a rescue, sanctuary or nonprofit in the Directory can be invited by the team to be a Nonprofit Partner (invitation only). The organization gets its own link: when someone joins through it, the organization earns 20% of the $11 Passport and of Guides bought through it, paid to the organization as referral earnings (never a donation from us, never tax-deductible), plus points to use on our services, a ready-made kit to share, a Nonprofit Partner badge and its own Guide. The person who leads the account gets a complimentary Founding Membership; their own level and link stay their own. Partners say they earn when they share their link.')),
    updated_at = now()
where slug = 've-guide-platform-facts' and body->>'facts' not like '%Nonprofit Partners: a rescue, sanctuary or nonprofit%';

insert into public.guide_kb_answers (topic, question, also_asked, answer, link_url, link_label, status, source, created_by)
select 'involved', 'Can my nonprofit partner with Vegans Explore?',
  array['What is a Nonprofit Partner?', 'Can a rescue or sanctuary earn from Vegans Explore?', 'How do organizations partner with you?', 'Do you work with nonprofits?'],
  'Yes, by invitation. A Nonprofit Partner is a rescue, sanctuary or nonprofit in our Directory that shares Vegans Explore with its people. It gets its own link, earns 20% of every $11 Passport (and Guides) bought through it, paid to the organization, plus points for our services, a ready-made kit to share and a Nonprofit Partner badge. If your organization is not in the Directory yet, add it, then write to us at contact@lesaruss.com.',
  '/directory?tab=community', 'The Community section', 'live', 'logan', 'logan'
where not exists (select 1 from public.guide_kb_answers where lower(question) = lower('Can my nonprofit partner with Vegans Explore?'));

insert into stream_events (owner, station, status, summary, keywords, context_link)
select 'logan', 'vegans-explore', 'completed',
       'VEGANS EXPLORE: Nonprofit Partners built (the organization''s link and 20% earnings through ve_affiliate_earn, its points, the invitation from Founding Members comping the lead, the badge, the Nonprofit Partner Guide, Depot > Nonprofit Partners).',
       array['vegans-explore', 'nonprofits', 'partners', 'affiliate', 'invites'], 've-nonprofit-partners'
 where not exists (select 1 from stream_events where summary like 'VEGANS EXPLORE: Nonprofit Partners built%');
