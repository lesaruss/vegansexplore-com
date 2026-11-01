-- The social studio (Sean, 2026-11-01): "see what's slotted for the different brands... you propose things... the community manager
-- goes in... They make any adjustments... or leave a note that you will then take care of... you will use your connections to push it
-- out... If something needs a manual thing... we know ahead of time... a log... a calendar... track it to its metrics... between
-- different brands... clients if they want to use social media for us."
-- Brands (house and client), slots (one planned post each), notes (left for Logan or the team), edits (every change with what it
-- replaced) and people (who besides super admins works a brand). RLS on, no policies: everything goes through ve-social.

create table if not exists public.ve_social_brands (
  slug text primary key,
  name text not null,
  kind text not null default 'house' check (kind in ('house', 'client')),
  metricool_blog_id bigint,
  channels text[] not null default '{}',
  listing_id uuid,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.ve_social_slots (
  id uuid primary key default gen_random_uuid(),
  brand_slug text not null references public.ve_social_brands(slug),
  slot_at timestamptz not null,
  channels text[] not null default '{}',
  kind text not null default 'post' check (kind in ('post', 'carousel', 'reel', 'story', 'video', 'episode', 'thread')),
  title text,
  caption text not null default '',
  first_comment text,
  links text[] not null default '{}',
  assets jsonb not null default '[]'::jsonb,
  status text not null default 'proposed' check (status in ('proposed', 'changes', 'approved', 'scheduled', 'posted', 'failed', 'manual', 'skipped')),
  manual_steps text,
  batch text,
  proposed_by text not null default 'Logan',
  approved_by uuid,
  approved_at timestamptz,
  metricool_post_id bigint,
  metricool_state jsonb,
  pushed_at timestamptz,
  posted_at timestamptz,
  post_urls jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  metrics_at timestamptz,
  push_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_social_slots_brand_at on public.ve_social_slots (brand_slug, slot_at);
create index if not exists ve_social_slots_status on public.ve_social_slots (status);

create table if not exists public.ve_social_notes (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.ve_social_slots(id) on delete cascade,
  author_id uuid,
  author_name text not null,
  body text not null,
  status text not null default 'open' check (status in ('open', 'done')),
  reply text,
  done_by text,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ve_social_notes_open on public.ve_social_notes (status, created_at);

create table if not exists public.ve_social_edits (
  id bigserial primary key,
  slot_id uuid not null references public.ve_social_slots(id) on delete cascade,
  by_name text not null,
  by_id uuid,
  field text not null,
  old_value jsonb,
  new_value jsonb,
  at timestamptz not null default now()
);

create table if not exists public.ve_social_people (
  brand_slug text not null references public.ve_social_brands(slug),
  member_id uuid not null,
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  added_at timestamptz not null default now(),
  primary key (brand_slug, member_id)
);

alter table public.ve_social_brands enable row level security;
alter table public.ve_social_slots enable row level security;
alter table public.ve_social_notes enable row level security;
alter table public.ve_social_edits enable row level security;
alter table public.ve_social_people enable row level security;

insert into public.ve_social_brands (slug, name, kind, metricool_blog_id, channels, note) values
  ('vegans-explore', 'Vegans Explore', 'house', 3707345, array['instagram','facebook','tiktok','youtube'], 'Metricool brand 3707345'),
  ('sean-a-russell', 'Sean A. Russell', 'house', null, '{}', 'Not in Metricool yet: add the brand there, then set metricool_blog_id'),
  ('geekfon-society', 'GeekFon Society', 'house', null, '{}', 'Not in Metricool yet: add the brand there, then set metricool_blog_id')
on conflict (slug) do nothing;
