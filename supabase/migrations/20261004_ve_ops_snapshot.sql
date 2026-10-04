-- Ops snapshot (Sean, 2026-10-04): the dashboard's role row and the two pages behind it.
--   Platform health (/dashboard/health): how Vegans Explore is running, worst first.
--   Submissions (/dashboard/submissions): every open item waiting on someone, one list, by type,
--     modeled on BCPS Marcom's Registrations page.
--   This week: new members against the week before, and active Passports.
-- Read only. Called by the ve-ops edge function with the service key after it checks the role:
-- superadmins get everything (p_city null), Community Managers get their city (p_city) and no health.

create or replace function public.ve_ops_snapshot(p_city text default null, p_health boolean default false)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare
  ve_tenant constant uuid := '00000000-0000-4000-a000-000000000002';
  queue jsonb;
  health jsonb := '[]'::jsonb;
  week jsonb;
  pulse jsonb;
  c jsonb;
  n int;
  k int;
  m int;
  t timestamptz;
  s text;
begin
  -- Open submissions. city is a community slug, or null when the item has no city.
  select coalesce(jsonb_agg(q order by q.created_at), '[]'::jsonb) into queue from (
    select 'event' as type, e.id::text as id, e.title as title, mm.name as who, null::text as city, e.created_at, e.status as status, '/admin/events.html' as link
      from events e left join members mm on mm.id = e.author_id
      where e.status = 'pending' and e.tenant_id = ve_tenant
    union all
    select 'guest', g.id::text, coalesce(g.name, g.email, 'Guest Passport'), g.email, g.home_community, g.created_at, g.guest_review_status, '/dashboard/guest-reviews'
      from members g
      where g.tenant_id = ve_tenant and g.membership_tier = 'guest' and g.guest_review_status in ('pending_review', 'flagged', 'needs_followup')
    union all
    select 'application', a.id::text, coalesce(o.title, 'Application'), mm.name, o.city_slug, a.created_at, a.status, '/dashboard/applications?id=' || a.id::text
      from opportunity_applications a left join opportunities o on o.id = a.opportunity_id left join members mm on mm.id = a.member_id
      where a.status = 'pending'
    union all
    select 'community_manager', k.id::text, 'Community Manager ' || replace(k.kind, '_', ' '), coalesce(k.name, k.email), k.city_slug, k.created_at, k.status, '/admin/depot/community-managers'
      from ve_cm_candidates k
      where k.status in ('new', 'confirmed', 'pending_review', 'answered', 'applied')
    union all
    select 'partner', p.id::text, coalesce(p.business_name, 'Partner application'), mm.name, p.city_slug, coalesce(p.applied_at, p.created_at), p.status, '/dashboard/partners'
      from community_partners p left join members mm on mm.id = p.member_id
      where p.status = 'pending'
    union all
    select 'claim', l.id::text, 'Listing claim' || coalesce(': ' || l.contact_name, ''), l.contact_email, null, l.created_at, l.status, '/admin/depot/claims'
      from ve_listing_claims l
      where l.status = 'submitted' and not coalesce(l.test, false)
    union all
    select 'interest', i.id::text, coalesce(i.initiative_slug, 'Initiative') || coalesce(' · ' || i.action_type, ''), coalesce(mm.name, i.name, i.email), null, i.created_at, i.status, '/dashboard/leads'
      from ve_initiative_interest i left join members mm on mm.id = i.member_id
      where i.status = 'new' and i.action_type <> 'link_click' -- clicks are an audience, not a decision (2026-10-04)
    union all
    select 'bounty', b.id::text, coalesce(v.title, 'Bounty'), mm.name, v.community_slug, coalesce(b.submitted_at, b.updated_at), b.status, '/admin/depot/bounties'
      from ve_bounty_submissions b join ve_bounties v on v.id = b.bounty_id left join members mm on mm.id = b.member_id
      where b.status = 'submitted'
    union all
    select 'report', r.id::text, 'Reported ' || case when r.reply_id is not null then 'reply' else 'post' end || coalesce(': ' || r.reason, ''), mm.name, r.community_slug, r.created_at, r.status, '/board'
      from ve_board_reports r left join members mm on mm.id = r.reporter_member_id
      where r.status = 'open'
    union all
    select 'service', so.id::text, coalesce(replace(so.service, '_', ' '), 'Service order'), so.contact_email, null, coalesce(so.paid_at, so.created_at), so.status, '/admin/depot/services'
      from ve_service_orders so
      where so.status = 'paid' and not coalesce(so.test, false)
    union all
    select 'pulse', bp.id::text, bp.title, null, bp.community_slug, bp.created_at, coalesce(bp.write_status, bp.status), '/admin/depot/inbox'
      from ve_board_posts bp
      where bp.kind = 'topic' and bp.status = 'draft' and coalesce(bp.write_status, 'written') in ('written', 'failed')
  ) q
  where p_city is null or q.city = p_city or (q.type = 'pulse' and q.city = 'national');

  -- This week.
  select count(*) filter (where created_at >= now() - interval '7 days'),
         count(*) filter (where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days')
    into n, m
    from members
    where tenant_id = ve_tenant and member_class = 'member' and membership_status = 'active'
      and (p_city is null or home_community = p_city);
  week := jsonb_build_object('new_members', n, 'prior_week', m,
    'passports', (select count(*) from members where tenant_id = ve_tenant and member_class = 'member' and membership_tier = 'passport' and membership_status = 'active' and (p_city is null or home_community = p_city)));

  -- Daily Pulse: the newest published topic per city that has ever had one, plus national.
  select coalesce(jsonb_agg(jsonb_build_object('city', x.community_slug, 'published_at', x.last, 'title', x.title) order by x.community_slug = 'national' desc, x.community_slug), '[]'::jsonb)
    into pulse
    from (
      select distinct on (community_slug) community_slug, published_at as last, title
      from ve_board_posts
      where kind = 'topic' and status = 'open' and published_at is not null
        and (p_city is null or community_slug in (p_city, 'national'))
      order by community_slug, published_at desc
    ) x;

  if p_health then
    -- 1. Site and services, from Sentinel's checks for this site and the services it runs on.
    select jsonb_agg(jsonb_build_object('name', check_name, 'state', signal_state, 'summary', last_summary, 'ran_at', last_ran_at) order by check_name), count(*) filter (where signal_state <> 'ok')
      into c, n
      from v_sentinel_status
      where enabled and check_name in ('vegansexplore_com_live', 'vercel_deployment_vegansexplore', 'supabase_api_live', 'email_send_health', 'email_dispatcher_tick', 'email_resend_usage', 'cron_heartbeat_stale');
    health := health || jsonb_build_array(jsonb_build_object('key', 'site', 'label', 'Site and services',
      'state', case when n > 0 then 'alert' else 'ok' end,
      'summary', case when n > 0 then n || ' of ' || jsonb_array_length(coalesce(c, '[]'::jsonb)) || ' checks failing' else 'Site, deploy, database and email all passing' end,
      'items', coalesce(c, '[]'::jsonb)));

    -- 2. Scheduled jobs that run Vegans Explore: failures in the last 24 hours.
    select jsonb_agg(jsonb_build_object('name', j.jobname, 'state', case when f.fails > 0 then 'alert' when f.last_ok is null then 'warn' else 'ok' end,
             'summary', case when f.fails > 0 then f.fails || ' failed run(s) in 24h' when f.last_ok is null then 'no successful run in 24h' else 'last ran ' || to_char(f.last_ok at time zone 'America/New_York', 'Mon DD HH12:MI AM') || ' ET' end) order by j.jobname),
           count(*) filter (where f.fails > 0), count(*) filter (where f.fails = 0 and f.last_ok is null)
      into c, n, m
      from cron.job j
      left join lateral (
        select count(*) filter (where d.status = 'failed') as fails, max(d.end_time) filter (where d.status = 'succeeded') as last_ok
        from cron.job_run_details d where d.jobid = j.jobid and d.start_time > now() - interval '24 hours'
      ) f on true
      where j.active and (j.jobname like 've-%' or j.jobname in ('lesaruss-dispatch-15m', 'email-welcome-tick', 'email-dispatch-tick', 'sentinel-runner-15min'));
    health := health || jsonb_build_array(jsonb_build_object('key', 'jobs', 'label', 'Scheduled jobs',
      'state', case when n > 0 then 'alert' when m > 0 then 'warn' else 'ok' end,
      'summary', case when n > 0 then n || ' job(s) failing' when m > 0 then m || ' job(s) quiet for 24h' else 'All ' || jsonb_array_length(coalesce(c, '[]'::jsonb)) || ' jobs running' end,
      'items', coalesce(c, '[]'::jsonb)));

    -- 3. Daily Pulse: each city's newest topic. Older than 30 hours means today's is missing.
    select count(*) into n from jsonb_array_elements(pulse) p where (p->>'published_at')::timestamptz < now() - interval '30 hours';
    health := health || jsonb_build_array(jsonb_build_object('key', 'pulse', 'label', 'Daily Pulse',
      'state', case when jsonb_array_length(pulse) = 0 then 'warn' when n > 0 then 'warn' else 'ok' end,
      'summary', case when jsonb_array_length(pulse) = 0 then 'Nothing published yet' when n > 0 then n || ' edition(s) not published in the last day' else 'Every edition is current' end,
      'items', (select coalesce(jsonb_agg(jsonb_build_object('name', p->>'city', 'state', case when (p->>'published_at')::timestamptz < now() - interval '30 hours' then 'warn' else 'ok' end,
                 'summary', 'last published ' || to_char((p->>'published_at')::timestamptz at time zone 'America/New_York', 'Mon DD HH12:MI AM') || ' ET: ' || (p->>'title'))), '[]'::jsonb) from jsonb_array_elements(pulse) p)));

    -- 4. The background writer (dispatcher on station-2) and its drafts.
    select max(fired_at), count(*) filter (where status not in ('done', 'running', 'pending') and fired_at > now() - interval '24 hours') into t, n from lesaruss_dispatch_runs;
    select count(*) filter (where write_status = 'failed'), count(*) filter (where write_status in ('queued', 'writing') and write_marked_at < now() - interval '2 hours')
      into m, k from (select write_status, write_marked_at from ve_board_posts where write_status is not null) w;
    s := case when t is null or t < now() - interval '1 hour' then 'alert' when n > 0 or m > 0 then 'warn' else 'ok' end;
    health := health || jsonb_build_array(jsonb_build_object('key', 'writer', 'label', 'Background writer',
      'state', s,
      'summary', case when t is null then 'No dispatcher runs on record' when t < now() - interval '1 hour' then 'Dispatcher silent since ' || to_char(t at time zone 'America/New_York', 'Mon DD HH12:MI AM') || ' ET'
                      when n > 0 then n || ' dispatcher run(s) did not finish in 24h' when m > 0 then m || ' Pulse draft(s) failed to write' else 'Dispatcher ran ' || to_char(t at time zone 'America/New_York', 'HH12:MI AM') || ' ET' end,
      'items', jsonb_build_array(
        jsonb_build_object('name', 'Last dispatcher run', 'state', case when t is null or t < now() - interval '1 hour' then 'alert' else 'ok' end, 'summary', coalesce(to_char(t at time zone 'America/New_York', 'Mon DD HH12:MI AM') || ' ET', 'never')),
        jsonb_build_object('name', 'Unfinished runs (24h)', 'state', case when n > 0 then 'warn' else 'ok' end, 'summary', n::text),
        jsonb_build_object('name', 'Failed Pulse drafts', 'state', case when m > 0 then 'warn' else 'ok' end, 'summary', m::text),
        jsonb_build_object('name', 'Drafts stuck over 2h', 'state', case when k > 0 then 'warn' else 'ok' end, 'summary', k::text)
      )));

    -- 5. News feeds behind the Inbox and the Pulse.
    select jsonb_agg(jsonb_build_object('name', feed_name, 'state', 'warn', 'summary', coalesce(last_status, 'never fetched') || coalesce(', last fetched ' || to_char(last_fetched_at at time zone 'America/New_York', 'Mon DD HH12:MI AM') || ' ET', '')) order by feed_name),
           count(*)
      into c, n
      from ve_news_feeds
      where is_active and (coalesce(last_status, '') <> 'ok' or last_fetched_at is null or last_fetched_at < now() - interval '13 hours');
    select count(*) into m from ve_news_feeds where is_active;
    health := health || jsonb_build_array(jsonb_build_object('key', 'feeds', 'label', 'News feeds',
      'state', case when n > 0 then 'warn' else 'ok' end,
      'summary', case when n > 0 then n || ' of ' || m || ' feeds failing or stale' else 'All ' || m || ' feeds fetching' end,
      'items', coalesce(c, '[]'::jsonb)));

    -- 6. Work waiting on people: the Submissions queue and the Inbox.
    select count(*) into n from jsonb_array_elements(queue) q where (q->>'created_at')::timestamptz < now() - interval '3 days';
    select count(*) into m from ve_news_leads where status = 'new';
    health := health || jsonb_build_array(jsonb_build_object('key', 'queue', 'label', 'Waiting on review',
      'state', case when n > 0 then 'warn' else 'ok' end,
      'summary', jsonb_array_length(queue) || ' open submission(s)' || case when n > 0 then ', ' || n || ' older than 3 days' else '' end,
      'items', jsonb_build_array(
        jsonb_build_object('name', 'Open submissions', 'state', 'ok', 'summary', jsonb_array_length(queue)::text),
        jsonb_build_object('name', 'Older than 3 days', 'state', case when n > 0 then 'warn' else 'ok' end, 'summary', n::text),
        jsonb_build_object('name', 'New Inbox leads', 'state', 'ok', 'summary', m::text)
      )));

    -- 7. Logged errors for Vegans Explore that are still open.
    select jsonb_agg(jsonb_build_object('name', error_code, 'state', 'warn', 'summary', title) order by last_seen desc), count(*)
      into c, n
      from error_registry
      where not coalesce(resolved, false) and error_code ilike 've-%';
    health := health || jsonb_build_array(jsonb_build_object('key', 'errors', 'label', 'Open errors',
      'state', case when n > 0 then 'warn' else 'ok' end,
      'summary', case when n > 0 then n || ' unresolved' else 'None open' end,
      'items', coalesce(c, '[]'::jsonb)));
  end if;

  return jsonb_build_object('generated_at', now(), 'city', p_city, 'queue', queue, 'week', week, 'pulse', pulse, 'health', health);
end $$;
revoke all on function public.ve_ops_snapshot(text, boolean) from public, anon, authenticated;

-- The dashboard leaderboard scrolls to 100 (Sean, 2026-10-04); it was capped at 10.
create or replace function public.ve_leaderboard(p_cities text[])
returns table(id uuid, name text, initials text, avatar_url text, color text, points integer, location text)
language sql stable set search_path to 'public' as $function$
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
  limit 100;
$function$;
