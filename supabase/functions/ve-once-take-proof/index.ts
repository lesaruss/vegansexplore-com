// ve-once-take-proof (Logan, 2026-11-03): ran (click test of the member card and Take back); now the 410 stub.
Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
