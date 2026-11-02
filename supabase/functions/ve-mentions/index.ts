// ve-mentions: the Depot review of "In this story" matches (Sean, 2026-11-02; migration 20261102_content_mentions.sql).
// Every Pulse article names the people, restaurants and brands it mentions (ve_content_mentions, built by the cron
// ve-content-mentions). A wrong match is taken off here; it stays off, because a removed row is never rebuilt.
//
// POST { action: 'list', status?: 'shown' | 'removed' }   the matches, newest first (super admins only)
// POST { action: 'set', id, status: 'shown' | 'removed' }  take a match off, or put it back
// verify_jwt is off: the VE token (an HMAC session, as ve-media-library) is checked inside.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function b64urlDecodeToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// Same key derivation as ve-auth's signJWT / decodeToken.
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlDecodeToBytes(sig), new TextEncoder().encode(`${header}.${payload}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(payload)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch {
    return null;
  }
}

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

  if (body.action === 'list') {
    const status = body.status === 'removed' ? 'removed' : 'shown';
    const { data, error } = await db.from('ve_content_mentions')
      .select('id, source, matched, status, updated_at, listings(slug, name, category), ve_pulse_content(slug, title, published_at)')
      .eq('status', status)
      .order('updated_at', { ascending: false })
      .limit(1000);
    if (error) return json({ error: 'list_failed', message: error.message }, 500);
    return json({ items: data || [] });
  }

  if (body.action === 'set') {
    const status = body.status === 'removed' ? 'removed' : body.status === 'shown' ? 'shown' : null;
    if (!body.id || !status) return json({ error: 'bad_request' }, 400);
    const { error } = await db.from('ve_content_mentions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', body.id);
    if (error) return json({ error: 'set_failed', message: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: 'unknown_action' }, 400);
});
