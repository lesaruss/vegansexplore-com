-- Votes on the LESARUSS.ai Directory (Sean, 2026-10-29: "Go ahead with the voting next").
--
-- lesaruss.ai runs this site's Directory, listing page and claim page in its colors (public/ve-brand.js). Its members sign in
-- with Continue with LESARUSS as their own client, 'lesaruss-ai' (HQ /connect names it from this table), and ve-lesaruss-sso
-- lets in only a LESARUSS member: a Diplomat, a LESARUSS Passport holder or a super admin (lr_member_entitled). Their token
-- carries brand 'lesaruss-ai', and ve-votes counts their vote, in the same pool as Vegans Explore, only for a listing in the
-- LESARUSS.ai Directory (lr_listing_in_directory). A Vegans Explore Passport alone does not vote there: each community is its
-- own $11 (Sean, 2026-10-29), and a Diplomat is welcome in every one.

insert into lesaruss_sso_clients (client, name, redirect_uris, redirect_pattern)
values ('lesaruss-ai', 'the LESARUSS.ai Directory',
  array['https://lesaruss.ai/auth/lesaruss', 'https://www.lesaruss.ai/auth/lesaruss'],
  '^https://lesaruss-ai-site[a-z0-9-]*\.vercel\.app/auth/lesaruss$')
on conflict (client) do update set name = excluded.name, redirect_uris = excluded.redirect_uris,
  redirect_pattern = excluded.redirect_pattern, active = true;

-- A LESARUSS member: a super admin, a Diplomat (lesaruss_is_diplomat), or a LESARUSS.ai brand membership on record
-- (brand_memberships 'lesaruss-ai': 'passport', written by HQ when a listing claim's $11 is paid, or 'diplomat').
-- A free LESARUSS.ai account is not one: its membership_status reads 'active' without paying.
create or replace function lr_member_entitled(p_member uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select m.is_superadmin is true
      or lesaruss_is_diplomat(m.email)
      or exists (select 1 from brand_memberships b where b.member_id = m.id and b.brand = 'lesaruss-ai'
                 and b.kind in ('passport', 'diplomat') and b.status = 'active' and (b.ends_at is null or b.ends_at > now()))
    from members m where m.id = p_member), false);
$$;

-- In the LESARUSS.ai Directory: the same rule as lesaruss-ai-site's page and ve-brand.js ownsListing (its tags, the shared
-- Studios) plus an active business member's listing (ad_businesses, as lesaruss-ai-site lib/directory.ts memberListingIds).
create or replace function lr_listing_in_directory(p_listing uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from listings l where l.id = p_listing and l.status = 'approved'
    and (l.tags && array['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member']
         or l.category = 'Studios'
         or exists (select 1 from ad_businesses a where a.listing_id = l.id and a.membership_status = 'active')));
$$;

revoke all on function lr_member_entitled(uuid) from public, anon, authenticated;
revoke all on function lr_listing_in_directory(uuid) from public, anon, authenticated;
grant execute on function lr_member_entitled(uuid) to service_role;
grant execute on function lr_listing_in_directory(uuid) to service_role;
