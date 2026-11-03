-- ve-pathways, profiles step 3 (Sean, 2026-11-03): Pick people can be filtered by a tag.
-- ve_founding_candidates gains p_emails: when set, only those emails (the people holding the tag) are candidates.
-- Everything else is unchanged; callers that pass four arguments by name keep working.
drop function if exists public.ve_founding_candidates(text, text, integer, integer);
create or replace function public.ve_founding_candidates(p_q text default null, p_pool text default null, p_limit integer default 50, p_offset integer default 0, p_emails text[] default null)
 returns jsonb language sql stable security definer set search_path to 'public' as $function$
with guests as (
  select lower(btrim(name)) n, slug from listings
   where status = 'approved' and category in ('Activists', 'Content Creators', 'Athletes', 'Physicians', 'Health Experts', 'Chefs', 'Founders')
),
p as (
  select pe.id person_id, null::uuid member_id,
         btrim(coalesce(pe.first_name, '') || ' ' || coalesce(pe.last_name, '')) name, lower(btrim(pe.email)) email,
         pe.organization, pe.title, coalesce(pe.city, pe.region) city, pe.relationship_summary summary, pe.last_interaction_at,
         coalesce(pe.email_message_count, 0) messages, pe.source, pe.recommended_brand, pe.is_person
    from people pe
   where pe.email is not null and position('@' in pe.email) > 1
     and not coalesce(pe.quarantined, false) and not coalesce(pe.archived, false) and not coalesce(pe.email_unsubscribed, false)
     and not coalesce(pe.is_self, false) and pe.merged_into is null
  union all
  select null, m.id, coalesce(nullif(btrim(m.name), ''), split_part(m.email, '@', 1)), lower(btrim(m.email)), null, null,
         m.home_community, null, m.created_at, 0, 'unpaid', null, true
    from members m
   where m.membership_status = 'pending_payment' and m.member_class is distinct from 'quarantined'
     and m.tenant_id = '00000000-0000-4000-a000-000000000002'::uuid and m.email is not null
),
d as (
  select distinct on (p.email) p.*,
         array_remove(array[
           case when p.recommended_brand = 'vegans-explore' then 'suggested' end,
           case when g.slug is not null then 'guest' end,
           case when p.source = 'unpaid' or um.id is not null then 'unpaid' end,
           case when p.source = 'soflo-vegans' then 'soflo' end,
           case when p.source = 'email-history' then 'email' end,
           case when p.source = 'mailing-list' then 'mailing' end,
           case when p.source in ('instagram', 'cold-list', 'business_card', 'arm-member', 'vegans-explore', 'circle_migration', 'contacts-import') then 'other' end
         ], null) pools,
         g.slug guest_slug
    from p
    left join guests g on g.n = lower(p.name)
    left join members um on lower(um.email) = p.email and um.membership_status = 'pending_payment'
   where p.name <> ''
     and not exists (select 1 from members m where lower(m.email) = p.email and m.membership_status <> 'pending_payment')
     and not exists (select 1 from universe_invites i where lower(i.email) = p.email and i.status not in ('canceled', 'expired'))
     and not exists (select 1 from people_suppression s where s.email = p.email and s.active)
   order by p.email, (p.person_id is null), p.messages desc
),
f as (
  select *, (case when 'suggested' = any(pools) then 0 when 'guest' = any(pools) then 1 when 'unpaid' = any(pools) then 2 else 3 end) rank_group
    from d
   where (p_pool is null or p_pool = '' or p_pool = any(pools))
     and (p_emails is null or email = any(p_emails))
     and (p_q is null or btrim(p_q) = '' or (name || ' ' || email || ' ' || coalesce(organization, '') || ' ' || coalesce(title, '') || ' ' || coalesce(city, '') || ' ' || coalesce(summary, '')) ilike '%' || btrim(p_q) || '%')
)
select jsonb_build_object(
  'total', (select count(*) from f),
  'pools', (select coalesce(jsonb_object_agg(k, c), '{}'::jsonb) from (select unnest(pools) k, count(*) c from d group by 1) x),
  'rows', coalesce((select jsonb_agg(to_jsonb(r) - 'rank_group' - 'recommended_brand' - 'source') from (
     select * from f order by rank_group, messages desc, last_interaction_at desc nulls last, name
      limit least(greatest(coalesce(p_limit, 50), 1), 200) offset greatest(coalesce(p_offset, 0), 0)) r), '[]'::jsonb)
);
$function$;
revoke all on function public.ve_founding_candidates(text, text, integer, integer, text[]) from public, anon, authenticated;
grant execute on function public.ve_founding_candidates(text, text, integer, integer, text[]) to service_role;
