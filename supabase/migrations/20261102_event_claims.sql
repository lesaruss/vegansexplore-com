-- The event host path, step 1: the event claim (Sean, 2026-11-02: "start step 1"; canon canon-ve-event-host-path).
-- "Are you running this event?" on every event page opens a short claim: who they are, their part (hosting, promoting, it is
-- at their venue), a link that shows it is them. The team approves or declines it in Depot > Events > Claims. Approving makes
-- them the event's organizer (ve_event_organizers: their name on the page and Guests and messages) when an account has their
-- email, now or later (trg_ve_event_claim_link). Every claim lands in the Inbox.

create table if not exists public.ve_event_claims (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  name text not null,
  email text not null,
  role text not null check (role in ('host', 'promoter', 'venue')),
  org_name text,
  proof_url text,
  phone text,
  note text,
  status text not null default 'new' check (status in ('new', 'approved', 'declined')),
  organizer_id uuid references public.ve_event_organizers(id) on delete set null,
  decided_at timestamptz,
  decided_by uuid references public.members(id),
  decision_note text,
  created_at timestamptz not null default now()
);
alter table public.ve_event_claims enable row level security;
create index if not exists ve_event_claims_event on public.ve_event_claims (event_id);
create index if not exists ve_event_claims_email on public.ve_event_claims (lower(email));
create unique index if not exists ve_event_claims_open on public.ve_event_claims (event_id, lower(email)) where status in ('new', 'approved');
comment on table public.ve_event_claims is 'Someone saying they run an event (host, promoter or the venue). Approved claims make them the event''s organizer once an account has their email.';

-- Make the organizer for an approved claim whose email now has an account. Returns how many were linked.
create or replace function public.ve_event_claim_link(p_claim uuid default null)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare r record; v_member uuid; v_org uuid; n integer := 0;
begin
  for r in select c.* from ve_event_claims c
           where c.status = 'approved' and c.organizer_id is null and (p_claim is null or c.id = p_claim) loop
    v_member := coalesce(r.member_id, (select m.id from members m where lower(m.email) = lower(r.email) and m.merged_into_member_id is null
                                         order by m.created_at limit 1));
    continue when v_member is null;
    insert into ve_event_organizers (event_id, member_id, name, added_by)
    values (r.event_id, v_member, left(coalesce(nullif(r.org_name, ''), r.name), 80), r.decided_by)
    on conflict (event_id, member_id) do update set name = ve_event_organizers.name
    returning id into v_org;
    update ve_event_claims set organizer_id = v_org, member_id = v_member where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.ve_event_claim_link(uuid) from public, anon, authenticated;

create or replace function public.trg_ve_event_claim_link() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if exists (select 1 from ve_event_claims c where c.status = 'approved' and c.organizer_id is null and lower(c.email) = lower(new.email)) then
    perform ve_event_claim_link(c.id) from ve_event_claims c
      where c.status = 'approved' and c.organizer_id is null and lower(c.email) = lower(new.email);
  end if;
  return new;
end $$;
drop trigger if exists trg_ve_event_claim_link on public.members;
create trigger trg_ve_event_claim_link after insert or update of email on public.members
  for each row when (new.email is not null) execute function public.trg_ve_event_claim_link();

-- The Inbox gains event claims (the rest of ve_inbox_items unchanged: appended to the live definition).
do $do$
declare d text;
begin
  d := pg_get_functiondef('public.ve_inbox_items(timestamp with time zone)'::regprocedure);
  if position('''event_claim''' in d) > 0 then return; end if;
  -- The live body ends "order by 3 desc;" then $function$: the new source goes in before the ordering.
  d := regexp_replace(d, '\s*order by 3 desc;\s*\$function\$\s*$', '');
  d := d || $add$
  union all
  select 'event_claim', c.id, c.created_at, 'Event claim', e.title,
    left(concat_ws(' · ', case c.role when 'host' then 'Hosting it' when 'promoter' then 'Promoting it' else 'At their venue' end,
      nullif(c.org_name, ''), nullif(c.note, '')), 200),
    c.member_id, c.name, c.email, ve_chapter_of(e.city, e.state), '/admin/depot/events#claim/' || c.id
  from ve_event_claims c join events e on e.id = c.event_id
  where c.created_at >= p_since and c.name not like '[TEST]%'
  order by 3 desc;
$function$
$add$;
  execute d;
end $do$;
