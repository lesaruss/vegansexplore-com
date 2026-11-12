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
// The nominee (step 2, 2026-11-12), by their invite token t, or by vl (the click id ve-links adds to their tracked link):
//   POST { action: 'interview_get', t? | vl? }   -> who they are, who nominated them (and their recording), Kai's welcome, answers so far, t
//   POST { action: 'answer_upload', t, q, type, size }  POST { action: 'answer_save', t, q, written? | audio? | keep_audio?, extra? }
//   POST { action: 'interview_send', t, release: true, adult: true }
//   POST { action: 'interview_join', t } with their member token: ve_nomination_admit (member, Explorer, 250 points, Nominee badge)
//   POST { action: 'place_search', q }   Directory places by name, for the favorite-spots question
// Super admins (or ops):
//   POST { action: 'list', status? }    POST { action: 'get', id } (signed audio links, an hour; the answers; the interview link)
//   POST { action: 'set', id, status: new|approved|declined, team_note? }  approved = invite: the token, Kai's personal opening (made in
//        her voice from the approved template and checked word for word), and the nominee added to the Nominee invitations campaign.
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


// ---------- step 2: the invitation and the interview ----------
const CAMPAIGN = 'nominee-invitations';
const KAI_VOICE = 'cgSgspJ2msm6clMCkdW9';
const QKEYS = /^q[1-8](s[1-3])?$/;
const firstOf = (n: string) => String(n || '').replace(/^Sample:\s*/, '').trim().split(/\s+/)[0] || 'there';
const norm = (t: string) => String(t || '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
function newToken() { const b = crypto.getRandomValues(new Uint8Array(18)); return Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join(''); }
async function elMedia(payload: Record<string, unknown>) {
  const key = await secret('LESARUSS_ADMIN_TOKEN');
  const r = await fetch(`${SUPABASE_URL}/functions/v1/el-media`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify(payload) });
  return await r.json().catch(() => ({ error: `el-media ${r.status}` }));
}
// Kai's personal opening, the template Sean approved once (2026-11-09: "approve the welcome video once"), names filled in per nominee.
function welcomeLine(n: any) {
  const first = firstOf(n.nominee_name), nom = String(n.nominator_name || '').trim(), named = n.credit_ok !== false && !n.self_nominated && nom;
  let t = named
    ? `Congratulations, ${first}! I'm Kai, from Vegans Explore. You're getting this because your friend ${nom} nominated you, and ${nom} thinks you deserve your flowers. Here's why, in their own words.`
    : `Congratulations, ${first}! I'm Kai, from Vegans Explore. You're getting this because someone in your community nominated you, and they think you deserve your flowers. Here's why, in their own words.`;
  if (!n.audio_path && n.written) { const w = String(n.written).slice(0, 700); t += named ? ` ${nom} said: ${w}` : ` They said: ${w}`; }
  return t;
}
async function makeWelcome(n: any): Promise<{ path: string | null; text: string; checked: boolean | null; error?: string }> {
  const text = welcomeLine(n), path = `kai/nominee-welcome/${n.id}-v1.mp3`;
  const tts = await elMedia({ action: 'tts', voice_id: KAI_VOICE, text: text.replace(/\bVegan\b/g, 'Veegan'), path });
  if (!tts?.url) return { path: null, text, checked: null, error: String(tts?.error || 'tts failed') };
  const stt = await elMedia({ action: 'stt', source_bucket: 'vegan-media', source_path: `media/${path}` });
  const heard = Array.isArray(stt?.words) ? stt.words.map((w: any) => w[0]).join(' ') : '';
  return { path: `media/${path}`, text, checked: !!heard && norm(heard) === norm(text) };
}
// The approved invitation (Sean, 2026-11-12), filled in for one nominee. {link} becomes their own tracked link when it sends.
function inviteEmails(n: any, area: string | null) {
  const first = firstOf(n.nominee_name), nom = String(n.nominator_name || '').trim(), named = n.credit_ok !== false && !n.self_nominated && nom;
  const opener = named ? `Congratulations! ${nom} nominated you on Vegans Explore.` : 'Congratulations! Someone in your community nominated you on Vegans Explore.';
  const said = n.written ? `Here's what they said:\n"${String(n.written).trim()}"` : 'They said it in their own voice. You can hear it on your interview page.';
  const sign = '\n\nKai\nThe Creator Guide at Vegans Explore';
  return {
    '1': { subject: `${first}, you've been nominated`,
      body: `Hi ${first},\n\n${opener} They think you deserve your flowers for what you do in ${area || 'your community'}, and after hearing why, so do we.\n\n${said}\n\nWe'd love to hear your story. It's a short interview with me: eight questions, about ten minutes, and you can answer by voice or in writing. Your story could be featured on our podcast, on your city's page and in the Daily Pulse. Every nominee is considered, and we'll tell you either way.\n\nStart your interview: {link}${sign}` },
    '2': { subject: `${first}, your interview is still waiting`,
      body: `Hi ${first},\n\nYour interview is still waiting for you, ${first}. It takes about ten minutes.\n\nStart your interview: {link}${sign}` },
  };
}
async function byInvite(t: string) {
  if (!/^[0-9a-f]{36}$/.test(t)) return null;
  const { data } = await db.from('ve_nominations').select('*').eq('invite_token', t).maybeSingle();
  return data;
}
async function byClick(vl: string) {
  if (!isId(vl)) return null;
  const { data: c } = await db.from('ve_link_clicks').select('link_id').eq('id', vl).maybeSingle();
  if (!c?.link_id) return null;
  const { data: l } = await db.from('ve_links').select('code').eq('id', c.link_id).maybeSingle();
  if (!l?.code) return null;
  const { data: m } = await db.from('ve_outreach_campaign_members').select('person_key').eq('campaign_slug', CAMPAIGN).eq('link_code', l.code).maybeSingle();
  if (!m?.person_key) return null;
  const { data } = await db.from('ve_nominations').select('*').ilike('nominee_email', String(m.person_key)).not('invite_token', 'is', null).order('invited_at', { ascending: false }).limit(1).maybeSingle();
  return data;
}
async function signed(path: string | null) {
  if (!path) return null;
  const { data } = await db.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}
async function answersOf(id: string) {
  const { data } = await db.from('ve_nomination_answers').select('q, written, audio_path, audio_seconds, extra, updated_at').eq('nomination_id', id);
  const out: Record<string, unknown> = {};
  for (const a of data || []) out[a.q] = { written: a.written, audio_url: await signed(a.audio_path), audio_seconds: a.audio_seconds, extra: a.extra || {}, updated_at: a.updated_at };
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


  // ---------- the nominee, by their invite ----------
  if (action === 'place_search') {
    const q = clean(body.q, 80).replace(/[%_,()\\*]/g, ' ').replace(/\s+/g, ' ').trim();
    if (q.length < 2) return json({ ok: true, places: [] });
    const { data } = await db.from('listings').select('name, slug, address_city').eq('status', 'approved').ilike('name', `%${q}%`).limit(6);
    return json({ ok: true, places: (data || []).map((x: any) => ({ name: x.name, slug: x.slug, city: x.address_city || '' })) });
  }

  if (['interview_get', 'answer_upload', 'answer_save', 'interview_send', 'interview_join'].includes(action)) {
    const n: any = action === 'interview_get' && !body.t && body.vl ? await byClick(String(body.vl)) : await byInvite(clean(body.t, 64));
    if (!n || !n.invite_token) return json({ error: 'not_found', message: 'That link did not work. Open the link in your invitation email, or write to us at contact@lesaruss.com.' }, 404);
    if (n.status === 'declined') return json({ error: 'closed', message: 'This interview is closed. Write to us at contact@lesaruss.com.' }, 409);

    if (action === 'interview_get') {
      if (!n.interview_opened_at) await db.from('ve_nominations').update({ interview_opened_at: nowIso() }).eq('id', n.id);
      const area = n.community_slug ? ((await chapters()).find((c) => c.slug === n.community_slug)?.name || null) : (n.community_other || null);
      const named = n.credit_ok !== false && !n.self_nominated;
      return json({ ok: true, t: n.invite_token,
        nominee: { first_name: firstOf(n.nominee_name), name: n.nominee_name, email: n.nominee_email, area, area_slug: n.community_slug || null },
        nominator: { named, name: named ? n.nominator_name : null, written: n.written || null, audio_url: await signed(n.audio_path) },
        welcome: { url: n.welcome_path ? `${SUPABASE_URL}/storage/v1/object/public/vegan-media/${n.welcome_path}` : null },
        answers: await answersOf(n.id), sent: !!n.interview_sent_at, joined: !!n.joined_at });
    }
    if (action === 'answer_upload') {
      const q = clean(body.q, 8); if (!QKEYS.test(q)) return json({ error: 'bad_question' }, 400);
      if (n.interview_sent_at) return json({ error: 'sent', message: 'Your interview is already sent. Thank you!' }, 409);
      const type = String(body.type || ''), size = Number(body.size) || 0;
      if (!/^audio\//.test(type) || size <= 0 || size > 25 * 1024 * 1024) return json({ error: 'bad_file', message: 'A recording up to 25 MB, please.' }, 400);
      const ext = /mp4|m4a|aac/.test(type) ? 'm4a' : /mpeg/.test(type) ? 'mp3' : /ogg/.test(type) ? 'ogg' : /wav/.test(type) ? 'wav' : 'webm';
      const path = `${PREFIX}/answers/${n.id}/${q}-${crypto.randomUUID()}.${ext}`;
      const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
      if (error || !data) return json({ error: 'upload_failed', message: 'We could not start the upload. Try again in a minute.' }, 500);
      return json({ ok: true, path, url: data.signedUrl, key: await uploadKey(path) });
    }
    if (action === 'answer_save') {
      const q = clean(body.q, 8); if (!QKEYS.test(q)) return json({ error: 'bad_question' }, 400);
      if (n.interview_sent_at) return json({ error: 'sent', message: 'Your interview is already sent. Thank you!' }, 409);
      const { data: old } = await db.from('ve_nomination_answers').select('audio_path, audio_seconds').eq('nomination_id', n.id).eq('q', q).maybeSingle();
      let audio_path: string | null = null, audio_seconds: number | null = null, written: string | null = null;
      if (body.audio) {
        const path = String(body.audio.path || '');
        if (!path.startsWith(`${PREFIX}/answers/${n.id}/`) || String(body.audio.key || '') !== (await uploadKey(path))) return json({ error: 'bad_audio' }, 400);
        const dir = path.slice(0, path.lastIndexOf('/')), file = path.slice(path.lastIndexOf('/') + 1);
        const { data: f } = await db.storage.from(BUCKET).list(dir, { search: file });
        if (!f || !f.length) return json({ error: 'missing_audio', message: 'Your recording did not finish uploading. Try again.' }, 400);
        audio_path = path; audio_seconds = Math.max(0, Math.min(VOICE_MAX + 10, Math.round(Number(body.audio.seconds) || 0)));
      } else if (body.keep_audio && old?.audio_path) { audio_path = old.audio_path; audio_seconds = old.audio_seconds; }
      else { written = clean(body.written, 4000) || null; }
      if (!audio_path && !written) return json({ error: 'empty', message: 'Record your answer, or write it out.' }, 400);
      const extra = body.extra && typeof body.extra === 'object' ? JSON.parse(JSON.stringify(body.extra).slice(0, 2000)) : {};
      const row = { nomination_id: n.id, q, written, audio_path, audio_seconds, extra, updated_at: nowIso() };
      const { error } = await db.from('ve_nomination_answers').upsert(row, { onConflict: 'nomination_id,q' });
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      if (old?.audio_path && old.audio_path !== audio_path) await db.storage.from(BUCKET).remove([old.audio_path]);
      // The first saved answer: they have started, so the reminder never goes.
      if (n.status === 'invited' || n.status === 'approved') {
        await db.from('ve_nominations').update({ status: 'interviewing', updated_at: nowIso() }).eq('id', n.id);
        await db.from('ve_outreach_campaign_members').update({ send_status: 'stopped', stop_reason: 'started the interview' })
          .eq('campaign_slug', CAMPAIGN).eq('person_key', String(n.nominee_email).toLowerCase()).in('send_status', ['waiting', 'in_sequence']).gt('step', 0);
      }
      return json({ ok: true, answer: { written, audio_url: await signed(audio_path), audio_seconds, extra } });
    }
    if (action === 'interview_send') {
      if (n.interview_sent_at) return json({ ok: true, already: true });
      if (body.release !== true || body.adult !== true) return json({ error: 'release', message: 'Tick both boxes to send your interview.' }, 400);
      const { data: rows } = await db.from('ve_nomination_answers').select('q').eq('nomination_id', n.id);
      const have = new Set((rows || []).map((r: any) => r.q));
      const missing = ['q1', 'q2', 'q3', 'q4', 'q5', 'q7', 'q8'].filter((q) => !have.has(q));
      if (!['q6s1', 'q6s2', 'q6s3'].some((q) => have.has(q))) missing.push('q6');
      if (missing.length) return json({ error: 'missing', message: 'Answer every question first.', missing }, 400);
      await db.from('ve_nominations').update({ interview_sent_at: nowIso(), interview_release_at: nowIso(), status: n.status === 'member' || n.status === 'featured' ? n.status : 'interviewing', updated_at: nowIso() }).eq('id', n.id);
      await db.from('ve_outreach_campaign_members').update({ send_status: 'stopped', stop_reason: 'sent the interview' })
        .eq('campaign_slug', CAMPAIGN).eq('person_key', String(n.nominee_email).toLowerCase()).in('send_status', ['waiting', 'in_sequence']);
      if (!String(n.nominee_name).startsWith('[TEST]')) await sendOne(TEAM_EMAIL, `[Interview] ${n.nominee_name} sent their interview`, wrap(
        `<p><b>${esc(n.nominee_name)}</b> answered all eight of Kai's questions.</p>` + btn(`${SITE}/admin/depot/nominations#n/${n.id}`, 'Listen in the Depot')));
      return json({ ok: true });
    }
    if (action === 'interview_join') {
      if (!me?.id) return json({ error: 'sign_in', message: 'Create your account or sign in first.' }, 401);
      if (!n.interview_sent_at) return json({ error: 'not_sent', message: 'Send your interview first.' }, 400);
      if (n.member_id && n.member_id !== me.id) return json({ error: 'taken', message: 'This interview already joined another account. Write to us at contact@lesaruss.com.' }, 409);
      const { data: r, error } = await db.rpc('ve_nomination_admit', { p_member: me.id, p_nomination: n.id });
      if (error || !r?.ok) return json({ error: 'join_failed', message: error?.message || r?.error || 'That did not finish. Try again in a minute.' }, 500);
      return json({ ok: true, admitted: !!r.admitted, status: r.status });
    }
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
    const { data: cm } = await db.from('ve_outreach_campaign_members').select('step, send_status, stop_reason, last_sent_at, next_send_at').eq('campaign_slug', CAMPAIGN).eq('person_key', String(n.nominee_email).toLowerCase()).maybeSingle();
    return json({ ok: true, nomination: { ...n, audio_url, area: n.community_slug ? (names[n.community_slug] || n.community_slug) : (n.community_other || 'Somewhere else'), other_nominations: others || 0,
      interview_url: n.invite_token ? `${SITE}/nominate/interview?t=${n.invite_token}` : null,
      welcome_url: n.welcome_path ? `${SUPABASE_URL}/storage/v1/object/public/vegan-media/${n.welcome_path}` : null,
      answers: await answersOf(n.id), invite: cm || null }, roles: ROLES });
  }

  if (action === 'set') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const up: Record<string, unknown> = { reviewed_at: nowIso(), reviewed_by: me?.id || null, updated_at: nowIso() };
    if (body.status !== undefined) { if (!['new', 'approved', 'declined'].includes(body.status)) return json({ error: 'bad_status' }, 400); up.status = body.status; }
    if (body.team_note !== undefined) up.team_note = clean(body.team_note, 2000) || null;
    const { data: cur } = await db.from('ve_nominations').select('*').eq('id', body.id).maybeSingle();
    if (!cur) return json({ error: 'not_found' }, 404);
    if (body.status === 'approved' && cur.invite_token) delete up.status;   // already invited: approving again changes nothing
    const { error } = await db.from('ve_nominations').update(up).eq('id', body.id);
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    if (body.status !== 'approved' || cur.invite_token) return json({ ok: true });
    // Approve = invite (Sean, 2026-11-12): the token, Kai's personal opening, and the nominee in the Nominee invitations campaign.
    const token = newToken();
    const w = await makeWelcome(cur);
    const area = cur.community_slug ? ((await chapters()).find((c) => c.slug === cur.community_slug)?.name || null) : (cur.community_other || null);
    const email = String(cur.nominee_email).toLowerCase();
    const { data: had } = await db.from('ve_outreach_campaign_members').select('id').eq('campaign_slug', CAMPAIGN).eq('person_key', email).maybeSingle();
    let invite = 'queued';
    if (had) invite = 'already_in_campaign';
    else {
      const { error: me2 } = await db.from('ve_outreach_campaign_members').insert({ campaign_slug: CAMPAIGN, person_key: email, person_name: cur.nominee_name,
        step: 0, send_status: 'waiting', personal_emails: inviteEmails(cur, area), personal_at: nowIso(), personal_by: me?.id || null });
      if (me2) invite = 'failed: ' + me2.message;
    }
    await db.from('ve_nominations').update({ invite_token: token, invited_at: nowIso(), status: invite.startsWith('failed') ? 'approved' : 'invited',
      welcome_path: w.path, welcome_text: w.text, welcome_checked: w.checked, updated_at: nowIso() }).eq('id', body.id);
    return json({ ok: true, invite, welcome: { made: !!w.path, checked: w.checked, error: w.error || null }, interview_url: `${SITE}/nominate/interview?t=${token}` });
  }

  return json({ error: 'unknown_action' }, 400);
});
