-- The creator application (Sean, 2026-10-30: "the last step is the intake... We want to know as much as we can about them to see the
-- scope of what we can apply them to. And then now when we run a campaign, it can automatically pull in... content creators... specific
-- to a certain city interest"). /gigs/sample walks a creator through the Creator Dashboard and ends on Apply (#join/1 to /5); ve-ambassador
-- creator_apply saves it here, emails Sean and confirms to them. The columns pulled out of answers (chapters, topics, formats, gig kinds,
-- platforms and reach) are what a campaign will match on later; answers keeps everything they said. RLS on, no policies: only the
-- function reads or writes it. Read in Depot > Ambassadors > Creators and the dashboard's Inbox.
create table if not exists public.ve_creator_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  chapter text,
  city text,
  chapters text[] not null default '{}',
  topics text[] not null default '{}',
  formats text[] not null default '{}',
  gig_kinds text[] not null default '{}',
  platforms jsonb not null default '[]',
  main_platform text,
  total_reach integer not null default 0,
  answers jsonb not null default '{}',
  source text,
  member_id uuid references public.members(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'accepted', 'declined')),
  status_at timestamptz,
  status_by uuid,
  team_note text
);
create index if not exists ve_creator_applications_email on public.ve_creator_applications (lower(email), created_at desc);
create index if not exists ve_creator_applications_chapters on public.ve_creator_applications using gin (chapters);
create index if not exists ve_creator_applications_topics on public.ve_creator_applications using gin (topics);
alter table public.ve_creator_applications enable row level security;

-- The Inbox: a creator application is a request a person sent.
create or replace function public.ve_inbox_items(p_since timestamp with time zone default (now() - '120 days'::interval))
 returns table(source text, source_id uuid, created_at timestamp with time zone, kind text, title text, summary text, member_id uuid, name text, email text, chapter text, link text)
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select 'group_application', a.id, a.created_at,
    case when a.kind = 'meeting' then 'Meeting request' else 'Group Partner application' end,
    a.group_name, coalesce(nullif(a.answers->>'topic', ''), nullif(a.answers->>'worth_it', ''), a.city),
    a.member_id, a.organizer_name, a.organizer_email, a.chapter,
    '/admin/depot/group-partners#app/' || a.id
  from ve_group_applications a
  where a.created_at >= p_since and a.group_name not like '[TEST]%'
  union all
  select 'ask_person', q.id, q.created_at, 'Question for a person', left(q.question, 160),
    case when q.guide_slug is null then null else 'Asked in ' || initcap(replace(q.guide_slug, '-', ' ')) end,
    q.member_id, null, null, null, null
  from guide_kb_questions q
  where q.outcome = 'sent_to_person' and q.created_at >= p_since and coalesce(q.brand_slug, 'vegans-explore') = 'vegans-explore'
  union all
  select 'lead', i.id, i.created_at,
    case i.action_type when 'sponsor_tier' then 'Sponsor interest' when 'ticket' then 'Ticket interest'
      else initcap(replace(coalesce(i.action_type, 'interest'), '_', ' ')) end,
    initcap(replace(regexp_replace(coalesce(i.initiative_slug, ''), '^vegans-explore-initiative-', ''), '-', ' ')),
    coalesce(nullif(i.tier_label, ''), left(i.note, 200)),
    i.member_id, i.name, i.email, null, '/dashboard/leads'
  from ve_initiative_interest i
  where coalesce(i.action_type, '') <> 'link_click' and i.created_at >= p_since
  union all
  select 'ambassador_story', s.id, s.created_at,
    case s.kind when 'intro' then 'Introduction' when 'interview' then 'Interview me' when 'host' then 'Wants to host' else 'What is happening' end,
    s.name, left(s.about, 200), s.member_id, null, null, s.place, '/admin/depot/ambassadors#stories/new'
  from ve_ambassador_stories s
  where s.created_at >= p_since
  union all
  select 'creator_application', c.id, c.created_at, 'Creator application', c.name,
    nullif(concat_ws(' · ', nullif(c.city, ''), case when c.total_reach > 0 then c.total_reach::text || ' reach' end, nullif(array_to_string(c.topics[1:3], ', '), '')), ''),
    c.member_id, c.name, c.email, c.chapter, '/admin/depot/ambassadors#creator/' || c.id
  from ve_creator_applications c
  where c.created_at >= p_since and c.name not like '[TEST]%'
  union all
  select 'podcast_network', p.id, p.created_at, 'Podcast Network application', p.podcast_name,
    nullif(concat_ws(' · ', nullif(p.monthly_downloads, ''), nullif(p.release_cadence, '')), ''),
    p.member_id, p.contact_name, p.contact_email, null, null
  from ve_podcast_network_applications p
  where p.created_at >= p_since
  union all
  select 'profile_claim', c.id, c.created_at, 'Profile request', coalesce(l.name, c.new_profile->>'name'), left(c.note, 200),
    c.member_id, null, null, null, '/admin/depot/ambassadors#door'
  from ve_profile_claims c left join listings l on l.id = c.listing_id
  where c.created_at >= p_since
  union all
  select 'listing_claim', c.id, c.created_at,
    case when 've-application' = any(coalesce(l.tags, '{}')) then 'Application to be listed' else 'Listing claim' end,
    l.name, case c.tier when 'brand' then 'Partner plan' when 'verified' then 'Passport Stop' when 'plus' then 'Anchor' else c.tier end,
    c.member_id, c.contact_name, c.contact_email, null, '/admin/depot/claims'
  from ve_listing_claims c left join listings l on l.id = c.listing_id
  where c.created_at >= p_since and not coalesce(c.test, false) and c.status <> 'awaiting_contribution'
    and not (coalesce(l.tags, '{}') && array['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'])
  union all
  select 'nonprofit_survey', n.id, n.created_at, 'Nonprofit survey', n.org_name, null, n.member_id, null, null, null, null
  from ve_nonprofit_surveys n
  where n.created_at >= p_since
  union all
  select 'event', e.id, e.created_at, 'Event submitted', e.title,
    nullif(concat_ws(' · ', nullif(e.city, ''), to_char(e.starts_at, 'Mon DD')), ''),
    e.author_id, null, null, null, '/admin/depot/events#event/' || e.id
  from events e
  where e.source = 'member' and e.created_at >= p_since and e.funding is null and coalesce(e.listing_kind, 'event') = 'event'
  order by 3 desc;
$function$;
