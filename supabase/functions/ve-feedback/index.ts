// ve-feedback: the site-wide Feedback button (Sean, 2026-11-03). POST { page_url, page_label, kind, message, email?, name?, visitor?, signed_in?, viewport? }.
// Public, verify_jwt off. Saved in ve_feedback (RLS on) and emailed to the team at once, or, while ve_site_settings feedback.digest is on,
// gathered into one daily digest ({action:'digest'}, cron with x-cron-secret; Sean 2026-11-05). 5 a visitor an hour, 15 a day.
// Super admins: admin_settings {digest?: bool} reads or sets the switch.
// Kind missing on a Directory, search or chapter-Directory page also makes a ve_listing_requests row (source feedback, feedback_id).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const TEAM = 'contact@lesaruss.com';
const FROM = 'VEGANS EXPLORE <hello@vegansexplore.com>';
const KINDS: Record<string, string> = { suggestion: 'A change to this page', broken: 'Something is broken', wrong: 'Something is wrong or out of date', confusing: 'Something is confusing', missing: 'Something is missing', idea: 'An idea', praise: 'Something is working well', other: 'Something else' };
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
async function secret(key: string) {
  const env = Deno.env.get(key); if (env) return env;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value && data.value !== 'pending' ? String(data.value) : null;
}
async function settings(): Promise<{ digest: boolean }> {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'feedback').maybeSingle();
  return { digest: (data?.value as any)?.digest === true };
}
async function sendMail(subject: string, html: string, replyTo: string) {
  if (!RESEND_KEY) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, reply_to: replyTo, to: [TEAM], subject, html }) });
    if (!r.ok) { console.error('Resend error:', await r.text()); return false; }
    return true;
  } catch (e) { console.error('Resend failed:', e); return false; }
}
const pathOf = (u: string) => { try { return new URL(u).pathname; } catch { return u; } };
async function digest() {
  const s = await settings();
  if (!s.digest) return { ok: true, sent: false, note: 'digest is off; every item is emailed when it comes in' };
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: rows } = await db.from('ve_feedback').select('id, created_at, kind, page_url, page_label, message, email, name').eq('status', 'new').gte('created_at', since).order('created_at');
  if (!rows?.length) return { ok: true, sent: false, n: 0 };
  const items = rows.map((r: any) => `<div style="margin:0 0 14px;padding:12px;background:#f3f7f4;border-radius:6px"><b>${esc(KINDS[r.kind] || r.kind)}</b> on <a href="${esc(r.page_url)}">${esc(r.page_label || pathOf(r.page_url))}</a>` +
    `<p style="white-space:pre-wrap;margin:6px 0">${esc(r.message)}</p><span style="color:#555;font-size:13px">${esc(r.name || 'someone')}${r.email ? ' &lt;' + esc(r.email) + '&gt;' : ''} · <a href="https://vegansexplore.com/admin/depot/feedback#item/${r.id}">Open it</a></span></div>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#14261a"><h2 style="margin:0 0 4px">${rows.length} new in the last day</h2>` +
    `<p style="margin:0 0 14px;color:#555">Suggestions and feedback from the site. They are also in Depot &gt; Feedback and your Inbox.</p>${items}</div>`;
  const sent = await sendMail(`[Feedback] Daily digest: ${rows.length} new`, html, TEAM);
  return { ok: true, sent, n: rows.length };
}
// Pages where "Something is missing" means a place we do not list: the Directory, a listing, search, a chapter hub's Directory.
function isDirectoryPage(u: string) {
  try {
    const x = new URL(u); const p = x.pathname;
    return /^\/(directory|search|dashboard\/directory)(\/|$)/.test(p) || (/^\/communities\/[^/]+/.test(p) && (x.searchParams.get('tab') === 'directory' || x.searchParams.has('dir')));
  } catch { return false; }
}
// One ve_listing_requests row (source feedback). The message's first link or @handle is the link; with none, its words stand in for the name.
async function toListingQueue(fid: string, row: any, message: string, page: string) {
  const { data: st } = await db.from('ve_site_settings').select('value').eq('key', 'listing_requests').maybeSingle();
  const perDay = +((st?.value as any)?.per_day) || 100;
  const day = new Date(Date.now() - 864e5).toISOString();
  const { count } = await db.from('ve_listing_requests').select('id', { count: 'exact', head: true }).gte('created_at', day);
  if ((count ?? 0) >= perDay) return false;
  const url = (message.match(/https?:\/\/[^\s<>"')]+/i) || [])[0] || (message.match(/(^|\s)(@[A-Za-z0-9._]{2,30})/) || [])[2] || '';
  const one = message.replace(/\s+/g, ' ').trim();
  const { error } = await db.from('ve_listing_requests').insert({
    source: 'feedback', feedback_id: fid, contact_email: row.email, contact_name: row.name, visitor: row.visitor,
    name: url ? null : one.slice(0, 120), link: url ? url.slice(0, 600) : null, note: one.slice(0, 1500), page_url: page,
  });
  if (error) { console.error('listing request insert:', error.message); return false; }
  await db.from('ve_feedback').update({ note: 'Also sent to the listing-request queue (Sean\'s For you once Logan drafts it).' }).eq('id', fid);
  return true;
}
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'post_only' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  if (b.action === 'digest') {
    const cs = req.headers.get('x-cron-secret');
    if (!cs || cs !== (await secret('CRON_SECRET'))) return json({ error: 'forbidden' }, 403);
    return json(await digest());
  }
  if (['admin_list', 'admin_get', 'admin_set', 'admin_settings'].includes(String(b.action || ''))) {
    const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const mid = tok ? await verifyToken(tok) : null;
    if (!mid) return json({ error: 'not_authenticated' }, 401);
    const { data: m } = await db.from('members').select('is_superadmin').eq('id', mid).maybeSingle();
    if (!m?.is_superadmin) return json({ error: 'no_access' }, 403);
    if (b.action === 'admin_settings') {
      if (typeof b.digest === 'boolean') {
        const { data: cur } = await db.from('ve_site_settings').select('value').eq('key', 'feedback').maybeSingle();
        const value = { ...((cur?.value as any) || {}), digest: b.digest };
        const { error } = await db.from('ve_site_settings').upsert({ key: 'feedback', value }, { onConflict: 'key' });
        if (error) return json({ error: 'save_failed' }, 500);
      }
      return json({ ok: true, settings: await settings() });
    }
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
  // "Something is missing" on a Directory, search or chapter page also goes to the listing-request queue (ve-community-directory, 2026-11-08):
  // the worker reads it like any request and Sean decides on For you. Never blocks the feedback itself.
  let queued = false;
  if (kind === 'missing' && isDirectoryPage(page)) { try { queued = await toListingQueue(ins.data.id, row, message, page); } catch (e) { console.error('queue failed:', e); } }
  if (!(await settings()).digest) {
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#14261a"><h2 style="margin:0 0 8px">${esc(KINDS[kind])}</h2>` +
      `<p style="margin:0 0 4px"><b>Page:</b> <a href="${esc(page)}">${esc(row.page_label || page)}</a><br><span style="color:#666;font-size:13px">${esc(page)}</span></p>` +
      `<p style="white-space:pre-wrap;margin:12px 0;padding:12px;background:#f3f7f4;border-radius:6px">${esc(message)}</p>` +
      `<p style="margin:0;color:#444;font-size:13px">From: ${esc(row.name || 'someone')} ${row.email ? '&lt;' + esc(row.email) + '&gt;' : '(no email left)'} · ${row.member_signed_in ? 'signed in' : 'not signed in'} · ${esc(row.viewport || '')}<br>${esc(row.user_agent || '')}</p>` +
      `<p style="margin:12px 0 0"><a href="https://vegansexplore.com/admin/depot/feedback#item/${ins.data.id}">Open it in the Depot</a></p></div>`;
    await sendMail(`[Feedback] ${KINDS[kind]}: ${(row.page_label || pathOf(page)).slice(0, 60)}`, html, row.email || TEAM);
  }
  return json({ ok: true, id: ins.data.id, listing_request: queued });
});
