// One-time: Lavva open again (migration 20261101_lavva_open_again.sql). Only the run key's SHA-256 is here. Redeployed as the 410 stub once run.
import postgres from 'npm:postgres@3.4.4'
const KEY_SHA256 = "7db7970c6a69efecf488d4744176800a712efcd1fd03d46e15769f205466fdcd"
const STEPS: Record<string, string> = { "reopen": "-- Lavva was marked Permanently closed on 2026-10-25 (no note, no edit row; most likely Google's status for a place). Its own\n-- store, lovvelavva.com, was up and selling on 2026-11-01 (read through pg_net), so it is open again, logged in ve_listing_edits.\n-- Parma! (eatparma.com no longer resolves) and NadaMoo! (nadamoo.com reads \"Opening Soon\", no shop) stay closed.\nupdate listings set business_status = 'OPERATIONAL', updated_at = now(),\n  details = coalesce(details, '{}'::jsonb) || jsonb_build_object('reopened_at', now(), 'reopened_why', 'Its store lovvelavva.com was live on 2026-11-01')\nwhere slug = 'lavva' and business_status = 'CLOSED_PERMANENTLY';\ninsert into ve_listing_edits (listing_id, field, old_value, new_value, meta)\nselect id, 'business_status', '\"CLOSED_PERMANENTLY\"'::jsonb, '\"OPERATIONAL\"'::jsonb, '{\"by\":\"logan\",\"why\":\"lovvelavva.com live and selling, 2026-11-01\"}'::jsonb\nfrom listings where slug = 'lavva' and not exists (\n  select 1 from ve_listing_edits e join listings l2 on l2.id = e.listing_id where l2.slug = 'lavva' and e.field = 'business_status' and e.new_value = '\"OPERATIONAL\"'::jsonb);\n" }
Deno.serve(async (req: Request) => {
  const given = new TextEncoder().encode(req.headers.get('x-run-key') || '')
  const hex = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', given))).map((b) => b.toString(16).padStart(2, '0')).join('')
  if (hex !== KEY_SHA256) return new Response('not found', { status: 404 })
  const step = new URL(req.url).searchParams.get('step') || ''
  if (!STEPS[step]) return Response.json({ error: 'unknown_step' }, { status: 400 })
  const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 1, prepare: false })
  try { await sql.begin(async (tx) => { await tx.unsafe(STEPS[step]) }); return Response.json({ step, ok: true }) }
  catch (e) { return Response.json({ step, error: String(e) }, { status: 500 }) }
  finally { await sql.end() }
})
