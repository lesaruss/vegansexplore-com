// ve-nominations: Nominate Someone (Sean, 2026-11-09, approved; playbook ve-nominate-someone; migration 20261109_nominations.sql;
// proposal docs/proposals/nominate-someone.md). Copied from ve-comments (token check, signed uploads, the upload key, the team gate).
// Anyone nominates someone from their community: their name, their email so we can reach them, what they do (pick any), and why, by
// voice (recorded in the browser, private bucket community-comments under nominations/) or in writing. The team reviews each one in
// Depot > Nominations. Approving marks it ready to invite; the invitation and Kai's interview come in step 2.
//
// verify_jwt off. The VE member token is checked here when sent; ops (Bearer LESARUSS_ADMIN_TOKEN) may act as a member with as_member.
// Anyone:
//   POST { action: 'chapters' }                       -> the chapters for the area picker (the Explorer survey's x_chapter options)
//   POST { action: 'upload', type, size }             -> { path, url, key }  a signed upload for one recording (audio, 25 MB)
//   POST { action: 'submit', nominee_name, nominee_email, community_slug?, community_other?, roles[], self_nominated, written?,
//          audio: {path, key, seconds}?, nominator_name, nominator_email?, credit_ok, release: true, adult: true, source? }
// Super admins (or ops):
//   POST { action: 'list', status? }    POST { action: 'get', id } (signed audio link, an hour)
//   POST { action: 'set', id, status: new|approved|declined, team_note? }
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const TEAM_EMAIL = 'contact@lesaruss.com';
const FROM = 'VEGANS EXPLORE <hello@vegansexplore.com>';
const BUCKET = 'community-comments';
const PREFIX = 'nominations';
const DAY_MS = 24 * 60 * 60 * 1000;
const VOICE_MAX = 120;
const ROLES: Record<string, string> = { business_owner: 'Business owner', content_creator: 'Content creator', nonprofit: 'Works for a nonprofit', activist: 'Activist' };
const SOURCES = ['hub', 'pulse', 'show', 'listing', 'interview', 'direct'];

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
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode('ve-nomination:' + path)));
  return Array.from(sig.slice(0, 16)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sendOne(to: string, subject: string, html: string, replyTo?: string): Promise<string | null> {
  if (!RESEND_KEY) return null;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, reply_to: replyTo || TEAM_EMAIL, to: [to], subject, html }),
    });
    const d = res.ok ? await res.json() : null;
    if (!res.ok) console.error('Resend error:', await res.text());
    return d?.id ?? null;
  } catch (e) { console.error('Resend failed:', e); return null; }
}
const wrap = (inner: string) => `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">${inner}</div>`;
const btn = (href: string, label: string) => `<p style="margin:0 0 16px"><a href="${href}" style="display:inline-block;background:#2d7d31;color:#fff;font-weight:800;text-decoration:none;padding:12px 18px;border-radius:6px">${esc(label)}</a></p>`;

// The chapters are the Explorer survey's own chapter question (x_chapter, shared key 'chapter'), so a nomination, the nominee's interview
// and the Explorer survey all use one list. 'other' is left out: the form has its own Somewhere else field.
async function chapters(): Promise<{ slug: string; name: string }[]> {
  const { data } = await db.from('ve_survey_questions').select('options').eq('survey_slug', 'explorer').eq('id', 'x_chapter').maybeSingle();
  return ((data?.options as any[]) || []).filter((o: any) => o && o.v && o.v !== 'other').map((o: any) => ({ slug: String(o.v), name: String(o.label) }));
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

  // ---------- anyone ----------
  if (action === 'chapters') return json({ ok: true, chapters: await chapters(), me: me ? { name: me.name, email: me.email } : null });

  if (action === 'upload') {
    const type = String(body.type || ''), size = Number(body.size) || 0;
    if (!/^audio\//.test(type) || size <= 0 || size > 25 * 1024 * 1024) return json({ error: 'bad_file', message: 'A recording up to 25 MB, please.' }, 400);
    const ext = /mp4|m4a|aac/.test(type) ? 'm4a' : /mpeg/.test(type) ? 'mp3' : /ogg/.test(type) ? 'ogg' : /wav/.test(type) ? 'wav' : 'webm';
    const path = `${PREFIX}/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) return json({ error: 'upload_failed', message: 'We could not start the upload. Try again in a minute.' }, 500);
    return json({ ok: true, path, url: data.signedUrl, key: await uploadKey(path) });
  }

  if (action === 'submit') {
    if (me?.standing && me.standing !== 'good') return json({ error: 'account_not_in_good_standing' }, 403);
    const nominee_name = clean(body.nominee_name, 120), nominee_email = clean(body.nominee_email, 200).toLowerCase();
    const nominator_name = clean(body.nominator_name, 120) || clean(me?.name, 120);
    const nominator_email = (clean(body.nominator_email, 200) || clean(me?.email, 200)).toLowerCase();
    const written = clean(body.written, 4000);
    const roles: string[] = Array.isArray(body.roles) ? [...new Set<string>(body.roles.map((r: unknown) => String(r)).filter((r: string) => r in ROLES))] : [];
    const self = body.self_nominated === true;
    if (!nominee_name) return json({ error: 'nominee_name', message: 'Their name, please.' }, 400);
    if (!isEmail(nominee_email)) return json({ error: 'nominee_email', message: 'Their email, so we can reach them.' }, 400);
    if (!nominator_name) return json({ error: 'nominator_name', message: 'Your name, please.' }, 400);
    if (nominator_email && !isEmail(nominator_email)) return json({ error: 'nominator_email', message: 'Your email does not look right.' }, 400);
    if (body.release !== true) return json({ error: 'release', message: 'Tick the box to let us use your nomination.' }, 400);
    if (body.adult !== true) return json({ error: 'adult', message: 'Tick the box to say you are 18 or over.' }, 400);
    let community_slug: string | null = clean(body.community_slug, 80) || null;
    if (community_slug && !(await chapters()).some((c) => c.slug === community_slug)) community_slug = null;
    const community_other = community_slug ? null : (clean(body.community_other, 120) || null);
    let audio_path: string | null = null, audio_seconds: number | null = null;
    if (body.audio) {
      const path = String(body.audio.path || '');
      if (!path.startsWith(PREFIX + '/') || String(body.audio.key || '') !== (await uploadKey(path))) return json({ error: 'bad_audio' }, 400);
      const { data: f } = await db.storage.from(BUCKET).list(PREFIX, { search: path.split('/')[1] });
      if (!f || !f.length) return json({ error: 'missing_audio', message: 'Your recording did not finish uploading. Try sending again.' }, 400);
      const secs = Math.round(Number(body.audio.seconds) || 0);
      if (secs > VOICE_MAX + 10) return json({ error: 'too_long', message: 'Recordings can be up to 2:00. Record a shorter one.' }, 400);
      audio_path = path; audio_seconds = Math.max(0, secs);
    }
    if (!written && !audio_path) return json({ error: 'empty', message: 'Record why, or write it out.' }, 400);
    const since = new Date(Date.now() - DAY_MS).toISOString();
    if (nominator_email) {
      const { count } = await db.from('ve_nominations').select('id', { count: 'exact', head: true }).ilike('nominator_email', nominator_email).gte('created_at', since);
      if ((count ?? 0) >= 5) return json({ error: 'daily_limit', message: 'That is five nominations today. Thank you! Come back tomorrow for more.' }, 429);
    }
    const { count: total } = await db.from('ve_nominations').select('id', { count: 'exact', head: true }).gte('created_at', since);
    if ((total ?? 0) >= 300) return json({ error: 'busy', message: 'We have a lot of nominations today. Try again tomorrow.' }, 429);
    const source = SOURCES.includes(String(body.source)) ? String(body.source) : 'direct';
    const { data: row, error } = await db.from('ve_nominations').insert({
      nominee_name, nominee_email, community_slug, community_other, roles, self_nominated: self, written: written || null, audio_path, audio_seconds,
      nominator_member_id: me?.id || null, nominator_name, nominator_email: nominator_email || null, credit_ok: body.credit_ok !== false,
      release_at: nowIso(), adult: true, source,
    }).select('id').single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    if (!nominee_name.startsWith('[TEST]') && !nominator_name.startsWith('[TEST]')) {
      const area = community_slug ? ((await chapters()).find((c) => c.slug === community_slug)?.name || community_slug) : (community_other || 'somewhere else');
      await sendOne(TEAM_EMAIL, `[Nomination] ${nominator_name} nominated ${nominee_name}`, wrap(
        `<p><b>${esc(self ? nominee_name + ' nominated themselves' : nominator_name + ' nominated ' + nominee_name)}</b> in ${esc(area)}` +
        `${roles.length ? ` (${esc(roles.map((r) => ROLES[r]).join(', '))})` : ''}${audio_path ? `, with a ${audio_seconds}-second recording` : ''}.</p>` +
        (written ? `<blockquote style="margin:0 0 16px;padding:8px 14px;border-left:3px solid #2d7d31;color:#333">${esc(written).replace(/\n/g, '<br>')}</blockquote>` : '') +
        btn(`${SITE}/admin/depot/nominations#n/${row.id}`, 'Review it in the Depot')), nominator_email || undefined);
    }
    return json({ ok: true, id: row.id });
  }

  // ---------- the team ----------
  if (!admin) return json({ error: 'forbidden' }, 403);

  if (action === 'list') {
    let q = db.from('ve_nominations').select('id, nominee_name, nominee_email, community_slug, community_other, roles, self_nominated, written, audio_seconds, nominator_name, credit_ok, source, status, created_at, reviewed_at')
      .order('created_at', { ascending: false }).limit(500);
    if (body.status) q = q.eq('status', clean(body.status, 20));
    const { data, error } = await q;
    if (error) return json({ error: 'load_failed', message: error.message }, 500);
    const names: Record<string, string> = {}; (await chapters()).forEach((c) => { names[c.slug] = c.name; });
    return json({ ok: true, nominations: (data || []).map((n: any) => ({ ...n, area: n.community_slug ? (names[n.community_slug] || n.community_slug) : (n.community_other || 'Somewhere else') })), roles: ROLES });
  }

  if (action === 'get') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { data: n } = await db.from('ve_nominations').select('*').eq('id', body.id).maybeSingle();
    if (!n) return json({ error: 'not_found' }, 404);
    let audio_url = null;
    if (n.audio_path) { const { data: u } = await db.storage.from(BUCKET).createSignedUrl(n.audio_path, 3600); audio_url = u?.signedUrl || null; }
    const names: Record<string, string> = {}; (await chapters()).forEach((c) => { names[c.slug] = c.name; });
    const { count: others } = await db.from('ve_nominations').select('id', { count: 'exact', head: true }).ilike('nominee_email', n.nominee_email).neq('id', n.id);
    return json({ ok: true, nomination: { ...n, audio_url, area: n.community_slug ? (names[n.community_slug] || n.community_slug) : (n.community_other || 'Somewhere else'), other_nominations: others || 0 }, roles: ROLES });
  }

  if (action === 'set') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const up: Record<string, unknown> = { reviewed_at: nowIso(), reviewed_by: me?.id || null, updated_at: nowIso() };
    if (body.status !== undefined) { if (!['new', 'approved', 'declined'].includes(body.status)) return json({ error: 'bad_status' }, 400); up.status = body.status; }
    if (body.team_note !== undefined) up.team_note = clean(body.team_note, 2000) || null;
    const { error } = await db.from('ve_nominations').update(up).eq('id', body.id);
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: 'unknown_action' }, 400);
});
