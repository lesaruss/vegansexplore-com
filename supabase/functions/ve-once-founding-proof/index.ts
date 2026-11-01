// ve-once-founding-proof (Logan, 2026-11-01): ran (proof sessions for the Founding Member build, the test link cleanup and the playbook row); now the 410 stub.
Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
