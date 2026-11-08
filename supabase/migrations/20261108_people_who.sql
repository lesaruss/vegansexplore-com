-- branddesk-production-wing: the Outreach Roster's "who" filter (Sean, 2026-11-07: "All people work goes into BrandDesk Outreach as filters").
-- ve_people_who(who, q, limit, offset): one group of people, read only, newest first, with the counts of every group. Each row carries the
-- Depot page that still does the work (`depot`), until BrandDesk takes it over. Guide accounts (member_class agent) are left out.
-- who: members | founding | ambassadors | community_managers | leads | invited | nonprofit_partners | group_partners | role_applications | referral_claims
create or replace function public.ve_people_who(p_who text, p_q text default null, p_limit int default 100, p_offset int default 0)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  q text := nullif(lower(trim(coalesce(p_q, ''))), '');
  lim int := least(greatest(coalesce(p_limit, 100), 1), 500);
  off int := greatest(coalesce(p_offset, 0), 0);
  out jsonb;
begin
  with pw(who, key, name, email, chapter, status, detail, at, depot) as (
  select 'members', m.id::text, m.name, m.email, m.home_community, m.membership_status,
      concat_ws(' · ', case when m.founding_member then 'Founding Member' end, nullif(m.ve_role, 'member'), case when m.entry_via = 'survey' then 'joined by survey' when m.entry_paid_at is not null then 'paid $11' end),
      coalesce(m.entry_paid_at, m.created_at), '/admin/depot/people#person/' || lower(m.email)
    from members m where m.member_class = 'member' and m.membership_status = 'active' and m.email is not null
  union all
  select 'founding', m.id::text, m.name, m.email, m.home_community, m.membership_status,
      concat_ws(' · ', nullif(m.ve_role, 'member'), case when m.entry_via = 'survey' then 'joined by survey' when m.entry_paid_at is not null then 'paid $11' else 'invitation' end),
      coalesce(m.entry_paid_at, m.created_at), '/admin/depot/people#person/' || lower(m.email)
    from members m where m.founding_member and m.member_class in ('member', 'internal') and m.email is not null
  union all
  select 'ambassadors', m.id::text, m.name, m.email, m.home_community, m.membership_status,
      concat_ws(' · ', 'Level ' || coalesce(m.level_override::text, '1+'), nullif(m.ambassador_profile, '')), m.created_at, '/admin/depot/ambassadors#a/' || m.id
    from members m where m.ve_role = 'ambassador' and m.member_class <> 'agent'
  union all
  select 'community_managers', m.id::text, m.name, m.email, m.home_community, m.membership_status, null, m.created_at, '/admin/depot/community-managers'
    from members m where m.ve_role = 'community_manager' and m.member_class <> 'agent'
  union all
  select 'leads', i.id::text, coalesce(i.name, m.name), coalesce(i.email, m.email), m.home_community, i.status,
      concat_ws(' · ', i.initiative_slug, i.action_type, nullif(i.tier_label, '')), coalesce(i.last_click_at, i.created_at), '/dashboard/leads'
    from ve_initiative_interest i left join members m on m.id = i.member_id
    where i.action_type is distinct from 'link_click' or i.member_id is not null or i.email is not null
  union all
  select 'invited', u.id::text, u.name, u.email, u.city_slug, u.status,
      concat_ws(' · ', case u.points_to when 'founding' then 'Founding Member' when 'ambassador' then 'Ambassador' when 'nonprofit' then 'Nonprofit Partner' when 'group' then 'Group Partner' when 'gift' then 'Gift' else u.points_to end, case when u.comp then 'on us' end),
      coalesce(u.sent_at, u.created_at), case when u.points_to = 'founding' then '/admin/depot/founding#invite/' else '/admin/depot/invites#invite/' end || u.id
    from universe_invites u where coalesce(u.brand, 'vegans-explore') in ('vegans-explore', 've')
  union all
  select 'nonprofit_partners', p.id::text, l.name, m.email, null, p.status, concat_ws(' · ', 'lead: ' || m.name, p.rate_pct || '%'), coalesce(p.started_at, p.created_at), '/admin/depot/nonprofit-partners#p/' || p.id
    from ve_nonprofit_partners p join listings l on l.id = p.listing_id left join members m on m.id = p.lead_member_id
  union all
  select 'group_partners', g.id::text, l.name, m.email, null, g.status, case when m.name is not null then 'lead: ' || m.name end, coalesce(g.started_at, g.created_at), '/admin/depot/group-partners#g/' || g.listing_id
    from ve_group_partners g join listings l on l.id = g.listing_id left join members m on m.id = g.lead_member_id
  union all
  select 'role_applications', a.id::text, m.name, m.email, m.home_community, a.status, o.title, a.created_at, '/dashboard/applications'
    from opportunity_applications a left join members m on m.id = a.member_id left join opportunities o on o.id = a.opportunity_id
  union all
  select 'referral_claims', c.id::text, m.name, m.email, m.home_community, c.status, 'typed: ' || left(c.claimed_text, 80), c.created_at, '/admin/depot/referral-claims#c/' || c.id
    from ve_referral_claims c left join members m on m.id = c.member_id
)
  select jsonb_build_object(
    'counts', coalesce((select jsonb_object_agg(who, n) from (select who, count(*) n from pw group by who) s), '{}'::jsonb),
    'total', (select count(*) from pw where who = p_who and (q is null or lower(concat_ws(' ', name, email, chapter, detail)) like '%' || q || '%')),
    'rows', coalesce((select jsonb_agg(to_jsonb(r) - 'who') from (select * from pw where who = p_who and (q is null or lower(concat_ws(' ', name, email, chapter, detail)) like '%' || q || '%') order by at desc nulls last limit lim offset off) r), '[]'::jsonb)
  ) into out;
  return out || jsonb_build_object('who', p_who);
end $$;
revoke all on function public.ve_people_who(text, text, int, int) from public, anon, authenticated;
grant execute on function public.ve_people_who(text, text, int, int) to service_role;
