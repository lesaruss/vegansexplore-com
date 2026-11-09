// ve-once-board-session (2026-11-09, ve-chapter-rankings): signs a 30-minute session for the internal Logan test member so the board can be
// checked signed in in a browser, and returns it with the member row. Then the 410 stub.
const RUN_KEY = '__RUN_KEY__'; // placeholder; the run used a fresh key kept only in the session scratchpad
const URL_ = Deno.env.get('SUPABASE_URL')!, SK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MEMBER = '459ced0a-4756-47d7-bdd3-a78865c3a141';
const b64 = (s: string | Uint8Array) => { const bin = typeof s === 'string' ? s : String.fromCharCode(...s); return btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); };
async function token(sub: string) {
  const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })), p = b64(JSON.stringify({ sub, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 1800 }));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SK.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `${h}.${p}.${b64(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${p}`))))}`;
}
Deno.serve(async (req) => {
  if (req.headers.get('x-run-key') !== RUN_KEY) return new Response('no', { status: 403 });
  const t = await token(MEMBER);
  const r = await fetch(`${URL_}/functions/v1/ve-auth`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ action: 'me' }) });
  const d = await r.json().catch(() => ({}));
  return new Response(JSON.stringify({ token: t, member: d.member || d }), { headers: { 'Content-Type': 'application/json' } });
});
