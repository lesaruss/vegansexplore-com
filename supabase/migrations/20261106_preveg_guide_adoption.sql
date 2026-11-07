-- vegans-explore-initiative-business-certification: measure Guide adoption (Sean approved 2026-11-06,
-- docs/proposals/pre-vegan-guide-gate-howtos.md). Canon v9: a kitchen that only uses the free Guide is a success.
-- Readiness is private: the team sees counts only, never a named restaurant's score.

create table if not exists ve_preveg_readiness_snaps (
  id bigserial primary key,
  member_id uuid not null references members(id) on delete cascade,
  at timestamptz not null default now(),
  day date not null default (now() at time zone 'America/New_York')::date,
  is_first boolean not null default false,
  overall_pct int,
  gates jsonb,
  blockers int not null default 0,
  answered int not null default 0,
  ready boolean not null default false
);
create index if not exists ve_preveg_snaps_member on ve_preveg_readiness_snaps (member_id, at desc);
alter table ve_preveg_readiness_snaps enable row level security;

-- One snapshot when the assessment is first finished, then at most one a member a day as answers change
-- (the day's row is updated; the first row is never overwritten).
create or replace function ve_preveg_snap(p_member uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r jsonb; last_row ve_preveg_readiness_snaps; today date := (now() at time zone 'America/New_York')::date;
begin
  if not exists (select 1 from ve_survey_completions where member_id = p_member and survey_slug = 'pre-vegan-assessment') then return; end if;
  r := ve_preveg_readiness(p_member);
  select * into last_row from ve_preveg_readiness_snaps where member_id = p_member order by at desc, id desc limit 1;
  if last_row.id is not null and not last_row.is_first and last_row.day = today then
    update ve_preveg_readiness_snaps set at = now(), overall_pct = (r->>'overall_pct')::int, gates = r->'gates',
      blockers = jsonb_array_length(coalesce(r->'blockers','[]'::jsonb)), answered = (r->>'answered')::int,
      ready = coalesce((r->>'ready_to_apply')::boolean, false)
    where id = last_row.id;
  else
    insert into ve_preveg_readiness_snaps (member_id, is_first, overall_pct, gates, blockers, answered, ready)
    values (p_member, last_row.id is null, (r->>'overall_pct')::int, r->'gates',
      jsonb_array_length(coalesce(r->'blockers','[]'::jsonb)), (r->>'answered')::int, coalesce((r->>'ready_to_apply')::boolean, false));
  end if;
end $$;
revoke all on function ve_preveg_snap(uuid) from public, anon, authenticated;

create or replace function ve_preveg_snap_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.survey_slug = 'pre-vegan-assessment' then
    begin perform ve_preveg_snap(new.member_id); exception when others then null; end;  -- never block an answer
  end if;
  return new;
end $$;
drop trigger if exists trg_ve_preveg_snap_answer on ve_survey_answers;
create trigger trg_ve_preveg_snap_answer after insert or update on ve_survey_answers for each row execute function ve_preveg_snap_trg();
drop trigger if exists trg_ve_preveg_snap_done on ve_survey_completions;
create trigger trg_ve_preveg_snap_done after insert on ve_survey_completions for each row execute function ve_preveg_snap_trg();

-- Backfill anyone who already finished (0 on 2026-11-06).
select ve_preveg_snap(member_id) from ve_survey_completions c
where survey_slug = 'pre-vegan-assessment' and not exists (select 1 from ve_preveg_readiness_snaps s where s.member_id = c.member_id);

-- Counts only. Members whose first finish falls in the window, compared first snapshot against latest.
create or replace function ve_preveg_adoption(p_from timestamptz default null, p_to timestamptz default null)
returns jsonb language sql stable security definer set search_path = public as $$
with f as (
  select distinct on (member_id) member_id, at, overall_pct, gates, blockers, ready
  from ve_preveg_readiness_snaps where is_first order by member_id, at
), w as (
  select * from f where (p_from is null or at >= p_from) and (p_to is null or at < p_to)
), l as (
  select distinct on (s.member_id) s.member_id, s.at, s.overall_pct, s.gates, s.blockers, s.ready, (select count(*) from ve_preveg_readiness_snaps x where x.member_id = s.member_id) n
  from ve_preveg_readiness_snaps s join w on w.member_id = s.member_id order by s.member_id, s.at desc, s.id desc
), j as (
  select w.member_id, w.at first_at, w.overall_pct first_pct, w.gates first_gates, w.blockers first_blockers, w.ready first_ready,
         l.at last_at, l.overall_pct last_pct, l.gates last_gates, l.blockers last_blockers, l.ready last_ready, l.n,
         exists (select 1 from listings li join ve_preveg_certs c on c.listing_id = li.id where li.owner_member_id = w.member_id) applied,
         (select min(s.at) from ve_preveg_readiness_snaps s where s.member_id = w.member_id and s.ready) ready_at
  from w join l on l.member_id = w.member_id
), g as (
  select fg->>'gate' gate, count(*) filter (where (lg->>'pct')::int > (fg->>'pct')::int) improved
  from j cross join lateral jsonb_array_elements(coalesce(j.first_gates,'[]'::jsonb)) fg
  join lateral jsonb_array_elements(coalesce(j.last_gates,'[]'::jsonb)) lg on lg->>'gate' = fg->>'gate'
  group by 1
), t as (
  select split_part(item_key, '-', 1) gate, count(*) ticks, count(distinct member_id) members
  from ve_guide_saves where guide_slug = 'pre-vegan-restaurant-guide' and kind = 'fix'
    and (p_from is null or created_at >= p_from) and (p_to is null or created_at < p_to)
  group by 1
)
select jsonb_build_object(
  'started', (select count(*) from j),
  'came_back', (select count(*) from j where n > 1),
  'moved_up', (select count(*) from j where coalesce(last_pct,0) > coalesce(first_pct,0)),
  'cleared_a_blocker', (select count(*) from j where last_blockers < first_blockers),
  'reached_ready', (select count(*) from j where not first_ready and last_ready),
  'ready_now', (select count(*) from j where last_ready),
  'ready_without_applying', (select count(*) from j where last_ready and not applied),
  'applied', (select count(*) from j where applied),
  'median_days_to_ready', (select round((percentile_cont(0.5) within group (order by extract(epoch from ready_at - first_at) / 86400))::numeric, 1) from j where ready_at is not null and not first_ready),
  'gates_improved', coalesce((select jsonb_object_agg(gate, improved) from g), '{}'::jsonb),
  'ticks_by_gate', coalesce((select jsonb_object_agg(gate, jsonb_build_object('ticks', ticks, 'members', members)) from t), '{}'::jsonb),
  'certificates', (select count(*) from ve_preveg_certs)
);
$$;
revoke all on function ve_preveg_adoption(timestamptz, timestamptz) from public, anon, authenticated;
