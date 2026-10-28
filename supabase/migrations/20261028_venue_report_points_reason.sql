-- The points ledger refused reason 'venue_report', so an accepted venue report could not pay (caught testing the Stadium &
-- Arena Guide's review in a rolled-back transaction, 2026-10-28, before any member report existed). Same list plus it.
alter table public.points_ledger drop constraint if exists points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check check (reason = any (array['signup', 'referral',
  'daily_login', 'listing_like', 'listing_create', 'discussion_post', 'discussion_reply', 'discussion_vote', 'event_attend',
  'profile_complete', 'profile_field', 'admin_adjust', 'purchase', 'redemption', 'vote_given', 'vote_received', 'vote_refunded',
  'featured_purchase', 'transfer_sent', 'transfer_received', 'store_purchase', 'store_refund', 'points_purchase', 'bartering',
  'boost_purchase', 'seed_initial', 'Welcome bonus + early activity', 'campaign_back', 'questionnaire', 'wizard_redeem',
  've_hunt_complete', 've_hunt_anchor', 'guide_redeem', 'cycle_grant', 'bounty', 'comp_membership', 'recipe_approved',
  'guide_chat_spend', 'credit_exchange', 'checkin', 'welcome', 'purchase_thanks', 'points_contribution', 'listing_submit',
  'profile_answer', 'partner_optin', 'venue_report']::text[])) not valid;
