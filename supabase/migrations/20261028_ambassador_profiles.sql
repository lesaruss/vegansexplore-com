-- Ambassador profiles (Sean, 2026-10-28: "for the ambassador, I should be able to check the type of person they are... she might not be
-- as moved about the animal side of things. I might want to lean more on the building community, helping local businesses,
-- supporting nonprofits that support the vegan mission, and... an extra income opportunity... create different profiles... and then we
-- have that version of the page that they see on their dashboard. And then the messaging that they receive"; then "go, build the
-- profiles"). One profile per Ambassador: animals (Animals first), community (Community builder), creator (Creator), fitness (Health
-- and fitness); none is the balanced version every Ambassador had before. It changes the reasons and their order, never the terms.
-- Safe to run twice.

alter table public.universe_invites add column if not exists profile text;
alter table public.members add column if not exists ambassador_profile text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'universe_invites_profile_check') then
    alter table public.universe_invites add constraint universe_invites_profile_check check (profile is null or profile in ('animals', 'community', 'creator', 'fitness'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'members_ambassador_profile_check') then
    alter table public.members add constraint members_ambassador_profile_check check (ambassador_profile is null or ambassador_profile in ('animals', 'community', 'creator', 'fitness'));
  end if;
end $$;

-- The claim carries the invitation's profile to the member.
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
  -- The Ambassador profile Sean picked (Sean, 2026-10-28) decides how their Guide speaks to them.
  if inv.points_to = 'ambassador' and inv.profile is not null then
    update members set ambassador_profile = inv.profile, updated_at = now() where id = p_member;
  end if;
  if inv.level is not null and inv.level > 1 then
    update members set level_override = greatest(coalesce(level_override, 1), inv.level), updated_at = now() where id = p_member;
  end if;
  return 'joined';
end $function$;

-- The Ambassadors page shows each one's profile.
create or replace function public.ve_ambassadors_overview()
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_agg(row_to_json(a) order by a.signups desc, a.name), '[]'::jsonb) from (
    select m.id, m.name, m.email, m.avatar_url, m.home_community, m.membership_status, m.created_at, m.last_activity_at,
      m.referral_code, m.level_override, m.affiliate_route, m.ambassador_profile,
      (ve_member_level(m.id) ->> 'level')::int as level,
      coalesce(mp.available_points, 0) as points, coalesce(mp.total_points, 0) as lifetime,
      (select count(*) from ve_referral_visits v where v.code = m.referral_code) as visits,
      (select count(distinct v.visitor) from ve_referral_visits v where v.code = m.referral_code) as visitors,
      (select count(distinct v.visitor) from ve_referral_visits v where v.code = m.referral_code and v.day > current_date - 30) as visitors_30d,
      (select count(*) from members r where r.referred_by = m.id) as signups,
      (select count(*) from members r where r.referred_by = m.id and r.membership_status = 'active') as members,
      (select coalesce(sum(delta), 0) from points_ledger l where l.member_id = m.id and l.reason ilike 'referral%') as referral_points,
      (select coalesce(sum(commission_cents), 0) from ve_affiliate_commissions c where c.affiliate_id = m.id and c.status <> 'reversed') as earned_cents,
      (select jsonb_build_object('id', i.id, 'status', i.status, 'joined_at', i.joined_at, 'level', i.level, 'points', i.points)
         from universe_invites i where i.claimed_member_id = m.id and i.points_to = 'ambassador' order by i.joined_at desc nulls last limit 1) as invite
    from members m left join member_points mp on mp.member_id = m.id
    where m.ve_role = 'ambassador' and m.merged_into_member_id is null
  ) a;
$$;
revoke all on function public.ve_ambassadors_overview() from public, anon, authenticated;
