// ve-account: My Account (Sean, 2026-11-15: "a my accounts page that should show their purchases, that should do their password, all of
// that... their email address, all that stuff that you would normally see on an account. That's what I would expect to see when you click
// profile"). Read only, for the signed-in member, from their Vegans Explore token (checked the same way as ve-votes and ve-auth).
//
// POST { action: 'account' }  Authorization: Bearer <ve_token>
//   -> { ok, member: { name, email, joined_at, membership, founding_member, entry_via, points, lifetime_points, sign_in }, purchases: [...] }
//   purchases from ve_member_purchases (newest first): { at, what, kind: payment|guide|ticket|service|audit, cents, points, link }
// The password is changed from the page through ve-auth forgot_password (an emailed link), never here.
// verify_jwt is false: the token is checked here.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

function b64urlDecodeToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// Same key derivation as ve-auth's signJWT / decodeToken (and ve-votes).
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: { action?: string } = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);

  if (body.action === 'account') {
    const [{ data: m }, { data: pts }, { data: purchases, error: pErr }] = await Promise.all([
      db.from('members').select('name, email, created_at, membership_status, founding_member, entry_via, standing, password_hash, google_id, apple_id, lesaruss_identity_id').eq('id', memberId).maybeSingle(),
      db.from('member_points').select('available_points, total_points').eq('member_id', memberId).maybeSingle(),
      db.rpc('ve_member_purchases', { p_member: memberId }),
    ]);
    if (!m) return json({ error: 'not_found' }, 404);
    if (pErr) return json({ error: 'purchases_failed' }, 500);
    return json({
      ok: true,
      member: {
        name: m.name || '', email: m.email || '', joined_at: m.created_at, membership: m.membership_status,
        founding_member: !!m.founding_member, entry_via: m.entry_via || null,
        points: pts?.available_points ?? 0, lifetime_points: pts?.total_points ?? 0,
        // How they sign in, so the page offers a password change only to those with a password (the hash itself never leaves here).
        sign_in: { password: !!m.password_hash, google: !!m.google_id, apple: !!m.apple_id, lesaruss: !!m.lesaruss_identity_id },
      },
      purchases: purchases || [],
    });
  }
  return json({ error: 'unknown_action' }, 400);
});
