// ve-once-levels-proof (2026-11-08, ve-explorer-path): signs a 15-minute session for the internal Logan test member inside the function,
// calls the live ve-affiliate `me`, and returns only whether `history` came back (no token leaves the server). Then the 410 stub.
const RUN_KEY = '__RUN_KEY__'; // placeholder; the run used a fresh key kept only in the session scratchpad
const URL_ = Deno.env.get('SUPABASE_URL')!, SK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MEMBER = '459ced0a-4756-47d7-bdd3-a78865c3a141';
const b64 = (s: string | Uint8Array) => { const bin = typeof s === 'string' ? s : String.fromCharCode(...s); return btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); };
async function token(sub: string) {
  const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })), p = b64(JSON.stringify({ sub, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 900 }));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SK.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `${h}.${p}.${b64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${p}`))))}`;
}
Deno.serve(async (req) => {
  if (req.headers.get('x-run-key') !== RUN_KEY) return new Response('no', { status: 403 });
  const r = await fetch(`${URL_}/functions/v1/ve-affiliate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await token(MEMBER) }, body: JSON.stringify({ action: 'me' }) });
  const d = await r.json().catch(() => ({}));
  return new Response(JSON.stringify({ status: r.status, ok: d.ok, member: d.member, history_is_array: Array.isArray(d.history), history_rows: Array.isArray(d.history) ? d.history.length : null, newest: Array.isArray(d.history) && d.history[0] ? { delta: d.history[0].delta, reason: d.history[0].reason, at: d.history[0].created_at } : null }), { headers: { 'Content-Type': 'application/json' } });
});
