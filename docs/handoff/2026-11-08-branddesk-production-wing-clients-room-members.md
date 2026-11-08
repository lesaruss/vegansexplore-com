# branddesk-production-wing: Who filter live, the BrandDesk Clients room, Depot > Members

Date: 2026-11-08 (Eastern). Playbook: `branddesk-production-wing`. Logan, build mode.

## Done
- **Merged and live** (Sean: "Merge both"): HQ main d9df825 (the Outreach Roster's Who filter), VE main 0dc086e (its migration file and notes). Checked signed in
  as the view-only QA account at 1440 and 390 px: BrandDesk > Vegans Explore > Outreach > Roster > Who = Members (12, read only, Open in the Depot), Depot > Ideas
  (31 ideas, chips right), BrandDesk > Blueprint > Ideas shows the pointer to Depot > Ideas. No sideways scroll. React #418 on the Roster page is the known one from
  before this change.
- **BrandDesk > Clients** (HQ branch `claude/brave-wozniak-0opxuh`, fcf58c2 and 3380447, **not on HQ main**): `/branddesk/clients`, copied from the Websites room.
  Tabs Clients, Rotation, Monthly check-ins; one client (`?account=&v=start|library|checkins|rotation`): Getting started (Mark done with a note, Undo, auto steps
  tick themselves, Archive it now), Their Library (by kind, upload many, Remove), Monthly check-ins (Open this month's check-in, each opens /business/checkin),
  Rotation (Add a campaign from the idea library, each opens /business/campaign). All through `/api/branddesk/clients` -> ve-branddesk actions as the signed-in
  person (`lib/branddeskClients.ts`); no edge function changed. Billing (Pause, End it) and Social stay in the Depot. A Clients button on the BrandDesk wall.
  Proven on the preview signed in: the real `list` returned 0 accounts (no BrandDesk client exists); every view checked against mocked answers at 1440 and 390 px.
- **Depot > Members** (VE branch `claude/brave-wozniak-0opxuh`, 3a8572b, **not on main**): `admin/depot/members.html`, copied from the Watchlist, read only:
  ve-members-admin `list_all_members`, Vegans Explore accounts, class tabs, search, sort, pages in the address, Open their page (Depot > People). The Go to menu's
  Members points here; `/dashboard/members` (with class moves) still opens by address. Checked locally against mocked answers beside the Watchlist.

## Waiting on Sean
- Merge both `claude/brave-wozniak-0opxuh` branches (or ask for changes).
- The 19 lookbook decisions and the chapter 5 line.

## Logan next
- After merge: see both live signed in. Then retire the client half of Depot > BrandDesk (Clients) once Sean says the HQ room does the job.
