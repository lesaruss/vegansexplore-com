-- Guide credits for sale, $11 each (Sean, 2026-10-25: "they can purchase credits at $11 each. This will make it easier
-- than remember something costs 10,000 points. Points can come from a growing list of activities designed to keep the
-- community active"). Money buys credits; points are only earned. ve-guide-unlock `buy_credits` runs the Stripe checkout
-- (metadata type ve_credit_purchase, confirm_fn ve-guide-unlock) and its confirm calls this.
--
-- A paid credit is never lost to the rollover cap of 3: the cap only limits credits we give (Founding, Passport month).
-- One ledger row per checkout session (ref stripe:<session>), so a replayed webhook or a second confirm grants nothing.

alter table public.guide_credit_ledger drop constraint if exists guide_credit_ledger_reason_check;
alter table public.guide_credit_ledger add constraint guide_credit_ledger_reason_check
  check (reason in ('founding', 'passport_month', 'points_exchange', 'guide_unlock', 'admin_adjust', 'capped', 'purchase'));

create or replace function public.ve_credit_purchase_paid(p_member uuid, p_ref text, p_qty integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare bal integer;
begin
  if p_qty is null or p_qty < 1 or p_qty > 10 then return jsonb_build_object('error', 'bad_quantity'); end if;
  select guide_credits into bal from members where id = p_member for update;
  if bal is null then return jsonb_build_object('error', 'member_not_found'); end if;
  if exists (select 1 from guide_credit_ledger where member_id = p_member and ref_id = p_ref) then
    return jsonb_build_object('granted', false, 'already', true, 'credits', bal);
  end if;
  update members set guide_credits = bal + p_qty where id = p_member;
  insert into guide_credit_ledger (member_id, delta, reason, ref_id, balance_after) values (p_member, p_qty, 'purchase', p_ref, bal + p_qty);
  return jsonb_build_object('granted', true, 'credits', bal + p_qty);
end $$;

revoke all on function public.ve_credit_purchase_paid(uuid, text, integer) from public, anon, authenticated;
