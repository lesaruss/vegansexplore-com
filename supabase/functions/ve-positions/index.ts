// ve-positions: paid positions for members (playbook ve-positions; plan docs/plans/2026-11-13-positions-boss.md; mock /mocks/positions).
// Sean, 2026-11-13: "start the build". Tables in migration 20261113_positions.sql (RLS on, service role only).
//
// The holder (a signed-in member with a row in ve_position_people):
//   POST { action: 'me', slug }                         their position, checklist, agreement text, payouts, next payday
//   POST { action: 'role_read', slug, answers }         step 1 and 2: the role and the quick check (three answers)
//   POST { action: 'sign', slug, signed_name, agree, sha }   step 3: e-sign the agreement (ESIGN/UETA: text, hash, name, IP, browser, copy emailed)
//   POST { action: 'payout_start', slug }               step 4: Stripe Express onboarding (W-9 and bank on Stripe's pages)
//   POST { action: 'payout_status', slug }              step 4: asks Stripe whether transfers are on
//   POST { action: 'instagram', slug, handle }          step 5: their Instagram handle for Sean's Shared Access invite
// Sean (a superadmin member):
//   admin_list, admin_person {id}, admin_search {q}, admin_assign {slug, member_id, note, send}, admin_start_trial {id},
//   admin_hold {payout_id}, admin_release {payout_id}, admin_end {id, reason, ended_on}, admin_offboard_done {id}
// The Stop link in the pay notice (a page on the site posts here; opening the email link changes nothing):
//   POST { action: 'hold_token', t }
// The daily cron (x-cron-secret) or ops: POST { action: 'cron' } builds payout rows on the pay calendar, sends the notices two days before,
// pays on payday (only when ve_site_settings positions_pay.live is true), warns on a low balance, and sends the trial review notice.
//
// Pay calendar (Sean, 2026-11-13): Monday to Sunday 14-day periods from Mon 2026-11-16, payday the Friday after a period ends; the first
// days before a full period ride with the first full period at pay_cents / 14 a day; the last period is prorated to the end date.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const SEAN_EMAIL = 'contact@lesaruss.com';
const FROM = 'VEGANS EXPLORE <hello@vegansexplore.com>';
const ANCHOR = '2026-11-16';
const DAY_MS = 86400000;
const CONSOLE = `${SITE}/admin/depot/positions`;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').replace(/\s*[—–]\s*/g, ', ').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isSlug = (v: unknown) => typeof v === 'string' && /^[a-z0-9-]{3,80}$/.test(v);
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const firstName = (n: string) => String(n || '').trim().split(/\s+/)[0] || 'there';
const money = (cents: number) => '$' + (cents / 100).toFixed(2).replace(/\.00$/, '');
const nowIso = () => new Date().toISOString();

// ---- Dates, in Eastern (Sean's time; CLAUDE.md "Time is Sean's") ----
function todayET(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
const toDate = (s: string) => new Date(s + 'T00:00:00Z');
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => fmt(new Date(toDate(s).getTime() + n * DAY_MS));
const diffDays = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY_MS);
function periodStart(s: string): string {
  return addDays(ANCHOR, 14 * Math.floor(diffDays(ANCHOR, s) / 14));
}
const payDay = (ps: string) => addDays(ps, 18);
const nice = (s: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }).format(toDate(s));
const niceShort = (s: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(toDate(s));

// The next payout a holder is owed, from covers_from: the period it falls in, plus the first full period when it starts mid-period.
function nextStretch(coversFrom: string, startOn: string, endedOn: string | null) {
  const ps = periodStart(coversFrom);
  let coversTo = addDays(ps, 13);
  if (coversFrom === startOn && coversFrom !== ps) coversTo = addDays(coversTo, 14);
  if (endedOn && endedOn < coversTo) coversTo = endedOn;
  const payOn = payDay(periodStart(coversTo));
  const days = diffDays(coversFrom, coversTo) + 1;
  return { coversFrom, coversTo, payOn, days };
}
const amountFor = (payCents: number, days: number) => Math.round((payCents * days) / 14);

// ---- Auth (the same token ve-auth signs; superadmin re-read from members on every admin action) ----
function b64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function bytesToB64url(b: Uint8Array): string {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function hmacKey(usage: KeyUsage[]) {
  return await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, usage);
}
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const key = await hmacKey(['verify']);
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
const bearer = (req: Request) => (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
async function isOps(req: Request) {
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  const t = bearer(req);
  return !!admin && t.length === admin.length && t === admin;
}
async function viewer(req: Request) {
  const sub = await verifyToken(bearer(req));
  if (!sub) return null;
  const { data } = await db.from('members').select('id, name, email, is_superadmin, membership_status').eq('id', sub).maybeSingle();
  return data;
}
const ipOf = (req: Request) => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;

// Signed Stop link for a payout: payout id and expiry, HMAC'd; one use is enforced by the payout's own status (held once).
async function signHold(payoutId: string, exp: number) {
  const msg = `vepos-hold.${payoutId}.${exp}`;
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(['sign']), new TextEncoder().encode(msg)));
  return `${payoutId}.${exp}.${bytesToB64url(sig)}`;
}
async function checkHold(t: string): Promise<string | null> {
  const [id, exp, sig] = String(t || '').split('.');
  if (!isId(id) || !/^\d+$/.test(exp || '') || !sig) return null;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(['verify']), b64urlToBytes(sig), new TextEncoder().encode(`vepos-hold.${id}.${exp}`));
  return ok ? id : null;
}

// ---- Email (transactional, through Resend like ve-ambassador; the team's name, never Sean's) ----
async function sendOne(to: string, subject: string, html: string): Promise<string | null> {
  if (!RESEND_KEY || !to) return null;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, reply_to: SEAN_EMAIL, to: [to], subject, html }),
    });
    const d = res.ok ? await res.json() : null;
    if (!res.ok) console.error('Resend error:', await res.text());
    return d?.id ?? null;
  } catch (e) { console.error('Resend failed:', e); return null; }
}
const FOOT = `<p style="font-size:12px;color:#777;margin:18px 0 0">Vegans Explore, a LESARUSS brand. 300 SW 1st Ave, Suite 155, Fort Lauderdale, FL 33301.</p>`;
const STRIPE_BAR = `<div style="height:6px;background:linear-gradient(90deg,#2D5C27 0 28%,#F69820 28% 40%,#FF9EC4 40% 52%,#FFEBD1 52% 64%,#22C55E 64% 76%,#E8F5E9 76% 88%,#3A9B3E 88%)"></div>`;
const wrap = (inner: string) => `<div style="font-family:Montserrat,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">${STRIPE_BAR}<div style="padding:16px 4px">${inner}${FOOT}</div></div>`;
const btn = (href: string, label: string) => `<p style="margin:0 0 16px"><a href="${href}" style="display:inline-block;background:#F69820;color:#1a1a1a;font-weight:800;text-decoration:none;padding:12px 18px;border-radius:6px">${esc(label)}</a></p>`;

// ---- Stripe (Vegans Explore's account; test accounts on ve_test_checkout_allowlist use the test key) ----
async function isTestAccount(email: string | null) {
  if (!email) return false;
  const { data } = await db.from('ve_test_checkout_allowlist').select('email').eq('email', email.toLowerCase()).maybeSingle();
  return !!data;
}
async function stripeKey(test: boolean) {
  if (!test) return Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const k = (await secret('STRIPE_SECRET_KEY_ACCT_VEGANSEXPLORE_TEST')) || (await secret('STRIPE_SECRET_KEY_ACCT_LESARUSS_TEST'));
  if (!String(k || '').startsWith('sk_test_')) throw new Error('test key missing');
  return String(k);
}
async function stripe(test: boolean, method: string, path: string, params?: Record<string, string>, idem?: string) {
  const headers: Record<string, string> = { Authorization: `Bearer ${await stripeKey(test)}` };
  if (params) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  if (idem) headers['Idempotency-Key'] = idem;
  const res = await fetch(`https://api.stripe.com/v1/${path}`, { method, headers, body: params ? new URLSearchParams(params).toString() : undefined });
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, d };
}
// Ready means Stripe will accept a transfer: the transfers capability is active and nothing has disabled the account.
const transfersReady = (acct: any) => acct?.capabilities?.transfers === 'active' && !acct?.requirements?.disabled_reason;

// ---- Data helpers ----
async function log(personId: string | null, actor: string, action: string, detail: unknown = null, extra: { payout_id?: string; source?: string; ip?: string | null } = {}) {
  await db.from('ve_position_events').insert({ person_id: personId, actor, action, detail, payout_id: extra.payout_id ?? null, source: extra.source ?? null, ip: extra.ip ?? null });
}
async function positionBySlug(slug: string) {
  const { data } = await db.from('ve_positions').select('*').eq('slug', slug).maybeSingle();
  return data;
}
async function holderRow(positionId: string, memberId: string) {
  const { data } = await db.from('ve_position_people').select('*').eq('position_id', positionId).eq('member_id', memberId)
    .order('created_at', { ascending: false }).limit(1);
  return data?.[0] ?? null;
}
// Move a person forward only from the stages given; returns false when they were somewhere else (no change).
async function advance(id: string, from: string[], to: string, patch: Record<string, unknown> = {}) {
  const { data } = await db.from('ve_position_people').update({ ...patch, stage: to, updated_at: nowIso() }).eq('id', id).in('stage', from).select('id');
  return !!data?.length;
}
const ORDER = ['applied', 'shortlisted', 'invited', 'role_read', 'agreed', 'payouts_ready', 'awaiting_access', 'trial', 'active', 'paused', 'ended'];
const before = (stage: string, target: string) => ORDER.indexOf(stage) < ORDER.indexOf(target);
const STAGE_WORDS: Record<string, string> = {
  applied: 'Applied', shortlisted: 'Shortlisted', invited: 'Invited', role_read: 'Role read', agreed: 'Agreement signed', payouts_ready: 'Payouts ready',
  awaiting_access: 'Waiting on Instagram access', trial: 'Active (trial)', active: 'Active', paused: 'Paused', ended: 'Ended',
};
async function payoutAccount(memberId: string) {
  const { data } = await db.from('ve_member_payout_accounts').select('*').eq('member_id', memberId).maybeSingle();
  return data;
}
// The quick check (step 2): three do's and don'ts, each with one right answer.
const CHECK: Record<string, string> = { personal: 'write_each', limit: 'stop_at_limit', warning: 'pause_48' };

function startUrl(slug: string, step?: string) {
  return `${SITE}/positions/${slug}/start${step ? `?step=${step}` : ''}`;
}

async function personView(pos: any, p: any) {
  const acct = p.member_id ? await payoutAccount(p.member_id) : null;
  const { data: payouts } = await db.from('ve_position_payouts').select('id, covers_from, covers_to, pay_on, days, amount_cents, status, sent_at').eq('person_id', p.id).order('pay_on');
  const { data: agr } = await db.from('ve_position_agreements').select('version, signed_name, signed_at').eq('person_id', p.id).order('signed_at', { ascending: false }).limit(1);
  let preview = null;
  if (p.start_on) {
    const last = (payouts || []).slice(-1)[0];
    const from = last ? addDays(last.covers_to, 1) : p.start_on;
    if (!p.ended_on || from <= p.ended_on) { const s = nextStretch(from, p.start_on, p.ended_on); preview = { ...s, amount_cents: amountFor(pos.pay_cents, s.days) }; }
  } else {
    // Not started yet: what the first payday would be if access were granted today.
    const t = todayET(); const s = nextStretch(t, t, null); preview = { ...s, amount_cents: amountFor(pos.pay_cents, s.days), if_started_today: true };
  }
  return {
    id: p.id, name: p.name, email: p.email, stage: p.stage, stage_words: STAGE_WORDS[p.stage], path: p.path,
    steps: { role: !!p.role_read_at, check: !!p.check_passed_at, agreement: !!p.agreed_at, payouts: !!p.payouts_ready_at, instagram: !!p.ig_handle, access: !!p.access_granted_at },
    ig_handle: p.ig_handle, start_on: p.start_on, trial_review_on: p.trial_review_on, ended_on: p.ended_on,
    agreement: agr?.[0] ?? null, payouts_account: acct ? { ready: acct.transfers_active, livemode: acct.livemode } : null,
    payouts: payouts || [], next_payout: preview,
  };
}

// ---- The cron: rows, notices, pay, balance, trial review ----
async function payLive() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'positions_pay').maybeSingle();
  return { live: !!data?.value?.live, notice_days: Number(data?.value?.notice_days ?? 2) };
}
async function cron() {
  const today = todayET();
  const cfg = await payLive();
  const out = { rows: 0, notices: 0, sent: 0, failed: 0, waiting_live: 0, reviews: 0, balance_alerts: 0 };
  const { data: people } = await db.from('ve_position_people').select('*, ve_positions(id, slug, title, pay_cents)').in('stage', ['trial', 'active', 'paused', 'ended']).not('start_on', 'is', null);
  // a) payout rows up to two weeks ahead of payday
  for (const p of people || []) {
    const pos = (p as any).ve_positions;
    for (let guard = 0; guard < 6; guard++) {
      const { data: last } = await db.from('ve_position_payouts').select('covers_to').eq('person_id', p.id).order('covers_to', { ascending: false }).limit(1);
      const from = last?.[0] ? addDays(last[0].covers_to, 1) : p.start_on;
      if (p.ended_on && from > p.ended_on) break;
      const s = nextStretch(from, p.start_on, p.ended_on);
      if (s.payOn > addDays(today, 14)) break;
      const { error } = await db.from('ve_position_payouts').insert({ person_id: p.id, covers_from: s.coversFrom, covers_to: s.coversTo, pay_on: s.payOn, days: s.days, amount_cents: amountFor(pos.pay_cents, s.days) });
      if (error) { console.error('payout row', error.message); break; }
      out.rows++;
    }
    // e) the trial review notice, on the review day
    if (p.stage === 'trial' && p.trial_review_on && p.trial_review_on <= today && !p.review_notice_at) {
      const id = await sendOne(SEAN_EMAIL, `Trial review: ${p.name || p.email}, ${pos.title}`, wrap(
        `<p style="margin:0 0 12px"><b>${esc(p.name || p.email)}</b>'s one-month trial as ${esc(pos.title)} is up for review.</p>` +
        `<p style="margin:0 0 16px">Continue and they become Active; end it and their access comes off the same day.</p>` + btn(`${CONSOLE}#person/${p.id}`, 'Review the trial')));
      if (id) { await db.from('ve_position_people').update({ review_notice_at: nowIso() }).eq('id', p.id); out.reviews++; }
    }
  }
  // b) the notice to Sean, notice_days before payday; if the email fails the payment waits
  const { data: due } = await db.from('ve_position_payouts').select('*, ve_position_people(id, name, email, member_id, stage, ve_positions(title, pay_cents))').eq('status', 'scheduled').lte('pay_on', addDays(today, cfg.notice_days));
  for (const r of due || []) {
    const p = (r as any).ve_position_people;
    const exp = Math.floor(toDate(r.pay_on).getTime() / 1000) + 9 * 3600; // until about 4 AM Eastern on payday
    const t = await signHold(r.id, exp);
    const rate = p.ve_positions?.pay_cents || 12500;
    const stub = r.days > 14 ? ` (${money(amountFor(rate, 14))} for the full period, plus their first ${r.days - 14} days)` : r.days < 14 ? ` (${r.days} days at ${money(Math.round(rate / 14))} a day)` : '';
    const id = await sendOne(SEAN_EMAIL, `Paying ${firstName(p.name)} ${money(r.amount_cents)} on ${nice(r.pay_on)}`, wrap(
      `<p style="margin:0 0 12px"><b>${esc(p.name || p.email)}</b>, ${esc(p.ve_positions?.title || '')}: <b>${money(r.amount_cents)}</b> for ${niceShort(r.covers_from)} to ${niceShort(r.covers_to)}${esc(stub)}.</p>` +
      `<p style="margin:0 0 12px">Stage: ${esc(STAGE_WORDS[p.stage] || p.stage)}.${cfg.live ? '' : ' <b>Real payouts are not switched on yet</b>, so this one waits.'}</p>` +
      `<p style="margin:0 0 16px">Nothing to do. To hold it, tap below before ${nice(r.pay_on)}.</p>` + btn(`${SITE}/positions/hold?t=${encodeURIComponent(t)}`, 'Stop this payment')));
    if (id) {
      await db.from('ve_position_payouts').update({ status: 'notified', notice_sent_at: nowIso() }).eq('id', r.id).eq('status', 'scheduled');
      await log(p.id, 'cron', 'pay_notice', { amount_cents: r.amount_cents, pay_on: r.pay_on }, { payout_id: r.id });
      out.notices++;
    }
  }
  // c) payday
  const { data: payable } = await db.from('ve_position_payouts').select('id').in('status', ['notified', 'failed']).lte('pay_on', today).lt('attempts', 3)
    .lte('notice_sent_at', new Date(Date.now() - 36 * 3600 * 1000).toISOString());
  for (const { id } of payable || []) {
    const r = await payOne(id, cfg.live);
    if (r === 'sent') out.sent++; else if (r === 'not_live') out.waiting_live++; else if (r === 'failed') out.failed++;
  }
  // d) low balance: what is due in the next 8 days against Stripe's available USD, once per row
  if (cfg.live) {
    const { data: soon } = await db.from('ve_position_payouts').select('id, amount_cents, balance_alert_at').in('status', ['scheduled', 'notified']).lte('pay_on', addDays(today, 8));
    const total = (soon || []).reduce((a, r) => a + r.amount_cents, 0);
    if (total > 0 && (soon || []).some((r) => !r.balance_alert_at)) {
      const { ok, d } = await stripe(false, 'GET', 'balance');
      const avail = ok ? (d.available || []).filter((x: any) => x.currency === 'usd').reduce((a: number, x: any) => a + x.amount, 0) : 0;
      if (ok && avail < total) {
        const id = await sendOne(SEAN_EMAIL, `Add funds: ${money(total - avail)} short for position pay`, wrap(
          `<p style="margin:0 0 12px">Position pay due in the next 8 days: <b>${money(total)}</b>. Available in the Vegans Explore Stripe balance: <b>${money(avail)}</b>.</p>` +
          `<p style="margin:0 0 12px">Add at least <b>${money(total - avail)}</b> (Stripe Dashboard, Balances, Add funds). A bank transfer takes 4 to 6 business days to clear.</p>`));
        if (id) { await db.from('ve_position_payouts').update({ balance_alert_at: nowIso() }).in('id', (soon || []).map((r) => r.id)); out.balance_alerts++; }
      }
    }
  }
  return out;
}

async function payOne(payoutId: string, live: boolean): Promise<'sent' | 'not_live' | 'failed' | 'skipped' | 'busy'> {
  if (!live) {
    await db.from('ve_position_payouts').update({ last_error: 'Real payouts are not switched on yet (positions_pay.live)' }).eq('id', payoutId).in('status', ['notified', 'failed']);
    return 'not_live';
  }
  // Claim it so two runs cannot both pay.
  const { data: claimed } = await db.from('ve_position_payouts').select('*').eq('id', payoutId).in('status', ['notified', 'failed']).maybeSingle();
  if (!claimed) return 'busy';
  const { data: took } = await db.from('ve_position_payouts').update({ status: 'sending', attempts: claimed.attempts + 1 }).eq('id', payoutId).eq('status', claimed.status).eq('attempts', claimed.attempts).select('*');
  const r = took?.[0];
  if (!r) return 'busy';
  const { data: p } = await db.from('ve_position_people').select('*, ve_positions(title, slug)').eq('id', r.person_id).maybeSingle();
  const fail = async (msg: string, status: 'failed' | 'skipped' | 'held' = 'failed') => {
    await db.from('ve_position_payouts').update({ status, last_error: msg, ...(status === 'held' ? { held_by: 'paused', held_at: nowIso() } : {}) }).eq('id', r.id);
    await log(r.person_id, 'cron', 'pay_' + status, { error: msg }, { payout_id: r.id });
    if (status === 'failed' && r.attempts + 1 >= 3) await sendOne(SEAN_EMAIL, `Payment failed: ${p?.name || ''} ${money(r.amount_cents)}`, wrap(`<p>The payment for ${esc(p?.name || '')} (${niceShort(r.covers_from)} to ${niceShort(r.covers_to)}) failed three times: ${esc(msg)}</p>` + btn(`${CONSOLE}#person/${r.person_id}`, 'Open their page')));
    return status === 'failed' ? 'failed' as const : 'skipped' as const;
  };
  if (!p) return await fail('person missing', 'skipped');
  if (p.stage === 'paused') return await fail('paused', 'held');
  const working = ['trial', 'active'].includes(p.stage) || (p.stage === 'ended' && p.ended_on && r.covers_from <= p.ended_on);
  if (!working) return await fail(`stage ${p.stage}`, 'skipped');
  const acct = p.member_id ? await payoutAccount(p.member_id) : null;
  if (!acct) return await fail('no payouts account');
  const test = !acct.livemode;
  const a = await stripe(test, 'GET', `accounts/${acct.stripe_account_id}`);
  if (!a.ok || !transfersReady(a.d)) return await fail(a.ok ? `Stripe account not ready (${a.d?.requirements?.disabled_reason || 'transfers not active'})` : 'Stripe account lookup failed');
  // Never pay twice: if a transfer for this payout exists, record it and stop.
  const prior = await stripe(test, 'GET', `transfers?transfer_group=vepos_${r.id}&limit=3`);
  const existing = prior.ok ? (prior.d.data || [])[0] : null;
  if (existing) {
    await db.from('ve_position_payouts').update({ status: 'sent', stripe_transfer_id: existing.id, livemode: !test, sent_at: nowIso(), last_error: null }).eq('id', r.id);
    return 'sent';
  }
  const t = await stripe(test, 'POST', 'transfers', {
    amount: String(r.amount_cents), currency: 'usd', destination: acct.stripe_account_id, transfer_group: `vepos_${r.id}`,
    description: `${p.ve_positions?.title || 'Position'}: ${r.covers_from} to ${r.covers_to}`,
    'metadata[payout_id]': r.id, 'metadata[person_id]': p.id, 'metadata[source]': 've-positions',
  }, `vepos-${r.id}-a${r.attempts}`);
  if (!t.ok) return await fail(String(t.d?.error?.code || t.d?.error?.message || 'transfer failed'));
  await db.from('ve_position_payouts').update({ status: 'sent', stripe_transfer_id: t.d.id, livemode: !test, sent_at: nowIso(), last_error: null }).eq('id', r.id);
  await log(p.id, 'cron', 'paid', { amount_cents: r.amount_cents, transfer: t.d.id }, { payout_id: r.id });
  await sendOne(p.email, `You've been paid ${money(r.amount_cents)}`, wrap(
    `<p style="margin:0 0 12px">Hi ${esc(firstName(p.name))},</p><p style="margin:0 0 12px">Your ${money(r.amount_cents)} for ${niceShort(r.covers_from)} to ${niceShort(r.covers_to)} is on its way to your bank through Stripe. Thank you for the work.</p>`));
  return 'sent';
}

// ---- Admin views ----
async function adminList() {
  const { data: positions } = await db.from('ve_positions').select('id, slug, title, summary, pay_cents, period_days, trial_days, mode, status, apply_by, max_holders').order('created_at');
  const { data: people } = await db.from('ve_position_people').select('id, position_id, member_id, name, email, stage, path, decision, ig_handle, start_on, trial_review_on, invited_at, updated_at').order('updated_at', { ascending: false });
  const ids = (people || []).map((p) => p.id);
  const { data: next } = ids.length ? await db.from('ve_position_payouts').select('person_id, pay_on, amount_cents, status').in('person_id', ids).in('status', ['scheduled', 'notified', 'held', 'failed']).order('pay_on') : { data: [] };
  const nextBy: Record<string, any> = {};
  for (const n of next || []) if (!nextBy[n.person_id]) nextBy[n.person_id] = n;
  return { positions: positions || [], people: (people || []).map((p) => ({ ...p, stage_words: STAGE_WORDS[p.stage], next_payout: nextBy[p.id] || null })), stage_words: STAGE_WORDS };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');

  if (action === 'cron') {
    const cs = await secret('CRON_SECRET');
    const c = req.headers.get('x-cron-secret');
    if (!((c && cs && c === cs) || (await isOps(req)))) return json({ error: 'forbidden' }, 403);
    try { return json({ ok: true, ...(await cron()) }); } catch (e) { console.error('cron', e); return json({ error: 'cron_failed', message: String(e) }, 500); }
  }

  if (action === 'hold_token') {
    const id = await checkHold(String(body.t || ''));
    if (!id) return json({ error: 'expired', message: 'This link has expired or is not valid. Open Positions in the Depot to hold a payment.' }, 400);
    const { data: r } = await db.from('ve_position_payouts').select('id, status, amount_cents, pay_on, person_id').eq('id', id).maybeSingle();
    if (!r) return json({ error: 'not_found' }, 404);
    if (body.confirm !== true) return json({ ok: true, payout: { amount_cents: r.amount_cents, pay_on: r.pay_on, status: r.status } });
    if (r.status === 'held') return json({ ok: true, already: true });
    if (!['scheduled', 'notified', 'failed'].includes(r.status)) return json({ error: 'too_late', message: `This payment is already ${r.status}.` }, 409);
    await db.from('ve_position_payouts').update({ status: 'held', held_by: 'email_link', held_at: nowIso() }).eq('id', r.id).in('status', ['scheduled', 'notified', 'failed']);
    await log(r.person_id, 'sean', 'hold', null, { payout_id: r.id, source: 'email_link', ip: ipOf(req) });
    return json({ ok: true, held: true });
  }

  const me = await viewer(req);
  if (!me) return json({ error: 'sign_in' }, 401);

  // ======== Admin (superadmin, re-read from members on every call) ========
  if (action.startsWith('admin_')) {
    if (!me.is_superadmin) return json({ error: 'forbidden' }, 403);
    const actor = me.email || me.id;

    if (action === 'admin_list') return json({ ok: true, ...(await adminList()) });

    if (action === 'admin_search') {
      const q = clean(body.q, 80).replace(/[%_,()]/g, ' ').trim();
      if (q.length < 2) return json({ ok: true, members: [] });
      const { data } = await db.from('members').select('id, name, email, username, avatar_url, membership_status').or(`name.ilike.%${q}%,email.ilike.%${q}%,username.ilike.%${q}%`).limit(10);
      return json({ ok: true, members: (data || []).map((m) => ({ id: m.id, name: m.name, email: m.email, username: m.username, avatar_url: m.avatar_url, active: m.membership_status === 'active' })) });
    }

    if (action === 'admin_person') {
      if (!isId(body.id)) return json({ error: 'bad_request' }, 400);
      const { data: p } = await db.from('ve_position_people').select('*').eq('id', body.id).maybeSingle();
      if (!p) return json({ error: 'not_found' }, 404);
      const { data: pos } = await db.from('ve_positions').select('*').eq('id', p.position_id).maybeSingle();
      const { data: events } = await db.from('ve_position_events').select('actor, action, detail, source, at').eq('person_id', p.id).order('at', { ascending: false }).limit(40);
      return json({ ok: true, position: { slug: pos.slug, title: pos.title, pay_cents: pos.pay_cents }, person: await personView(pos, p), invite_link: p.invite_link_code ? `${SITE}/go/${p.invite_link_code}` : null, events: events || [] });
    }

    if (action === 'admin_assign') {
      if (!isSlug(body.slug) || !isId(body.member_id)) return json({ error: 'bad_request' }, 400);
      const pos = await positionBySlug(body.slug);
      if (!pos) return json({ error: 'not_found' }, 404);
      const { data: m } = await db.from('members').select('id, name, email, membership_status').eq('id', body.member_id).maybeSingle();
      if (!m?.email) return json({ error: 'no_member', message: 'That member has no email on file.' }, 400);
      const { count } = await db.from('ve_position_people').select('id', { count: 'exact', head: true }).eq('position_id', pos.id).in('stage', ['trial', 'active', 'awaiting_access', 'payouts_ready', 'agreed', 'role_read', 'invited']);
      let p = await holderRow(pos.id, m.id);
      if (!p || p.stage === 'ended') {
        if ((count || 0) >= pos.max_holders) return json({ error: 'full', message: `This position already has ${pos.max_holders} people in it (Instagram Shared Access allows 3).` }, 409);
        const code = `pos-${pos.slug.split('-').slice(-1)[0]}-${m.id.slice(0, 6)}`;
        await db.from('ve_links').upsert({ code, label: `${pos.title}: invite for ${m.name || m.email}`, destination: startUrl(pos.slug), initiative_slug: `position-${pos.slug}`,
          tags: ['positions', pos.slug, 'invite'], channel: 'email', recipient_member_id: m.id, recipient_email: m.email, recipient_name: m.name, active: true }, { onConflict: 'code', ignoreDuplicates: true });
        const { data: ins, error } = await db.from('ve_position_people').insert({ position_id: pos.id, member_id: m.id, email: m.email, name: m.name, path: 'assigned', stage: 'invited',
          invite_note: clean(body.note, 600) || null, invite_link_code: code }).select('*');
        if (error) return json({ error: 'save_failed', message: error.message }, 500);
        p = ins![0];
        await log(p.id, actor, 'assigned', { position: pos.slug }, { source: 'console', ip: ipOf(req) });
      }
      const link = `${SITE}/go/${p.invite_link_code}`;
      if (body.send === true) {
        const note = p.invite_note ? `<p style="margin:0 0 12px">${esc(p.invite_note)}</p>` : '';
        const id = await sendOne(m.email, `${firstName(m.name)}, Vegans Explore would like you as its ${pos.title}`, wrap(
          `<p style="margin:0 0 12px">Hi ${esc(firstName(m.name))},</p>` + note +
          `<p style="margin:0 0 12px">Vegans Explore would like you as its <b>${esc(pos.title)}</b>: ${esc(pos.summary || '')}</p>` +
          `<p style="margin:0 0 12px">${money(pos.pay_cents)} for each 2-week period of work, your own hours, and a one-month trial. About ten minutes gets you set up: the role, a quick check, the agreement, payouts and Instagram.</p>` +
          btn(link, 'See the role')));
        if (!id) return json({ error: 'send_failed', message: 'The email did not send. Copy the link instead, or try again.' }, 502);
        await db.from('ve_position_people').update({ invited_at: nowIso(), updated_at: nowIso() }).eq('id', p.id);
        await log(p.id, actor, 'invite_sent', { to: m.email }, { source: 'console', ip: ipOf(req) });
      } else if (!p.invited_at) {
        await db.from('ve_position_people').update({ invited_at: nowIso(), updated_at: nowIso() }).eq('id', p.id);
        await log(p.id, actor, 'invite_link_copied', null, { source: 'console', ip: ipOf(req) });
      }
      return json({ ok: true, person_id: p.id, link, member_active: m.membership_status === 'active' });
    }

    if (action === 'admin_start_trial') {
      if (!isId(body.id)) return json({ error: 'bad_request' }, 400);
      const { data: p } = await db.from('ve_position_people').select('*, ve_positions(*)').eq('id', body.id).maybeSingle();
      if (!p) return json({ error: 'not_found' }, 404);
      const pos = (p as any).ve_positions;
      const start = todayET();
      const ok = await advance(p.id, ['awaiting_access'], 'trial', { access_granted_at: nowIso(), start_on: start, trial_review_on: addDays(start, Math.max(0, pos.trial_days - 5)) });
      if (!ok) return json({ error: 'wrong_stage', message: `They are at "${STAGE_WORDS[p.stage]}". Their checklist has to be finished first.` }, 409);
      await log(p.id, actor, 'trial_started', { start_on: start }, { source: 'console', ip: ipOf(req) });
      const s = nextStretch(start, start, null);
      const amt = amountFor(pos.pay_cents, s.days);
      await sendOne(p.email, `You're all set, ${firstName(p.name)}`, wrap(
        `<p style="margin:0 0 12px">Hi ${esc(firstName(p.name))},</p><p style="margin:0 0 12px">Your Instagram access is live, and your trial as ${esc(pos.title)} starts today.</p>` +
        `<p style="margin:0 0 12px">Your first payday is <b>${nice(s.payOn)}</b>: <b>${money(amt)}</b> for ${niceShort(s.coversFrom)} to ${niceShort(s.coversTo)}.</p>` +
        btn(startUrl(pos.slug, 'done'), 'Go to your queue')));
      await sendOne(SEAN_EMAIL, `${p.name || p.email} is Active (trial)`, wrap(
        `<p style="margin:0 0 12px"><b>${esc(p.name || p.email)}</b> is Active (trial) as ${esc(pos.title)} from ${nice(start)}. First payday ${nice(s.payOn)} (${money(amt)}); trial review ${nice(addDays(start, Math.max(0, pos.trial_days - 5)))}.</p>`));
      return json({ ok: true, start_on: start, first_payday: s.payOn, first_amount_cents: amt });
    }

    if (action === 'admin_hold' || action === 'admin_release') {
      if (!isId(body.payout_id)) return json({ error: 'bad_request' }, 400);
      const { data: r } = await db.from('ve_position_payouts').select('id, person_id, status, notice_sent_at').eq('id', body.payout_id).maybeSingle();
      if (!r) return json({ error: 'not_found' }, 404);
      if (action === 'admin_hold') {
        const { data } = await db.from('ve_position_payouts').update({ status: 'held', held_by: actor, held_at: nowIso() }).eq('id', r.id).in('status', ['scheduled', 'notified', 'failed']).select('id');
        if (!data?.length) return json({ error: 'too_late', message: `This payment is already ${r.status}.` }, 409);
      } else {
        const { data } = await db.from('ve_position_payouts').update({ status: r.notice_sent_at ? 'notified' : 'scheduled', held_by: null, held_at: null, attempts: 0, last_error: null }).eq('id', r.id).eq('status', 'held').select('id');
        if (!data?.length) return json({ error: 'not_held' }, 409);
      }
      await log(r.person_id, actor, action === 'admin_hold' ? 'hold' : 'release', null, { payout_id: r.id, source: 'console', ip: ipOf(req) });
      return json({ ok: true });
    }

    if (action === 'admin_end') {
      if (!isId(body.id)) return json({ error: 'bad_request' }, 400);
      const { data: p } = await db.from('ve_position_people').select('*, ve_positions(title, pay_cents)').eq('id', body.id).maybeSingle();
      if (!p) return json({ error: 'not_found' }, 404);
      const endOn = typeof body.ended_on === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.ended_on) ? body.ended_on : todayET();
      const ok = await advance(p.id, ORDER.filter((s) => s !== 'ended'), 'ended', { ended_on: endOn, end_reason: clean(body.reason, 500) || null });
      if (!ok) return json({ error: 'wrong_stage' }, 409);
      // Rows after the end date are dropped; the last stretch is re-priced to the end date by the cron.
      await db.from('ve_position_payouts').delete().eq('person_id', p.id).gt('covers_from', endOn).in('status', ['scheduled', 'notified', 'held']);
      const { data: open } = await db.from('ve_position_payouts').select('id, covers_from, covers_to').eq('person_id', p.id).in('status', ['scheduled', 'notified', 'held']).gt('covers_to', endOn);
      for (const r of open || []) {
        const days = diffDays(r.covers_from, endOn) + 1;
        await db.from('ve_position_payouts').update({ covers_to: endOn, days, amount_cents: amountFor((p as any).ve_positions?.pay_cents || 12500, days) }).eq('id', r.id);
      }
      if (p.link_code) await db.from('ve_links').update({ active: false }).eq('code', p.link_code);
      await log(p.id, actor, 'ended', { ended_on: endOn, reason: body.reason || null }, { source: 'console', ip: ipOf(req) });
      await sendOne(SEAN_EMAIL, `Offboard today: ${p.name || p.email}`, wrap(
        `<p style="margin:0 0 12px"><b>${esc(p.name || p.email)}</b>'s position (${esc((p as any).ve_positions?.title || '')}) ends ${nice(endOn)}. Today:</p>` +
        `<ol style="margin:0 0 16px;padding-left:20px"><li>Instagram, on the Vegans Explore account: Shared Access, remove ${esc(p.ig_handle ? '@' + p.ig_handle : 'them')}.</li>` +
        `<li>Check the activity log and that the profile, email and phone are unchanged.</li><li>Tick it done on their page.</li></ol>` +
        `<p style="margin:0 0 16px">Their pay through ${nice(endOn)} still goes out on its payday; their tracked link is switched off.</p>` + btn(`${CONSOLE}#person/${p.id}`, 'Open their page')));
      return json({ ok: true, ended_on: endOn });
    }

    if (action === 'admin_offboard_done') {
      if (!isId(body.id)) return json({ error: 'bad_request' }, 400);
      await db.from('ve_position_people').update({ access_removed_at: nowIso(), offboard_done_at: nowIso(), updated_at: nowIso() }).eq('id', body.id).eq('stage', 'ended');
      await log(body.id, actor, 'offboard_done', null, { source: 'console', ip: ipOf(req) });
      return json({ ok: true });
    }

    return json({ error: 'unknown_action' }, 400);
  }

  // ======== The holder ========
  if (!isSlug(body.slug)) return json({ error: 'bad_request' }, 400);
  const pos = await positionBySlug(body.slug);
  if (!pos) return json({ error: 'not_found' }, 404);
  const p = await holderRow(pos.id, me.id);
  if (!p) return json({ error: 'not_invited', message: 'This position is by invitation. If you were invited, sign in with the email the invitation went to.' }, 403);
  if (me.membership_status !== 'active' && !me.is_superadmin) return json({ error: 'not_member', message: 'Positions are for members. Take the member survey first, then come back.', survey: `${SITE}/survey?s=explorer` }, 403);
  if (p.stage === 'ended') return json({ error: 'ended', message: 'This position has ended.' }, 403);

  const reply = async () => {
    const { data: fresh } = await db.from('ve_position_people').select('*').eq('id', p.id).maybeSingle();
    return json({ ok: true, position: { slug: pos.slug, title: pos.title, summary: pos.summary, posting: pos.posting, pay_cents: pos.pay_cents, trial_days: pos.trial_days,
      agreement: { version: pos.agreement_version, text: pos.agreement_text, sha: pos.agreement_sha256 } }, person: await personView(pos, fresh) });
  };

  if (action === 'me') return await reply();

  if (action === 'role_read') {
    const a = body.answers || {};
    const wrong = Object.keys(CHECK).filter((k) => a[k] !== CHECK[k]);
    if (wrong.length) return json({ error: 'check', wrong, message: 'One or more answers are not quite right. Read them again; they keep the account safe, and you too.' }, 400);
    await db.from('ve_position_people').update({ role_read_at: p.role_read_at || nowIso(), check_passed_at: p.check_passed_at || nowIso(), updated_at: nowIso() }).eq('id', p.id);
    if (before(p.stage, 'role_read')) await advance(p.id, ['invited', 'applied', 'shortlisted'], 'role_read');
    await log(p.id, me.id, 'role_read', null, { ip: ipOf(req) });
    return await reply();
  }

  if (action === 'sign') {
    const name = clean(body.signed_name, 120);
    if (body.agree !== true || name.length < 2) return json({ error: 'sign', message: 'Tick the box and type your full name to sign.' }, 400);
    if (!pos.agreement_text || body.sha !== pos.agreement_sha256) return json({ error: 'changed', message: 'The agreement was updated. Reload the page to read the current version.' }, 409);
    if (!p.check_passed_at) return json({ error: 'order', message: 'Finish the role and the quick check first.' }, 409);
    const { error } = await db.from('ve_position_agreements').upsert({ person_id: p.id, version: pos.agreement_version, doc_sha256: pos.agreement_sha256, doc_text: pos.agreement_text,
      signed_name: name, ip: ipOf(req), user_agent: (req.headers.get('user-agent') || '').slice(0, 400) }, { onConflict: 'person_id,version', ignoreDuplicates: true });
    if (error) return json({ error: 'save_failed' }, 500);
    await db.from('ve_position_people').update({ agreed_at: p.agreed_at || nowIso(), updated_at: nowIso() }).eq('id', p.id);
    if (before(p.stage, 'agreed')) await advance(p.id, ['invited', 'role_read'], 'agreed');
    await log(p.id, me.id, 'signed', { version: pos.agreement_version, sha: pos.agreement_sha256, name }, { ip: ipOf(req) });
    const id = await sendOne(p.email, `Your signed agreement: ${pos.title}`, wrap(
      `<p style="margin:0 0 12px">Hi ${esc(firstName(p.name))}, here is a copy of the agreement you signed as <b>${esc(name)}</b> on ${nice(todayET())} (version ${esc(pos.agreement_version)}, fingerprint ${esc(String(pos.agreement_sha256).slice(0, 16))}).</p>` +
      `<div style="white-space:pre-wrap;font-size:13px;border:1px solid #e3e3e3;border-radius:8px;padding:12px">${esc(pos.agreement_text)}</div>`));
    if (id) await db.from('ve_position_agreements').update({ emailed_at: nowIso() }).eq('person_id', p.id).eq('version', pos.agreement_version);
    return await reply();
  }

  if (action === 'payout_start' || action === 'payout_status') {
    let acct = await payoutAccount(me.id);
    const test = acct ? !acct.livemode : await isTestAccount(me.email);
    if (action === 'payout_status') {
      if (!acct) return await reply();
      const { ok, d } = await stripe(test, 'GET', `accounts/${acct.stripe_account_id}`);
      if (ok) {
        const ready = transfersReady(d);
        await db.from('ve_member_payout_accounts').update({ transfers_active: ready, disabled_reason: d?.requirements?.disabled_reason || null, checked_at: nowIso() }).eq('member_id', me.id);
        if (ready) {
          await db.from('ve_position_people').update({ payouts_ready_at: p.payouts_ready_at || nowIso(), updated_at: nowIso() }).eq('id', p.id);
          if (before(p.stage, 'payouts_ready')) await advance(p.id, ['agreed'], 'payouts_ready');
        }
      }
      return await reply();
    }
    if (!p.agreed_at) return json({ error: 'order', message: 'Sign the agreement first.' }, 409);
    try {
      if (!acct) {
        // One account per member; the idempotency key stops a double tap from making two.
        const { ok, d } = await stripe(test, 'POST', 'accounts', {
          type: 'express', country: 'US', business_type: 'individual', email: me.email || '',
          'capabilities[transfers][requested]': 'true', 'metadata[member_id]': me.id, 'metadata[source]': 've-positions',
        }, `ve-acct-${me.id}`);
        if (!ok) {
          const msg = String(d?.error?.message || '');
          console.error('stripe account', msg);
          if (/signed up for Connect|restricted/i.test(msg)) await sendOne(SEAN_EMAIL, '[Positions] Stripe refused a payouts account', wrap(`<p>Stripe would not make a payouts account for <b>${esc(me.name || '')}</b>: ${esc(msg)}</p><p>Switch on Connect (and 1099 reporting) in the Vegans Explore Stripe Dashboard, then they can press Set up payouts again.</p>`));
          return json({ error: 'stripe', message: /signed up for Connect/i.test(msg) ? 'Payouts are not switched on yet. We have told the team, and we will let you know as soon as they are.' : 'Stripe did not open. Try again in a minute.' }, 400);
        }
        await db.from('ve_member_payout_accounts').upsert({ member_id: me.id, stripe_account_id: d.id, livemode: !test }, { onConflict: 'member_id', ignoreDuplicates: true });
        acct = await payoutAccount(me.id);
      }
      const { ok, d } = await stripe(test, 'POST', 'account_links', {
        account: acct!.stripe_account_id, type: 'account_onboarding',
        refresh_url: `${startUrl(pos.slug, 'payouts')}&stripe=refresh`, return_url: `${startUrl(pos.slug, 'payouts')}&stripe=return`,
      });
      if (!ok) return json({ error: 'stripe', message: 'Stripe did not open. Try again in a minute.' }, 400);
      await log(p.id, me.id, 'payout_link', null, { ip: ipOf(req) });
      return json({ ok: true, url: d.url, test_mode: test });
    } catch (e) {
      console.error('payout_start', e);
      return json({ error: 'stripe', message: 'Stripe did not open. Try again in a minute.' }, 500);
    }
  }

  if (action === 'instagram') {
    const h = clean(body.handle, 60).replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '');
    if (!/^[A-Za-z0-9._]{1,30}$/.test(h)) return json({ error: 'handle', message: 'That does not look like an Instagram handle.' }, 400);
    if (!p.payouts_ready_at) return json({ error: 'order', message: 'Set up payouts first.' }, 409);
    await db.from('ve_position_people').update({ ig_handle: h.toLowerCase(), updated_at: nowIso() }).eq('id', p.id);
    const moved = before(p.stage, 'awaiting_access') ? await advance(p.id, ['payouts_ready'], 'awaiting_access') : false;
    await log(p.id, me.id, 'instagram', { handle: h }, { ip: ipOf(req) });
    if (moved) await sendOne(SEAN_EMAIL, `${p.name || p.email} is ready for Instagram access`, wrap(
      `<p style="margin:0 0 12px"><b>${esc(p.name || p.email)}</b> finished the checklist for ${esc(pos.title)}: agreement signed, payouts ready.</p>` +
      `<ol style="margin:0 0 16px;padding-left:20px"><li>In the Instagram app on the Vegans Explore account: Shared Access, invite <b>@${esc(h)}</b>.</li><li>Allow the inbox.</li><li>On their page, tap <b>Invite sent, start trial</b>.</li></ol>` +
      btn(`${CONSOLE}#person/${p.id}`, 'Open their page')));
    return await reply();
  }

  return json({ error: 'unknown_action' }, 400);
});
