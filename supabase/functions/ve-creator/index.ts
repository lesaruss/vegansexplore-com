// ve-creator: the creator dashboard (Sean, 2026-11-10: "this should be her dashboard, what she sees when she logs in... only select
// people will get the dashboard"). Migration 20261110_creator_dashboard.sql: ve_creator_dashboards, one row per creator who has one.
//   POST { action: 'me' }              { has:false } for everyone without a dashboard; the creator's own dashboard once it is enabled
//   POST { action: 'me', as: slug }    super admins: preview any creator's dashboard, enabled or not
//   POST { action: 'list' }            super admins: every creator dashboard and whether it is on
// Ops (LESARUSS_ADMIN_TOKEN) may pass as_member for proofs. The kit, the link, its clicks (bots left out) and who joined through it. Copied from ve-affiliate's token check (verify_jwt off).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function b64urlToBytes(str: string): Uint8Array<ArrayBuffer> {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
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
// Ops (Bearer LESARUSS_ADMIN_TOKEN) may act as a member with as_member, as in ve-ambassador: for proofs.
async function secret(key: string): Promise<string | null> {
  const env = Deno.env.get(key);
  if (env) return env;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value && data.value !== 'pending' ? String(data.value) : null;
}
async function memberOf(req: Request, body: Record<string, unknown>): Promise<string | null> {
  const token = bearer(req);
  if (!token) return null;
  const ops = await secret('LESARUSS_ADMIN_TOKEN');
  if (ops && token.length === ops.length && token === ops) return typeof body.as_member === 'string' && /^[0-9a-f-]{36}$/i.test(body.as_member) ? body.as_member : null;
  return verifyToken(token);
}

type Row = { member_id: string; slug: string; display_name: string; handle: string | null; city: string | null; go_code: string | null;
  people_slug: string | null; kit: Record<string, unknown>; enabled: boolean };

async function dashboard(row: Row) {
  const kit = row.kit as Record<string, any>;
  const base = String(kit.base ?? '');
  const u = (f: unknown) => (f ? base + String(f) : null);
  const { data: m } = await db.from('members').select('id, name, referral_code, main_badge').eq('id', row.member_id).maybeSingle();
  const link = row.go_code ? `${SITE}/go/${row.go_code}` : (m?.referral_code ? `${SITE}/r/${m.referral_code}` : null);
  // Clicks on her /go/ link, bots left out.
  let clicks = 0, clicks7 = 0;
  if (row.go_code) {
    const { data: l } = await db.from('ve_links').select('id').eq('code', row.go_code).maybeSingle();
    if (l) {
      const since = new Date(Date.now() - 7 * 864e5).toISOString();
      const [a, b] = await Promise.all([
        db.from('ve_link_clicks').select('id', { count: 'exact', head: true }).eq('link_id', l.id).or('is_bot.is.null,is_bot.eq.false'),
        db.from('ve_link_clicks').select('id', { count: 'exact', head: true }).eq('link_id', l.id).or('is_bot.is.null,is_bot.eq.false').gte('clicked_at', since),
      ]);
      clicks = a.count ?? 0; clicks7 = b.count ?? 0;
    }
  }
  // Who joined through her: first names and the day only.
  const ors = [`referred_by.eq.${row.member_id}`].concat(m?.referral_code ? [`referred_by_code.eq.${m.referral_code}`] : []);
  const { data: joined } = await db.from('members').select('name, created_at').or(ors.join(',')).is('deleted_at', null)
    .order('created_at', { ascending: false }).limit(100);
  const captions = Array.isArray(kit.captions) ? kit.captions.map((c: any) => ({ label: c.label, text: String(c.text ?? '').replace(/\{link\}/g, link ?? '') })) : [];
  return {
    slug: row.slug, name: row.display_name, handle: row.handle, city: row.city, enabled: row.enabled,
    profile: row.people_slug ? `${SITE}/directory/${row.people_slug}` : null, badge: m?.main_badge ?? null,
    link, clicks, clicks7, points_per_join: 111,
    joined: (joined ?? []).map((j: { name: string | null; created_at: string }) => ({ first: String(j.name ?? '').trim().split(/\s+/)[0] || 'A new member', at: j.created_at })),
    kit: {
      avatar: u(kit.avatar),
      // The reel tab (Sean, 2026-11-10): a clean thumbnail, how we recommend posting it, and captions in the creator's voice to copy.
      reel: kit.reel ? { file: u(kit.reel.file), poster: u(kit.reel.poster), thumb: u(kit.reel.thumb), about: kit.reel.about ?? '',
        steps: Array.isArray(kit.reel.steps) ? kit.reel.steps.map((t: unknown) => String(t).replace(/\{link\}/g, link ?? '')) : [],
        captions: Array.isArray(kit.reel.captions) ? kit.reel.captions.map((c: any) => ({ label: c.label, text: String(c.text ?? '').replace(/\{link\}/g, link ?? '') })) : [] } : null,
      story: kit.story ? { file: u(kit.story.file), about: kit.story.about ?? '' } : null,
      carousel: Array.isArray(kit.carousel) ? kit.carousel.map(u) : [],
      carousel_zip: u(kit.carousel_zip),
      captions,
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');
    const sub = await memberOf(req, body);
    if (!sub) return json({ error: 'not_authenticated' }, 401);
    const { data: me } = await db.from('members').select('id, is_superadmin').eq('id', sub).maybeSingle();
    if (!me) return json({ error: 'not_authenticated' }, 401);
    const admin = !!me.is_superadmin;
    const cols = 'member_id, slug, display_name, handle, city, go_code, people_slug, kit, enabled';

    if (action === 'list') {
      if (!admin) return json({ error: 'forbidden' }, 403);
      const { data } = await db.from('ve_creator_dashboards').select('slug, display_name, city, enabled, enabled_at').order('created_at');
      return json({ ok: true, creators: data ?? [] });
    }
    if (action === 'me') {
      const as = typeof body.as === 'string' ? body.as.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60) : '';
      if (as) {
        if (!admin) return json({ error: 'forbidden' }, 403);
        const { data: row } = await db.from('ve_creator_dashboards').select(cols).eq('slug', as).maybeSingle();
        if (!row) return json({ error: 'not_found' }, 404);
        return json({ ok: true, has: true, preview: true, admin, ...(await dashboard(row as Row)) });
      }
      const { data: row } = await db.from('ve_creator_dashboards').select(cols).eq('member_id', me.id).maybeSingle();
      // Only select people have one, and only once it is switched on.
      if (!row || !row.enabled) {
        if (admin) {
          const { data: list } = await db.from('ve_creator_dashboards').select('slug, display_name, enabled').order('created_at');
          return json({ ok: true, has: false, admin, creators: list ?? [] });
        }
        return json({ ok: true, has: false });
      }
      return json({ ok: true, has: true, admin, ...(await dashboard(row as Row)) });
    }
    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('ve-creator:', e);
    return json({ error: 'server_error' }, 500);
  }
});
