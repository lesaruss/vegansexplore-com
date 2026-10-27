-- Comped invitations carry the points Sean picks (Sean, 2026-10-27: "I do want the ability to invite people to give a
-- complimentary account with points of my choosing. I want to give a few people that paid for accounts recently on our other
-- platform"). Registration is otherwise the Passport only ($11, with 1,100 welcome points); an invitation on us is the one other
-- way in. universe_invites.points is what the invitation brings (0 for none), granted once when it is claimed, through
-- ve_points_grant (both balances and the ledger, reason comp_membership, ref invite:<id>). Safe to run twice.

alter table public.universe_invites add column if not exists points integer not null default 0;
alter table public.universe_invites drop constraint if exists universe_invites_points_check;
alter table public.universe_invites add constraint universe_invites_points_check check (points between 0 and 100000);

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
  -- A membership on us opens everything a paid member has (Sean, 2026-10-04), with the points Sean chose for this
  -- invitation (Sean, 2026-10-27), none when he chose none.
  if inv.comp and inv.brand = 'vegans-explore' then
    update members set membership_status = 'active', entry_paid_at = coalesce(entry_paid_at, now()), updated_at = now()
      where id = p_member;
    if inv.points > 0 then
      perform ve_points_grant(p_member, inv.points, 'comp_membership', 'invite:' || inv.id);
    end if;
  end if;
  return 'joined';
end $$;
revoke all on function public.universe_invite_claim(uuid, uuid) from public, anon, authenticated;
