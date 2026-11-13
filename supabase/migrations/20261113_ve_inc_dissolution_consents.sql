-- Directors' written consent to dissolve Vegans Explore Inc. (Sean, 2026-11-13: "the words are good, build the signing link").
-- Same pattern as foundation_board_consents (20261008): a personal link /board-consent-dissolution?k=<token> per director,
-- only the sha256 of the token stored, RLS on and no policies (service role only, through ve-board-consent with doc
-- 'dissolution-2026-11-13'). Tokens are made in the database and handed to Sean once; never committed.
-- Text of the consent: docs/legal/2026-11-13-ve-inc-written-consent-draft.md (approved by Sean 2026-11-13).
create table if not exists public.ve_inc_dissolution_consents (
  director text primary key check (director in ('sean', 'claudia')),
  full_name text not null,
  token_hash text not null unique,
  choice text check (choice in ('approve', 'talk')),
  signed_name text,
  note text,
  responded_at timestamptz,
  user_agent text,
  consent_version text not null default '2026-11-13',
  created_at timestamptz not null default now()
);
alter table public.ve_inc_dissolution_consents enable row level security;
