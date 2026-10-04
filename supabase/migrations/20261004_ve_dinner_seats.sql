-- City dinner seats (Sean, 2026-10-04). One row per dinner: its date, its venue once it is
-- confirmed, how many seats the room holds, and whether seats are open. Seats are member-only:
-- the $11 Founding Membership is the RSVP. A seat is a ve_initiative_interest row
-- (initiative_slug = 'dinner-' || slug), so seats show on /dashboard/leads next to the
-- campaign's link clicks.
create table if not exists public.ve_dinners (
  slug text primary key,
  city_slug text not null,
  title text not null,
  event_date date not null,
  start_time text,
  venue_name text,
  venue_address text,
  capacity integer check (capacity is null or capacity > 0),
  seats_open boolean not null default false,
  page_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ve_dinners enable row level security; -- service role only, through ve-dinner-seats

-- One seat per member per dinner. A seat is a 'ticket' row (the leads dashboard calls it
-- "Attend / Waitlist"): status 'confirmed' with tier_label 'Seat', or status 'new' with tier_label
-- 'Waitlist' once the room is full. Moving someone off the waitlist is a status change on
-- /dashboard/leads.
create unique index if not exists ve_initiative_interest_one_dinner_seat
  on public.ve_initiative_interest (initiative_slug, member_id)
  where action_type = 'ticket' and member_id is not null and initiative_slug like 'dinner-%';

-- Takes a seat atomically: a lock per dinner keeps two people from taking the last seat.
create or replace function public.ve_take_dinner_seat(p_slug text, p_member uuid, p_email text, p_name text)
returns table (seat_status text, taken integer, capacity integer)
language plpgsql security definer set search_path = public as $$
declare d public.ve_dinners; n integer; existing text; st text;
begin
  select * into d from public.ve_dinners where slug = p_slug;
  if not found then raise exception 'dinner_not_found'; end if;
  perform pg_advisory_xact_lock(hashtext('ve_dinner_' || p_slug));
  select status into existing from public.ve_initiative_interest
    where initiative_slug = 'dinner-' || p_slug and member_id = p_member and action_type = 'ticket';
  select count(*) into n from public.ve_initiative_interest
    where initiative_slug = 'dinner-' || p_slug and action_type = 'ticket' and status = 'confirmed';
  if existing is not null then
    return query select (case when existing = 'confirmed' then 'confirmed' else 'waitlist' end), n, d.capacity; return;
  end if;
  st := case when d.capacity is not null and n >= d.capacity then 'waitlist' else 'confirmed' end;
  insert into public.ve_initiative_interest (initiative_slug, member_id, action_type, status, email, name, source, tags, tier_label)
    values ('dinner-' || p_slug, p_member, 'ticket', case when st = 'confirmed' then 'confirmed' else 'new' end,
            left(p_email, 200), left(p_name, 120), 'form', array['dinner', d.city_slug, 'dinner-seat'],
            case when st = 'confirmed' then 'Seat' else 'Waitlist' end);
  return query select st, n + (case when st = 'confirmed' then 1 else 0 end), d.capacity;
end $$;
revoke all on function public.ve_take_dinner_seat(text, uuid, text, text) from public, anon, authenticated;

insert into public.ve_dinners (slug, city_slug, title, event_date, page_path)
values ('palm-beach-2026-10-23', 'south-florida', 'Palm Beach dinner, Friday October 23', '2026-10-23', '/dinners/palm-beach')
on conflict (slug) do nothing;
