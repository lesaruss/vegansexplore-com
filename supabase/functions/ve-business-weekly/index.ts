// ve-business-weekly: the business dashboard's weekly email (playbook ve-business-dashboard, build step 4; Sean, 2026-11-13: "go ahead with
// the weekly email"; the approved mock /mocks/business-dashboard slide 7; migration 20261113_ve_business_weekly.sql). Copied from
// ve-nurture's pattern: email-send, one campaign per week registered in HQ > Email, the approval hash, the switch.
//
// Each Monday from send_hour Eastern (9 AM), every owner of a claimed business (ve_business_weekly_owners) gets one email for the week that
// just ended (ve_business_weekly_digest): their visitors, new ways in, new features and Media kits. A quiet week sends nothing. Every link is
// the owner's own tracked link (ve_links bw-<member>-home|opps|media, initiative ve-business-weekly) into their dashboard. One row per owner
// per week in ve_business_weekly, claimed before sending, so a second tick never sends twice.
// OFF until Sean approves the exact email: settings { approve: true } stores the hash of the sample; any change to the words or the layout
// changes the hash and stops sending until it is approved again; { on: true } turns it on.
//
//   { action: 'tick' }                        the cron (x-cron-secret) or ops
//   { action: 'preview' }                     anyone: the sample email (Green Leaf Kitchen), { subject, html }
//   { action: 'preview', member_id }          super admins: that owner's email for this week, with their real links
//   { action: 'test', member_id? }            super admins: that email (or the sample) to the signed-in admin, [Test] in the subject
//   { action: 'week' }                        super admins: every owner this week, their news and what was sent
//   { action: 'settings', approve?, on? }     super admins: reads or sets the switch and the approval
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { render, bizName, SAMPLE, SAMPLE_LINKS, type Digest, type Links } from './email.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FN_BASE = `${SUPABASE_URL}/functions/v1`;
const BRAND = 'vegans-explore';
const SITE = 'https://vegansexplore.com';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const POSTAL = 'LESARUSS Inc., 300 SW 1st Ave, Suite 155, Fort Lauderdale, FL 33301';

function eastern(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', weekday: 'short', hour12: false })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, weekday: p.weekday as string };
}
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

// ---------- Settings and the approval ----------
async function settings() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'business_weekly').maybeSingle();
  return { on: false, approved_hash: null as string | null, send_hour: 9, per_tick: 40, ...((data as any)?.value || {}) };
}
async function sampleHash() {
  const m = render(SAMPLE, SAMPLE_LINKS);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(m.subject + '\n' + m.html));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function state(cfg: any) { const hash = await sampleHash(); return { on: !!cfg.on, approved: !!cfg.approved_hash && cfg.approved_hash === hash, hash, send_hour: cfg.send_hour }; }

// ---------- Sending (email-send, as ve-nurture) ----------
const refOf = (week: string) => ({ ref: `ve-business-weekly-${week}`, name: `Business weekly email (${week})` });
async function emailSend(payload: Record<string, unknown>) {
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  try {
    const r = await fetch(`${FN_BASE}/email-send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` }, body: JSON.stringify(payload) });
    return await r.json().catch(() => ({ ok: false, error: `email-send ${r.status}` }));
  } catch (e) { return { ok: false, error: String(e) }; }
}
async function registerCampaign(ref: string, name: string, subject: string, html: string) {
  await db.from('email_campaigns').upsert({ brand_slug: BRAND, campaign_ref: ref, name: `${name}, automatic`, subject, html, status: 'sent',
    audience: { source: 've-business-weekly', automatic: true }, notes: 'Sent one at a time by ve-business-weekly (the business dashboard\'s weekly email).',
    started_at: new Date().toISOString(), completed_at: new Date().toISOString(), created_by: 've-business-weekly' }, { onConflict: 'campaign_ref', ignoreDuplicates: true });
}
async function send(week: string, to: string, name: string | null, subject: string, html: string, testTo?: string) {
  const { ref, name: cname } = refOf(week);
  const res: any = await emailSend({ brand: BRAND, campaign_ref: ref, list_ref: 've-business-owners', subject, html,
    recipients: [{ email: to, name: name || undefined }], ...(testTo ? { test_to: [testTo] } : {}) });
  const r = res?.results?.[0];
  if (!r) return { result: 'failed', error: res?.error || (res?.errors || []).join('; ') || 'email-send' };
  if (r.result === 'sent' && !testTo) await registerCampaign(ref, cname, subject, html);
  return { result: String(r.result), id: r.id as string | undefined, error: r.error as string | undefined };
}
async function suppressed(email: string) {
  const { data } = await db.rpc('email_is_suppressed', { p_email: email.toLowerCase().trim(), p_brand: BRAND });
  return data === true;
}

// ---------- The owner's own tracked links, made once and reused every week ----------
async function linksFor(d: any): Promise<Links> {
  const slug = d.listings[0].slug, base = 'bw-' + String(d.member_id).slice(0, 8);
  const want: Record<string, string> = { home: 'home', opps: 'opportunities', media: 'media' };
  const out: any = {};
  for (const k of Object.keys(want)) {
    const code = `${base}-${k}`;
    const { data: had } = await db.from('ve_links').select('code').eq('code', code).maybeSingle();
    if (!had) await db.from('ve_links').insert({ code, label: `Weekly email: ${bizName(d)} (${want[k]})`,
      destination: `${SITE}/dashboard/business?l=${encodeURIComponent(slug)}&tab=${want[k]}`, initiative_slug: 've-business-weekly',
      tags: ['business-weekly', want[k], slug], channel: 'email', recipient_member_id: d.member_id, recipient_email: d.email, recipient_name: d.name });
    out[k] = `${SITE}/go/${code}`;
  }
  return out as Links;
}
async function digestOf(memberId: string): Promise<any> {
  const { data, error } = await db.rpc('ve_business_weekly_digest', { p_member: memberId });
  if (error) throw new Error(error.message);
  return data;
}

// ---------- The Monday tick ----------
async function tick() {
  const cfg = await settings(), st = await state(cfg), e = eastern();
  if (!st.on || !st.approved) return { skipped: !st.on ? 'off' : 'not_approved' };
  if (e.weekday !== 'Mon' || e.hour < cfg.send_hour || e.hour >= 17) return { skipped: 'not_monday_morning' };
  const { data: owners, error } = await db.rpc('ve_business_weekly_owners');
  if (error) return { error: error.message };
  const out: Record<string, number> = { sent: 0, quiet: 0, skipped: 0, failed: 0 };
  for (const o of owners || []) {
    if (out.sent >= cfg.per_tick) break;
    const d = await digestOf(o.member_id);
    if (!d) { out.skipped++; continue; }
    const { data: done } = await db.from('ve_business_weekly').select('id').eq('member_id', o.member_id).eq('week_of', d.week_of).maybeSingle();
    if (done) continue;
    const skip = !d.news ? 'quiet' : (await suppressed(d.email)) ? 'suppressed' : null;
    // Claim the week first (unique member and week), so a second tick never sends twice; a skip is recorded too, so it is decided once.
    const { data: claimed } = await db.from('ve_business_weekly').insert({ member_id: o.member_id, week_of: d.week_of,
      listing_ids: d.listings.map((l: any) => l.id), digest: d, result: skip || 'sending' }).select('id').maybeSingle();
    if (!claimed) continue;
    if (skip) { out[skip === 'quiet' ? 'quiet' : 'skipped']++; continue; }
    const links = await linksFor(d), mail = render(d as Digest, links);
    const r = await send(d.week_of, d.email, d.name, mail.subject, mail.html);
    if (r.result === 'failed') { await db.from('ve_business_weekly').delete().eq('id', claimed.id); out.failed++; continue; }
    await db.from('ve_business_weekly').update({ result: r.result, send_id: r.id || null }).eq('id', claimed.id);
    out.sent++;
  }
  return out;
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
    const okCron = !!cs && cs === (await secret('CRON_SECRET'));
    if (!okCron && !ops) return json({ error: 'forbidden' }, 403);
    try { return json({ ok: true, ...(await tick()) }); } catch (e) { return json({ error: String(e) }, 500); }
  }
  const fill = (h: string) => h.replace(/\{\{\s*unsubscribe_url\s*\}\}/g, '#').replace(/\{\{\s*postal_address\s*\}\}/g, POSTAL);

  // The sample is public: no one's data in it.
  if (action === 'preview' && !body.member_id) {
    const m = render(SAMPLE, SAMPLE_LINKS), cfg = await settings();
    return json({ ok: true, subject: m.subject, html: fill(m.html), state: await state(cfg) });
  }

  // Everything else is the team's.
  let me: any = null;
  if (!ops) {
    const id = bearer ? await memberFrom(bearer) : null;
    if (id) { const { data } = await db.from('members').select('id, email, is_superadmin').eq('id', id).maybeSingle(); me = data; }
    if (!me?.is_superadmin) return json({ error: 'forbidden' }, 403);
  }

  if (action === 'settings') {
    const cur = await settings();
    let next = cur;
    if (body.approve === true) next = { ...next, approved_hash: await sampleHash(), approved_by: me?.id || 'ops', approved_at: new Date().toISOString() };
    if (typeof body.on === 'boolean') next = { ...next, on: body.on };
    if (next !== cur) await db.from('ve_site_settings').upsert({ key: 'business_weekly', value: next });
    return json({ ok: true, settings: next, state: await state(next) });
  }

  if (action === 'preview' || action === 'test') {
    let m = render(SAMPLE, SAMPLE_LINKS), week = 'sample';
    if (isId(body.member_id)) {
      const d = await digestOf(String(body.member_id));
      if (!d) return json({ error: 'not_an_owner' }, 404);
      m = render(d as Digest, await linksFor(d)); week = d.week_of;
      if (action === 'preview') return json({ ok: true, news: d.news, subject: m.subject, html: fill(m.html), digest: d });
    }
    if (action === 'preview') return json({ ok: true, subject: m.subject, html: fill(m.html) });
    const to = me?.email || String(body.to || '');
    if (!to) return json({ error: 'no_address' }, 400);
    const r = await send(week, to, null, '[Test] ' + m.subject, m.html, to);
    return r.result === 'sent' ? json({ ok: true, to }) : json({ error: 'send_failed', message: r.error || r.result }, 502);
  }

  if (action === 'week') {
    const { data: owners } = await db.rpc('ve_business_weekly_owners');
    const rows = [];
    for (const o of owners || []) {
      const d = await digestOf(o.member_id);
      if (!d) continue;
      const { data: sent } = await db.from('ve_business_weekly').select('result, created_at').eq('member_id', o.member_id).eq('week_of', d.week_of).maybeSingle();
      rows.push({ member_id: d.member_id, name: d.name, business: bizName(d), week_of: d.week_of, news: d.news, opps: d.opps.length, features: d.features.length,
        visitors: d.visitors, sent: sent || null });
    }
    return json({ ok: true, rows, state: await state(await settings()) });
  }

  return json({ error: 'unknown_action' }, 400);
});
