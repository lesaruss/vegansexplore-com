# ve-feedback: dashboard Insights and the Depot move (2026-11-03)

Playbook: `ve-feedback` (Sean's spot-check list; Watching, nothing open). Canon: `canon-ve-feedback-playbook`.

## What shipped (main c905155, live, confirmed in the page's HTML)
- `dashboard/center-console.html`: Insights block (`#dash-insights-block`, `renderInsights`, `insLoad`, `insWeb`, `insSocial`, `insSeo`) beside For you
  on the super admin's Dashboard tab; the Depot (`#dash-depot-block`) moved to the bottom below Recent activity; `syncHome` sizes the Insights box.
- `.dash-tools-bar[hidden]{display:none}`: the Your tools search box had been showing to super admins.
- Reads: `ve-analytics` `report` (Web, SEO) and `ve-social` `report` (Social, brand `vegans-explore`), last 30 days against the 30 before, cached 3 minutes in the browser.
- DB: `ve_playbook_index` row and three `playbook_records` (migration `20261103_ve_feedback_playbook.sql`), canon `canon-ve-feedback-playbook`, a `brief_checkpoints` row and a `stream_events` row.

## Not proven
- Real numbers in the Insights tabs as Sean. Checked only against mocked answers at 1440 and 390 px (Playwright, `route` mocks for ve-analytics, ve-social, ve-auth).
- Whether Insights should stretch to For you's height with real data (`syncHome`).
- A 1440 px screenshot of the Depot after `scrollIntoView` showed half the grid blank; the full-page capture drew it fully. Believed a capture glitch, not checked.

## How the playbook runs (also in CLAUDE.md, Playbooks)
Triage every item: Feedback queue, an existing playbook's queue (name its slug), or a new idea (recommend a playbook or park it, never build quietly).
One pinned task per playbook. Confirm each item live, mark it Done, pull the next. Never closes; Watching when empty.

## Next
Sean checks the live dashboard, then sends the next batch in a chat named `ve-feedback`.
