-- One dashboard, a version for each kind of member (Sean, 2026-10-24: "if they're a coach, there's a certain, the dashboard set
-- up a certain way. If they're a pre-vegan, the dashboard set up a certain way"; docs/proposals/member-dashboards.md). A version
-- decides the block at the top of /dashboard's home, which What's new cards show (ve_dashboard_cards.audience) and the order of
-- Your tools. Read and set through the ve-dashboard edge function.

-- 1. A member's own choice; empty means worked out (ve_dashboard_version).
alter table public.members add column if not exists dashboard_version text;
alter table public.members add constraint members_dashboard_version_check
  check (dashboard_version is null or dashboard_version in ('business', 'coach', 'pre_vegan', 'member'));

-- 2. The version a member gets when they have not picked one: business when they own a listing or said Business owner in
--    the Mission Survey (q3_roles), pre_vegan when their journey (q6_stage) is Curious / pre-Vegan, Flexitarian or Vegetarian,
--    coach when they said Service provider, else member. In that order.
create or replace function public.ve_dashboard_version(p_member uuid)
returns text language sql stable security definer set search_path to 'public' as $$
  select case
    when exists (select 1 from listings where status = 'approved' and (owner_member_id = m.id or claimed_by_member_id = m.id))
      or coalesce(m.mission_survey_answers->'q3_roles', '[]'::jsonb) ? 'Business owner' then 'business'
    when m.mission_survey_answers->>'q6_stage' in ('Curious / pre-Vegan', 'Flexitarian', 'Vegetarian') then 'pre_vegan'
    when coalesce(m.mission_survey_answers->'q3_roles', '[]'::jsonb) ? 'Service provider' then 'coach'
    else 'member' end
  from members m where m.id = p_member;
$$;
revoke all on function public.ve_dashboard_version(uuid) from public, anon, authenticated;

-- 3. What each version shows first. Pre-Vegan's wizard cards are its Start here steps, in order. A card's link that starts
--    with ? opens on the member's own listing (business only, ve-dashboard).
insert into public.ve_dashboard_cards (audience, kind, title, body, cta_label, cta_url, sort)
select * from (values
  ('pre_vegan', 'wizard', 'Meet your Guide', 'Liz walks you through Vegans Explore and answers what you are wondering, one question at a time.', 'Meet Liz', '/dashboard/guide', 10),
  ('pre_vegan', 'wizard', 'Swap one thing this week', 'Start with one easy dairy swap. The Vegan Dairy Guide shows you how, with Maya.', 'See the swap', '/guides/vegan-dairy-guide', 20),
  ('pre_vegan', 'wizard', 'Find a 100% Vegan spot near you', 'Pick a place the community voted for and try one dish.', 'Open the Directory', '/directory?tab=food', 30),
  ('pre_vegan', 'wizard', 'Read today''s Daily Pulse', 'What is happening in your city today, in a few minutes.', 'Read it', '/dashboard/pulse', 40),
  ('pre_vegan', 'wizard', 'Ask your city', 'Post a question on the Community Board. People here remember starting out.', 'Ask a question', '/board', 50),
  ('coach', 'new', 'Put your practice in the Directory', 'Coaches, chefs and health pros: list your practice so members in your city find you.', 'Join the Directory', '/claim?add=1', 10),
  ('coach', 'new', 'Take on a bounty', 'Campaigns in your city pay points for real work: a class, a talk, a cooking demo.', 'See the bounties', '/dashboard/bounties', 20),
  ('member', 'new', 'Vote for your favorite spots', 'Your votes decide who leads each list in the Directory.', 'Open the Directory', '/directory', 10),
  ('member', 'new', 'Take on a bounty', 'Campaigns in your city: take on a job and earn points.', 'See the bounties', '/dashboard/bounties', 20)
) v(audience, kind, title, body, cta_label, cta_url, sort)
where not exists (select 1 from public.ve_dashboard_cards where audience in ('pre_vegan', 'coach', 'member'));
