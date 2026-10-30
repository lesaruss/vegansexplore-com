-- The inbox (Sean, 2026-10-30: "my inbox of any requests, anything that comes through that's assigned to me... for now, anything
-- that comes through, period, even if it's assigned to somebody else... it shows me the status if that person has viewed it or not...
-- no more 24 hours... from the time of the reply. And sooner the better. And that's how we track the effectiveness of our community
-- managers"). One list of every request a person sent us, wherever it came in, read by ve-dashboard 'inbox' (super admins see all;
-- a Community Manager will see their own). The requests stay in their own tables; ve_inbox_state holds only what happened to each one
-- here: who it is assigned to, when the team first saw it, when the person it is assigned to opened it, when it was answered, and
-- when it was closed without a reply. The reply clock is 24 hours from when it came in (ve-dashboard INBOX_DUE_HOURS).

create table if not exists public.ve_inbox_state (
  source text not null,
  source_id uuid not null,
  assigned_member_id uuid references public.members(id),
  first_seen_at timestamptz,
  viewed_at timestamptz,
  viewed_by uuid references public.members(id),
  replied_at timestamptz,
  replied_by uuid references public.members(id),
  closed_at timestamptz,
  closed_by uuid references public.members(id),
  note text,
  updated_at timestamptz not null default now(),
  primary key (source, source_id)
);
alter table public.ve_inbox_state enable row level security;

-- Every request, newest first. Tests, LESARUSS.ai's own items and plain link clicks stay out (a click is a lead, not a request).
create or replace function public.ve_inbox_items(p_since timestamptz default now() - interval '120 days')
returns table (source text, source_id uuid, created_at timestamptz, kind text, title text, summary text, member_id uuid,
  name text, email text, chapter text, link text)
language sql stable security definer set search_path = public as $$
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
$$;
revoke all on function public.ve_inbox_items(timestamptz) from public, anon, authenticated;
