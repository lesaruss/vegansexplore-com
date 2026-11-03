-- A door Guide (canon-ve-door-guides) is open to any active member (the $11, or the Guide's survey), so saves, votes and My list work for them.
create or replace function public.ve_owns_guide(p_member uuid, p_guide text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from ve_guide_purchases p join ve_guides g on g.id = p.guide_id
                 where p.member_id = p_member and (g.slug = p_guide or g.slug = p_guide || '-site'))
      or exists (select 1 from ve_guides g join members m on m.id = p_member
                 where g.slug = p_guide and g.door and m.membership_status = 'active' and coalesce(m.member_class, 'member') <> 'agent');
$$;
revoke all on function public.ve_owns_guide(uuid, text) from public, anon, authenticated;
