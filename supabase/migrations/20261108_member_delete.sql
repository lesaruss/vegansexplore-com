-- ve-mobile-app: Delete my account (Apple 5.1.1(v), Google Play account deletion), 2026-11-08.
-- One email is one members row across every brand, so deletion is by brand:
--   * a Vegans Explore account (tenant ...0002 and no other brand's membership): the row is scrubbed of everything that names the
--     person, every sign-in is cleared, standing becomes 'banned' so every function refuses its old sessions, and deleted_at is set;
--     the row itself stays (points ledger, votes and commissions point at it) but no longer identifies anyone;
--   * a shared login (a LESARUSS account or a Diplomat): only the Vegans Explore side goes (its brand memberships, saves, survey
--     answers, devices, chapters); the login stays for the other brand.
-- member_class becomes 'quarantined' so HQ People's mirror (trg_zz_people_mirror_ve) and member counts skip the row.
-- The person's email is added to email_suppressions so nothing is sent to it again. Never for super admins or Guide accounts.

alter table public.members add column if not exists deleted_at timestamptz;

create or replace function public.ve_member_delete(p_member uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  m public.members%rowtype;
  v_shared boolean;
  v_email text;
begin
  select * into m from public.members where id = p_member for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  if m.deleted_at is not null then return jsonb_build_object('ok', true, 'already', true); end if;
  if m.is_superadmin then return jsonb_build_object('ok', false, 'error', 'super_admin'); end if;
  if m.member_class = 'agent' then return jsonb_build_object('ok', false, 'error', 'guide_account'); end if;

  v_email := lower(btrim(m.email));
  v_shared := m.tenant_id <> '00000000-0000-4000-a000-000000000002'::uuid
    or exists (select 1 from public.brand_memberships b where b.member_id = m.id and b.brand <> 'vegans-explore');

  -- The Vegans Explore side, for every account.
  delete from public.brand_memberships where member_id = m.id and brand = 'vegans-explore';
  delete from public.ve_survey_answers where member_id = m.id;
  delete from public.ve_member_devices where member_id = m.id;
  delete from public.ve_listing_saves where member_id = m.id;
  if to_regclass('public.ve_episode_saves') is not null then execute 'delete from public.ve_episode_saves where member_id = $1' using m.id; end if;
  if to_regclass('public.ve_guide_saves') is not null then execute 'delete from public.ve_guide_saves where member_id = $1' using m.id; end if;
  if to_regclass('public.ve_listing_optins') is not null then execute 'delete from public.ve_listing_optins where member_id = $1' using m.id; end if;
  if to_regclass('public.ve_recipe_picks') is not null then execute 'delete from public.ve_recipe_picks where member_id = $1' using m.id; end if;
  if to_regclass('public.member_communities') is not null then execute 'delete from public.member_communities where member_id = $1' using m.id; end if;
  update public.ve_tasters set email = 'deleted+' || id || '@deleted.vegansexplore.com', name = 'Deleted', unsubscribed_at = coalesce(unsubscribed_at, now())
   where lower(email) = v_email;
  update public.listings set details = details #- '{person,member_id}'
   where details #>> '{person,member_id}' = m.id::text;

  insert into public.email_suppressions (email, scope, reason, source, note, active)
  select v_email, 'global', 'manual', 've_member_delete', 'Deleted their Vegans Explore account', true
   where v_email <> '' and not exists (select 1 from public.email_suppressions s where s.email = v_email and s.scope = 'global' and s.active);

  if v_shared then
    update public.members set home_community = null, mission_survey_answers = null, mission_survey_draft = null,
      mission_survey_response = null, show_checkins = false, updated_at = now()
     where id = m.id;
    return jsonb_build_object('ok', true, 'shared', true);
  end if;

  -- A Vegans Explore account: nothing left that names the person, and no way back in.
  update public.members set
    email = 'deleted+' || m.id || '@deleted.vegansexplore.com', name = 'Deleted member', username = null, initials = null,
    password_hash = null, google_id = null, apple_id = null, totp_secret = null, totp_enabled = false, auth_methods = '{}',
    avatar_url = null, profile_image_url = null, profile_headline = null, profile_location = null, profile_website = null,
    bio = null, profile_bio = null, location = null, instagram_handle = null, social_links = null, vegan_since = null,
    assessment_answers = null, profile_questions = null, mission_survey_answers = null, mission_survey_draft = null,
    mission_survey_response = null, signup_utm = null, activation_token = null, referral_code = null,
    home_community = null, show_checkins = false, profile_visibility = 'private', lesaruss_identity_id = null,
    member_class = 'quarantined', class_reason = 'account_deleted', classified_at = now(),
    standing = 'banned', standing_at = now(), membership_status = 'cancelled', deleted_at = now(), updated_at = now()
   where id = m.id;
  return jsonb_build_object('ok', true, 'shared', false);
end $$;

revoke all on function public.ve_member_delete(uuid) from public, anon, authenticated;
grant execute on function public.ve_member_delete(uuid) to service_role;
