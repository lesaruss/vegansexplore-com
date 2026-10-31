// ve-branddesk: signing a business up for managed marketing (BrandDesk, canon canon-ve-front-of-house; the contract and Stripe step,
// Sean approved 2026-10-31: "approve both", test mode first and the agreement as a draft for the lawyer).
//
// Money (canon): $1,500 setup, at once or as 3 x $500 or 6 x $250 a month; $500 a month; social +$500 a month for two platforms;
// pause up to 3 months a year at $99 a month. 12 months, then month to month (the agreement, /business/agreement).
// Stripe: one subscription per client, priced from reusable Prices found by lookup key (made once per Stripe account, BD below).
// Installments ride on the subscription as their own monthly item and a subscription schedule takes that item off after 3 or 6
// payments; a pause is a schedule too (from the next billing date, the $99 price for 1 to 3 months, then back). Test mode
// (the LESARUSS test key) until ve_site_settings branddesk.live is true, which waits for Sean's go-live word.
// Checkout opens only for listings in ve_site_settings branddesk.allowed (Sean opens them one at a time, "with his approval"), and
// always for super admins (testing).
//
// POST actions (member token, or ops: LESARUSS_ADMIN_TOKEN with as_member):
//   plan {slug}                         -> { ok, test, allowed, listing, account|null, amounts }
//   checkout {slug, setup: full|3|6, social, agreed_name, agree: true, origin}  -> { url }   (Stripe Checkout, subscription mode)
//   pause {account_id, months 1..3}      owner or super admin; not while the setup is being paid; at most 3 months a year
//   pause_cancel {account_id}            owner or super admin
//   cancel {account_id, note}            super admin: ends at the period's end (the client gives notice by email)
//   allow {slug, on}                     super admin: open or close checkout for one listing
//   list                                 super admin: every account
//   ops_test_activate {slug, setup, social}  ops only, test mode only: a test customer and subscription with Stripe's test card,
//                                        activated the way a real checkout is (proves prices, installments and pause)
// GET ?confirm=<session id>              the return from Stripe and ve-stripe-webhook (metadata type ve_branddesk, confirm_fn
//                                        ve-branddesk): activates the account once and goes back to /business/managed.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const db = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FN_URL = `${SUPABASE_URL}/functions/v1/ve-branddesk`;
const SITE = 'https://vegansexplore.com';
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const TEAM_EMAIL = 'contact@lesaruss.com';
const FROM = 'VEGANS EXPLORE <hello@vegansexplore.com>';
export const AGREEMENT_VERSION = '2026-10-31-draft';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clean = (v: unknown, n: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/.test(v);
const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);

// The prices, in cents. One place; the page reads them through `plan`.
const AMOUNTS = { setup: 150000, setup3: 50000, setup6: 25000, monthly: 50000, social: 50000, pause: 9900 };
const BD: Record<string, { name: string; amount: number; recurring: boolean }> = {
  bd_monthly_v1: { name: 'Managed marketing, monthly', amount: AMOUNTS.monthly, recurring: true },
  bd_social_v1: { name: 'Social media, two platforms, monthly', amount: AMOUNTS.social, recurring: true },
  bd_setup_v1: { name: 'Managed marketing setup', amount: AMOUNTS.setup, recurring: false },
  bd_setup3_v1: { name: 'Managed marketing setup, 1 of 3 monthly payments', amount: AMOUNTS.setup3, recurring: true },
  bd_setup6_v1: { name: 'Managed marketing setup, 1 of 6 monthly payments', amount: AMOUNTS.setup6, recurring: true },
  bd_pause_v1: { name: 'Managed marketing, paused', amount: AMOUNTS.pause, recurring: true },
};

function b64(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out;
}
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, sig] = token.split('.'); if (!h || !p || !sig) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64(sig), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function secret(key: string): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  const v = (data?.value as string) ?? null; return v && v !== 'pending' ? v : null;
}
async function settings(): Promise<{ live: boolean; allowed: string[] }> {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'branddesk').maybeSingle();
  const v = (data?.value || {}) as any; return { live: v.live === true, allowed: Array.isArray(v.allowed) ? v.allowed : [] };
}
async function stripeKey(test: boolean) {
  if (!test) return Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const k = await secret('STRIPE_SECRET_KEY_ACCT_LESARUSS_TEST');
  if (!String(k || '').startsWith('sk_test_')) throw new Error('test key missing');
  return k!;
}
// Pinned so subscription schedules read the same on every account (the LESARUSS test account's default answers with `plans`).
const STRIPE_VERSION = '2024-06-20';
async function stripe(test: boolean, method: string, path: string, params?: Record<string, string> | URLSearchParams) {
  const body = params ? (params instanceof URLSearchParams ? params : new URLSearchParams(params)).toString() : undefined;
  const r = await fetch(`https://api.stripe.com/v1/${path}`, { method, headers: { Authorization: `Bearer ${await stripeKey(test)}`, 'Stripe-Version': STRIPE_VERSION, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, body });
  const d = await r.json();
  if (!r.ok) throw new Error(`stripe ${path}: ${d?.error?.message || r.status}`);
  return d;
}
// The reusable Price for a lookup key, made once per Stripe account.
const priceCache: Record<string, string> = {};
async function price(test: boolean, key: string): Promise<string> {
  const ck = (test ? 't:' : 'l:') + key; if (priceCache[ck]) return priceCache[ck];
  const found = await stripe(test, 'GET', `prices?active=true&lookup_keys[]=${encodeURIComponent(key)}&limit=1`);
  if (found.data?.[0]?.id) return (priceCache[ck] = found.data[0].id);
  const p = BD[key];
  const prod = await stripe(test, 'POST', 'products', { name: 'Vegans Explore: ' + p.name, 'metadata[program]': 'branddesk' });
  const params: Record<string, string> = { product: prod.id, currency: 'usd', unit_amount: String(p.amount), lookup_key: key, 'metadata[program]': 'branddesk' };
  if (p.recurring) params['recurring[interval]'] = 'month';
  const made = await stripe(test, 'POST', 'prices', params);
  return (priceCache[ck] = made.id);
}
async function mail(to: string, subject: string, html: string, replyTo = TEAM_EMAIL) {
  if (!RESEND_KEY) return;
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, reply_to: replyTo, to: [to], subject, html }) });
    if (!r.ok) console.error('Resend', await r.text());
  } catch (e) { console.error('Resend failed', e); }
}
const money = (c: number) => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: c % 100 ? 2 : 0 });
function phaseItems(ph: any): string[] { return (ph.items || ph.plans || []).map((i: any) => { const x = i.price ?? i.plan; return typeof x === 'string' ? x : x.id; }); }
function installments(plan: string) { return plan === '3' ? 3 : plan === '6' ? 6 : 0; }

async function who(req: Request, b: any) {
  const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  const ops = !!admin && t === admin;
  const id = ops ? (isId(b.as_member) ? b.as_member : null) : t ? await verifyToken(t) : null;
  const m = id ? (await db.from('members').select('id, name, email, is_superadmin').eq('id', id).maybeSingle()).data : null;
  return { ops, m };
}
async function listingBySlug(slug: string) {
  const { data } = await db.from('listings').select('id, name, slug, category, address_city, address_state, owner_member_id, claimed_by_member_id')
    .eq('slug', clean(slug, 120)).eq('status', 'approved').maybeSingle();
  return data;
}
const LIVE_STATES = ['active', 'paused', 'canceling'];

// The subscription is paid: record it and, for a setup in installments, schedule the installment item off after N payments.
async function activate(acct: any, customer: string, subId: string) {
  if (acct.status !== 'checkout' && acct.stripe_subscription === subId) return acct;
  const test = acct.test;
  const n = installments(acct.setup_plan);
  let schedule: string | null = null;
  if (n) {
    const sch = await stripe(test, 'POST', 'subscription_schedules', { from_subscription: subId });
    const ph = sch.phases[0];
    const instPrice = await price(test, acct.setup_plan === '3' ? 'bd_setup3_v1' : 'bd_setup6_v1');
    const items = phaseItems(ph);
    const p = new URLSearchParams();
    p.set('end_behavior', 'release'); p.set('proration_behavior', 'none');
    p.set('phases[0][start_date]', String(ph.start_date)); p.set('phases[0][iterations]', String(n));
    items.forEach((pr: string, i: number) => { p.set(`phases[0][items][${i}][price]`, pr); p.set(`phases[0][items][${i}][quantity]`, '1'); });
    items.filter((pr: string) => pr !== instPrice).forEach((pr: string, i: number) => { p.set(`phases[1][items][${i}][price]`, pr); p.set(`phases[1][items][${i}][quantity]`, '1'); });
    p.set('phases[1][iterations]', '1');
    await stripe(test, 'POST', `subscription_schedules/${sch.id}`, p);
    schedule = sch.id;
  }
  const { data } = await db.from('ve_branddesk_accounts').update({ status: 'active', stripe_customer: customer, stripe_subscription: subId, stripe_schedule: schedule,
    installments_left: n, activated_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', acct.id).eq('status', 'checkout').select('*').maybeSingle();
  if (!data) return acct;
  if (acct.note === 'ops test') return data; // ops_test_activate sends no email
  const { data: l } = await db.from('listings').select('name, slug').eq('id', acct.listing_id).maybeSingle();
  const { data: m } = await db.from('members').select('name, email').eq('id', acct.member_id).maybeSingle();
  const tag = test ? '[TEST] ' : '';
  const setupWords = n ? `${n} monthly payments of ${money(n === 3 ? AMOUNTS.setup3 : AMOUNTS.setup6)}` : 'paid in full';
  await mail(TEAM_EMAIL, `${tag}New managed marketing client: ${l?.name}`,
    `<p><b>${esc(l?.name || '')}</b> signed up for managed marketing (BrandDesk).</p><p>Signed by ${esc(acct.agreed_name)} (${esc(m?.email || '')}) on agreement ${esc(acct.agreement_version)}.<br>` +
    `Setup: ${setupWords}. Monthly: ${money(AMOUNTS.monthly)}${acct.social ? ' plus social ' + money(AMOUNTS.social) : ''}.</p>` +
    `<p>Next: confirm they run this business, start their brand kit (<a href="${SITE}/business/brand?listing=${esc(l?.slug || '')}">their brand kit</a>), archive their current website, and book the welcome call.</p>`);
  if (m?.email) await mail(m.email, `${tag}Welcome aboard, ${l?.name}`,
    `<p>Hi ${esc((m.name || acct.agreed_name).split(' ')[0])},</p><p>You are in. Thank you for trusting us with ${esc(l?.name || 'your business')}.</p>` +
    `<p>What happens next: someone from our team reaches out within a day to confirm the details and book your welcome call. Then we start on your brand kit, your Google profile and your website, and we aim to have everything we control done in two weeks.</p>` +
    `<p>Your plan: setup ${setupWords}, then ${money(AMOUNTS.monthly)} a month${acct.social ? ', plus ' + money(AMOUNTS.social) + ' a month for social media' : ''}. Your agreement is at <a href="${SITE}/business/agreement">vegansexplore.com/business/agreement</a>.</p><p>Vegans Explore team</p>`);
  return data;
}

async function confirm(sessionId: string): Promise<Response> {
  const go = (u: string) => new Response(null, { status: 302, headers: { Location: u } });
  for (const test of [true, false]) {
    let s: any;
    try { s = await stripe(test, 'GET', `checkout/sessions/${encodeURIComponent(sessionId)}`); } catch { continue; }
    if (s.metadata?.type !== 've_branddesk' || !isId(s.metadata?.account_id)) return go(`${SITE}/business#/managed`);
    const { data: acct } = await db.from('ve_branddesk_accounts').select('*').eq('id', s.metadata.account_id).maybeSingle();
    const { data: l } = acct ? await db.from('listings').select('slug').eq('id', acct.listing_id).maybeSingle() : { data: null };
    const back = (st: string) => `${s.metadata.origin || SITE}/business/managed?listing=${encodeURIComponent(l?.slug || '')}&status=${st}`;
    if (!acct || acct.stripe_session !== s.id) return go(back('unknown'));
    if (s.status !== 'complete' || !['paid', 'no_payment_required'].includes(s.payment_status)) return go(back('unpaid'));
    await activate(acct, String(s.customer), String(s.subscription));
    return go(back('done'));
  }
  return go(`${SITE}/business#/managed`);
}

async function plan(b: any, m: any) {
  const s = await settings();
  const l = await listingBySlug(b.slug);
  if (!l) return json({ error: 'not_found' }, 404);
  const { data: accts } = await db.from('ve_branddesk_accounts').select('id, status, setup_plan, social, test, installments_left, pause_from, pause_until, activated_at, member_id')
    .eq('listing_id', l.id).in('status', LIVE_STATES).order('created_at', { ascending: false }).limit(1);
  const acct = accts?.[0] || null;
  const mine = acct && m && (acct.member_id === m.id || m.is_superadmin) ? acct : null;
  return json({ ok: true, test: !s.live, allowed: s.allowed.includes(l.slug) || !!m?.is_superadmin, listing: { name: l.name, slug: l.slug, city: l.address_city || '' },
    managed: !!acct, account: mine, amounts: AMOUNTS, agreement_version: AGREEMENT_VERSION });
}

async function checkout(req: Request, b: any, m: any) {
  if (!m) return json({ error: 'sign_in' }, 401);
  const s = await settings();
  const l = await listingBySlug(b.slug);
  if (!l) return json({ error: 'not_found' }, 404);
  if (!s.allowed.includes(l.slug) && !m.is_superadmin) return json({ error: 'not_open', message: 'Managed marketing is not open for this business yet. Our team will reach out.' }, 403);
  if (l.owner_member_id && l.owner_member_id !== m.id && !m.is_superadmin) return json({ error: 'not_yours', message: 'This page belongs to another account. Sign in with the account that claimed it.' }, 403);
  const setup = ['full', '3', '6'].includes(String(b.setup)) ? String(b.setup) : '';
  const name = clean(b.agreed_name, 120);
  if (!setup) return json({ error: 'setup' }, 400);
  if (b.agree !== true || name.length < 3) return json({ error: 'agree', message: 'Type your full name and tick the box to sign the agreement.' }, 400);
  const { data: live } = await db.from('ve_branddesk_accounts').select('id').eq('listing_id', l.id).in('status', LIVE_STATES).limit(1);
  if (live?.length) return json({ error: 'already_managed', message: 'This business is already with us.' }, 409);
  const test = !s.live;
  const origin = /^https:\/\/(vegansexplore\.com|vegansexplore-[a-z0-9-]+\.vercel\.app|localhost:\d+)$/.test(String(b.origin || '')) ? String(b.origin) : SITE;
  const { data: acct, error } = await db.from('ve_branddesk_accounts').insert({ listing_id: l.id, member_id: m.id, setup_plan: setup, social: !!b.social, test,
    agreement_version: AGREEMENT_VERSION, agreed_name: name, agreed_ip: (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null }).select('*').single();
  if (error) return json({ error: 'save_failed' }, 500);
  try {
    const items = [await price(test, 'bd_monthly_v1')];
    if (b.social) items.push(await price(test, 'bd_social_v1'));
    items.push(await price(test, setup === 'full' ? 'bd_setup_v1' : setup === '3' ? 'bd_setup3_v1' : 'bd_setup6_v1'));
    const p = new URLSearchParams({ mode: 'subscription', success_url: `${FN_URL}?confirm={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/business/managed?listing=${encodeURIComponent(l.slug)}&status=cancelled`,
      'metadata[type]': 've_branddesk', 'metadata[confirm_fn]': 've-branddesk', 'metadata[account_id]': acct.id, 'metadata[origin]': origin,
      'subscription_data[metadata][program]': 'branddesk', 'subscription_data[metadata][account_id]': acct.id, 'subscription_data[metadata][listing]': l.slug,
      'subscription_data[description]': 'Managed marketing for ' + l.name });
    if (m.email) p.set('customer_email', m.email);
    if (test) p.set('metadata[test]', 'true');
    items.forEach((pr, i) => { p.set(`line_items[${i}][price]`, pr); p.set(`line_items[${i}][quantity]`, '1'); });
    const sj = await stripe(test, 'POST', 'checkout/sessions', p);
    await db.from('ve_branddesk_accounts').update({ stripe_session: sj.id }).eq('id', acct.id);
    return json({ url: sj.url, test });
  } catch (e) {
    console.error(e);
    await db.from('ve_branddesk_accounts').update({ status: 'abandoned', note: String((e as Error).message).slice(0, 300) }).eq('id', acct.id);
    return json({ error: 'stripe', message: 'Checkout did not open. Try again in a minute.' }, 502);
  }
}

async function ownedAccount(b: any, m: any) {
  if (!m || !isId(b.account_id)) return null;
  const { data: a } = await db.from('ve_branddesk_accounts').select('*').eq('id', b.account_id).maybeSingle();
  return a && (a.member_id === m.id || m.is_superadmin) ? a : null;
}
async function pause(b: any, m: any) {
  const a = await ownedAccount(b, m);
  if (!a || a.status !== 'active') return json({ error: 'not_found' }, 404);
  const months = Math.round(Number(b.months));
  if (!(months >= 1 && months <= 3)) return json({ error: 'months' }, 400);
  if (a.stripe_schedule) {
    const sch = await stripe(a.test, 'GET', `subscription_schedules/${a.stripe_schedule}`);
    if (['active', 'not_started'].includes(sch.status)) return json({ error: a.pause_from ? 'already_paused' : 'setup_in_progress',
      message: a.pause_from ? 'A pause is already set.' : 'You can pause once your setup is paid in full.' }, 409);
  }
  const yearAgo = Date.now() - 365 * 864e5;
  const used = (a.pauses || []).filter((x: any) => Date.parse(x.from) >= yearAgo).reduce((t: number, x: any) => t + (x.months || 0), 0);
  if (used + months > 3) return json({ error: 'pause_limit', message: `You have ${Math.max(0, 3 - used)} months of pause left this year.` }, 409);
  const pausePrice = await price(a.test, 'bd_pause_v1');
  const sch = await stripe(a.test, 'POST', 'subscription_schedules', { from_subscription: a.stripe_subscription });
  const ph = sch.phases[0];
  const items = phaseItems(ph);
  const p = new URLSearchParams();
  p.set('end_behavior', 'release'); p.set('proration_behavior', 'none');
  p.set('phases[0][start_date]', String(ph.start_date)); p.set('phases[0][end_date]', String(ph.end_date));
  items.forEach((pr: string, i: number) => { p.set(`phases[0][items][${i}][price]`, pr); p.set(`phases[0][items][${i}][quantity]`, '1'); });
  p.set('phases[1][items][0][price]', pausePrice); p.set('phases[1][items][0][quantity]', '1'); p.set('phases[1][iterations]', String(months));
  items.forEach((pr: string, i: number) => { p.set(`phases[2][items][${i}][price]`, pr); p.set(`phases[2][items][${i}][quantity]`, '1'); });
  p.set('phases[2][iterations]', '1');
  await stripe(a.test, 'POST', `subscription_schedules/${sch.id}`, p);
  const from = new Date(ph.end_date * 1000), until = new Date(from); until.setUTCMonth(until.getUTCMonth() + months);
  const pauses = (a.pauses || []).concat([{ from: from.toISOString().slice(0, 10), months, set_at: new Date().toISOString(), by: m.id }]);
  await db.from('ve_branddesk_accounts').update({ stripe_schedule: sch.id, pause_from: from.toISOString().slice(0, 10), pause_until: until.toISOString().slice(0, 10), pauses, updated_at: new Date().toISOString() }).eq('id', a.id);
  return json({ ok: true, pause_from: from.toISOString().slice(0, 10), pause_until: until.toISOString().slice(0, 10) });
}
async function pauseCancel(b: any, m: any) {
  const a = await ownedAccount(b, m);
  if (!a || !a.pause_from || !a.stripe_schedule) return json({ error: 'not_found' }, 404);
  if (Date.parse(a.pause_from) <= Date.now()) return json({ error: 'started', message: 'The pause has started; it ends on its own.' }, 409);
  await stripe(a.test, 'POST', `subscription_schedules/${a.stripe_schedule}/release`, {});
  const pauses = (a.pauses || []).slice(0, -1);
  await db.from('ve_branddesk_accounts').update({ stripe_schedule: null, pause_from: null, pause_until: null, pauses, updated_at: new Date().toISOString() }).eq('id', a.id);
  return json({ ok: true });
}
async function cancel(b: any, m: any) {
  if (!m?.is_superadmin) return json({ error: 'admin_only' }, 403);
  const a = await ownedAccount(b, m);
  if (!a || !LIVE_STATES.includes(a.status)) return json({ error: 'not_found' }, 404);
  let owed = 0;
  if (a.stripe_schedule) {
    const sch = await stripe(a.test, 'GET', `subscription_schedules/${a.stripe_schedule}`);
    if (['active', 'not_started'].includes(sch.status)) {
      if (a.installments_left && !a.pause_from) {
        const inv = await stripe(a.test, 'GET', `invoices?subscription=${a.stripe_subscription}&status=paid&limit=12`);
        const paid = (inv.data || []).length;
        owed = Math.max(0, a.installments_left - paid) * (a.setup_plan === '3' ? AMOUNTS.setup3 : AMOUNTS.setup6);
      }
      await stripe(a.test, 'POST', `subscription_schedules/${a.stripe_schedule}/release`, {});
    }
  }
  await stripe(a.test, 'POST', `subscriptions/${a.stripe_subscription}`, { cancel_at_period_end: 'true' });
  const note = [a.note, `Canceled ${new Date().toISOString().slice(0, 10)}: ${clean(b.note, 300)}`, owed ? `Setup still owed: ${money(owed)} (invoice it).` : ''].filter(Boolean).join(' ');
  await db.from('ve_branddesk_accounts').update({ status: 'canceling', canceled_at: new Date().toISOString(), stripe_schedule: null, note, updated_at: new Date().toISOString() }).eq('id', a.id);
  return json({ ok: true, setup_owed_cents: owed });
}

async function opsTestActivate(b: any, m: any) {
  const s = await settings();
  if (s.live) return json({ error: 'live_mode' }, 409);
  if (!m) return json({ error: 'as_member' }, 400);
  const l = await listingBySlug(b.slug);
  if (!l) return json({ error: 'not_found' }, 404);
  const setup = ['full', '3', '6'].includes(String(b.setup)) ? String(b.setup) : 'full';
  const { data: acct, error } = await db.from('ve_branddesk_accounts').insert({ listing_id: l.id, member_id: m.id, setup_plan: setup, social: !!b.social, test: true,
    agreement_version: AGREEMENT_VERSION, agreed_name: '[TEST] ' + (m.name || 'QA'), note: 'ops test' }).select('*').single();
  if (error) return json({ error: 'save_failed', detail: error.message }, 500);
  const cust = await stripe(true, 'POST', 'customers', { email: m.email || 'qa@lesaruss.com', name: '[TEST] ' + l.name, payment_method: 'pm_card_visa', 'invoice_settings[default_payment_method]': 'pm_card_visa' });
  const p = new URLSearchParams({ customer: cust.id, 'metadata[program]': 'branddesk', 'metadata[account_id]': acct.id });
  const items = [await price(true, 'bd_monthly_v1')];
  if (b.social) items.push(await price(true, 'bd_social_v1'));
  if (setup !== 'full') items.push(await price(true, setup === '3' ? 'bd_setup3_v1' : 'bd_setup6_v1'));
  else { p.set('add_invoice_items[0][price]', await price(true, 'bd_setup_v1')); }
  items.forEach((pr, i) => { p.set(`items[${i}][price]`, pr); p.set(`items[${i}][quantity]`, '1'); });
  const sub = await stripe(true, 'POST', 'subscriptions', p);
  const inv = await stripe(true, 'GET', `invoices/${sub.latest_invoice}`);
  const done = await activate(acct, cust.id, sub.id);
  return json({ ok: true, account: done, subscription: sub.id, status: sub.status, first_invoice_cents: inv.amount_paid, first_invoice_status: inv.status });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = new URL(req.url);
  if (req.method === 'GET' && url.searchParams.get('confirm')) {
    try { return await confirm(url.searchParams.get('confirm')!); }
    catch (e) { console.error('confirm failed', e); return new Response(null, { status: 302, headers: { Location: `${SITE}/business#/managed` } }); }
  }
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let b: any = {}; try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const { ops, m } = await who(req, b);
  try {
    switch (String(b.action || '')) {
      case 'plan': return await plan(b, m);
      case 'checkout': return await checkout(req, b, m);
      case 'pause': return await pause(b, m);
      case 'pause_cancel': return await pauseCancel(b, m);
      case 'cancel': return await cancel(b, m);
      case 'allow': {
        if (!m?.is_superadmin) return json({ error: 'admin_only' }, 403);
        const l = await listingBySlug(b.slug); if (!l) return json({ error: 'not_found' }, 404);
        const s = await settings();
        const allowed = b.on === false ? s.allowed.filter((x) => x !== l.slug) : Array.from(new Set(s.allowed.concat([l.slug])));
        await db.from('ve_site_settings').update({ value: { live: s.live, allowed }, updated_at: new Date().toISOString(), updated_by: m.id }).eq('key', 'branddesk');
        return json({ ok: true, allowed });
      }
      case 'list': {
        if (!m?.is_superadmin) return json({ error: 'admin_only' }, 403);
        const { data } = await db.from('ve_branddesk_accounts').select('*, listings(name, slug), members(name, email)').order('created_at', { ascending: false }).limit(200);
        return json({ ok: true, accounts: data || [], settings: await settings() });
      }
      case 'ops_test_activate': return ops ? await opsTestActivate(b, m) : json({ error: 'ops_only' }, 403);
      default: return json({ error: 'unknown_action' }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: 'server', message: String((e as Error).message || e).slice(0, 300) }, 500);
  }
});
