-- Tracked links (Sean, 2026-10-04): "anytime somebody clicks a link, you should be noting that to
-- show people who are interested in a particular campaign ... done deliberately when we're creating
-- links ... attach it to a tag that can be read in this initiative interest. So that way when we're
-- getting ready to announce something or do an update, we can send them specific communication and
-- maybe special offers."
--
-- A tracked link is vegansexplore.com/go/<code>. It points at a page, belongs to a campaign
-- (initiative_slug) and carries tags. It can be made for one person (a one-on-one message), so a
-- click names them. /api/go logs the click through the ve-links edge function and redirects.
-- A click becomes a row in ve_initiative_interest (action_type 'link_click', source 'link') when we
-- know who clicked: the link's person, the email recipient (the email system's click events, synced
-- every 15 minutes, source 'email'), or a member who is signed in now or signs in later (nav.js
-- claims the click). Link previews and scanners are logged as bots and never count.

create table if not exists public.ve_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9][a-z0-9-]{2,47}$'),
  label text check (char_length(label) <= 120),
  destination text not null check (char_length(destination) <= 1000 and (destination ~ '^https?://' or destination ~ '^/')),
  initiative_slug text not null default 'general',
  tags text[] not null default '{}',
  channel text not null default 'dm' check (channel in ('dm', 'text', 'email', 'social', 'print', 'other')),
  recipient_member_id uuid references public.members(id) on delete set null,
  recipient_email text check (char_length(recipient_email) <= 200),
  recipient_name text check (char_length(recipient_name) <= 120),
  batch_id uuid,
  active boolean not null default true,
  clicks integer not null default 0,
  last_click_at timestamptz,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists ve_links_batch_idx on public.ve_links (batch_id);
create index if not exists ve_links_initiative_idx on public.ve_links (initiative_slug, created_at desc);

create table if not exists public.ve_link_clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid references public.ve_links(id) on delete cascade,
  initiative_slug text,
  clicked_at timestamptz not null default now(),
  member_id uuid references public.members(id) on delete set null,
  email text,
  source text not null default 'click' check (source in ('click', 'email')),
  is_bot boolean not null default false,
  user_agent text check (char_length(user_agent) <= 400),
  referrer text check (char_length(referrer) <= 400),
  email_event_id uuid unique,
  claimed_at timestamptz
);
create index if not exists ve_link_clicks_link_idx on public.ve_link_clicks (link_id, clicked_at desc);

-- Initiative interest can now come from a click, and from someone without an account yet.
alter table public.ve_initiative_interest alter column member_id drop not null;
alter table public.ve_initiative_interest
  add column if not exists email text check (char_length(email) <= 200),
  add column if not exists name text check (char_length(name) <= 120),
  add column if not exists tags text[] not null default '{}',
  add column if not exists source text not null default 'form',
  add column if not exists link_id uuid references public.ve_links(id) on delete set null,
  add column if not exists clicks integer not null default 0,
  add column if not exists last_click_at timestamptz;
alter table public.ve_initiative_interest drop constraint if exists ve_initiative_interest_action_type_check;
alter table public.ve_initiative_interest add constraint ve_initiative_interest_action_type_check
  check (action_type in ('pledge', 'ticket', 'vendor_tier', 'sponsor_tier', 'link_click'));
alter table public.ve_initiative_interest drop constraint if exists ve_initiative_interest_source_check;
alter table public.ve_initiative_interest add constraint ve_initiative_interest_source_check check (source in ('form', 'link', 'email'));
alter table public.ve_initiative_interest drop constraint if exists ve_initiative_interest_who_check;
alter table public.ve_initiative_interest add constraint ve_initiative_interest_who_check check (member_id is not null or email is not null);
create index if not exists ve_initiative_interest_member_idx on public.ve_initiative_interest (initiative_slug, member_id);
create index if not exists ve_initiative_interest_email_idx on public.ve_initiative_interest (initiative_slug, lower(email));
create index if not exists ve_initiative_interest_tags_idx on public.ve_initiative_interest using gin (tags);

alter table public.ve_links enable row level security;
alter table public.ve_link_clicks enable row level security;
revoke all on public.ve_links, public.ve_link_clicks from anon, authenticated;

-- Every 15 minutes: turn email-system clicks on our links into initiative interest.
select cron.schedule('ve-links-email-sync', '4,19,34,49 * * * *', $c$
  select net.http_post(
    url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-links',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"sync_email"}'::jsonb
  )
$c$);
