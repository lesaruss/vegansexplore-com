-- A free membership comes with no points (Sean, 2026-10-04: "I don't think they should get points.
-- ... that could be the way that they are encouraged to contribute."). It opens everything a paid
-- member has; points come from contributing. Replaces universe_invite_claim() from
-- 20261004_universe_invites.sql, which credited 1,100 points (none were ever credited live).
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
  -- A free membership opens everything a paid member has, with no points (Sean, 2026-10-04):
  -- points come from contributing.
  if inv.comp and inv.brand = 'vegans-explore' then
    update members set membership_status = 'active', entry_paid_at = coalesce(entry_paid_at, now()), updated_at = now()
      where id = p_member;
  end if;
  return 'joined';
end $$;
revoke all on function public.universe_invite_claim(uuid, uuid) from public, anon, authenticated;
