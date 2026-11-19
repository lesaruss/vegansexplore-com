-- Directory Reach console (Sean, 2026-11-18; docs/plans/2026-11-18-directory-reach-boss.md). One roster of every approved listing with
-- its contact history, KJ's touch log (Instagram DMs cannot be read by our system, so her log is the record), and one living message
-- per group and lane. Read and written only by the ve-reach edge function (service role). Safe to run twice.

create table if not exists ve_reach_log (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  member_id uuid,
  kind text not null check (kind in ('follow', 'followed_back', 'dm', 'replied', 'cant_reach', 'note', 'checkin', 'pin', 'unpin', 'tagged')),
  note text,
  at timestamptz not null default now()
);
create index if not exists ve_reach_log_listing on ve_reach_log (listing_id, at desc);
create index if not exists ve_reach_log_member on ve_reach_log (member_id, at desc);
alter table ve_reach_log enable row level security;

create table if not exists ve_reach_messages (
  id uuid primary key default gen_random_uuid(),
  grp text not null check (grp in ('restaurants', 'businesses', 'nonprofits', 'creators')),
  lane text not null check (lane in ('dm', 'email')),
  version int not null default 1,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'locked', 'retired')),
  created_at timestamptz not null default now(),
  locked_by uuid, locked_at timestamptz,
  unique (grp, lane, version)
);
alter table ve_reach_messages enable row level security;

-- Draft openers for KJ (her words win; these are a start). Locked only by Sean.
insert into ve_reach_messages (grp, lane, version, body) values
 ('restaurants', 'dm', 1, 'Hi! We''re Vegans Explore, the Vegan directory and community. {name} is already listed with us, and we''d love for you to see it and make it yours (it''s free). Here''s your page: {link}'),
 ('businesses', 'dm', 1, 'Hi! We''re Vegans Explore, the Vegan directory and community. {name} is already listed with us, and we''d love for you to see it and make it yours (it''s free). Here''s your page: {link}'),
 ('nonprofits', 'dm', 1, 'Hi! We''re Vegans Explore, the Vegan directory and community. {name} is already listed with us, so the people in our community can find and support you. Here''s your page, it''s free to claim: {link}'),
 ('creators', 'dm', 1, 'Hi! We''re Vegans Explore, the Vegan directory and community. {name} is already listed with us, and we''d love to feature what you make. Here''s your page, it''s free to claim: {link}')
on conflict (grp, lane, version) do nothing;

-- The roster: one row per approved listing. Group exactly as the BOSS query.
create or replace function ve_reach_roster()
returns table (
  id uuid, slug text, name text, logo_url text, category text, grp text, city text, state text, instagram text, website text,
  emails text[], claimed boolean, emails_sent int, last_email_at timestamptz, opened boolean, clicked boolean, replied_email boolean,
  bounced boolean, unsubscribed boolean, dm_at timestamptz, followed_at timestamptz, followed_back boolean, replied_dm boolean,
  cant_reach boolean, pinned boolean, touches int, last_touch_at timestamptz, last_touch_kind text, kj_note text
)
language sql stable security definer set search_path = public as $$
with l as (
  select l.id, l.slug, l.name, l.logo_url, l.category, l.address_city, l.address_state, l.location,
    nullif(trim(l.instagram), '') ig, nullif(trim(l.website), '') web, l.owner_member_id,
    case when l.category in ('Rescues','Nonprofits','Sanctuaries','Activists','Groups') then 'nonprofits'
      when l.category in ('Podcasts','YouTube','Radio and TV','News Outlets','Documentaries & Films','Books','Athletes','Founders') then 'creators'
      when l.category in ('Restaurants','Bakeries & Cafes','Food Trucks','Catering','Markets') then 'restaurants' else 'businesses' end g,
    nullif(lower(trim(l.email)), '') e1, nullif(lower(trim(l.ve_contact_email)), '') e2
  from listings l where l.status = 'approved'
),
em as (
  select id lid, e1 e from l where e1 like '%@%' union select id, e2 from l where e2 like '%@%'
  union select listing_id, lower(trim(email)) from ve_outreach_contacts where listing_id is not null and email like '%@%'
  union select listing_id, lower(trim(email)) from listing_outreach where listing_id is not null and email like '%@%'
  union select listing_id, lower(trim(person_key)) from ve_outreach_campaign_members where listing_id is not null and person_key like '%@%'
),
ems as (select lid, array_agg(distinct e) es from em group by lid),
sends as (
  select em.lid, count(*) n, max(coalesce(s.sent_at, s.created_at)) last_at, bool_or(e.opens_human > 0) op,
    bool_or(e.clicked_at is not null and not coalesce(e.scanner_click_only, false)) cl, bool_or(s.bounced_at is not null) bo
  from em join email_sends s on lower(s.to_email) = em.e and s.status <> 'failed'
  left join email_send_engagement e on e.send_id = s.id
  group by em.lid
),
reps as (select em.lid, true r from em join email_replies r on lower(r.from_email) = em.e where not coalesce(r.is_auto_reply, false) group by em.lid),
uns as (select em.lid, true u from em join email_suppressions x on lower(x.email) = em.e and x.active and x.reason = 'unsubscribe' group by em.lid),
lg as (
  select listing_id lid,
    max(at) filter (where kind = 'dm') dm_at, max(at) filter (where kind = 'follow') fol_at, bool_or(kind = 'followed_back') fb,
    bool_or(kind = 'replied') rep, bool_or(kind = 'cant_reach') cr,
    (array_agg(kind order by at desc) filter (where kind in ('pin', 'unpin')))[1] = 'pin' pin,
    count(*) filter (where kind in ('dm', 'replied', 'checkin', 'tagged')) n, max(at) last_at,
    (array_agg(kind order by at desc))[1] last_kind, (array_agg(note order by at desc) filter (where note is not null and note <> ''))[1] nt
  from ve_reach_log group by listing_id
)
select l.id, l.slug, l.name, l.logo_url, l.category, l.g, coalesce(l.address_city, l.location), l.address_state, l.ig, l.web,
  coalesce(ems.es, '{}'), l.owner_member_id is not null, coalesce(sends.n, 0)::int, sends.last_at, coalesce(sends.op, false),
  coalesce(sends.cl, false), coalesce(reps.r, false), coalesce(sends.bo, false), coalesce(uns.u, false),
  lg.dm_at, lg.fol_at, coalesce(lg.fb, false), coalesce(lg.rep, false), coalesce(lg.cr, false), coalesce(lg.pin, false),
  (coalesce(sends.n, 0) + coalesce(lg.n, 0))::int, greatest(sends.last_at, lg.last_at), lg.last_kind, lg.nt
from l left join ems on ems.lid = l.id left join sends on sends.lid = l.id left join reps on reps.lid = l.id
  left join uns on uns.lid = l.id left join lg on lg.lid = l.id;
$$;
revoke execute on function ve_reach_roster() from public, anon, authenticated;
grant execute on function ve_reach_roster() to service_role;
