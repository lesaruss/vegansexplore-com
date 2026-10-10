// ve-outreach: business outreach, city by city, approved by Sean (2026-10-10). Depot > Business outreach calls it.
// "I would like to be able to see who is on the queue, approve who the emails are going to be going out to... on Monday,
// we're sending it to these 60... I could even go in and see what the draft is that's going to be sent to them."
//
// Superadmin (Bearer <ve_token>), POST { action, ... }
//   overview                          cities (counts, switch, 15-day commitment), batches, templates
//   batch       { batch_id }          the businesses in a batch, with who they are and their page
//   waiting     { city }              Not sent yet and in no batch
//   preview     { contact_id }        the three emails exactly as they go out
//   plan        { city, start, sizes } propose batches: sizes[i] businesses on the i-th weekday from start
//   approve     { batch_id }          approves the batch (the whole sequence for those businesses)
//   cancel      { batch_id }          cancels a proposed batch; its businesses go back to waiting
//   remove      { contact_id, hold? } takes a business out of its batch (hold: never email it)
//   contact     { contact_id, email?, contact_name? }  fix a row before approving
//   city        { city, enabled }     the city's switch (nothing sends while it is off)
//   find_emails { city, limit? }      reads listings' own websites for a published email (never guessed)
// Ops (Bearer <LESARUSS_ADMIN_TOKEN>, Logan and crons): overview, batch, waiting, preview, plan and find_emails only.
// Approving, changing a row and the city switch need a signed-in superadmin (Sean's call).
//
//   test        { contact_id, step?, to? }  sends that business's real email to you (or to), marked as a test
//   interested                        the interest queue: who clicked, replied or claimed, and who it is routed to
//
// Cron (x-cron-secret, ve-outreach-send every 10 minutes), or the admin token:
//   tick   reads what businesses did (ve_outreach_sync), then sends what ve_outreach_due() returns: approved send days
//          in cities that are switched on, weekdays 9 AM to 5 PM Eastern, at most PER_TICK at a time, within each
//          city's daily cap and the sending domain's warm-up allowance. Every email goes through email-send (from Sean,
//          replies to contact@lesaruss.com, one-click unsubscribe, the postal address, an email_sends row), and the page
//          link is the business's own tracked /go/ link (ve_links, campaign business-outreach).
// verify_jwt is false on deploy; tokens are verified here the way ve-links does it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function b64urlDecodeToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// Same key derivation as ve-auth's signJWT / decodeToken.
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlDecodeToBytes(sig), new TextEncoder().encode(`${header}.${payload}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(payload)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function adminId(req: Request): Promise<string | null> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const id = token ? await verifyToken(token) : null;
  if (!id) return null;
  const { data } = await db.from('members').select('is_superadmin').eq('id', id).maybeSingle();
  return data?.is_superadmin ? id : null;
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

// ---- Email finder: only what a business publishes on its own website ----
const SKIP_HOST = /(^|\.)(vegansexplore\.com|facebook\.com|instagram\.com|linktr\.ee|yelp\.com|google\.com|tiktok\.com)$/i;
const BAD_EMAIL = /\.(png|jpe?g|gif|webp|svg|css|js)$|@(example|domain|email|mysite|yoursite|yourdomain|website|test|sentry|wixpress|sentry-next|godaddy|squarespace|shopify)\.|^(no-?reply|donotreply|privacy|legal|abuse|webmaster|careers|jobs|hr)@/i;
const GOOD_LOCAL = ['owner', 'hello', 'info', 'contact', 'catering', 'events', 'hi', 'team', 'orders', 'eat', 'office'];

function cfDecode(hex: string): string {
  const key = parseInt(hex.slice(0, 2), 16);
  let out = '';
  for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
  return out;
}
function emailsIn(html: string): string[] {
  const found = new Set<string>();
  for (const m of html.matchAll(/mailto:([^"'?\s>]+)/gi)) found.add(decodeURIComponent(m[1]).toLowerCase());
  for (const m of html.matchAll(/data-cfemail="([0-9a-f]+)"/gi)) found.add(cfDecode(m[1]).toLowerCase());
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&#64;|&commat;|\s?\[at\]\s?|\s?\(at\)\s?/gi, '@');
  for (const m of text.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) found.add(m[0].toLowerCase());
  return [...found].map((e) => e.replace(/^[.]+|[.]+$/g, '')).filter((e) => isEmail(e) && !BAD_EMAIL.test(e));
}
function best(emails: string[], host: string): string | null {
  const root = host.replace(/^www\./, '').split('.').slice(-2).join('.');
  const score = (e: string) => {
    const [local, dom] = e.split('@');
    let s = 0;
    if (dom.endsWith(root)) s += 10;
    else if (/^(gmail|yahoo|outlook|hotmail|icloud|aol)\./.test(dom)) s += 4;
    const i = GOOD_LOCAL.indexOf(local);
    if (i >= 0) s += 6 - i * 0.3;
    if (/press|media|marketing|pr$/.test(local)) s -= 3;
    return s;
  };
  return emails.sort((a, b) => score(b) - score(a))[0] || null;
}
async function fetchText(url: string): Promise<string> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VegansExploreDirectory/1.0; +https://vegansexplore.com/directory)', Accept: 'text/html' } });
    if (!r.ok || !(r.headers.get('content-type') || '').includes('html')) return '';
    return (await r.text()).slice(0, 600_000);
  } catch { return ''; } finally { clearTimeout(t); }
}
async function lookup(website: string): Promise<{ email: string | null; source: string | null; note: string }> {
  let base: URL;
  try { base = new URL(/^https?:\/\//i.test(website) ? website : 'https://' + website); } catch { return { email: null, source: null, note: 'bad website' }; }
  if (SKIP_HOST.test(base.hostname)) return { email: null, source: null, note: 'no own website' };
  const home = base.origin + (base.pathname.length > 1 ? base.pathname : '/');
  const pages = [home, base.origin + '/contact', base.origin + '/contact-us', base.origin + '/about'];
  let opened = 0;
  for (const p of [...new Set(pages)]) {
    const html = await fetchText(p);
    if (!html) continue;
    opened++;
    const e = best(emailsIn(html), base.hostname);
    if (e) return { email: e, source: p, note: '' };
  }
  return { email: null, source: null, note: opened ? 'no email on site' : 'site did not open' };
}

// ---- Sending ----
const SITE = 'https://vegansexplore.com';
const FN_BASE = `${SUPABASE_URL}/functions/v1`;
const BRAND = 'lesaruss';            // Sean A. Russell <sean@mail.lesaruss.ai>, replies to contact@lesaruss.com
const PER_TICK = 6;                  // 6 every 10 minutes: a day of 30 goes out over about an hour, not in one burst
async function secretValue(key: string): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return (data?.value as string) ?? null;
}
function eastern(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit' }).formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour, weekday: p.weekday as string };
}
function sendingHours() { const e = eastern(); return !['Sat', 'Sun'].includes(e.weekday) && e.hour >= 9 && e.hour < 17; }
// The next email's time: that many days on, moved off the weekend, at 10 AM Eastern (14:00 UTC; 9 AM in winter).
function nextSendAt(days: number): string {
  const e = eastern();
  const d = new Date(e.date + 'T14:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}
const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// A plain, personal-looking email: Sean's words, their links, and the required footer.
function toHtml(body: string, business: string): string {
  const paras = escHtml(body).split(/\n{2,}/).map((p) => '<p style="margin:0 0 16px">' +
    p.replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" style="color:#1f5f22">${u}</a>`).replace(/\n/g, '<br>') + '</p>').join('');
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px">${paras}` +
    `<p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#777">You are getting this because ${escHtml(business)} is listed in the Vegans Explore Directory. ` +
    `<a href="{{unsubscribe_url}}" style="color:#777">Don't email me again</a>.<br>{{postal_address}}</p></div>`;
}
function toText(body: string, business: string): string {
  return `${body}\n\n--\nYou are getting this because ${business} is listed in the Vegans Explore Directory.\nDon't email me again: {{unsubscribe_url}}\n{{postal_address}}`;
}
function linkCode() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  return 'bo-' + Array.from(crypto.getRandomValues(new Uint8Array(7)), (b) => abc[b % abc.length]).join('');
}
type Contact = { id: string; listing_id: string; community_slug: string; email: string; contact_name: string | null; segment: string; step: number; link_code: string | null };
// The business's personal tracked link to its page, made once and used in all three emails.
async function ensureLink(c: Contact, name: string, slug: string): Promise<string> {
  if (c.link_code) return c.link_code;
  for (let i = 0; i < 4; i++) {
    const code = linkCode();
    const { error } = await db.from('ve_links').insert({
      code, label: ('Outreach: ' + name).slice(0, 120), destination: '/directory/' + slug, initiative_slug: 'business-outreach',
      tags: ['business-outreach', c.community_slug, c.segment], channel: 'email', recipient_email: c.email.slice(0, 200),
      recipient_name: (c.contact_name || name).slice(0, 120), active: true,
    });
    if (!error) { await db.from('ve_outreach_contacts').update({ link_code: code }).eq('id', c.id); return code; }
  }
  throw new Error('could not make a tracked link');
}
async function emailSend(payload: Record<string, unknown>) {
  const admin = await secretValue('LESARUSS_ADMIN_TOKEN');
  const r = await fetch(`${FN_BASE}/email-send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` }, body: JSON.stringify(payload) });
  return await r.json().catch(() => ({ ok: false, error: `email-send ${r.status}` }));
}
// Render one step for one business, with its tracked link in place of the page address.
// A test keeps the plain page address, so a test click never counts as the business's interest.
async function build(c: Contact, step: number, test = false) {
  const { data: l } = await db.from('listings').select('name,slug').eq('id', c.listing_id).single();
  const { data: r } = await db.rpc('ve_outreach_render', { p_contact: c.id, p_step: step });
  const m = r?.[0];
  if (!l || !m) throw new Error('could not render');
  const code = test ? null : await ensureLink(c, l.name, l.slug);
  const body = code ? String(m.body).split(m.page_url).join(`${SITE}/go/${code}`) : String(m.body);
  return { subject: String(m.subject), html: toHtml(body, l.name), text: toText(body, l.name), name: l.name, code };
}
async function tick() {
  const synced = (await db.rpc('ve_outreach_sync')).data;
  if (!sendingHours()) return { synced, sent: 0, note: 'outside sending hours (weekdays 9 AM to 5 PM Eastern)' };
  const { data: brand } = await db.from('email_brands').select('from_email').eq('slug', BRAND).single();
  const domain = String(brand?.from_email || '').split('@')[1] || '';
  const { data: w } = await db.rpc('email_warmup_allowance', { p_domain: domain });
  const warm = w?.[0];
  let room = warm?.enabled ? Math.max(0, warm.allowance - warm.sent_today) : PER_TICK;
  room = Math.min(room, PER_TICK);
  if (room <= 0) return { synced, sent: 0, note: 'warm-up allowance used for today' };
  const { data: due } = await db.rpc('ve_outreach_due', { p_limit: 50 });
  const { data: today } = await db.rpc('ve_outreach_sent_today');
  const { data: cities } = await db.from('ve_outreach_cities').select('community_slug,daily_cap');
  const { data: tpl } = await db.from('ve_outreach_templates').select('step,day_offset').order('step');
  const capLeft = new Map((cities || []).map((c) => [c.community_slug, c.daily_cap - Number((today || []).find((t: { community_slug: string }) => t.community_slug === c.community_slug)?.n || 0)]));
  const out: unknown[] = [];
  for (const d of due || []) {
    if (out.length >= room) break;
    if ((capLeft.get(d.community_slug) ?? 0) <= 0) continue;
    const { data: c } = await db.from('ve_outreach_contacts').select('id,listing_id,community_slug,email,contact_name,segment,step,link_code,status').eq('id', d.contact_id).single();
    if (!c || c.step + 1 !== d.next_step || !['not_sent', 'in_sequence'].includes(c.status)) continue;
    const step = d.next_step as number;
    try {
      const m = await build(c as Contact, step);
      const first = (c.contact_name || '').trim().split(/\s+/)[0] || undefined;
      const res = await emailSend({ brand: BRAND, campaign_ref: `ve-outreach-${c.id}-${step}`, list_ref: `ve-outreach:${c.community_slug}`,
        subject: m.subject, html: m.html, text: m.text, recipients: [{ email: c.email, first_name: first, name: c.contact_name || undefined }] });
      const result = res?.results?.[0]?.result || (res?.ok ? 'unknown' : 'failed');
      if (result === 'sent' || result === 'already_sent') {
        const off = (tpl || []).find((t) => t.step === step)?.day_offset ?? 0;
        const nextOff = (tpl || []).find((t) => t.step === step + 1)?.day_offset;
        await db.from('ve_outreach_contacts').update({ step, status: nextOff == null ? 'finished' : 'in_sequence', last_sent_at: new Date().toISOString(),
          next_send_at: nextOff == null ? null : nextSendAt(nextOff - off) }).eq('id', c.id);
        await db.from('ve_outreach_events').insert({ contact_id: c.id, kind: 'sent', step, detail: { resend_id: res.results?.[0]?.id || null, link: m.code } });
        capLeft.set(c.community_slug, (capLeft.get(c.community_slug) ?? 1) - 1);
      } else if (result === 'suppressed') {
        await db.from('ve_outreach_contacts').update({ status: 'opted_out', stop_reason: 'on the do-not-email list' }).eq('id', c.id);
      } else if (result === 'invalid') {
        await db.from('ve_outreach_contacts').update({ status: 'held', stop_reason: 'the email address is not valid' }).eq('id', c.id);
      } else {
        await db.from('ve_outreach_events').insert({ contact_id: c.id, kind: 'note', step, detail: { send_failed: res?.results?.[0]?.error || res?.error || res?.errors || 'unknown' } });
        const { count } = await db.from('ve_outreach_events').select('id', { count: 'exact', head: true }).eq('contact_id', c.id).eq('kind', 'note');
        if ((count || 0) >= 3) await db.from('ve_outreach_contacts').update({ status: 'held', stop_reason: 'sending failed three times' }).eq('id', c.id);
      }
      out.push({ business: m.name, step, result });
    } catch (e) {
      out.push({ contact: c.id, step, result: 'error', error: String((e as Error).message || e) });
    }
  }
  if (out.length) await db.rpc('ve_outreach_sync');
  return { synced, sent: out.filter((o) => (o as { result: string }).result === 'sent').length, results: out };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    if (action === 'tick') {
      const cron = req.headers.get('x-cron-secret');
      const given = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const [cs, at] = await Promise.all([secretValue('CRON_SECRET'), secretValue('LESARUSS_ADMIN_TOKEN')]);
      if (!((cron && cs && cron === cs) || (given && at && given === at))) return json({ error: 'unauthorized' }, 401);
      const r = await tick();
      await db.from('email_heartbeats').upsert({ name: 've-outreach', last_ok_at: new Date().toISOString(), detail: r, updated_at: new Date().toISOString() });
      return json({ ok: true, ...r });
    }
    const me = await adminId(req);
    if (!me) {
      const OPS = ['overview', 'batch', 'waiting', 'preview', 'plan', 'find_emails', 'interested', 'test'];
      const { data: sec } = await db.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle();
      const given = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      if (!(sec?.value && given === sec.value && OPS.includes(action))) return json({ error: 'admins_only' }, 403);
    }

    if (action === 'overview') {
      const [{ data: cities }, { data: batches }, { data: templates }, { data: contacts }] = await Promise.all([
        db.from('ve_outreach_cities').select('community_slug,name,enabled,daily_cap,committed_until').order('name'),
        db.from('ve_outreach_batches').select('id,community_slug,send_on,status,approved_at').neq('status', 'cancelled').order('send_on'),
        db.from('ve_outreach_templates').select('step,day_offset,subject,body,status').order('step'),
        db.from('ve_outreach_contacts').select('community_slug,status,batch_id'),
      ]);
      const counts: Record<string, Record<string, number>> = {};
      const inBatch: Record<string, number> = {};
      for (const c of contacts || []) {
        const k = counts[c.community_slug] ||= {};
        const s = c.status === 'not_sent' && !c.batch_id ? 'waiting' : c.status;
        k[s] = (k[s] || 0) + 1;
        if (c.batch_id) inBatch[c.batch_id] = (inBatch[c.batch_id] || 0) + 1;
      }
      return json({ ok: true, today: today(), cities: (cities || []).map((c) => ({ ...c, counts: counts[c.community_slug] || {} })),
        batches: (batches || []).map((b) => ({ ...b, size: inBatch[b.id] || 0 })), templates });
    }

    if (action === 'batch' || action === 'waiting') {
      let q = db.from('ve_outreach_contacts').select('id,listing_id,community_slug,email,email_source,contact_name,segment,status,step,batch_id,notes');
      if (action === 'batch') { if (!isId(body.batch_id)) return json({ error: 'batch_id' }, 400); q = q.eq('batch_id', body.batch_id); }
      else q = q.eq('community_slug', clean(body.city, 60)).eq('status', 'not_sent').is('batch_id', null);
      const { data: rows } = await q.order('segment').order('created_at').limit(500);
      const ids = (rows || []).map((r) => r.listing_id);
      const { data: ls } = ids.length ? await db.from('listings')
        .select('id,name,slug,category,address_city,logo_url,tagline,brief_summary,vote_count,vegan_status,website,instagram')
        .in('id', ids) : { data: [] };
      const byId = new Map((ls || []).map((l) => [l.id, l]));
      const guides = await Promise.all(ids.map((id) => db.rpc('ve_outreach_guides', { p_listing: id })));
      return json({ ok: true, rows: (rows || []).map((r, i) => ({ ...r, listing: byId.get(r.listing_id) || null, guides: (guides[i].data || []).map((g: { title: string }) => g.title) })) });
    }

    if (action === 'preview') {
      if (!isId(body.contact_id)) return json({ error: 'contact_id' }, 400);
      const steps = await Promise.all([1, 2, 3].map((s) => db.rpc('ve_outreach_render', { p_contact: body.contact_id, p_step: s })));
      const { data: t } = await db.from('ve_outreach_templates').select('step,day_offset').order('step');
      return json({ ok: true, emails: steps.map((r, i) => ({ step: i + 1, day: t?.[i]?.day_offset ?? null, ...(r.data?.[0] || {}) })) });
    }

    if (action === 'plan') {
      const city = clean(body.city, 60), start = clean(body.start, 10);
      const sizes = (Array.isArray(body.sizes) ? body.sizes : []).map((n: unknown) => Math.max(0, Math.min(200, Math.floor(Number(n) || 0)))).filter((n: number) => n > 0).slice(0, 15);
      if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !sizes.length) return json({ error: 'city, start and sizes' }, 400);
      if (start < today()) return json({ error: 'start_in_past' }, 400);
      const { data, error } = await db.rpc('ve_outreach_plan', { p_city: city, p_start: start, p_sizes: sizes });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, planned: data });
    }

    if (action === 'approve' || action === 'cancel') {
      if (!isId(body.batch_id)) return json({ error: 'batch_id' }, 400);
      const { data: b } = await db.from('ve_outreach_batches').select('*').eq('id', body.batch_id).maybeSingle();
      if (!b || b.status !== 'proposed') return json({ error: 'not_proposed' }, 400);
      if (action === 'cancel') {
        await db.from('ve_outreach_contacts').update({ batch_id: null }).eq('batch_id', b.id);
        await db.from('ve_outreach_batches').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', b.id);
        return json({ ok: true });
      }
      await db.from('ve_outreach_batches').update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: me, updated_at: new Date().toISOString() }).eq('id', b.id);
      // The first approval in a city starts its 15-day commitment.
      const { data: c } = await db.from('ve_outreach_cities').select('committed_until').eq('community_slug', b.community_slug).single();
      if (!c?.committed_until) {
        const until = new Date(b.send_on + 'T12:00:00Z'); until.setUTCDate(until.getUTCDate() + 15);
        await db.from('ve_outreach_cities').update({ committed_until: until.toISOString().slice(0, 10), updated_at: new Date().toISOString() }).eq('community_slug', b.community_slug);
      }
      return json({ ok: true });
    }

    if (action === 'remove' || action === 'contact') {
      if (!isId(body.contact_id)) return json({ error: 'contact_id' }, 400);
      const { data: c } = await db.from('ve_outreach_contacts').select('id,status,batch_id').eq('id', body.contact_id).maybeSingle();
      if (!c || c.status !== 'not_sent') return json({ error: 'already_started' }, 400);
      if (c.batch_id) {
        const { data: b } = await db.from('ve_outreach_batches').select('status').eq('id', c.batch_id).single();
        if (b?.status !== 'proposed') return json({ error: 'batch_approved' }, 400);
      }
      const patch: Record<string, unknown> = {};
      if (action === 'remove') { patch.batch_id = null; if (body.hold) { patch.status = 'held'; patch.stop_reason = 'taken out by Sean'; } }
      else {
        const email = clean(body.email, 200).toLowerCase();
        if (email) { if (!isEmail(email)) return json({ error: 'bad_email' }, 400); patch.email = email; patch.email_source = 'typed in the Depot'; }
        if (typeof body.contact_name === 'string') patch.contact_name = clean(body.contact_name, 120) || null;
      }
      await db.from('ve_outreach_contacts').update(patch).eq('id', c.id);
      if (body.hold) await db.from('ve_outreach_events').insert({ contact_id: c.id, kind: 'status', detail: { status: 'held', by: me } });
      return json({ ok: true });
    }

    if (action === 'test') {
      // Signed-in admins send a real test; the ops token may only dry-run (render and pass email-send's checks, send nothing).
      const dry = body.dry_run === true;
      if ((!me && !dry) || !isId(body.contact_id)) return json({ error: 'admins_only' }, 403);
      const step = [1, 2, 3].includes(Number(body.step)) ? Number(body.step) : 1;
      let to = clean(body.to, 200).toLowerCase();
      if (!to && me) { const { data: m } = await db.from('members').select('email').eq('id', me).single(); to = String(m?.email || '').toLowerCase(); }
      if (!to && dry) to = 'dry-run@vegansexplore.com';
      if (!isEmail(to)) return json({ error: 'bad_email' }, 400);
      const { data: c } = await db.from('ve_outreach_contacts').select('id,listing_id,community_slug,email,contact_name,segment,step,link_code').eq('id', body.contact_id).single();
      if (!c) return json({ error: 'contact' }, 400);
      const m = await build(c as Contact, step, true);
      const res = await emailSend({ brand: BRAND, campaign_ref: `ve-outreach-test-${c.id}-${step}`, subject: '[Test] ' + m.subject, html: m.html, text: m.text,
        test_to: [to], dry_run: dry, recipients: [{ email: to, first_name: (c.contact_name || '').split(/\s+/)[0] || undefined }] });
      return json({ ok: !!res?.ok, to, result: res?.results?.[0]?.result || res?.error || res?.errors, preview: dry ? res?.preview : undefined });
    }

    if (action === 'interested') {
      const { data: rows } = await db.from('ve_outreach_contacts').select('id,listing_id,community_slug,email,contact_name,status,stop_reason,step,route_to,assigned_member_id,interested_at,joined_at,updated_at')
        .in('status', ['interested', 'joined']).order('updated_at', { ascending: false }).limit(300);
      const ids = (rows || []).map((r) => r.listing_id);
      const { data: ls } = ids.length ? await db.from('listings').select('id,name,slug,category,address_city,phone').in('id', ids) : { data: [] };
      const mids = [...new Set((rows || []).map((r) => r.assigned_member_id).filter(Boolean))];
      const { data: ms } = mids.length ? await db.from('members').select('id,name').in('id', mids) : { data: [] };
      const L = new Map((ls || []).map((l) => [l.id, l])), M = new Map((ms || []).map((m) => [m.id, m.name]));
      return json({ ok: true, rows: (rows || []).map((r) => ({ ...r, listing: L.get(r.listing_id) || null, assigned_name: r.assigned_member_id ? M.get(r.assigned_member_id) || null : null })) });
    }

    if (action === 'city') {
      const city = clean(body.city, 60);
      const { error } = await db.from('ve_outreach_cities').update({ enabled: !!body.enabled, enabled_at: body.enabled ? new Date().toISOString() : null, enabled_by: me, updated_at: new Date().toISOString() }).eq('community_slug', city);
      return error ? json({ error: error.message }, 400) : json({ ok: true });
    }

    if (action === 'find_emails') {
      const city = clean(body.city, 60);
      const limit = Math.max(1, Math.min(30, Number(body.limit) || 20));
      const { data: oc } = await db.from('ve_outreach_cities').select('*').eq('community_slug', city).maybeSingle();
      if (!oc) return json({ error: 'city' }, 400);
      const { data: tried } = await db.from('ve_outreach_lookups').select('listing_id');
      const { data: have } = await db.from('ve_outreach_contacts').select('listing_id');
      const skip = new Set([...(tried || []), ...(have || [])].map((r) => r.listing_id));
      let q = db.from('listings').select('id,name,website,category,address_city,address_state').eq('status', 'approved')
        .is('owner_member_id', null).is('claimed_by_member_id', null).not('website', 'is', null).limit(1000);
      if (city === 'brands') q = q.in('category', ['Food Brands', 'Brands']);
      else { if (oc.cities) q = q.in('address_city', oc.cities); if (oc.states) q = q.in('address_state', oc.states); }
      const { data: ls } = await q;
      const todo = (ls || []).filter((l) => !skip.has(l.id) && l.website && (city === 'brands' || !['Food Brands', 'Brands'].includes(l.category))).slice(0, limit);
      const out: { name: string; email: string | null; note: string }[] = [];
      for (let i = 0; i < todo.length; i += 6) {
        await Promise.all(todo.slice(i, i + 6).map(async (l) => {
          const r = await lookup(l.website);
          await db.from('ve_outreach_lookups').upsert({ listing_id: l.id, tried_at: new Date().toISOString(), email: r.email, source_url: r.source, note: r.note });
          if (r.email) {
            await db.from('ve_outreach_contacts').insert({ listing_id: l.id, community_slug: city, email: r.email, segment: city === 'brands' ? 'brand' : 'business', email_source: r.source });
          }
          out.push({ name: l.name, email: r.email, note: r.note });
        }));
      }
      const left = (ls || []).filter((l) => !skip.has(l.id) && l.website).length - todo.length;
      return json({ ok: true, checked: out.length, found: out.filter((o) => o.email).length, left: Math.max(0, left), results: out });
    }

    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
