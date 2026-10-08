-- Directors' written consent for Vegans Explore Inc. (to be renamed LESARUSS Foundation, Inc.)
-- (Sean, 2026-10-08). Each director gets a personal link /board-consent?k=<token>; only the
-- sha256 of the token is stored. The page talks to the ve-board-consent edge function; the
-- table has RLS on and no policies, so only the service role reads or writes it.
-- Tokens are generated in the database and handed to Sean once, never committed here.

create table if not exists public.foundation_board_consents (
  director text primary key check (director in ('sean', 'ella', 'claudia')),
  full_name text not null,
  token_hash text not null unique,
  choice text check (choice in ('approve', 'resign', 'talk')),
  signed_name text,
  note text,
  responded_at timestamptz,
  user_agent text,
  consent_version text not null default '2026-10-08',
  created_at timestamptz not null default now()
);

alter table public.foundation_board_consents enable row level security;
