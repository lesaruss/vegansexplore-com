-- Tickets for the Dolphins game day open (Sean, 2026-10-28: "Let's do a campaign for the Dolphins event, and I want to open up
-- tickets... link that to this campaign as well as to the event listing so that it takes them directly there when they log in").
-- Safe to run twice.
--
-- The Dolphins built our Fevo group link (playbook vegans-explore-campaign-miami-dolphins: gofevo.com/event/Vegansexplore2, a $15
-- markup per ticket paid to LESARUSS Inc.), gated to signed-in members "to prevent the public link-leak issue from last time". So
-- the link never sits on the public event row: it lives here, with no public read, and ve-events `tickets` hands it only to an
-- active Passport holder (logging the click as a lead on the campaign). The event's public ticket_url is our own page,
-- /events#event/<id>/tickets, which sends a member straight to it and asks anyone else to sign in or get their Passport first.

create table if not exists public.ve_event_member_tickets (
  event_id uuid primary key references public.events(id) on delete cascade,
  url text not null,
  initiative_slug text,
  note text,
  created_at timestamptz not null default now()
);
alter table public.ve_event_member_tickets enable row level security;
comment on table public.ve_event_member_tickets is 'A members-only ticket link for an event (no public read). ve-events tickets gives it to active Passport holders only and logs each click in ve_initiative_interest.';

insert into public.ve_event_member_tickets (event_id, url, initiative_slug, note)
values ('3f6a7e2e-efff-4b0e-80ce-580428d3cb52', 'https://www.gofevo.com/event/Vegansexplore2', 'vegans-explore-initiative-plant-based-showcase',
  'The Dolphins'' Fevo group link for Vegans Explore members, Dolphins vs. Jets, November 29, 2026; $15 a ticket to LESARUSS Inc.')
on conflict (event_id) do update set url = excluded.url, initiative_slug = excluded.initiative_slug, note = excluded.note;

update public.events set ticket_url = 'https://vegansexplore.com/events#event/3f6a7e2e-efff-4b0e-80ce-580428d3cb52/tickets', updated_at = now()
where id = '3f6a7e2e-efff-4b0e-80ce-580428d3cb52';

-- Vegans Explore organizes it, so members who RSVP can say yes to hearing from us about the day (the event window).
insert into public.ve_event_organizers (event_id, member_id, name, added_by)
values ('3f6a7e2e-efff-4b0e-80ce-580428d3cb52', '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'Vegans Explore', '72712a4a-ea0e-4ef4-a29e-d382496ef8da')
on conflict (event_id, member_id) do nothing;

insert into public.stream_events (owner, station, status, summary, keywords)
select 'Logan', 'system', 'completed', 'Dolphins game day (Nov 29) tickets open: the Fevo group link is members-only through ve-events tickets, on the event page, its calendar tile and the Plant-Based Showcase campaign; Vegans Explore is the event''s organizer.', array['vegans-explore','dolphins','tickets']
where not exists (select 1 from public.stream_events where summary like 'Dolphins game day (Nov 29) tickets open%');
