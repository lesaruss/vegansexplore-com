-- ve-signature-dishes C: the data (canon canon-ve-signature-dishes, locked by Sean 2026-11-06). Applied through the Supabase connector.
-- Dishes a claimed food listing features on its Overview, members' votes on them, and the paid slots 4 and 5.
-- RLS on, no policies: everything goes through the edge function ve-signature-dishes.

create table if not exists ve_signature_dishes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  line text not null default '' check (char_length(line) <= 160),
  photo_url text,
  photo_w int,
  photo_h int,
  price_display text not null default '' check (char_length(price_display) <= 30),
  tags text[] not null default '{}',
  menu_item_id uuid references ve_menu_items(id) on delete set null,
  featured boolean not null default false,
  position int not null default 0,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A featured dish has a photo and a line (the locked rule); the function also checks the 800 px.
  constraint ve_signature_dishes_featured_complete check (not featured or (photo_url is not null and char_length(btrim(line)) > 0))
);
create index if not exists ve_signature_dishes_listing on ve_signature_dishes (listing_id, featured, position);
alter table ve_signature_dishes enable row level security;

create table if not exists ve_dish_votes (
  dish_id uuid not null references ve_signature_dishes(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (dish_id, member_id)
);
create index if not exists ve_dish_votes_member on ve_dish_votes (member_id);
alter table ve_dish_votes enable row level security;

create table if not exists ve_dish_slots (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  slot int not null check (slot in (4, 5)),
  member_id uuid not null references members(id),
  points int not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists ve_dish_slots_listing on ve_dish_slots (listing_id, slot, ends_at);
alter table ve_dish_slots enable row level security;

-- How many dishes a listing may feature right now: 3, plus each paid slot running now.
create or replace function public.ve_dish_cap(p_listing uuid)
returns int language sql stable security definer set search_path to 'public' as $$
  select 3 + (select count(distinct slot)::int from ve_dish_slots where listing_id = p_listing and starts_at <= now() and ends_at > now());
$$;
revoke all on function public.ve_dish_cap(uuid) from public, anon, authenticated;

-- Buy slot 4 or 5 for 30 days with 50 points from the member's own balance (both balances, once per period).
-- A slot still running more than 7 days is refused; within its last 7 days the new period starts where it ends.
-- Slot 5 needs slot 4 running (or bought) for the same time.
create or replace function public.ve_dish_slot_buy(p_member uuid, p_listing uuid, p_slot int)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare m members; cost constant int := 50; days constant int := 30; cur ve_dish_slots; s timestamptz; sid uuid := gen_random_uuid();
begin
  if p_slot not in (4, 5) then return jsonb_build_object('error', 'bad_slot'); end if;
  select * into m from members where id = p_member for update;
  if m.id is null then return jsonb_build_object('error', 'member_not_found'); end if;
  if ve_member_frozen(p_member) then return jsonb_build_object('error', 'account_frozen'); end if;
  select * into cur from ve_dish_slots where listing_id = p_listing and slot = p_slot and ends_at > now() order by ends_at desc limit 1;
  if cur.id is not null and cur.ends_at > now() + interval '7 days' then
    return jsonb_build_object('error', 'already_running', 'ends_at', cur.ends_at);
  end if;
  s := coalesce(cur.ends_at, now());
  if p_slot = 5 and not exists (select 1 from ve_dish_slots where listing_id = p_listing and slot = 4 and starts_at <= s and ends_at >= s + interval '1 day') then
    return jsonb_build_object('error', 'slot_4_first');
  end if;
  if coalesce(m.lesars_balance, 0) < cost then return jsonb_build_object('error', 'not_enough_points', 'balance', coalesce(m.lesars_balance, 0), 'cost', cost); end if;
  update members set lesars_balance = lesars_balance - cost where id = p_member;
  perform apply_member_points_delta(p_member, -cost);
  insert into points_ledger (member_id, delta, reason, ref_id) values (p_member, -cost, 'dish_slot', 'dish-slot:' || sid);
  insert into ve_dish_slots (id, listing_id, slot, member_id, points, starts_at, ends_at) values (sid, p_listing, p_slot, p_member, cost, s, s + make_interval(days => days));
  return jsonb_build_object('ok', true, 'id', sid, 'slot', p_slot, 'starts_at', s, 'ends_at', s + make_interval(days => days), 'balance', m.lesars_balance - cost, 'cost', cost);
end $$;
revoke all on function public.ve_dish_slot_buy(uuid, uuid, int) from public, anon, authenticated;

-- The ledger's reason list gains dish_slot (the rest unchanged, as of 2026-11-06).
alter table points_ledger drop constraint points_ledger_reason_check;
alter table points_ledger add constraint points_ledger_reason_check CHECK ((reason = ANY (ARRAY['signup'::text, 'referral'::text, 'daily_login'::text, 'listing_like'::text, 'listing_create'::text, 'discussion_post'::text, 'discussion_reply'::text, 'discussion_vote'::text, 'event_attend'::text, 'profile_complete'::text, 'profile_field'::text, 'admin_adjust'::text, 'purchase'::text, 'redemption'::text, 'vote_given'::text, 'vote_received'::text, 'vote_refunded'::text, 'featured_purchase'::text, 'transfer_sent'::text, 'transfer_received'::text, 'store_purchase'::text, 'store_refund'::text, 'points_purchase'::text, 'bartering'::text, 'boost_purchase'::text, 'seed_initial'::text, 'Welcome bonus + early activity'::text, 'campaign_back'::text, 'questionnaire'::text, 'wizard_redeem'::text, 've_hunt_complete'::text, 've_hunt_anchor'::text, 'guide_redeem'::text, 'cycle_grant'::text, 'bounty'::text, 'comp_membership'::text, 'recipe_approved'::text, 'guide_chat_spend'::text, 'credit_exchange'::text, 'checkin'::text, 'welcome'::text, 'purchase_thanks'::text, 'points_contribution'::text, 'listing_submit'::text, 'profile_answer'::text, 'partner_optin'::text, 'venue_report'::text, 'nonprofit_survey'::text, 'barcode_add'::text, 'challenge'::text, 'challenge_passport'::text, 'host_story'::text, 'abuse_void'::text, 'abuse_restore'::text, 'survey_answer'::text, 'dish_slot'::text]))) NOT VALID;
