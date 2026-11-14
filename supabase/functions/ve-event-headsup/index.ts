// ve-event-headsup: the event host path, step 2, the heads-up email (Sean, 2026-11-02; canon canon-ve-event-host-path, playbook
// ve-event-host-path; migration 20261102_event_heads_up.sql).
//
// A host whose events are on our calendar hears about it: one email naming their new approved events, at most one every 14 days,
// to an email they publish, from VEGANS EXPLORE and signed by their chapter's Community Manager (else the Vegans Explore team), never
// Sean's name, no prices, and a one-click unsubscribe that is permanent (email-send's brand suppression). London: business addresses
// only. The list (ve_outreach_cities 'event-hosts') and its email (ve_outreach_templates event-heads-up, step 1) live on the outreach
// engine; nothing sends until Sean approves the email once (template ready, list switched on). Changing its words puts it back to draft.
//
//   { action: 'tick' }                          the cron (x-cron-secret) or ops: refreshes the hosts, sends what is due on weekdays
//                                               10 AM to 5 PM Eastern, within the list's daily cap
//   { action: 'overview' }                      super admins: the switch, the email, every host and what is waiting for each
//   { action: 'preview', contact_id? }          super admins: {subject, html} for a host (else the host with the most new events)
//   { action: 'test', contact_id? }             super admins: that email to the signed-in admin, [Test] in the subject, nothing recorded
//   { action: 'template_save', subject, body }  super admins: new words; back to draft and switched off until approved again
//   { action: 'approve' }                       super admins: approves the email and switches the list on
//   { action: 'pause' } / { action: 'resume' }  super admins: the switch (resume only once approved)
//   { action: 'find_email', contact_id }        super admins: reads their own site, then Instagram bio (ve-groups find_contact)
//   { action: 'email_save', contact_id, email, source }  super admins: an email they publish, with where it is published
//   { action: 'stop', contact_id }              super admins: never email this host again
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FN_BASE = `${SUPABASE_URL}/functions/v1`;
const BRAND = 'vegans-explore';
const LIST = 'event-hosts';
const PROGRAM = 'event-heads-up';
const VE_TENANT = '00000000-0000-4000-a000-000000000002';
const SITE = 'https://vegansexplore.com';
const PER_TICK = 10;
const POSTAL = 'LESARUSS Inc., 300 SW 1st Ave, Suite 155, Fort Lauderdale, FL 33301';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isEmail = (v: unknown) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const CHAPTER_NAME: Record<string, string> = { 'south-florida': 'South Florida', 'central-florida': 'Central Florida', 'north-florida': 'North Florida', atlanta: 'Atlanta',
  'washington-dc': 'Washington, D.C.', delaware: 'Delaware', maryland: 'Maryland', virginia: 'Virginia', 'west-virginia': 'West Virginia', 'new-york': 'New York',
  philadelphia: 'Philadelphia', 'los-angeles': 'Los Angeles', seattle: 'Seattle', portland: 'Portland', london: 'London' };

function eastern(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', weekday: 'short', hour12: false })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, weekday: p.weekday as string };
}
const sendingHours = () => { const e = eastern(); return !['Sat', 'Sun'].includes(e.weekday) && e.hour >= 10 && e.hour < 17; };

async function secret(key: string) {
  const env = Deno.env.get(key); if (env) return env;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value && data.value !== 'pending' ? String(data.value) : null;
}
function fromB64u(s: string) { const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : ''; const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); }
async function memberFrom(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', k, fromB64u(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(fromB64u(p)));
    return d.k !== 'taster' && typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}

// ---------- The list, the email ----------
async function state() {
  const [{ data: list }, { data: tpl }] = await Promise.all([
    db.from('ve_outreach_cities').select('enabled, daily_cap, approved_at, approved_by, enabled_at, footer_reason').eq('community_slug', LIST).single(),
    db.from('ve_outreach_templates').select('subject, body, status, updated_at').eq('program', PROGRAM).eq('step', 1).single(),
  ]);
  return { list: list as any, tpl: tpl as any };
}
async function signoff(chapter: string | null) {
  if (chapter && CHAPTER_NAME[chapter]) {
    const slugs = chapter === 'washington-dc' ? ['washington-dc', 'dc'] : [chapter];
    const { data } = await db.from('members').select('name').eq('ve_role', 'community_manager').eq('membership_status', 'active').in('home_community', slugs).order('created_at').limit(1);
    const first = String(data?.[0]?.name || '').trim().split(/\s+/)[0];
    if (first) return { text: `${first}\nCommunity Manager, Vegans Explore ${CHAPTER_NAME[chapter]}`, cm: true };
  }
  return { text: 'The Vegans Explore team', cm: false };
}
function when(e: any) {
  const tz = e.timezone || 'America/New_York';
  const d = new Date(e.starts_at);
  let day: string;
  try { day = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: tz }); } catch { day = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' }); }
  if (e.time_set === false) return `${day}, time to be announced`;
  let t: string;
  try { t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }); } catch { t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }); }
  return `${day}, ${t}`;
}
const where = (e: any) => e.event_type === 'virtual' && !e.city ? 'Online' : [e.location_name, e.city].filter(Boolean).join(', ');
function linkCode() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  return 'eh-' + Array.from(crypto.getRandomValues(new Uint8Array(7)), (b) => abc[b % abc.length]).join('');
}
// One tracked link per host and event, made only when the email really goes.
async function trackedLink(c: any, e: any): Promise<string> {
  const dest = `/events?event=${e.id}`;
  const { data: had } = await db.from('ve_links').select('code').eq('initiative_slug', PROGRAM).eq('destination', dest).eq('recipient_email', c.email).limit(1);
  if (had?.[0]?.code) return `${SITE}/go/${had[0].code}`;
  for (let i = 0; i < 4; i++) {
    const code = linkCode();
    const { error } = await db.from('ve_links').insert({ code, label: `Heads-up: ${c.name}, ${e.title}`.slice(0, 120), destination: dest, initiative_slug: PROGRAM,
      tags: [PROGRAM, c.chapter || 'no-chapter', `event:${e.id}`], channel: 'email', recipient_email: c.email, recipient_name: c.name.slice(0, 120), active: true });
    if (!error) return `${SITE}/go/${code}`;
  }
  return `${SITE}${dest}`;
}

async function render(c: any, events: any[], opts: { track: boolean }) {
  const { tpl, list } = await state();
  const { data: l } = await db.from('listings').select('details').eq('id', c.listing_id).maybeSingle();
  const first = String((l as any)?.details?.group?.contact_name || '').trim().split(/\s+/)[0];
  const host = c.name;
  const many = events.length > 1;
  const sig = await signoff(c.chapter);
  const links = await Promise.all(events.map((e) => opts.track ? trackedLink(c, e) : Promise.resolve(`${SITE}/events?event=${e.id}`)));
  const vars: Record<string, string> = {
    host, greeting: first || `${host} team`, host_possessive: /s$/i.test(host) ? `${host}'` : `${host}'s`,
    events_word: many ? 'events are' : 'event is', it_them: many ? 'them' : 'it', signoff: sig.text,
  };
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  const subject = fill(String(tpl.subject));
  const textEvents = events.map((e, i) => `- ${e.title}\n  ${when(e)}${where(e) ? ', ' + where(e) : ''}\n  ${links[i]}`).join('\n\n');
  const htmlEvents = `<ul style="padding-left:20px;margin:6px 0 16px">` + events.map((e, i) =>
    `<li style="margin:0 0 12px"><a href="${links[i]}" style="color:#2D5C27;font-weight:700">${esc(e.title)}</a><br><span style="color:#444">${esc(when(e))}${where(e) ? ', ' + esc(where(e)) : ''}</span></li>`).join('') + `</ul>`;
  const body = fill(String(tpl.body));
  const text = body.replace('{events}', textEvents);
  const paras = body.split(/\n{2,}/).map((p) => p.trim() === '{events}' ? htmlEvents
    : `<p style="margin:0 0 16px">${esc(p).replace(/\{events\}/g, '').replace(/\n/g, '<br>')}</p>`).join('');
  const reason = `${esc(host)}'s events are listed on the Vegans Explore calendar`;
  const html = `<div style="font-family:Montserrat,Arial,sans-serif;max-width:560px;font-size:15px;line-height:1.6;color:#1a1a1a"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;border-collapse:collapse"><tr><td width="25%" style="background:#2D5C27;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="13%" style="background:#F69820;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="12%" style="background:#FF9EC4;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="13%" style="background:#FFEBD1;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="12%" style="background:#22C55E;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="13%" style="background:#E8F5E9;height:6px;line-height:6px;font-size:0">&nbsp;</td><td width="12%" style="background:#3A9B3E;height:6px;line-height:6px;font-size:0">&nbsp;</td></tr></table>` +
    `<p style="margin:0 0 18px"><img src="${SITE}/public/logo-ve-landscape-v2.png" alt="Vegans Explore" width="150" style="display:block;border:0"></p>${paras}` +
    `<p style="margin-top:28px;font-size:12px;line-height:1.5;color:#777">You are getting this because ${reason}. <a href="{{unsubscribe_url}}" style="color:#777">Stop these emails</a>. {{postal_address}}.</p></div>`;
  return { subject, html, text: `${text}\n\n--\nYou are getting this because ${host}'s events are listed on the Vegans Explore calendar.\nStop these emails: {{unsubscribe_url}}\n{{postal_address}}`,
    status: tpl.status, signed_by: sig.cm ? 'chapter' : 'team', enabled: !!list?.enabled };
}

async function emailSend(payload: Record<string, unknown>) {
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  try {
    const r = await fetch(`${FN_BASE}/email-send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` }, body: JSON.stringify(payload) });
    return await r.json().catch(() => ({ ok: false, error: `email-send ${r.status}` }));
  } catch (e) { return { ok: false, error: String(e) }; }
}
const refOf = () => { const d = eastern().date; return { ref: `ve-event-headsup-${d}`, name: `Event host heads-up (${d})` }; };
async function registerCampaign(ref: string, name: string, subject: string, html: string) {
  await db.from('email_campaigns').upsert({ brand_slug: BRAND, campaign_ref: ref, name: `${name}, automatic`, subject, html, status: 'sent',
    audience: { source: 've-event-headsup', automatic: true }, notes: 'Sent one host at a time by ve-event-headsup (the event host path, step 2). Switch it in Depot > Events > Heads-up.',
    started_at: new Date().toISOString(), completed_at: new Date().toISOString(), created_by: 've-event-headsup' }, { onConflict: 'campaign_ref', ignoreDuplicates: true });
}

async function contactEvents(contactId: string) {
  const { data } = await db.rpc('ve_event_host_new_events', { p_contact: contactId });
  return (data || []) as any[];
}

async function tick() {
  const refreshed = (await db.rpc('ve_event_hosts_refresh')).data;
  const { list, tpl } = await state();
  if (tpl?.status !== 'ready' || !list?.approved_at) return { refreshed, sent: 0, note: 'the email is not approved yet' };
  if (!list?.enabled) return { refreshed, sent: 0, note: 'the list is switched off' };
  if (!sendingHours()) return { refreshed, sent: 0, note: 'outside sending hours (weekdays 10 AM to 5 PM Eastern)' };
  const off = (new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' }).formatToParts(new Date()).find((x) => x.type === 'timeZoneName')?.value || 'GMT-5').replace('GMT', '');
  const start = new Date(`${eastern().date}T00:00:00${off.length <= 3 ? off.replace(/^([+-])(\d)$/, '$10$2') + ':00' : off}`).toISOString();
  const { count: today } = await db.from('ve_event_headsups').select('id', { count: 'exact', head: true }).in('result', ['sent', 'already_sent']).gte('sent_at', start);
  const room = Math.min(PER_TICK, Math.max(0, Number(list.daily_cap || 30) - (today || 0)));
  if (!room) return { refreshed, sent: 0, note: 'daily cap reached' };
  const { data: due } = await db.rpc('ve_event_heads_up_due', { p_limit: room });
  const out: unknown[] = [];
  for (const d of due || []) {
    const { data: c } = await db.from('ve_event_host_contacts').select('*').eq('id', d.contact_id).single();
    if (!c || c.status !== 'active' || !c.email) continue;
    const events = await contactEvents(c.id);
    if (!events.length) continue;
    const m = await render(c, events, { track: true });
    const { ref, name } = refOf();
    const res: any = await emailSend({ brand: BRAND, campaign_ref: ref, list_ref: 've-event-hosts', subject: m.subject, html: m.html, text: m.text,
      recipients: [{ email: c.email, name: c.name }] });
    const r = res?.results?.[0] || { result: 'failed', error: res?.error || (res?.errors || []).join('; ') };
    await db.from('ve_event_headsups').insert({ contact_id: c.id, email: c.email, event_ids: events.map((e) => e.id), subject: m.subject, result: r.result, send_id: r.id || null, error: r.error || null });
    if (r.result === 'sent' || r.result === 'already_sent') {
      await db.from('ve_event_host_contacts').update({ last_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', c.id);
      if (r.result === 'sent') await registerCampaign(ref, name, m.subject, m.html);
    } else if (r.result === 'suppressed') {
      await db.from('ve_event_host_contacts').update({ status: 'stopped', status_note: 'Asked us to stop emailing', stopped_at: new Date().toISOString() }).eq('id', c.id);
    } else if (r.result === 'invalid') {
      await db.from('ve_event_host_contacts').update({ status: 'held', status_note: 'The email address is not valid' }).eq('id', c.id);
    }
    out.push({ host: c.name, events: events.length, result: r.result });
  }
  return { refreshed, sent: out.filter((o: any) => o.result === 'sent').length, results: out };
}

// The host to show in a preview: the one asked for, else the host with the most new events (a made-up email if it has none).
async function previewContact(id?: string) {
  if (isId(id)) { const { data } = await db.from('ve_event_host_contacts').select('*').eq('id', id).maybeSingle(); if (data) return data; }
  const { data: all } = await db.from('ve_event_host_contacts').select('*').order('name');
  let best: any = null, n = -1;
  for (const c of all || []) { const k = (await contactEvents(c.id)).length; if (k > n) { best = c; n = k; } }
  return best;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  const ops = !!admin && bearer === admin;

  if (action === 'tick') {
    const cs = req.headers.get('x-cron-secret');
    if (!(cs && cs === (await secret('CRON_SECRET'))) && !ops) return json({ error: 'forbidden' }, 403);
    return json({ ok: true, ...(await tick()) });
  }

  let me: any = null;
  if (ops && isId(body.as_member)) { const { data } = await db.from('members').select('id, email, name, is_superadmin').eq('id', body.as_member).maybeSingle(); me = data; }
  else if (!ops) {
    const id = bearer ? await memberFrom(bearer) : null;
    if (id) { const { data } = await db.from('members').select('id, email, name, is_superadmin').eq('id', id).maybeSingle(); me = data; }
    if (!me?.is_superadmin) return json({ error: 'forbidden' }, 403);
  }

  if (action === 'overview') {
    await db.rpc('ve_event_hosts_refresh');
    const { list, tpl } = await state();
    const { data: cs } = await db.from('ve_event_host_contacts').select('*').order('name');
    const { data: sends } = await db.from('ve_event_headsups').select('contact_id, sent_at, result, event_ids, error').order('sent_at', { ascending: false }).limit(500);
    const hosts = await Promise.all((cs || []).map(async (c: any) => {
      const evs = await contactEvents(c.id);
      const mine = (sends || []).filter((s: any) => s.contact_id === c.id);
      const next = c.status !== 'active' || !evs.length ? null
        : !c.last_sent_at || Date.parse(c.last_sent_at) < Date.now() - 14 * 864e5 ? 'next send window' : new Date(Date.parse(c.last_sent_at) + 14 * 864e5).toISOString();
      return { id: c.id, listing_id: c.listing_id, name: c.name, email: c.email, email_source: c.email_source, chapter: c.chapter, chapter_name: CHAPTER_NAME[c.chapter] || null,
        status: c.status, status_note: c.status_note, last_sent_at: c.last_sent_at, waiting: evs.map((e) => ({ id: e.id, title: e.title, when: when(e) })), next, sends: mine.slice(0, 10) };
    }));
    const { data: l } = await db.from('listings').select('id, slug, category, website, instagram').in('id', hosts.map((h) => h.listing_id));
    const byId = new Map((l || []).map((x: any) => [x.id, x]));
    return json({ ok: true, list, template: tpl, hosts: hosts.map((h) => ({ ...h, listing: byId.get(h.listing_id) || null })), sending_hours: 'Weekdays, 10 AM to 5 PM Eastern' });
  }

  if (action === 'preview' || action === 'test') {
    const c = await previewContact(body.contact_id);
    if (!c) return json({ error: 'no_host' }, 404);
    let events = await contactEvents(c.id);
    if (!events.length) {
      const { data } = await db.from('events').select('*').eq('host_listing_id', c.listing_id).eq('status', 'approved').eq('tenant_id', VE_TENANT).gt('starts_at', new Date().toISOString()).order('starts_at').limit(3);
      events = data || [];
    }
    if (!events.length) return json({ error: 'no_events', message: 'This host has no upcoming events.' }, 404);
    const m = await render({ ...c, email: c.email || 'host@example.org' }, events, { track: false });
    if (action === 'preview') return json({ ok: true, host: c.name, to: c.email, subject: m.subject, status: m.status, enabled: m.enabled, signed_by: m.signed_by,
      html: m.html.replace(/\{\{\s*unsubscribe_url\s*\}\}/g, '#').replace(/\{\{\s*postal_address\s*\}\}/g, POSTAL) });
    const to = me?.email || '';
    if (!isEmail(to)) return json({ error: 'no_address' }, 400);
    const res: any = await emailSend({ brand: BRAND, campaign_ref: `ve-event-headsup-test-${Date.now()}`, list_ref: 've-event-hosts', subject: '[Test] ' + m.subject, html: m.html, text: m.text,
      recipients: [{ email: c.email || to, name: c.name }], test_to: [to] });
    const r = res?.results?.[0];
    return r?.result === 'sent' ? json({ ok: true, to, host: c.name }) : json({ error: 'send_failed', message: r?.error || res?.error || (res?.errors || []).join('; ') || 'email-send' }, 502);
  }

  if (action === 'template_save') {
    const subject = String(body.subject || '').trim().slice(0, 200), text = String(body.body || '').replace(/\r/g, '').trim().slice(0, 4000);
    if (!subject || !text) return json({ error: 'empty', message: 'The subject and the email both need words.' }, 400);
    if (!text.includes('{events}')) return json({ error: 'events', message: 'Keep {events} in the email: it is where their events go.' }, 400);
    if (/\$\s?\d|\bprice|\bfee\b|\bcost/i.test(subject + ' ' + text)) return json({ error: 'price', message: 'No prices in the heads-up.' }, 400);
    if (/\bsean\b/i.test(subject + ' ' + text)) return json({ error: 'name', message: 'The heads-up is from the team; leave Sean\'s name out.' }, 400);
    await db.from('ve_outreach_templates').update({ subject, body: text, status: 'draft', updated_at: new Date().toISOString() }).eq('program', PROGRAM).eq('step', 1);
    await db.from('ve_outreach_cities').update({ enabled: false, approved_at: null, approved_by: null, updated_at: new Date().toISOString() }).eq('community_slug', LIST);
    return json({ ok: true, status: 'draft' });
  }

  if (action === 'approve') {
    const now = new Date().toISOString();
    await db.from('ve_outreach_templates').update({ status: 'ready', updated_at: now }).eq('program', PROGRAM).eq('step', 1);
    await db.from('ve_outreach_cities').update({ enabled: true, approved_at: now, approved_by: me?.id || null, enabled_at: now, enabled_by: me?.email || 'ops', updated_at: now }).eq('community_slug', LIST);
    return json({ ok: true });
  }
  if (action === 'pause' || action === 'resume') {
    const { tpl, list } = await state();
    if (action === 'resume' && (tpl?.status !== 'ready' || !list?.approved_at)) return json({ error: 'not_approved', message: 'Approve the email first.' }, 409);
    await db.from('ve_outreach_cities').update({ enabled: action === 'resume', ...(action === 'resume' ? { enabled_at: new Date().toISOString(), enabled_by: me?.email || 'ops' } : {}), updated_at: new Date().toISOString() }).eq('community_slug', LIST);
    return json({ ok: true, enabled: action === 'resume' });
  }

  if (action === 'find_email' || action === 'email_save' || action === 'stop') {
    if (!isId(body.contact_id)) return json({ error: 'contact_id' }, 400);
    const { data: c } = await db.from('ve_event_host_contacts').select('*').eq('id', body.contact_id).maybeSingle();
    if (!c) return json({ error: 'not_found' }, 404);
    if (action === 'stop') {
      await db.from('ve_event_host_contacts').update({ status: 'stopped', status_note: 'Stopped by the team', stopped_at: new Date().toISOString() }).eq('id', c.id);
      return json({ ok: true });
    }
    if (action === 'email_save') {
      const email = String(body.email || '').trim().toLowerCase(), source = String(body.source || '').trim().slice(0, 300);
      if (!isEmail(email)) return json({ error: 'bad_email', message: 'That email does not look right.' }, 400);
      if (!source) return json({ error: 'source', message: 'Say where they publish it (a page link): we only email what a host publishes.' }, 400);
      const { data: l } = await db.from('listings').select('category').eq('id', c.listing_id).maybeSingle();
      if (l?.category === 'Groups') {
        const r = await fetch(`${FN_BASE}/ve-groups`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` },
          body: JSON.stringify({ action: 'contact_save', listing_id: c.listing_id, email, source }) });
        if (!r.ok) return json({ error: 'save_failed' }, 502);
      }
      await db.from('ve_event_host_contacts').update({ email, email_source: source, updated_at: new Date().toISOString() }).eq('id', c.id);
      await db.rpc('ve_event_hosts_refresh');
      return json({ ok: true });
    }
    const { data: l } = await db.from('listings').select('category').eq('id', c.listing_id).maybeSingle();
    if (l?.category !== 'Groups') return json({ error: 'not_group', message: 'Find email reads groups only; type in an email they publish.' }, 400);
    const r = await fetch(`${FN_BASE}/ve-groups`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` },
      body: JSON.stringify({ action: 'find_contact', listing_id: c.listing_id }) });
    const d = await r.json().catch(() => ({}));
    await db.rpc('ve_event_hosts_refresh');
    return json({ ok: true, email: d.email || null, source: d.source || null, tried: d.tried || [] });
  }

  return json({ error: 'unknown_action' }, 400);
});
