-- Member profiles, phase 2: the event window (playbook ve-member-profiles-partner-windows, locked by Sean 2026-10-28; Sean: "go
-- ahead with phase 2"). Safe to run twice.
--
-- A member RSVPs to an event on our calendar (event_rsvps, which had never been used: every RSVP button linked out to the
-- ticket page). When the event has an organizer, the RSVP offers an unticked box, "Let <organizer> message me about this
-- event", rewarded with 25 points once per event (ve_points_grant, reason partner_optin, ref optin:<event>). An organizer
-- (ve_event_organizers: the member who sent the event as its host or promoter, once approved, or anyone the team adds) sees
-- how many are going and, of those who said yes, their profile as ve_profile_public shows it (first name, last initial and the
-- answers they marked Can be shown), and can message them through us: from Vegans Explore with the organizer's name, never an
-- email address either way, 3 messages per event at least 24 hours apart, until 7 days after the event (ve_event_window_open).
-- Every message and delivery is logged. A guest can stop an organizer's messages (ve_partner_mutes, every event of theirs) or
-- report a message, which pauses that organizer everywhere until the team resumes them in Depot > Events.

-- 0. The ledger takes the opt-in reward.
alter table public.points_ledger drop constraint if exists points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check check (reason = any (array['signup', 'referral', 'daily_login',
  'listing_like', 'listing_create', 'discussion_post', 'discussion_reply', 'discussion_vote', 'event_attend', 'profile_complete',
  'profile_field', 'admin_adjust', 'purchase', 'redemption', 'vote_given', 'vote_received', 'vote_refunded', 'featured_purchase',
  'transfer_sent', 'transfer_received', 'store_purchase', 'store_refund', 'points_purchase', 'bartering', 'boost_purchase',
  'seed_initial', 'Welcome bonus + early activity', 'campaign_back', 'questionnaire', 'wizard_redeem', 've_hunt_complete',
  've_hunt_anchor', 'guide_redeem', 'cycle_grant', 'bounty', 'comp_membership', 'recipe_approved', 'guide_chat_spend',
  'credit_exchange', 'checkin', 'welcome', 'purchase_thanks', 'points_contribution', 'listing_submit', 'profile_answer',
  'partner_optin'])) not valid;

-- 1. The RSVP carries the yes to the organizer.
alter table public.event_rsvps add column if not exists optin boolean not null default false;
alter table public.event_rsvps add column if not exists optin_at timestamptz;
alter table public.event_rsvps add column if not exists updated_at timestamptz not null default now();
comment on column public.event_rsvps.optin is 'The guest said the event''s organizer may message them through Vegans Explore (an unticked box at the RSVP). Phase 2 of ve-member-profiles-partner-windows.';

-- 2. Who organizes an event, and who has been paused.
create table if not exists public.ve_event_organizers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  name text not null,
  added_by uuid references public.members(id),
  created_at timestamptz not null default now(),
  paused_at timestamptz,
  paused_reason text,
  unique (event_id, member_id)
);
alter table public.ve_event_organizers enable row level security;
comment on table public.ve_event_organizers is 'An event''s organizer: may message the guests who said yes, through ve-events, while the window is open. name is how guests see them. paused_at is set by a guest''s report and cleared by the team.';

-- 3. Messages and who each one went to. A delivery's token is the guest's link to read it, stop the organizer or report it.
create table if not exists public.ve_event_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organizer_id uuid not null references public.ve_event_organizers(id) on delete cascade,
  sender_id uuid not null references public.members(id),
  body text not null,
  recipients integer not null default 0,
  sent integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.ve_event_messages enable row level security;
create index if not exists ve_event_messages_event_idx on public.ve_event_messages (event_id, created_at desc);

create table if not exists public.ve_event_message_deliveries (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.ve_event_messages(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  token text not null unique default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  email_status text not null default 'queued',
  email_id text,
  sent_at timestamptz,
  read_at timestamptz,
  reported_at timestamptz,
  report_note text,
  created_at timestamptz not null default now(),
  unique (message_id, member_id)
);
alter table public.ve_event_message_deliveries enable row level security;

create table if not exists public.ve_partner_mutes (
  member_id uuid not null references public.members(id) on delete cascade,
  organizer_member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, organizer_member_id)
);
alter table public.ve_partner_mutes enable row level security;
comment on table public.ve_partner_mutes is 'A guest stopped messages from this organizer (every event of theirs). Phase 2 of ve-member-profiles-partner-windows.';

-- 4. The window: open until 7 days after the event ends (or starts, with no end).
create or replace function public.ve_event_window_open(p_event uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select coalesce((select now() <= coalesce(e.ends_at, e.starts_at) + interval '7 days' from events e where e.id = p_event), false);
$$;
revoke all on function public.ve_event_window_open(uuid) from public, anon, authenticated;

-- 5. RSVP, and the yes to the organizer. Going false cancels the RSVP and the yes. Only a paid member, only a live event that
--    is not over, and the yes only when the event has an organizer. The 25 points come once per event.
create or replace function public.ve_event_rsvp(p_member uuid, p_event uuid, p_going boolean, p_optin boolean)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_ev record;
  v_has_org boolean;
  v_optin boolean;
  v_grant jsonb := null;
  v_was boolean;
begin
  if not exists (select 1 from members where id = p_member and membership_status = 'active' and coalesce(membership_tier, '') <> 'guest'
                   and coalesce(member_class, 'member') <> 'agent') then
    return jsonb_build_object('error', 'not_eligible');
  end if;
  select id, tenant_id, status, starts_at, ends_at into v_ev from events where id = p_event;
  if v_ev.id is null or v_ev.status <> 'approved' then return jsonb_build_object('error', 'not_found'); end if;
  v_has_org := exists (select 1 from ve_event_organizers where event_id = p_event);
  v_optin := coalesce(p_going, false) and coalesce(p_optin, false) and v_has_org;

  if coalesce(p_going, false) then
    if coalesce(v_ev.ends_at, v_ev.starts_at + interval '6 hours') < now() then return jsonb_build_object('error', 'over'); end if;
    select optin into v_was from event_rsvps where event_id = p_event and member_id = p_member;
    insert into event_rsvps (event_id, member_id, tenant_id, status, optin, optin_at, updated_at)
    values (p_event, p_member, v_ev.tenant_id, 'going', v_optin, case when v_optin then now() end, now())
    on conflict (event_id, member_id) do update set status = 'going', optin = excluded.optin,
      optin_at = case when excluded.optin and not coalesce(event_rsvps.optin, false) then now() else event_rsvps.optin_at end, updated_at = now();
    if v_optin then v_grant := ve_points_grant(p_member, 25, 'partner_optin', 'optin:' || p_event); end if;
  else
    update event_rsvps set status = 'cancelled', optin = false, updated_at = now() where event_id = p_event and member_id = p_member;
  end if;

  return ve_event_viewer(p_event, p_member) || jsonb_build_object('points_now', coalesce((v_grant ->> 'granted')::boolean, false));
end $$;
revoke all on function public.ve_event_rsvp(uuid, uuid, boolean, boolean) from public, anon, authenticated;

-- 6. An event as one viewer sees it: how many are going, its organizer's name, and (signed in) their RSVP and whether they
--    organize it.
create or replace function public.ve_event_viewer(p_event uuid, p_member uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'going_count', (select count(*) from event_rsvps r where r.event_id = p_event and r.status = 'going'),
    'organizer', (select o.name from ve_event_organizers o where o.event_id = p_event order by o.created_at limit 1),
    'going', coalesce((select r.status = 'going' from event_rsvps r where r.event_id = p_event and r.member_id = p_member), false),
    'optin', coalesce((select r.status = 'going' and r.optin from event_rsvps r where r.event_id = p_event and r.member_id = p_member), false),
    'optin_paid', exists (select 1 from points_ledger l where l.member_id = p_member and l.reason = 'partner_optin' and l.ref_id = 'optin:' || p_event),
    'organizes', exists (select 1 from ve_event_organizers o where o.event_id = p_event and o.member_id = p_member),
    'window_open', ve_event_window_open(p_event));
$$;
revoke all on function public.ve_event_viewer(uuid, uuid) from public, anon, authenticated;

-- 7. Who an organizer's message reaches: going, said yes, and has not stopped this organizer.
create or replace function public.ve_event_audience(p_event uuid, p_organizer_member uuid)
returns setof uuid language sql stable security definer set search_path to 'public' as $$
  select r.member_id from event_rsvps r
  join members m on m.id = r.member_id and m.merged_into_member_id is null
  where r.event_id = p_event and r.status = 'going' and r.optin
    and not exists (select 1 from ve_partner_mutes x where x.member_id = r.member_id and x.organizer_member_id = p_organizer_member);
$$;
revoke all on function public.ve_event_audience(uuid, uuid) from public, anon, authenticated;

-- 8. The organizer's view: counts for everyone going, profiles (only what each guest marked Can be shown) for those who said yes.
create or replace function public.ve_event_guests(p_event uuid, p_organizer_member uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'going', (select count(*) from event_rsvps r where r.event_id = p_event and r.status = 'going'),
    'opted_in', (select count(*) from ve_event_audience(p_event, p_organizer_member)),
    'guests', coalesce((select jsonb_agg(ve_profile_public(a.id) order by (ve_profile_public(a.id) ->> 'name'))
      from ve_event_audience(p_event, p_organizer_member) as a(id)), '[]'::jsonb));
$$;
revoke all on function public.ve_event_guests(uuid, uuid) from public, anon, authenticated;

-- 9. The playbook's Work Queue: phase 2 done, logged.
update public.briefings set
  content = replace(replace(replace(replace(content,
    '<details class="held" open><summary>Phase 2 is next <span class="grp-count">0</span></summary><div class="body"><p class="empty-state">Phase 1 shipped October 28, 2026 (see Completed).</p></div></details>',
    '<details class="held" open><summary>Phase 3 is next <span class="grp-count">0</span></summary><div class="body"><p class="empty-state">Phases 1 and 2 shipped October 28, 2026 (see Completed).</p></div></details>'),
    '<details class="held"><summary>Phase 2: the event window',
    '<details class="held" hidden><summary>Phase 2: the event window'),
    '<button class="tab-btn" role="tab" aria-selected="true" data-tab="pending">Pending <span class="count">3</span></button>',
    '<button class="tab-btn" role="tab" aria-selected="true" data-tab="pending">Pending <span class="count">2</span></button>'),
    '<span>Phase 1 (October 28, 2026): Can be shown / Just for Vegans Explore on each answer, the team''s full view in Depot &gt; People &gt; Profiles, and the Policies page</span></li>',
    '<span>Phase 1 (October 28, 2026): Can be shown / Just for Vegans Explore on each answer, the team''s full view in Depot &gt; People &gt; Profiles, and the Policies page</span></li>' || chr(10) ||
    '      <li class="chk-item done"><span class="chk-box">&#10003;</span><span>Phase 2 (October 28, 2026): RSVP on every event on our calendar with an unticked, rewarded yes to its organizer (25 points); the organizer''s guest list (shown answers only); messages through us, 3 per event a day apart, until 7 days after; Stop messages and Report, a report pausing the organizer until the team resumes them in Depot &gt; Events</span></li>'),
  status_summary = 'Phases 1 and 2 shipped October 28, 2026: the switches and team view, then the event window (RSVP, the yes to the organizer, guest list, messages through us, Stop and Report). Phase 3, the campaign window, is next.',
  status_summary_updated_at = now(), updated_at = now()
where slug = 've-member-profiles-partner-windows' and content not like '%Phase 2 (October 28, 2026)%';

update public.briefings set content = replace(content, '<button class="tab-btn" role="tab" aria-selected="false" data-tab="done">Completed <span class="count">3</span></button>',
    '<button class="tab-btn" role="tab" aria-selected="false" data-tab="done">Completed <span class="count">4</span></button>')
where slug = 've-member-profiles-partner-windows' and content like '%Phase 2 (October 28, 2026)%' and content like '%Completed <span class="count">3</span>%';

insert into public.playbook_records (slug, brand_slug, author, kind, source, body)
select 've-member-profiles-partner-windows', 'vegans-explore', 'Logan', 'edit', 'text',
  'Phase 2 shipped (Sean: "go ahead with phase 2"). RSVP on every event on our calendar (event_rsvps); when the event has an organizer (ve_event_organizers: its host or promoter once approved, or added by the team), an unticked "Let <organizer> message me about this event", 25 points once per event (partner_optin). The organizer sees the count going and the shown profile parts of those who said yes, and messages them through us (ve_event_messages, ve_event_message_deliveries): 3 per event at least 24 hours apart, until 7 days after the event, never an email address either way. Stop messages (ve_partner_mutes) and Report, which pauses the organizer until the team resumes them in Depot > Events. Defaults set by Logan, Sean''s to change: unticked everywhere (not only London), 25 points, 3 messages a day apart, 1,000 characters. Migration 20261028_event_window.sql.'
where not exists (select 1 from public.playbook_records where slug = 've-member-profiles-partner-windows' and body like 'Phase 2 shipped%');
