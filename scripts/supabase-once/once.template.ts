// One-time database write (canon ops-supabase-write-once-function; error registry SUPABASE-MCP-APPROVAL-HOLD-USE-ONCE-FUNCTION).
// Use it when the Supabase connector's execute_sql / apply_migration holds a write for an approval box that never shows
// (it times out at 60 s). Copy this file, put the SQL in STEPS, set KEY to a fresh random string, deploy it as
// ve-once-<task> with verify_jwt false, run each step with:
//   curl -X POST "https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-once-<task>?step=<name>" -H "x-run-key: <KEY>"
// check the result with a read-only SELECT, then redeploy the function as the 410 stub at the bottom (verify_jwt true).
// The key lives only in the session's scratchpad, never in the repo. Every step runs in one transaction.
import postgres from 'npm:postgres@3.4.4'

const KEY = '<random 48 hex characters>'
const STEPS: Record<string, string> = {
  example: `update public.some_table set some_column = 'value' where id = '00000000-0000-0000-0000-000000000000';`,
}

Deno.serve(async (req: Request) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 })
  const step = new URL(req.url).searchParams.get('step') || ''
  if (!STEPS[step]) return Response.json({ error: 'unknown_step' }, { status: 400 })
  const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 1, prepare: false })
  try {
    const out = await sql.begin(async (tx) => {
      const r: any = await tx.unsafe(STEPS[step])
      // One count per statement, so a multi-statement step shows what each one touched.
      const counts = Array.isArray(r) && Array.isArray(r[0]) ? r.map((x: any) => x.count) : [r.count]
      return { step, counts }
    })
    return Response.json(out)
  } catch (e) {
    return Response.json({ step, error: String(e) }, { status: 500 })
  } finally {
    await sql.end()
  }
})

// The stub, once every step has run:
// Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
