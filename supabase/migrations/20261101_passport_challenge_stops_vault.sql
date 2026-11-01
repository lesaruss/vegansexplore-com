-- Earn your Passport, part 2: monthly Passport Challenge stops, business gift cards and the Vault (Sean, 2026-11-01, canon
-- canon-ve-earn-your-passport). A business offers four $25 digital gift cards for a slot in its chapter's month; the form is the
-- agreement. Approving a slot makes the business a member (Founding before 2027-01-01, through entry_paid_at), covers its claim
-- and puts its cards in the Vault, where members bid points for a week; one win per member a month. Safe to run twice.

insert into public.ve_site_settings (key, value)
values ('passport_challenge', jsonb_build_object('pilot_chapters', jsonb_build_array('south-florida'), 'slots_per_chapter', 5,
  'cards_per_slot', 4, 'card_cents', 2500, 'lock_day', 10, 'auction_days', 7, 'card_months', 12, 'min_bid', 100,
  'agreement_version', '2026-11-01'))
on conflict (key) do nothing;

create table if not exists public.ve_pc_slots (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  chapter text not null,
  month date not null,
  member_id uuid not null references public.members(id) on delete cascade,
  status text not null default 'applied' check (status in ('applied', 'approved', 'declined', 'withdrawn')),
  signed_name text not null,
  signed_at timestamptz not null default now(),
  agreement_version text not null,
  signed_ip text,
  pin_hash text,
  pin_set_at timestamptz,
  note text,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (listing_id, month)
);
create index if not exists ve_pc_slots_month on public.ve_pc_slots (month, chapter, status);
alter table public.ve_pc_slots enable row level security;

create table if not exists public.ve_vault_cards (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.ve_pc_slots(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  chapter text not null,
  value_cents integer not null default 2500,
  status text not null default 'scheduled' check (status in ('scheduled', 'available', 'won', 'redeemed', 'expired', 'void')),
  opens_at timestamptz not null,
  auction_ends_at timestamptz not null,
  winner_member_id uuid references public.members(id),
  winning_points integer,
  code text unique,
  won_at timestamptz,
  expires_at timestamptz,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ve_vault_cards_status on public.ve_vault_cards (status, chapter, auction_ends_at);
create index if not exists ve_vault_cards_winner on public.ve_vault_cards (winner_member_id);
alter table public.ve_vault_cards enable row level security;

create table if not exists public.ve_vault_bids (
  card_id uuid not null references public.ve_vault_cards(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  points integer not null check (points > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (card_id, member_id)
);
alter table public.ve_vault_bids enable row level security;

-- Approve a slot: at most slots_per_chapter a chapter a month; the business becomes a member (and Founding before the deadline,
-- through ve_member_admit's entry_paid_at), its claim is covered when nobody else owns the listing, and its cards are made, to open
-- on the 1st of the month with a week's auction.
create or replace function public.ve_pc_slot_approve(p_slot uuid, p_admin uuid)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare s ve_pc_slots; cfg jsonb; n int; opens timestamptz; i int; l listings;
begin
  select * into s from ve_pc_slots where id = p_slot for update;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  if s.status <> 'applied' then return jsonb_build_object('error', 'not_waiting', 'status', s.status); end if;
  select value into cfg from ve_site_settings where key = 'passport_challenge';
  select count(*) into n from ve_pc_slots where chapter = s.chapter and month = s.month and status = 'approved';
  if n >= coalesce((cfg->>'slots_per_chapter')::int, 5) then return jsonb_build_object('error', 'full'); end if;
  select * into l from listings where id = s.listing_id;
  if l.owner_member_id is not null and l.owner_member_id <> s.member_id then return jsonb_build_object('error', 'owned_by_someone_else'); end if;
  update ve_pc_slots set status = 'approved', decided_by = p_admin, decided_at = now() where id = s.id;
  perform ve_member_admit(s.member_id);
  update listings set owner_member_id = s.member_id, claimed_by_member_id = coalesce(claimed_by_member_id, s.member_id),
    claim_status = 'verified', updated_at = now() where id = s.listing_id and owner_member_id is null;
  -- The 1st of the month, midnight Eastern.
  opens := (s.month::timestamp at time zone 'America/New_York');
  for i in 1..coalesce((cfg->>'cards_per_slot')::int, 4) loop
    insert into ve_vault_cards (slot_id, listing_id, chapter, value_cents, opens_at, auction_ends_at)
    values (s.id, s.listing_id, s.chapter, coalesce((cfg->>'card_cents')::int, 2500), opens,
      opens + make_interval(days => coalesce((cfg->>'auction_days')::int, 7)));
  end loop;
  return jsonb_build_object('ok', true, 'cards', coalesce((cfg->>'cards_per_slot')::int, 4));
end $function$;

-- A bid: an active member, the card open, at least min_bid and above their own last bid; points are only taken from the winner.
create or replace function public.ve_vault_bid(p_member uuid, p_card uuid, p_points int)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare c ve_vault_cards; m members; cfg jsonb; mine int; top int;
begin
  select * into m from members where id = p_member;
  if m.id is null or m.membership_status is distinct from 'active' then return jsonb_build_object('error', 'members_only'); end if;
  select * into c from ve_vault_cards where id = p_card for update;
  if not found or c.status <> 'available' or now() < c.opens_at or now() >= c.auction_ends_at then return jsonb_build_object('error', 'not_open'); end if;
  select value into cfg from ve_site_settings where key = 'passport_challenge';
  if p_points is null or p_points < coalesce((cfg->>'min_bid')::int, 100) then return jsonb_build_object('error', 'min_bid', 'min', coalesce((cfg->>'min_bid')::int, 100)); end if;
  if coalesce(m.lesars_balance, 0) < p_points then return jsonb_build_object('error', 'not_enough_points', 'balance', coalesce(m.lesars_balance, 0)); end if;
  select points into mine from ve_vault_bids where card_id = p_card and member_id = p_member;
  if mine is not null and p_points <= mine then return jsonb_build_object('error', 'raise_it', 'yours', mine); end if;
  insert into ve_vault_bids (card_id, member_id, points) values (p_card, p_member, p_points)
  on conflict (card_id, member_id) do update set points = excluded.points, updated_at = now();
  select max(points) into top from ve_vault_bids where card_id = p_card;
  return jsonb_build_object('ok', true, 'yours', p_points, 'top', top, 'leading', p_points >= top);
end $function$;

-- Settle: scheduled cards open on their day; a closed auction goes to the highest bid (earliest on a tie) whose member is still
-- active, still has the points and has not won a card this month (Eastern); no winner, it runs another week.
create or replace function public.ve_vault_settle()
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare c record; b record; cfg jsonb; won int := 0; extended int := 0; opened int; expired int; v_code text; mstart timestamptz;
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  select value into cfg from ve_site_settings where key = 'passport_challenge';
  update ve_vault_cards set status = 'available' where status = 'scheduled' and opens_at <= now();
  get diagnostics opened = row_count;
  update ve_vault_cards set status = 'expired' where status = 'won' and expires_at < now();
  get diagnostics expired = row_count;
  mstart := (date_trunc('month', now() at time zone 'America/New_York') at time zone 'America/New_York');
  for c in select * from ve_vault_cards where status = 'available' and auction_ends_at <= now() order by auction_ends_at for update skip locked loop
    select vb.member_id, vb.points into b from ve_vault_bids vb join members m on m.id = vb.member_id
    where vb.card_id = c.id and m.membership_status = 'active' and coalesce(m.lesars_balance, 0) >= vb.points
      and not exists (select 1 from ve_vault_cards w where w.winner_member_id = vb.member_id and w.won_at >= mstart)
    order by vb.points desc, vb.created_at limit 1;
    if b.member_id is null then
      update ve_vault_cards set auction_ends_at = now() + make_interval(days => coalesce((cfg->>'auction_days')::int, 7)) where id = c.id;
      extended := extended + 1;
      continue;
    end if;
    loop
      v_code := '';
      for i in 1..8 loop v_code := v_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
      exit when not exists (select 1 from ve_vault_cards vc where vc.code = v_code);
    end loop;
    update members set lesars_balance = lesars_balance - b.points where id = b.member_id;
    perform apply_member_points_delta(b.member_id, -b.points);
    insert into points_ledger (member_id, delta, reason, ref_id) values (b.member_id, -b.points, 'redemption', 'vault:' || c.id);
    update ve_vault_cards set status = 'won', winner_member_id = b.member_id, winning_points = b.points, code = v_code, won_at = now(),
      expires_at = now() + make_interval(months => coalesce((cfg->>'card_months')::int, 12)) where id = c.id;
    won := won + 1;
  end loop;
  return jsonb_build_object('opened', opened, 'won', won, 'extended', extended, 'expired', expired);
end $function$;

-- Every 15 minutes: open the month's cards on the 1st, settle closed auctions, expire unused cards.
select cron.unschedule(jobid) from cron.job where jobname = 've-vault-settle';
select cron.schedule('ve-vault-settle', '*/15 * * * *', $c$ select public.ve_vault_settle(); $c$);
