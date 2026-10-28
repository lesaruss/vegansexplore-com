-- Founding Member invitations (Sean, 2026-10-28: "reference the people that we have listed, for me to maybe eyeball a few people
-- that will be good candidates to be the first members of our community... watch if they click it, if they don't, if they decline,
-- if they don't respond... instead of it just being a bulk email blast"; then "go ahead with the $11 founding member invites").
-- Depot > People > Founding Members (/admin/depot/founding), through ve-invites (founding, founding_candidates, nudge).
--
-- An invitation with points_to 'founding' asks one hand-picked person to become a Founding Member at the normal $11. Accepting it
-- (universe_invite_claim) is "Said yes": the invitation turns 'accepted' and the page goes on to the $11 checkout. Paying (any
-- way the account turns active) turns it 'joined'. Sean can still make one person's membership on us (comp): that claims the way
-- every comped invitation does. Every step is safe to run twice.

alter table public.universe_invites add column if not exists accepted_at timestamptz;
alter table public.universe_invites add column if not exists nudged_at timestamptz;
alter table public.universe_invites add column if not exists nudge_count int not null default 0;
alter table public.universe_invites add column if not exists pool text;

alter table public.universe_invites drop constraint if exists universe_invites_points_to_check;
alter table public.universe_invites add constraint universe_invites_points_to_check
  check (points_to = any (array['none', 'dinner', 'community_manager', 'ambassador', 'founding']));
alter table public.universe_invites drop constraint if exists universe_invites_status_check;
alter table public.universe_invites add constraint universe_invites_status_check
  check (status = any (array['ready', 'sent', 'opened', 'accepted', 'joined', 'declined', 'expired', 'canceled']));

-- The claim: a Founding Member invitation that is not on us is a yes until they pay.
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

-- Paid: whenever an account turns active, its open Founding Member invitation (said yes, or never answered but paid anyway) is joined.
create or replace function public.ve_founding_invite_paid()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if NEW.membership_status = 'active' and (TG_OP = 'INSERT' or OLD.membership_status is distinct from 'active') and NEW.email is not null then
    update universe_invites
       set status = 'joined', joined_at = now(), accepted_at = coalesce(accepted_at, now()), claimed_member_id = NEW.id, updated_at = now()
     where brand = 'vegans-explore' and points_to = 'founding'
       and status in ('sent', 'opened', 'accepted')
       and (claimed_member_id = NEW.id or lower(email) = lower(NEW.email));
    if found then
      update members set founding_member = true where id = NEW.id and coalesce(founding_member, false) = false;
    end if;
  end if;
  return NEW;
end $function$;

drop trigger if exists trg_ve_founding_invite_paid on public.members;
create trigger trg_ve_founding_invite_paid after insert or update of membership_status on public.members
  for each row execute function public.ve_founding_invite_paid();

-- The people Sean can pick from: HQ > People with an email and accounts that never paid, minus members, anyone with an
-- invitation already (any kind, except canceled or expired), the do-not-contact list, the unsubscribed, quarantined, archived
-- and merged. Each carries where we know them from (pools), best first: suggested for Vegans Explore, a guest on our shows
-- (their name is a People listing), signed up and never paid, then the rest by how much Sean has written with them.
create or replace function public.ve_founding_candidates(p_q text default null, p_pool text default null, p_limit int default 50, p_offset int default 0)
 returns jsonb
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
with guests as (
  select lower(btrim(name)) n, slug from listings
   where status = 'approved' and category in ('Activists', 'Content Creators', 'Athletes', 'Physicians', 'Health Experts', 'Chefs', 'Founders')
),
p as (
  select pe.id person_id, null::uuid member_id,
         btrim(coalesce(pe.first_name, '') || ' ' || coalesce(pe.last_name, '')) name, lower(btrim(pe.email)) email,
         pe.organization, pe.title, coalesce(pe.city, pe.region) city, pe.relationship_summary summary, pe.last_interaction_at,
         coalesce(pe.email_message_count, 0) messages, pe.source, pe.recommended_brand, pe.is_person
    from people pe
   where pe.email is not null and position('@' in pe.email) > 1
     and not coalesce(pe.quarantined, false) and not coalesce(pe.archived, false) and not coalesce(pe.email_unsubscribed, false)
     and not coalesce(pe.is_self, false) and pe.merged_into is null
  union all
  select null, m.id, coalesce(nullif(btrim(m.name), ''), split_part(m.email, '@', 1)), lower(btrim(m.email)), null, null,
         m.home_community, null, m.created_at, 0, 'unpaid', null, true
    from members m
   where m.membership_status = 'pending_payment' and m.member_class is distinct from 'quarantined'
     and m.tenant_id = '00000000-0000-4000-a000-000000000002'::uuid and m.email is not null
),
d as (
  select distinct on (p.email) p.*,
         array_remove(array[
           case when p.recommended_brand = 'vegans-explore' then 'suggested' end,
           case when g.slug is not null then 'guest' end,
           case when p.source = 'unpaid' or um.id is not null then 'unpaid' end,
           case when p.source = 'soflo-vegans' then 'soflo' end,
           case when p.source = 'email-history' then 'email' end,
           case when p.source = 'mailing-list' then 'mailing' end,
           case when p.source in ('instagram', 'cold-list', 'business_card', 'arm-member', 'vegans-explore', 'circle_migration', 'contacts-import') then 'other' end
         ], null) pools,
         g.slug guest_slug
    from p
    left join guests g on g.n = lower(p.name)
    left join members um on lower(um.email) = p.email and um.membership_status = 'pending_payment'
   where p.name <> ''
     and not exists (select 1 from members m where lower(m.email) = p.email and m.membership_status <> 'pending_payment')
     and not exists (select 1 from universe_invites i where lower(i.email) = p.email and i.status not in ('canceled', 'expired'))
     and not exists (select 1 from people_suppression s where s.email = p.email and s.active)
   order by p.email, (p.person_id is null), p.messages desc
),
f as (
  select *, (case when 'suggested' = any(pools) then 0 when 'guest' = any(pools) then 1 when 'unpaid' = any(pools) then 2 else 3 end) rank_group
    from d
   where (p_pool is null or p_pool = '' or p_pool = any(pools))
     and (p_q is null or btrim(p_q) = '' or (name || ' ' || email || ' ' || coalesce(organization, '') || ' ' || coalesce(title, '') || ' ' || coalesce(city, '') || ' ' || coalesce(summary, '')) ilike '%' || btrim(p_q) || '%')
)
select jsonb_build_object(
  'total', (select count(*) from f),
  'pools', (select coalesce(jsonb_object_agg(k, c), '{}'::jsonb) from (select unnest(pools) k, count(*) c from d group by 1) x),
  'rows', coalesce((select jsonb_agg(to_jsonb(r) - 'rank_group' - 'recommended_brand' - 'source') from (
     select * from f order by rank_group, messages desc, last_interaction_at desc nulls last, name
      limit least(greatest(coalesce(p_limit, 50), 1), 200) offset greatest(coalesce(p_offset, 0), 0)) r), '[]'::jsonb)
);
$function$;

revoke all on function public.ve_founding_candidates(text, text, int, int) from public, anon, authenticated;
revoke all on function public.ve_founding_invite_paid() from public, anon, authenticated;

insert into stream_events (owner, station, status, summary, keywords)
select 'logan', 'system', 'completed',
       'Vegans Explore: Founding Member invitations ($11), Depot > People > Founding Members, candidates from HQ People and unpaid accounts, accepted and joined tracking',
       array['vegans-explore', 'founding-members', 'invites', 'depot']
 where not exists (select 1 from stream_events where summary like 'Vegans Explore: Founding Member invitations ($11)%');
