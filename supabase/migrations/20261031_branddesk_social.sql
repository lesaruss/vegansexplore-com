-- BrandDesk social add-on, phase 1 (Sean, 2026-10-31: "Start on the social add-on"; canon canon-ve-front-of-house: +$500 a month,
-- two platforms so customers who stay off Meta still find them, offered in a city once we have the talent).
-- One setup row per client (the two platforms, their handles, the social manager, posts a month) and one row per post: drafted by the
-- social manager, sent to the owner for their OK (or approved on its own 48 hours before its date), posted by hand with its links.
-- Everything goes through the edge function ve-branddesk (social_*). RLS on, no policies. Logan's defaults, Sean's to change:
-- 12 posts a month, the 48-hour OK, the platform list, at least one platform off Meta.

create table if not exists public.ve_branddesk_social (
  account_id uuid primary key references public.ve_branddesk_accounts(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  platforms text[] not null default '{}',
  handles jsonb not null default '{}'::jsonb,
  manager_id uuid references public.members(id),
  per_month int not null default 12 check (per_month between 1 and 60),
  status text not null default 'setup' check (status in ('setup', 'active', 'paused')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.ve_branddesk_social enable row level security;

create table if not exists public.ve_branddesk_social_posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ve_branddesk_accounts(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  planned_at timestamptz,
  platforms text[] not null default '{}',
  format text not null default 'photo' check (format in ('photo', 'carousel', 'video', 'story')),
  caption text,
  media uuid[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'review', 'changes', 'approved', 'posted', 'skipped')),
  owner_note text,
  sent_at timestamptz,
  approved_at timestamptz,
  approved_by text check (approved_by in ('owner', 'auto', 'team')),
  links jsonb not null default '{}'::jsonb,
  posted_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create index if not exists ve_branddesk_social_posts_acct on public.ve_branddesk_social_posts (account_id, planned_at);
create index if not exists ve_branddesk_social_posts_review on public.ve_branddesk_social_posts (status, planned_at) where status = 'review';
alter table public.ve_branddesk_social_posts enable row level security;

-- The chapters social is open in (the talent is there). Empty: only super admins can add social at checkout.
update public.ve_site_settings set value = value || jsonb_build_object('social_chapters', coalesce(value->'social_chapters', '[]'::jsonb))
where key = 'branddesk';
