# ve-idea-intake: the idea inbox is live; step 3 (Approve starts a build) is next

Date: 2026-11-06 (Eastern). Playbook: `ve-idea-intake`. Also touched: `ve-feedback` (Edit listing contact fields from a phone, done earlier).

## Done and live
- **Depot > Ideas** at https://vegansexplore.com/admin/depot/ideas (Site in the Go to menu). New idea (typed or spoken, pictures shrunk to 1600 px, files, links, page), Logan's read (asking / where it belongs / how / questions), Correct me, Approve, Set aside.
- Edge function `ve-ideas` (actions list, get, upload_start, create, read, approve, set), deployed from 573544b. Table `ve_ideas`, private bucket `idea-files` (migration `20261106_ve_ideas.sql`).
- Merged to `main` (12920c8), page answers 200, live `depot-tabs.js` has the Ideas row. Proven as Sean (see CLAUDE.md, Ideas section). The test idea is Set aside; a 70-byte test PNG stays in `idea-files`.
- Not yet: Sean opening the live page signed in and dropping a real idea.

## Not done: step 3, Approve starts a build session
Sean asked for it ("go ahead and wire approve to start a build session"); the session ran out before any code was written. Nothing on any branch.

The constraint: `ve-ideas` runs in Supabase and has no way to start a Claude Code session itself. Logan's recommendation (default unless Sean overrides):
1. Approve keeps setting status `approved` (as now).
2. A scheduled task on Sean's account (fresh session each firing, hourly, Vegans Explore repo, prompt: "pick up the oldest approved idea in ve_ideas via ve-ideas get, set it building with session_url, build it on its own branch, set result_url and done") does the build. Created with the remote session tools' create_trigger, `create_new_session_on_fire: true`.
3. `ve-ideas` adds an ops-token path (`LESARUSS_ADMIN_TOKEN` + `as_member`) so the scheduled session can read and set ideas, and the idea page shows Building with the session link and Done with the result link (fields already exist).
4. Nothing merges to `main` on its own: each build waits on its branch for Sean.
Cost note: each firing with nothing approved should end in one read.

## Next
- Logan: build step 3 as above, prove it with one [TEST] idea, then delete the test rows.
- Sean: drop a real idea at /admin/depot/ideas.
