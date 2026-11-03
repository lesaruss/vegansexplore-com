-- Depot > Referral claims (Sean, 2026-11-03): conflict and unresolved "Did someone send you?" claims are reviewed by a person.
alter table ve_referral_claims add column if not exists reviewed_at timestamptz, add column if not exists reviewed_by uuid, add column if not exists decision text, add column if not exists note text, add column if not exists decided_member_id uuid;
alter table ve_referral_claims drop constraint if exists ve_referral_claims_decision_check;
alter table ve_referral_claims add constraint ve_referral_claims_decision_check check (decision is null or decision in ('keep_link','credit_claimed','credit_member','dismiss'));

-- One decision, atomic. Changing who a friend is credited to is possible only before they join (payment and points are paid when the account turns active);
-- after that the decision is recorded and the points are given by hand from the member card.
create or replace function ve_referral_claim_decide(p_claim uuid, p_admin uuid, p_decision text, p_member uuid default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c record; f record; t uuid; v_changed boolean := false;
begin
  if p_decision not in ('keep_link','credit_claimed','credit_member','dismiss') then return jsonb_build_object('error','bad_decision'); end if;
  select * into c from ve_referral_claims where id = p_claim for update;
  if not found then return jsonb_build_object('error','not_found'); end if;
  if c.reviewed_at is not null then return jsonb_build_object('error','already_decided'); end if;
  select id, membership_status, referred_by into f from members where id = c.member_id;
  if p_decision = 'credit_claimed' then t := c.claimed_member_id; elsif p_decision = 'credit_member' then t := p_member; end if;
  if p_decision in ('credit_claimed','credit_member') then
    if t is null then return jsonb_build_object('error','no_member'); end if;
    if t = c.member_id then return jsonb_build_object('error','self'); end if;
    if not exists (select 1 from members where id = t and membership_status = 'active' and member_class in ('member','internal')) then return jsonb_build_object('error','not_an_active_member'); end if;
    if f.membership_status = 'pending_payment' then
      update members set referred_by = t where id = c.member_id; v_changed := true;
    end if;
  end if;
  update ve_referral_claims set reviewed_at = now(), reviewed_by = p_admin, decision = p_decision, note = nullif(left(p_note,2000),''), decided_member_id = t where id = p_claim;
  return jsonb_build_object('ok', true, 'changed', v_changed, 'recorded_only', p_decision in ('credit_claimed','credit_member') and not v_changed);
end $$;
revoke all on function ve_referral_claim_decide(uuid, uuid, text, uuid, text) from public, anon, authenticated;
