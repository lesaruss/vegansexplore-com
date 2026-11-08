-- brooke-sellers / branddesk-production-wing: Brooke Sellers, the first BrandDesk client (Sean, 2026-11-08: "Brooke is our first
-- BrandDesk client. We just need to get her set up."). Applied 2026-11-08 through the connector; kept here as the record.
-- 1. Her Vegans Explore account, waiting on her survey (pending_payment, not a comp; she becomes a member through her Creator Guide survey).
-- 2. Her People listing (brooke-sellers) names the account (details.person.member_id; never owner_member_id).
-- 3. Her BrandDesk account: active, no BrandDesk Stripe subscription (she is billed $200 a month on the LESARUSS Stripe account through
--    HQ client billing, client_billing_plans fb28f444, first charge 2026-11-30), no setup fee so setup_paid_at is set (Library downloads open),
--    agreement not signed (founding partner terms), brand kit step ticked by hand (her kit is the meatless-muscle brand kit).
-- Her current site (meatlessmuscle.com) was archived the same day through ve-branddesk `archive`.
insert into public.members (email, name, tenant_id, membership_status, member_class, class_reason, home_community)
select 'bsellersotss@gmail.com', 'Brooke Sellers', '00000000-0000-4000-a000-000000000002', 'pending_payment', 'member',
       'Made by Logan for BrandDesk client setup (Sean, 2026-11-08). Becomes a member through her Creator Guide survey.', 'south-florida'
where not exists (select 1 from public.members where lower(email) = 'bsellersotss@gmail.com');

update public.listings set details = jsonb_set(coalesce(details, '{}'::jsonb), '{person,member_id}',
  to_jsonb((select id from public.members where lower(email) = 'bsellersotss@gmail.com')::text), true)
where slug = 'brooke-sellers';

insert into public.ve_branddesk_accounts (listing_id, member_id, setup_plan, social, status, test, agreement_version, agreed_name,
  activated_at, setup_paid_at, website_url, note, onboarding)
select l.id, m.id, 'full', false, 'active', false, 'founding-partner-2026-11', 'Not signed: founding partner terms', now(), now(),
  'https://meatlessmuscle.com/',
  'Founding partner, $200 a month on the LESARUSS Stripe account through HQ client billing (client_billing_plans fb28f444, first charge Nov 30, 2026). No BrandDesk Stripe subscription: Pause and End it in the Depot do not apply. No setup fee, so her Library downloads are open.',
  jsonb_build_object('brand_kit', jsonb_build_object('done_at', now(), 'by', 'Logan', 'note', 'Her kit is the meatless-muscle brand kit (/business/brand?brand=meatless-muscle): logo, colors and type locked; voice and story drafts.'))
from public.listings l, public.members m
where l.slug = 'brooke-sellers' and lower(m.email) = 'bsellersotss@gmail.com'
  and not exists (select 1 from public.ve_branddesk_accounts x where x.listing_id = l.id and x.status in ('active', 'paused', 'canceling'));
