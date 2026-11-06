-- vegans-explore-initiative-business-certification: B4, the dish status registry and the public QR status page (2026-11-06, Logan).
-- Standard V1.2 (playbook record 044b9cf2): certification is of named dishes at one location, never "this restaurant is Vegan".
-- A certificate is one location for one 12-month term; each dish on it has its own status:
--   applied, pending, active, suspended, expired, revoked, withdrawn.
-- Public (the QR page and the registry) shows only what a diner needs now: active and suspended dishes, N of M menu items certified,
-- and what else the restaurant serves. Applied and pending are never public, and no reason is ever public ("never a failure log").
-- Records are kept for the term plus 5 years: nothing here can be deleted. Verifier, desk reviewer and approver are different people,
-- and the approver is the signed-in person who makes a dish active.
-- RLS on, no policies: everything goes through ve-certification with the service role.

create table if not exists ve_preveg_certs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  code text not null unique,
  term_start date,
  term_end date,
  menu_items_total int check (menu_items_total is null or menu_items_total between 1 and 2000),
  also_serves text[] not null default '{}'::text[],
  verifier_name text,
  verifier_member_id uuid references members(id),
  desk_reviewer_name text,
  desk_reviewer_member_id uuid references members(id),
  team_note text,
  created_by uuid references members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ve_preveg_certs_serves check (also_serves <@ array['meat','fish','dairy','eggs']::text[]),
  constraint ve_preveg_certs_term check (term_start is null or term_end is null or term_end > term_start),
  constraint ve_preveg_certs_people check (verifier_name is null or desk_reviewer_name is null or lower(trim(verifier_name)) <> lower(trim(desk_reviewer_name))),
  constraint ve_preveg_certs_people_ids check (verifier_member_id is null or desk_reviewer_member_id is null or verifier_member_id <> desk_reviewer_member_id)
);
create index if not exists ve_preveg_certs_listing on ve_preveg_certs(listing_id);

create table if not exists ve_preveg_dishes (
  id uuid primary key default gen_random_uuid(),
  cert_id uuid not null references ve_preveg_certs(id),
  name text not null check (length(trim(name)) between 2 and 120),
  menu_section text,
  status text not null default 'applied' check (status in ('applied','pending','active','suspended','expired','revoked','withdrawn')),
  status_at timestamptz not null default now(),
  certified_at timestamptz,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ve_preveg_dishes_cert on ve_preveg_dishes(cert_id);

create table if not exists ve_preveg_dish_events (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references ve_preveg_dishes(id),
  cert_id uuid not null references ve_preveg_certs(id),
  from_status text,
  to_status text not null,
  reason text not null,
  actor uuid references members(id),
  actor_name text,
  created_at timestamptz not null default now()
);
create index if not exists ve_preveg_dish_events_dish on ve_preveg_dish_events(dish_id, created_at);

alter table ve_preveg_certs enable row level security;
alter table ve_preveg_dishes enable row level security;
alter table ve_preveg_dish_events enable row level security;

-- Records are kept (term plus 5 years, G8): no deletes, and the history is never edited.
create or replace function ve_preveg_keep_records() returns trigger language plpgsql as $$
begin
  raise exception 'records_are_kept';
end $$;
drop trigger if exists trg_ve_preveg_certs_keep on ve_preveg_certs;
create trigger trg_ve_preveg_certs_keep before delete on ve_preveg_certs for each row execute function ve_preveg_keep_records();
drop trigger if exists trg_ve_preveg_dishes_keep on ve_preveg_dishes;
create trigger trg_ve_preveg_dishes_keep before delete on ve_preveg_dishes for each row execute function ve_preveg_keep_records();
drop trigger if exists trg_ve_preveg_events_keep on ve_preveg_dish_events;
create trigger trg_ve_preveg_events_keep before delete or update on ve_preveg_dish_events for each row execute function ve_preveg_keep_records();

-- A dish's status changes only through ve_preveg_dish_set_status (it writes the history). Direct updates of status are refused.
create or replace function ve_preveg_dish_guard() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status and coalesce(current_setting('ve.preveg_status_ok', true), '') <> '1' then
    raise exception 'use_ve_preveg_dish_set_status';
  end if;
  return new;
end $$;
drop trigger if exists trg_ve_preveg_dish_guard on ve_preveg_dishes;
create trigger trg_ve_preveg_dish_guard before update on ve_preveg_dishes for each row execute function ve_preveg_dish_guard();

-- The QR code: 7 letters and digits, no 0, O, 1, I or L.
create or replace function ve_preveg_new_code() returns text language plpgsql as $$
declare a text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := '';
    for i in 1..7 loop c := c || substr(a, 1 + floor(random() * length(a))::int, 1); end loop;
    exit when not exists (select 1 from ve_preveg_certs where code = c);
  end loop;
  return c;
end $$;

-- Today in Eastern time: a term ends at the end of its last day, Eastern.
create or replace function ve_preveg_today() returns date language sql stable as $$ select (now() at time zone 'America/New_York')::date $$;

-- The one way a dish's status moves. Returns {ok} or {ok:false, error}.
-- applied   -> pending, withdrawn
-- pending   -> active (the approver), applied (did not pass; re-test), withdrawn
-- active    -> suspended, expired, revoked, withdrawn
-- suspended -> active (the approver, after corrective action), expired, revoked, withdrawn
-- expired   -> applied (renewal: a new review; no grace period)
-- revoked, withdrawn: final (a new application is a new dish row)
create or replace function ve_preveg_dish_set_status(p_dish uuid, p_to text, p_reason text, p_actor uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d ve_preveg_dishes; c ve_preveg_certs; m members; ok text[];
begin
  select * into d from ve_preveg_dishes where id = p_dish for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  select * into c from ve_preveg_certs where id = d.cert_id;
  if length(trim(coalesce(p_reason, ''))) < 3 then return jsonb_build_object('ok', false, 'error', 'reason_required'); end if;
  select * into m from members where id = p_actor;
  if not found or not coalesce(m.is_superadmin, false) then return jsonb_build_object('ok', false, 'error', 'no_access'); end if;
  ok := case d.status
    when 'applied' then array['pending','withdrawn']
    when 'pending' then array['active','applied','withdrawn']
    when 'active' then array['suspended','expired','revoked','withdrawn']
    when 'suspended' then array['active','expired','revoked','withdrawn']
    when 'expired' then array['applied']
    else array[]::text[] end;
  if not (p_to = any(ok)) then return jsonb_build_object('ok', false, 'error', 'not_allowed', 'from', d.status, 'to', p_to); end if;
  if p_to = 'active' then
    if c.term_start is null or c.term_end is null then return jsonb_build_object('ok', false, 'error', 'term_needed'); end if;
    if c.term_end < ve_preveg_today() then return jsonb_build_object('ok', false, 'error', 'term_over'); end if;
    if c.menu_items_total is null then return jsonb_build_object('ok', false, 'error', 'menu_count_needed'); end if;
    if coalesce(trim(c.verifier_name), '') = '' or coalesce(trim(c.desk_reviewer_name), '') = '' then return jsonb_build_object('ok', false, 'error', 'people_needed'); end if;
    if p_actor = c.verifier_member_id or p_actor = c.desk_reviewer_member_id
       or lower(trim(coalesce(m.name, ''))) in (lower(trim(c.verifier_name)), lower(trim(c.desk_reviewer_name))) then
      return jsonb_build_object('ok', false, 'error', 'approver_must_differ');
    end if;
  end if;
  perform set_config('ve.preveg_status_ok', '1', true);
  update ve_preveg_dishes set status = p_to, status_at = now(),
    certified_at = case when p_to = 'active' and certified_at is null then now() else certified_at end
    where id = d.id;
  perform set_config('ve.preveg_status_ok', '', true);
  insert into ve_preveg_dish_events (dish_id, cert_id, from_status, to_status, reason, actor, actor_name)
    values (d.id, d.cert_id, d.status, p_to, trim(p_reason), p_actor, m.name);
  update ve_preveg_certs set updated_at = now() where id = c.id;
  return jsonb_build_object('ok', true, 'from', d.status, 'to', p_to);
end $$;

-- No grace period at expiry: every active or suspended dish whose term has ended becomes expired (cron, and on every read).
create or replace function ve_preveg_expire_sweep() returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select d.id, d.cert_id, d.status from ve_preveg_dishes d join ve_preveg_certs c on c.id = d.cert_id
           where d.status in ('active','suspended') and c.term_end is not null and c.term_end < ve_preveg_today() for update of d loop
    perform set_config('ve.preveg_status_ok', '1', true);
    update ve_preveg_dishes set status = 'expired', status_at = now() where id = r.id;
    perform set_config('ve.preveg_status_ok', '', true);
    insert into ve_preveg_dish_events (dish_id, cert_id, from_status, to_status, reason, actor_name)
      values (r.id, r.cert_id, r.status, 'expired', 'The term ended. No grace period.', 'The registry');
    n := n + 1;
  end loop;
  return n;
end $$;

-- What anyone may see for a code. Never a reason, never applied or pending, never the team note or the people.
-- state: certified (at least one dish active in a current term), suspended (none active, at least one suspended),
-- not_current (it was certified once; nothing is now), not_found.
create or replace function ve_preveg_cert_public(p_code text) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare c ve_preveg_certs; l listings; cur boolean; dishes jsonb; n int; s int; ever boolean;
begin
  select * into c from ve_preveg_certs where code = upper(trim(coalesce(p_code, '')));
  if not found then return jsonb_build_object('state', 'not_found'); end if;
  select * into l from listings where id = c.listing_id;
  select exists (select 1 from ve_preveg_dishes where cert_id = c.id and certified_at is not null) into ever;
  if not ever then return jsonb_build_object('state', 'not_found'); end if;
  cur := c.term_end is not null and c.term_end >= ve_preveg_today();
  select count(*) filter (where status = 'active'), count(*) filter (where status = 'suspended')
    into n, s from ve_preveg_dishes where cert_id = c.id;
  if not cur then n := 0; s := 0; end if;
  select coalesce(jsonb_agg(jsonb_build_object('name', name, 'section', menu_section, 'status', status,
           'since', case when status = 'active' then certified_at else status_at end) order by status = 'suspended', sort, name), '[]'::jsonb)
    into dishes from ve_preveg_dishes where cert_id = c.id and cur and status in ('active','suspended');
  return jsonb_build_object(
    'state', case when n > 0 then 'certified' when s > 0 then 'suspended' else 'not_current' end,
    'code', c.code,
    'listing', jsonb_build_object('name', l.name, 'slug', l.slug, 'logo_url', l.logo_url, 'city', l.address_city, 'state', l.address_state,
                                  'street', l.address_street, 'communities', l.communities),
    'term_start', case when n + s > 0 then c.term_start end,
    'term_end', case when n + s > 0 then c.term_end end,
    'certified', n, 'menu_items', case when n + s > 0 then c.menu_items_total end,
    'also_serves', case when n + s > 0 then to_jsonb(c.also_serves) else '[]'::jsonb end,
    'dishes', dishes,
    'checked_at', now());
end $$;

-- The public registry: every location with a dish active or suspended in a current term.
create or replace function ve_preveg_registry_public() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x->>'name'), '[]'::jsonb) from (
    select jsonb_build_object('code', c.code, 'name', l.name, 'slug', l.slug, 'logo_url', l.logo_url, 'city', l.address_city, 'state', l.address_state,
             'certified', count(*) filter (where d.status = 'active'), 'suspended', count(*) filter (where d.status = 'suspended'),
             'menu_items', c.menu_items_total, 'also_serves', to_jsonb(c.also_serves), 'term_end', c.term_end) x
    from ve_preveg_certs c join listings l on l.id = c.listing_id join ve_preveg_dishes d on d.cert_id = c.id
    where c.term_end >= ve_preveg_today() and d.status in ('active','suspended')
    group by c.id, l.id
  ) t
$$;

revoke all on function ve_preveg_dish_set_status(uuid, text, text, uuid) from public, anon, authenticated;
revoke all on function ve_preveg_expire_sweep() from public, anon, authenticated;
revoke all on function ve_preveg_cert_public(text) from public, anon, authenticated;
revoke all on function ve_preveg_registry_public() from public, anon, authenticated;
revoke all on function ve_preveg_new_code() from public, anon, authenticated;

-- No grace period: expire what has ended, every day at 12:05 AM Eastern (05:05 UTC; the read paths expire too).
select cron.unschedule('ve-preveg-expire') where exists (select 1 from cron.job where jobname = 've-preveg-expire');
select cron.schedule('ve-preveg-expire', '5 5 * * *', $$select ve_preveg_expire_sweep()$$);
