-- The Vegan Events Guide (built 2026-11-01, Sean: "Logan, build the Events Guide"; canon canon-ve-events-guide, playbook ve-events-guide).
-- Page guides/vegan-events-guide.html, script guide-scripts/vegan-events-guide.js, River narrating in text, edge function ve-events-guide.
-- $11 or 1,100 points like every Guide; included for Group Partner leads (the Nonprofit Guide's rule for its partners). Its members-only
-- text is ve_guides.content_html, written from the session, never kept in this repo. Safe to run twice.

-- 1. The Guide's row: published so ve-guide-unlock sells and opens it; the page stays noindex and Coming soon until Sean launches it.
insert into ve_guides (title, slug, description, cost_lesars, published, access_rule, sort_order)
select 'The Vegan Events Guide', 'vegan-events-guide',
       'Everything it takes to host a Vegan event that people come back to: the kinds of events, a countdown plan, the money, venues and vendors from our Directory, the gear, getting the word out, the day itself, what to do when it rains, and the questions nobody asks out loud. With River.',
       1100, true, 'points', 9
where not exists (select 1 from ve_guides where slug = 'vegan-events-guide');

-- 2. Sean's own copy, to review it before launch.
insert into ve_guide_purchases (member_id, guide_id, lesars_spent, paid_with)
select '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, g.id, 0, 'comp' from ve_guides g where g.slug = 'vegan-events-guide'
on conflict (member_id, guide_id) do nothing;

-- 3. Group Partner leads have it included: every lead of a group that is onboarding or active owns it, and a new lead gets it when
--    the partnership starts (the Nonprofit Guide's way: a ve_guide_purchases row, paid_with 'group_partner').
insert into ve_guide_purchases (member_id, guide_id, lesars_spent, paid_with)
select gp.lead_member_id, g.id, 0, 'group_partner'
from ve_group_partners gp cross join ve_guides g
where g.slug = 'vegan-events-guide' and gp.lead_member_id is not null and gp.status in ('onboarding', 'active')
on conflict (member_id, guide_id) do nothing;

create or replace function public.ve_events_guide_for_lead() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.lead_member_id is not null and new.status in ('onboarding', 'active') then
    insert into ve_guide_purchases (member_id, guide_id, lesars_spent, paid_with)
    select new.lead_member_id, g.id, 0, 'group_partner' from ve_guides g where g.slug = 'vegan-events-guide'
    on conflict (member_id, guide_id) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists trg_ve_events_guide_for_lead on ve_group_partners;
create trigger trg_ve_events_guide_for_lead after insert or update of lead_member_id, status on ve_group_partners
  for each row execute function public.ve_events_guide_for_lead();

-- 4. Event sponsorships: we sponsor in marketing, never cash (canon). One row per application, read only by the server.
create table if not exists public.ve_event_sponsor_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  member_id uuid references members(id) on delete set null,
  event_name text not null,
  event_date date,
  chapter text,
  city text,
  host_name text not null,
  host_email text not null,
  host_org text,
  event_id uuid references events(id) on delete set null,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'reviewing', 'approved', 'declined')),
  decision_note text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  bounty_id uuid references ve_bounties(id) on delete set null
);
alter table public.ve_event_sponsor_applications enable row level security;
create index if not exists ve_event_sponsor_applications_status on public.ve_event_sponsor_applications (status, created_at desc);

-- 5. Host stories: six questions answered by voice (canon). The audio sits in the private bucket event-host-stories; approved ones may be
--    played in the Guide (signed links) and cut into Host Notes on the podcast. 100 points once, to a member, on approval.
create table if not exists public.ve_event_host_stories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  member_id uuid references members(id) on delete set null,
  name text not null,
  email text not null,
  event_name text,
  chapter text,
  answers jsonb not null default '{}'::jsonb,   -- {q1: {path, seconds}, ...}
  release_at timestamptz not null,
  status text not null default 'new' check (status in ('new', 'approved', 'declined', 'removed')),
  published boolean not null default false,
  decision_note text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  points_paid_at timestamptz
);
alter table public.ve_event_host_stories enable row level security;
create index if not exists ve_event_host_stories_status on public.ve_event_host_stories (status, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-host-stories', 'event-host-stories', false, 26214400,
        array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/x-m4a', 'audio/aac', 'audio/wav'])
on conflict (id) do nothing;

-- 6. The points reason for an approved host story.
alter table public.points_ledger drop constraint if exists points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check check (reason = any (array['signup','referral','daily_login','listing_like',
  'listing_create','discussion_post','discussion_reply','discussion_vote','event_attend','profile_complete','profile_field','admin_adjust','purchase',
  'redemption','vote_given','vote_received','vote_refunded','featured_purchase','transfer_sent','transfer_received','store_purchase','store_refund',
  'points_purchase','bartering','boost_purchase','seed_initial','Welcome bonus + early activity','campaign_back','questionnaire','wizard_redeem',
  've_hunt_complete','ve_hunt_anchor','guide_redeem','cycle_grant','bounty','comp_membership','recipe_approved','guide_chat_spend','credit_exchange',
  'checkin','welcome','purchase_thanks','points_contribution','listing_submit','profile_answer','partner_optin','venue_report','nonprofit_survey',
  'barcode_add','challenge','challenge_passport','host_story'])) not valid;

-- 7. The gear shop: every item a tracked /go/ link (ve-links adds our Amazon tag, vegansexplore-20). Searches, not one product, so a
--    link never points at something sold out.
insert into ve_links (code, label, destination, initiative_slug, tags, channel, active)
select v.code, v.label, 'https://www.amazon.com/s?k=' || replace(v.q, ' ', '+'), 'vegan-events-guide', array['events-guide', 'gear'], 'guide', true
from (values
  ('ev-gear-canopy', 'Events Guide gear: 10x10 pop-up canopy', '10x10 pop up canopy tent commercial'),
  ('ev-gear-weights', 'Events Guide gear: canopy weights', 'canopy weights set of 4'),
  ('ev-gear-sidewalls', 'Events Guide gear: canopy sidewalls', '10x10 canopy sidewalls'),
  ('ev-gear-tarp', 'Events Guide gear: tarps', 'heavy duty waterproof tarp'),
  ('ev-gear-tubs', 'Events Guide gear: storage tubs with lids', 'plastic storage tote with lid stackable'),
  ('ev-gear-fan', 'Events Guide gear: battery fan', 'rechargeable battery outdoor fan'),
  ('ev-gear-cooler', 'Events Guide gear: cooler', 'rolling cooler large'),
  ('ev-gear-water', 'Events Guide gear: water dispenser', 'water jug dispenser with spigot 5 gallon'),
  ('ev-gear-power-station', 'Events Guide gear: portable power station', 'portable power station'),
  ('ev-gear-cords', 'Events Guide gear: outdoor extension cords', 'outdoor extension cord 50 ft weatherproof'),
  ('ev-gear-cord-cover', 'Events Guide gear: cord cover', 'cable protector cord cover floor'),
  ('ev-gear-lights', 'Events Guide gear: string lights', 'outdoor string lights commercial grade'),
  ('ev-gear-lantern', 'Events Guide gear: battery lanterns', 'battery powered led lantern'),
  ('ev-gear-power-bank', 'Events Guide gear: power banks', 'power bank fast charging'),
  ('ev-gear-table', 'Events Guide gear: folding tables', '6 ft folding table'),
  ('ev-gear-tablecloth', 'Events Guide gear: fitted tablecloths', '6 ft fitted tablecloth'),
  ('ev-gear-risers', 'Events Guide gear: display risers', 'display risers for vendor table'),
  ('ev-gear-chairs', 'Events Guide gear: folding chairs', 'folding chairs'),
  ('ev-gear-wagon', 'Events Guide gear: folding wagon', 'collapsible folding wagon heavy duty'),
  ('ev-gear-hand-truck', 'Events Guide gear: hand truck', 'folding hand truck dolly'),
  ('ev-gear-bungees', 'Events Guide gear: bungee cords and zip ties', 'bungee cords and zip ties assortment'),
  ('ev-gear-card-reader', 'Events Guide gear: card reader', 'square reader'),
  ('ev-gear-cash-box', 'Events Guide gear: cash box', 'cash box with lock'),
  ('ev-gear-clicker', 'Events Guide gear: tally counter', 'hand tally counter clicker'),
  ('ev-gear-wristbands', 'Events Guide gear: event wristbands', 'event wristbands'),
  ('ev-gear-first-aid', 'Events Guide gear: first aid kit', 'first aid kit large'),
  ('ev-gear-extinguisher', 'Events Guide gear: fire extinguisher', 'fire extinguisher'),
  ('ev-gear-sanitizer', 'Events Guide gear: hand sanitizer station', 'hand sanitizer stand dispenser'),
  ('ev-gear-trash', 'Events Guide gear: trash and recycling bins', 'collapsible trash can outdoor'),
  ('ev-gear-megaphone', 'Events Guide gear: speaker with microphone', 'portable pa speaker with wireless microphone'),
  ('ev-gear-sign-stand', 'Events Guide gear: sign stand', 'a frame sidewalk sign'),
  ('ev-gear-banner', 'Events Guide gear: banner with grommets', 'custom vinyl banner with grommets'),
  ('ev-gear-qr-stand', 'Events Guide gear: QR code sign holder', 'acrylic sign holder 8.5 x 11'),
  ('ev-gear-name-tags', 'Events Guide gear: name tags', 'name tag stickers')
) as v(code, label, q)
where not exists (select 1 from ve_links l where l.code = v.code);

-- 8. The Inbox: every sponsorship application and host story (ve_inbox_items gains two sources; the rest is unchanged).
create or replace function public.ve_inbox_items(p_since timestamp with time zone default (now() - '120 days'::interval))
 returns table(source text, source_id uuid, created_at timestamp with time zone, kind text, title text, summary text, member_id uuid, name text, email text, chapter text, link text)
 language sql stable security definer set search_path to 'public'
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
    case when i.initiative_slug = 'branddesk' then 'Managed marketing request'
      when i.action_type = 'sponsor_tier' then 'Sponsor interest' when i.action_type = 'ticket' then 'Ticket interest'
      else initcap(replace(coalesce(i.action_type, 'interest'), '_', ' ')) end,
    case when i.initiative_slug = 'branddesk' then coalesce(nullif(i.tier_label, ''), 'Managed marketing')
      else initcap(replace(regexp_replace(coalesce(i.initiative_slug, ''), '^vegans-explore-initiative-', ''), '-', ' ')) end,
    case when i.initiative_slug = 'branddesk' then left(i.note, 200) else coalesce(nullif(i.tier_label, ''), left(i.note, 200)) end,
    i.member_id, i.name, i.email, null, '/dashboard/leads'
  from ve_initiative_interest i
  where coalesce(i.action_type, '') <> 'link_click' and i.created_at >= p_since
    and not (i.initiative_slug = 'branddesk' and coalesce(i.tier_label, '') like '[TEST]%')
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
  select 'profile_claim', c.id, c.created_at, case when c.source = 'page' then 'Is this you? (profile claim)' else 'Profile request' end, coalesce(l.name, c.new_profile->>'name'), left(c.note, 200),
    c.member_id, c.contact_name, c.contact_email, null, '/admin/depot/ambassadors#door'
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
  union all
  select 'branddesk_pitch', p.id, p.choice_at,
    case p.choice when 'ready' then 'BrandDesk: ready to start' when 'think' then 'BrandDesk: thinking it over' when 'talk' then 'BrandDesk: wants to talk' else 'BrandDesk: not now' end,
    l.name, left(concat_ws(' · ', case when p.follow_up_on is not null then 'Follow up ' || to_char(p.follow_up_on, 'Mon DD') end, nullif(p.choice_note, '')), 200),
    null, p.contact_name, p.contact_email, ve_chapter_of(l.address_city, l.address_state), '/admin/depot/branddesk#pitch/' || l.slug
  from ve_branddesk_pitches p join listings l on l.id = p.listing_id
  where p.choice is not null and p.choice_at >= p_since and coalesce(p.contact_name, '') not like '[TEST]%'
  union all
  select 'event_sponsorship', s.id, s.created_at, 'Event sponsorship application', s.event_name,
    nullif(concat_ws(' · ', nullif(s.city, ''), to_char(s.event_date, 'Mon DD'), nullif(s.answers->>'crowd', '')), ''),
    s.member_id, s.host_name, s.host_email, s.chapter, '/admin/depot/event-sponsors#app/' || s.id
  from ve_event_sponsor_applications s
  where s.created_at >= p_since and s.event_name not like '[TEST]%'
  union all
  select 'host_story', h.id, h.created_at, 'Host story (voice)', coalesce(nullif(h.event_name, ''), h.name),
    (select count(*) from jsonb_object_keys(h.answers))::text || ' answers recorded', h.member_id, h.name, h.email, h.chapter,
    '/admin/depot/event-sponsors#story/' || h.id
  from ve_event_host_stories h
  where h.created_at >= p_since and h.name not like '[TEST]%'
  order by 3 desc;
$function$;
