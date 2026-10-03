-- Community Managers are approved by a person (Sean, 2026-10-03: "same switch for Ron").
-- A staff invite used to set ve_role and staff_role the moment the invited email signed up,
-- and made them their city's manager, before they applied or were approved. Now an invite
-- only sets their home city (and the founding membership, when the invite grants it) and
-- marks itself claimed. The role, and the city's manager, come from Approve in the Depot
-- (ve-community-manager admin_decide). Invites for other staff roles behave as before.

create or replace function public.apply_staff_invite_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare inv record;
begin
  if NEW.email is null then return NEW; end if;
  select * into inv from ve_staff_invites where lower(email) = lower(NEW.email) and claimed_member_id is null;
  if found then
    if inv.ve_role is distinct from 'community_manager' then
      NEW.ve_role := inv.ve_role;
      NEW.staff_role := inv.staff_role;
    end if;
    if inv.city_slug is not null then NEW.home_community := inv.city_slug; end if;
    if inv.grant_founding_membership then
      NEW.membership_status := 'active';
      NEW.entry_paid_at := coalesce(NEW.entry_paid_at, now());
    end if;
  end if;
  return NEW;
end
$$;

create or replace function public.apply_staff_invite_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare inv record;
begin
  if NEW.email is null then return NEW; end if;
  select * into inv from ve_staff_invites where lower(email) = lower(NEW.email) and claimed_member_id is null;
  if found then
    update ve_staff_invites set claimed_member_id = NEW.id, claimed_at = now() where email = inv.email;
  end if;
  return NEW;
end
$$;
