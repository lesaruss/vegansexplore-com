# Handoff 2026-11-03: Depot > Playbooks (the playbook index)

Playbook `ve-playbook-index` (brand `vegans-explore`). Sean: "I need the playbooks to reel me in... what playbook is this being logged into, and where do we stand on that playbook as a whole?"

## Built and live
- `ve_playbook_index` (RLS on, no policies), 24 rows: slug, title, goal, status (building | waiting_on_sean | watching | parked | done), stage, next_action, owner (Logan | Sean), due_on, priority. Migration `supabase/migrations/20261103_playbook_index.sql`.
- Edge function `ve-playbooks` (`list`, `get`, `save`, `add`; super admin token checked inside). Unauthenticated calls answer 401 (checked).
- Page `/admin/depot/playbooks` (the Watchlist's shell), first in the Depot Go to menu. On `main` via PR #136, answers 200.
- CLAUDE.md "Playbooks: open here first": every chat names its playbook and its next action first; wrap up updates the row.

## Not checked
The page signed in as a real admin against the live function (checked only against mocked data at 1440 and 390 px). The 24 rows were written from CLAUDE.md, not read to Sean yet: Earn your Passport's next action and BrandDesk's pilot are the least certain.

## Sean's open items (Needs Sean tab)
Abuse watch (Nov 10), Door Guides welcome notes (about Dec 3), Event host path heads-up email, BrandDesk pilot, Group Partners invitations, Nonprofit Partners (Susan Hargreaves), Money in (Brooke's billing before Nov 30).

## Next
Read the rows with Sean and correct them. Then start `ve-pathways`: Pulse subscribe. Not built: rows for other brands, a Needs Sean count on the dashboard.
