// ve-ops: the dashboard's role row and the two pages behind it (Sean, 2026-10-04).
//   Platform health  -> /dashboard/health       (superadmins)
//   Submissions      -> /dashboard/submissions  (superadmins: every open item; Community Managers:
//                                                their city's bounty work, reports and Daily Post drafts)
//   This week        -> new members against the week before, active Passports
//
// POST { action: 'summary' }  counts for the role row tiles
// POST { action: 'health' }   the full health breakdown (superadmin)
// POST { action: 'queue' }    every open submission, oldest first
//
// Authorization: Bearer <ve_token>, verified the way ve-board and ve-bounties verify it (verify_jwt
// is false on deploy). Read only: everything comes from public.ve_ops_snapshot, which only the
// service role can call.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

// What a Community Manager works on from this list, and where they do it.
const CM_TYPES: Record<string, string | null> = { bounty: null, report: null, pulse: '/dashboard/pulse-desk' };
const HUB_FOR_CITY: Record<string, string> = { 'orlando-north-central-florida': 'central-florida' };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  } catch { return null; }
}

type Viewer = { id: string; admin: boolean; cm: boolean; city: string | null };
async function loadViewer(req: Request): Promise<Viewer | null> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const id = token ? await verifyToken(token) : null;
  if (!id) return null;
  const { data: m } = await db.from('members').select('id, email, is_superadmin, staff_role, ve_role, home_community').eq('id', id).maybeSingle();
  if (!m) return null;
  const cm = m.staff_role === 'community_manager' || m.ve_role === 'community_manager';
  let city: string | null = m.home_community || null;
  // Older Community Managers have their city on the staff invite, not the account.
  if (cm && m.email) {
    const { data: inv } = await db.from('ve_staff_invites').select('city_slug').ilike('email', m.email).maybeSingle();
    if (inv?.city_slug) city = inv.city_slug;
  }
  if (city) city = HUB_FOR_CITY[city] || city;
  return { id: m.id, admin: !!m.is_superadmin, cm, city };
}

type Item = { type: string; city: string | null; link: string; created_at: string; [k: string]: unknown };
type Check = { key: string; label: string; state: string; summary: string; items: unknown[] };
type Snapshot = { generated_at: string; city: string | null; queue: Item[]; week: Record<string, number>; pulse: { city: string; published_at: string; title: string }[]; health: Check[] };

async function snapshot(v: Viewer, health: boolean): Promise<Snapshot> {
  const { data, error } = await db.rpc('ve_ops_snapshot', { p_city: v.admin ? null : v.city, p_health: health && v.admin });
  if (error) throw new Error(error.message);
  const snap = data as Snapshot;
  if (!v.admin) {
    snap.queue = snap.queue
      .filter((q) => q.type in CM_TYPES)
      .map((q) => ({ ...q, link: CM_TYPES[q.type] || q.link }));
  }
  return snap;
}

const RANK: Record<string, number> = { alert: 0, warn: 1, ok: 2 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const v = await loadViewer(req);
    if (!v) return json({ error: 'Sign in again.' }, 401);
    if (!v.admin && !v.cm) return json({ error: 'Staff only.' }, 403);
    if (!v.admin && !v.city) return json({ error: 'No city on your account yet.' }, 403);
    const action = String(body.action || 'summary');

    if (action === 'summary') {
      const s = await snapshot(v, v.admin);
      const worst = s.health.slice().sort((a, b) => (RANK[a.state] ?? 2) - (RANK[b.state] ?? 2))[0] || null;
      const now = Date.now();
      return json({
        role: v.admin ? 'superadmin' : 'community_manager',
        city: s.city,
        health: v.admin ? {
          state: worst ? worst.state : 'ok',
          alerts: s.health.filter((h) => h.state === 'alert').length,
          warnings: s.health.filter((h) => h.state === 'warn').length,
          headline: worst && worst.state !== 'ok' ? `${worst.label}: ${worst.summary}` : 'All systems normal',
        } : null,
        queue: {
          open: s.queue.length,
          oldest_days: s.queue.length ? Math.floor((now - new Date(s.queue[0].created_at).getTime()) / 86400000) : 0,
          by_type: s.queue.reduce((acc: Record<string, number>, q) => { acc[q.type] = (acc[q.type] || 0) + 1; return acc; }, {}),
        },
        week: s.week,
        pulse: s.pulse,
      });
    }

    if (action === 'health') {
      if (!v.admin) return json({ error: 'Superadmin only.' }, 403);
      const s = await snapshot(v, true);
      return json({ generated_at: s.generated_at, checks: s.health, week: s.week, pulse: s.pulse, open: s.queue.length });
    }

    if (action === 'queue') {
      const s = await snapshot(v, false);
      return json({ generated_at: s.generated_at, role: v.admin ? 'superadmin' : 'community_manager', city: s.city, items: s.queue });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('ve-ops', e);
    return json({ error: 'Could not load right now.' }, 500);
  }
});
