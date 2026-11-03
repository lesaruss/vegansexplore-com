// ve-once-pulse-proof (Logan, 2026-11-03): ran (preview proof of the Daily Pulse issue); now the 410 stub.
Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
