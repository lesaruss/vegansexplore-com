-- Submit your listing for 1,100 points (Sean, 2026-10-27: "It's 1100 points or $11 to submit your listing, but you get 1100 points
-- when you register... if you want to submit multiple listings... it would be 1100 points each time... or you can just pay").
-- ve-claims listing_apply with pay 'points' calls this once the application is saved: it takes the points from both balances
-- (members.lesars_balance and member_points), once per application (points_ledger reason listing_submit, ref claim:<id>).
create or replace function public.ve_listing_submit_points(p_member uuid, p_claim uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare m members; cost constant integer := 1100; ref text := 'claim:' || p_claim;
begin
  select * into m from members where id = p_member for update;
  if m.id is null then return jsonb_build_object('error', 'member_not_found'); end if;
  if not exists (select 1 from ve_listing_claims where id = p_claim and member_id = p_member) then return jsonb_build_object('error', 'claim_not_found'); end if;
  if exists (select 1 from points_ledger where member_id = p_member and reason = 'listing_submit' and ref_id = ref) then
    return jsonb_build_object('ok', true, 'already', true, 'balance', coalesce(m.lesars_balance, 0));
  end if;
  if coalesce(m.lesars_balance, 0) < cost then return jsonb_build_object('error', 'not_enough_points', 'balance', coalesce(m.lesars_balance, 0), 'cost', cost); end if;
  update members set lesars_balance = lesars_balance - cost where id = p_member;
  perform apply_member_points_delta(p_member, -cost);
  insert into points_ledger (member_id, delta, reason, ref_id) values (p_member, -cost, 'listing_submit', ref);
  return jsonb_build_object('ok', true, 'balance', m.lesars_balance - cost, 'cost', cost);
end $$;
revoke all on function public.ve_listing_submit_points(uuid, uuid) from public, anon, authenticated;

-- The ledger's reason list gains listing_submit (the rest unchanged).
alter table points_ledger drop constraint points_ledger_reason_check;
alter table points_ledger add constraint points_ledger_reason_check CHECK ((reason = ANY (ARRAY['signup'::text, 'referral'::text, 'daily_login'::text, 'listing_like'::text, 'listing_create'::text, 'discussion_post'::text, 'discussion_reply'::text, 'discussion_vote'::text, 'event_attend'::text, 'profile_complete'::text, 'profile_field'::text, 'admin_adjust'::text, 'purchase'::text, 'redemption'::text, 'vote_given'::text, 'vote_received'::text, 'vote_refunded'::text, 'featured_purchase'::text, 'transfer_sent'::text, 'transfer_received'::text, 'store_purchase'::text, 'store_refund'::text, 'points_purchase'::text, 'bartering'::text, 'boost_purchase'::text, 'seed_initial'::text, 'Welcome bonus + early activity'::text, 'campaign_back'::text, 'questionnaire'::text, 'wizard_redeem'::text, 've_hunt_complete'::text, 've_hunt_anchor'::text, 'guide_redeem'::text, 'cycle_grant'::text, 'bounty'::text, 'comp_membership'::text, 'recipe_approved'::text, 'guide_chat_spend'::text, 'credit_exchange'::text, 'checkin'::text, 'welcome'::text, 'purchase_thanks'::text, 'points_contribution'::text, 'listing_submit'::text]))) NOT VALID;

-- What the Guides know (ve-guide-platform-facts) and a free saved answer say the same price.
update knowledge_records set body = jsonb_set(body, '{facts}', to_jsonb(
  replace(replace(body->>'facts',
    '- Businesses: any Vegan business can claim its Directory page or apply to be listed.',
    '- Businesses: any Vegan business can claim its Directory page or apply to be listed. Submitting a listing (the Directory''s Submit your listing button, vegansexplore.com/claim?add=1) is $11 or 1,100 points for each listing, and every one is reviewed by hand before it goes live.'),
    'Points unlock a Guide (1,100), pay for talking with your Guide (4 points a message),',
    'Points unlock a Guide (1,100), submit a listing to the Directory (1,100 each), pay for talking with your Guide (4 points a message),'))),
  updated_at = now(), change_summary = 'Submit your listing: $11 or 1,100 points each (Sean, 2026-10-27)'
where slug = 've-guide-platform-facts' and position('submit a listing to the Directory' in body->>'facts') = 0;
insert into guide_kb_answers (brand_slug, topic, question, also_asked, answer, link_url, link_label, status, source, notes)
select 'vegans-explore', 'business', 'How do I add my business to the Directory?',
  array['How do I submit a listing?', 'How much does it cost to list my business?', 'Can I add a business with my points?', 'How do I get listed?'],
  'Tap Submit your listing at the top of the Directory. Each listing is $11 or 1,100 points, and the Passport''s 1,100 welcome points cover your first one. We review every listing by hand before it goes live.',
  'https://vegansexplore.com/claim?add=1', 'Submit your listing', 'live', 'logan', 'Sean, 2026-10-27: $11 or 1,100 points a listing'
where not exists (select 1 from guide_kb_answers where question ilike 'How do I add my business to the Directory?');
