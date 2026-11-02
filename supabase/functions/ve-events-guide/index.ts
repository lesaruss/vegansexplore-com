// ve-events-guide: the Vegan Events Guide's intake (2026-11-01, Sean: "Logan, build the Events Guide"; canon canon-ve-events-guide,
// playbook ve-events-guide; migration 20261101_events_guide.sql). Two things come in through it, and the team works both in
// Depot > Event sponsors (/admin/depot/event-sponsors) and the dashboard's Inbox.
//
// 1. Event sponsorships, paid in marketing, never cash. We give: a calendar and chapter Daily Pulse feature, 2 posts and a story, a
//    2-week chapter ad slot, a creator or member covering it, a recap. They give: a 10x10 booth, two comped meals or tickets, our logo,
//    a stage mention, our QR cards. Vegan events qualify; plant-forward events at venues that are not Vegan only for Group Partners;
//    2 a chapter a month. Approving can post the Represent Vegans Explore gig on the chapter's Gig Board (ve_bounties, gig_kind
//    event, apply), approved like a visit bounty: 3 photos and a recap.
// 2. Host stories: six questions answered by voice in the browser, a release, 100 points to a member once approved. The audio sits
//    in the private bucket event-host-stories; approved and published stories play in the Guide through signed links.
//
// verify_jwt off; the VE member token is checked here when sent. Ops (Bearer LESARUSS_ADMIN_TOKEN) may act as a member with as_member.
// Anyone:
//   POST { action: 'sponsor_apply', answers }   three a day per email; emails the chapter's Community Managers (else the team) and
//        confirms to them. A signed-in member's token links it to them.
//   POST { action: 'story_start', name, email, answers: [{q, type, size}] } -> { id, upload_key, uploads: [{q, path, url}] }
//        signed upload links (one per answer, audio up to 25 MB); three stories a day per email
//   POST { action: 'story_submit', id, upload_key, event_name, chapter, note?, release: true, answers: {q: {path, seconds}} }
//   POST { action: 'stories' }  -> approved, published stories with signed audio links (an hour)
// Super admins (or ops):
//   POST { action: 'admin_list', kind: 'apps'|'stories', status? }
//   POST { action: 'admin_get', kind, id }   (a story's audio as signed links)
//   POST { action: 'app_decide', id, status: new|reviewing|approved|declined, note?, gig?: {points, slots, perk, note} }
//        approving with gig posts the booth gig once; declining with a note emails them
//   POST { action: 'story_decide', id, status: approved|declined|removed, publish?: boolean, note? }
//        approving pays a member 100 points once (reason host_story, ref host-story:<id>) and emails them
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const TEAM_EMAIL = 'contact@lesaruss.com';
const FROM = 'VEGANS EXPLORE <hello@vegansexplore.com>';
const BUCKET = 'event-host-stories';
const DAY_MS = 24 * 60 * 60 * 1000;
const STORY_POINTS = 100;
// Keep in step with STORY_QS in /guide-scripts/vegan-events-guide.js.
const QUESTIONS: Record<string, string> = {
  q1: 'Tell us about your first event.', q2: 'What went wrong, and what did you do?', q3: 'Your rain story, or your worst-weather story.',
  q4: 'How did you get people to come back?', q5: 'What would you tell someone hosting their first event?', q6: 'Your proudest moment as a host.',
};
// Keep in step with FORM in /guide-scripts/vegan-events-guide.js.
const APPLY_FIELDS: [string, string][] = [
  ['event_name', 'Event'], ['event_date', 'Date'], ['chapter', 'Chapter'], ['city', 'City'], ['venue', 'Venue'], ['link', 'Official link'], ['kind', 'Kind of event'],
  ['crowd', 'Expected crowd'], ['past', 'Hosted before'], ['vegan', 'Everything Vegan'], ['venue_vegan', 'Venue is Vegan'], ['why', 'Who it is for'],
  ['ask', 'What would help most'], ['booth', 'A 10x10 booth'], ['meals', 'Two comped meals or tickets'], ['logo', 'Our logo'], ['stage', 'A stage mention'], ['offer', 'Anything else they offer'],
  ['host_name', 'Name'], ['host_email', 'Email'], ['host_org', 'Group or business'], ['phone', 'Phone'], ['note', 'Note'],
];
const APPLY_REQUIRED = ['event_name', 'event_date', 'chapter', 'city', 'kind', 'crowd', 'past', 'vegan', 'venue_vegan', 'why', 'ask', 'booth', 'meals', 'logo', 'host_name', 'host_email'];
const CHAPTER_WORDS: Record<string, string> = { 'south-florida': 'South Florida', 'central-florida': 'Central Florida', 'north-florida': 'North Florida', atlanta: 'Atlanta',
  'washington-dc': 'Washington, D.C.', maryland: 'Maryland', virginia: 'Virginia', delaware: 'Delaware', 'west-virginia': 'West Virginia', philadelphia: 'Philadelphia',
  'new-york': 'New York', 'los-angeles': 'Los Angeles', london: 'London', other: 'Somewhere else' };
const GIG_DEFAULTS = { points: 150, slots: 1 };   // Logan's defaults, Sean's to change.
const MONTH_CAP = 2;                              // sponsorships approved a chapter a month (canon)

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
// Same key derivation as ve-auth's signJWT.
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
async function memberOf(req: Request, body: any): Promise<string | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  if (await isOps(req)) return isId(body.as_member) ? body.as_member : null;
  return await verifyToken(token);
}
// A key that ties a story's uploads to its submit, so nobody else can finish someone's story.
async function uploadKey(id: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(16, 48)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode('ev-story:' + id)));
  return Array.from(sig.slice(0, 16)).map((b) => b.toString(16).padStart(2, '0')).join('');
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

// The chapter's active Community Managers, else the team.
async function chapterTeam(chapter: string): Promise<string[]> {
  const slug = chapter === 'washington-dc' ? ['washington-dc', 'dc'] : [chapter];
  const { data } = await db.from('members').select('email').eq('ve_role', 'community_manager').eq('membership_status', 'active').in('home_community', slug);
  const list = (data || []).map((m: any) => m.email).filter(Boolean);
  return list.length ? list : [TEAM_EMAIL];
}
async function viewer(id: string | null) {
  if (!id) return null;
  const { data } = await db.from('members').select('id, email, first_name, last_name, is_superadmin, membership_status, member_class').eq('id', id).maybeSingle();
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const ops = await isOps(req);
  const me = await viewer(await memberOf(req, body));
  const admin = ops || !!me?.is_superadmin;

  // ---------- the sponsorship application ----------
  if (action === 'sponsor_apply') {
    const a = body.answers && typeof body.answers === 'object' ? body.answers : {};
    const answers: Record<string, string> = {};
    for (const [k] of APPLY_FIELDS) { const v = clean(a[k], k === 'past' || k === 'why' || k === 'ask' || k === 'offer' || k === 'note' ? 2000 : 300); if (v) answers[k] = v; }
    const miss = APPLY_REQUIRED.filter((k) => !answers[k]);
    if (miss.length) return json({ error: 'missing', fields: miss, message: 'A few answers are missing.' }, 400);
    const email = answers.host_email.toLowerCase();
    if (!isEmail(email)) return json({ error: 'bad_email', message: 'That email does not look right.' }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(answers.event_date) || answers.event_date < new Date(Date.now() - DAY_MS).toISOString().slice(0, 10)) {
      return json({ error: 'bad_date', message: 'Apply for an event that is coming up.' }, 400);
    }
    if (!CHAPTER_WORDS[answers.chapter]) return json({ error: 'bad_chapter' }, 400);
    const since = new Date(Date.now() - DAY_MS).toISOString();
    const { count } = await db.from('ve_event_sponsor_applications').select('id', { count: 'exact', head: true }).ilike('host_email', email).gte('created_at', since);
    if ((count ?? 0) >= 3) return json({ error: 'daily_limit', message: 'That is three today. Email us at contact@lesaruss.com.' }, 429);
    const { data: row, error } = await db.from('ve_event_sponsor_applications').insert({
      member_id: me?.id || null, event_name: answers.event_name, event_date: answers.event_date, chapter: answers.chapter, city: answers.city,
      host_name: answers.host_name, host_email: email, host_org: answers.host_org || null, answers,
    }).select('id').single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    if (!answers.event_name.startsWith('[TEST]')) {
      const team = await chapterTeam(answers.chapter);
      await sendOne(team, `[Event sponsorship] ${answers.event_name}, ${CHAPTER_WORDS[answers.chapter]}`, wrap(
        `<p><b>${esc(answers.host_name)}</b> (${esc(email)}) applied for an event sponsorship.</p>` +
        `<table style="font-size:14px;border-collapse:collapse">${APPLY_FIELDS.filter(([k]) => answers[k]).map(([k, l]) => `<tr><td style="padding:3px 10px 3px 0;color:#666;vertical-align:top">${esc(l)}</td><td style="padding:3px 0">${esc(k === 'chapter' ? CHAPTER_WORDS[answers[k]] : answers[k])}</td></tr>`).join('')}</table>` +
        btn(`${SITE}/admin/depot/event-sponsors#app/${row.id}`, 'Open it in the Depot')), email);
      await sendOne(email, 'We have your sponsorship application', wrap(
        `<p>Hi ${esc(firstName(answers.host_name))},</p><p>Thank you for applying for a Vegans Explore sponsorship for <b>${esc(answers.event_name)}</b>. Our team reads every application and answers by email.</p>` +
        `<p>While you wait, put your event on our calendar, so people in ${esc(CHAPTER_WORDS[answers.chapter])} can find it.</p>` + btn(`${SITE}/events#submit/1`, 'Submit your event') +
        `<p>The Vegans Explore team</p>`));
    }
    return json({ ok: true, id: row.id });
  }

  // ---------- host stories ----------
  if (action === 'story_start') {
    const name = clean(body.name, 120), email = clean(body.email, 200).toLowerCase();
    if (!name || !isEmail(email)) return json({ error: 'missing', message: 'Your name and email, please.' }, 400);
    const list = Array.isArray(body.answers) ? body.answers : [];
    const qs = list.filter((x: any) => QUESTIONS[x?.q] && Number(x?.size) > 0 && Number(x.size) <= 25 * 1024 * 1024 && /^audio\//.test(String(x?.type || '')));
    if (qs.length < 2 || qs.length !== list.length) return json({ error: 'bad_answers', message: 'Record at least two answers, each under 25 MB.' }, 400);
    const since = new Date(Date.now() - DAY_MS).toISOString();
    const { count } = await db.from('ve_event_host_stories').select('id', { count: 'exact', head: true }).ilike('email', email).gte('created_at', since);
    if ((count ?? 0) >= 3) return json({ error: 'daily_limit', message: 'That is three stories today. Email us at contact@lesaruss.com.' }, 429);
    const id = crypto.randomUUID();
    const uploads = [];
    for (const x of qs) {
      const ext = String(x.type).includes('mp4') || String(x.type).includes('m4a') || String(x.type).includes('aac') ? 'm4a' : String(x.type).includes('mpeg') ? 'mp3' : String(x.type).includes('ogg') ? 'ogg' : String(x.type).includes('wav') ? 'wav' : 'webm';
      const path = `${id}/${x.q}.${ext}`;
      const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
      if (error || !data) return json({ error: 'upload_failed', message: 'We could not start the upload. Try again in a minute.' }, 500);
      uploads.push({ q: x.q, path, url: data.signedUrl });
    }
    return json({ ok: true, id, upload_key: await uploadKey(id), uploads });
  }

  if (action === 'story_submit') {
    const id = String(body.id || '');
    if (!isId(id) || String(body.upload_key || '') !== (await uploadKey(id))) return json({ error: 'bad_story' }, 400);
    if (body.release !== true) return json({ error: 'release', message: 'Tick the box to let us use your recordings.' }, 400);
    const name = clean(body.name, 120), email = clean(body.email, 200).toLowerCase();
    const a = body.answers && typeof body.answers === 'object' ? body.answers : {};
    const answers: Record<string, { path: string; seconds: number }> = {};
    for (const q of Object.keys(QUESTIONS)) {
      const x = a[q]; if (!x) continue;
      const path = String(x.path || '');
      if (!path.startsWith(id + '/' + q + '.')) return json({ error: 'bad_path' }, 400);
      const { data: f } = await db.storage.from(BUCKET).list(id, { search: q + '.' });
      if (!f || !f.length) return json({ error: 'missing_audio', message: 'An answer did not upload. Try sending again.' }, 400);
      answers[q] = { path, seconds: Math.max(0, Math.min(600, Math.round(Number(x.seconds) || 0))) };
    }
    if (Object.keys(answers).length < 2) return json({ error: 'bad_answers', message: 'Record at least two answers.' }, 400);
    const { data: exists } = await db.from('ve_event_host_stories').select('id').eq('id', id).maybeSingle();
    if (exists) return json({ ok: true, id });
    // The name and email come from story_start's caller; read them back from the request (the page sends them again).
    const nm = name || clean(body.name, 120), em = email || '';
    const { error } = await db.from('ve_event_host_stories').insert({
      id, member_id: me?.id || null, name: nm || (me ? [me.first_name, me.last_name].filter(Boolean).join(' ') : 'A host'),
      email: em || me?.email || '', event_name: clean(body.event_name, 160) || null, chapter: CHAPTER_WORDS[String(body.chapter || '')] ? String(body.chapter) : null,
      answers: { ...answers, ...(clean(body.note, 1500) ? { note: clean(body.note, 1500) } : {}) }, release_at: nowIso(),
    });
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    const story = { name: nm || me?.first_name || 'A host', email: em || me?.email || '' };
    if (!story.name.startsWith('[TEST]')) {
      await sendOne(TEAM_EMAIL, `[Host story] ${story.name}${body.event_name ? ', ' + clean(body.event_name, 160) : ''}`, wrap(
        `<p><b>${esc(story.name)}</b>${story.email ? ` (${esc(story.email)})` : ''} recorded ${Object.keys(answers).length} answers for the Vegan Events Guide, with the release ticked.</p>` +
        btn(`${SITE}/admin/depot/event-sponsors#story/${id}`, 'Listen in the Depot')), story.email || undefined);
      if (story.email && isEmail(story.email)) await sendOne(story.email, 'We have your story', wrap(
        `<p>Hi ${esc(firstName(story.name))},</p><p>Thank you for telling us your story. Our team listens to every one. If yours goes on the Vegans Explore Podcast, we will email you first.</p><p>The Vegans Explore team</p>`));
    }
    return json({ ok: true, id });
  }

  if (action === 'stories') {
    const { data } = await db.from('ve_event_host_stories').select('id, name, event_name, chapter, answers, reviewed_at').eq('status', 'approved').eq('published', true).order('reviewed_at', { ascending: false }).limit(12);
    const out = [];
    for (const s of data || []) {
      const answers = [];
      for (const q of Object.keys(QUESTIONS)) {
        const x = (s.answers as any)?.[q]; if (!x?.path) continue;
        const { data: u } = await db.storage.from(BUCKET).createSignedUrl(x.path, 3600);
        if (u?.signedUrl) answers.push({ q, question: QUESTIONS[q], url: u.signedUrl, seconds: x.seconds || 0 });
      }
      out.push({ id: s.id, name: firstName(s.name) + (s.name.trim().split(/\s+/)[1] ? ' ' + s.name.trim().split(/\s+/).slice(-1)[0][0] + '.' : ''), event_name: s.event_name, chapter: s.chapter, answers });
    }
    return json({ ok: true, stories: out });
  }

  // ---------- the team ----------
  if (!admin) return json({ error: 'forbidden' }, 403);

  if (action === 'admin_list') {
    const kind = body.kind === 'stories' ? 'stories' : 'apps';
    const status = clean(body.status, 20);
    if (kind === 'apps') {
      let q = db.from('ve_event_sponsor_applications').select('id, created_at, event_name, event_date, chapter, city, host_name, host_email, host_org, status, bounty_id, answers').order('created_at', { ascending: false }).limit(300);
      if (status) q = q.eq('status', status);
      const { data } = await q;
      const { data: counts } = await db.from('ve_event_sponsor_applications').select('status');
      const by: Record<string, number> = {}; (counts || []).forEach((r: any) => { by[r.status] = (by[r.status] || 0) + 1; });
      return json({ ok: true, items: data || [], counts: by, chapters: CHAPTER_WORDS });
    }
    let q = db.from('ve_event_host_stories').select('id, created_at, name, email, event_name, chapter, status, published, points_paid_at, member_id, answers').order('created_at', { ascending: false }).limit(300);
    if (status) q = q.eq('status', status);
    const { data } = await q;
    const { data: counts } = await db.from('ve_event_host_stories').select('status');
    const by: Record<string, number> = {}; (counts || []).forEach((r: any) => { by[r.status] = (by[r.status] || 0) + 1; });
    return json({ ok: true, items: (data || []).map((s: any) => ({ ...s, answered: Object.keys(s.answers || {}).filter((k) => QUESTIONS[k]).length, answers: undefined })), counts: by, chapters: CHAPTER_WORDS });
  }

  if (action === 'admin_get') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    if (body.kind === 'stories') {
      const { data: s } = await db.from('ve_event_host_stories').select('*').eq('id', body.id).maybeSingle();
      if (!s) return json({ error: 'not_found' }, 404);
      const audio = [];
      for (const q of Object.keys(QUESTIONS)) {
        const x = (s.answers as any)?.[q]; if (!x?.path) continue;
        const { data: u } = await db.storage.from(BUCKET).createSignedUrl(x.path, 3600);
        audio.push({ q, question: QUESTIONS[q], url: u?.signedUrl || '', seconds: x.seconds || 0 });
      }
      return json({ ok: true, item: s, audio, note: (s.answers as any)?.note || '', member: s.member_id ? await viewer(s.member_id) : null, points: STORY_POINTS });
    }
    const { data: a } = await db.from('ve_event_sponsor_applications').select('*').eq('id', body.id).maybeSingle();
    if (!a) return json({ error: 'not_found' }, 404);
    const month = a.event_date ? String(a.event_date).slice(0, 7) : null;
    let approvedThisMonth = 0;
    if (month && a.chapter) {
      const { count } = await db.from('ve_event_sponsor_applications').select('id', { count: 'exact', head: true }).eq('chapter', a.chapter).eq('status', 'approved')
        .gte('event_date', month + '-01').lt('event_date', nextMonth(month)).neq('id', a.id);
      approvedThisMonth = count ?? 0;
    }
    const { data: gig } = a.bounty_id ? await db.from('ve_bounties').select('id, title, status, points, slots').eq('id', a.bounty_id).maybeSingle() : { data: null };
    return json({ ok: true, item: a, fields: APPLY_FIELDS, chapters: CHAPTER_WORDS, approved_this_month: approvedThisMonth, cap: MONTH_CAP, gig, gig_defaults: GIG_DEFAULTS });
  }

  if (action === 'app_decide') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const status = String(body.status || '');
    if (!['new', 'reviewing', 'approved', 'declined'].includes(status)) return json({ error: 'bad_status' }, 400);
    const { data: a } = await db.from('ve_event_sponsor_applications').select('*').eq('id', body.id).maybeSingle();
    if (!a) return json({ error: 'not_found' }, 404);
    const note = clean(body.note, 2000);
    const patch: any = { status, decision_note: note || a.decision_note, reviewed_at: nowIso(), reviewed_by: me?.id || null };
    let bountyId = a.bounty_id;
    if (status === 'approved' && body.gig && !a.bounty_id) {
      const g = body.gig || {};
      const points = Math.max(1, Math.min(5000, Math.round(Number(g.points) || GIG_DEFAULTS.points)));
      const slots = Math.max(1, Math.min(6, Math.round(Number(g.slots) || GIG_DEFAULTS.slots)));
      const perk = clean(g.perk, 200) || 'Two comped meals or tickets from the host';
      const day = a.event_date ? new Date(a.event_date + 'T12:00:00Z') : new Date(Date.now() + 14 * DAY_MS);
      const close = new Date(Math.max(Date.now() + DAY_MS, day.getTime() - 3 * DAY_MS)), due = new Date(day.getTime() + 3 * DAY_MS);
      const chapter = a.chapter === 'other' ? '' : a.chapter;
      if (!chapter) return json({ error: 'no_chapter', message: 'The gig needs one of our chapters.' }, 400);
      const brief = `Represent Vegans Explore at ${a.event_name}${a.city ? ' in ' + a.city : ''} on ${a.event_date}. Staff our 10x10 booth, welcome people, hand out our QR cards and tell them what Vegans Explore is. ` +
        `The host gives us the booth${perk ? ' and ' + perk.toLowerCase() : ''}. Send at least 3 photos (the booth, the crowd, the event) and a short recap after.` + (clean(g.note, 600) ? ' ' + clean(g.note, 600) : '');
      const details = [`Event: ${a.event_name}`, `When: ${a.event_date}`, a.answers?.venue ? `Where: ${a.answers.venue}, ${a.city}` : `Where: ${a.city}`,
        a.answers?.link ? `Official page: ${a.answers.link}` : '', `Host: ${a.host_name}${a.host_org ? ', ' + a.host_org : ''}`,
        'Bring: the QR cards and banner we send you, water, a phone with charge.', 'Photos: people only with their yes.',
        'If anything on the day was given to you, say so in anything you post (the FTC rule).'].filter(Boolean).join('\n');
      const { data: b, error } = await db.from('ve_bounties').insert({
        community_slug: chapter, kind: 'photos', gig_kind: 'event', apply_mode: 'apply', asks: ['pitch'], title: `Represent Vegans Explore at ${a.event_name}`.slice(0, 140),
        brief: brief.slice(0, 4000), deliverable: 'Staff the booth, then at least 3 photos and a short recap', points, slots, perk, partner_name: (a.host_org || a.host_name || '').slice(0, 120),
        status: 'open', created_by: me?.id || null, claims_close_at: close.toISOString(), due_at: due.toISOString(), event_details: details.slice(0, 6000),
      }).select('id').single();
      if (error) return json({ error: 'gig_failed', message: error.message }, 500);
      bountyId = b.id; patch.bounty_id = b.id;
    }
    const { error } = await db.from('ve_event_sponsor_applications').update(patch).eq('id', a.id);
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    const tell = body.email !== false && !String(a.event_name).startsWith('[TEST]');
    if (tell && status === 'approved' && a.status !== 'approved') {
      await sendOne(a.host_email, `Your event is sponsored: ${a.event_name}`, wrap(
        `<p>Hi ${esc(firstName(a.host_name))},</p><p>Good news: Vegans Explore is sponsoring <b>${esc(a.event_name)}</b>.</p>` +
        `<p>What we give: a feature on our calendar and in the Daily Pulse, two posts and a story, an ad on your chapter's pages for two weeks, someone covering it, and a recap after.</p>` +
        `<p>What we ask: a 10x10 booth, two comped meals or tickets for the member who staffs it, our logo on your flyer and page, a mention from the stage, and our QR cards at the door.</p>` +
        (note ? `<p style="white-space:pre-line">${esc(note)}</p>` : '') + `<p>We will be in touch about the details. Reply to this email with any questions.</p><p>The Vegans Explore team</p>`));
    }
    if (tell && status === 'declined' && a.status !== 'declined' && note) {
      await sendOne(a.host_email, `About your sponsorship application: ${a.event_name}`, wrap(
        `<p>Hi ${esc(firstName(a.host_name))},</p><p>Thank you for applying for a sponsorship for <b>${esc(a.event_name)}</b>.</p><p style="white-space:pre-line">${esc(note)}</p>` +
        `<p>Your event can still go on our calendar.</p>` + btn(`${SITE}/events#submit/1`, 'Submit your event') + `<p>The Vegans Explore team</p>`));
    }
    return json({ ok: true, bounty_id: bountyId });
  }

  if (action === 'story_decide') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const status = String(body.status || '');
    if (!['new', 'approved', 'declined', 'removed'].includes(status)) return json({ error: 'bad_status' }, 400);
    const { data: s } = await db.from('ve_event_host_stories').select('*').eq('id', body.id).maybeSingle();
    if (!s) return json({ error: 'not_found' }, 404);
    const patch: any = { status, published: status === 'approved' ? body.publish === true : false, decision_note: clean(body.note, 2000) || s.decision_note, reviewed_at: nowIso(), reviewed_by: me?.id || null };
    let paid = false;
    if (status === 'approved' && s.member_id && !s.points_paid_at) {
      const { error } = await db.rpc('ve_points_grant', { p_member: s.member_id, p_amount: STORY_POINTS, p_reason: 'host_story', p_ref: 'host-story:' + s.id });
      if (!error) { patch.points_paid_at = nowIso(); paid = true; } else console.error('points', error.message);
    }
    const { error } = await db.from('ve_event_host_stories').update(patch).eq('id', s.id);
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    if (status === 'removed') {
      const paths = Object.keys(QUESTIONS).map((q) => (s.answers as any)?.[q]?.path).filter(Boolean);
      if (paths.length) await db.storage.from(BUCKET).remove(paths);
    }
    if (status === 'approved' && s.status !== 'approved' && s.email && isEmail(s.email) && !String(s.name).startsWith('[TEST]')) {
      await sendOne(s.email, 'Your host story is approved', wrap(
        `<p>Hi ${esc(firstName(s.name))},</p><p>Thank you again for telling us your story. It is approved${paid ? `, and ${STORY_POINTS} points are in your account` : ''}.</p>` +
        (patch.published ? '<p>It now plays in the Vegan Events Guide, for hosts who are just starting out.</p>' : '') +
        `<p>If we use it on the Vegans Explore Podcast, we will let you know when it airs.</p><p>The Vegans Explore team</p>`));
    }
    return json({ ok: true, paid });
  }

  return json({ error: 'unknown_action' }, 400);
});

function nextMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return d.toISOString().slice(0, 10);
}
