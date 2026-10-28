-- Member profiles, phase 3: the campaign window (playbook ve-member-profiles-partner-windows, locked by Sean 2026-10-28; Sean:
-- "go ahead with phase 3"). Safe to run twice.
--
-- Saving a listing is a bookmark, never consent. When a member saves a listing a business has claimed (listings.owner_member_id),
-- they are offered an unticked "Let <name> message me during their campaigns" (ve_listing_optins), 25 points once per listing
-- (ve_points_grant reason partner_optin, ref optin:listing:<id>). Unsaving withdraws it. A campaign is a run of dates the team sets
-- for a listing (ve_listing_campaigns, Depot > Brand campaigns): while one is live, the owner sees the shown profile parts of the
-- members who said yes and can message them through us (1 a week, 4 a campaign, until the campaign's last day). Outside a campaign,
-- and for everyone who did not say yes, the owner sees counts by chapter, never names. Stop withdraws the yes; Report pauses the
-- campaign until the team resumes it.

-- 1. The yes to a listing.
create table if not exists public.ve_listing_optins (
  member_id uuid not null references public.members(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  primary key (member_id, listing_id)
);
alter table public.ve_listing_optins enable row level security;
comment on table public.ve_listing_optins is 'The member said this listing''s owner may message them through Vegans Explore during its campaigns (unticked box at save). withdrawn_at: they took it back, unsaved, stopped it from a message, or reported one.';

-- 2. A campaign's run of dates (Eastern days, both ends included).
create table if not exists public.ve_listing_campaigns (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  note text,
  created_by uuid references public.members(id),
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  paused_at timestamptz,
  paused_reason text,
  constraint ve_listing_campaigns_dates check (ends_on >= starts_on)
);
alter table public.ve_listing_campaigns enable row level security;
create index if not exists ve_listing_campaigns_listing_idx on public.ve_listing_campaigns (listing_id, starts_on);
comment on table public.ve_listing_campaigns is 'A brand''s campaign window (Depot > Brand campaigns): from starts_on to ends_on (Eastern) its owner may message the members who said yes. ended_at: the team ended it early. paused_at: a member''s report.';

create table if not exists public.ve_campaign_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ve_listing_campaigns(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  sender_id uuid not null references public.members(id),
  body text not null,
  recipients integer not null default 0,
  sent integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.ve_campaign_messages enable row level security;

create table if not exists public.ve_campaign_message_deliveries (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.ve_campaign_messages(id) on delete cascade,
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
alter table public.ve_campaign_message_deliveries enable row level security;

-- 3. Unsaving takes the yes back.
create or replace function public.ve_listing_save_removed()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  update ve_listing_optins set withdrawn_at = now() where member_id = old.member_id and listing_id = old.listing_id and withdrawn_at is null;
  return old;
end $$;
drop trigger if exists trg_ve_listing_save_removed on public.ve_listing_saves;
create trigger trg_ve_listing_save_removed after delete on public.ve_listing_saves for each row execute function public.ve_listing_save_removed();

-- 4. The live campaign, if any: today (Eastern) inside its dates, not ended early.
create or replace function public.ve_listing_campaign_live(p_listing uuid)
returns uuid language sql stable security definer set search_path to 'public' as $$
  select c.id from ve_listing_campaigns c
  where c.listing_id = p_listing and c.ended_at is null
    and (now() at time zone 'America/New_York')::date between c.starts_on and c.ends_on
  order by c.starts_on limit 1;
$$;
revoke all on function public.ve_listing_campaign_live(uuid) from public, anon, authenticated;

-- 5. Who a campaign message reaches: said yes, still saved, not taken back.
create or replace function public.ve_listing_audience(p_listing uuid)
returns setof uuid language sql stable security definer set search_path to 'public' as $$
  select o.member_id from ve_listing_optins o
  join members m on m.id = o.member_id and m.merged_into_member_id is null
  where o.listing_id = p_listing and o.withdrawn_at is null
    and exists (select 1 from ve_listing_saves s where s.member_id = o.member_id and s.listing_id = p_listing);
$$;
revoke all on function public.ve_listing_audience(uuid) from public, anon, authenticated;

-- 6. What one member sees at save, and in My Saves.
create or replace function public.ve_listing_optin_state(p_listing uuid, p_member uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'claimed', l.owner_member_id is not null and l.status = 'approved',
    'name', l.name,
    'saved', exists (select 1 from ve_listing_saves s where s.listing_id = l.id and s.member_id = p_member),
    'optin', exists (select 1 from ve_listing_optins o where o.listing_id = l.id and o.member_id = p_member and o.withdrawn_at is null),
    'optin_paid', exists (select 1 from points_ledger x where x.member_id = p_member and x.reason = 'partner_optin' and x.ref_id = 'optin:listing:' || l.id),
    'campaign', (select jsonb_build_object('name', c.name, 'ends_on', c.ends_on) from ve_listing_campaigns c where c.id = ve_listing_campaign_live(l.id)))
  from listings l where l.id = p_listing;
$$;
revoke all on function public.ve_listing_optin_state(uuid, uuid) from public, anon, authenticated;

-- 7. Say yes or take it back. Only a paid member, only a claimed listing, and the yes only while it is saved. 25 points once.
create or replace function public.ve_listing_optin_set(p_member uuid, p_listing uuid, p_on boolean)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_grant jsonb := null; v_state jsonb;
begin
  if not exists (select 1 from members where id = p_member and membership_status = 'active' and coalesce(membership_tier, '') <> 'guest'
                   and coalesce(member_class, 'member') <> 'agent') then
    return jsonb_build_object('error', 'not_eligible');
  end if;
  v_state := ve_listing_optin_state(p_listing, p_member);
  if v_state is null then return jsonb_build_object('error', 'not_found'); end if;
  if coalesce(p_on, false) then
    if not (v_state ->> 'claimed')::boolean then return jsonb_build_object('error', 'not_claimed'); end if;
    if not (v_state ->> 'saved')::boolean then return jsonb_build_object('error', 'not_saved'); end if;
    insert into ve_listing_optins (member_id, listing_id) values (p_member, p_listing)
    on conflict (member_id, listing_id) do update set withdrawn_at = null,
      created_at = case when ve_listing_optins.withdrawn_at is not null then now() else ve_listing_optins.created_at end;
    v_grant := ve_points_grant(p_member, 25, 'partner_optin', 'optin:listing:' || p_listing);
  else
    update ve_listing_optins set withdrawn_at = now() where member_id = p_member and listing_id = p_listing and withdrawn_at is null;
  end if;
  return ve_listing_optin_state(p_listing, p_member) || jsonb_build_object('points_now', coalesce((v_grant ->> 'granted')::boolean, false));
end $$;
revoke all on function public.ve_listing_optin_set(uuid, uuid, boolean) from public, anon, authenticated;

-- 8. Counts and segments for the owner, never names: saved and said yes, in all and by home chapter.
create or replace function public.ve_listing_segments(p_listing uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  with s as (
    select m.id, coalesce(nullif(m.home_community, ''), 'none') as chapter,
      exists (select 1 from ve_listing_audience(p_listing) a(id) where a.id = m.id) as yes
    from ve_listing_saves x join members m on m.id = x.member_id and m.merged_into_member_id is null
    where x.listing_id = p_listing)
  select jsonb_build_object(
    'saved', (select count(*) from s),
    'opted_in', (select count(*) from s where yes),
    'by_chapter', coalesce((select jsonb_agg(jsonb_build_object('chapter', chapter, 'saved', n, 'opted_in', y) order by n desc, chapter)
      from (select chapter, count(*) n, count(*) filter (where yes) y from s group by chapter) g), '[]'::jsonb));
$$;
revoke all on function public.ve_listing_segments(uuid) from public, anon, authenticated;

-- 9. The playbook's Work Queue: phase 3 done, logged.
update public.briefings set
  content = replace(replace(replace(replace(content,
    '<details class="held" open><summary>Phase 3 is next <span class="grp-count">0</span></summary><div class="body"><p class="empty-state">Phases 1 and 2 shipped October 28, 2026 (see Completed).</p></div></details>',
    '<details class="held" open><summary>Phase 4 is next <span class="grp-count">0</span></summary><div class="body"><p class="empty-state">Phases 1 to 3 shipped October 28, 2026 (see Completed). Phase 4 waits until the first windows have run.</p></div></details>'),
    '<details class="held"><summary>Phase 3: the campaign window',
    '<details class="held" hidden><summary>Phase 3: the campaign window'),
    '<button class="tab-btn" role="tab" aria-selected="true" data-tab="pending">Pending <span class="count">2</span></button>',
    '<button class="tab-btn" role="tab" aria-selected="true" data-tab="pending">Pending <span class="count">1</span></button>'),
    'Depot &gt; Events</span></li>',
    'Depot &gt; Events</span></li>' || chr(10) ||
    '      <li class="chk-item done"><span class="chk-box">&#10003;</span><span>Phase 3 (October 28, 2026): an unticked, rewarded yes when saving a claimed listing (25 points); campaign dates set by the team in Depot &gt; Brand campaigns; during a campaign the owner sees the shown profile parts of those who said yes and messages them through us (1 a week, 4 a campaign); counts by chapter for everyone else, never names (the dashboard''s Saves no longer names savers); Stop and Report, a report pausing the campaign</span></li>'),
  status_summary = 'Phases 1 to 3 shipped October 28, 2026: the switches and team view, the event window, and the campaign window. Phase 4, a one-time message to past guests, waits until the first windows have run.',
  status_summary_updated_at = now(), updated_at = now()
where slug = 've-member-profiles-partner-windows' and content not like '%Phase 3 (October 28, 2026)%';

update public.briefings set content = replace(content, 'data-tab="done">Completed <span class="count">4</span></button>', 'data-tab="done">Completed <span class="count">5</span></button>')
where slug = 've-member-profiles-partner-windows' and content like '%Phase 3 (October 28, 2026)%' and content like '%Completed <span class="count">4</span>%';

insert into public.playbook_records (slug, brand_slug, author, kind, source, body)
select 've-member-profiles-partner-windows', 'vegans-explore', 'Logan', 'edit', 'text',
  'Phase 3 shipped (Sean: "go ahead with phase 3"). Saving a claimed listing offers an unticked "Let <name> message me during their campaigns" (ve_listing_optins), 25 points once per listing; unsaving withdraws it. The team sets a campaign''s dates in Depot > Brand campaigns (ve_listing_campaigns). While one is live the owner sees, on the business dashboard''s Your audience, the shown profile parts of those who said yes and messages them through us (ve_campaign_messages, ve_campaign_message_deliveries): 1 a week, 4 a campaign, never an email address either way. Outside a campaign, and for everyone who did not say yes, counts by chapter only; the dashboard''s Saves view no longer names savers (it did since 2026-10-27, against the locked rule). Stop withdraws the yes; Report pauses the campaign until the team resumes it. Defaults set by Logan, Sean''s to change: unticked, 25 points, 1 a week and 4 a campaign, 1,000 characters. Migration 20261028_campaign_window.sql.'
where not exists (select 1 from public.playbook_records where slug = 've-member-profiles-partner-windows' and body like 'Phase 3 shipped%');
