-- "Is this you?" for People who are not creators (Sean, 2026-10-31: "can open a short claim request for people who aren't creators").
-- A physician, activist, athlete, health expert, chef or founder sends a short request from their People page: name, email, a link that
-- shows it is them, a note. It is a ve_profile_claims row (source 'page'), with or without an account, waiting in the Inbox and in
-- Depot > Ambassadors > Paid work's Profile requests. Content Creators keep the creator application (ve-promo.js).
alter table public.ve_profile_claims alter column member_id drop not null;
alter table public.ve_profile_claims add column if not exists contact_name text;
alter table public.ve_profile_claims add column if not exists contact_email text;
alter table public.ve_profile_claims add column if not exists proof_url text;
alter table public.ve_profile_claims add column if not exists source text not null default 'door';
do $$ begin
  alter table public.ve_profile_claims add constraint ve_profile_claims_source_check check (source in ('door', 'page'));
exception when duplicate_object then null; end $$;
create index if not exists ve_profile_claims_email on public.ve_profile_claims (lower(contact_email), created_at desc);

-- The Inbox names who sent a request from the page (they may have no account).
do $$
declare d text := pg_get_functiondef('public.ve_inbox_items(timestamptz)'::regprocedure);
begin
  if position($q$c.member_id, null, null, null, '/admin/depot/ambassadors#door'$q$ in d) > 0 then
    d := replace(d, $q$'profile_claim', c.id, c.created_at, 'Profile request'$q$,
                    $q$'profile_claim', c.id, c.created_at, case when c.source = 'page' then 'Is this you? (profile claim)' else 'Profile request' end$q$);
    d := replace(d, $q$c.member_id, null, null, null, '/admin/depot/ambassadors#door'$q$,
                    $q$c.member_id, c.contact_name, c.contact_email, null, '/admin/depot/ambassadors#door'$q$);
    execute d;
  end if;
end $$;
