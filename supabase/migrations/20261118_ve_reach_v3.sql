-- Directory Reach console v3: feature first (Sean, 2026-11-18: "go with feature first"; panel docs/plans/2026-11-18-kj-access-panel.md).
-- KJ never starts cold DMs and never holds the account: she makes the daily "Now on Vegans Explore" feature from @vegansexplore, tagging
-- the places really in it, and answers whoever raises a hand. Places quiet 7 days after a feature go to Sean's send list (he sends from his
-- own phone; logged as kind 'dm'). The roster gains each listing's chapter (one city per day's feature), when it was featured, and when its
-- page link went out. All words stay draft until Sean locks them. Safe to run twice.

alter table ve_reach_messages drop constraint if exists ve_reach_messages_kind_check;
alter table ve_reach_messages add constraint ve_reach_messages_kind_check check (kind in ('outreach', 'page', 'welcome', 'caption', 'sean'));
-- KJ no longer opens cold: the first-message openers are retired.
update ve_reach_messages set status = 'retired' where kind = 'outreach' and status = 'draft';
insert into ve_reach_messages (grp, lane, kind, version, body) values
 ('restaurants', 'dm', 'caption', 1, 'Now on Vegans Explore: Vegan food in {chapter}. {handles} Featured? Comment PAGE and we''ll send your listing.'),
 ('businesses', 'dm', 'caption', 1, 'Now on Vegans Explore: Vegan businesses in {chapter}. {handles} Featured? Comment PAGE and we''ll send your listing.'),
 ('nonprofits', 'dm', 'caption', 1, 'Now on Vegans Explore: the rescues, sanctuaries and groups doing the work in {chapter}. {handles} Featured? Comment PAGE and we''ll send your listing.'),
 ('creators', 'dm', 'caption', 1, 'Now on Vegans Explore: Vegan creators and shows worth following. {handles} Featured? Comment PAGE and we''ll send your listing.'),
 ('all', 'dm', 'page', 2, 'Thank you! Here''s your page: {link} It''s free. Claiming it takes a short free survey to join, and Liz, our Guide, walks you through the rest.'),
 ('all', 'dm', 'sean', 1, 'Hi, Sean here, founder of Vegans Explore. We featured {name} last week, and your page is already in our Directory. Want me to send it over?')
on conflict (grp, lane, kind, version) do nothing;

drop function if exists ve_reach_roster();
create or replace function ve_reach_roster()
returns table (
  id uuid, slug text, name text, logo_url text, category text, grp text, city text, state text, chapter text, instagram text, website text,
  emails text[], claimed boolean, emails_sent int, last_email_at timestamptz, opened boolean, clicked boolean, replied_email boolean,
  bounced boolean, unsubscribed boolean, dm_at timestamptz, followed_at timestamptz, followed_back boolean, replied_dm boolean,
  cant_reach boolean, pinned boolean, touches int, last_touch_at timestamptz, last_touch_kind text, kj_note text,
  tagged_at timestamptz, page_sent_at timestamptz
)
language sql stable security definer set search_path = public as $$
with l as (
  select l.id, l.slug, l.name, l.logo_url, l.category, l.address_city, l.address_state, l.address_country, l.location, l.communities,
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
    count(*) filter (where kind in ('dm', 'replied', 'checkin', 'tagged', 'page_sent')) n, max(at) last_at,
    (array_agg(kind order by at desc))[1] last_kind, (array_agg(note order by at desc) filter (where note is not null and note <> ''))[1] nt,
    min(at) filter (where kind = 'tagged') tg_at, max(at) filter (where kind = 'page_sent') ps_at
  from ve_reach_log group by listing_id
)
select l.id, l.slug, l.name, l.logo_url, l.category, l.g, coalesce(l.address_city, l.location), coalesce(l.address_state, l.address_country),
  coalesce(l.communities[1], ve_chapter_of(l.address_city, coalesce(l.address_state, l.address_country))), l.ig, l.web,
  coalesce(ems.es, '{}'), l.owner_member_id is not null, coalesce(sends.n, 0)::int, sends.last_at, coalesce(sends.op, false),
  coalesce(sends.cl, false), coalesce(reps.r, false), coalesce(sends.bo, false), coalesce(uns.u, false),
  lg.dm_at, lg.fol_at, coalesce(lg.fb, false), coalesce(lg.rep, false), coalesce(lg.cr, false), coalesce(lg.pin, false),
  (coalesce(sends.n, 0) + coalesce(lg.n, 0))::int, greatest(sends.last_at, lg.last_at), lg.last_kind, lg.nt, lg.tg_at, lg.ps_at
from l left join ems on ems.lid = l.id left join sends on sends.lid = l.id left join reps on reps.lid = l.id
  left join uns on uns.lid = l.id left join lg on lg.lid = l.id;
$$;
revoke execute on function ve_reach_roster() from public, anon, authenticated;
grant execute on function ve_reach_roster() to service_role;

alter table ve_reach_inbound drop constraint if exists ve_reach_inbound_kind_check;
alter table ve_reach_inbound add constraint ve_reach_inbound_kind_check check (kind in ('follower', 'message', 'comment', 'feature_reply'));
