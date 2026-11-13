-- The business dashboard's weekly email (playbook ve-business-dashboard, build step 4; Sean, 2026-11-13: "go ahead with the weekly email").
-- The approved mock (/mocks/business-dashboard, slide 7): each Monday morning, Eastern, every claimed business gets one email: its numbers,
-- new opportunities and new features (messages join when Messages is built); a quiet week sends nothing; every line links into the
-- dashboard through the owner's own tracked link; through email-send with the unsubscribe link and the postal address.
-- Sent by the edge function ve-business-weekly (copied from ve-nurture's pattern). OFF until Sean approves the exact email (its hash) and
-- switches it on: ve_site_settings 'business_weekly' { on, approved_hash, send_hour, per_tick }.
-- Safe to run twice.

create table if not exists public.ve_business_weekly (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  week_of date not null,                       -- the Monday (Eastern) the email is for
  listing_ids uuid[] not null default '{}',
  digest jsonb,
  result text,                                  -- sending | sent | already_sent | suppressed | invalid | failed | quiet | not_sendable
  send_id text,
  created_at timestamptz not null default now(),
  unique (member_id, week_of)
);
alter table public.ve_business_weekly enable row level security;   -- the service role only

insert into public.ve_site_settings (key, value)
values ('business_weekly', jsonb_build_object('on', false, 'approved_hash', null, 'send_hour', 9, 'per_tick', 40))
on conflict (key) do nothing;

-- A listing's kind, the same as ve-claims owner_dashboard's dashKind (keep the two in step).
create or replace function public.ve_listing_dash_kind(p_category text)
returns text language sql immutable as $$
  select case
    when p_category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep') then 'food'
    when p_category = 'Groups' then 'group'
    when p_category in ('Nonprofits', 'Rescues', 'Sanctuaries', 'Events') then 'organization'
    when p_category in ('Podcasts', 'YouTube', 'News Outlets', 'Media') then 'show'
    when p_category in ('Documentaries & Films', 'Books') then 'work'
    when p_category in ('Food Brands', 'Nutrition & Supplements', 'Fitness and Athletics', 'Clothing and Fashion', 'Beauty and Personal Care',
      'E-Commerce & Marketplaces', 'Marketplaces', 'Markets') then 'brand'
    when p_category in ('Activists', 'Content Creators', 'Athletes', 'Physicians', 'Health Experts', 'Chefs', 'Founders', 'Promoters') then 'person'
    else 'service' end;
$$;

-- The owners the weekly email is for: an active member in good standing with an email, owning an approved business listing (not a
-- person's page, which has its own track), never a sample person (aa000000-...) or a [TEST] row.
create or replace function public.ve_business_weekly_owners()
returns table (member_id uuid) language sql stable security definer set search_path = public as $$
  select distinct l.owner_member_id
  from listings l join members m on m.id = l.owner_member_id
  where l.status = 'approved' and l.owner_member_id is not null
    and public.ve_listing_dash_kind(l.category) <> 'person'
    and l.name !~* '\[TEST\]' and coalesce(m.name, '') !~* '\[TEST\]'
    and m.id::text not like 'aa000000-0000-4000-a000-%'
    and m.email is not null and m.membership_status = 'active' and coalesce(m.standing, 'good') = 'good';
$$;

-- One owner's week: the week that ended at the last Monday 00:00 Eastern (or p_end), their businesses, the opportunities that opened in it
-- for their kinds and are still open, the features and Media kits that landed in it, and visitors in the last 7 days against the 7 before.
-- news is true only when there is a new opportunity or feature: a quiet week sends nothing.
create or replace function public.ve_business_weekly_digest(p_member uuid, p_end timestamptz default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_end timestamptz := coalesce(p_end, (date_trunc('week', now() at time zone 'America/New_York')) at time zone 'America/New_York');
  v_start timestamptz := v_end - interval '7 days';
  v_m record; v_ls jsonb; v_kinds text[]; v_opps jsonb; v_feat jsonb; v_vis int := 0; v_prev int := 0; r record; s jsonb;
begin
  select id, name, email into v_m from members where id = p_member;
  if v_m.id is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'slug', l.slug, 'name', l.name, 'kind', public.ve_listing_dash_kind(l.category)) order by l.created_at), '[]'::jsonb),
         coalesce(array_agg(distinct public.ve_listing_dash_kind(l.category)), '{}')
    into v_ls, v_kinds
  from listings l where l.owner_member_id = p_member and l.status = 'approved' and public.ve_listing_dash_kind(l.category) <> 'person' and l.name !~* '\[TEST\]';
  if jsonb_array_length(v_ls) = 0 then return null; end if;

  select coalesce(jsonb_agg(jsonb_build_object('title', c.title, 'opp_kind', c.opp_kind, 'ends_at', c.ends_at) order by c.ends_at asc nulls last, c.sort), '[]'::jsonb)
    into v_opps
  from ve_dashboard_cards c
  where c.audience in ('business', 'all') and c.opp_kind is not null and c.starts_at >= v_start and c.starts_at < v_end
    and (c.ends_at is null or c.ends_at > now()) and (c.listing_kinds is null or c.listing_kinds && v_kinds);

  -- Features: anything newly featured in the week, and any share kit made ready in it (one line per feature, newest first).
  select coalesce(jsonb_agg(x order by (x->>'featured_at') desc nulls last), '[]'::jsonb) into v_feat from (
    select distinct on (l->>'slug', f->>'key') (f || jsonb_build_object('listing', l->>'name', 'slug', l->>'slug')) x
    from jsonb_array_elements(v_ls) l cross join lateral jsonb_array_elements(public.ve_media_kit((l->>'id')::uuid)) f
    left join ve_media_kit_items i on i.listing_id = (l->>'id')::uuid and i.key = f->>'key' and i.status = 'ready'
    where ((f->>'featured_at')::timestamptz >= v_start and (f->>'featured_at')::timestamptz < v_end)
       or (i.approved_at >= v_start and i.approved_at < v_end)
  ) z;

  for r in select (l->>'id')::uuid id from jsonb_array_elements(v_ls) l loop
    s := public.ve_listing_stats(r.id, 7);
    v_vis := v_vis + coalesce((s->>'visitors')::int, 0);
    v_prev := v_prev + coalesce((s->'previous'->>'visitors')::int, 0);
  end loop;

  return jsonb_build_object('member_id', v_m.id, 'name', v_m.name, 'email', v_m.email, 'week_of', (v_end at time zone 'America/New_York')::date,
    'listings', v_ls, 'opps', v_opps, 'features', v_feat, 'visitors', v_vis, 'prev_visitors', v_prev,
    'news', jsonb_array_length(v_opps) > 0 or jsonb_array_length(v_feat) > 0);
end;
$$;
revoke all on function public.ve_business_weekly_digest(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.ve_business_weekly_owners() from public, anon, authenticated;

-- The tick, hourly at :07. It sends nothing until the switch is on and the email approved, and only on Mondays from send_hour Eastern.
select cron.unschedule('ve-business-weekly') where exists (select 1 from cron.job where jobname = 've-business-weekly');
select cron.schedule('ve-business-weekly', '7 * * * *', $cron$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-business-weekly',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"tick"}'::jsonb, timeout_milliseconds := 60000);
$cron$);
