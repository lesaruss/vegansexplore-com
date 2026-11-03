-- Referral reward tiers (Sean, 2026-11-03: "at level 2, they just get the commission, and level 3 and up, they get the commission and the points").
-- Applied through the Supabase connector the same day; this file is the record. Level 1 pays the 111 points; Level 2 pays them only when the friend did
-- not pay (a survey join has no payment, so no commission exists); Level 3 and up pays points and, through ve_affiliate_earn, the commission.
create or replace function public.ve_referral_on_admit()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare v_level int; v_paid boolean;
begin
  if NEW.referred_by is not null and NEW.membership_status = 'active'
     and (TG_OP = 'INSERT' or OLD.membership_status is distinct from 'active') then
    begin
      v_level := coalesce((ve_member_level(NEW.referred_by)->>'level')::int, 1);
      v_paid := NEW.entry_paid_at is not null;
      if v_level <> 2 or not v_paid then
        perform award_points_bounty(NEW.referred_by, 'vegans-explore', 'referral_signup', 'referral_signup:' || NEW.id, 'referral');
      end if;
    exception when others then
      raise warning 'referral not paid for member %: %', NEW.id, sqlerrm;
    end;
  end if;
  return NEW;
end $function$;
