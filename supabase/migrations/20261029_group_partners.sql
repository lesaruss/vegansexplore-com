-- Group Partners: the invitation and its console (LOCKED by Sean 2026-10-29, playbook ve-group-partners, canon canon-ve-group-partners).
-- Sean, 2026-10-29: "in the depot, just like we had with the ambassador and the other thing, there would be a ... groups one, where I
-- could personalize the message, select people, put in their email addresses... do a crawl for all these community groups... pull their
-- information and send them messages one by one." The program itself (the commission ladder, tickets, the guest pass) is not built:
-- saying yes to a Group Partner invitation means the group is onboarding with us. Every step is safe to run twice.

-- 1. The partners. One row per group (its Directory listing, Community > Groups); the organizer is the lead.
create table if not exists public.ve_group_partners (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings(id),
  lead_member_id uuid references public.members(id) on delete set null,
  status text not null default 'invited' check (status in ('invited', 'onboarding', 'active', 'paused', 'ended')),
  invite_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ve_group_partners enable row level security;

-- A group's contact lives on its listing (listings.details.group: contact_email, contact_name, contact_source); no new columns.

-- 2. The invitation: points_to 'group', with the group (listing_id).
alter table public.universe_invites drop constraint if exists universe_invites_points_to_check;
alter table public.universe_invites add constraint universe_invites_points_to_check
  check (points_to = any (array['none', 'dinner', 'community_manager', 'ambassador', 'founding', 'nonprofit', 'group']));

-- 3. The claim: a Group Partner invitation says yes for the group and comps the organizer (the nonprofit lead's terms).
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
  -- A Group Partner invitation (Sean, 2026-10-29): the group says yes and starts onboarding; the organizer leads it, their
  -- Founding Membership on us (1,100 points when they were not a member), their own standing unchanged.
  if inv.points_to = 'group' then
    if inv.listing_id is null then return 'not_found'; end if;
    update universe_invites set status = 'joined', joined_at = now(), accepted_at = coalesce(accepted_at, now()), claimed_member_id = p_member, updated_at = now() where id = inv.id;
    if coalesce(who_status, '') <> 'active' then
      update members set membership_status = 'active', entry_paid_at = coalesce(entry_paid_at, now()), founding_member = true, updated_at = now() where id = p_member;
      perform ve_points_grant(p_member, 1100, 'comp_membership', 'invite:' || inv.id);
    end if;
    insert into ve_group_partners (listing_id, lead_member_id, status, invite_id)
    values (inv.listing_id, p_member, 'onboarding', inv.id)
    on conflict (listing_id) do update set lead_member_id = excluded.lead_member_id, invite_id = excluded.invite_id,
      status = case when ve_group_partners.status in ('active', 'paused') then ve_group_partners.status else 'onboarding' end, updated_at = now();
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

-- 4. An invitation that goes out marks its group invited (the console's partner status).
create or replace function public.ve_group_invite_sent() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.points_to = 'group' and new.listing_id is not null and new.status in ('sent', 'opened') then
    insert into ve_group_partners (listing_id, status, invite_id) values (new.listing_id, 'invited', new.id)
    on conflict (listing_id) do update set invite_id = excluded.invite_id, updated_at = now()
      where ve_group_partners.status = 'invited';
  end if;
  return new;
end $$;
drop trigger if exists trg_ve_group_invite_sent on public.universe_invites;
create trigger trg_ve_group_invite_sent after insert or update of status on public.universe_invites
  for each row when (new.points_to = 'group') execute function public.ve_group_invite_sent();

insert into stream_events (owner, station, status, summary, keywords, context_link)
select 'logan', 'vegans-explore', 'completed',
       'VEGANS EXPLORE: Group Partners invitation built (points_to group, ve_group_partners, the claim comps the organizer and starts onboarding, Depot > People > Group Partners, ve-groups find and discover).',
       array['vegans-explore', 'groups', 'partners', 'invites'], 've-group-partners'
 where not exists (select 1 from stream_events where summary like 'VEGANS EXPLORE: Group Partners invitation built%');
