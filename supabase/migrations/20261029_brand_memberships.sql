-- Per-brand memberships (Sean, 2026-10-29: "GO" on closing the sign-in loophole; follows Continue with LESARUSS,
-- 20261029_lesaruss_sign_in.sql).
-- One email is one members row across every brand (idx_members_email_unique_global), and membership_status on that row
-- belongs to the brand that made it. A free LESARUSS.ai account reads 'active', so before this, signing in to Vegans
-- Explore with Google or a password treated it as a paid member without the $11 Passport.
-- From here:
--   brand_memberships  who holds what on which brand: a Passport (paid), a comp (on us) or the Diplomat membership.
--   ve_member_entitled whether a members row's status counts on Vegans Explore: a Vegans Explore account (its status is
--                      ours, unchanged), a Vegans Explore Passport or comp held on another brand's account, a Diplomat,
--                      or a super admin. Sign-in (ve-auth, ve-lesaruss-sso) refuses everyone else with passport_needed
--                      and an $11 checkout made on the server.
--   Vegans Explore accounts are recorded by trigger; another brand's account gets its Passport through
--   ve_brand_membership_grant (the Stripe webhook's entry_contribution, ve_member_admit).

create table if not exists brand_memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  brand text not null check (brand in ('vegans-explore', 'lesaruss-ai')),
  kind text not null check (kind in ('passport', 'comp', 'diplomat')),
  status text not null default 'active' check (status in ('active', 'ended')),
  since timestamptz not null default now(),
  ends_at timestamptz,
  source text not null,
  ref text,
  updated_at timestamptz not null default now(),
  unique (member_id, brand, kind)
);
alter table brand_memberships enable row level security;
create index if not exists brand_memberships_brand on brand_memberships (brand, status);

create or replace function ve_brand_membership_grant(p_member uuid, p_kind text, p_source text, p_ref text default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare had boolean;
begin
  select exists (select 1 from brand_memberships where member_id = p_member and brand = 'vegans-explore' and status = 'active'
    and (ends_at is null or ends_at > now())) into had;
  insert into brand_memberships (member_id, brand, kind, source, ref)
  values (p_member, 'vegans-explore', p_kind, p_source, p_ref)
  on conflict (member_id, brand, kind) do update set status = 'active', ends_at = null, source = excluded.source,
    ref = coalesce(excluded.ref, brand_memberships.ref), updated_at = now()
    where brand_memberships.status <> 'active' or brand_memberships.ends_at is not null;
  return not had;
end $$;

create or replace function ve_member_entitled(p_member uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select m.is_superadmin is true
      or m.tenant_id = '00000000-0000-4000-a000-000000000002'
      or exists (select 1 from brand_memberships b where b.member_id = m.id and b.brand = 'vegans-explore'
                 and b.status = 'active' and (b.ends_at is null or b.ends_at > now()))
      or lesaruss_is_diplomat(m.email)
    from members m where m.id = p_member), false);
$$;

-- A Vegans Explore account's own status is the record: active is a Passport (paid) or a comp, anything else ends it.
create or replace function trg_ve_brand_membership_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.tenant_id is distinct from '00000000-0000-4000-a000-000000000002' then return new; end if;
  if new.membership_status = 'active' then
    perform ve_brand_membership_grant(new.id, case when new.entry_paid_at is not null then 'passport' else 'comp' end, 'account');
  elsif tg_op = 'UPDATE' and old.membership_status = 'active' then
    update brand_memberships set status = 'ended', ends_at = coalesce(ends_at, now()), updated_at = now()
    where member_id = new.id and brand = 'vegans-explore' and status = 'active';
  end if;
  return new;
end $$;

drop trigger if exists trg_ve_brand_membership_sync on members;
create trigger trg_ve_brand_membership_sync after insert or update of membership_status, entry_paid_at on members
  for each row execute function trg_ve_brand_membership_sync();

-- Any $11 purchase admits (canon ve-pricing-points-passport). On another brand's account the row is already 'active',
-- so the Vegans Explore Passport is recorded here; true when this made them a member here.
create or replace function ve_member_admit(p_member uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_new boolean;
begin
  update members set membership_status = 'active', entry_paid_at = coalesce(entry_paid_at, now()), updated_at = now()
  where id = p_member and membership_status is distinct from 'active';
  v_new := found;
  return ve_brand_membership_grant(p_member, 'passport', 'admit') or v_new;
end $$;

-- The Diplomat record follows lesaruss_is_diplomat, daily with the rest of ve_diplomat_sync.
create or replace function ve_diplomat_sync()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update members m set membership_status = 'pending_payment', diplomat_since = null, updated_at = now()
  where m.tenant_id = '00000000-0000-4000-a000-000000000002' and m.diplomat_since is not null
    and m.entry_paid_at is null and m.membership_status = 'active' and not lesaruss_is_diplomat(m.email);
  get diagnostics n = row_count;
  update members m set diplomat_since = null
  where m.tenant_id = '00000000-0000-4000-a000-000000000002' and m.diplomat_since is not null
    and m.entry_paid_at is not null and not lesaruss_is_diplomat(m.email);
  insert into brand_memberships (member_id, brand, kind, source)
  select m.id, 'lesaruss-ai', 'diplomat', 'diplomat_sync' from members m where lesaruss_is_diplomat(m.email)
  on conflict (member_id, brand, kind) do update set status = 'active', ends_at = null, updated_at = now()
    where brand_memberships.status <> 'active';
  update brand_memberships b set status = 'ended', ends_at = now(), updated_at = now()
  from members m where b.member_id = m.id and b.brand = 'lesaruss-ai' and b.kind = 'diplomat' and b.status = 'active'
    and not lesaruss_is_diplomat(m.email);
  delete from lesaruss_sso_codes where created_at < now() - interval '7 days';
  return n;
end $$;

-- Backfill: every active Vegans Explore account, and today's Diplomats.
insert into brand_memberships (member_id, brand, kind, since, source)
select m.id, 'vegans-explore', case when m.entry_paid_at is not null then 'passport' else 'comp' end,
  coalesce(m.entry_paid_at, m.created_at, now()), 'backfill'
from members m
where m.tenant_id = '00000000-0000-4000-a000-000000000002' and m.membership_status = 'active'
on conflict (member_id, brand, kind) do nothing;
select ve_diplomat_sync();

revoke all on function ve_brand_membership_grant(uuid, text, text, text) from public, anon, authenticated;
revoke all on function ve_member_entitled(uuid) from public, anon, authenticated;
revoke all on function ve_member_admit(uuid) from public, anon, authenticated;
revoke all on function ve_diplomat_sync() from public, anon, authenticated;
