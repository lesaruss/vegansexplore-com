// ve-people-outreach: Depot > Outreach, one page a day of everyone to contact and how (Sean, 2026-11-01, playbook ve-outreach-buckets).
// Super admin (the VE token), or ops (Bearer LESARUSS_ADMIN_TOKEN, optionally with as_member), or the cron (x-cron-secret) for tick.
//   { action: 'day', day }                  -> { day, messages: [...], counts, week: [{day, total, left}] }
//   { action: 'get', id }                   -> { message, notes, history, link, template }
//   { action: 'save', id, subject?, body?, to_address?, send_at?, why? }   a sent or done message cannot change; an approved one
//                                              goes back to Needs your review (pulled back) when its words change
//   { action: 'approve', id }               email: scheduled for send_at (10 AM Eastern on its day when unset, or now + 5 min if past)
//   { action: 'pull_back', id }             approved -> draft, until it goes out
//   { action: 'done', id }                  instagram, text, call, meetup, other: Sean did it by hand
//   { action: 'skip', id } | { action: 'reopen', id }
//   { action: 'note', id, body }            a note on the person (what they said); kept on every message to them
//   { action: 'follow_up', id, day, channel? }   a new draft for the same person on that day
//   { action: 'test', id }                  the email to the signed-in admin only, [Test] in the subject, nothing recorded as sent
//   { action: 'create', messages: [...] }   load messages (ops or admin)
//   { action: 'templates' } | { action: 'template_approve', key }   approving a base email approves its messages that are not personal
//   { action: 'tick' }                      sends approved emails whose send_at has passed (cron, every 5 minutes)
// Emails go through email-send as brand lesaruss: from Sean A. Russell, replies to contact@lesaruss.com, one-click unsubscribe,
// the postal address, campaign_ref ve-people-<id> so nothing goes twice. Opens come from email_events, clicks from ve_links.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const BRAND = 'lesaruss';
const TZ = 'America/New_York';
const BUCKETS = ['business', 'community', 'sponsor', 'nonprofit', 'group'];
const CHANNELS = ['email', 'instagram', 'text', 'call', 'meetup', 'other'];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const clean = (v: unknown, max: number) => String(v ?? '').replace(/\r/g, '').trim().slice(0, max);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

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
async function secret(key: string): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value ?? null;
}

// ---- Eastern time ----
function tzOffsetMs(utcMs: number): number {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(utcMs))) p[x.type] = x.value;
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - utcMs;
}
// "2026-11-03" + "10:00" Eastern -> ISO UTC
function eastern(day: string, hm = '10:00'): string {
  const [y, mo, d] = day.split('-').map(Number);
  const [h, mi] = hm.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let t = guess - tzOffsetMs(guess);
  t = guess - tzOffsetMs(t);
  return new Date(t).toISOString();
}
function todayEastern(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function addDays(day: string, n: number): string {
  const d = new Date(day + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---- email ----
function escHtml(s: string) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c]); }
const REASON = 'Sean A. Russell of Vegans Explore wrote to you personally';
function toHtml(body: string): string {
  const paras = escHtml(body).split(/\n{2,}/).map((p) => '<p style="margin:0 0 16px">' +
    p.replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" style="color:#1f5f22">${u}</a>`).replace(/\n/g, '<br>') + '</p>').join('');
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px">${paras}` +
    `<p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#777">You are getting this because ${REASON}. ` +
    `<a href="{{unsubscribe_url}}" style="color:#777">Don't email me again</a>.<br>{{postal_address}}</p></div>`;
}
function toText(body: string): string {
  return `${body}\n\n--\nYou are getting this because ${REASON}.\nDon't email me again: {{unsubscribe_url}}\n{{postal_address}}`;
}
async function emailSend(payload: Record<string, unknown>) {
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  const r = await fetch(`${SUPABASE_URL}/functions/v1/email-send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` }, body: JSON.stringify(payload) });
  return await r.json().catch(() => ({ ok: false, error: `email-send ${r.status}` }));
}

type Who = { id: string | null; name: string; admin: boolean; ops: boolean };
const COLS = 'id,day,send_at,person_id,person_key,name,org,bucket,channel,to_address,subject,body,link_code,why,template_key,personal,status,approved_at,sent_at,done_at,send_error,follow_up_of,campaign,sort,updated_at';

// What happened after: opened (email_events), clicks (the tracked link).
async function enrich(rows: any[]) {
  const ids = rows.filter((r) => r.channel === 'email' && r.sent_at).map((r) => `ve-people-${r.id}`);
  const opened = new Map<string, string>();
  if (ids.length) {
    const { data } = await db.from('email_events').select('campaign_ref,event_type,event_at').in('campaign_ref', ids).in('event_type', ['email.opened', 'email.clicked', 'email.bounced']);
    for (const e of data || []) {
      const k = String(e.campaign_ref).slice('ve-people-'.length) + ':' + e.event_type;
      if (!opened.has(k) || String(e.event_at) < opened.get(k)!) opened.set(k, String(e.event_at));
    }
  }
  const codes = [...new Set(rows.map((r) => r.link_code).filter(Boolean))];
  const clicks = new Map<string, { clicks: number; last: string | null }>();
  if (codes.length) {
    const { data } = await db.from('ve_links').select('code,clicks,last_click_at').in('code', codes);
    for (const l of data || []) clicks.set(l.code, { clicks: l.clicks || 0, last: l.last_click_at });
  }
  return rows.map((r) => ({
    ...r,
    opened_at: opened.get(r.id + ':email.opened') || null,
    bounced_at: opened.get(r.id + ':email.bounced') || null,
    clicks: r.link_code ? clicks.get(r.link_code)?.clicks ?? 0 : null,
    last_click_at: r.link_code ? clicks.get(r.link_code)?.last ?? null : null,
  }));
}
const LEFT = ['draft', 'failed'];

async function handle(body: any, who: Who): Promise<Record<string, unknown>> {
  const action = String(body.action || '');

  if (action === 'day') {
    const day = isDay(body.day) ? body.day : todayEastern();
    const { data, error } = await db.from('ve_people_outreach').select(COLS).eq('day', day).order('sort').order('created_at');
    if (error) return { error: error.message };
    const messages = await enrich(data || []);
    const counts: Record<string, number> = {};
    for (const m of messages) counts[m.status] = (counts[m.status] || 0) + 1;
    // The week around it: how many each day, and how many still need Sean.
    const from = addDays(day, -3), to = addDays(day, 10);
    const { data: wk } = await db.from('ve_people_outreach').select('day,status').gte('day', from).lte('day', to);
    const wmap = new Map<string, { total: number; left: number }>();
    for (const r of wk || []) {
      const x = wmap.get(r.day) || { total: 0, left: 0 };
      x.total++; if (LEFT.includes(r.status)) x.left++;
      wmap.set(r.day, x);
    }
    const week = [...wmap.entries()].sort().map(([d, x]) => ({ day: d, ...x }));
    // Anything from an earlier day still not handled shows as overdue on today.
    let overdue = 0;
    if (day === todayEastern()) {
      const { count } = await db.from('ve_people_outreach').select('id', { count: 'exact', head: true }).lt('day', day).in('status', LEFT);
      overdue = count || 0;
    }
    return { day, today: todayEastern(), messages, counts, week, overdue };
  }

  if (action === 'overdue') {
    const { data } = await db.from('ve_people_outreach').select(COLS).lt('day', todayEastern()).in('status', LEFT).order('day').order('sort');
    return { messages: await enrich(data || []) };
  }

  if (action === 'get') {
    if (!isId(body.id)) return { error: 'bad_id' };
    const { data: m } = await db.from('ve_people_outreach').select(COLS).eq('id', body.id).maybeSingle();
    if (!m) return { error: 'not_found' };
    const [{ data: notes }, { data: hist }, { data: link }, { data: tpl }] = await Promise.all([
      db.from('ve_people_outreach_notes').select('id,body,author_name,created_at,message_id').eq('person_key', m.person_key).order('created_at', { ascending: false }).limit(100),
      db.from('ve_people_outreach').select(COLS).eq('person_key', m.person_key).neq('id', m.id).order('day', { ascending: false }).limit(30),
      m.link_code ? db.from('ve_links').select('code,destination,clicks,last_click_at').eq('code', m.link_code).maybeSingle() : Promise.resolve({ data: null }),
      m.template_key ? db.from('ve_people_outreach_templates').select('key,label,approved_at').eq('key', m.template_key).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const [msg] = await enrich([m]);
    const history = await enrich(hist || []);
    return { message: msg, notes: notes || [], history, link, template: tpl };
  }

  if (action === 'save') {
    if (!isId(body.id)) return { error: 'bad_id' };
    const { data: m } = await db.from('ve_people_outreach').select('id,status,channel,day').eq('id', body.id).maybeSingle();
    if (!m) return { error: 'not_found' };
    if (['sent', 'sending', 'done'].includes(m.status)) return { error: 'already_sent' };
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    let words = false;
    if ('subject' in body) { patch.subject = clean(body.subject, 200); words = true; }
    if ('body' in body) { patch.body = String(body.body ?? '').replace(/\r/g, '').slice(0, 8000); words = true; }
    if ('to_address' in body) { patch.to_address = clean(body.to_address, 200); words = true; }
    if ('why' in body) patch.why = clean(body.why, 400);
    if ('send_at' in body) {
      const t = Date.parse(String(body.send_at));
      if (!Number.isFinite(t)) return { error: 'bad_time' };
      patch.send_at = new Date(t).toISOString();
    }
    if (isDay(body.day)) patch.day = body.day;
    if (words && m.status === 'approved') { patch.status = 'draft'; patch.approved_at = null; patch.approved_by = null; }
    if (m.status === 'failed') { patch.status = 'draft'; patch.send_error = null; }
    const { error } = await db.from('ve_people_outreach').update(patch).eq('id', m.id);
    if (error) return { error: error.message };
    return { ok: true, pulled_back: words && m.status === 'approved' };
  }

  if (action === 'approve') {
    if (!isId(body.id)) return { error: 'bad_id' };
    const { data: m } = await db.from('ve_people_outreach').select('id,status,channel,day,send_at,to_address,subject,body').eq('id', body.id).maybeSingle();
    if (!m) return { error: 'not_found' };
    if (m.channel !== 'email') return { error: 'not_email' };
    if (!['draft', 'failed'].includes(m.status)) return { error: 'not_waiting' };
    if (!m.to_address || !isEmail(m.to_address)) return { error: 'no_email_address' };
    if (!clean(m.subject, 200) || !clean(m.body, 8000)) return { error: 'empty' };
    if (/\[[A-Z][^\]]{1,40}\]/.test(m.body) || /\[[A-Z][^\]]{1,40}\]/.test(m.subject || '')) return { error: 'placeholder_left' };
    let at = m.send_at ? Date.parse(m.send_at) : Date.parse(eastern(m.day));
    const soon = Date.now() + 5 * 60 * 1000;
    if (at < soon) at = soon;
    const { error } = await db.from('ve_people_outreach').update({ status: 'approved', send_at: new Date(at).toISOString(), approved_at: new Date().toISOString(), approved_by: who.id, send_error: null, updated_at: new Date().toISOString() }).eq('id', m.id).in('status', ['draft', 'failed']);
    if (error) return { error: error.message };
    return { ok: true, send_at: new Date(at).toISOString() };
  }

  if (action === 'pull_back') {
    if (!isId(body.id)) return { error: 'bad_id' };
    const { data, error } = await db.from('ve_people_outreach').update({ status: 'draft', approved_at: null, approved_by: null, updated_at: new Date().toISOString() }).eq('id', body.id).eq('status', 'approved').select('id');
    if (error) return { error: error.message };
    if (!data?.length) return { error: 'not_scheduled' };
    return { ok: true };
  }

  if (action === 'done' || action === 'skip' || action === 'reopen') {
    if (!isId(body.id)) return { error: 'bad_id' };
    const { data: m } = await db.from('ve_people_outreach').select('id,status,channel').eq('id', body.id).maybeSingle();
    if (!m) return { error: 'not_found' };
    if (action === 'done') {
      if (m.channel === 'email') return { error: 'email_sends_itself' };
      if (!['draft', 'failed'].includes(m.status)) return { error: 'not_waiting' };
      await db.from('ve_people_outreach').update({ status: 'done', done_at: new Date().toISOString(), done_by: who.id, updated_at: new Date().toISOString() }).eq('id', m.id);
    } else if (action === 'skip') {
      if (['sent', 'sending', 'done'].includes(m.status)) return { error: 'already_sent' };
      await db.from('ve_people_outreach').update({ status: 'skipped', approved_at: null, updated_at: new Date().toISOString() }).eq('id', m.id);
    } else {
      if (!['skipped', 'done'].includes(m.status) || (m.status === 'done' && m.channel === 'email')) return { error: 'cannot_reopen' };
      await db.from('ve_people_outreach').update({ status: 'draft', done_at: null, done_by: null, updated_at: new Date().toISOString() }).eq('id', m.id);
    }
    return { ok: true };
  }

  if (action === 'note') {
    if (!isId(body.id)) return { error: 'bad_id' };
    const text = clean(body.body, 4000);
    if (!text) return { error: 'empty' };
    const { data: m } = await db.from('ve_people_outreach').select('id,person_key').eq('id', body.id).maybeSingle();
    if (!m) return { error: 'not_found' };
    const { data, error } = await db.from('ve_people_outreach_notes').insert({ person_key: m.person_key, message_id: m.id, author_id: who.id, author_name: who.name, body: text }).select('id,body,author_name,created_at').single();
    if (error) return { error: error.message };
    return { ok: true, note: data };
  }

  if (action === 'follow_up') {
    if (!isId(body.id) || !isDay(body.day)) return { error: 'bad_request' };
    if (body.day < todayEastern()) return { error: 'day_in_past' };
    const { data: m } = await db.from('ve_people_outreach').select('*').eq('id', body.id).maybeSingle();
    if (!m) return { error: 'not_found' };
    const channel = CHANNELS.includes(body.channel) ? body.channel : m.channel;
    const row = {
      day: body.day, person_id: m.person_id, person_key: m.person_key, name: m.name, org: m.org, bucket: m.bucket, channel,
      to_address: channel === m.channel ? m.to_address : null, subject: m.subject ? (/^re: /i.test(m.subject) ? m.subject : 'Re: ' + m.subject) : null,
      body: '', link_code: m.link_code, why: `Follow up on the ${m.day} message.`, personal: true, follow_up_of: m.id, campaign: m.campaign, sort: m.sort,
    };
    const { data, error } = await db.from('ve_people_outreach').insert(row).select('id,day').single();
    if (error) return { error: error.message };
    return { ok: true, follow_up: data };
  }

  if (action === 'test') {
    if (!isId(body.id)) return { error: 'bad_id' };
    if (!who.id) return { error: 'admins_only' };
    const { data: me } = await db.from('members').select('email').eq('id', who.id).maybeSingle();
    const to = String(me?.email || '').toLowerCase();
    if (!isEmail(to)) return { error: 'no_email_for_you' };
    const { data: m } = await db.from('ve_people_outreach').select('id,channel,subject,body,name').eq('id', body.id).maybeSingle();
    if (!m || m.channel !== 'email') return { error: 'not_email' };
    const res = await emailSend({ brand: BRAND, campaign_ref: `ve-people-test-${m.id}-${Date.now()}`, subject: '[Test] ' + (m.subject || ''),
      html: toHtml(m.body), text: toText(m.body), test_to: [to], recipients: [{ email: to }] });
    const result = res?.results?.[0]?.result || (res?.ok ? 'sent' : 'failed');
    return { ok: result === 'sent', result, to, error: result === 'sent' ? undefined : (res?.error || result) };
  }

  if (action === 'create') {
    const list = Array.isArray(body.messages) ? body.messages.slice(0, 200) : [];
    const rows: Record<string, unknown>[] = [];
    const skipped: unknown[] = [];
    const { data: tpls } = await db.from('ve_people_outreach_templates').select('key,approved_at');
    const approvedTpl = new Set((tpls || []).filter((t) => t.approved_at).map((t) => t.key));
    for (const [i, x] of list.entries()) {
      const name = clean(x.name, 160);
      const channel = CHANNELS.includes(x.channel) ? x.channel : null;
      const bucket = BUCKETS.includes(x.bucket) ? x.bucket : null;
      if (!name || !channel || !bucket || !isDay(x.day)) { skipped.push({ i, name, why: 'name, channel, bucket and day are required' }); continue; }
      const to = clean(x.to_address, 200);
      const key = clean(x.person_key, 200).toLowerCase() || (channel === 'email' && isEmail(to) ? to.toLowerCase() : name.toLowerCase());
      const personal = x.personal !== false;
      const tk = clean(x.template_key, 80) || null;
      const pre = !personal && tk && approvedTpl.has(tk) && channel === 'email' && isEmail(to);
      rows.push({
        day: x.day, send_at: x.send_at ? new Date(Date.parse(x.send_at)).toISOString() : null, person_id: isId(x.person_id) ? x.person_id : null,
        person_key: key, name, org: clean(x.org, 160) || null, bucket, channel, to_address: to || null, subject: clean(x.subject, 200) || null,
        body: String(x.body ?? '').replace(/\r/g, '').slice(0, 8000), link_code: clean(x.link_code, 60) || null, why: clean(x.why, 400) || null,
        template_key: tk, personal, campaign: clean(x.campaign, 60) || 'outreach-nov', sort: Number.isFinite(+x.sort) ? +x.sort : i,
        status: pre ? 'approved' : 'draft', approved_at: pre ? new Date().toISOString() : null,
      });
    }
    if (rows.length) {
      const { error } = await db.from('ve_people_outreach').insert(rows);
      if (error) return { error: error.message };
    }
    return { ok: true, created: rows.length, skipped };
  }

  if (action === 'templates') {
    const { data } = await db.from('ve_people_outreach_templates').select('*').order('bucket');
    return { templates: data || [] };
  }

  if (action === 'template_approve') {
    const key = clean(body.key, 80);
    const { data: t } = await db.from('ve_people_outreach_templates').select('key').eq('key', key).maybeSingle();
    if (!t) return { error: 'not_found' };
    await db.from('ve_people_outreach_templates').update({ approved_at: new Date().toISOString(), approved_by: who.id, updated_at: new Date().toISOString() }).eq('key', key);
    // Its messages that are not personal and still waiting are approved too; each goes out on its own day at its time.
    const { data: waiting } = await db.from('ve_people_outreach').select('id,day,send_at,to_address').eq('template_key', key).eq('personal', false).eq('status', 'draft');
    let approved = 0;
    for (const m of waiting || []) {
      if (!m.to_address || !isEmail(m.to_address)) continue;
      let at = m.send_at ? Date.parse(m.send_at) : Date.parse(eastern(m.day));
      if (at < Date.now() + 5 * 60 * 1000) at = Date.now() + 5 * 60 * 1000;
      await db.from('ve_people_outreach').update({ status: 'approved', send_at: new Date(at).toISOString(), approved_at: new Date().toISOString(), approved_by: who.id }).eq('id', m.id).eq('status', 'draft');
      approved++;
    }
    return { ok: true, approved };
  }

  return { error: 'unknown_action' };
}

async function tick() {
  const { data: due } = await db.from('ve_people_outreach').select('id,to_address,subject,body,name').eq('status', 'approved').eq('channel', 'email').lte('send_at', new Date().toISOString()).order('send_at').limit(20);
  const out: unknown[] = [];
  for (const m of due || []) {
    // Claim it first, so two ticks never send the same message.
    const { data: claimed } = await db.from('ve_people_outreach').update({ status: 'sending' }).eq('id', m.id).eq('status', 'approved').select('id');
    if (!claimed?.length) continue;
    try {
      const first = (m.name || '').trim().split(/\s+/)[0] || undefined;
      const res = await emailSend({ brand: BRAND, campaign_ref: `ve-people-${m.id}`, list_ref: 've-people-outreach', subject: m.subject,
        html: toHtml(m.body), text: toText(m.body), recipients: [{ email: m.to_address, first_name: first, name: m.name }] });
      const result = res?.results?.[0]?.result || (res?.ok ? 'unknown' : 'failed');
      if (result === 'sent' || result === 'already_sent') {
        await db.from('ve_people_outreach').update({ status: 'sent', sent_at: new Date().toISOString(), resend_id: res.results?.[0]?.id || null, send_error: null }).eq('id', m.id);
      } else {
        const why = result === 'suppressed' ? 'They are on the do-not-email list.' : result === 'invalid' ? 'That email address is not valid.' : String(res?.error || result);
        await db.from('ve_people_outreach').update({ status: 'failed', send_error: why }).eq('id', m.id);
      }
      out.push({ id: m.id, result });
    } catch (e) {
      await db.from('ve_people_outreach').update({ status: 'failed', send_error: String((e as Error).message || e) }).eq('id', m.id);
      out.push({ id: m.id, result: 'error' });
    }
  }
  return { sent: out };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const cron = req.headers.get('x-cron-secret');
    if (body.action === 'tick') {
      const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
      const ok = (cron && cron === (await secret('CRON_SECRET'))) || (token && token === (await secret('LESARUSS_ADMIN_TOKEN')));
      if (!ok) return json({ error: 'not_authenticated' }, 401);
      return json(await tick());
    }
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    const ops = !!token && token === (await secret('LESARUSS_ADMIN_TOKEN'));
    const who: Who = { id: null, name: 'Logan', admin: false, ops };
    const asMember = ops && isId(body.as_member) ? body.as_member : null;
    const sub = asMember || (!ops && token ? await verifyToken(token) : null);
    if (sub) {
      const { data: me } = await db.from('members').select('is_superadmin, name').eq('id', sub).maybeSingle();
      if (!me) return json({ error: 'not_authenticated' }, 401);
      const parts = String(me.name || '').trim().split(/\s+/).filter(Boolean);
      who.id = sub; who.admin = !!me.is_superadmin;
      who.name = parts.length ? parts[0] + (parts.length > 1 ? ' ' + parts[parts.length - 1][0] + '.' : '') : 'A team member';
    } else if (!ops) return json({ error: 'not_authenticated' }, 401);
    if (!who.admin && !ops) return json({ error: 'forbidden' }, 403);
    const out = await handle(body, who);
    return json(out, out.error === 'not_found' ? 404 : 200);
  } catch (e) {
    console.error('ve-people-outreach:', e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
