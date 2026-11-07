-- ve-pricing-points-passport: the survey is the only way in (Sean, 2026-11-07; canon-ve-door-guides v12).
-- 1. Cash commissions pause: ve_affiliate_earn records nothing while affiliate_program.paused is true, and members
--    no longer see rates (live false). Turning paused off resumes commissions from that day, never back-paid.
-- 2. The $11 brings no welcome points (ve-stripe-webhook, same day); the survey pays its own 250.
update ve_site_settings
   set value = value || jsonb_build_object('paused', true, 'live', false, 'paused_at', now(), 'paused_note', 'Sean 2026-11-07: cash commissions pause; the survey is the only way in.')
 where key = 'affiliate_program';

do $$
declare d text;
begin
  d := pg_get_functiondef('public.ve_affiliate_earn(uuid,text,text,text)'::regprocedure);
  if position('''paused''' in d) = 0 then
    d := replace(d,
      E'  select value into cfg from ve_site_settings where key = ''affiliate_program'';\n',
      E'  select value into cfg from ve_site_settings where key = ''affiliate_program'';\n  if coalesce((cfg->>''paused'')::boolean, false) then return jsonb_build_object(''skipped'', ''paused''); end if;\n');
    execute d;
  end if;
end $$;
