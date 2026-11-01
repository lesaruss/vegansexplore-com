// One-time fill of the product lines with no macros (migrations 20261101_product_barcodes_fill_2.sql, 20261101_product_off_fill.sql,
// 20261101_product_off_fill_2.sql). Run 2026-11-01; now the 410 stub.
Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
