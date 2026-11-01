-- The Tracker (Sean, 2026-11-01: "I just scanned one of my beverages... it should put it... as a pending item, so that way they can
-- track it... when we do add the item, it should show on their tracking list that it was approved and if they got any points for it...
-- where you track the things you're scanning... a history of it over time, the date that it scanned... your contribution over time...
-- how many points you've gathered... maybe the tracker").
-- * ve_product_scans: every scan by a signed-in member (one row per barcode per member every 10 minutes), what it was and whether we
--   knew it. RLS on, no policies: read through ve-products tracker.
-- * ve_product_barcodes.points and paid_at: what a member's added product paid when the team approved it in Depot > Venues > Barcodes.
--   An approved product pays its adder 25 points once (ve_site_settings product_barcode_points, Logan's default, Sean's to change;
--   reason barcode_add, ref barcode:<gtin>).

create table if not exists ve_product_scans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null,
  gtin text not null,
  found boolean not null default false,
  product_id uuid references ve_products(id) on delete set null,
  name text,
  created_at timestamptz not null default now()
);
create index if not exists ve_product_scans_member on ve_product_scans (member_id, created_at desc);
alter table ve_product_scans enable row level security;

alter table ve_product_barcodes add column if not exists points int not null default 0;
alter table ve_product_barcodes add column if not exists paid_at timestamptz;

alter table points_ledger drop constraint if exists points_ledger_reason_check;
alter table points_ledger add constraint points_ledger_reason_check check (reason = any (array['signup', 'referral', 'daily_login',
  'listing_like', 'listing_create', 'discussion_post', 'discussion_reply', 'discussion_vote', 'event_attend', 'profile_complete',
  'profile_field', 'admin_adjust', 'purchase', 'redemption', 'vote_given', 'vote_received', 'vote_refunded', 'featured_purchase',
  'transfer_sent', 'transfer_received', 'store_purchase', 'store_refund', 'points_purchase', 'bartering', 'boost_purchase',
  'seed_initial', 'Welcome bonus + early activity', 'campaign_back', 'questionnaire', 'wizard_redeem', 've_hunt_complete',
  've_hunt_anchor', 'guide_redeem', 'cycle_grant', 'bounty', 'comp_membership', 'recipe_approved', 'guide_chat_spend',
  'credit_exchange', 'checkin', 'welcome', 'purchase_thanks', 'points_contribution', 'listing_submit', 'profile_answer',
  'partner_optin', 'venue_report', 'nonprofit_survey', 'barcode_add']::text[])) not valid;

insert into ve_site_settings (key, value) values ('product_barcode_points', '{"approved": 25}'::jsonb)
on conflict (key) do nothing;
