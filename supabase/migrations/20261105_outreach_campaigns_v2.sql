-- ve-outreach-buckets: Campaigns v2 (Sean, 2026-11-05, mock approved: "go, build it on the HQ branch").
-- A campaign is a group that gets the three-email sequence from a start day (start_on). Unscheduled ones (start_on null) stay out of sight.
-- Each campaign keeps its own copy of the three emails (copied from the door's template at creation), which Sean edits and locks one by one.
-- Approving records the approval only: the sending engine is NOT connected to campaigns yet (per-city send days and the city switch still rule).
alter table ve_outreach_campaigns
  add column if not exists start_on date,
  add column if not exists cities text[] not null default '{}',
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid;

create table if not exists ve_outreach_campaign_emails (
  campaign_slug text not null references ve_outreach_campaigns(slug) on delete cascade,
  step int not null check (step between 1 and 3),
  subject text not null,
  body text not null,
  comment text,
  redraft_at timestamptz,
  locked_at timestamptz,
  locked_by uuid,
  updated_at timestamptz not null default now(),
  primary key (campaign_slug, step)
);
alter table ve_outreach_campaign_emails enable row level security;
