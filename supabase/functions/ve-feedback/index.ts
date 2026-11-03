// ve-feedback: the site-wide Feedback button (Sean, 2026-11-03). POST { page_url, page_label, kind, message, email?, name?, visitor?, signed_in?, viewport? }.
// Public, verify_jwt off. Saved in ve_feedback (RLS on) and emailed to the team at once. 5 a visitor an hour, 15 a day.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const TEAM = 'contact@lesaruss.com';
const FROM = 'VEGANS EXPLORE <hello@vegansexplore.com>';
const KINDS: Record<string, string> = { broken: 'Something is broken', wrong: 'Something is wrong or out of date', confusing: 'Something is confusing', missing: 'Something is missing', idea: 'An idea', praise: 'Something is working well', other: 'Something else' };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STATUSES = ['new', 'working', 'fixed', 'set_aside', 'spam'];
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'post_only' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  if (['admin_list', 'admin_get', 'admin_set'].includes(String(b.action || ''))) {
    const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const mid = tok ? await verifyToken(tok) : null;
    if (!mid) return json({ error: 'not_authenticated' }, 401);
    const { data: m } = await db.from('members').select('is_superadmin').eq('id', mid).maybeSingle();
    if (!m?.is_superadmin) return json({ error: 'no_access' }, 403);
    if (b.action === 'admin_list') {
      const { data, error } = await db.from('ve_feedback').select('id, created_at, kind, page_url, page_label, message, email, name, status').order('created_at', { ascending: false }).limit(1000);
      if (error) return json({ error: 'load_failed' }, 500);
      return json({ ok: true, rows: data, kinds: KINDS });
    }
    if (!/^[0-9a-f-]{36}$/i.test(String(b.id || ''))) return json({ error: 'bad_id' }, 400);
    if (b.action === 'admin_get') {
      const { data } = await db.from('ve_feedback').select('*').eq('id', b.id).maybeSingle();
      return data ? json({ ok: true, row: data }) : json({ error: 'not_found' }, 404);
    }
    const patch: Record<string, unknown> = {};
    if (b.status !== undefined) { if (!STATUSES.includes(b.status)) return json({ error: 'bad_status' }, 400); patch.status = b.status; }
    if (b.note !== undefined) patch.note = clean(b.note, 2000) || null;
    if (!Object.keys(patch).length) return json({ error: 'nothing_to_save' }, 400);
    const { data, error } = await db.from('ve_feedback').update(patch).eq('id', b.id).select('*').maybeSingle();
    return error || !data ? json({ error: 'save_failed' }, 500) : json({ ok: true, row: data });
  }
  const kind = KINDS[b.kind] ? String(b.kind) : 'other';
  const message = clean(b.message, 3000);
  const page = clean(b.page_url, 500);
  const email = clean(b.email, 200).toLowerCase();
  if (message.length < 5) return json({ error: 'message_needed' }, 400);
  if (!/^https?:\/\//i.test(page)) return json({ error: 'page_needed' }, 400);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'bad_email' }, 400);
  const visitor = clean(b.visitor, 40) || null;
  if (visitor) {
    const since = new Date(Date.now() - 3600e3).toISOString(), day = new Date(Date.now() - 864e5).toISOString();
    const [h, d] = await Promise.all([
      db.from('ve_feedback').select('id', { count: 'exact', head: true }).eq('visitor', visitor).gte('created_at', since),
      db.from('ve_feedback').select('id', { count: 'exact', head: true }).eq('visitor', visitor).gte('created_at', day),
    ]);
    if ((h.count ?? 0) >= 5 || (d.count ?? 0) >= 15) return json({ error: 'daily_limit' }, 429);
  }
  const row = { kind, page_url: page, page_label: clean(b.page_label, 120) || null, message, email: email || null, name: clean(b.name, 120) || null, visitor,
    member_signed_in: b.signed_in === true, user_agent: clean(req.headers.get('user-agent'), 300) || null, viewport: clean(b.viewport, 20) || null };
  const ins = await db.from('ve_feedback').insert(row).select('id').single();
  if (ins.error) return json({ error: 'save_failed' }, 500);
  if (RESEND_KEY) {
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#14261a"><h2 style="margin:0 0 8px">${esc(KINDS[kind])}</h2>` +
      `<p style="margin:0 0 4px"><b>Page:</b> <a href="${esc(page)}">${esc(row.page_label || page)}</a><br><span style="color:#666;font-size:13px">${esc(page)}</span></p>` +
      `<p style="white-space:pre-wrap;margin:12px 0;padding:12px;background:#f3f7f4;border-radius:6px">${esc(message)}</p>` +
      `<p style="margin:0;color:#444;font-size:13px">From: ${esc(row.name || 'someone')} ${row.email ? '&lt;' + esc(row.email) + '&gt;' : '(no email left)'} · ${row.member_signed_in ? 'signed in' : 'not signed in'} · ${esc(row.viewport || '')}<br>${esc(row.user_agent || '')}</p></div>`;
    try {
      const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, reply_to: row.email || TEAM, to: [TEAM], subject: `[Feedback] ${KINDS[kind]}: ${(row.page_label || new URL(page).pathname).slice(0, 60)}`, html }) });
      if (!r.ok) console.error('Resend error:', await r.text());
    } catch (e) { console.error('Resend failed:', e); }
  }
  return json({ ok: true, id: ins.data.id });
});
