-- Team accounts are members who share too (Sean's own account is class internal): include them as sponsors, still never agents or quarantined.
-- Names to suggest while someone types: active members only, first name and last initial, the chapter. No emails, nothing else.
create or replace function public.ve_referrer_search(p_q text)
returns table(id uuid, label text, chapter text, role text)
language sql stable security definer set search_path to 'public' as $$
  select m.id,
         initcap(split_part(btrim(m.name), ' ', 1)) || case when position(' ' in btrim(m.name)) > 0 then ' ' || upper(left(regexp_replace(btrim(m.name), '^.*\s', ''), 1)) || '.' else '' end,
         m.home_community,
         case when m.ve_role in ('ambassador','community_manager') then m.ve_role else null end
  from members m
  where length(btrim(coalesce(p_q, ''))) >= 2
    and m.membership_status = 'active' and coalesce(m.member_class, 'member') in ('member','internal') and btrim(coalesce(m.name, '')) <> ''
    and (lower(btrim(m.name)) like lower(btrim(p_q)) || '%' or lower(btrim(m.name)) like '% ' || lower(btrim(p_q)) || '%')
  order by (m.ve_role in ('ambassador','community_manager')) desc, m.referral_count desc nulls last, m.name
  limit 6;
$$;

-- A claim: a picked member (p_referrer) or only typed words (p_text). Never changes a link's sponsor; never after the account is paid.
create or replace function public.ve_referrer_claim(p_member uuid, p_referrer uuid, p_text text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare me record; ref record; picked uuid := p_referrer; st text; n int;
begin
  select id, membership_status, referred_by into me from members where id = p_member;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  if me.membership_status <> 'pending_payment' then return jsonb_build_object('error', 'already_member'); end if;
  if picked is null and btrim(coalesce(p_text, '')) <> '' then
    select count(*), min(m.id::text)::uuid into n, picked from members m
      where m.membership_status = 'active' and coalesce(m.member_class, 'member') in ('member','internal') and lower(btrim(m.name)) = lower(btrim(p_text));
    if n <> 1 then picked := null; end if;
  end if;
  if picked is not null then
    select id into ref from members where id = picked and membership_status = 'active' and coalesce(member_class, 'member') in ('member','internal');
    if not found then picked := null; end if;
  end if;
  if picked = p_member then
    st := 'self'; picked := null;
  elsif picked is null then
    st := 'unresolved';
  elsif me.referred_by is null then
    update members set referred_by = picked where id = p_member; st := 'credited';
  elsif me.referred_by = picked then st := 'matched';
  else st := 'conflict';
  end if;
  insert into ve_referral_claims (member_id, claimed_text, claimed_member_id, link_member_id, status)
    values (p_member, left(nullif(btrim(coalesce(p_text, '')), ''), 120), picked, me.referred_by, st)
  on conflict (member_id) do update set claimed_text = excluded.claimed_text, claimed_member_id = excluded.claimed_member_id,
    link_member_id = excluded.link_member_id, status = excluded.status, created_at = now();
  return jsonb_build_object('status', st);
end $$;

revoke all on function public.ve_referrer_search(text) from public, anon, authenticated;
revoke all on function public.ve_referrer_claim(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.ve_referrer_search(text) to service_role;
grant execute on function public.ve_referrer_claim(uuid, uuid, text) to service_role;
