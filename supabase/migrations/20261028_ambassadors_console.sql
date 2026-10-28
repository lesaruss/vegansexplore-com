-- Depot > People > Ambassadors (Sean, 2026-10-28: "the ambassador program really is invite only... see my current ambassadors...
-- their status, how many people they've enrolled... how many people have visited their link, how many people have signed up
-- underneath them, what level they're on, how many points they have... adjust that information... invite at level two... give them
-- X amount of points... send the invitation right from there... see the draft... personalize it... voice dictate it... see when
-- they've read it... accepted it... declined it... copying the link, but it would only be assigned to their email address").

-- 1. A level the team sets (members.level_override). The level is the higher of what lifetime points earn and this, so an
--    Ambassador invited at Level 2 stays at least Level 2 and still climbs with points.
alter table public.members add column if not exists level_override smallint;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'members_level_override_check') then
    alter table public.members add constraint members_level_override_check check (level_override is null or level_override between 1 and 3);
  end if;
end $$;

create or replace function public.ve_member_level(p_member uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  with p as (select coalesce((select total_points from member_points where member_id = p_member order by updated_at desc nulls last limit 1), 0) as lifetime,
                    coalesce((select level_override from members where id = p_member), 1) as floor_level),
  e as (select lifetime, floor_level, case when lifetime >= 10000 then 3 when lifetime >= 2500 then 2 else 1 end as earned from p)
  select jsonb_build_object(
    'lifetime', lifetime,
    'level', greatest(earned, floor_level),
    'earned_level', earned,
    'set_by_team', floor_level > earned,
    'next_at', case when greatest(earned, floor_level) >= 3 then null when greatest(earned, floor_level) = 2 then 10000 else 2500 end)
  from e;
$$;

-- 2. Invitations: the level it starts them at, the email's provider id (its opens come in through email_events), and Declined.
alter table public.universe_invites add column if not exists level smallint;
alter table public.universe_invites add column if not exists resend_email_id text;
alter table public.universe_invites add column if not exists email_opened_at timestamptz;
alter table public.universe_invites add column if not exists declined_at timestamptz;
alter table public.universe_invites add column if not exists decline_note text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'universe_invites_level_check') then
    alter table public.universe_invites add constraint universe_invites_level_check check (level is null or level between 1 and 3);
  end if;
end $$;
alter table public.universe_invites drop constraint if exists universe_invites_status_check;
alter table public.universe_invites add constraint universe_invites_status_check
  check (status = any (array['ready','sent','opened','joined','declined','expired','canceled']));
create index if not exists universe_invites_resend_idx on public.universe_invites (resend_email_id) where resend_email_id is not null;

-- 3. The claim: only the invited email can take it (a copied link works for them alone), and an invitation with a level sets it.
create or replace function public.universe_invite_claim(p_invite uuid, p_member uuid)
returns text language plpgsql security definer set search_path to 'public' as $function$
declare inv public.universe_invites; who_email text;
begin
  select * into inv from universe_invites where id = p_invite for update;
  if not found then return 'not_found'; end if;
  if inv.status = 'joined' then return case when inv.claimed_member_id = p_member then 'already' else 'used' end; end if;
  if inv.status = 'canceled' then return 'canceled'; end if;
  if inv.status = 'declined' then return 'declined'; end if;
  if inv.status = 'expired' or (inv.expires_at is not null and inv.expires_at < now()) then
    update universe_invites set status = 'expired', updated_at = now() where id = inv.id;
    return 'expired';
  end if;
  -- The invitation is for one email (Sean, 2026-10-28: "it would only be assigned to their email address").
  select email into who_email from members where id = p_member;
  if lower(btrim(coalesce(who_email, ''))) <> lower(btrim(inv.email)) then return 'wrong_email'; end if;
  update universe_invites set status = 'joined', joined_at = now(), claimed_member_id = p_member, updated_at = now() where id = inv.id;
  -- A membership on us is a Founding Membership (Sean, 2026-10-04), with the points Sean chose for this invitation
  -- (Sean, 2026-10-27), none when he chose none.
  if inv.comp and inv.brand = 'vegans-explore' then
    update members set membership_status = 'active', entry_paid_at = coalesce(entry_paid_at, now()), founding_member = true, updated_at = now()
      where id = p_member;
    if inv.points > 0 then
      perform ve_points_grant(p_member, inv.points, 'comp_membership', 'invite:' || inv.id);
    end if;
  end if;
  -- An Ambassador invitation makes them an Ambassador, never over a staff role.
  if inv.points_to = 'ambassador' and inv.brand = 'vegans-explore' then
    update members set ve_role = 'ambassador', founding_member = true, updated_at = now()
      where id = p_member and coalesce(ve_role, 'member') = 'member';
  end if;
  -- The level Sean chose (Sean, 2026-10-28: "certain people I want to invite at level two").
  if inv.level is not null and inv.level > 1 then
    update members set level_override = greatest(coalesce(level_override, 1), inv.level), updated_at = now() where id = p_member;
  end if;
  return 'joined';
end $function$;

-- 4. Visits to an Ambassador's link (/passport?ref=<code>): one per visitor (a random id kept in their browser) a day.
create table if not exists public.ve_referral_visits (
  id bigserial primary key,
  code text not null,
  visitor text not null,
  day date not null default ((now() at time zone 'America/New_York')::date),
  path text,
  created_at timestamptz not null default now(),
  unique (code, visitor, day)
);
alter table public.ve_referral_visits enable row level security;
create index if not exists ve_referral_visits_code_idx on public.ve_referral_visits (code, day);

create or replace function public.ve_referral_visit(p_code text, p_visitor text, p_path text default null)
returns void language sql security definer set search_path to 'public' as $$
  insert into ve_referral_visits (code, visitor, path)
  select upper(btrim(p_code)), left(p_visitor, 64), left(p_path, 200)
  where p_code ~* '^[A-Z0-9-]{3,24}$' and p_visitor ~ '^[A-Za-z0-9-]{8,64}$'
    and exists (select 1 from members where referral_code = upper(btrim(p_code)))
  on conflict (code, visitor, day) do nothing;
$$;
revoke all on function public.ve_referral_visit(text, text, text) from public;
grant execute on function public.ve_referral_visit(text, text, text) to anon, authenticated;

-- 5. The Ambassadors page: every Ambassador with their numbers (read by ve-invites for a super admin only).
create or replace function public.ve_ambassadors_overview()
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_agg(row_to_json(a) order by a.signups desc, a.name), '[]'::jsonb) from (
    select m.id, m.name, m.email, m.avatar_url, m.home_community, m.membership_status, m.created_at, m.last_activity_at,
      m.referral_code, m.level_override,
      (ve_member_level(m.id) ->> 'level')::int as level,
      coalesce(mp.available_points, 0) as points, coalesce(mp.total_points, 0) as lifetime,
      (select count(*) from ve_referral_visits v where v.code = m.referral_code) as visits,
      (select count(distinct v.visitor) from ve_referral_visits v where v.code = m.referral_code) as visitors,
      (select count(distinct v.visitor) from ve_referral_visits v where v.code = m.referral_code and v.day > current_date - 30) as visitors_30d,
      (select count(*) from members r where r.referred_by = m.id) as signups,
      (select count(*) from members r where r.referred_by = m.id and r.membership_status = 'active') as members,
      (select coalesce(sum(delta), 0) from points_ledger l where l.member_id = m.id and l.reason ilike 'referral%') as referral_points,
      (select jsonb_build_object('id', i.id, 'status', i.status, 'joined_at', i.joined_at, 'level', i.level, 'points', i.points)
         from universe_invites i where i.claimed_member_id = m.id and i.points_to = 'ambassador' order by i.joined_at desc nulls last limit 1) as invite
    from members m left join member_points mp on mp.member_id = m.id
    where m.ve_role = 'ambassador' and m.merged_into_member_id is null
  ) a;
$$;
revoke all on function public.ve_ambassadors_overview() from public, anon, authenticated;

-- 6. A personal note can be longer than the old 600 characters (Sean dictates them): up to 2,000.
alter table public.universe_invites drop constraint if exists universe_invites_reason_check;
alter table public.universe_invites add constraint universe_invites_reason_check check (reason is null or char_length(reason) <= 2000);
