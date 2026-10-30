-- The Gig Board (Sean, 2026-10-30: "the actual mechanism for them to find gigs... like Casting Networks or Backstage... whatever
-- we create, I want become the way the bounties work as well... submit certain things for it... if it's a bigger campaign, they may
-- need to audition... a certain requirement of followers based off of what the client fills out... opportunities that are just for
-- points... rise up the rankings if you're reliable"). A bounty is a gig: the same ve_bounties row and the same lifecycle (claimed,
-- delivered, approved, paid; strikes for no-shows), with what a gig adds. Every column defaults to today's bounty, so nothing that runs
-- now changes: apply_mode 'claim' is first come; 'apply' and 'audition' collect an application the team (or the partner, later)
-- decides on, and the one picked is booked as a claim.

alter table public.ve_bounties
  add column if not exists gig_kind text not null default 'bounty',
  add column if not exists apply_mode text not null default 'claim',
  add column if not exists perk text,
  add column if not exists partner_name text,
  add column if not exists partner_listing_id uuid references public.listings(id) on delete set null,
  add column if not exists req_min_followers integer,
  add column if not exists req_platforms text[] not null default '{}',
  add column if not exists req_level integer,
  add column if not exists remote boolean not null default false,
  add column if not exists asks text[] not null default '{}',
  add column if not exists audition_prompt text,
  add column if not exists apply_by timestamptz;

alter table public.ve_bounties drop constraint if exists ve_bounties_gig_kind_check;
alter table public.ve_bounties add constraint ve_bounties_gig_kind_check check (gig_kind in ('campaign', 'collab', 'hosting', 'event', 'content', 'bounty'));
alter table public.ve_bounties drop constraint if exists ve_bounties_apply_mode_check;
alter table public.ve_bounties add constraint ve_bounties_apply_mode_check check (apply_mode in ('claim', 'apply', 'audition'));
alter table public.ve_bounties drop constraint if exists ve_bounties_gig_fields_check;
alter table public.ve_bounties add constraint ve_bounties_gig_fields_check check (
  (perk is null or char_length(perk) <= 200)
  and (partner_name is null or char_length(partner_name) <= 120)
  and (req_min_followers is null or req_min_followers between 1 and 100000000)
  and (req_level is null or req_level between 1 and 4)
  and req_platforms <@ array['instagram', 'tiktok', 'youtube', 'facebook', 'podcast']::text[]
  and asks <@ array['pitch', 'examples', 'audition', 'rate']::text[]
  and (audition_prompt is null or char_length(audition_prompt) <= 600)
  and (apply_mode <> 'audition' or 'audition' = any (asks)));

-- An application is a submission row before it is a claim: applied, shortlisted, audition (the team asked for one), not_selected.
-- Picking one turns it into 'claimed' and the bounty lifecycle takes over.
alter table public.ve_bounty_submissions drop constraint if exists ve_bounty_submissions_status_check;
alter table public.ve_bounty_submissions add constraint ve_bounty_submissions_status_check
  check (status in ('applied', 'shortlisted', 'audition', 'not_selected', 'claimed', 'released', 'no_show', 'in_progress', 'submitted', 'changes', 'approved', 'rejected'));
alter table public.ve_bounty_submissions
  add column if not exists application jsonb not null default '{}'::jsonb,   -- {pitch, examples, audition, rate}
  add column if not exists applied_at timestamptz,
  add column if not exists decided_at timestamptz,
  add column if not exists decided_by uuid;

-- Whether a member meets a gig's requirements, from their paid-work checklist (ve_ambassador_door) and their level. Returns each
-- requirement with ok, so the board and the server say the same thing.
create or replace function public.ve_gig_fit(p_bounty uuid, p_member uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  b public.ve_bounties%rowtype;
  d public.ve_ambassador_door%rowtype;
  best integer := 0;
  lvl integer := 1;
  out jsonb := '[]'::jsonb;
  ok boolean := true;
  p jsonb;
begin
  select * into b from public.ve_bounties where id = p_bounty;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  select * into d from public.ve_ambassador_door where member_id = p_member;
  if b.req_min_followers is not null then
    for p in select * from jsonb_array_elements(coalesce(d.platforms, '[]'::jsonb)) loop
      if (cardinality(b.req_platforms) = 0 or (p->>'kind') = any (b.req_platforms)) and coalesce((p->>'followers')::numeric, 0) > best then
        best := coalesce((p->>'followers')::numeric, 0)::integer;
      end if;
    end loop;
    out := out || jsonb_build_object('req', 'followers', 'need', b.req_min_followers, 'have', best, 'ok', best >= b.req_min_followers);
    ok := ok and best >= b.req_min_followers;
  end if;
  if b.req_level is not null then
    select coalesce((public.ve_member_level(p_member)->>'level')::integer, 1) into lvl;
    out := out || jsonb_build_object('req', 'level', 'need', b.req_level, 'have', lvl, 'ok', lvl >= b.req_level);
    ok := ok and lvl >= b.req_level;
  end if;
  return jsonb_build_object('ok', ok, 'checks', out);
end $$;
revoke all on function public.ve_gig_fit(uuid, uuid) from public, anon, authenticated;
