-- Test and AI accounts off member-facing surfaces (Sean, 2026-10-03: "get rid of the test
-- accounts, that's fine"). Reversible on purpose: accounts are reclassified, not deleted,
-- because their rows carry points, history and audit links. Only member_class 'member'
-- is a real member; 'agent' (AI personas), 'internal' (staff and test logins) and
-- 'quarantined' (seed data and spam sign-ups) never show to members.

-- 1. The leaderboard (dashboard This City and Global) shows real members only. It used to
--    include 'internal', which put staff and the test Community Manager on the board.
create or replace function public.ve_leaderboard(p_cities text[])
returns table(id uuid, name text, initials text, avatar_url text, color text, points integer, location text)
language sql
stable
set search_path to 'public'
as $function$
  select m.id, m.name, m.initials, m.avatar_url, m.color,
         coalesce(mp.available_points, 0) as points,
         m.location
  from members m
  left join member_points mp on mp.member_id = m.id
  where m.membership_status = 'active'
    and m.tenant_id = '00000000-0000-4000-a000-000000000002'::uuid
    and m.member_class = 'member'
    and exists (select 1 from unnest(p_cities) c where m.location ilike '%' || c || '%')
  order by coalesce(mp.available_points, 0) desc
  limit 10;
$function$;

-- 2. Accounts that were in the wrong class (set_member_class logs each move to stream_events).
select public.set_member_class(id, 'internal', 'Logan test login (lesaruss+test1).', 'logan')
  from members where lower(email) = 'lesaruss+test1@gmail.com' and member_class <> 'internal';
select public.set_member_class(id, 'quarantined', 'Spam sign-up: generated name, unrelated corporate email, never paid.', 'logan')
  from members where lower(email) in ('andreas.raffeck@bartec.com', 'salan.yao@abracon.com') and member_class <> 'quarantined';

-- 3. The test Community Manager (contact+cmtest@lesaruss.com, "Tim Smith"): role off,
--    application declined, invite and test-checkout allowlist entry removed, account quarantined.
update members set ve_role = 'member', staff_role = null where lower(email) = 'contact+cmtest@lesaruss.com';
update ve_cm_candidates set status = 'declined' where lower(email) = 'contact+cmtest@lesaruss.com' and kind = 'application';
update ve_partner_cities set manager_member_id = null, manager_email = null
  where manager_member_id in (select id from members where lower(email) = 'contact+cmtest@lesaruss.com');
delete from ve_staff_invites where lower(email) = 'contact+cmtest@lesaruss.com';
delete from ve_test_checkout_allowlist where lower(email) = 'contact+cmtest@lesaruss.com';
select public.set_member_class(id, 'quarantined', 'Test Community Manager account, retired 2026-10-03.', 'logan')
  from members where lower(email) = 'contact+cmtest@lesaruss.com' and member_class <> 'quarantined';

-- 4. Global means everyone (Sean's leaderboard, 2026-10-03). The dashboard sends ['*'] for
--    Global. City names match the free-text location and the member's home city
--    (home_community) as whole words only, so 'LA' no longer matches 'Plantation'.
create or replace function public.ve_leaderboard(p_cities text[])
returns table(id uuid, name text, initials text, avatar_url text, color text, points integer, location text)
language sql
stable
set search_path to 'public'
as $function$
  select m.id, m.name, m.initials, m.avatar_url, m.color,
         coalesce(mp.available_points, 0) as points,
         m.location
  from members m
  left join member_points mp on mp.member_id = m.id
  where m.membership_status = 'active'
    and m.tenant_id = '00000000-0000-4000-a000-000000000002'::uuid
    and m.member_class = 'member'
    and ('*' = any(p_cities)
      or exists (select 1 from unnest(p_cities) c
                 where coalesce(m.location, '') ~* ('\m' || c || '\M')
                    or replace(coalesce(m.home_community, ''), '-', ' ') ~* ('\m' || c || '\M')))
  order by coalesce(mp.available_points, 0) desc
  limit 10;
$function$;
