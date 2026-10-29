-- The Nonprofit Guide (LOCKED by Sean 2026-10-29, playbook ve-nonprofit-guide, canon canon-ve-nonprofit-guide; Sean: "hand it to Logan").
-- Page guides/nonprofit-guide.html, script guide-scripts/nonprofit-guide.js. $11 or 1,100 points like every Guide; a Nonprofit Partner's
-- lead gets it with the partnership. Its members-only text (tips 2 to 10, the peer-to-peer kit, the pitch, the support plan) is
-- ve_guides.content_html, written by the one-time function from the session, never kept in this repo (the Restaurant Guide's rule).
-- Run through a one-time function (the connector holds writes). Safe to run twice.

-- 1. The Guide's row: published so ve-guide-unlock sells and opens it; the page stays noindex and off the catalog until Sean launches it.
insert into ve_guides (title, slug, description, cost_lesars, published, access_rule, sort_order)
select 'The Nonprofit Guide', 'nonprofit-guide',
       'For the people who keep Vegan nonprofits, rescues and sanctuaries going: ten ways to fundraise and stay relevant, our nonprofit series and interviews, the Directory, businesses near you that fit a tie-in, and how to get found.',
       1100, true, 'points', 6
where not exists (select 1 from ve_guides where slug = 'nonprofit-guide');

-- 2. The organization survey (Tell us about your organization): one row per member, paid once in points.
create table if not exists public.ve_nonprofit_surveys (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references members(id) on delete cascade,
  listing_id uuid references listings(id) on delete set null,
  org_name text,
  answers jsonb not null default '{}'::jsonb,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ve_nonprofit_surveys enable row level security;

-- The ledger accepts the survey's reason (kept NOT VALID like before, so old rows are not re-checked).
alter table public.points_ledger drop constraint if exists points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check CHECK ((reason = ANY (ARRAY['signup'::text, 'referral'::text, 'daily_login'::text, 'listing_like'::text, 'listing_create'::text, 'discussion_post'::text, 'discussion_reply'::text, 'discussion_vote'::text, 'event_attend'::text, 'profile_complete'::text, 'profile_field'::text, 'admin_adjust'::text, 'purchase'::text, 'redemption'::text, 'vote_given'::text, 'vote_received'::text, 'vote_refunded'::text, 'featured_purchase'::text, 'transfer_sent'::text, 'transfer_received'::text, 'store_purchase'::text, 'store_refund'::text, 'points_purchase'::text, 'bartering'::text, 'boost_purchase'::text, 'seed_initial'::text, 'Welcome bonus + early activity'::text, 'campaign_back'::text, 'questionnaire'::text, 'wizard_redeem'::text, 've_hunt_complete'::text, 've_hunt_anchor'::text, 'guide_redeem'::text, 'cycle_grant'::text, 'bounty'::text, 'comp_membership'::text, 'recipe_approved'::text, 'guide_chat_spend'::text, 'credit_exchange'::text, 'checkin'::text, 'welcome'::text, 'purchase_thanks'::text, 'points_contribution'::text, 'listing_submit'::text, 'profile_answer'::text, 'partner_optin'::text, 'venue_report'::text, 'nonprofit_survey'::text]))) NOT VALID;

-- 3. A Nonprofit Partner's lead gets the Guide with the partnership (the playbook: "included for Nonprofit Partner leads").
create or replace function public.ve_nonprofit_partner_start(p_listing uuid, p_lead uuid, p_invite uuid, p_points integer)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare l listings; v_id uuid;
begin
  select * into l from listings where id = p_listing;
  if l.id is null then return null; end if;
  insert into ve_nonprofit_partners (listing_id, lead_member_id, code, invite_id)
  values (l.id, p_lead, ve_partner_code(l.name), p_invite)
  on conflict (listing_id) do update set lead_member_id = excluded.lead_member_id, invite_id = coalesce(excluded.invite_id, ve_nonprofit_partners.invite_id),
    status = 'active', updated_at = now()
  returning id into v_id;
  if coalesce(p_points, 0) > 0 then
    perform ve_partner_points_grant(v_id, p_points, 'invite', 'invite:' || coalesce(p_invite::text, gen_random_uuid()::text));
  end if;
  update listings set tags = array_append(coalesce(tags, '{}'), 've-nonprofit-partner'), updated_at = now()
   where id = l.id and not ('ve-nonprofit-partner' = any(coalesce(tags, '{}')));
  if p_lead is not null then
    insert into ve_guide_purchases (member_id, guide_id, lesars_spent, paid_with)
    select p_lead, g.id, 0, 'nonprofit_partner' from ve_guides g where g.slug = 'nonprofit-guide'
    on conflict (member_id, guide_id) do nothing;
  end if;
  return v_id;
end $$;
revoke all on function public.ve_nonprofit_partner_start(uuid, uuid, uuid, integer) from public, anon, authenticated;

-- Leads of partnerships made before this (none on 2026-10-29), and Sean's own copy to review it before launch.
insert into ve_guide_purchases (member_id, guide_id, lesars_spent, paid_with)
select p.lead_member_id, g.id, 0, 'nonprofit_partner' from ve_nonprofit_partners p join ve_guides g on g.slug = 'nonprofit-guide'
 where p.lead_member_id is not null and p.status <> 'ended'
on conflict (member_id, guide_id) do nothing;
insert into ve_guide_purchases (member_id, guide_id, lesars_spent, paid_with)
select '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, g.id, 0, 'comp' from ve_guides g where g.slug = 'nonprofit-guide'
on conflict (member_id, guide_id) do nothing;
