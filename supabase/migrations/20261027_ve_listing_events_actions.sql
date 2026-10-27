-- ve_listing_events refused every visitor action. ve_listing_track (20261024_partner_dashboard.sql) accepted menu, photos,
-- call, directions, website, order and social, but the table's check still allowed only view, product, store, video and
-- gallery, so each of those inserts failed and the client ignored the error: no action was recorded from 2026-10-24 to
-- 2026-10-27 (found while adding podcast plays). Widened here, with two podcast actions (Sean, 2026-10-27):
-- play (an episode played on our page, ref the episode's guid) and listen (a Listen on icon: Apple, Spotify, the RSS...).
alter table public.ve_listing_events drop constraint if exists ve_listing_events_kind_check;
alter table public.ve_listing_events add constraint ve_listing_events_kind_check check (kind = any (array[
  'view','product','store','video','gallery','menu','photos','call','directions','website','order','social','play','listen']));

create or replace function public.ve_listing_track(p_listing uuid, p_kind text, p_ref text default null, p_visitor text default null, p_via text default null)
 returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  if p_kind not in ('view','product','store','video','gallery','menu','photos','call','directions','website','order','social','play','listen') then return; end if;
  if p_visitor is not null and length(p_visitor) > 64 then return; end if;
  if not exists (select 1 from listings where id = p_listing and status = 'approved') then return; end if;
  if p_visitor is not null and exists (select 1 from ve_listing_events where listing_id = p_listing and kind = p_kind and coalesce(ref,'') = coalesce(p_ref,'')
       and visitor = p_visitor and created_at > now() - interval '30 minutes') then return; end if;
  insert into ve_listing_events (listing_id, kind, ref, visitor, via) values (p_listing, p_kind, left(p_ref, 120), p_visitor, left(p_via, 20));
end $function$;

-- Plays and Listen on count as actions in the owner's numbers; plays come back by episode (ref = guid).
create or replace function public.ve_listing_stats(p_listing uuid, p_days integer default 30)
 returns jsonb language sql security definer set search_path to 'public' as $function$
  with d as (select greatest(1, least(p_days, 365)) n),
  e as (select *, (created_at at time zone 'America/New_York')::date dd from ve_listing_events
        where listing_id = p_listing and via is distinct from 'test' and created_at > now() - make_interval(days => (select n from d))),
  prev as (select * from ve_listing_events where listing_id = p_listing and via is distinct from 'test'
        and created_at <= now() - make_interval(days => (select n from d)) and created_at > now() - make_interval(days => 2 * (select n from d))),
  acts as (select unnest(array['call','directions','website','order','social','menu','photos','play','listen']) k)
  select jsonb_build_object(
    'days', (select n from d),
    'since', (select min(created_at) from ve_listing_events where listing_id = p_listing and via is distinct from 'test'),
    'totals', (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (select kind, count(*) n from e group by kind) t),
    'visitors', (select count(distinct visitor) from e where visitor is not null),
    'previous', jsonb_build_object('views', (select count(*) from prev where kind = 'view'), 'visitors', (select count(distinct visitor) from prev where visitor is not null),
      'actions', (select count(*) from prev where kind in (select k from acts))),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', dd, 'views', v, 'visitors', vi, 'actions', a) order by dd), '[]'::jsonb) from (
      select dd, count(*) filter (where kind = 'view') v, count(distinct visitor) vi, count(*) filter (where kind in (select k from acts)) a from e group by dd) t),
    'products', (select coalesce(jsonb_agg(jsonb_build_object('ref', ref, 'n', n) order by n desc), '[]'::jsonb) from (select ref, count(*) n from e where kind = 'product' group by ref) t),
    'stores', (select coalesce(jsonb_agg(jsonb_build_object('ref', ref, 'n', n) order by n desc), '[]'::jsonb) from (select ref, count(*) n from e where kind = 'store' group by ref) t),
    'videos', (select coalesce(jsonb_agg(jsonb_build_object('ref', ref, 'n', n) order by n desc), '[]'::jsonb) from (select ref, count(*) n from e where kind = 'video' group by ref) t),
    'plays', (select coalesce(jsonb_agg(jsonb_build_object('ref', ref, 'n', n) order by n desc), '[]'::jsonb) from (select ref, count(*) n from e where kind = 'play' group by ref) t),
    'listens', (select coalesce(jsonb_agg(jsonb_build_object('ref', ref, 'n', n) order by n desc), '[]'::jsonb) from (select ref, count(*) n from e where kind = 'listen' group by ref) t),
    'via', (select coalesce(jsonb_object_agg(coalesce(via, 'page'), n), '{}'::jsonb) from (select via, count(*) n from e where kind = 'view' group by via) t)
  );
$function$;
