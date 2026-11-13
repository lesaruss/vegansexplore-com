// ve-badges: Depot > Business badges (Sean, 2026-11-06, canon-ve-business-badges; migration 20261106_business_badge_intake.sql).
// The owner's own intake answers set their badge; 100% Vegan shows only after our team checks it. This is the team's queue.
// POST { action, ... } with the signed-in super admin's token. verify_jwt off, the token is checked here.
// Actions: list {status?}, get {member_id}, decide {member_id, decision: approve | follow_up | note, note}.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ['checking', 'follow_up', 'shown'];

function b64d(s: string): Uint8Array { const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4)); const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); const o = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; }
// Same key derivation as ve-auth's signJWT / decodeToken.
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, sg] = token.split('.');
    if (!h || !p || !sg) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64d(sg), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64d(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

// Who the business is: the member, the business name and link they gave, their chapter, and any listing they own.
async function people(ids: string[]) {
  if (!ids.length) return {} as Record<string, any>;
  const [ms, sh, ls] = await Promise.all([
    db.from('members').select('id, name, email, initials, color, avatar_url, home_community').in('id', ids),
    db.from('ve_member_shared_answers').select('member_id, key, value').in('member_id', ids).in('key', ['org_name', 'org_link', 'chapter']),
    db.from('listings').select('id, slug, name, category, owner_member_id').in('owner_member_id', ids).eq('status', 'approved').limit(200),
  ]);
  const out: Record<string, any> = {};
  for (const m of ms.data || []) out[m.id] = { ...m, business: {}, listings: [] };
  for (const s of sh.data || []) if (out[s.member_id]) out[s.member_id].business[s.key] = s.value;
  for (const l of ls.data || []) if (out[l.owner_member_id]) out[l.owner_member_id].listings.push({ slug: l.slug, name: l.name, category: l.category });
  return out;
}

const escH = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
// Tell the owner their 100% Vegan badge is on (Sean, 2026-11-07). Through HQ's email system, brand vegans-explore, signed by the team.
// A [TEST] name sends nothing. Returns what email-send said, for the Depot.
async function approvedEmail(id: string): Promise<string> {
  const { data: m } = await db.from('members').select('name, email').eq('id', id).maybeSingle();
  if (!m?.email) return 'no_email';
  if (String(m.name || '').startsWith('[TEST]')) return 'test_skipped';
  const { data: ls } = await db.from('listings').select('slug, name').eq('owner_member_id', id).eq('status', 'approved').limit(5);
  const first = String(m.name || '').trim().split(/\s+/)[0];
  const pages = (ls || []).map((l) => `<a href="https://vegansexplore.com/directory/${escH(l.slug)}" style="color:#2D5C27">${escH(l.name)}</a>`).join(', ');
  const body = `<p>${first ? 'Hi ' + escH(first) + ',' : 'Hi there,'}</p>` +
    `<p>Our team checked your answers, and your <b>100% Vegan</b> badge is now on. It tells people everything you sell is Vegan, and that you run your business for the animals.</p>` +
    (pages ? `<p>It shows on ${pages} in the Vegans Explore Directory.</p>` : `<p>Once you claim your page in our Directory, the badge shows on it: <a href="https://vegansexplore.com/claim" style="color:#2D5C27">find your business</a>.</p>`) +
    `<p>If anything changes in what you sell, update your answers any time so your badge stays right.</p><p>Thank you for what you do.<br>Vegans Explore team</p>`;
  const html = `<div style="font-family:Montserrat,Arial,sans-serif;max-width:560px;font-size:15px;line-height:1.65;color:#1a1a1a"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;border-collapse:collapse"><tr><td width="25%" style="background:#2D5C27;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="13%" style="background:#F69820;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="12%" style="background:#FF9EC4;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="13%" style="background:#FFEBD1;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="12%" style="background:#22C55E;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="13%" style="background:#E8F5E9;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="12%" style="background:#3A9B3E;height:6px;line-height:6px;font-size:0">&nbsp;</td></tr></table><p style="margin:0 0 18px"><img src="https://vegansexplore.com/public/logo-ve-landscape-v2.png" alt="Vegans Explore" width="150" style="display:block;border:0"></p>${body}` +
    `<p style="margin-top:28px;font-size:12px;line-height:1.5;color:#777">You are getting this because you asked for a business badge on Vegans Explore. <a href="{{unsubscribe_url}}" style="color:#777">Stop these emails</a>. {{postal_address}}.</p></div>`;
  try {
    const { data: t } = await db.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle();
    const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t?.value}` },
      body: JSON.stringify({ brand: 'vegans-explore', campaign_ref: `ve-badge-approved-${id}`, list_ref: 've-business-badges', subject: 'Your 100% Vegan badge is on', html, recipients: [{ email: m.email, name: m.name || undefined }] }) });
    const j = await r.json().catch(() => ({}));
    return j?.results?.[0]?.result || j?.error || `email-send ${r.status}`;
  } catch (e) { return String(e); }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'post_only' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || String(b.token || '');
  const me = tok ? await verifyToken(tok) : null;
  if (!me) return json({ error: 'not_authenticated' }, 401);
  const { data: mm } = await db.from('members').select('is_superadmin, standing').eq('id', me).maybeSingle();
  if (!mm?.is_superadmin || (mm.standing && mm.standing !== 'good')) return json({ error: 'no_access' }, 403);
  const action = String(b.action || '');

  if (action === 'list') {
    const { data: rows, error } = await db.from('ve_business_badges').select('member_id, claimed, shown, status, answers, approved_at, team_note, claimed_at, updated_at').order('claimed_at', { ascending: true }).limit(1000);
    if (error) return json({ error: 'load_failed' }, 500);
    const who = await people((rows || []).map((r) => r.member_id));
    const counts: Record<string, number> = { checking: 0, follow_up: 0, shown: 0, all: (rows || []).length };
    for (const r of rows || []) counts[r.status] = (counts[r.status] || 0) + 1;
    const st = STATUSES.includes(String(b.status)) ? String(b.status) : null;
    return json({ ok: true, counts, rows: (rows || []).filter((r) => !st || r.status === st).map((r) => ({ ...r, member: who[r.member_id] || null })) });
  }

  if (action === 'get') {
    const id = String(b.member_id || '');
    if (!UUID.test(id)) return json({ error: 'bad_id' }, 400);
    const { data: row } = await db.from('ve_business_badges').select('*').eq('member_id', id).maybeSingle();
    if (!row) return json({ error: 'not_found' }, 404);
    const [who, ev, qs] = await Promise.all([
      people([id]),
      db.from('ve_business_badge_events').select('kind, claimed, shown, status, note, by_member, at').eq('member_id', id).order('at', { ascending: false }).limit(50),
      db.from('ve_shared_questions').select('key, prompt, options').in('key', ['biz_all_plant', 'biz_word', 'biz_beyond', 'biz_help']),
    ]);
    const byIds = [...new Set((ev.data || []).map((e) => e.by_member).filter(Boolean))] as string[];
    const { data: by } = byIds.length ? await db.from('members').select('id, name').in('id', byIds) : { data: [] as any[] };
    const nm = Object.fromEntries((by || []).map((m) => [m.id, m.name]));
    const order = ['biz_all_plant', 'biz_word', 'biz_beyond', 'biz_help'];
    const answers = (qs.data || []).sort((x, y) => order.indexOf(x.key) - order.indexOf(y.key)).filter((q) => row.answers?.[q.key] != null)
      .map((q) => ({ q: q.prompt, a: (q.options || []).find((o: any) => o.v === row.answers[q.key])?.label ?? row.answers[q.key] }));
    return json({ ok: true, badge: row, member: who[id] || null, answers, history: (ev.data || []).map((e) => ({ ...e, by_name: e.by_member ? nm[e.by_member] || null : null })) });
  }

  if (action === 'decide') {
    const id = String(b.member_id || '');
    if (!UUID.test(id)) return json({ error: 'bad_id' }, 400);
    const { data, error } = await db.rpc('ve_business_badge_decide', { p_member: id, p_admin: me, p_decision: String(b.decision || ''), p_note: clean(b.note, 1000) });
    if (error) return json({ error: 'decide_failed' }, 500);
    if (data?.error) return json(data, data.error === 'not_found' ? 404 : data.error === 'forbidden' ? 403 : 400);
    if (String(b.decision) === 'approve') data.email = await approvedEmail(id);
    return json(data);
  }

  return json({ error: 'unknown_action' }, 400);
});
