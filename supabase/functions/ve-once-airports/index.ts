// One-time runner for the Airport Guide seed (2026-10-29). Done; the SQL is in
// supabase/migrations/20261029_airports_seed.sql.
Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
