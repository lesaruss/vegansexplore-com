-- Switch accounts (Sean, 2026-10-26: "the same way I do view as, I want to have that option to choose from the super admin...
-- so I can log in and see that experience"). View As only paints the page; a switch is a real sign-in as another account, so
-- the server treats every action as that member. Only the accounts listed here can be switched into, only by a super admin
-- signed in as themselves, through the ve-switch-account edge function. Playbook ve-guide-accounts.

create table if not exists public.ve_switch_accounts (
  member_id  uuid primary key references public.members(id) on delete cascade,
  label      text not null,
  kind       text not null default 'member' check (kind in ('member', 'guide')),
  guide_slug text,
  note       text,
  sort       integer not null default 100,
  added_at   timestamptz not null default now()
);
alter table public.ve_switch_accounts enable row level security;
-- No policies: read and written only by the service role (ve-switch-account).

-- 1. The six Guides members can choose, each a real account (member_class agent). No password: they are reached only by a
--    switch. Active so the member side of the site opens; no welcome points (Guides never earn points).
with g(slug, name, art, sort) as (values
  ('liz',   'Liz',   'hf_20261005_021226_51fc0dd1-aad1-45ee-ada3-f6cab13ed3a2_min.webp', 10),
  ('maya',  'Maya',  'hf_20261005_024302_9c0f4bbf-2a50-4b44-8aa2-b252c337e94c_min.webp', 20),
  ('river', 'River', 'hf_20261005_024303_7f42e72b-fb79-4ee2-8ead-08a2709889ed_min.webp', 30),
  ('nori',  'Nori',  'hf_20261005_024302_0295e562-b710-4312-843b-591739f56439_min.webp', 40),
  ('dani',  'Dani',  'hf_20261005_024303_76de8533-470a-4b1d-bb44-e5f56174e262_min.webp', 50),
  ('theo',  'Theo',  'hf_20261005_024302_f6297bbc-32d0-4a4c-8adc-2821b8253f7a_min.webp', 60)
)
insert into public.members (email, name, initials, color, avatar_url, membership_tier, membership_status, ve_role, ve_tier,
                            auth_methods, home_community, tenant_id, guide_slug, entry_paid_at, email_verified, member_class, class_reason)
select g.slug || '.guide@vegansexplore.com', g.name, upper(left(g.name, 1)), '#16A34A',
       'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/' || g.art,
       'free', 'active', 'member', 'free', array[]::text[], 'south-florida', '00000000-0000-4000-a000-000000000002',
       g.slug, now(), true, 'agent', 'Guide account (playbook ve-guide-accounts, Sean 2026-10-26).'
  from g
 where not exists (select 1 from public.members m where lower(m.email) = g.slug || '.guide@vegansexplore.com');

insert into public.ve_switch_accounts (member_id, label, kind, guide_slug, sort)
select m.id, m.name, 'guide', m.guide_slug,
       case m.guide_slug when 'liz' then 10 when 'maya' then 20 when 'river' then 30 when 'nori' then 40 when 'dani' then 50 else 60 end
  from public.members m
 where m.email like '%.guide@vegansexplore.com' and m.member_class = 'agent'
on conflict (member_id) do nothing;

-- Their home community row, as a sign-up makes one.
insert into public.member_communities (member_id, community_slug)
select m.id, 'south-florida' from public.members m
 where m.email like '%.guide@vegansexplore.com' and m.member_class = 'agent'
   and not exists (select 1 from public.member_communities c where c.member_id = m.id and c.community_slug = 'south-florida');

-- 2. Sean's member walkthrough account (founding Passport, made 2026-10-26).
insert into public.ve_switch_accounts (member_id, label, kind, note, sort)
select id, 'Logan Russell (founding member)', 'member', 'Founding Passport, 1,100 welcome points', 1
  from public.members where lower(email) = 'contact+logan@lesaruss.com'
on conflict (member_id) do nothing;

-- 3. Guide accounts never vote, check in or give points (playbook: "No votes, no points"). A vote counts toward a listing's
--    10-member vetting, so this is held in the database, whichever function the action comes through.
create or replace function public.ve_refuse_agent_actions()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if exists (select 1 from members where id = new.member_id and member_class = 'agent') then
    raise exception 'guide_accounts_cannot_%', tg_argv[0] using errcode = 'P0001';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_ve_refuse_agent_vote on public.listing_daily_votes;
create trigger trg_ve_refuse_agent_vote before insert on public.listing_daily_votes
  for each row execute function public.ve_refuse_agent_actions('vote');
drop trigger if exists trg_ve_refuse_agent_checkin on public.ve_checkins;
create trigger trg_ve_refuse_agent_checkin before insert on public.ve_checkins
  for each row execute function public.ve_refuse_agent_actions('check_in');
drop trigger if exists trg_ve_refuse_agent_give on public.ve_listing_point_contributions;
create trigger trg_ve_refuse_agent_give before insert on public.ve_listing_point_contributions
  for each row execute function public.ve_refuse_agent_actions('give_points');
