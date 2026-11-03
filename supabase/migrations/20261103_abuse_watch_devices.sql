-- Abuse watch, step 2 (Sean, 2026-11-03): who signed up from which device.
-- Salted hashes only, written by ve-auth `signup` and `google` (recordMemberDevice). RLS on, no policies.
create table if not exists public.ve_member_devices (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members(id),
  ip_hash text,
  browser_hash text,
  via text not null check (via in ('email','google')),
  created_at timestamptz not null default now()
);
create index if not exists ve_member_devices_ip on public.ve_member_devices(ip_hash, created_at) where ip_hash is not null;
create index if not exists ve_member_devices_browser on public.ve_member_devices(browser_hash, created_at) where browser_hash is not null;
create index if not exists ve_member_devices_member on public.ve_member_devices(member_id);
alter table public.ve_member_devices enable row level security;
revoke all on public.ve_member_devices from anon, authenticated;

-- Email sign-ups already logged their IP hash from 2026-09-23.
insert into public.ve_member_devices(member_id, ip_hash, via, created_at)
select a.member_id, a.ip_hash, 'email', a.created_at
from public.ve_signup_attempts a
join public.members m on m.id = a.member_id
where a.outcome = 'created' and a.member_id is not null and a.ip_hash is not null
  and not exists (select 1 from public.ve_member_devices d where d.member_id = a.member_id);

-- Device signals, written into ve_abuse_signals before the daily scan scores them (scan 9:11 UTC, this 9:09).
--  shared_browser: one browser behind three or more accounts in 30 days (35).
--  shared_ip: four or more accounts from one network in 7 days (20): offices, homes and events share one, so it is weak alone.
create or replace function public.ve_abuse_scan_devices() returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare n1 int := 0; n2 int := 0;
begin
  insert into ve_abuse_signals(member_id, kind, weight, evidence)
  select d.member_id, 'shared_browser', 35,
         jsonb_build_object('accounts', g.accounts, 'members', g.members)
  from (select browser_hash, count(distinct member_id) accounts, jsonb_agg(distinct member_id) members
        from ve_member_devices where browser_hash is not null and created_at > now() - interval '30 days'
        group by browser_hash having count(distinct member_id) >= 3) g
  join ve_member_devices d on d.browser_hash = g.browser_hash and d.created_at > now() - interval '30 days'
  join members m on m.id = d.member_id and coalesce(m.member_class,'member') = 'member' and not coalesce(m.is_superadmin,false)
  group by d.member_id, g.accounts, g.members
  on conflict (member_id, kind, day) do nothing;
  get diagnostics n1 = row_count;

  insert into ve_abuse_signals(member_id, kind, weight, evidence)
  select d.member_id, 'shared_ip', 20,
         jsonb_build_object('accounts', g.accounts, 'members', g.members)
  from (select ip_hash, count(distinct member_id) accounts, jsonb_agg(distinct member_id) members
        from ve_member_devices where ip_hash is not null and created_at > now() - interval '7 days'
        group by ip_hash having count(distinct member_id) >= 4) g
  join ve_member_devices d on d.ip_hash = g.ip_hash and d.created_at > now() - interval '7 days'
  join members m on m.id = d.member_id and coalesce(m.member_class,'member') = 'member' and not coalesce(m.is_superadmin,false)
  group by d.member_id, g.accounts, g.members
  on conflict (member_id, kind, day) do nothing;
  get diagnostics n2 = row_count;
  return jsonb_build_object('shared_browser', n1, 'shared_ip', n2);
end $$;
revoke execute on function public.ve_abuse_scan_devices() from public, anon, authenticated;
grant execute on function public.ve_abuse_scan_devices() to service_role;

select cron.unschedule('ve-abuse-scan-devices') where exists (select 1 from cron.job where jobname = 've-abuse-scan-devices');
select cron.schedule('ve-abuse-scan-devices', '9 9 * * *', $$select public.ve_abuse_scan_devices()$$);
