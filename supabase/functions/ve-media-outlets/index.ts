// ve-media-outlets: the Depot's private media list (Sean, 2026-11-13; migration 20261113_ve_media_outlets.sql).
// "collect all the media outlets into one location... treat them like they're directory listings, but not everyone,
// we can designate which ones we want to have facing the public." Outlets come from the Google Alert - Vegan emails and
// the News Desk; every article is scored flattering, neutral or critical toward the Vegan community, and the outlet's
// notes list its critical pieces. Private: super admins only. is_public only marks the ones Sean picks to show later.
//
// POST { action: 'list' }                                   every outlet with its counts (no coverage)
// POST { action: 'get', slug }                              one outlet and all its coverage, newest first
// POST { action: 'set', id, is_public?, team_notes? }       Public / Private, and our own notes
// verify_jwt is off: the VE token (an HMAC session, as ve-mentions) is checked inside.
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

const LIST_COLS = 'id, slug, name, domain, website, kind, scope, region, is_public, articles_count, flattering_count, neutral_count, critical_count, stance_score, stance_label, topics, first_seen, last_seen';

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
    const items: unknown[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db.from('ve_media_outlets').select(LIST_COLS)
        .order('articles_count', { ascending: false }).order('name').range(from, from + 999);
      if (error) return json({ error: 'list_failed', message: error.message }, 500);
      items.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    return json({ items });
  }

  if (body.action === 'get') {
    if (!body.slug) return json({ error: 'bad_request' }, 400);
    const { data: outlet, error } = await db.from('ve_media_outlets').select(LIST_COLS + ', notes, team_notes').eq('slug', String(body.slug)).maybeSingle();
    if (error) return json({ error: 'get_failed', message: error.message }, 500);
    if (!outlet) return json({ error: 'not_found' }, 404);
    const { data: coverage } = await db.from('ve_media_coverage')
      .select('id, url, title, snippet, published_on, origin, stance, topic, stance_reason')
      .eq('outlet_id', (outlet as any).id).order('published_on', { ascending: false, nullsFirst: false }).limit(500);
    return json({ outlet, coverage: coverage ?? [] });
  }

  if (body.action === 'set') {
    if (!body.id) return json({ error: 'bad_request' }, 400);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.is_public === 'boolean') patch.is_public = body.is_public;
    if (typeof body.team_notes === 'string') patch.team_notes = body.team_notes.slice(0, 8000) || null;
    const { data, error } = await db.from('ve_media_outlets').update(patch).eq('id', body.id).select('id, is_public, team_notes').maybeSingle();
    if (error) return json({ error: 'set_failed', message: error.message }, 500);
    return json({ ok: true, outlet: data });
  }

  return json({ error: 'unknown_action' }, 400);
});
