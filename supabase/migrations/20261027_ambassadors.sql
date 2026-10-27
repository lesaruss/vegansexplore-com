-- Ambassadors (Sean, 2026-10-27, on Joshua Mattey: "give him 1,100 and founding member status. He has done a lot for the
-- community and I want him to be an early ambassador and share it with other people. Let's actually give him an Ambassador
-- account. Once I use the invite option, it should create an onboarding for Ambassadors. The points amount will be set by me
-- during the invite process. I want to just update Joshua's account since I can let him know during the call.")
--
-- 1. members.ve_role takes 'ambassador'. An Ambassador is an active Founding Member whose job is to bring people in; their
--    share link is /passport?ref=<referral_code>, and their onboarding is /ambassadors/welcome.
-- 2. An invitation can point to the Ambassador role (universe_invites.points_to 'ambassador'). Claiming it makes the member an
--    Ambassador (unless they already hold a staff role) with the points Sean set. Every comped claim is a Founding Member.
-- 3. A referral pays the referrer (111 points, points_earn_rules referral_signup) when the friend becomes a member, not when
--    they make an account: registration is the Passport (Sean, same day), so an unpaid sign-up earns nothing. The trigger
--    covers every way in (the Passport, a Guide, a ticket, an invitation); ve-auth no longer pays it at sign-up.
-- 4. Joshua Mattey's account: active, Founding Member, Ambassador, 1,100 points (once, ref sean-2026-10-27).
-- Safe to run twice.

alter table public.members drop constraint if exists ve_role_check;
alter table public.members add constraint ve_role_check
  check (ve_role = any (array['member', 'community_manager', 'partner', 'admin', 'ambassador']));

do $$
declare c record;
begin
  for c in select conname from pg_constraint where conrelid = 'public.universe_invites'::regclass and contype = 'c'
             and pg_get_constraintdef(oid) ilike '%points_to%' loop
    execute format('alter table public.universe_invites drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.universe_invites add constraint universe_invites_points_to_check
  check (points_to in ('none', 'dinner', 'community_manager', 'ambassador'));

create or replace function public.universe_invite_claim(p_invite uuid, p_member uuid)
returns text language plpgsql security definer set search_path = public as $$
declare inv public.universe_invites;
begin
  select * into inv from universe_invites where id = p_invite for update;
  if not found then return 'not_found'; end if;
  if inv.status = 'joined' then return case when inv.claimed_member_id = p_member then 'already' else 'used' end; end if;
  if inv.status = 'canceled' then return 'canceled'; end if;
  if inv.status = 'expired' or (inv.expires_at is not null and inv.expires_at < now()) then
    update universe_invites set status = 'expired', updated_at = now() where id = inv.id;
    return 'expired';
  end if;
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
  return 'joined';
end $$;
revoke all on function public.universe_invite_claim(uuid, uuid) from public, anon, authenticated;

-- The referral pays when the friend becomes a member.
create or replace function public.ve_referral_on_admit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.referred_by is not null and NEW.membership_status = 'active'
     and (TG_OP = 'INSERT' or OLD.membership_status is distinct from 'active') then
    begin
      perform award_points_bounty(NEW.referred_by, 'vegans-explore', 'referral_signup', 'referral_signup:' || NEW.id, 'referral');
    exception when others then
      raise warning 'referral not paid for member %: %', NEW.id, sqlerrm;
    end;
  end if;
  return NEW;
end $$;
drop trigger if exists trg_zz_referral_on_admit on public.members;
create trigger trg_zz_referral_on_admit after insert or update of membership_status on public.members
  for each row execute function public.ve_referral_on_admit();

-- Joshua Mattey (joshmatteymgl@gmail.com), signed up 2026-10-27 with Google.
update public.members
   set membership_status = 'active', entry_paid_at = coalesce(entry_paid_at, now()), founding_member = true,
       ve_role = 'ambassador', updated_at = now()
 where id = '6531a0e1-bf0f-4d6a-99f2-66cdca87d7fd';
select public.ve_points_grant('6531a0e1-bf0f-4d6a-99f2-66cdca87d7fd', 1100, 'comp_membership', 'sean-2026-10-27');
