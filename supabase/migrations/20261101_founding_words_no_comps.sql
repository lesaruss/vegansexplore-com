-- Founding Members close at midnight Eastern on January 1, 2027, and no more comps (Sean, 2026-11-01; playbook
-- ve-pricing-points-passport, DECISION AND BUILD RECORD 2026-11-01). Safe to run twice.
--
-- 1. An Ambassador invitation without a comp (Logan's default, Sean's to change): accepting is "Said yes" for someone who has not
--    paid, the $11 checkout follows (the Founding Member invitation's flow), and paying makes them an Ambassador with the level,
--    profile and the points Sean chose. A member who already paid becomes an Ambassador at once. Founding Member now comes only
--    from paying before the deadline (trg_ve_founding_on_paid), never from the invitation itself; comps already given stay.

create or replace function public.universe_invite_claim(p_invite uuid, p_member uuid)
 returns text language plpgsql security definer set search_path to 'public'
as $function$
declare inv public.universe_invites; who_email text; who_status text;
begin
  select * into inv from universe_invites where id = p_invite for update;
  if not found then return 'not_found'; end if;
  if inv.status = 'joined' then return case when inv.claimed_member_id = p_member then 'already' else 'used' end; end if;
  if inv.status = 'canceled' then return 'canceled'; end if;
  if inv.status = 'declined' then return 'declined'; end if;
  if inv.status <> 'accepted' and (inv.status = 'expired' or (inv.expires_at is not null and inv.expires_at < now())) then
    update universe_invites set status = 'expired', updated_at = now() where id = inv.id;
    return 'expired';
  end if;
  select email, membership_status into who_email, who_status from members where id = p_member;
  if lower(btrim(coalesce(who_email, ''))) <> lower(btrim(inv.email)) then return 'wrong_email'; end if;
  -- Nonprofit Partner: the organization is the partner and the lead's membership is on us (locked canon, unchanged).
  if inv.points_to = 'nonprofit' then
    if inv.listing_id is null then return 'not_found'; end if;
    update universe_invites set status = 'joined', joined_at = now(), accepted_at = coalesce(accepted_at, now()), claimed_member_id = p_member, updated_at = now() where id = inv.id;
    if coalesce(who_status, '') <> 'active' then
      update members set membership_status = 'active', entry_paid_at = coalesce(entry_paid_at, now()), founding_member = true, updated_at = now() where id = p_member;
      perform ve_points_grant(p_member, 1100, 'comp_membership', 'invite:' || inv.id);
    end if;
    perform ve_nonprofit_partner_start(inv.listing_id, p_member, inv.id, inv.points);
    return 'joined';
  end if;
  -- Group Partner: the organizer leads it, their membership on us (locked canon, unchanged).
  if inv.points_to = 'group' then
    if inv.listing_id is null then return 'not_found'; end if;
    update universe_invites set status = 'joined', joined_at = now(), accepted_at = coalesce(accepted_at, now()), claimed_member_id = p_member, updated_at = now() where id = inv.id;
    if coalesce(who_status, '') <> 'active' then
      update members set membership_status = 'active', entry_paid_at = coalesce(entry_paid_at, now()), founding_member = true, updated_at = now() where id = p_member;
      perform ve_points_grant(p_member, 1100, 'comp_membership', 'invite:' || inv.id);
    end if;
    insert into ve_group_partners (listing_id, lead_member_id, status, invite_id)
    values (inv.listing_id, p_member, 'onboarding', inv.id)
    on conflict (listing_id) do update set lead_member_id = excluded.lead_member_id, invite_id = excluded.invite_id,
      status = case when ve_group_partners.status in ('active', 'paused') then ve_group_partners.status else 'onboarding' end, updated_at = now();
    return 'joined';
  end if;
  -- A Founding Member or Ambassador invitation for someone who has not paid: yes now, joined when they pay the $11
  -- (trg_ve_founding_invite_paid).
  if inv.points_to in ('founding', 'ambassador') and not inv.comp and coalesce(who_status, '') <> 'active' then
    update universe_invites set status = 'accepted', accepted_at = coalesce(accepted_at, now()), claimed_member_id = p_member, updated_at = now()
      where id = inv.id;
    return 'accepted';
  end if;
  update universe_invites set status = 'joined', joined_at = now(), accepted_at = coalesce(accepted_at, now()), claimed_member_id = p_member, updated_at = now() where id = inv.id;
  -- A comp made before 2026-11-01 (none are made now) is a Founding Membership with the points Sean chose.
  if inv.comp and inv.brand = 'vegans-explore' then
    update members set membership_status = 'active', entry_paid_at = coalesce(entry_paid_at, now()), founding_member = true, updated_at = now()
      where id = p_member;
    if inv.points > 0 then
      perform ve_points_grant(p_member, inv.points, 'comp_membership', 'invite:' || inv.id);
    end if;
  end if;
  -- A Founding Member invitation accepted by someone who already paid marks them, before the deadline only.
  if inv.points_to = 'founding' and inv.brand = 'vegans-explore' and now() < ve_founding_deadline() then
    update members set founding_member = true, updated_at = now() where id = p_member;
  end if;
  -- An Ambassador invitation makes them an Ambassador, never over a staff role, with the points Sean chose (paid ones; a comp's
  -- points were granted above).
  if inv.points_to = 'ambassador' and inv.brand = 'vegans-explore' then
    update members set ve_role = 'ambassador', updated_at = now()
      where id = p_member and coalesce(ve_role, 'member') = 'member';
    if not inv.comp and coalesce(inv.points, 0) > 0 then
      perform ve_points_grant(p_member, inv.points, 'admin_adjust', 'invite:' || inv.id);
    end if;
  end if;
  if inv.points_to = 'ambassador' and inv.profile is not null then
    update members set ambassador_profile = inv.profile, updated_at = now() where id = p_member;
  end if;
  if inv.level is not null and inv.level > 1 then
    update members set level_override = greatest(coalesce(level_override, 1), inv.level), updated_at = now() where id = p_member;
  end if;
  return 'joined';
end $function$;

-- Paying the $11 finishes a Founding Member invitation (as before, Founding Member only before the deadline) and an Ambassador
-- invitation they said yes to (the role, level, profile and points through universe_invite_claim).
create or replace function public.ve_founding_invite_paid()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
declare r record;
begin
  if NEW.membership_status = 'active' and (TG_OP = 'INSERT' or OLD.membership_status is distinct from 'active') and NEW.email is not null then
    update universe_invites
       set status = 'joined', joined_at = now(), accepted_at = coalesce(accepted_at, now()), claimed_member_id = NEW.id, updated_at = now()
     where brand = 'vegans-explore' and points_to = 'founding'
       and status in ('sent', 'opened', 'accepted')
       and (claimed_member_id = NEW.id or lower(email) = lower(NEW.email));
    if found and now() < ve_founding_deadline() then
      update members set founding_member = true where id = NEW.id and coalesce(founding_member, false) = false;
    end if;
    for r in select id from universe_invites
              where brand = 'vegans-explore' and points_to = 'ambassador' and status = 'accepted' and not comp
                and (claimed_member_id = NEW.id or lower(email) = lower(NEW.email)) loop
      perform universe_invite_claim(r.id, NEW.id);
    end loop;
  end if;
  return NEW;
end $function$;

-- 2. The deadline in the words.
update public.ve_nav_announcements set message = 'Founding Membership closes at midnight Eastern on January 1, 2027: $11 one time, with 1,100 points.'
where href = '/passport' and message like 'Your Passport: $11 one time%';

update public.knowledge_records
set body = jsonb_set(body, '{facts}', to_jsonb((body->>'facts') || E'\n- Founding Members: Founding Membership closes at midnight Eastern on January 1, 2027. Anyone who pays the $11 before then is a Founding Member for good, and it stays on their profile. After that the $11 is the Passport, the same membership without the Founding Member mark. Memberships are no longer given away: everyone joins with the $11.')),
    updated_at = now()
where slug = 've-guide-platform-facts' and body->>'facts' not like '%Founding Membership closes at midnight Eastern on January 1, 2027%';

update public.guide_kb_answers
set answer = 'A Founding Member is anyone who joins with the $11, one time, before Founding Membership closes at midnight Eastern on January 1, 2027. Join before then and Founding Member stays on your profile for good. Founding Members help fund what we are building and help decide what it becomes.',
    updated_at = now()
where question = 'What is a Founding Member?' and status = 'live';

insert into public.guide_kb_answers (topic, question, also_asked, answer, link_url, link_label, status, source, created_by)
select 'membership', 'When can I become a Founding Member?',
  array['Is there a deadline to become a Founding Member?', 'When does Founding Membership close?', 'Can I still be a Founding Member?', 'What happens after January 1?'],
  'Founding Membership closes at midnight Eastern on January 1, 2027. Join before then and Founding Member stays on your profile for good. After that the $11 is the Passport: the same membership and 1,100 points, without the Founding Member mark.',
  '/passport', 'Get your Passport', 'live', 'logan', 'logan'
where not exists (select 1 from public.guide_kb_answers where question = 'When can I become a Founding Member?');

-- The comps are over: the two answers about a membership on us now say so.
update public.guide_kb_answers set status = 'retired', updated_at = now()
where question in ('Does a free membership come with points?', 'What does a membership on us include?') and status = 'live';
