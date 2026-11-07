-- ve-social-studio: Instagram collaborators on a slot (Sean, 2026-11-07: "tag the restaurants as collaborators... they don't have
-- to accept"). ve-social sends them as instagramData.collaborators [{username}] when the slot is pushed to Metricool.
alter table public.ve_social_slots add column if not exists collaborators text[] not null default '{}';
