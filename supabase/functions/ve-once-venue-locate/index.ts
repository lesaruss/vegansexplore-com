// Ran once on 2026-11-01 (migration 20261101_venue_locate_bounty.sql, the Where is it bounty). Gone now.
Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
