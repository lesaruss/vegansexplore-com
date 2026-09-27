// lesaruss-dispatch-admin: the "Background writer" box on Depot > News Desk (Sean, 2026-09-27).
// Lets Sean see and set up the dispatcher without opening Supabase: which station writes (Station 1 =
// SAR-station, Station 2 = V-station), paste each station's routine trigger URL and token, and see
// recent runs. Tokens are write-only here; nothing returns them. Superadmins only.
//
// POST { action: 'status' }                                  Authorization: Bearer <ve_token>
// POST { action: 'save_station', station, fire_url, token }
// POST { action: 'route', station }                          which station writes next
// POST { action: 'run_now' }                                 runs the 15-minute check right away
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Same key derivation as ve-auth's signJWT.
function b64urlDecodeToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlDecodeToBytes(sig), new TextEncoder().encode(`${header}.${payload}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(payload)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}

const STATIONS = ['station-1', 'station-2'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: member } = await db.from('members').select('id, is_superadmin').eq('id', memberId).maybeSingle();
  if (!member?.is_superadmin) return json({ error: 'no_access' }, 403);

  if (body.action === 'status') {
    const { data, error } = await db.rpc('lesaruss_dispatch_status');
    if (error) return json({ error: 'status_failed', message: error.message }, 500);
    return json({ ok: true, ...data });
  }

  if (body.action === 'save_station') {
    const station = String(body.station || ''), url = String(body.fire_url || '').trim(), tok = String(body.token || '').trim();
    if (!STATIONS.includes(station)) return json({ error: 'bad_station' }, 400);
    if (!/^https:\/\/api\.anthropic\.com\/v1\/claude_code\/routines\/[A-Za-z0-9_-]+\/fire$/.test(url)) return json({ error: 'bad_url' }, 400);
    if (tok.length < 20) return json({ error: 'bad_token' }, 400);
    const { error } = await db.rpc('lesaruss_dispatch_save_station', { p_station: station, p_url: url, p_token: tok });
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    await db.from('stream_events').insert({ owner: 'logan', station: 'dispatcher', summary: `Sean connected the Dispatcher Worker routine for ${station} from Depot > News Desk.`, status: 'completed' });
    return json({ ok: true });
  }

  if (body.action === 'route') {
    const station = String(body.station || '');
    if (!STATIONS.includes(station)) return json({ error: 'bad_station' }, 400);
    const { error } = await db.rpc('lesaruss_dispatch_route', { p_station: station });
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, route: station });
  }

  if (body.action === 'run_now') {
    const { data, error } = await db.rpc('lesaruss_dispatch_tick');
    if (error) return json({ error: 'tick_failed', message: error.message }, 500);
    return json({ ok: true, tick: data });
  }

  return json({ error: 'unknown_action' }, 400);
});
