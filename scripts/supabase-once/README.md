# One-time database writes

Use this when the Supabase connector holds a database write (`execute_sql` or `apply_migration`) for an approval box
that never shows. Sean set this up on 2026-10-25. The rule is canon `ops-supabase-write-once-function`, and the fix is
also logged in the error registry as `SUPABASE-MCP-APPROVAL-HOLD-USE-ONCE-FUNCTION`.

1. Copy `once.template.ts`. Put the SQL in `STEPS`, one named step each, and make each step safe to run twice
   (for example `where not exists` or `content not like`).
2. Set `KEY` to a fresh random string (`python3 -c "import secrets;print(secrets.token_hex(24))"`). Keep it in the
   session scratchpad only, never in the repo.
3. Deploy it as `ve-once-<task>` with `deploy_edge_function`, verify_jwt false. Read it back to confirm it matches.
4. Run each step:
   `curl -X POST "https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-once-<task>?step=<name>" -H "x-run-key: <key>"`.
   Each step runs in one transaction, so an error changes nothing. A step's reply may list a count for only one
   statement, so check every write with a plain `SELECT` through `execute_sql`. Reads never prompt.
5. Redeploy the function as the 410 stub at the bottom of the template (verify_jwt true) and confirm it refuses a call.
6. Commit the same SQL as a migration in `supabase/migrations/`, as always.
