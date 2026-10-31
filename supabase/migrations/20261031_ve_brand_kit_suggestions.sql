-- Front of House brand kit: the Suggest button (canon canon-ve-front-of-house v5). Every suggestion our AI writes for a brand kit is
-- logged here (what was asked, what it wrote), which is also how ve-brand-kit limits it: 20 a day for a visitor to the sample, 200
-- for a signed-in member. RLS on, no policies: only the edge function reads and writes it.
create table if not exists public.ve_brand_kit_suggestions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  member_id uuid,
  visitor text,
  kind text not null check (kind in ('menu_item', 'story', 'voice')),
  business text,
  input jsonb not null default '{}'::jsonb,
  output jsonb
);
create index if not exists ve_brand_kit_suggestions_visitor on public.ve_brand_kit_suggestions (visitor, created_at desc);
create index if not exists ve_brand_kit_suggestions_member on public.ve_brand_kit_suggestions (member_id, created_at desc);
alter table public.ve_brand_kit_suggestions enable row level security;
