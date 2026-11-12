# Handoff: Nominate Someone, complete (2026-11-12)

Playbook `ve-nominate-someone`. Canon `canon-ve-nominate-someone` (v1, this session). History: `docs/history/communities.md`,
"Nominate Someone and Kai's interview". Proposal (every approved draft): `docs/proposals/nominate-someone.md`.

## What Sean approved this session (his words)

- "yes to both, approved, build step 2": the outreach pause lifted for the Nominee invitations campaign only; the invitation email as drafted.
- "yes, build the nominator note next"; then "approved, turn it on" (the note's wording).
- "yes, draft the featured kit"; then "approved, build the featured kit" (graphics, portrait, both emails, the Depot flow, as drafted).
- "wrap up".

## What is live (main, last commit of this work: the "no double period" fix after merge 2a23fd0)

- **Step 2**: Approve and invite in Depot > Nominations makes Kai's personal opening (stt checked; bracketed markers like [TEST] not read
  aloud) and queues `nominee-invitations` (day 0, reminder day 4 unless started). `/nominate/interview`: welcome, 8 recorded questions,
  send, optional nominate, account (email or Google; Apple hidden until its Services ID), joining = the Explorer survey (250 points once,
  Explorer and Nominee badges, Founding Member). Empty recordings are caught on the page.
- **Nominator notes** (`nominator-notes`, active): "We invited <name>", one note naming everyone while unsent.
- **Featured kit**: photo + release at account setup (private bucket `nomination-photos`); Depot `#n/<id>/feature` (places, Check the kit,
  likeness tick, Send the feature); campaigns `featured-people` and `nominator-featured` (active, locked, per-person `ft-` links made before
  the send); You've Been Featured (`#/featured`): places, portrait (Use as my profile picture, Download, redraw request), post and story,
  Copy my link. Render script `scripts/brand-templates/featured.js` (first brand-kit render script); runbook `scripts/featured-kit/README.md`.
- `ve-nominations` live source sha256 `7d2ce7ad56dd3fdaf11f1a1d9babbdc4e132ecc984948a93d0978766d13d834e` = the file on main.
- Migrations: `20261112_nominee_interview`, `_nominee_invitations`, `_nominator_notes`, `_nominator_notes_on`, `_featured_kit` (all applied).

## Proven

Every piece end to end against the live function with [TEST] rows (browser walks at 1440 and 390, emails rendered and stopped before
sending); all proof rows, accounts, links and files removed; `ve-once-nominee-proof` is the 410 stub.

## Open (nothing waits on Sean right now)

- The featured kit is a session step: when the team saves places, a `stream_events` row "Featured kit requested: <name>" appears; Sean
  says "make the featured kit for <name>" and Logan follows `scripts/featured-kit/README.md` (about 10 Higgsfield credits). Fully automatic
  needs a server-side image API key (Sean's call, not asked yet).
- Sign in with Apple on the website needs an Apple Services ID (Sean's Apple developer account).
- The podcast's share kit for features ("we'll talk about that later", Sean 2026-11-09).
- Test addresses (`test-%`, `@example.com`) are quarantined at signup and not admitted: by design, not a bug.
