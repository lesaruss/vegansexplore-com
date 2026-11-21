-- Featured pages (Sean, 2026-11-21: "Go ahead, build An's page"; the mock /mocks/featured locked v2 the same day, playbook ve-podcast-studio).
-- One page per business per episode at vegansexplore.com/featured/<code>, built from the locked mock. It records the collaborator answer
-- and every view, part opened and play, so the next email and the claim reminder follow what they did. The page reads and writes only
-- through the three functions below (anon may call them; the tables have no public policies). Safe to run twice.

create table if not exists ve_featured_pages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'draft' check (status in ('draft','live','closed')),
  show_slug text not null default 'vegans-explore-podcast',
  episode_id uuid,
  ep_number int,
  ep_title text,
  aired_on date,
  listing_slug text not null,
  business_name text not null,
  person_name text,
  post_at timestamptz,
  reel_path text,
  clip_path text,
  ig_handle text,
  answer text check (answer in ('yes','no')),
  answered_at timestamptz,
  collab_handle text,
  views int not null default 0,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
alter table ve_featured_pages enable row level security;

create table if not exists ve_featured_events (
  id bigserial primary key,
  page_id uuid not null references ve_featured_pages(id) on delete cascade,
  kind text not null,
  part text,
  meta jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
create index if not exists ve_featured_events_page on ve_featured_events(page_id, at desc);
alter table ve_featured_events enable row level security;

-- What the page shows. Only the fields the business sees; never the answer history or the counts.
create or replace function ve_featured_get(p_code text) returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object('code', code, 'status', status, 'show', show_slug, 'ep', ep_number, 'ep_title', ep_title, 'aired_on', aired_on,
    'slug', listing_slug, 'name', business_name, 'person', person_name, 'post_at', post_at, 'reel', reel_path, 'clip', clip_path,
    'ig', coalesce(collab_handle, ig_handle), 'answer', answer)
  from ve_featured_pages where code = p_code and status in ('draft','live');
$$;

-- A view, a part opened, a play or a click. Known kinds only; at most 400 a page a day.
create or replace function ve_featured_track(p_code text, p_kind text, p_part text default null, p_meta jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if p_kind not in ('view','part','play_liz','play_reel','play_clip','listing_open','claim_click','media_open','mail_click') then return; end if;
  select id into pid from ve_featured_pages where code = p_code and status in ('draft','live');
  if pid is null then return; end if;
  if (select count(*) from ve_featured_events where page_id = pid and at > now() - interval '1 day') >= 400 then return; end if;
  insert into ve_featured_events(page_id, kind, part, meta) values (pid, p_kind, left(p_part, 40), coalesce(p_meta, '{}'::jsonb) - 'ip');
  if p_kind = 'view' then
    update ve_featured_pages set views = views + 1, first_viewed_at = coalesce(first_viewed_at, now()), last_viewed_at = now() where id = pid;
  end if;
end $$;

-- Yes or no to being a collaborator. They can change it until the reel posts.
create or replace function ve_featured_answer(p_code text, p_answer text, p_handle text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare pid uuid; h text := nullif(regexp_replace(coalesce(p_handle, ''), '^@', ''), '');
begin
  if p_answer not in ('yes','no') then return jsonb_build_object('ok', false, 'error', 'answer'); end if;
  select id into pid from ve_featured_pages where code = p_code and status in ('draft','live');
  if pid is null then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  if p_answer = 'yes' and (h is null or h !~ '^[A-Za-z0-9._]{1,30}$') then return jsonb_build_object('ok', false, 'error', 'handle'); end if;
  update ve_featured_pages set answer = p_answer, answered_at = now(), collab_handle = case when p_answer = 'yes' then h else collab_handle end where id = pid;
  insert into ve_featured_events(page_id, kind, part, meta) values (pid, 'answer', 'collab', jsonb_build_object('answer', p_answer, 'handle', h));
  return jsonb_build_object('ok', true, 'answer', p_answer);
end $$;

revoke all on function ve_featured_get(text), ve_featured_track(text, text, text, jsonb), ve_featured_answer(text, text, text) from public;
grant execute on function ve_featured_get(text), ve_featured_track(text, text, text, jsonb), ve_featured_answer(text, text, text) to anon, authenticated;

-- The first page: An of Sen Saigon, Episode 147 (draft until Sean locks it as she will see it).
insert into ve_featured_pages (code, status, episode_id, ep_number, ep_title, aired_on, listing_slug, business_name, person_name, post_at, reel_path, clip_path, note)
select 'sen-saigon-' || substr(md5(random()::text), 1, 6), 'draft', 'a1aa1e9f-8dce-4681-ada8-7e8fe7f0ff75', 147,
       'Next Stop Vegan Says Goodbye, NYC Ends Horse Carriages and Remembering Fiona', '2026-11-22', 'sen-saigon', 'Sen Saigon', 'An',
       '2026-11-24 17:00:00+00', 'media/podcast/spotlight/an-sen-saigon/reel-v4.mp4', 'media/podcast/vep-weekly/2026-11-22/anne-clip-v1.mp3',
       'Ep 147 spotlight. Reel locked 2026-11-19; post time from the locked mock (Tue Nov 24, 12 PM Eastern).'
 where not exists (select 1 from ve_featured_pages where listing_slug = 'sen-saigon' and ep_number = 147);

-- 2026-11-21, later: Liz summarizes each part for this business (Sean: "Shouldn't she summarize what's on the page? The whole idea of the
-- audio is to give people a summary so they don't have to read. And she was talking way too fast."). voice = {part: {text, path}}, made
-- per page with el-media tts in Liz's voice at speed 0.8 to 0.88 (about 143 words a minute), leveled to -17 LUFS, checked with stt.
alter table ve_featured_pages add column if not exists voice jsonb not null default '{}'::jsonb;
create or replace function ve_featured_get(p_code text) returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object('code', code, 'status', status, 'show', show_slug, 'ep', ep_number, 'ep_title', ep_title, 'aired_on', aired_on,
    'slug', listing_slug, 'name', business_name, 'person', person_name, 'post_at', post_at, 'reel', reel_path, 'clip', clip_path,
    'ig', coalesce(collab_handle, ig_handle), 'answer', answer, 'voice', voice)
  from ve_featured_pages where code = p_code and status in ('draft','live');
$$;
-- An's lines were written to her row directly (media/voices/featured/sen-saigon-e509ca/: start-v1, collab-v1, episode-v2, listing-v2).
