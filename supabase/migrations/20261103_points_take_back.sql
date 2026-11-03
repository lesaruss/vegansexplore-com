-- Take points back from a member (Sean, 2026-11-03: "give reward points and take reward points").
-- Mirrors the spend functions: lowers spendable points (members.lesars_balance and member_points.available_points),
-- never lifetime points (total_points), so a level never drops. Refuses to go below zero. Once per ref.
create or replace function public.ve_points_take(p_member uuid, p_amount integer, p_ref text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare bal integer;
begin
  if p_amount is null or p_amount <= 0 then return jsonb_build_object('error', 'bad_amount'); end if;
  select lesars_balance into bal from members where id = p_member for update;
  if not found then return jsonb_build_object('error', 'member_not_found'); end if;
  if exists (select 1 from points_ledger where member_id = p_member and reason = 'admin_adjust' and ref_id = p_ref) then
    return jsonb_build_object('taken', false, 'already', true, 'balance', coalesce(bal, 0));
  end if;
  if coalesce(bal, 0) < p_amount then
    return jsonb_build_object('error', 'insufficient_points', 'balance', coalesce(bal, 0));
  end if;
  update members set lesars_balance = coalesce(bal, 0) - p_amount where id = p_member;
  perform apply_member_points_delta(p_member, -p_amount);
  insert into points_ledger (member_id, delta, reason, ref_id) values (p_member, -p_amount, 'admin_adjust', p_ref);
  return jsonb_build_object('taken', true, 'balance', coalesce(bal, 0) - p_amount);
end $function$;

revoke all on function public.ve_points_take(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.ve_points_take(uuid, integer, text) to service_role;
