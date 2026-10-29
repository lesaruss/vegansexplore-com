-- Continue with LESARUSS (Sean, 2026-10-29; playbook ve-business-hub-ad-console, canon
-- canon-lesaruss-ai-subscription-guide-wizard-model UPDATE_2026_10_29_DIPLOMAT_NAME_LOCKED).
-- One LESARUSS account signs in on every brand. The flow:
--   1. A brand's "Continue with LESARUSS" button opens hq.lesaruss.ai/connect?client=<brand>&redirect_uri=<exact>&state=<random>.
--   2. HQ signs them in (the shared Supabase auth pool), shows "Continue to <brand> as <email>", and on yes mints a
--      one-time code: a random 32-byte value, stored here only as its sha256, good for 2 minutes and once.
--   3. HQ sends them to redirect_uri?code=&state=. The brand trades the code server side (Vegans Explore: edge function
--      ve-lesaruss-sso) for its own session. A redirect_uri must be on the client's list exactly, or match its preview
--      pattern; nothing else gets a code.
-- Access per brand: a Diplomat (the $111 LESARUSS.ai membership, lesaruss_is_diplomat) is in on every brand. Anyone else is
-- signed in as they are: a Vegans Explore Passport holder is in, everyone else meets that brand's own $11 Passport.
-- Children's brands (Chester Is Cool) are never clients.

create table if not exists lesaruss_sso_clients (
  client text primary key,
  name text not null,
  redirect_uris text[] not null default '{}',
  redirect_pattern text,          -- a regex for the brand's preview deployments, or null
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table lesaruss_sso_clients enable row level security;

insert into lesaruss_sso_clients (client, name, redirect_uris, redirect_pattern) values
  ('vegans-explore', 'Vegans Explore',
   array['https://vegansexplore.com/auth/lesaruss', 'https://www.vegansexplore.com/auth/lesaruss'],
   '^https://vegansexplore-[a-z0-9]+-contact-2245s-projects\.vercel\.app/auth/lesaruss$')
on conflict (client) do update set name = excluded.name, redirect_uris = excluded.redirect_uris, redirect_pattern = excluded.redirect_pattern;

create table if not exists lesaruss_sso_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  client text not null references lesaruss_sso_clients(client),
  redirect_uri text not null,
  user_id uuid not null,
  email text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 minutes',
  used_at timestamptz
);
alter table lesaruss_sso_codes enable row level security;
create index if not exists lesaruss_sso_codes_created on lesaruss_sso_codes (created_at);

-- Is this redirect allowed for this client?
create or replace function lesaruss_sso_redirect_ok(p_client text, p_redirect text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from lesaruss_sso_clients c where c.client = p_client and c.active
    and (p_redirect = any (c.redirect_uris) or (c.redirect_pattern is not null and p_redirect ~ c.redirect_pattern)));
$$;

-- A Diplomat: a LESARUSS-tenant members row on a paid tier, active or cancelled and paid through. The same rule as
-- lesaruss-hq lib/memberAccess.ts resolveViewer() and ve-guide-unlock isDiplomat().
create or replace function lesaruss_is_diplomat(p_email text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from members m
    where m.tenant_id = '00000000-0000-4000-a000-000000000001' and lower(m.email) = lower(trim(p_email))
      and m.membership_tier in ('premium', 'advanced')
      and (m.membership_status = 'active' or (m.membership_status = 'cancelled' and m.subscription_ends_at > now())));
$$;

-- Trade a code once. Returns the email it was minted for, or null.
create or replace function lesaruss_sso_consume(p_code_hash text, p_client text, p_redirect text)
returns table (email text, user_id uuid) language plpgsql security definer set search_path = public as $$
begin
  return query
  update lesaruss_sso_codes c set used_at = now()
  where c.code_hash = p_code_hash and c.client = p_client and c.redirect_uri = p_redirect
    and c.used_at is null and c.expires_at > now()
  returning c.email, c.user_id;
end $$;

-- Vegans Explore: a Diplomat's account is active without the $11 (diplomat_since). If the membership lapses and they never
-- paid Vegans Explore themselves, the account goes back to waiting for its Passport.
alter table members add column if not exists diplomat_since timestamptz;

create or replace function ve_diplomat_sync()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update members m set membership_status = 'pending_payment', diplomat_since = null, updated_at = now()
  where m.tenant_id = '00000000-0000-4000-a000-000000000002' and m.diplomat_since is not null
    and m.entry_paid_at is null and m.membership_status = 'active' and not lesaruss_is_diplomat(m.email);
  get diagnostics n = row_count;
  update members m set diplomat_since = null
  where m.tenant_id = '00000000-0000-4000-a000-000000000002' and m.diplomat_since is not null
    and m.entry_paid_at is not null and not lesaruss_is_diplomat(m.email);
  delete from lesaruss_sso_codes where created_at < now() - interval '7 days';
  return n;
end $$;

select cron.schedule('ve-diplomat-sync', '23 7 * * *', 'select ve_diplomat_sync()');

revoke all on function lesaruss_sso_consume(text, text, text) from public, anon, authenticated;
revoke all on function lesaruss_is_diplomat(text) from public, anon, authenticated;
revoke all on function ve_diplomat_sync() from public, anon, authenticated;
revoke all on function lesaruss_sso_redirect_ok(text, text) from public, anon, authenticated;
