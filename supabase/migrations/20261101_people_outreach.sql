-- Depot > Outreach: one page a day of everyone to contact, and how (Sean, 2026-11-01, playbook ve-outreach-buckets: "each day
-- see all the people I need to communicate with in all the different ways... when I click on it, it tells me exactly what to do...
-- If it's an email... I approve it. It puts it on a schedule to go out... I have up until when it goes out... If it's an Instagram
-- message... me copying it... and once I do that, I just confirm that it was sent... text message... I respond in the notes with what
-- was said... once I approve the 2 to 3 [emails], then the rest should be pretty good just to send").
-- One row a message. Email goes out through ve-people-outreach's tick at send_at once approved (from Sean, brand lesaruss); every other
-- channel is done by hand and marked done. Base emails (ve_people_outreach_templates) are approved once; a message built from an
-- approved one that is not personal starts approved. Edge function ve-people-outreach; RLS on, no policies.

create table if not exists public.ve_people_outreach_templates (
  key text primary key,
  bucket text not null check (bucket in ('business','community','sponsor','nonprofit','group')),
  label text not null,
  subject text not null default '',
  body text not null default '',
  approved_at timestamptz,
  approved_by uuid,
  updated_at timestamptz not null default now()
);

create table if not exists public.ve_people_outreach (
  id uuid primary key default gen_random_uuid(),
  day date not null,                         -- the Eastern day it is due
  send_at timestamptz,                       -- email: when it goes out once approved
  person_id uuid,                            -- HQ people.id when known
  person_key text not null,                  -- lower(email), else lower(name): ties notes and history together
  name text not null,
  org text,
  bucket text not null check (bucket in ('business','community','sponsor','nonprofit','group')),
  channel text not null check (channel in ('email','instagram','text','call','meetup','other')),
  to_address text,                           -- email, @handle, phone or the group
  subject text,
  body text not null default '',
  link_code text,                            -- the ve_links code used in the message
  why text,                                  -- one line: who they are and why now
  template_key text references public.ve_people_outreach_templates(key),
  personal boolean not null default true,
  status text not null default 'draft' check (status in ('draft','approved','sending','sent','done','skipped','failed')),
  approved_at timestamptz, approved_by uuid,
  sent_at timestamptz, done_at timestamptz, done_by uuid,
  resend_id text, send_error text,
  follow_up_of uuid references public.ve_people_outreach(id) on delete set null,
  campaign text not null default 'outreach-nov',
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_people_outreach_day on public.ve_people_outreach (day, sort);
create index if not exists ve_people_outreach_person on public.ve_people_outreach (person_key);
create index if not exists ve_people_outreach_due on public.ve_people_outreach (send_at) where status = 'approved';

create table if not exists public.ve_people_outreach_notes (
  id uuid primary key default gen_random_uuid(),
  person_key text not null,
  message_id uuid references public.ve_people_outreach(id) on delete set null,
  author_id uuid,
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists ve_people_outreach_notes_person on public.ve_people_outreach_notes (person_key, created_at desc);

alter table public.ve_people_outreach enable row level security;
alter table public.ve_people_outreach_notes enable row level security;
alter table public.ve_people_outreach_templates enable row level security;

-- Approved emails go out every 5 minutes.
select cron.unschedule('ve-people-outreach') where exists (select 1 from cron.job where jobname = 've-people-outreach');
select cron.schedule('ve-people-outreach', '*/5 * * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-people-outreach',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"tick"}'::jsonb, timeout_milliseconds := 120000)
$$);
