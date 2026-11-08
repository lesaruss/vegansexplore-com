// ve-comments: comment requests, by voice or in writing (2026-11-08, Sean; playbook ve-community-voices; migration 20261108_comment_requests.sql).
// One ask per request, its own page /comment/<code> (comment.html). They answer by recording their voice in the browser (or uploading a
// recording) or by writing it, tick the release, and say how to credit them. Voice answers can be played in our articles and on our shows.
// A request with multi true takes answers from anyone with the link (comments from the community on an item); otherwise one answer closes it.
//
// verify_jwt off. The VE member token is checked here when sent; ops (Bearer LESARUSS_ADMIN_TOKEN) may act as a member with as_member.
// Anyone with the link:
//   POST { action: 'get', code }                    -> the request's public fields and its listing (counts an open, not for the team)
//   POST { action: 'upload', code, type, size }     -> { path, url, key }  a signed upload for one recording (audio, 25 MB)
//   POST { action: 'submit', code, name, role?, email?, written?, audio: {path, key, seconds}?, release: true, adult: true, credit_ok }
// Super admins (or ops):
//   POST { action: 'list', status? }   POST { action: 'create', ...fields }   POST { action: 'update', id, ...fields }
//   POST { action: 'get_admin', id }   (the request, every response, signed audio links an hour long)
//   POST { action: 'response_set', id, status: new|approved|used|declined, used_in?, team_note? }
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const TEAM_EMAIL = 'contact@lesaruss.com';
const FROM = 'VEGANS EXPLORE <hello@vegansexplore.com>';
const BUCKET = 'community-comments';
const DAY_MS = 24 * 60 * 60 * 1000;
const KINDS = ['business', 'person', 'organization', 'community'];
const PURPOSES = ['pulse', 'spotlight', 'podcast', 'article', 'other'];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const firstName = (n: string) => String(n || '').trim().split(/\s+/)[0] || 'there';
const nowIso = () => new Date().toISOString();

function b64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const secretKey = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secretKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function secret(key: string): Promise<string | null> {
  const env = Deno.env.get(key);
  if (env) return env;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value && data.value !== 'pending' ? String(data.value) : null;
}
async function isOps(req: Request) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  return !!admin && token.length === admin.length && token === admin;
}
async function memberId(req: Request, body: any, ops: boolean): Promise<string | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  if (ops) return isId(body.as_member) ? body.as_member : null;
  return await verifyToken(token);
}
// Ties an upload to its submit, so a path cannot be claimed by someone who did not upload it.
async function uploadKey(path: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(16, 48)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode('ve-comment:' + path)));
  return Array.from(sig.slice(0, 16)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function newCode() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const b = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(b).map((x) => abc[x % abc.length]).join('');
}

async function sendOne(to: string | string[], subject: string, html: string, replyTo?: string): Promise<string | null> {
  if (!RESEND_KEY) return null;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, reply_to: replyTo || TEAM_EMAIL, to: Array.isArray(to) ? to : [to], subject, html }),
    });
    const d = res.ok ? await res.json() : null;
    if (!res.ok) console.error('Resend error:', await res.text());
    return d?.id ?? null;
  } catch (e) { console.error('Resend failed:', e); return null; }
}
const FOOT = `<p style="font-size:12px;color:#777;margin:18px 0 0">Vegans Explore, a LESARUSS brand. 300 SW 1st Ave, Suite 155, Fort Lauderdale, FL 33301.</p>`;
const wrap = (inner: string) => `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">${inner}${FOOT}</div>`;
const btn = (href: string, label: string) => `<p style="margin:0 0 16px"><a href="${href}" style="display:inline-block;background:#2d7d31;color:#fff;font-weight:800;text-decoration:none;padding:12px 18px;border-radius:6px">${esc(label)}</a></p>`;

const PUBLIC_FIELDS = 'id, code, kind, purpose, listing_id, to_name, title, prompt, context, allow_voice, allow_written, voice_max_seconds, multi, closes_at, status';
async function listingOf(id: string | null) {
  if (!id) return null;
  const { data } = await db.from('listings').select('id, slug, name, logo_url, category, address_city, address_state, owner_member_id, status').eq('id', id).maybeSingle();
  if (!data || data.status !== 'approved') return null;
  return { slug: data.slug, name: data.name, logo_url: data.logo_url, category: data.category,
    city: [data.address_city, data.address_state].filter(Boolean).join(', '), claimed: !!data.owner_member_id };
}
async function byCode(code: string) {
  if (!/^[a-z0-9-]{4,40}$/.test(code)) return null;
  const { data } = await db.from('ve_comment_requests').select(PUBLIC_FIELDS).eq('code', code).maybeSingle();
  return data;
}
const isOpen = (r: any) => r.status === 'open' && (!r.closes_at || new Date(r.closes_at).getTime() > Date.now());

function fields(b: any) {
  const out: Record<string, unknown> = {};
  if (b.kind !== undefined) { if (!KINDS.includes(b.kind)) throw new Error('bad_kind'); out.kind = b.kind; }
  if (b.purpose !== undefined) { if (!PURPOSES.includes(b.purpose)) throw new Error('bad_purpose'); out.purpose = b.purpose; }
  if (b.listing_id !== undefined) { if (b.listing_id !== null && !isId(b.listing_id)) throw new Error('bad_listing'); out.listing_id = b.listing_id; }
  for (const [k, n] of [['to_name', 160], ['to_email', 200], ['title', 200], ['prompt', 1200], ['context', 2000], ['campaign', 80], ['note', 2000], ['person_key', 200]] as [string, number][]) {
    if (b[k] !== undefined) out[k] = clean(b[k], n) || null;
  }
  if (out.to_email && !isEmail(String(out.to_email))) throw new Error('bad_email');
  for (const k of ['allow_voice', 'allow_written', 'multi']) if (b[k] !== undefined) out[k] = !!b[k];
  if (b.voice_max_seconds !== undefined) out.voice_max_seconds = Math.max(15, Math.min(600, Math.round(Number(b.voice_max_seconds) || 120)));
  if (b.closes_at !== undefined) out.closes_at = b.closes_at ? new Date(b.closes_at).toISOString() : null;
  if (b.status !== undefined) { if (!['open', 'answered', 'closed'].includes(b.status)) throw new Error('bad_status'); out.status = b.status; }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const ops = await isOps(req);
  const mid = await memberId(req, body, ops);
  let me: any = null;
  if (mid) { const { data } = await db.from('members').select('id, email, name, is_superadmin, standing').eq('id', mid).maybeSingle(); me = data; }
  const admin = ops || !!me?.is_superadmin;

  // ---------- anyone with the link ----------
  if (action === 'get') {
    const r = await byCode(clean(body.code, 40).toLowerCase());
    if (!r) return json({ error: 'not_found', message: 'This link is not right. Ask whoever sent it for a new one.' }, 404);
    if (!admin && !body.preview) {
      await db.from('ve_comment_requests').update({ open_count: ((await db.from('ve_comment_requests').select('open_count').eq('id', r.id).single()).data?.open_count || 0) + 1,
        opened_at: nowIso() }).eq('id', r.id);
    }
    const { id: _id, listing_id, ...pub } = r as any;
    return json({ ok: true, request: { ...pub, open: isOpen(r), first_name: r.to_name ? firstName(r.to_name) : null }, listing: await listingOf(listing_id), signed_in: !!me });
  }

  if (action === 'upload') {
    const r = await byCode(clean(body.code, 40).toLowerCase());
    if (!r) return json({ error: 'not_found' }, 404);
    if (!isOpen(r)) return json({ error: 'closed', message: 'This request has closed. Thank you all the same.' }, 409);
    if (!r.allow_voice) return json({ error: 'no_voice' }, 400);
    const type = String(body.type || ''), size = Number(body.size) || 0;
    if (!/^audio\//.test(type) || size <= 0 || size > 25 * 1024 * 1024) return json({ error: 'bad_file', message: 'A recording up to 25 MB, please.' }, 400);
    const ext = /mp4|m4a|aac/.test(type) ? 'm4a' : /mpeg/.test(type) ? 'mp3' : /ogg/.test(type) ? 'ogg' : /wav/.test(type) ? 'wav' : 'webm';
    const path = `${r.code}/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) return json({ error: 'upload_failed', message: 'We could not start the upload. Try again in a minute.' }, 500);
    return json({ ok: true, path, url: data.signedUrl, key: await uploadKey(path) });
  }

  if (action === 'submit') {
    const r = await byCode(clean(body.code, 40).toLowerCase());
    if (!r) return json({ error: 'not_found' }, 404);
    if (!isOpen(r)) return json({ error: 'closed', message: 'This request has closed. Thank you all the same.' }, 409);
    if (me?.standing && me.standing !== 'good') return json({ error: 'account_not_in_good_standing' }, 403);
    const name = clean(body.name, 120), role = clean(body.role, 160), email = clean(body.email, 200).toLowerCase();
    const written = r.allow_written ? clean(body.written, 4000) : '';
    if (!name) return json({ error: 'name', message: 'Your name, please.' }, 400);
    if (email && !isEmail(email)) return json({ error: 'bad_email', message: 'That email does not look right.' }, 400);
    if (body.release !== true) return json({ error: 'release', message: 'Tick the box to let us use your comment.' }, 400);
    if (body.adult !== true) return json({ error: 'adult', message: 'Tick the box to say you are 18 or over.' }, 400);
    let audio_path: string | null = null, audio_seconds: number | null = null;
    if (body.audio && r.allow_voice) {
      const path = String(body.audio.path || '');
      if (!path.startsWith(r.code + '/') || String(body.audio.key || '') !== (await uploadKey(path))) return json({ error: 'bad_audio' }, 400);
      const { data: f } = await db.storage.from(BUCKET).list(r.code, { search: path.split('/')[1] });
      if (!f || !f.length) return json({ error: 'missing_audio', message: 'Your recording did not finish uploading. Try sending again.' }, 400);
      const secs = Math.round(Number(body.audio.seconds) || 0);
      if (secs > r.voice_max_seconds + 10) return json({ error: 'too_long', message: `Recordings can be up to ${Math.round(r.voice_max_seconds / 60 * 10) / 10} minutes.` }, 400);
      audio_path = path; audio_seconds = Math.max(0, secs);
    }
    if (!written && !audio_path) return json({ error: 'empty', message: 'Record your comment or write it out.' }, 400);
    const since = new Date(Date.now() - DAY_MS).toISOString();
    if (email) {
      const { count } = await db.from('ve_comment_responses').select('id', { count: 'exact', head: true }).eq('request_id', r.id).ilike('email', email).gte('created_at', since);
      if ((count ?? 0) >= 3) return json({ error: 'daily_limit', message: 'That is three today on this one. Email us at contact@lesaruss.com.' }, 429);
    }
    const { count: total } = await db.from('ve_comment_responses').select('id', { count: 'exact', head: true }).eq('request_id', r.id).gte('created_at', since);
    if ((total ?? 0) >= (r.multi ? 300 : 10)) return json({ error: 'busy', message: 'We have a lot of answers on this one today. Try tomorrow.' }, 429);
    const { data: row, error } = await db.from('ve_comment_responses').insert({
      request_id: r.id, member_id: me?.id || null, name, role: role || null, email: email || me?.email || null, written: written || null,
      audio_path, audio_seconds, credit_ok: body.credit_ok !== false, release_at: nowIso(), adult: true,
    }).select('id').single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    if (!r.multi) await db.from('ve_comment_requests').update({ status: 'answered', updated_at: nowIso() }).eq('id', r.id);
    if (!name.startsWith('[TEST]') && !r.title.startsWith('[TEST]')) {
      await sendOne(TEAM_EMAIL, `[Comment] ${name} on ${r.title}`, wrap(
        `<p><b>${esc(name)}</b>${role ? `, ${esc(role)}` : ''}${email ? ` (${esc(email)})` : ''} answered <b>${esc(r.title)}</b>` +
        `${audio_path ? ` with a ${audio_seconds}-second voice recording` : ''}${written && audio_path ? ' and in writing' : written ? ' in writing' : ''}. Release ticked${body.credit_ok === false ? '; they asked not to be named' : ''}.</p>` +
        (written ? `<blockquote style="margin:0 0 16px;padding:8px 14px;border-left:3px solid #2d7d31;color:#333">${esc(written).replace(/\n/g, '<br>')}</blockquote>` : '') +
        btn(`${SITE}/admin/depot/comments#r/${r.id}`, audio_path ? 'Listen in the Depot' : 'Open it in the Depot')), email || undefined);
      if (email) await sendOne(email, 'Thank you for your comment', wrap(
        `<p>Hi ${esc(firstName(name))},</p><p>Thank you. We have your comment on <b>${esc(r.title)}</b>. Our team reads and listens to every one, and if we use yours we will tell you where it ran.</p><p>The Vegans Explore team</p>`));
    }
    return json({ ok: true, id: row.id });
  }

  // ---------- the team ----------
  if (!admin) return json({ error: 'forbidden' }, 403);

  if (action === 'list') {
    let q = db.from('ve_comment_requests').select('id, code, kind, purpose, listing_id, to_name, to_email, title, status, multi, open_count, opened_at, campaign, created_at').order('created_at', { ascending: false }).limit(300);
    if (body.status) q = q.eq('status', clean(body.status, 20));
    const { data } = await q;
    const ids = (data || []).map((r: any) => r.id);
    const counts: Record<string, { n: number; fresh: number }> = {};
    if (ids.length) {
      const { data: rs } = await db.from('ve_comment_responses').select('request_id, status').in('request_id', ids);
      (rs || []).forEach((x: any) => { const c = counts[x.request_id] ||= { n: 0, fresh: 0 }; c.n++; if (x.status === 'new') c.fresh++; });
    }
    const lids = [...new Set((data || []).map((r: any) => r.listing_id).filter(Boolean))];
    const names: Record<string, any> = {};
    if (lids.length) { const { data: ls } = await db.from('listings').select('id, name, slug, logo_url').in('id', lids); (ls || []).forEach((l: any) => { names[l.id] = l; }); }
    return json({ ok: true, requests: (data || []).map((r: any) => ({ ...r, responses: counts[r.id]?.n || 0, new_responses: counts[r.id]?.fresh || 0, listing: names[r.listing_id] || null })) });
  }

  if (action === 'create' || action === 'update') {
    const slug = clean(body.listing_slug, 160).replace(/^.*\/directory\//, '').replace(/[?#].*$/, '');
    if (slug) {
      const { data: l } = await db.from('listings').select('id').eq('slug', slug).eq('status', 'approved').maybeSingle();
      if (!l) return json({ error: 'bad_listing', message: 'No live listing has that slug.' }, 400);
      body.listing_id = l.id;
    }
  }

  if (action === 'create') {
    let f: Record<string, unknown>;
    try { f = fields(body); } catch (e) { return json({ error: String((e as Error).message) }, 400); }
    if (!f.title || !f.prompt) return json({ error: 'missing', message: 'A title and the question, please.' }, 400);
    const code = /^[a-z0-9-]{4,40}$/.test(String(body.code || '')) ? String(body.code) : newCode();
    const { data, error } = await db.from('ve_comment_requests').insert({ ...f, code, created_by: me?.id || null }).select('id, code').single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, id: data.id, code: data.code, url: `${SITE}/comment/${data.code}` });
  }

  if (action === 'update') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    let f: Record<string, unknown>;
    try { f = fields(body); } catch (e) { return json({ error: String((e as Error).message) }, 400); }
    const { error } = await db.from('ve_comment_requests').update({ ...f, updated_at: nowIso() }).eq('id', body.id);
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true });
  }

  if (action === 'get_admin') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { data: r } = await db.from('ve_comment_requests').select('*').eq('id', body.id).maybeSingle();
    if (!r) return json({ error: 'not_found' }, 404);
    const { data: rs } = await db.from('ve_comment_responses').select('*').eq('request_id', r.id).order('created_at', { ascending: false });
    const responses = [];
    for (const x of rs || []) {
      let audio_url = null;
      if (x.audio_path) { const { data: u } = await db.storage.from(BUCKET).createSignedUrl(x.audio_path, 3600); audio_url = u?.signedUrl || null; }
      responses.push({ ...x, audio_url });
    }
    return json({ ok: true, request: r, listing: await listingOf(r.listing_id), responses, url: `${SITE}/comment/${r.code}` });
  }

  if (action === 'response_set') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const up: Record<string, unknown> = { reviewed_at: nowIso(), reviewed_by: me?.id || null };
    if (body.status !== undefined) { if (!['new', 'approved', 'used', 'declined'].includes(body.status)) return json({ error: 'bad_status' }, 400); up.status = body.status; }
    if (body.used_in !== undefined) up.used_in = clean(body.used_in, 500) || null;
    if (body.team_note !== undefined) up.team_note = clean(body.team_note, 2000) || null;
    const { error } = await db.from('ve_comment_responses').update(up).eq('id', body.id);
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: 'unknown_action' }, 400);
});
