// ve-pulse-subscribe: the Daily Pulse subscription, the first of the three doors (Sean, 2026-11-03, canon canon-ve-people-campaigns-doors;
// migration 20261103_pulse_subscribe.sql; docs/proposals/people-campaigns-doors.md section 3).
//
// A subscriber is a ve_tasters row with source 'pulse-subscribe' (the Taster sequence skips that source). Dark until Sean turns it on:
// ve_site_settings 'pulse_subscribe' {on, send_hour, per_tick, membership_line_every}. While 'on' is false nothing is shown or sent.
//
//   { action: 'status' }                                    -> { open }                              (the page shows the box only when open)
//   { action: 'subscribe', email, cities[], frequency, consent?, source? }
//        -> { ok } and a confirm email (double opt-in). London needs consent: true (an unticked box). An email already confirmed
//        just has its cities and frequency updated; no token is returned, so the emailed link is the only way in to the preferences.
//   { action: 'me' | 'confirm' | 'unsubscribe', token }     the emailed link's key (the Taster key, a different secret from member sessions)
//   { action: 'save', token, cities[], frequency }          preferences
//   { action: 'counts' }                                    super admins (member token): confirmed subscribers per city
//   { action: 'list' }                                      super admins: every subscriber, their cities, how often, status, the page they signed up on
//                                                           (Depot > Pulse subscribers; Sean, 2026-11-09)
//   { action: 'preview', city, frequency? }                 super admins: the issue as it would go, from the city's latest Pulse
//   { action: 'test', city }                                super admins: the issue to the caller's own address only
//   { action: 'tick' }                                      the cron (x-cron-secret) or ops: sends what is due, inside the hours, only while on
//
// Every issue goes through email-send (brand vegans-explore), one campaign per day. Links carry utm tags; the email system names each
// click by recipient. Nothing goes twice (ve_pulse_sends, unique per subscriber and issue).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FN_BASE = `${SUPABASE_URL}/functions/v1`;
const BRAND = 'vegans-explore';
const SITE = 'https://vegansexplore.com';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const likeEsc = (s: string) => s.replace(/[\\%_]/g, (c) => '\\' + c);
const b64u = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const b64uStr = (s: string) => b64u(new TextEncoder().encode(s));
function fromB64u(s: string) { const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : ''; const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); }

const CITY: Record<string, string> = { 'south-florida': 'South Florida', 'central-florida': 'Central Florida', 'north-florida': 'North Florida', atlanta: 'Atlanta',
  'washington-dc': 'Washington, D.C.', delaware: 'Delaware', maryland: 'Maryland', virginia: 'Virginia', 'west-virginia': 'West Virginia', 'new-york': 'New York',
  philadelphia: 'Philadelphia', 'los-angeles': 'Los Angeles', seattle: 'Seattle', london: 'London' };
const MAX_CITIES = 3;

// The subscriber's key: the Taster key (bytes 32 to 64 of the service key), so no member function takes it for a member session.
async function key(use: 'sign' | 'verify') {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(32, 64).padEnd(32, '1')), { name: 'HMAC', hash: 'SHA-256' }, false, [use]);
}
async function signTaster(id: string) {
  const h = b64uStr(JSON.stringify({ alg: 'HS256', typ: 'TASTER' })), p = b64uStr(JSON.stringify({ sub: id, k: 'taster', exp: Math.floor(Date.now() / 1000) + 400 * 86400 }));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await key('sign'), new TextEncoder().encode(`${h}.${p}`)));
  return `${h}.${p}.${b64u(sig)}`;
}
async function readTaster(token: unknown): Promise<string | null> {
  try {
    const [h, p, s] = String(token || '').split('.');
    if (!h || !p || !s) return null;
    if (!(await crypto.subtle.verify('HMAC', await key('verify'), fromB64u(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(fromB64u(p)));
    return d.k === 'taster' && typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function memberFrom(req: Request): Promise<string | null> {
  try {
    const [h, p, s] = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').split('.');
    if (!h || !p || !s) return null;
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', k, fromB64u(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(fromB64u(p)));
    return d.k !== 'taster' && typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function secret(k: string) {
  const env = Deno.env.get(k); if (env) return env;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', k).maybeSingle();
  return data?.value && data.value !== 'pending' ? String(data.value) : null;
}
async function adminMember(req: Request) {
  const mid = await memberFrom(req);
  if (!mid) return null;
  const { data } = await db.from('members').select('id, email, is_superadmin').eq('id', mid).maybeSingle();
  return data?.is_superadmin ? data : null;
}

function eastern(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', weekday: 'short', hour12: false })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, weekday: p.weekday as string };
}
async function settings() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'pulse_subscribe').maybeSingle();
  return { on: false, send_hour: 9, per_tick: 40, membership_line_every: 1, ...((data as any)?.value || {}) };
}

// ---------- The emails ----------
function shell(body: string, foot: string) {
  return `<div style="font-family:Montserrat,Arial,sans-serif;max-width:600px;font-size:15px;line-height:1.6;color:#1a1a1a"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;border-collapse:collapse"><tr><td width="25%" style="background:#2D5C27;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="13%" style="background:#F69820;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="12%" style="background:#FF9EC4;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="13%" style="background:#FFEBD1;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="12%" style="background:#22C55E;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="13%" style="background:#E8F5E9;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="12%" style="background:#3A9B3E;height:6px;line-height:6px;font-size:0">&nbsp;</td></tr></table>` +
    `<p style="margin:0 0 18px"><img src="${SITE}/public/logo-ve-landscape-v2.png" alt="Vegans Explore" width="150" style="display:block;border:0"></p>${body}` +
    `<p style="margin-top:28px;font-size:12px;line-height:1.5;color:#777">${foot} <a href="{{unsubscribe_url}}" style="color:#777">Unsubscribe from all Vegans Explore emails</a>. {{postal_address}}.</p></div>`;
}
const btn = (href: string, label: string) => `<p style="margin:20px 0"><a href="${href}" style="display:inline-block;background:#F69820;color:#1a1a1a;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:13px;padding:13px 24px;border-radius:6px;text-decoration:none">${esc(label)}</a></p>`;
const abs = (u: string) => (u.startsWith('http') ? u : SITE + (u.startsWith('/') ? '' : '/') + u);
const clip = (s: string, n: number) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const prefsUrl = (token: string, extra = '') => `${SITE}/pulse-preferences?t=${encodeURIComponent(token)}${extra}`;

function confirmEmail(t: any, token: string) {
  const first = esc(String(t.name || '').trim().split(/\s+/)[0] || 'there');
  const cities = (t.pulse_cities || []).map((c: string) => CITY[c] || c).join(', ');
  return { subject: 'Confirm your Daily Pulse', html: shell(
    `<p>Hi ${first},</p><p>You asked for the Vegans Explore Daily Pulse for ${esc(cities)}, ${t.pulse_frequency === 'weekly' ? 'once a week' : 'every day'}. One click and it starts:</p>` +
    btn(prefsUrl(token, '&confirm=1'), 'Yes, send me the Pulse') +
    `<p>If you did not ask for this, ignore this email and nothing will be sent.</p><p>Vegans Explore team</p>`,
    `You are getting this because someone asked for the Daily Pulse with this address.`) };
}

// One city's block: the top five stories, then what the Pulse carries from us.
function cityBlock(city: string, posts: any[], utm: string) {
  if (!posts.length) return { html: '', ours: '' };
  const post = posts[0];
  const stories: any[] = Array.isArray(post.stories) ? post.stories : [];
  const own = (s: any) => !!(s.feature_id || s.ours);
  const news = stories.filter((s) => !own(s)).slice(0, 5);
  const feat = stories.filter(own);
  const tag = (u: string) => abs(u) + (u.includes('?') ? '&' : '?') + utm;
  const li = (s: any) => `<p style="margin:0 0 14px"><a href="${esc(tag(s.url || '/pulse'))}" style="color:#2D5C27;font-weight:800;text-decoration:none">${esc(clip(s.title, 120))}</a><br><span style="color:#444">${esc(clip(s.take || s.summary || '', 170))}</span></p>`;
  const html = `<h2 style="font-size:18px;margin:26px 0 12px;color:#2D5C27">${esc(CITY[city] || city)}</h2>` + (news.length ? news.map(li).join('') : `<p style="color:#444">${esc(clip(post.title, 140))}</p>`) +
    `<p style="margin:0"><a href="${esc(tag('/pulse?city=' + city))}" style="color:#2D5C27;font-weight:700">Read today's ${esc(CITY[city] || city)} Pulse</a></p>`;
  const h = post.house || {};
  const ours: string[] = feat.map(li);
  if (h.spotlight?.url) ours.push(`<p style="margin:0 0 14px"><b>Spotlight:</b> <a href="${esc(tag(h.spotlight.url))}" style="color:#2D5C27;font-weight:800;text-decoration:none">${esc(h.spotlight.name)}</a>${h.spotlight.city ? ' in ' + esc(h.spotlight.city) : ''}<br><span style="color:#444">${esc(clip(h.spotlight.line || '', 150))}</span></p>`);
  if (h.episode?.url) ours.push(`<p style="margin:0 0 14px"><b>Listen:</b> <a href="${esc(tag(h.episode.url))}" style="color:#2D5C27;font-weight:800;text-decoration:none">${esc(clip(h.episode.title, 110))}</a><br><span style="color:#444">${esc(h.episode.show || '')}</span></p>`);
  return { html, ours: ours.join('') };
}

function issueEmail(t: any, token: string, byCity: Record<string, any[]>, dateStr: string, weekly: boolean) {
  const utm = `utm_source=pulse&utm_medium=email&utm_campaign=pulse-${weekly ? 'weekly' : 'daily'}-${dateStr}`;
  const cities = Object.keys(byCity);
  const blocks = cities.map((c) => cityBlock(c, byCity[c], utm)).filter((b) => b.html);
  if (!blocks.length) return null;
  const first = esc(String(t.name || '').trim().split(/\s+/)[0] || '');
  const ours = blocks.map((b) => b.ours).join('');
  const everyN = Number(t._membership_every) || 1;  // every issue invites them to join free (Sean, 2026-11-08)
  const showMembership = (Number(t.pulse_issue_count) || 0) % everyN === everyN - 1;
  const names = cities.map((c) => CITY[c] || c);
  const body = (first && !/subscriber/i.test(first) ? `<p>Hi ${first}, here is your ${weekly ? 'week' : 'day'} in Vegan ${esc(names.join(' and '))}.</p>` : `<p>Here is your ${weekly ? 'week' : 'day'} in Vegan ${esc(names.join(' and '))}.</p>`) +
    blocks.map((b) => b.html).join('') +
    (ours ? `<h2 style="font-size:18px;margin:30px 0 12px;color:#2D5C27">From Vegans Explore</h2>${ours}` : '') +
    (showMembership ? `<p style="margin-top:26px;padding:14px 16px;background:#e8f5e9;border-radius:8px">Members vote for their favorite Vegan places, check in, and earn points as they take part. Joining is free with a short survey. <a href="${esc(SITE + '/survey?s=explorer&' + utm)}" style="color:#2D5C27;font-weight:800">Join free</a>.</p>` : '');
  const foot = `You are getting this because you subscribed to the Daily Pulse for ${esc(names.join(', '))}. <a href="${prefsUrl(token)}" style="color:#777">Change cities or how often</a> or <a href="${prefsUrl(token, '&unsub=1')}" style="color:#777">stop these emails</a>.`;
  const subject = weekly ? `Your week in Vegan ${names.join(' and ')}` : clip(`${names[0]}: ${byCity[cities[0]][0]?.title || 'the Daily Pulse'}`, 90);
  return { subject, html: shell(body, foot) };
}

async function emailSend(payload: Record<string, unknown>) {
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  try {
    const r = await fetch(`${FN_BASE}/email-send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` }, body: JSON.stringify(payload) });
    return await r.json().catch(() => ({ ok: false, error: `email-send ${r.status}` }));
  } catch (e) { return { ok: false, error: String(e) }; }
}
async function send(ref: string, cname: string, to: string, name: string | null, subject: string, html: string, testTo?: string) {
  const res: any = await emailSend({ brand: BRAND, campaign_ref: ref, list_ref: 've-pulse-subscribers', subject, html, recipients: [{ email: to, name: name || undefined }], ...(testTo ? { test_to: [testTo] } : {}) });
  const r = res?.results?.[0];
  if (!r) return { result: 'failed', error: res?.error || (res?.errors || []).join('; ') || 'email-send' } as any;
  if (r.result === 'sent' && !testTo) {
    await db.from('email_campaigns').upsert({ brand_slug: BRAND, campaign_ref: ref, name: `${cname}, automatic`, subject, html, status: 'sent', audience: { source: 've-pulse-subscribe', automatic: true },
      notes: 'Sent one at a time by ve-pulse-subscribe (the Daily Pulse subscription).', started_at: new Date().toISOString(), completed_at: new Date().toISOString(), created_by: 've-pulse-subscribe' },
      { onConflict: 'campaign_ref', ignoreDuplicates: true });
  }
  return r as { result: string; id?: string; error?: string };
}
async function suppressed(email: string) {
  const { data } = await db.rpc('email_is_suppressed', { p_email: email.toLowerCase().trim(), p_brand: BRAND });
  return data === true;
}
async function citiesFor(cities: string[], days: number) {
  const out: Record<string, any[]> = {};
  for (const c of cities.slice(0, MAX_CITIES)) {
    const { data } = await db.rpc('ve_pulse_issue_city', { p_city: c, p_days: days });
    if (Array.isArray(data) && data.length) out[c] = data;
  }
  return out;
}
const cleanCities = (v: unknown) => [...new Set((Array.isArray(v) ? v : []).map(String).filter((c) => CITY[c]))].slice(0, MAX_CITIES);
const out = (t: any) => ({ first_name: String(t.name || '').trim().split(/\s+/)[0], cities: t.pulse_cities || [], frequency: t.pulse_frequency, confirmed: !!t.pulse_confirmed_at, unsubscribed: !!t.pulse_unsubscribed_at });

// ---------- The send ----------
async function tick() {
  const cfg = await settings(), e = eastern();
  const res = { on: cfg.on, sent: 0, skipped: 0, in_hours: e.hour >= cfg.send_hour && e.hour < 17 };
  if (!cfg.on || !res.in_hours) return res;
  const { data: ts } = await db.from('ve_tasters').select('id, email, name, pulse_cities, pulse_frequency, pulse_issue_count')
    .not('pulse_confirmed_at', 'is', null).is('pulse_unsubscribed_at', null).not('name', 'ilike', '%[TEST]%').limit(1000);
  const cache = new Map<string, Record<string, any[]>>();
  for (const t of ts || []) {
    if (res.sent >= cfg.per_tick) break;
    const weekly = t.pulse_frequency === 'weekly';
    if (weekly && e.weekday !== 'Mon') continue;
    const issue = `${weekly ? 'w' : 'd'}:${e.date}`;
    const ck = `${weekly ? 7 : 1}|${(t.pulse_cities || []).join(',')}`;
    if (!cache.has(ck)) cache.set(ck, await citiesFor(t.pulse_cities || [], weekly ? 7 : 1));
    const byCity = cache.get(ck)!;
    if (!Object.keys(byCity).length) { res.skipped++; continue; }              // nothing published for their cities today: no issue
    if (await suppressed(t.email)) { await db.from('ve_tasters').update({ pulse_unsubscribed_at: new Date().toISOString() }).eq('id', t.id); continue; }
    const { error: ce } = await db.from('ve_pulse_sends').insert({ taster_id: t.id, issue, cities: Object.keys(byCity) });   // claim first: a second tick never sends twice
    if (ce) continue;
    const token = await signTaster(t.id);
    const m = issueEmail({ ...t, _membership_every: cfg.membership_line_every }, token, byCity, e.date, weekly);
    if (!m) { await db.from('ve_pulse_sends').delete().eq('taster_id', t.id).eq('issue', issue); continue; }
    const r = await send(`ve-pulse-${weekly ? 'weekly' : 'daily'}-${e.date}`, `The Daily Pulse (${weekly ? 'weekly' : 'daily'}, ${e.date})`, t.email, t.name, m.subject, m.html);
    if (r.result === 'failed') { await db.from('ve_pulse_sends').delete().eq('taster_id', t.id).eq('issue', issue); continue; }
    await db.from('ve_pulse_sends').update({ result: r.result, email_send_id: r.id || null, error: r.result === 'sent' || r.result === 'already_sent' ? null : (r.error || r.result) }).eq('taster_id', t.id).eq('issue', issue);
    if (r.result === 'suppressed' || r.result === 'invalid') await db.from('ve_tasters').update({ pulse_unsubscribed_at: new Date().toISOString() }).eq('id', t.id);
    if (r.result === 'sent') await db.from('ve_tasters').update({ pulse_last_sent_at: new Date().toISOString(), pulse_issue_count: (t.pulse_issue_count || 0) + 1 }).eq('id', t.id);
    res.sent++;
  }
  return res;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');

  if (action === 'status') return json({ open: (await settings()).on === true });

  if (action === 'subscribe') {
    const cfg = await settings();
    if (!cfg.on) return json({ error: 'not_open', message: 'The Daily Pulse subscription is not open yet.' }, 403);
    const email = String(body.email || '').trim().toLowerCase();
    const cities = cleanCities(body.cities), freq = body.frequency === 'weekly' ? 'weekly' : 'daily';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) return json({ error: 'email', message: 'That email does not look right.' }, 400);
    if (!cities.length) return json({ error: 'cities', message: 'Pick at least one city.' }, 400);
    if (cities.includes('london') && body.consent !== true) return json({ error: 'consent', message: 'Tick the box to get our emails.' }, 400);
    const { data: ex } = await db.from('ve_tasters').select('*').ilike('email', likeEsc(email)).maybeSingle();
    if (ex && ex.updated_at && Date.now() - Date.parse(ex.updated_at) < 60e3) return json({ error: 'slow_down', message: 'Give it a minute and try again.' }, 429);
    const now = new Date().toISOString();
    const src = String(body.source || '').slice(0, 120) || null;
    const consent_basis = cities.includes('london') ? 'checkbox' : 'notice';
    let t: any;
    if (ex) {
      const patch: Record<string, unknown> = { pulse_cities: cities, pulse_frequency: freq, updated_at: now, pulse_unsubscribed_at: null, pulse_source: src || ex.pulse_source, pulse_requested_at: ex.pulse_requested_at || now };
      if (cities.includes('london')) { patch.consent_basis = 'checkbox'; }
      const r = await db.from('ve_tasters').update(patch).eq('id', ex.id).select('*').single(); t = r.data;
    } else {
      const local = email.split('@')[0].replace(/[^a-z0-9]+/gi, ' ').trim().slice(0, 40) || 'Subscriber';
      const r = await db.from('ve_tasters').insert({ email, name: local, chapter: cities[0], source: 'pulse-subscribe', consent_basis, consent_at: now, pulse_cities: cities, pulse_frequency: freq, pulse_source: src, pulse_requested_at: now }).select('*').single(); t = r.data;
    }
    if (!t) return json({ error: 'save_failed' }, 500);
    if (t.pulse_confirmed_at) return json({ ok: true, already: true });
    if (await suppressed(email)) return json({ ok: true });                       // never email a suppressed address; say nothing about it
    const token = await signTaster(t.id), m = confirmEmail(t, token);
    if (!/\[TEST\]/i.test(t.name || '')) {
      const hour = Math.floor(Date.now() / 3600e3);
      await send(`ve-pulse-confirm-${t.id}-${hour}`, 'The Daily Pulse: confirm', email, null, m.subject, m.html);
    }
    return json({ ok: true });
  }

  if (action === 'me' || action === 'confirm' || action === 'unsubscribe' || action === 'save') {
    const id = await readTaster(body.token);
    if (!id) return json({ error: 'bad_token' }, 401);
    const patch: Record<string, unknown> = { last_seen_at: new Date().toISOString() };
    if (action === 'confirm') { patch.pulse_confirmed_at = new Date().toISOString(); patch.pulse_unsubscribed_at = null; }
    if (action === 'unsubscribe') patch.pulse_unsubscribed_at = new Date().toISOString();
    if (action === 'save') {
      const cities = cleanCities(body.cities);
      if (!cities.length) return json({ error: 'cities', message: 'Pick at least one city.' }, 400);
      if (cities.includes('london')) { const { data: cur } = await db.from('ve_tasters').select('consent_basis').eq('id', id).maybeSingle(); if (cur?.consent_basis !== 'checkbox') return json({ error: 'consent', message: 'London needs the box ticked on the sign-up form. Subscribe again from the Daily Pulse page.' }, 400); }
      patch.pulse_cities = cities; patch.pulse_frequency = body.frequency === 'weekly' ? 'weekly' : 'daily'; patch.updated_at = new Date().toISOString();
    }
    const { data: t } = await db.from('ve_tasters').update(patch).eq('id', id).select('*').maybeSingle();
    if (!t) return json({ error: 'not_found' }, 404);
    return json({ ok: true, subscriber: out(t), cities: CITY });
  }

  if (action === 'tick') {
    const cs = req.headers.get('x-cron-secret'), bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const ok = (!!cs && cs === (await secret('CRON_SECRET'))) || (!!bearer && bearer === (await secret('LESARUSS_ADMIN_TOKEN')));
    if (!ok) return json({ error: 'forbidden' }, 403);
    return json({ ok: true, ...(await tick()) });
  }

  if (action === 'list') {
    if (!(await adminMember(req))) return json({ error: 'forbidden' }, 403);
    const { data, error } = await db.from('ve_tasters')
      .select('id, email, name, pulse_cities, pulse_frequency, pulse_confirmed_at, pulse_unsubscribed_at, pulse_last_sent_at, pulse_issue_count, pulse_source, pulse_requested_at, consent_basis, member_id, source, created_at')
      .not('pulse_requested_at', 'is', null).order('pulse_requested_at', { ascending: false }).limit(2000);
    if (error) return json({ error: 'load_failed' }, 500);
    const rows = (data || []).map((t: any) => ({ ...t, status: t.pulse_unsubscribed_at ? 'stopped' : t.pulse_confirmed_at ? 'subscribed' : 'waiting', test: /\[TEST\]/i.test(t.name || '') }));
    return json({ ok: true, rows, cities: CITY, on: (await settings()).on === true });
  }

  if (action === 'counts' || action === 'preview' || action === 'test' || action === 'settings') {
    const admin = await adminMember(req);
    if (!admin) return json({ error: 'forbidden' }, 403);
    if (action === 'counts') {
      const { data } = await db.rpc('ve_pulse_subscriber_counts');
      const { count: pending } = await db.from('ve_tasters').select('id', { count: 'exact', head: true }).eq('source', 'pulse-subscribe').is('pulse_confirmed_at', null);
      return json({ ok: true, cities: data || [], waiting_to_confirm: pending || 0 });
    }
    if (action === 'settings') {
      const cur = await settings();
      if (typeof body.on === 'boolean') {
        await db.from('ve_site_settings').upsert({ key: 'pulse_subscribe', value: { ...cur, on: body.on } }, { onConflict: 'key' });
        return json({ ok: true, ...cur, on: body.on });
      }
      return json({ ok: true, ...cur });
    }
    const city = String(body.city || '');
    if (!CITY[city]) return json({ error: 'city' }, 400);
    const weekly = body.frequency === 'weekly';
    const byCity = await citiesFor([city], weekly ? 7 : 3);
    const e = eastern();
    const sample = { name: 'Sam Rivera', pulse_issue_count: 4, _membership_every: 1 };
    const m = issueEmail(sample, await signTaster('00000000-0000-4000-8000-000000000001'), byCity, e.date, weekly);
    if (!m) return json({ error: 'nothing_published', message: `No Daily Pulse has been published for ${CITY[city]} lately.` }, 404);
    if (action === 'preview') return json({ ok: true, subject: m.subject, html: m.html });
    if (!admin.email) return json({ error: 'no_email' }, 400);
    const r = await send(`ve-pulse-test-${Date.now()}`, 'Daily Pulse test', admin.email, 'Test', `[Test] ${m.subject}`, m.html, admin.email);
    return json({ ok: r.result === 'sent', result: r.result, to: admin.email });
  }

  return json({ error: 'unknown_action' }, 400);
});
