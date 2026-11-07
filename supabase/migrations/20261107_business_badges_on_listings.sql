-- ve-pre-vegan-business-guide: the business badge shows on the owner's listings, and a 100% Vegan claim waiting for a check is an Inbox row.
-- (Sean, 2026-11-07: "let's work through the items that aren't built".) canon-ve-business-badges.
-- A listing wears one tag for its owner's shown badge: ve-badge-vegan, ve-badge-plant-based or ve-badge-pre-vegan. Tags are public,
-- so the Directory card and the listing page read them like ve-nonprofit-partner. Only listings whose claim was approved
-- (owner_member_id set) and that are not People pages.

create or replace function public.ve_listing_badge_tag(p_shown text) returns text language sql immutable as $$
  select case p_shown when 'vegan' then 've-badge-vegan' when 'plant_based' then 've-badge-plant-based' when 'pre_vegan' then 've-badge-pre-vegan' end;
$$;

create or replace function public.ve_listing_badge_apply(p_member uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_tag text;
begin
  if p_member is null then return; end if;
  select ve_listing_badge_tag(shown) into v_tag from ve_business_badges where member_id = p_member;
  update listings l set tags = (
      select coalesce(array_agg(t), '{}') from unnest(coalesce(l.tags, '{}')) t
       where t not in ('ve-badge-vegan', 've-badge-plant-based', 've-badge-pre-vegan')
    ) || case when v_tag is not null and l.category not in ('Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders','Promoters')
              then array[v_tag] else '{}'::text[] end
   where l.owner_member_id = p_member
     and coalesce(l.tags, '{}') is distinct from (
      (select coalesce(array_agg(t), '{}') from unnest(coalesce(l.tags, '{}')) t where t not in ('ve-badge-vegan','ve-badge-plant-based','ve-badge-pre-vegan'))
      || case when v_tag is not null and l.category not in ('Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders','Promoters')
              then array[v_tag] else '{}'::text[] end);
end $$;
revoke all on function public.ve_listing_badge_apply(uuid) from public, anon, authenticated;

create or replace function public.ve_listing_badge_trg_badge() returns trigger language plpgsql security definer set search_path = public as $$
begin perform ve_listing_badge_apply(coalesce(new.member_id, old.member_id)); return null; end $$;
drop trigger if exists trg_ve_listing_badge_from_badge on public.ve_business_badges;
create trigger trg_ve_listing_badge_from_badge after insert or update of shown or delete on public.ve_business_badges
  for each row execute function public.ve_listing_badge_trg_badge();

-- A listing that changes hands: clear the old badge tag, apply the new owner's.
create or replace function public.ve_listing_badge_trg_owner() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.owner_member_id is null and coalesce(new.tags, '{}') && array['ve-badge-vegan','ve-badge-plant-based','ve-badge-pre-vegan'] then
    update listings set tags = (select coalesce(array_agg(t), '{}') from unnest(tags) t where t not in ('ve-badge-vegan','ve-badge-plant-based','ve-badge-pre-vegan'))
     where id = new.id;
  elsif new.owner_member_id is not null then
    update listings set tags = (select coalesce(array_agg(t), '{}') from unnest(coalesce(tags, '{}')) t where t not in ('ve-badge-vegan','ve-badge-plant-based','ve-badge-pre-vegan'))
     where id = new.id and coalesce(tags, '{}') && array['ve-badge-vegan','ve-badge-plant-based','ve-badge-pre-vegan'];
    perform ve_listing_badge_apply(new.owner_member_id);
  end if;
  return null;
end $$;
drop trigger if exists trg_ve_listing_badge_owner on public.listings;
create trigger trg_ve_listing_badge_owner after insert or update of owner_member_id on public.listings
  for each row execute function public.ve_listing_badge_trg_owner();

-- Backfill every member with a badge.
select ve_listing_badge_apply(member_id) from ve_business_badges;

-- Inbox: a 100% Vegan claim waiting for the team's check (appended to the live ve_inbox_items).
do $do$
declare d text;
begin
  d := pg_get_functiondef('public.ve_inbox_items(timestamp with time zone)'::regprocedure);
  if position('''business_badge''' in d) > 0 then return; end if;
  d := regexp_replace(d, '\s*order by 3 desc;\s*\$function\$\s*$', '');
  d := d || $add$
  union all
  select 'business_badge', b.member_id, b.claimed_at, '100% Vegan badge to check',
    coalesce(nullif(sh.value #>> '{}', ''), m.name, 'A business') || ' says everything they sell is Vegan, run for the animals.',
    'Approve it or follow up in Depot > Business badges',
    b.member_id, m.name, m.email, m.home_community, '/admin/depot/badges#b/' || b.member_id
  from ve_business_badges b
  join members m on m.id = b.member_id
  left join ve_member_shared_answers sh on sh.member_id = b.member_id and sh.key = 'org_name'
  where b.claimed_at >= p_since and b.status = 'checking' and coalesce(m.name, '') not like '[TEST]%'
  order by 3 desc;
$function$
$add$;
  execute d;
end $do$;
