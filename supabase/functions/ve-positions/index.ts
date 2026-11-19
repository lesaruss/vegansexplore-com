// ve-positions: paid positions for members (playbook ve-positions; plan docs/plans/2026-11-13-positions-boss.md; mock /mocks/positions).
// Sean, 2026-11-13: "start the build". Tables in migration 20261113_positions.sql (RLS on, service role only).
//
// The holder (a signed-in member with a row in ve_position_people):
//   POST { action: 'me', slug }                         their position, checklist, agreement text, payouts, next payday
//   POST { action: 'role_read', slug, answers }         step 1 and 2: the role and the quick check (three answers)
//   POST { action: 'sign', slug, signed_name, agree, sha }   step 3: e-sign the agreement (ESIGN/UETA: text, hash, name, IP, browser, copy emailed)
//   POST { action: 'payout_start', slug }               step 4: Stripe Express onboarding (W-9 and bank on Stripe's pages)
//   POST { action: 'payout_status', slug }              step 4: asks Stripe whether transfers are on
//   POST { action: 'instagram', slug, handle }          their Instagram handle (optional since feature first)
//   POST { action: 'meta_email', slug, email }          the email on their Meta (Facebook) account, for Sean's Business Suite partial-access invite
//                                                       (2026-11-18, feature first: docs/plans/2026-11-18-kj-access-panel.md). Signed agreement first.
//   POST { action: 'preview', slug }                    super admins (or the ops token): the start page's data with an empty checklist, no writes
// The position dashboard (/dashboard/position, 2026-11-19; the locked mock /mocks/kj-dashboard). The holder sees their own; a super admin
// previews any holder with { as: <member id or creator slug> } (nothing saves); ops act as one holder row ({ person_id }) for proofs:
//   POST { action: 'dash' }                             every part's data: role, brief, asks, Kai thread, conversations, people, record, pay
//   POST { action: 'kai_send', text }                   Ask Kai: answered as Kai when sure, else "checking with Sean" and Sean is emailed
//   POST { action: 'ask_reply', ask_id, text }          a reply to one of Sean's asks (to Sean; Kai acknowledges)
//   POST { action: 'ask_done', ask_id, done }           tick an ask
//   POST { action: 'brief_answer', brief_id, text }     the answer to the brief's question (to Sean; Kai acknowledges)
//   POST { action: 'idea', text }                       Your ideas (to Sean; Kai acknowledges)
//   POST { action: 'report', part, message, page_url, shot? }   Report something: a ve_feedback row, like the site's Feedback button
// Sean (a superadmin member):
//   admin_team {slug}, admin_brief_save {id?, week_of, title, where_text, next_text, question, status}, admin_ask_save {id?, title, body, link,
//   due_text, sort, status, brief_id}, admin_kai_answer {message_id | person_id, text}: the Team part of the Reach console (ops too)
//   admin_list, admin_person {id}, admin_search {q}, admin_assign {slug, member_id, note, send, region}, admin_start_trial {id},
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
  awaiting_access: 'Waiting on Business Suite access', trial: 'Active (trial)', active: 'Active', paused: 'Paused', ended: 'Ended',
};
async function payoutAccount(memberId: string) {
  const { data } = await db.from('ve_member_payout_accounts').select('*').eq('member_id', memberId).maybeSingle();
  return data;
}
// The quick check: three do's and don'ts, each with one right answer. The locked role (2026-11-19): who she invites from her own accounts,
// how the account is reached (Business Suite, comments and messages only), and how her own posts go up (a collab invite to @vegansexplore).
const CHECK: Record<string, string> = { people: 'personal', account: 'business_suite', own_post: 'collab' };
const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v) && v.length <= 200;

// Ready for access: the agreement signed, payouts ready and the Meta email given. Moves them to Waiting on access once and tells Sean what to do.
async function maybeReady(pos: any, id: string) {
  const { data: p } = await db.from('ve_position_people').select('*').eq('id', id).maybeSingle();
  if (!p || !p.agreed_at || !p.payouts_ready_at || !p.meta_email) return false;
  const moved = await advance(p.id, ['agreed', 'payouts_ready'], 'awaiting_access');
  if (moved) await sendOne(SEAN_EMAIL, `${p.name || 'Your new team member'} is ready for Business Suite access`, wrap(
    `<p style="margin:0 0 12px"><b>${esc(p.name || '')}</b> finished the start page for ${esc(pos.title)}: on board, agreement signed, payouts ready.</p>` +
    `<ol style="margin:0 0 16px;padding-left:20px"><li>Meta Business Suite (business.facebook.com): Settings, People, Add people.</li>` +
    `<li>Invite <b>${esc(p.meta_email)}</b> with <b>partial access</b> to the Vegans Explore Instagram account: Content, Messages and Comments only. Never full control.</li>` +
    `<li>On their page, tap <b>Invite sent, start trial</b>.</li></ol>` + btn(`${CONSOLE}#person/${p.id}`, 'Open their page')));
  return moved;
}

// The position as the start page reads it. A draft (posting_draft, agreement_draft_*) waits for Sean's lock: the page shows it marked
// Draft and cannot sign it; signing stays on the live version until the draft is promoted (migration 20261118_positions_meta_email_and_v2_draft.sql).
function positionOut(pos: any) {
  return { slug: pos.slug, title: pos.title, summary: pos.summary, posting: pos.posting, pay_cents: pos.pay_cents, trial_days: pos.trial_days,
    agreement: { version: pos.agreement_version, text: pos.agreement_text, sha: pos.agreement_sha256 },
    draft: pos.agreement_draft_text ? { posting: pos.posting_draft || null, version: pos.agreement_draft_version, text: pos.agreement_draft_text } : null };
}

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
    steps: { role: !!p.role_read_at, check: !!p.check_passed_at, agreement: !!p.agreed_at, payouts: !!p.payouts_ready_at, instagram: !!p.ig_handle, meta: !!p.meta_email, access: !!p.access_granted_at },
    ig_handle: p.ig_handle, meta_email: p.meta_email ?? null, start_on: p.start_on, trial_review_on: p.trial_review_on, ended_on: p.ended_on,
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

// ======== The position dashboard (/dashboard/position) and Ask Kai (Sean, 2026-11-19, the locked mock /mocks/kj-dashboard) ========
// Data from the database, never the page: the role (ve_position_duties), briefs (ve_position_briefs), asks (ve_position_asks and
// ve_position_ask_done), the Ask Kai thread (ve_position_kai); conversations from ve_reach_inbound (its taps go through ve-reach itself);
// Your people from the holder's tracked links (ve_links / ve_link_clicks); the record from ve_reach_log, ve_reach_inbound and the payouts.
// Kai (Sean: "intercept and answer whatever you can answer, and then just keep me up to date on the conversation... if you're ever not
// sure, just reach out to me"): a Claude call answers as Kai; sure and not sensitive posts in her thread; otherwise her thread says Kai is
// checking with Sean and Sean gets an email with a link to answer in the Reach console (Team). Asks replies, brief answers and ideas always
// go to Sean with Kai acknowledging. Sean gets one summary email each morning of the day before's Kai conversations (the daily cron).
const MODEL = 'claude-opus-5-5';
const TEAM_CONSOLE = `${SITE}/admin/depot/reach?tab=team`;
// The goal, LOCKED by Sean 2026-11-18 ("250, lock it in"; playbook ve-directory-reach): 250 members, 60 through the holder's links, 100 claims.
const GOAL = { members: 250, holder_members: 60, claims: 100, by: '2026-12-31' };
const KAI_CHECKING = 'I\'m checking with Sean, back soon.';
const ACK: Record<string, string> = {
  ask: 'Thank you. I passed your reply to Sean, and his answer will show up here.',
  brief: 'Thank you for your answer. Sean reads every one, and anything he adds will show up here.',
  idea: 'Love that you sent this. It is with Sean now, and his answer will show up here.',
};
// Anything about the holder's money, contracts, access, policy or promises always goes to Sean, whatever Kai thinks (the model also flags them).
const SENSITIVE = /\b(my pay|paid|payout|payouts|payday|paycheck|money|stipend|raise|bonus|invoice|taxes|tax|1099|w-?9|stripe|salary|contract|agreement|legal|lawyer|liability|access|password|passwords|login|log in|permission|permissions|admin|business suite|policy|policies|promise|promised|guarantee|refund|discount|hire|hiring|fire|quit|terminate)\b/i;
const FEEDBACK_KINDS = ['suggestion', 'broken', 'wrong', 'confusing', 'missing', 'idea', 'praise', 'other'];
const REPORT_PARTS: Record<string, string> = { home: 'Home', role: 'Your role', conversations: 'Conversations', people: 'Your people', asks: 'Asks', ask: 'Ask Kai', briefs: 'Briefs', record: 'Your record', kit: 'Your kit' };
const etDayOf = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
const mondayOf = (d: string) => addDays(d, -((toDate(d).getUTCDay() + 6) % 7));
// Midnight Eastern at the start of a day, as an instant (EST or EDT, whichever that day is in).
function etMidnight(d: string): string {
  for (const h of [4, 5]) { const iso = `${d}T0${h}:00:00.000Z`; if (etDayOf(iso) === d && etDayOf(new Date(Date.parse(iso) - 3600000).toISOString()) !== d) return iso; }
  return `${d}T05:00:00.000Z`;
}

async function holderLink(p: any, memberId: string | null) {
  let code: string | null = p?.link_code || null;
  if (!code && memberId) { const { data: c } = await db.from('ve_creator_dashboards').select('go_code').eq('member_id', memberId).maybeSingle(); code = c?.go_code || null; }
  if (!code && memberId) {
    const { data: m } = await db.from('members').select('referral_code').eq('id', memberId).maybeSingle();
    if (m?.referral_code) { const { data: l } = await db.from('ve_links').select('code').ilike('destination', `%ref=${m.referral_code}%`).order('created_at').limit(1); code = l?.[0]?.code || null; }
  }
  if (!code) return null;
  const { data: l } = await db.from('ve_links').select('id, code, active').eq('code', code).maybeSingle();
  return l ? { id: l.id, code: l.code, url: `vegansexplore.com/go/${l.code}`, active: l.active } : null;
}

// Who the holder's links brought in: real clicks, the members those clicks are credited to, and the ones who joined after clicking.
async function linkCredit(linkIds: string[], memberId: string | null, since: string) {
  const out = { clicks: 0, credited: 0, joined: 0, joined_week: 0 };
  if (!linkIds.length) return out;
  const { data: clicks } = await db.from('ve_link_clicks').select('member_id, clicked_at').in('link_id', linkIds).eq('is_bot', false).limit(5000);
  out.clicks = (clicks || []).length;
  const first: Record<string, string> = {};
  for (const c of clicks || []) if (c.member_id && c.member_id !== memberId && (!first[c.member_id] || c.clicked_at < first[c.member_id])) first[c.member_id] = c.clicked_at;
  const ids = Object.keys(first);
  if (!ids.length) return out;
  const { data: ms } = await db.from('members').select('id, created_at, is_superadmin').in('id', ids);
  for (const m of ms || []) {
    if (m.is_superadmin) continue;
    out.credited++;
    // Joined through the link: the account was made after their first click (an hour's grace for the click landing after sign-up).
    if (Date.parse(m.created_at) >= Date.parse(first[m.id]) - 3600000) { out.joined++; if (m.created_at >= since) out.joined_week++; }
  }
  return out;
}

function threadOut(rows: any[]) {
  return (rows || []).map((r) => ({ id: r.id, author: r.author, topic: r.topic, ref_id: r.ref_id, body: r.body, at: r.created_at,
    waiting: r.author === 'holder' && r.needs_sean && !r.answered_at }));
}

async function dashData(pos: any, p: any, member: any, preview: boolean) {
  const today = todayET(), mon = mondayOf(today), since = etMidnight(mon);
  const pid = p?.id || null, mid = member?.id || null;
  const [duties, briefs, asks, done, thread, creator, inbound, members, claims] = await Promise.all([
    db.from('ve_position_duties').select('id, kind, grp, grp_sort, grp_tag, tone, sort, body, step').eq('position_id', pos.id).eq('status', 'live').order('grp_sort').order('sort'),
    db.from('ve_position_briefs').select('id, week_of, title, from_line, where_text, next_text, question, status, published_at').eq('position_id', pos.id).in('status', preview ? ['published', 'draft'] : ['published']).order('week_of', { ascending: false }).limit(12),
    db.from('ve_position_asks').select('id, brief_id, title, body, link, due_text, sort, status').eq('position_id', pos.id).in('status', preview ? ['open', 'draft'] : ['open']).order('sort'),
    pid ? db.from('ve_position_ask_done').select('ask_id, done_at').eq('person_id', pid) : Promise.resolve({ data: [] as any[] }),
    pid ? db.from('ve_position_kai').select('*').eq('person_id', pid).order('created_at').limit(400) : Promise.resolve({ data: [] as any[] }),
    mid ? db.from('ve_creator_dashboards').select('display_name, handle, city, people_slug, kit, go_code').eq('member_id', mid).maybeSingle() : Promise.resolve({ data: null as any }),
    db.from('ve_reach_inbound').select('id, handle, grp, kind, status, note, listing_id, created_at, welcomed_by, welcomed_at').order('created_at', { ascending: false }).limit(200),
    db.from('members').select('id', { count: 'exact', head: true }).or('is_superadmin.is.null,is_superadmin.eq.false'),
    db.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'approved').not('owner_member_id', 'is', null),
  ]);
  // Briefs and asks only show once Sean publishes them; the asks tied to a draft brief wait with it.
  const pubBriefs = new Set((briefs.data || []).map((b: any) => b.id));
  const askRows = (asks.data || []).filter((a: any) => !a.brief_id || pubBriefs.has(a.brief_id));
  const th = thread.data || [];
  const doneBy = new Map((done.data || []).map((d: any) => [d.ask_id, d.done_at]));
  const replied = (topic: string, id: string) => th.some((m: any) => m.author === 'holder' && m.topic === topic && m.ref_id === id);
  // Inbound: everyone not done first, oldest first (as the Reach console orders them), then the most recent done.
  const ib = inbound.data || [];
  const lids = [...new Set(ib.map((x: any) => x.listing_id).filter(Boolean))];
  const { data: ls } = lids.length ? await db.from('listings').select('id, slug, name, logo_url').in('id', lids) : { data: [] as any[] };
  const lBy = new Map((ls || []).map((l: any) => [l.id, l]));
  const open = ib.filter((x: any) => x.status !== 'done').reverse(), closed = ib.filter((x: any) => x.status === 'done').slice(0, 20);
  const conv = [...open, ...closed].map((x: any) => ({ ...x, listing: x.listing_id ? lBy.get(x.listing_id) || null : null, mine: !!mid && x.welcomed_by === mid }));
  // Links: the holder's own link, plus the personal links made for the people they answered (ve-reach, created_by them).
  const link = await holderLink(p, mid);
  const { data: made } = mid ? await db.from('ve_links').select('id, created_at').eq('created_by', mid).eq('initiative_slug', 'directory-reach-2026') : { data: [] as any[] };
  const credit = await linkCredit([...(link ? [link.id] : []), ...(made || []).map((l: any) => l.id)], mid, since);
  const own = link ? await linkCredit([link.id], mid, since) : { clicks: 0, credited: 0, joined: 0, joined_week: 0 };
  // The record, by week (Monday to Sunday, Eastern), from the holder's own taps.
  const from4 = etMidnight(addDays(mon, -21));
  const [logs, welcomed] = mid ? await Promise.all([
    db.from('ve_reach_log').select('kind, at').eq('member_id', mid).gte('at', from4),
    db.from('ve_reach_inbound').select('welcomed_at').eq('welcomed_by', mid).gte('welcomed_at', from4),
  ]) : [{ data: [] as any[] }, { data: [] as any[] }];
  const weeks = [0, 1, 2, 3].map((i) => addDays(mon, -7 * i)).map((w) => {
    const a = etMidnight(w), b = etMidnight(addDays(w, 7)), inW = (t: string) => t >= a && t < b;
    return { week_of: w,
      answered: (welcomed.data || []).filter((x: any) => x.welcomed_at && inW(x.welcomed_at)).length + (logs.data || []).filter((x: any) => x.kind === 'replied' && inW(x.at)).length,
      links: (made || []).filter((x: any) => inW(x.created_at)).length + (logs.data || []).filter((x: any) => x.kind === 'page_sent' && inW(x.at)).length };
  });
  const kit = creator.data?.kit || {};
  const avatar = creator.data?.people_slug && kit.avatar ? `${SUPABASE_URL}/storage/v1/object/public/vegan-media/media/people/${creator.data.people_slug}/${kit.avatar}` : (member?.avatar_url || null);
  const t = todayET(); const s = nextStretch(t, t, null);
  const pay = pid ? await personView(pos, p) : { stage: 'invited', stage_words: STAGE_WORDS.invited, steps: {}, next_payout: { ...s, amount_cents: amountFor(pos.pay_cents, s.days), if_started_today: true }, payouts: [] };
  return {
    preview, today, week_of: mon,
    position: { slug: pos.slug, title: pos.title, pay_cents: pos.pay_cents },
    who: { name: creator.data?.display_name || firstName(member?.name || p?.name || ''), full_name: member?.name || p?.name || null, avatar, region: p?.region || null,
      handle: creator.data?.handle || p?.ig_handle || null, city: creator.data?.city || null, has_creator_kit: !!creator.data },
    person: { id: pid, stage: (pay as any).stage, stage_words: (pay as any).stage_words, steps: (pay as any).steps, start_on: p?.start_on || null,
      next_payout: (pay as any).next_payout, payouts: ((pay as any).payouts || []).map((x: any) => ({ pay_on: x.pay_on, covers_from: x.covers_from, covers_to: x.covers_to, amount_cents: x.amount_cents, status: x.status })) },
    duties: (duties.data || []).map((d: any) => ({ ...d, done: d.step === 'link' ? !!link : d.step && d.step !== 'pages' ? !!(pay as any).steps?.[d.step] : null })),
    briefs: (briefs.data || []).map((b: any) => ({ ...b, asks: askRows.filter((a: any) => a.brief_id === b.id).map((a: any) => a.title), answered: replied('brief', b.id) })),
    asks: askRows.map((a: any) => ({ ...a, done: doneBy.has(a.id), replied: replied('ask', a.id) })),
    thread: threadOut(th),
    goal: { members: members.count || 0, members_goal: GOAL.members, holder_members: credit.joined, holder_goal: GOAL.holder_members, claims: claims.count || 0, claims_goal: GOAL.claims, by: GOAL.by },
    link, people: { own, all: credit },
    conversations: conv, open_conversations: open.length,
    record: { weeks, answered_week: weeks[0].answered, links_week: weeks[0].links, members_all: credit.joined },
  };
}

// ---- Kai ----
const KAI_RULES = `Locked rules (Sean's; never contradict them):
- Membership is free; a short survey is the only way in. Founding Member closes at midnight Eastern on January 1, 2027. The $11 is an optional give. Claiming a listing is free for members; the owner's dashboard walks them through it with Liz, our Guide.
- Never promise anything that is not built; say it is coming.
- Listings and businesses are contacted through @vegansexplore only, so those relationships stay with the brand. The holder may invite people they know personally, from their own accounts, with their own link.
- The holder never posts, edits or deletes anything on @vegansexplore, never touches its profile, settings or password, and never starts cold messages from @vegansexplore. They answer comments and messages as Vegans Explore in Business Suite (messages and comments only).
- Their own posts about Vegans Explore go up as a collab invite to @vegansexplore.
- Managed services (sites, photos, video, social, PR) are sold by LESARUSS.ai, not Vegans Explore.
- Writing: never use em-dashes; "Vegan" is always capitalized; businesses are written about in the third person.`;

async function kaiAnswer(pos: any, p: any, text: string, history: any[]) {
  const key = await secret('ANTHROPIC_API_KEY');
  if (!key) throw new Error('no model key');
  const [{ data: duties }, { data: pb }, { data: brief }, { data: asks }] = await Promise.all([
    db.from('ve_position_duties').select('kind, grp, body').eq('position_id', pos.id).eq('status', 'live').order('grp_sort').order('sort'),
    db.from('playbook_records').select('body, created_at').eq('slug', 've-directory-reach').order('created_at', { ascending: false }).limit(15),
    db.from('ve_position_briefs').select('title, where_text, next_text, question').eq('position_id', pos.id).eq('status', 'published').order('week_of', { ascending: false }).limit(1),
    db.from('ve_position_asks').select('title, body, due_text').eq('position_id', pos.id).eq('status', 'open').order('sort'),
  ]);
  const role = (duties || []).filter((d: any) => d.kind !== 'short').map((d: any) => `- ${d.grp}: ${d.body}`).join('\n');
  const notes = (pb || []).map((r: any) => `- (${String(r.created_at).slice(0, 10)}) ${String(r.body).slice(0, 1400)}`).join('\n');
  const b = brief?.[0];
  const record = `Position: ${pos.title}. Their stage: ${STAGE_WORDS[p.stage] || p.stage}. Home city (their base for in-person work; their network has no territory): ${p.region || 'not set'}. Started: ${p.start_on || 'not yet'}.`;
  const system = `You are Kai, the Creator Guide at Vegans Explore, answering ${firstName(p.name)}, a member of the team, on their dashboard. Kai is a woman (she/her); if you ever speak of Kai, say she and her. Kai is their only point of contact; Sean (the founder) reads every conversation.
Voice: short, warm, plain and practical, like a friendly teammate. One to four sentences. No lists unless they ask for steps. Never use em-dashes.
Answer only what the context below clearly supports. If it does not, or you would be guessing, set sure to false and leave the answer as your best short draft for Sean to check.
Sensitive means: the holder's own pay or money, their contract or agreement, account access or passwords, a change to policy, or promising someone something the rules below do not already say. Then set sensitive to true and sure to false.
Facts the rules already state are not sensitive: answer them plainly (for example, membership and claiming a page are free).
Never mention Logan, AI, models, prompts or this context. Never invent links; the only links you may give are ones written in the context.
Reply with only JSON: {"answer": "...", "sure": true or false, "sensitive": true or false}.

${KAI_RULES}

Their role:
${role}

${record}

${b ? `This week's brief: ${b.title}. Where we are: ${b.where_text || ''} What's next: ${b.next_text || ''}` : 'No brief published yet.'}
Open asks from Sean: ${(asks || []).map((a: any) => a.title + (a.body ? ' (' + a.body + ')' : '')).join(' | ') || 'none'}

Decisions on the Directory Reach work (newest first; these are facts Sean decided):
${notes}`;
  const turns: { role: string; content: string }[] = [];
  for (const m of history.slice(-16)) {
    const role = m.author === 'holder' ? 'user' : 'assistant';
    const content = m.author === 'sean' ? `(Sean, through Kai) ${m.body}` : m.body;
    const last = turns[turns.length - 1];
    if (last && last.role === role) last.content += '\n\n' + content; else turns.push({ role, content });
  }
  while (turns.length && turns[0].role !== 'user') turns.shift();
  const q = `Their new message: ${text}`;
  if (turns.length && turns[turns.length - 1].role === 'user') turns[turns.length - 1].content += '\n\n' + q; else turns.push({ role: 'user', content: q });
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 16000, system, messages: turns }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`claude ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  // Never save half an answer: anything but a finished turn is an error, and the question goes to Sean.
  if (j.stop_reason !== 'end_turn') throw new Error(`claude stop_reason ${j.stop_reason}`);
  const txt = (j.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('');
  const a = txt.indexOf('{'), z = txt.lastIndexOf('}');
  if (a < 0 || z < a) throw new Error('claude: no json');
  const o = JSON.parse(txt.slice(a, z + 1));
  return { answer: clean(String(o.answer || ''), 3000), sure: o.sure === true, sensitive: o.sensitive === true, model: String(j.model || MODEL) };
}

async function tellSean(p: any, mine: any, topic: string, refTitle: string | null, why: string | null, draft: string | null) {
  const who = p.name || 'Your team member';
  const subj = topic === 'chat' ? `Kai needs you: ${firstName(who)} asked something` : topic === 'ask' ? `${firstName(who)} replied to an ask` : topic === 'brief' ? `${firstName(who)} answered the brief` : `${firstName(who)} sent an idea`;
  const id = await sendOne(SEAN_EMAIL, subj, wrap(
    `<p style="margin:0 0 12px"><b>${esc(who)}</b>${refTitle ? `, on <b>${esc(refTitle)}</b>` : ''}:</p>` +
    `<div style="white-space:pre-wrap;margin:0 0 12px;padding:12px;background:#f3f7f4;border-radius:6px">${esc(mine.body)}</div>` +
    (why ? `<p style="margin:0 0 12px;color:#555">Kai held this for you: ${esc(why)}. Their thread says Kai is checking with you.</p>` : `<p style="margin:0 0 12px;color:#555">Kai thanked them and said your answer will show up in their thread.</p>`) +
    (draft ? `<p style="margin:0 0 6px;font-size:13px;color:#555">Kai's draft (not sent):</p><div style="white-space:pre-wrap;margin:0 0 12px;padding:10px;border:1px dashed #bbb;border-radius:6px;font-size:14px">${esc(draft)}</div>` : '') +
    btn(`${TEAM_CONSOLE}&person=${p.id}#m-${mine.id}`, 'Answer in the console')));
  if (id) await db.from('ve_position_kai').update({ emailed_at: nowIso() }).eq('id', mine.id);
}

async function kaiSend(pos: any, p: any, text: string, topic: 'chat' | 'ask' | 'brief' | 'idea', refId: string | null, refTitle: string | null) {
  const { data: history } = await db.from('ve_position_kai').select('author, body, created_at').eq('person_id', p.id).order('created_at', { ascending: false }).limit(16);
  const { data: mine, error } = await db.from('ve_position_kai').insert({ person_id: p.id, author: 'holder', topic, ref_id: refId, body: text, needs_sean: topic !== 'chat' }).select('*').single();
  if (error || !mine) throw new Error('save_failed');
  if (topic !== 'chat') {
    await db.from('ve_position_kai').insert({ person_id: p.id, author: 'kai', topic, ref_id: refId, body: ACK[topic], reply_to: mine.id });
    await tellSean(p, mine, topic, refTitle, null, null);
    return { sent_to_sean: true };
  }
  let out: Awaited<ReturnType<typeof kaiAnswer>> | null = null, why: string | null = null;
  if (SENSITIVE.test(text) || /\$\s?\d/.test(text)) why = 'it is about money, contracts, access, policy or a promise';
  try { out = await kaiAnswer(pos, p, text, (history || []).reverse()); } catch (e) { console.error('kai', String(e)); if (!why) why = 'Kai could not answer this one'; }
  if (!why && out && out.sensitive) why = 'it is about money, contracts, access, policy or a promise';
  if (!why && out && !out.sure) why = 'Kai was not sure';
  if (!why && out && !out.answer) why = 'Kai had no answer';
  if (!why && out) {
    await db.from('ve_position_kai').insert({ person_id: p.id, author: 'kai', topic, body: out.answer, sure: true, reply_to: mine.id, model: out.model });
    await db.from('ve_position_kai').update({ answered_at: nowIso() }).eq('id', mine.id);
    return { answered: true };
  }
  await db.from('ve_position_kai').update({ needs_sean: true }).eq('id', mine.id);
  await db.from('ve_position_kai').insert({ person_id: p.id, author: 'kai', topic, body: KAI_CHECKING, sure: false, reply_to: mine.id, model: out?.model || null });
  await tellSean(p, mine, topic, null, why, out?.answer || null);
  return { checking: true };
}

// The once-a-day summary for Sean: every Kai conversation on one day (Eastern), sent once (ve_position_events 'kai_digest').
async function kaiDigest(day: string) {
  const { data: sent } = await db.from('ve_position_events').select('id').eq('action', 'kai_digest').eq('detail->>day', day).limit(1);
  if (sent?.length) return { sent: false, already: true };
  const { data: rows } = await db.from('ve_position_kai').select('person_id, author, topic, body, needs_sean, answered_at, created_at')
    .gte('created_at', etMidnight(day)).lt('created_at', etMidnight(addDays(day, 1))).order('created_at');
  if (!rows?.length) return { sent: false, n: 0 };
  const pids: string[] = [...new Set<string>(rows.map((r: any) => String(r.person_id)))];
  const { data: ps } = await db.from('ve_position_people').select('id, name').in('id', pids);
  const nameBy = new Map<string, string>((ps || []).map((x: any) => [String(x.id), String(x.name || 'Team member')]));
  const waiting = rows.filter((r: any) => r.author === 'holder' && r.needs_sean && !r.answered_at).length;
  const time = (iso: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
  const who = (r: any, pid: string) => r.author === 'holder' ? esc(firstName((nameBy.get(pid) || ''))) : r.author === 'sean' ? 'You, through Kai' : 'Kai';
  const blocks = pids.map((pid) => `<h3 style="margin:16px 0 6px;font-size:16px">${esc((nameBy.get(pid) || ''))}</h3>` + rows.filter((r: any) => r.person_id === pid).map((r: any) =>
    `<p style="margin:0 0 6px"><b>${who(r, pid)}</b> <span style="color:#777;font-size:12px">${time(r.created_at)}${r.topic !== 'chat' ? ', ' + r.topic : ''}</span><br>${esc(String(r.body).slice(0, 800))}</p>`).join('')).join('');
  const id = await sendOne(SEAN_EMAIL, `Kai's day, ${nice(day)}: ${rows.length} message${rows.length === 1 ? '' : 's'}${waiting ? `, ${waiting} waiting on you` : ''}`, wrap(
    `<p style="margin:0 0 12px">Every Kai conversation on ${nice(day)} (Eastern).${waiting ? ` <b>${waiting} still waiting on your answer.</b>` : ''}</p>${blocks}` + btn(TEAM_CONSOLE, 'Open the console')));
  if (id) await log(null, 'cron', 'kai_digest', { day, n: rows.length, waiting });
  return { sent: !!id, n: rows.length };
}

// Report something: into ve_feedback exactly like the site's Feedback button, with an optional screenshot saved beside feedback's voice notes.
async function report(req: Request, me: any, body: any) {
  const message = clean(body.message, 3000);
  const page = clean(body.page_url, 500);
  if (message.length < 5) return json({ error: 'message_needed', message: 'Tell us what looks off, in a few words.' }, 400);
  if (!/^https?:\/\//i.test(page)) return json({ error: 'page_needed' }, 400);
  let shot = '';
  if (typeof body.shot === 'string' && body.shot.length > 100) {
    if (body.shot.length > 7_000_000) return json({ error: 'shot_too_big', message: 'That screenshot is too big. Try a smaller one.' }, 413);
    const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(body.shot);
    if (!m) return json({ error: 'bad_shot', message: 'Attach a PNG, JPEG or WebP picture.' }, 400);
    const bin = atob(m[2]); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    const path = `media/feedback/shots/${todayET()}/${crypto.randomUUID()}.${ext}`;
    const up = await db.storage.from('vegan-media').upload(path, bytes, { contentType: `image/${m[1]}`, upsert: false });
    if (up.error) { console.error('shot upload', up.error.message); return json({ error: 'save_failed', message: 'The screenshot did not upload. Try again.' }, 500); }
    shot = `${SUPABASE_URL}/storage/v1/object/public/vegan-media/${path}`;
  }
  const part = REPORT_PARTS[String(body.part || '')] || 'Dashboard';
  const kind = FEEDBACK_KINDS.includes(String(body.kind)) ? String(body.kind) : 'other';
  const row = { kind, page_url: page, page_label: `Position dashboard: ${part}`, message: message + (shot ? `\n\nScreenshot: ${shot}` : ''), email: me.email || null, name: me.name || null,
    visitor: null, member_signed_in: true, user_agent: clean(req.headers.get('user-agent'), 300) || null, viewport: clean(body.viewport, 20) || null };
  const ins = await db.from('ve_feedback').insert(row).select('id').single();
  if (ins.error) return json({ error: 'save_failed' }, 500);
  // The same notice the Feedback button sends, unless Sean has feedback gathered into the daily digest.
  const { data: fs } = await db.from('ve_site_settings').select('value').eq('key', 'feedback').maybeSingle();
  if ((fs?.value as any)?.digest !== true) await sendOne(SEAN_EMAIL, `[Feedback] Reported on the position dashboard: ${part}`, wrap(
    `<p style="margin:0 0 4px"><b>Page:</b> <a href="${esc(page)}">${esc(row.page_label)}</a></p><div style="white-space:pre-wrap;margin:12px 0;padding:12px;background:#f3f7f4;border-radius:6px">${esc(row.message)}</div>` +
    `<p style="margin:0 0 12px;color:#444;font-size:13px">From ${esc(me.name || 'a team member')}, signed in.</p>` + btn(`${SITE}/admin/depot/feedback#item/${ins.data.id}`, 'Open it in the Depot')));
  return json({ ok: true, id: ins.data.id });
}

// The team view in the Reach console: briefs, asks, threads, and what waits on Sean.
async function adminTeam(slug: string) {
  const pos = await positionBySlug(slug);
  if (!pos) return null;
  const [{ data: briefs }, { data: asks }, { data: people }] = await Promise.all([
    db.from('ve_position_briefs').select('*').eq('position_id', pos.id).neq('status', 'retired').order('week_of', { ascending: false }).limit(20),
    db.from('ve_position_asks').select('*').eq('position_id', pos.id).neq('status', 'retired').order('sort'),
    db.from('ve_position_people').select('id, name, stage, region').eq('position_id', pos.id).neq('stage', 'ended'),
  ]);
  const ids = (people || []).map((x: any) => x.id);
  const { data: msgs } = ids.length ? await db.from('ve_position_kai').select('*').in('person_id', ids).order('created_at', { ascending: false }).limit(300) : { data: [] as any[] };
  const { data: dones } = ids.length ? await db.from('ve_position_ask_done').select('ask_id, person_id, done_at').in('person_id', ids) : { data: [] as any[] };
  return { position: { slug: pos.slug, title: pos.title }, briefs: briefs || [], asks: (asks || []).map((a: any) => ({ ...a, done_by: (dones || []).filter((d: any) => d.ask_id === a.id).length })),
    people: (people || []).map((x: any) => ({ ...x, stage_words: STAGE_WORDS[x.stage], waiting: (msgs || []).filter((m: any) => m.person_id === x.id && m.author === 'holder' && m.needs_sean && !m.answered_at).length })),
    waiting: (msgs || []).filter((m: any) => m.author === 'holder' && m.needs_sean && !m.answered_at).reverse().map((m: any) => ({ ...m, name: (people || []).find((x: any) => x.id === m.person_id)?.name || null })),
    threads: Object.fromEntries(ids.map((id: string) => [id, threadOut((msgs || []).filter((m: any) => m.person_id === id).reverse())])) };
}


// The four Team actions in the Reach console (super admin, or ops for proofs).
async function adminDash(action: string, body: any, actor: string, actorId: string | null): Promise<Response | null> {
  if (action === 'admin_team') {
    const t = await adminTeam(isSlug(body.slug) ? body.slug : 'social-media-manager-instagram');
    return t ? json({ ok: true, ...t }) : json({ error: 'not_found' }, 404);
  }
  if (action === 'admin_brief_save') {
    const pos = await positionBySlug(isSlug(body.slug) ? body.slug : 'social-media-manager-instagram');
    if (!pos) return json({ error: 'not_found' }, 404);
    const status = ['draft', 'published', 'retired'].includes(body.status) ? body.status : 'draft';
    const week = /^\d{4}-\d{2}-\d{2}$/.test(String(body.week_of || '')) ? body.week_of : mondayOf(todayET());
    const row: Record<string, unknown> = { week_of: week, title: clean(body.title, 200), where_text: clean(body.where_text, 3000) || null, next_text: clean(body.next_text, 3000) || null,
      question: clean(body.question, 1000) || null, status, updated_at: nowIso() };
    if (!row.title) return json({ error: 'title_needed', message: 'Give the brief a title.' }, 400);
    let id = isId(body.id) ? body.id : null, before: any = null;
    if (id) {
      before = (await db.from('ve_position_briefs').select('status, published_at').eq('id', id).eq('position_id', pos.id).maybeSingle()).data;
      if (!before) return json({ error: 'not_found' }, 404);
      if (status === 'published' && !before.published_at) row.published_at = nowIso();
      const { error } = await db.from('ve_position_briefs').update(row).eq('id', id);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
    } else {
      if (status === 'published') row.published_at = nowIso();
      const { data, error } = await db.from('ve_position_briefs').insert({ ...row, position_id: pos.id, created_by: actorId }).select('id').single();
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      id = data.id;
    }
    // Publishing a brief opens the asks written with it.
    if (status === 'published') await db.from('ve_position_asks').update({ status: 'open', updated_at: nowIso() }).eq('brief_id', id).eq('status', 'draft');
    await log(null, actor, 'brief_' + status, { id, title: row.title });
    return json({ ok: true, id });
  }
  if (action === 'admin_ask_save') {
    const pos = await positionBySlug(isSlug(body.slug) ? body.slug : 'social-media-manager-instagram');
    if (!pos) return json({ error: 'not_found' }, 404);
    const link = clean(body.link, 500);
    const row: Record<string, unknown> = { title: clean(body.title, 300), body: clean(body.body, 2000) || null, link: /^(https?:\/\/|\/)/.test(link) ? link : null,
      due_text: clean(body.due_text, 60) || null, sort: Number.isFinite(+body.sort) ? Math.round(+body.sort) : 0,
      status: ['draft', 'open', 'retired'].includes(body.status) ? body.status : 'open', brief_id: isId(body.brief_id) ? body.brief_id : null, updated_at: nowIso() };
    if (!row.title) return json({ error: 'title_needed', message: 'Write the ask.' }, 400);
    if (isId(body.id)) {
      const { data, error } = await db.from('ve_position_asks').update(row).eq('id', body.id).eq('position_id', pos.id).select('id');
      if (error || !data?.length) return json({ error: 'save_failed' }, 500);
      await log(null, actor, 'ask_saved', { id: body.id, status: row.status });
      return json({ ok: true, id: body.id });
    }
    const { data, error } = await db.from('ve_position_asks').insert({ ...row, position_id: pos.id, created_by: actorId }).select('id').single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    await log(null, actor, 'ask_saved', { id: data.id, status: row.status });
    return json({ ok: true, id: data.id });
  }
  if (action === 'admin_kai_answer') {
    const text = clean(body.text, 4000);
    if (text.length < 2) return json({ error: 'text_needed', message: 'Write your answer first.' }, 400);
    let personId = isId(body.person_id) ? body.person_id : null, replyTo: string | null = null, topic = 'chat', ref: string | null = null;
    if (isId(body.message_id)) {
      const { data: m } = await db.from('ve_position_kai').select('id, person_id, topic, ref_id, author').eq('id', body.message_id).maybeSingle();
      if (!m || m.author !== 'holder') return json({ error: 'not_found' }, 404);
      personId = m.person_id; replyTo = m.id; topic = m.topic; ref = m.ref_id;
    }
    if (!personId) return json({ error: 'bad_request' }, 400);
    const { error } = await db.from('ve_position_kai').insert({ person_id: personId, author: 'sean', topic, ref_id: ref, body: text, reply_to: replyTo });
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    if (replyTo) await db.from('ve_position_kai').update({ answered_at: nowIso() }).eq('id', replyTo);
    await log(personId, actor, 'kai_answer', { reply_to: replyTo });
    return json({ ok: true });
  }
  return null;
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
    let kai: unknown = null;
    try { kai = await kaiDigest(addDays(todayET(), -1)); } catch (e) { console.error('kai digest', e); kai = { error: String(e) }; }
    try { return json({ ok: true, ...(await cron()), kai_digest: kai }); } catch (e) { console.error('cron', e); return json({ error: 'cron_failed', message: String(e), kai_digest: kai }, 500); }
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

  // The start page as Sean reviews it: the real position text (and its drafts), an empty checklist, nothing written.
  if (action === 'preview') {
    const ops = await isOps(req);
    const v = ops ? null : await viewer(req);
    if (!ops && !v?.is_superadmin) return json({ error: 'forbidden' }, 403);
    if (!isSlug(body.slug)) return json({ error: 'bad_request' }, 400);
    const pos = await positionBySlug(body.slug);
    if (!pos) return json({ error: 'not_found' }, 404);
    const t = todayET(); const s = nextStretch(t, t, null);
    return json({ ok: true, preview: true, position: positionOut(pos), person: {
      id: null, name: 'Preview', stage: 'invited', stage_words: STAGE_WORDS.invited, path: 'assigned',
      steps: { role: false, check: false, agreement: false, payouts: false, instagram: false, meta: false, access: false },
      ig_handle: null, meta_email: null, start_on: null, trial_review_on: null, ended_on: null, agreement: null, payouts_account: null, payouts: [],
      next_payout: { ...s, amount_cents: amountFor(pos.pay_cents, s.days), if_started_today: true } } });
  }

  // ======== The position dashboard (/dashboard/position) ========
  // The holder sees their own; a super admin previews any holder with { as: <member id or creator slug> } (nothing saves); ops act as one
  // holder row ({ person_id }) for proofs from SQL.
  if (['dash', 'kai_send', 'ask_reply', 'ask_done', 'brief_answer', 'idea', 'report'].includes(action)) {
    const ops = await isOps(req);
    const v = ops ? null : await viewer(req);
    if (!ops && !v) return json({ error: 'sign_in' }, 401);
    let p: any = null, member: any = v, preview = false;
    const mcols = 'id, name, email, avatar_url, is_superadmin, membership_status';
    if (ops && isId(body.person_id)) {
      p = (await db.from('ve_position_people').select('*').eq('id', body.person_id).maybeSingle()).data;
      if (!p) return json({ error: 'not_found' }, 404);
      member = p.member_id ? (await db.from('members').select(mcols).eq('id', p.member_id).maybeSingle()).data : { id: null, name: p.name, email: null };
    } else if (body.as && (ops || v?.is_superadmin)) {
      preview = true;
      const as = clean(String(body.as), 80);
      let mid: string | null = isId(as) ? as : null;
      if (!mid) mid = (await db.from('ve_creator_dashboards').select('member_id').eq('slug', as).maybeSingle()).data?.member_id || null;
      if (!mid) return json({ error: 'not_found', message: 'No member by that id or creator slug.' }, 404);
      member = (await db.from('members').select(mcols).eq('id', mid).maybeSingle()).data;
      if (!member) return json({ error: 'not_found' }, 404);
      p = (await db.from('ve_position_people').select('*').eq('member_id', mid).neq('stage', 'ended').order('created_at', { ascending: false }).limit(1)).data?.[0] || null;
    } else if (v) {
      p = (await db.from('ve_position_people').select('*').eq('member_id', v.id).neq('stage', 'ended').order('created_at', { ascending: false }).limit(1)).data?.[0] || null;
      if (!p) return json({ error: 'not_holder', message: 'This dashboard is for the Vegans Explore team. If you hold a position, sign in with the account it was given to.' }, 403);
    } else return json({ error: 'bad_request' }, 400);
    const pos = p ? (await db.from('ve_positions').select('*').eq('id', p.position_id).maybeSingle()).data : await positionBySlug(isSlug(body.slug) ? body.slug : 'social-media-manager-instagram');
    if (!pos) return json({ error: 'not_found' }, 404);
    if (action === 'dash') return json({ ok: true, ...(await dashData(pos, p, member, preview)) });
    // Report something works in a preview too (it is feedback from whoever is looking); everything else saves only for the holder.
    if (action === 'report') return await report(req, preview ? v || { name: 'Ops preview', email: null } : { name: member?.name || p?.name, email: member?.email || null }, body);
    if (preview || !p) return json({ error: 'preview', message: 'Preview: nothing is saved.' }, 409);
    if (action === 'ask_done') {
      if (!isId(body.ask_id)) return json({ error: 'bad_request' }, 400);
      const { data: a } = await db.from('ve_position_asks').select('id').eq('id', body.ask_id).eq('position_id', pos.id).eq('status', 'open').maybeSingle();
      if (!a) return json({ error: 'not_found' }, 404);
      if (body.done === false) await db.from('ve_position_ask_done').delete().eq('ask_id', a.id).eq('person_id', p.id);
      else await db.from('ve_position_ask_done').upsert({ ask_id: a.id, person_id: p.id }, { onConflict: 'ask_id,person_id', ignoreDuplicates: true });
      return json({ ok: true });
    }
    const text = clean(body.text, 4000);
    if (text.length < 2) return json({ error: 'text_needed', message: 'Write a few words first.' }, 400);
    const { count } = await db.from('ve_position_kai').select('id', { count: 'exact', head: true }).eq('person_id', p.id).eq('author', 'holder').gte('created_at', etMidnight(todayET()));
    if ((count || 0) >= 60) return json({ error: 'daily_limit', message: 'That is a lot for one day. Kai will pick up tomorrow; anything urgent, Sean already sees.' }, 429);
    try {
      if (action === 'kai_send') return json({ ok: true, ...(await kaiSend(pos, p, text, 'chat', null, null)) });
      if (action === 'idea') return json({ ok: true, ...(await kaiSend(pos, p, text, 'idea', null, null)) });
      if (action === 'ask_reply') {
        if (!isId(body.ask_id)) return json({ error: 'bad_request' }, 400);
        const { data: a } = await db.from('ve_position_asks').select('id, title').eq('id', body.ask_id).eq('position_id', pos.id).eq('status', 'open').maybeSingle();
        if (!a) return json({ error: 'not_found' }, 404);
        return json({ ok: true, ...(await kaiSend(pos, p, text, 'ask', a.id, a.title)) });
      }
      if (action === 'brief_answer') {
        if (!isId(body.brief_id)) return json({ error: 'bad_request' }, 400);
        const { data: b } = await db.from('ve_position_briefs').select('id, title').eq('id', body.brief_id).eq('position_id', pos.id).eq('status', 'published').maybeSingle();
        if (!b) return json({ error: 'not_found' }, 404);
        return json({ ok: true, ...(await kaiSend(pos, p, text, 'brief', b.id, b.title)) });
      }
    } catch (e) {
      console.error('kai send', String(e));
      return json({ error: 'save_failed', message: 'That did not send. Try again in a moment.' }, 500);
    }
    return json({ error: 'unknown_action' }, 400);
  }

  if (['admin_team', 'admin_brief_save', 'admin_ask_save', 'admin_kai_answer'].includes(action) && (await isOps(req))) {
    return (await adminDash(action, body, 'ops', null))!;
  }

  const me = await viewer(req);
  if (!me) return json({ error: 'sign_in' }, 401);

  // ======== Admin (superadmin, re-read from members on every call) ========
  if (action.startsWith('admin_')) {
    if (!me.is_superadmin) return json({ error: 'forbidden' }, 403);
    const actor = me.email || me.id;

    if (action === 'admin_list') return json({ ok: true, ...(await adminList()) });

    { const r = await adminDash(action, body, actor, me.id); if (r) return r; }

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
          invite_note: clean(body.note, 600) || null, invite_link_code: code, region: clean(body.region, 60) || null }).select('*');
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
    return json({ ok: true, position: positionOut(pos), person: await personView(pos, fresh) });
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
          await maybeReady(pos, p.id);
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

  if (action === 'meta_email') {
    const e = clean(body.email, 200).toLowerCase();
    if (!isEmail(e)) return json({ error: 'email', message: 'That does not look like an email address. Use the one you sign in to Facebook with.' }, 400);
    if (!p.agreed_at) return json({ error: 'order', message: 'Say you are in and sign first.' }, 409);
    await db.from('ve_position_people').update({ meta_email: e, meta_email_at: nowIso(), updated_at: nowIso() }).eq('id', p.id);
    await log(p.id, me.id, 'meta_email', null, { ip: ipOf(req) });
    await maybeReady(pos, p.id);
    return await reply();
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
