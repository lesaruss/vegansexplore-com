-- BrandDesk client houses (Sean, 2026-11-02: "the first step would be the overview page... the other stuff... a locked sign where it's
-- like you have to complete this part"). A client's BrandDesk page before and after they sign: stage proposal | agreement | payment |
-- kickoff | active | closed. Brand kit, Plan, Social, Web and Insights unlock at kickoff. theme is the temporary branding until their
-- brand kit is locked. HQ reads it with the service client (lib/brandDesk.ts loadHouse). Applied 2026-11-02 through the connector.
create table if not exists branddesk_houses (
  brand_slug text primary key,
  name text not null,
  client_name text,
  client_email text,
  stage text not null default 'proposal' check (stage in ('proposal','agreement','payment','kickoff','active','closed')),
  theme jsonb not null default '{}'::jsonb,
  projects jsonb not null default '[]'::jsonb,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table branddesk_houses enable row level security;
insert into branddesk_houses (brand_slug, name, client_name, client_email, stage, theme, projects, note, updated_by)
values ('j9-consulting','J9 Consulting','Janine Loweth','jlowethv@gmail.com','proposal',
 '{"color":"#14213D","accent":"#E9B949","tagline":"Two Ideas, One Journey"}'::jsonb,
 '["The Human Doctrine","Grounding Station"]'::jsonb,
 'First BrandDesk client. Proposal ported from the J9 artifact by the J9 session (playbook j9-human-doctrine-partnership). Nothing goes to Janine until Sean says send.','logan')
on conflict (brand_slug) do nothing;
