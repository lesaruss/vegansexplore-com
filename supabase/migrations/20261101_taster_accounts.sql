-- Earn your Passport, part 3: the Taster account and A Taste of Vegans Explore (Sean, 2026-11-01, canon canon-ve-earn-your-passport).
-- A name and an email make a Taster: not a member and not a members row (an unpaid members row would block their real sign-up
-- later), but their own record here, with the three sign-up answers, how they agreed to our emails, and a long-lived Taster key
-- (ve-taster) that opens only the sampler, their challenges (part 4) and their emails (part 5). The moment the same email becomes a
-- member, the Taster is linked to that account. Safe to run twice.

create table if not exists public.ve_tasters (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  why text,
  chapter text,
  journey text,
  suggested_guide text,
  consent_basis text not null default 'notice' check (consent_basis in ('notice', 'checkbox')),
  consent_at timestamptz not null default now(),
  source text,
  confirmed_at timestamptz,
  last_seen_at timestamptz,
  unsubscribed_at timestamptz,
  member_id uuid references public.members(id) on delete set null,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ve_tasters_email on public.ve_tasters (lower(email));
create index if not exists ve_tasters_created on public.ve_tasters (created_at desc);
alter table public.ve_tasters enable row level security;

-- One email, one account: when that email becomes a member (paid, earned or given), the Taster carries over.
create or replace function public.ve_taster_link()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
begin
  if NEW.membership_status = 'active' and (TG_OP = 'INSERT' or OLD.membership_status is distinct from 'active') and NEW.email is not null then
    update ve_tasters set member_id = NEW.id, converted_at = coalesce(converted_at, now()), updated_at = now()
    where lower(email) = lower(NEW.email) and member_id is null;
  end if;
  return NEW;
end $function$;
drop trigger if exists trg_ve_taster_link on public.members;
create trigger trg_ve_taster_link after insert or update of membership_status on public.members
  for each row execute function public.ve_taster_link();
