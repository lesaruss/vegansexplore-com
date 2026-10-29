// Ran once on 2026-10-29 (migration 20261029_venues_east_coast.sql, the East Coast venues). Gone now.
Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
