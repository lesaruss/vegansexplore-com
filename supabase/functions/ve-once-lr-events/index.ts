// ve-once-lr-events: ran both steps of migration 20261030_lesaruss_ai_events_funding.sql on 2026-10-30 (schema, then the 16
// LESARUSS.ai sources). Retired: the 410 stub (canon ops-supabase-write-once-function).
Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
