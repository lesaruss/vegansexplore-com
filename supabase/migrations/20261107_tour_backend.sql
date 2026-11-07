-- STATUS: applied 2026-11-07 through the one-time function ve-once-tour-tables (now the 410 stub); the connector had held it for approval.
-- branddesk-production-wing / ve-guide-tour-standard v3: Depot > Guides, the back end of every Guide's (and tool's) tour video
-- (Sean, 2026-11-07: "it should be something that lives within the guide section we're creating in the depot, where we can see
-- everything, all the assets, all the recordings, everything for each guide on the back end"). One tour per Guide or tool; its
-- chapters (the script, each recorded on its own and checked with stt); its shots (the lookbook: the narrator on camera, page
-- captures and illustrations, each approved or sent back before anything is animated). Files live in our storage. RLS on, no
-- policies: read and written only through the edge function ve-depot (super admins). Named ve_video_* because ve_tours is the
-- old Tours feature (in the Depot trash bin); a first run made ve_tour_chapters and ve_tour_shots pointing at it, empty, dropped here.
drop table if exists public.ve_tour_shots;
drop table if exists public.ve_tour_chapters;
create table if not exists public.ve_video_tours (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  kind text not null default 'guide' check (kind in ('guide', 'tool')),
  page_url text,
  narrator text not null,
  voice_id text,
  script_doc text,
  status text not null default 'script' check (status in ('script', 'recorded', 'lookbook', 'animating', 'editing', 'live')),
  video_url text,
  youtube_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ve_video_chapters (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.ve_video_tours(id) on delete cascade,
  n int not null,
  title text not null,
  line text not null,
  audio_url text,
  audio_ver int not null default 1,
  stt_text text,
  stt_ok boolean,
  seconds numeric,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tour_id, n)
);
create table if not exists public.ve_video_shots (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.ve_video_tours(id) on delete cascade,
  chapter_n int not null,
  ord int not null default 1,
  kind text not null check (kind in ('on_camera', 'screen', 'illustration')),
  brief text not null,
  image_url text,
  audio_from numeric,
  audio_to numeric,
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'redo')),
  note text,
  decided_at timestamptz,
  decided_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_video_shots_tour on public.ve_video_shots (tour_id, chapter_n, ord);
alter table public.ve_video_tours enable row level security;
alter table public.ve_video_chapters enable row level security;
alter table public.ve_video_shots enable row level security;
