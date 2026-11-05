// ve-sourcing (Logan, 2026-11-04, playbook ve-vegan-sourcing-guide, canon canon-ve-vegan-sourcing).
// The shared vegan sourcing directory (ve_suppliers), served only inside the Guides that carry a Sourcing tab.
//   POST { action: 'list', guide?, domain?, kind?, label?, q?, limit?, offset? }   suppliers plus counts by domain and label
//   POST { action: 'get', guide?, slug }                                            one supplier
// The member token is checked here, then the member must own the Guide (a door Guide opens for any active member, ve_owns_guide)
// or be a super admin. ve_suppliers has RLS on and no policies, so nothing else reads it. Never returns source or internal notes.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// The Guides that carry the Sourcing tab. A new Guide is one entry here.
const GUIDES = new Set(['vegan-restaurant-guide', 'pre-vegan-business-guide']);
const DOMAINS = ['food_drink', 'ingredients', 'packaging', 'co_packing', 'machinery', 'materials', 'distribution', 'certification'];
const LABELS = ['peta_approved', 'fully_vegan', 'offers_options', 'plant_material'];

function b64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
const bearer = (req: Request) => (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');

const PUBLIC_FIELDS = 'slug,name,website,domain,kinds,label,bio';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');
    const sub = await verifyToken(bearer(req));
    if (!sub) return json({ error: 'not_authenticated' }, 401);
    const guide = String(body.guide ?? 'vegan-restaurant-guide');
    if (!GUIDES.has(guide)) return json({ error: 'bad_guide' }, 400);

    // Reads only, so a member on hold may still read. The member must own the Guide, or be a super admin.
    const { data: me } = await db.from('members').select('is_superadmin, member_class').eq('id', sub).maybeSingle();
    if (!me || me.member_class === 'agent') return json({ error: 'not_allowed' }, 403);
    if (!me.is_superadmin) {
      const { data: owns } = await db.rpc('ve_owns_guide', { p_member: sub, p_guide: guide });
      if (!owns) return json({ error: 'guide_required' }, 403);
    }

    if (action === 'list') {
      const { data: all, error } = await db.from('ve_suppliers').select(PUBLIC_FIELDS).eq('status', 'active').order('name');
      if (error) return json({ error: 'db' }, 500);
      const rows = all ?? [];
      const counts: Record<string, Record<string, number>> = { domain: {}, label: {} };
      for (const r of rows) {
        counts.domain[r.domain] = (counts.domain[r.domain] ?? 0) + 1;
        counts.label[r.label] = (counts.label[r.label] ?? 0) + 1;
      }
      const domain = DOMAINS.includes(String(body.domain)) ? String(body.domain) : null;
      const label = LABELS.includes(String(body.label)) ? String(body.label) : null;
      const kind = typeof body.kind === 'string' ? body.kind.trim().toLowerCase().slice(0, 40) : '';
      const q = typeof body.q === 'string' ? body.q.trim().toLowerCase().slice(0, 60) : '';
      let list = rows.filter((r: any) =>
        (!domain || r.domain === domain) && (!label || r.label === label) &&
        (!kind || (r.kinds ?? []).some((k: string) => k.toLowerCase() === kind)) &&
        (!q || String(r.name).toLowerCase().includes(q) || (r.kinds ?? []).some((k: string) => k.toLowerCase().includes(q))));
      // PETA-Approved Vegan first, then A to Z.
      const rank: Record<string, number> = { peta_approved: 0, fully_vegan: 1, offers_options: 2, plant_material: 3 };
      list = list.sort((a: any, b: any) => (rank[a.label] - rank[b.label]) || String(a.name).localeCompare(String(b.name)));
      const limit = Math.min(Math.max(parseInt(body.limit) || 48, 1), 100);
      const offset = Math.max(parseInt(body.offset) || 0, 0);
      const kinds = [...new Set(rows.filter((r: any) => !domain || r.domain === domain).flatMap((r: any) => r.kinds ?? []))].sort();
      return json({ ok: true, total: list.length, suppliers: list.slice(offset, offset + limit), counts, kinds });
    }

    if (action === 'get') {
      const slug = String(body.slug ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 120);
      const { data } = await db.from('ve_suppliers').select(PUBLIC_FIELDS).eq('slug', slug).eq('status', 'active').maybeSingle();
      if (!data) return json({ error: 'not_found' }, 404);
      return json({ ok: true, supplier: data });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('ve-sourcing', e);
    return json({ error: 'server' }, 500);
  }
});
