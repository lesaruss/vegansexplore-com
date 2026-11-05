-- ve-outreach-buckets: the Outreach roster (Sean, 2026-11-05).
-- "Rows of listings with a select option on the left... sort by 100% vegan, by city, by type... choose campaign."
-- A person or business can be in several campaigns at once (Sean: a creator finishing the Creator Guide nurture who also joins
-- the World Vegan Expo as an ambassador). Nothing here sends: adding someone to a campaign only records membership; emails still
-- need an approved send day and a city that is on.
-- Named ve_outreach_campaigns, not ve_campaigns: a different ve_campaigns table (uuid id, brand_slug, title, target_date) already exists.
-- Tables: RLS on, no policies (service role only). Functions: service role only.

create table if not exists ve_outreach_campaigns (
  slug        text primary key check (slug ~ '^[a-z0-9-]{1,60}$'),
  name        text not null,
  door        text,                       -- ve_outreach_doors.door this campaign belongs to, if any
  guide_slug  text,                       -- the Guide it walks people through, if any
  categories  text[] not null default '{}', -- the preset filter: listing categories that are a fit (Logan's defaults, Sean's to change)
  vegan_only  boolean not null default false,
  note        text,
  status      text not null default 'draft' check (status in ('draft','active','finished')),
  created_at  timestamptz not null default now()
);
alter table ve_outreach_campaigns enable row level security;

create table if not exists ve_outreach_campaign_members (
  id          uuid primary key default gen_random_uuid(),
  campaign_slug text not null references ve_outreach_campaigns(slug) on update cascade,
  listing_id  uuid references listings(id),
  person_key  text,                       -- same key Depot > Outreach uses (email, ig:<handle>) for people with no listing
  added_by    uuid,
  added_at    timestamptz not null default now(),
  removed_at  timestamptz,
  removed_by  uuid,
  check (listing_id is not null or person_key is not null)
);
create unique index if not exists ve_outreach_campaign_members_one_active
  on ve_outreach_campaign_members (campaign_slug, coalesce(listing_id::text, person_key)) where removed_at is null;
create index if not exists ve_outreach_campaign_members_listing on ve_outreach_campaign_members (listing_id) where removed_at is null;
alter table ve_outreach_campaign_members enable row level security;

-- Seed: one campaign per outreach door, plus the two Guide campaigns Sean named first. Idempotent.
insert into ve_outreach_campaigns (slug, name, door, guide_slug, status)
select door, label, door, guide_slug, case when ready then 'active' else 'draft' end from ve_outreach_doors
on conflict (slug) do nothing;
insert into ve_outreach_campaigns (slug, name, guide_slug, categories, note) values
  ('creator-guide', 'Creator Guide', 'creator-guide', array['Content Creators','YouTube'], 'Preset: Content Creators and YouTube listings. Logan''s default, Sean''s to change.'),
  ('nonprofit-guide', 'Nonprofit Guide', 'nonprofit-guide', array['Nonprofits','Rescues','Sanctuaries'], 'Preset: Nonprofits, Rescues and Sanctuaries. Logan''s default, Sean''s to change.')
on conflict (slug) do nothing;

-- The roster. One row per approved listing (main listings and locations alike), with its contact row if one exists.
-- Status: unsubscribed > member > hot lead > unverified.
create or replace function ve_outreach_roster(
  p_status text[] default null, p_vegan_only boolean default false, p_chapter text default null,
  p_category text[] default null, p_campaign text default null, p_q text default null,
  p_has_email boolean default null, p_limit int default 100, p_offset int default 0
) returns jsonb language sql stable security definer set search_path = public as $$
  with supp as (
    select lower(email) e from email_suppressions where active
  ), base as (
    select l.id listing_id, l.name, l.slug, l.category, l.vegan_status, l.address_city city, l.address_state state,
           ve_chapter_of(l.address_city, l.address_state) chapter,
           coalesce(nullif(c.email,''), nullif(l.email,'')) email,
           c.id contact_id, c.status contact_status, c.email_source, c.door, c.last_sent_at,
           case
             when exists (select 1 from supp s where s.e = lower(coalesce(nullif(c.email,''), nullif(l.email,''))))
                  or c.status in ('opted_out','bounced') then 'unsubscribed'
             when l.owner_member_id is not null or c.status = 'joined' or c.joined_at is not null then 'member'
             when c.status = 'interested' or c.interested_at is not null
                  or coalesce(l.claim_status,'unclaimed') not in ('unclaimed','verified','rejected') then 'hot'
             else 'unverified'
           end as status,
           coalesce((select array_agg(m.campaign_slug order by m.added_at) from ve_outreach_campaign_members m
                     where m.listing_id = l.id and m.removed_at is null), '{}') campaigns
    from listings l
    left join lateral (select * from ve_outreach_contacts x where x.listing_id = l.id order by x.created_at limit 1) c on true
    where l.status = 'approved'
  ), f as (
    select b.*, count(*) filter (where b.email is not null) over (partition by lower(b.email)) same_email
    from base b
    where (not coalesce(p_vegan_only,false) or b.vegan_status in ('fully_vegan','vegan'))
      and (p_chapter is null or b.chapter = p_chapter)
      and (p_category is null or b.category = any(p_category))
      and (p_campaign is null or p_campaign = any(b.campaigns))
      and (p_has_email is null or (b.email is not null) = p_has_email)
      and (p_q is null or p_q = '' or b.name ilike '%'||p_q||'%' or b.email ilike '%'||p_q||'%' or b.city ilike '%'||p_q||'%')
  ), shown as (
    select * from f where p_status is null or status = any(p_status)
  )
  select jsonb_build_object(
    'total', (select count(*) from shown),
    'counts', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from f group by 1) x), '{}'::jsonb),
    'rows', coalesce((select jsonb_agg(to_jsonb(r)) from (
        select * from shown order by (email is null), name, listing_id
        limit greatest(1, least(coalesce(p_limit,100), 500)) offset greatest(0, coalesce(p_offset,0))) r), '[]'::jsonb)
  );
$$;

-- Add listings to a campaign. Unsubscribed addresses are refused; people already in it are left alone.
create or replace function ve_outreach_campaign_add(p_campaign text, p_listing_ids uuid[], p_by uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare added int := 0; dup int := 0; blocked int := 0; r record;
begin
  if not exists (select 1 from ve_outreach_campaigns where slug = p_campaign) then return jsonb_build_object('error','unknown_campaign'); end if;
  for r in select l.id,
      exists (select 1 from email_suppressions s where s.active and lower(s.email) = lower(coalesce(nullif(c.email,''), nullif(l.email,''))))
        or coalesce(c.status,'') in ('opted_out','bounced') as unsub
    from listings l left join lateral (select * from ve_outreach_contacts x where x.listing_id = l.id order by x.created_at limit 1) c on true
    where l.id = any(p_listing_ids) and l.status = 'approved'
  loop
    if r.unsub then blocked := blocked + 1; continue; end if;
    begin
      insert into ve_outreach_campaign_members (campaign_slug, listing_id, added_by) values (p_campaign, r.id, p_by);
      added := added + 1;
    exception when unique_violation then dup := dup + 1;
    end;
  end loop;
  return jsonb_build_object('added', added, 'already_in', dup, 'refused_unsubscribed', blocked);
end $$;

create or replace function ve_outreach_campaign_remove(p_campaign text, p_listing_ids uuid[], p_by uuid default null)
returns jsonb language sql security definer set search_path = public as $$
  with u as (update ve_outreach_campaign_members set removed_at = now(), removed_by = p_by
             where campaign_slug = p_campaign and listing_id = any(p_listing_ids) and removed_at is null returning 1)
  select jsonb_build_object('removed', (select count(*) from u));
$$;

revoke all on function ve_outreach_roster(text[],boolean,text,text[],text,text,boolean,int,int) from public, anon, authenticated;
revoke all on function ve_outreach_campaign_add(text,uuid[],uuid) from public, anon, authenticated;
revoke all on function ve_outreach_campaign_remove(text,uuid[],uuid) from public, anon, authenticated;
grant execute on function ve_outreach_roster(text[],boolean,text,text[],text,text,boolean,int,int) to service_role;
grant execute on function ve_outreach_campaign_add(text,uuid[],uuid) to service_role;
grant execute on function ve_outreach_campaign_remove(text,uuid[],uuid) to service_role;
