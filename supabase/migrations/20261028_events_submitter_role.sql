-- Events: who sent it (Sean, 2026-10-28: "members who are logged in... need to make clear if they are the owners of the event,
-- if they're the promoters of the event, or if they're just someone who plans on attending... if they are the owners of the
-- event, then we want to give them additional options for promotion"). Set by ve-events submit; a host or promoter lands on
-- Promote your event (/events#promote/<id>), whose I'm interested goes to ve_initiative_interest (initiative event-promotion).
alter table public.events add column if not exists submitter_role text;
alter table public.events drop constraint if exists events_submitter_role_check;
alter table public.events add constraint events_submitter_role_check check (submitter_role is null or submitter_role in ('host', 'promoter', 'attending'));
