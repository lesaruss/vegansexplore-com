// One-time database write (canon ops-supabase-write-once-function; error registry SUPABASE-MCP-APPROVAL-HOLD-USE-ONCE-FUNCTION).
// Use it when the Supabase connector's execute_sql / apply_migration holds a write for an approval box that never shows
// (it times out at 60 s). Copy this file, put the SQL in STEPS, set KEY to a fresh random string, deploy it as
// ve-once-<task> with verify_jwt false, run each step with:
//   curl -X POST "https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-once-<task>?step=<name>" -H "x-run-key: <KEY>"
// check the result with a read-only SELECT, then redeploy the function as the 410 stub at the bottom (verify_jwt true).
// The key lives only in the session's scratchpad, never in the repo. Every step runs in one transaction.
import postgres from 'npm:postgres@3.4.4'

const KEY = '<random 48 hex characters>'
const STEPS: Record<string, string> = {
  creator: `-- Creator applications flow into the creator's account and Directory profile (Sean, 2026-11-10: "go, and build the automatic fix too").
-- Before this, an accepted application stayed a separate record: no account link, and nothing reached their /directory page.
--
-- ve_creator_application_link(app) runs when the team marks an application Accepted (the team's check is the identity check, as with an
-- approved "Is this you?" claim), and again when the applicant's account becomes an active member. It:
--   1. links the application to the member with the same email (active members only),
--   2. finds their profile: the listing the application claimed (claim_listing_id), or else the one approved people listing whose
--      Instagram, TikTok or YouTube handle matches a handle in the application (exactly one match, never a guess between two),
--   3. fills only empty fields on that profile from the application (Instagram, TikTok, YouTube, city and state), never overwriting,
--   4. gives them the profile if nobody holds it (owner, claimed_by, claim_status verified, details.person.member_id), as ve-ambassador
--      claim_decide does, and logs every change as a ve_listing_edits row (meta.source creator_application).
-- Errors never block a signup or a status change: the triggers catch them and raise a warning.

create or replace function public.ve_handle_norm(p text) returns text language sql immutable as $$
  select nullif(lower(regexp_replace(regexp_replace(btrim(coalesce(p, '')),
    '^(https?://)?(www\\.)?(instagram\\.com/|tiktok\\.com/|youtube\\.com/|youtu\\.be/)?', '', 'i'), '^@|/+$', '', 'g')), '')
$$;

create or replace function public.ve_creator_application_link(p_app uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  a ve_creator_applications; m uuid; l listings; lid uuid; n int; done text[] := '{}';
  ig text; tt text; yt text; st text;
  people_cats text[] := array['Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders','Promoters'];
begin
  select * into a from ve_creator_applications where id = p_app for update;
  if not found or a.status <> 'accepted' then return jsonb_build_object('ok', false, 'why', 'not accepted'); end if;

  -- 1. The account.
  m := a.member_id;
  if m is null and a.email is not null then
    select id into m from members where lower(btrim(email)) = lower(btrim(a.email)) and merged_into_member_id is null and deleted_at is null
      and membership_status = 'active' order by created_at limit 1;
    if m is not null then update ve_creator_applications set member_id = m where id = a.id; done := array_append(done, 'member'); end if;
  end if;

  -- 2. The profile.
  select max(case when p->>'kind' = 'instagram' then ve_handle_norm(p->>'handle') end),
         max(case when p->>'kind' = 'tiktok' then ve_handle_norm(p->>'handle') end),
         max(case when p->>'kind' = 'youtube' then ve_handle_norm(p->>'handle') end)
    into ig, tt, yt from jsonb_array_elements(coalesce(a.platforms, '[]'::jsonb)) p;
  lid := a.claim_listing_id;
  if lid is null then
    select count(*), min(id::text)::uuid into n, lid from listings
      where status = 'approved' and category = any(people_cats)
        and ((ig is not null and ve_handle_norm(instagram) = ig) or (tt is not null and ve_handle_norm(tiktok) = tt) or (yt is not null and ve_handle_norm(youtube) = yt));
    if n <> 1 then lid := null; end if;
  end if;
  if lid is null then return jsonb_build_object('ok', true, 'member', m, 'listing', null, 'done', done); end if;
  select * into l from listings where id = lid for update;
  if not found then return jsonb_build_object('ok', true, 'member', m, 'listing', null, 'done', done); end if;
  if a.claim_listing_id is null then update ve_creator_applications set claim_listing_id = lid where id = a.id; end if;

  -- 3. Fill empty fields only.
  st := case a.chapter when 'philadelphia' then 'PA' when 'delaware' then 'DE' when 'maryland' then 'MD' when 'virginia' then 'VA'
    when 'west-virginia' then 'WV' when 'washington-dc' then 'DC' when 'south-florida' then 'FL' when 'central-florida' then 'FL'
    when 'north-florida' then 'FL' when 'atlanta' then 'GA' when 'new-york' then 'NY' when 'los-angeles' then 'CA' else null end;
  if coalesce(l.instagram, '') = '' and ig is not null then
    update listings set instagram = '@' || ig where id = lid;
    insert into ve_listing_edits (listing_id, member_id, field, old_value, new_value, meta) values (lid, m, 'instagram', to_jsonb(l.instagram), to_jsonb('@' || ig), jsonb_build_object('source', 'creator_application', 'application', a.id));
    done := array_append(done, 'instagram');
  end if;
  if coalesce(l.tiktok, '') = '' and tt is not null then
    update listings set tiktok = '@' || tt where id = lid;
    insert into ve_listing_edits (listing_id, member_id, field, old_value, new_value, meta) values (lid, m, 'tiktok', to_jsonb(l.tiktok), to_jsonb('@' || tt), jsonb_build_object('source', 'creator_application', 'application', a.id));
    done := array_append(done, 'tiktok');
  end if;
  if coalesce(l.youtube, '') = '' and yt is not null then
    update listings set youtube = yt where id = lid;
    insert into ve_listing_edits (listing_id, member_id, field, old_value, new_value, meta) values (lid, m, 'youtube', to_jsonb(l.youtube), to_jsonb(yt), jsonb_build_object('source', 'creator_application', 'application', a.id));
    done := array_append(done, 'youtube');
  end if;
  if coalesce(l.address_city, '') = '' and coalesce(btrim(a.city), '') <> '' then
    update listings set address_city = btrim(a.city), address_state = coalesce(nullif(address_state, ''), st) where id = lid;
    insert into ve_listing_edits (listing_id, member_id, field, old_value, new_value, meta) values (lid, m, 'address_city', to_jsonb(l.address_city), to_jsonb(btrim(a.city)), jsonb_build_object('source', 'creator_application', 'application', a.id, 'state', st));
    done := array_append(done, 'city');
  end if;

  -- 4. Ownership, only when nobody holds it.
  if m is not null and l.owner_member_id is null and (l.claimed_by_member_id is null or l.claimed_by_member_id = m) then
    update listings set owner_member_id = m, claimed_by_member_id = m, claim_status = 'verified', updated_at = now(),
      details = jsonb_set(coalesce(details, '{}'::jsonb), '{person}', coalesce(details->'person', '{}'::jsonb) || jsonb_build_object('member_id', m))
      where id = lid;
    insert into ve_listing_edits (listing_id, member_id, field, old_value, new_value, meta) values (lid, m, 'owner_member_id', null, to_jsonb(m), jsonb_build_object('source', 'creator_application', 'application', a.id));
    done := array_append(done, 'owner');
  end if;
  update listings set updated_at = now() where id = lid and array_length(done, 1) > 0;
  return jsonb_build_object('ok', true, 'member', m, 'listing', lid, 'done', done);
end $$;

-- When the team marks an application Accepted.
create or replace function public.trg_ve_creator_app_accepted() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    begin perform ve_creator_application_link(new.id);
    exception when others then raise warning 've_creator_application_link(%): %', new.id, sqlerrm; end;
  end if;
  return null;
end $$;
drop trigger if exists trg_ve_creator_app_accepted on ve_creator_applications;
create trigger trg_ve_creator_app_accepted after update of status on ve_creator_applications
  for each row execute function trg_ve_creator_app_accepted();

-- When an accepted applicant's account becomes an active member (a signup, an accepted invitation, a finished survey).
create or replace function public.trg_ve_member_creator_link() returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.membership_status = 'active' and (tg_op = 'INSERT' or old.membership_status is distinct from 'active') then
    for r in select id from ve_creator_applications where status = 'accepted' and member_id is null
      and lower(btrim(email)) = lower(btrim(new.email)) loop
      begin perform ve_creator_application_link(r.id);
      exception when others then raise warning 've_creator_application_link(%): %', r.id, sqlerrm; end;
    end loop;
  end if;
  return null;
end $$;
drop trigger if exists trg_ve_member_creator_link on members;
create trigger trg_ve_member_creator_link after insert or update of membership_status on members
  for each row execute function trg_ve_member_creator_link();

-- Applications accepted before this existed (Keya, VeganKween): run once now.
select ve_creator_application_link(id) from ve_creator_applications where status = 'accepted' and email not ilike '%lesaruss.com';
`,
  welcome: `-- Welcome to the community goes out to everyone who becomes a member after Sean's approval (Sean, 2026-11-10: "approved").
-- Copies ve_orientation_sync: a 15-minute cron enrolls real members (member_class 'member', active, an email) whose joining moment
-- (sign-up, an invitation or payment, or the survey door) is after the campaign's approval. Each is sent about an hour after enrollment.
-- The orientation notes from the team follow from the next day. Keya (VeganKween) joined before the approval and is enrolled by hand.

create or replace function public.ve_welcome_sync() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r record; joined int := 0;
begin
  for r in
    select m.id, lower(btrim(m.email)) email, m.name
    from members m
    join ve_outreach_campaigns cp on cp.slug = 'welcome-community' and cp.status = 'active' and cp.approved_at is not null and cp.paused_at is null
    where m.member_class = 'member' and m.membership_status = 'active' and m.merged_into_member_id is null and m.deleted_at is null
      and coalesce(m.email, '') like '%@%'
      and greatest(m.created_at, coalesce(m.entry_paid_at, m.created_at), coalesce(m.survey_door_at, m.created_at)) >= cp.approved_at
      and not exists (select 1 from ve_outreach_campaign_members x where x.campaign_slug = 'welcome-community' and x.person_key = lower(btrim(m.email)))
    order by m.created_at
  loop
    insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, person_id, step, send_status, next_send_at)
      values ('welcome-community', r.email, r.name, r.id, 0, 'in_sequence', now() + interval '1 hour');
    joined := joined + 1;
  end loop;
  return jsonb_build_object('joined', joined);
end $$;

select cron.unschedule('ve-welcome-sync') where exists (select 1 from cron.job where jobname = 've-welcome-sync');
select cron.schedule('ve-welcome-sync', '*/15 * * * *', 'select public.ve_welcome_sync()');

-- Sean's approval (2026-11-10, in chat: "approved"), set the way HQ's Approve does it.
update ve_outreach_campaign_emails set locked_at = now(), locked_by = '72712a4a-ea0e-4ef4-a29e-d382496ef8da'
where campaign_slug = 'welcome-community' and step = 1 and locked_at is null;
update ve_outreach_campaigns set status = 'active', approved_at = now(), approved_by = '72712a4a-ea0e-4ef4-a29e-d382496ef8da',
  start_on = (now() at time zone 'America/New_York')::date
where slug = 'welcome-community' and approved_at is null;

-- Keya: the welcome instead of her old invitation email (she joined on her own the same morning).
insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, person_id, step, send_status, next_send_at)
select 'welcome-community', 'kyonakey@yahoo.com', 'Keya', '19f67b83-9368-40d5-af00-87084b0f3fae', 0, 'in_sequence', now() + interval '1 hour'
where not exists (select 1 from ve_outreach_campaign_members where campaign_slug = 'welcome-community' and person_key = 'kyonakey@yahoo.com');
update ve_outreach_campaign_members set removed_at = now(), send_status = 'stopped', stop_reason = 'She joined on her own; she gets Welcome to the community instead'
where campaign_slug = 'creator-welcome-keya' and person_key = 'kyonakey@yahoo.com' and removed_at is null;
`,
}

Deno.serve(async (req: Request) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 })
  const step = new URL(req.url).searchParams.get('step') || ''
  if (!STEPS[step]) return Response.json({ error: 'unknown_step' }, { status: 400 })
  const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 1, prepare: false })
  try {
    const out = await sql.begin(async (tx) => {
      const r: any = await tx.unsafe(STEPS[step])
      // One count per statement, so a multi-statement step shows what each one touched.
      const counts = Array.isArray(r) && Array.isArray(r[0]) ? r.map((x: any) => x.count) : [r.count]
      return { step, counts }
    })
    return Response.json(out)
  } catch (e) {
    return Response.json({ step, error: String(e) }, { status: 500 })
  } finally {
    await sql.end()
  }
})

// The stub, once every step has run:
// Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
