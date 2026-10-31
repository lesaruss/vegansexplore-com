// ve-branddesk: signing a business up for managed marketing (BrandDesk, canon canon-ve-front-of-house; the contract and Stripe step,
// Sean approved 2026-10-31: "approve both", then went live the same day: "go live, I was able to review it, and I'm okay with the terms").
//
// Money (canon): $1,500 setup, at once or as 3 x $500 or 6 x $250 a month; $500 a month; social +$500 a month for two platforms;
// pause up to 3 months a year at $99 a month. 12 months, then month to month (the agreement, /business/agreement).
// Stripe: one subscription per client, priced from reusable Prices found by lookup key (made once per Stripe account, BD below).
// Installments ride on the subscription as their own monthly item and a subscription schedule takes that item off after 3 or 6
// payments; a pause is a schedule too (from the next billing date, the $99 price for 1 to 3 months, then back). Live (the
// Vegans Explore key) while ve_site_settings branddesk.live is true (since 2026-10-31); false puts it back on the LESARUSS test key.
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
//   client {slug|account_id}            the owner or a super admin: the onboarding checklist, Library (signed links; full size once
//                                        the setup is paid in full), website archives and the Cartridge for the asset sheet
//   step {account_id, step, done, note}  super admin: tick or untick an onboarding step
//   archive {account_id, url?}           super admin: archive their website now (also started at activation)
//   file_upload_url / file_done / file_remove   super admin: add to or take from their Library (bucket branddesk-library)
//   checkin_sweep                      cron (x-cron-secret): open this month's check-in for every active client, email whoever does it;
//                                        a reminder on the 10th
//   checkin_start {account_id}          super admin: open this month's check-in now
//   checkin_list {account_id?}          super admin (one client's), or a Community Manager (theirs)
//   checkin_get {id}                    the team: everything; the client's owner: the report, once it is sent
//   checkin_save {id, answers, summary, next_month}   the team, until it is sent
//   checkin_send {id}                   the team: freezes the month's numbers and sends the report to the client
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
export const AGREEMENT_VERSION = '2026-10-31';
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
  // Onboarding starts: the setup paid at once opens full-size downloads, and their current website is archived right away.
  const { data: lw } = await db.from('listings').select('website').eq('id', acct.listing_id).maybeSingle();
  await db.from('ve_branddesk_accounts').update({ setup_paid_at: n ? null : new Date().toISOString(), website_url: lw?.website || null }).eq('id', acct.id);
  if (lw?.website) { try { await startArchive({ ...data, website_url: null }, lw.website, null); } catch (e) { console.error('archive start', e); } }
  if (acct.note === 'ops test') return data; // ops_test_activate sends no email
  const { data: l } = await db.from('listings').select('name, slug').eq('id', acct.listing_id).maybeSingle();
  const { data: m } = await db.from('members').select('name, email').eq('id', acct.member_id).maybeSingle();
  const tag = test ? '[TEST] ' : '';
  const setupWords = n ? `${n} monthly payments of ${money(n === 3 ? AMOUNTS.setup3 : AMOUNTS.setup6)}` : 'paid in full';
  await mail(TEAM_EMAIL, `${tag}New managed marketing client: ${l?.name}`,
    `<p><b>${esc(l?.name || '')}</b> signed up for managed marketing (BrandDesk).</p><p>Signed by ${esc(acct.agreed_name)} (${esc(m?.email || '')}) on agreement ${esc(acct.agreement_version)}.<br>` +
    `Setup: ${setupWords}. Monthly: ${money(AMOUNTS.monthly)}${acct.social ? ' plus social ' + money(AMOUNTS.social) : ''}.</p>` +
    `<p>Next: book the welcome call within 2 days. Their onboarding checklist, Library and website archive (started now) are in <a href="${SITE}/admin/depot/branddesk#a/${acct.id}">Depot &rsaquo; BrandDesk</a>; their brand kit is <a href="${SITE}/business/brand?listing=${esc(l?.slug || '')}">here</a>.</p>`);
  if (m?.email) await mail(m.email, `${tag}Welcome aboard, ${l?.name}`,
    `<p>Hi ${esc((m.name || acct.agreed_name).split(' ')[0])},</p><p>You are in. Thank you for trusting us with ${esc(l?.name || 'your business')}.</p>` +
    `<p>What happens next: someone from our team reaches out within a day to confirm the details and book your welcome call. Then we start on your brand kit, your Google profile and your website, and we aim to have everything we control done in two weeks.</p>` +
    `<p>Your plan: setup ${setupWords}, then ${money(AMOUNTS.monthly)} a month${acct.social ? ', plus ' + money(AMOUNTS.social) + ' a month for social media' : ''}. Your agreement is at <a href="${SITE}/business/agreement">vegansexplore.com/business/agreement</a>.</p>` +
    `<p>Everything we make for you lands in your Library, with your asset sheet, on your business dashboard: <a href="${SITE}/directory/${esc(l?.slug || '')}?tab=brand&pd=managed">your Managed by us page</a>. It is yours to keep.</p><p>Vegans Explore team</p>`);
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
    // A sign-up started on a pitch page goes back to it (metadata.back, a /business/pitch path checked at checkout).
    const back = (st: string) => /^\/business\/pitch\?c=[a-z0-9]{8,20}$/.test(String(s.metadata.back || '')) ? `${s.metadata.origin || SITE}${s.metadata.back}&status=${st}#su-pay`
      : `${s.metadata.origin || SITE}/business/managed?listing=${encodeURIComponent(l?.slug || '')}&status=${st}`;
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
  const backPath = /^\/business\/pitch\?c=[a-z0-9]{8,20}$/.test(String(b.back || '')) ? String(b.back) : '';
  const { data: acct, error } = await db.from('ve_branddesk_accounts').insert({ listing_id: l.id, member_id: m.id, setup_plan: setup, social: !!b.social, test,
    agreement_version: AGREEMENT_VERSION, agreed_name: name, agreed_ip: (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null }).select('*').single();
  if (error) return json({ error: 'save_failed' }, 500);
  try {
    const items = [await price(test, 'bd_monthly_v1')];
    if (b.social) items.push(await price(test, 'bd_social_v1'));
    items.push(await price(test, setup === 'full' ? 'bd_setup_v1' : setup === '3' ? 'bd_setup3_v1' : 'bd_setup6_v1'));
    const p = new URLSearchParams({ mode: 'subscription', success_url: `${FN_URL}?confirm={CHECKOUT_SESSION_ID}`,
      cancel_url: backPath ? `${origin}${backPath}&status=cancelled#su-pay` : `${origin}/business/managed?listing=${encodeURIComponent(l.slug)}&status=cancelled`,
      'metadata[type]': 've_branddesk', 'metadata[confirm_fn]': 've-branddesk', 'metadata[account_id]': acct.id, 'metadata[origin]': origin,
      'subscription_data[metadata][program]': 'branddesk', 'subscription_data[metadata][account_id]': acct.id, 'subscription_data[metadata][listing]': l.slug,
      'subscription_data[description]': 'Managed marketing for ' + l.name });
    if (m.email) p.set('customer_email', m.email);
    if (test) p.set('metadata[test]', 'true');
    if (backPath) p.set('metadata[back]', backPath);
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

// ---------------------------------------------------------------------------------------------------------------------------
// Onboarding (2026-10-31; migration 20261031_branddesk_onboarding.sql). After payment: the welcome checklist, their website
// archived, their Library (private bucket branddesk-library) and their asset sheet (from their Cartridge, ve_cartridges).
// "They rent the service, they own the assets": full-size downloads of what we make open once the setup is paid in full; their
// archived website and documents are always theirs.
const BUCKET = 'branddesk-library';
// [key, the team's words, the client's words, how it is done: auto | team]
const STEPS: [string, string, string, string][] = [
  ['welcome', 'Welcome call booked and held (within 2 days)', 'Your welcome call', 'team'],
  ['owner', 'Confirmed they run this business', 'We confirm you run the business', 'team'],
  ['archive', 'Their current website archived', 'A copy of your current website, kept for you', 'auto'],
  ['brand_kit', 'Brand kit started', 'Your brand kit', 'auto'],
  ['google', 'Google profile: we are a manager, they stay primary owner', 'Your Google profile, with us as a manager', 'team'],
  ['domain', 'Manager access to their domain settings', 'Access to your domain settings (you keep the domain)', 'team'],
  ['socials', 'Manager access to their two social platforms', 'Access to your two social platforms', 'team'],
  ['shoot', 'Starter shoot booked (up to 15 menu items)', 'Your starter photo shoot', 'team'],
  ['library', 'First files in their Library', 'Your Library', 'auto'],
];
const GATED_KINDS = ['photo', 'video', 'logo', 'brand', 'graphic', 'menu_board'];
const FILE_KINDS = ['photo', 'video', 'logo', 'brand', 'graphic', 'menu_board', 'document', 'archive'];
const safeName = (s: string) => clean(s, 120).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'file';

async function accountFor(b: any, m: any, needAdmin = false) {
  if (!m) return null;
  if (needAdmin && !m.is_superadmin) return null;
  let a: any = null;
  if (isId(b.account_id)) a = (await db.from('ve_branddesk_accounts').select('*').eq('id', b.account_id).maybeSingle()).data;
  else if (b.slug) {
    const l = await listingBySlug(b.slug);
    if (l) a = (await db.from('ve_branddesk_accounts').select('*').eq('listing_id', l.id).in('status', LIVE_STATES.concat(['ended']))
      .order('created_at', { ascending: false }).limit(1)).data?.[0] || null;
  }
  if (!a) return null;
  if (m.is_superadmin) return a;
  const { data: l } = await db.from('listings').select('owner_member_id').eq('id', a.listing_id).maybeSingle();
  return a.member_id === m.id || l?.owner_member_id === m.id ? a : null;
}

// The setup is paid in full: at once at checkout, or once the installments' invoices are paid. Kept in setup_paid_at.
async function setupPaid(a: any): Promise<boolean> {
  if (a.setup_paid_at) return true;
  if (!a.stripe_subscription || a.status === 'checkout') return false;
  let paid = a.setup_plan === 'full';
  if (!paid) {
    const n = installments(a.setup_plan);
    try {
      const inv = await stripe(a.test, 'GET', `invoices?subscription=${a.stripe_subscription}&status=paid&limit=12`);
      paid = (inv.data || []).filter((i: any) => i.amount_paid > 0).length >= n;
    } catch { return false; }
  }
  if (paid) await db.from('ve_branddesk_accounts').update({ setup_paid_at: new Date().toISOString() }).eq('id', a.id);
  return paid;
}

async function stepState(a: any) {
  const o = a.onboarding || {};
  const [{ data: kit }, { data: arc }, { count: files }] = await Promise.all([
    db.from('ve_cartridges').select('status, updated_at').eq('listing_id', a.listing_id).maybeSingle(),
    db.from('ve_branddesk_archives').select('status, finished_at').eq('account_id', a.id).eq('status', 'done').order('created_at', { ascending: false }).limit(1),
    db.from('ve_branddesk_files').select('id', { count: 'exact', head: true }).eq('account_id', a.id).is('removed_at', null).neq('kind', 'archive'),
  ]);
  const auto: Record<string, string | null> = {
    archive: arc?.[0]?.finished_at || null,
    brand_kit: kit ? (kit.updated_at || a.activated_at) : null,
    library: files ? a.activated_at : null,
  };
  return STEPS.filter((s) => s[0] !== 'socials' || a.social).map(([key, team, client, how]) => {
    const st = o[key] || {};
    const done = st.done_at || auto[key] || null;
    return { key, team, client, how, done_at: done, by: st.by || null, note: st.note || null, auto: !st.done_at && !!auto[key] };
  });
}

async function signFiles(rows: any[], unlocked: boolean, admin: boolean) {
  return Promise.all(rows.map(async (f) => {
    const open = admin || unlocked || !GATED_KINDS.includes(f.kind);
    let view: string | null = null, download: string | null = null;
    if (/^image\//.test(f.mime || '') && !/svg/.test(f.mime || '')) {
      const r = await db.storage.from(BUCKET).createSignedUrl(f.path, 3600, { transform: { width: 900, height: 900, resize: 'contain' } });
      view = r.data?.signedUrl || null;
    }
    if (open) {
      const name = f.path.split('/').pop()!.replace(/^[0-9a-f]{8}-/, '');
      const r = await db.storage.from(BUCKET).createSignedUrl(f.path, 3600, { download: name });
      download = r.data?.signedUrl || null;
    }
    return { id: f.id, kind: f.kind, title: f.title, bytes: f.bytes, mime: f.mime, width: f.width, height: f.height, note: f.note,
      created_at: f.created_at, view, download, locked: !open };
  }));
}

// Everything the client's Library page and the Depot need for one account.
async function client(b: any, m: any) {
  const a = await accountFor(b, m);
  if (!a) return json({ error: 'not_found' }, 404);
  const admin = !!m.is_superadmin;
  const { data: l } = await db.from('listings').select('id, name, slug, category, address_street, address_city, address_state, address_zip, phone, email, website, instagram, facebook, tiktok, youtube, google_place_id, google_hours_json, logo_url, tagline, description')
    .eq('id', a.listing_id).maybeSingle();
  const unlocked = await setupPaid(a);
  const [{ data: files }, { data: archives }, { data: kit }, steps] = await Promise.all([
    db.from('ve_branddesk_files').select('*').eq('account_id', a.id).is('removed_at', null).order('created_at', { ascending: false }).limit(500),
    db.from('ve_branddesk_archives').select('id, url, status, platform, pages, assets, bytes, note, created_at, finished_at').eq('account_id', a.id).order('created_at', { ascending: false }).limit(10),
    db.from('ve_cartridges').select('data, status, updated_at').eq('listing_id', a.listing_id).maybeSingle(),
    stepState(a),
  ]);
  const { data: owner } = admin ? await db.from('members').select('name, email').eq('id', a.member_id).maybeSingle() : { data: null };
  return json({ ok: true, admin,
    account: { id: a.id, status: a.status, test: a.test, setup_plan: a.setup_plan, social: a.social, activated_at: a.activated_at, setup_paid_at: a.setup_paid_at,
      pause_from: a.pause_from, pause_until: a.pause_until, website_url: a.website_url || l?.website || null, agreement_version: a.agreement_version,
      agreed_name: admin ? a.agreed_name : undefined, note: admin ? a.note : undefined, owner },
    listing: l, unlocked, steps, files: await signFiles(files || [], unlocked, admin), archives: archives || [],
    cartridge: kit ? { status: kit.status, updated_at: kit.updated_at, data: kit.data } : null,
    reports: ((await db.from('ve_branddesk_checkins').select('id, month, status, sent_at').eq('account_id', a.id).order('month', { ascending: false }).limit(36)).data || [])
      .filter((r: any) => admin || r.status === 'sent').map((r: any) => ({ ...r, month_name: monthName(r.month) })) });
}

async function stepSet(b: any, m: any) {
  const a = await accountFor(b, m, true);
  if (!a) return json({ error: 'not_found' }, 404);
  const key = String(b.step || '');
  if (!STEPS.some((s) => s[0] === key)) return json({ error: 'step' }, 400);
  const o = { ...(a.onboarding || {}) };
  if (b.done === false) delete o[key];
  else o[key] = { done_at: new Date().toISOString(), by: m.name || m.email, note: clean(b.note, 300) || null };
  await db.from('ve_branddesk_accounts').update({ onboarding: o, updated_at: new Date().toISOString() }).eq('id', a.id);
  return json({ ok: true, steps: await stepState({ ...a, onboarding: o }) });
}

async function fileUploadUrl(b: any, m: any) {
  const a = await accountFor(b, m, true);
  if (!a) return json({ error: 'not_found' }, 404);
  const kind = FILE_KINDS.includes(b.kind) ? b.kind : '';
  if (!kind || kind === 'archive') return json({ error: 'kind' }, 400);
  if (Number(b.bytes) > 500 * 1024 * 1024) return json({ error: 'too_big', message: 'Up to 500 MB a file.' }, 400);
  const { data: l } = await db.from('listings').select('slug').eq('id', a.listing_id).maybeSingle();
  const path = `${l!.slug}/${kind}/${crypto.randomUUID().slice(0, 8)}-${safeName(b.name || 'file')}`;
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) return json({ error: 'upload_url', message: error.message }, 500);
  return json({ ok: true, path, url: data.signedUrl, token: data.token });
}
async function fileDone(b: any, m: any) {
  const a = await accountFor(b, m, true);
  if (!a) return json({ error: 'not_found' }, 404);
  const path = String(b.path || '');
  const { data: l } = await db.from('listings').select('slug').eq('id', a.listing_id).maybeSingle();
  const parts = path.split('/');
  if (parts[0] !== l!.slug || parts.length !== 3 || !FILE_KINDS.includes(parts[1]) || parts[1] === 'archive') return json({ error: 'path' }, 400);
  const { data: found } = await db.storage.from(BUCKET).list(`${parts[0]}/${parts[1]}`, { search: parts[2], limit: 2 });
  const obj = (found || []).find((o: any) => o.name === parts[2]);
  if (!obj) return json({ error: 'not_uploaded' }, 400);
  const { data, error } = await db.from('ve_branddesk_files').insert({ account_id: a.id, listing_id: a.listing_id, kind: parts[1], path,
    title: clean(b.title, 140) || parts[2].replace(/^[0-9a-f]{8}-/, ''), bytes: (obj as any).metadata?.size ?? (Number(b.bytes) || null),
    mime: (obj as any).metadata?.mimetype || clean(b.mime, 80) || null, width: Number(b.width) || null, height: Number(b.height) || null,
    note: clean(b.note, 300) || null, added_by: m.id }).select('id').single();
  if (error) return json({ error: 'save_failed' }, 500);
  return json({ ok: true, id: data.id });
}
async function fileRemove(b: any, m: any) {
  if (!m?.is_superadmin || !isId(b.file_id)) return json({ error: 'admin_only' }, 403);
  await db.from('ve_branddesk_files').update({ removed_at: new Date().toISOString(), removed_by: m.id }).eq('id', b.file_id);
  return json({ ok: true });
}

// ---- The website archive: every page on their site (up to 40) and the pictures, styles and fonts it uses, links pointed at
// the copies so it opens offline, plus manifest.json and README.txt, as one ZIP in their Library. A site that builds itself
// in the browser keeps what its server sends; that is said in the README.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const LIMITS = { pages: 40, assets: 500, bytes: 60 * 1024 * 1024, asset: 15 * 1024 * 1024, ms: 120000 };
function platformOf(html: string) {
  const h = html.toLowerCase();
  if (/wixstatic\.com|x-wix|wix\.com/.test(h)) return 'wix';
  if (/squarespace/.test(h)) return 'squarespace';
  if (/wp-content|wp-includes|wordpress/.test(h)) return 'wordpress';
  if (/cdn\.shopify\.com/.test(h)) return 'shopify';
  if (/img1\.wsimg\.com|godaddy/.test(h)) return 'godaddy';
  if (/weebly/.test(h)) return 'weebly';
  if (/webflow/.test(h)) return 'webflow';
  return 'other';
}
const PAGE_EXT = /\.(pdf|jpe?g|png|gif|webp|svg|mp4|mov|zip|docx?|xlsx?|css|js|ico|woff2?|ttf|mp3)(\?|$)/i;
function pageFile(u: URL) {
  let p = u.pathname.replace(/\/+$/, '') || '';
  p = p.replace(/[^A-Za-z0-9/._-]+/g, '-').replace(/^\//, '');
  const q = u.search ? '-' + Array.from(u.search).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36) : '';
  return 'site/' + (p ? p.replace(/\.html?$/, '') + q + '/index.html' : (q ? 'index' + q + '/index.html' : 'index.html'));
}
function assetFile(u: URL) {
  const base = (u.pathname.replace(/[^A-Za-z0-9/._-]+/g, '-').replace(/^\/+/, '') || 'file').slice(-120);
  const q = u.search ? '-' + Array.from(u.search).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36) : '';
  const dot = base.lastIndexOf('.');
  const name = dot > base.lastIndexOf('/') ? base.slice(0, dot) + q + base.slice(dot) : base + q;
  return 'site/_assets/' + u.hostname + '/' + name;
}
function rel(from: string, to: string) {
  const a = from.split('/').slice(0, -1), b = to.split('/');
  let i = 0; while (i < a.length && i < b.length - 1 && a[i] === b[i]) i++;
  return '../'.repeat(a.length - i) + b.slice(i).join('/');
}
async function grab(url: string, ms = 15000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' }, redirect: 'follow', signal: c.signal }); }
  finally { clearTimeout(t); }
}

async function runArchive(arcId: string, startUrl: string, slug: string, accountId: string, listingId: string, by: string | null) {
  const t0 = Date.now();
  const { default: JSZip } = await import('https://esm.sh/jszip@3.10.1');
  const zip = new JSZip();
  const start = new URL(startUrl);
  const hostKey = (h: string) => h.replace(/^www\./, '');
  const pages: any[] = [], assets = new Map<string, { file: string; bytes: number; type: string } | null>();
  const queue: string[] = [start.href.split('#')[0]], seen = new Set<string>(queue);
  let total = 0, platform = 'other', skipped = 0;
  const htmls: { file: string; url: string; html: string; refs: [string, string][] }[] = [];
  const cssQueue: { file: string; url: string; css: string }[] = [];
  const wantAsset = (abs: string) => {
    if (assets.has(abs) || assets.size >= LIMITS.assets) return;
    assets.set(abs, null);
  };
  const absOf = (raw: string, base: string) => { try { const u = new URL(raw.trim().replace(/&amp;/g, '&'), base); return /^https?:$/.test(u.protocol) ? u : null; } catch { return null; } };

  while (queue.length && pages.length < LIMITS.pages && Date.now() - t0 < LIMITS.ms * 0.5) {
    const url = queue.shift()!;
    let r: Response; try { r = await grab(url); } catch { pages.push({ url, status: 'failed' }); continue; }
    const ct = r.headers.get('content-type') || '';
    if (!r.ok || !/html/.test(ct)) { pages.push({ url, status: r.status }); try { await r.body?.cancel(); } catch { /* */ } continue; }
    const html = await r.text();
    if (!pages.length) platform = platformOf(html);
    const finalUrl = r.url || url;
    const file = pageFile(new URL(finalUrl));
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim().slice(0, 140);
    pages.push({ url: finalUrl, file, status: r.status, title });
    total += html.length;
    const refs: [string, string][] = [];
    // Links to more pages on the same site.
    for (const mm of html.matchAll(/<a\b[^>]*?\bhref\s*=\s*["']([^"'#][^"']*)["']/gi)) {
      const u = absOf(mm[1], finalUrl); if (!u || hostKey(u.hostname) !== hostKey(start.hostname)) continue;
      u.hash = '';
      if (PAGE_EXT.test(u.pathname)) { if (/\.pdf$/i.test(u.pathname)) { wantAsset(u.href); refs.push([mm[1], u.href]); } continue; }
      refs.push([mm[1], 'page:' + u.href]);
      if (!seen.has(u.href) && seen.size < LIMITS.pages * 3) { seen.add(u.href); queue.push(u.href); }
    }
    // Pictures, styles, icons, posters.
    const take = (raw: string) => { const u = absOf(raw, finalUrl); if (u) { wantAsset(u.href); refs.push([raw, u.href]); } };
    for (const mm of html.matchAll(/<(?:img|source|video|audio|input)\b[^>]*?\b(?:src|poster|data-src)\s*=\s*["']([^"']+)["']/gi)) take(mm[1]);
    for (const mm of html.matchAll(/\b(?:srcset|data-srcset)\s*=\s*["']([^"']+)["']/gi)) mm[1].split(',').forEach((s) => { const raw = s.trim().split(/\s+/)[0]; if (raw) take(raw); });
    for (const mm of html.matchAll(/<script\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi)) { const u = absOf(mm[1], finalUrl); if (u && !/googletagmanager|google-analytics|facebook\.net|hotjar|doubleclick/.test(u.hostname)) take(mm[1]); }
    for (const mm of html.matchAll(/<link\b[^>]*>/gi)) {
      const tag = mm[0]; if (!/rel\s*=\s*["'][^"']*(stylesheet|icon|apple-touch-icon|preload)[^"']*["']/i.test(tag)) continue;
      const h = tag.match(/href\s*=\s*["']([^"']+)["']/i); if (h) take(h[1]);
    }
    for (const mm of html.matchAll(/<meta\b[^>]*?property\s*=\s*["']og:image["'][^>]*?content\s*=\s*["']([^"']+)["']/gi)) take(mm[1]);
    for (const mm of html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) if (!/^data:/.test(mm[1])) take(mm[1]);
    htmls.push({ file, url: finalUrl, html, refs });
  }
  // The assets, a few at a time; CSS files add their own fonts and pictures.
  const list = () => Array.from(assets.entries()).filter(([, v]) => v === null).map(([k]) => k);
  const fetched = new Set<string>();
  while (Date.now() - t0 < LIMITS.ms && total < LIMITS.bytes) {
    const batch = list().filter((u) => !fetched.has(u)).slice(0, 6);
    if (!batch.length) break;
    await Promise.all(batch.map(async (u) => {
      fetched.add(u);
      try {
        const r = await grab(u, 20000);
        const len = Number(r.headers.get('content-length') || 0);
        if (!r.ok || len > LIMITS.asset) { skipped++; try { await r.body?.cancel(); } catch { /* */ } return; }
        const buf = new Uint8Array(await r.arrayBuffer());
        if (buf.length > LIMITS.asset || total + buf.length > LIMITS.bytes) { skipped++; return; }
        total += buf.length;
        const file = assetFile(new URL(u)), type = r.headers.get('content-type') || '';
        assets.set(u, { file, bytes: buf.length, type });
        if (/css/.test(type) || /\.css(\?|$)/i.test(u)) {
          const css = new TextDecoder().decode(buf);
          cssQueue.push({ file, url: u, css });
          for (const mm of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) { if (/^data:/.test(mm[1])) continue; const a = absOf(mm[1], u); if (a) wantAsset(a.href); }
          for (const mm of css.matchAll(/@import\s+["']([^"']+)["']/gi)) { const a = absOf(mm[1], u); if (a) wantAsset(a.href); }
        } else zip.file(file, buf, { binary: true, compression: 'STORE' });
      } catch { skipped++; }
    }));
  }
  const pageFileOf = new Map(pages.filter((p) => p.file).map((p) => [p.url.split('#')[0], p.file]));
  for (const c of cssQueue) {
    const out = c.css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (whole, q, raw) => {
      const a = absOf(raw, c.url); const got = a && assets.get(a.href);
      return got ? `url(${q}${rel(c.file, got.file)}${q})` : whole;
    });
    zip.file(c.file, out);
  }
  for (const h of htmls) {
    let out = h.html;
    const pairs = h.refs.map(([raw, target]) => {
      if (target.startsWith('page:')) { const f = pageFileOf.get(target.slice(5)); return f ? [raw, rel(h.file, f)] : null; }
      const got = assets.get(target); return got ? [raw, rel(h.file, got.file)] : null;
    }).filter(Boolean) as [string, string][];
    for (const [raw, to] of Array.from(new Map(pairs)).sort((x, y) => y[0].length - x[0].length)) out = out.split(`"${raw}"`).join(`"${to}"`).split(`'${raw}'`).join(`'${to}'`).split(`(${raw})`).join(`(${to})`);
    zip.file(h.file, out);
  }
  const savedAssets = Array.from(assets.entries()).filter(([, v]) => v).map(([u, v]) => ({ url: u, file: v!.file, bytes: v!.bytes, type: v!.type }));
  const when = new Date().toISOString();
  const okPages = pages.filter((p) => p.file);
  zip.file('manifest.json', JSON.stringify({ site: start.href, archived_at: when, platform, pages, assets: savedAssets, skipped }, null, 2));
  zip.file('README.txt', [
    `Your website, archived by Vegans Explore on ${when.slice(0, 10)}`, '', `Site: ${start.href}`, platform !== 'other' ? `Built with: ${platform}` : '',
    `Pages saved: ${okPages.length}. Pictures, styles and fonts saved: ${savedAssets.length}.${skipped ? ` Files we could not save: ${skipped}.` : ''}`, '',
    'Open site/index.html in a browser to see your home page as it was. Every page is in the site folder, and their pictures,',
    'styles and fonts are in site/_assets. manifest.json lists every page and file with the address it came from.', '',
    'This is a copy of what your website sent to a visitor that day. Parts a site builds in the browser (some menus, forms,',
    'booking and shop widgets) may not work offline, but the words and pictures are here.',
    platform === 'wordpress' ? '\nYour site runs on WordPress. Its own export (Tools > Export > All content in your WordPress admin) can restore it; we keep that in your Library too.' : '',
    '', 'It is yours. Vegans Explore, a brand of LESARUSS Inc.',
  ].join('\n'));
  const out: Uint8Array = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const path = `${slug}/archive/${crypto.randomUUID().slice(0, 8)}-website-${hostKey(start.hostname)}-${when.slice(0, 10)}.zip`;
  const up = await db.storage.from(BUCKET).upload(path, out, { contentType: 'application/zip', upsert: false });
  if (up.error) throw new Error('upload: ' + up.error.message);
  const { data: f } = await db.from('ve_branddesk_files').insert({ account_id: accountId, listing_id: listingId, kind: 'archive', path, bytes: out.length, mime: 'application/zip',
    title: `Your website as it was, ${when.slice(0, 10)} (${hostKey(start.hostname)})`, added_by: by,
    note: `${okPages.length} pages, ${savedAssets.length} files.${platform !== 'other' ? ' Built with ' + platform + '.' : ''}` }).select('id').single();
  await db.from('ve_branddesk_archives').update({ status: 'done', platform, pages: okPages.length, assets: savedAssets.length, bytes: out.length, file_id: f?.id || null,
    note: platform === 'wordpress' ? 'WordPress: ask them for the export (Tools > Export > All content) and add it to their Library.' : (skipped ? `${skipped} files could not be saved.` : null),
    finished_at: new Date().toISOString() }).eq('id', arcId);
}

async function startArchive(a: any, url: string, by: string | null) {
  let u: URL; try { u = new URL(/^https?:\/\//i.test(url) ? url : 'https://' + url); } catch { return { error: 'url' }; }
  if (!/^https?:$/.test(u.protocol) || /vegansexplore\.com$|lesaruss/.test(u.hostname)) return { error: 'url' };
  const { data: running } = await db.from('ve_branddesk_archives').select('id').eq('account_id', a.id).eq('status', 'running').gte('created_at', new Date(Date.now() - 10 * 60e3).toISOString()).limit(1);
  if (running?.length) return { error: 'running', id: running[0].id };
  const { data: l } = await db.from('listings').select('slug').eq('id', a.listing_id).maybeSingle();
  const { data: arc } = await db.from('ve_branddesk_archives').insert({ account_id: a.id, listing_id: a.listing_id, url: u.href, started_by: by }).select('id').single();
  if (!a.website_url) await db.from('ve_branddesk_accounts').update({ website_url: u.href }).eq('id', a.id);
  const job = runArchive(arc!.id, u.href, l!.slug, a.id, a.listing_id, by).catch(async (e) => {
    console.error('archive failed', e);
    await db.from('ve_branddesk_archives').update({ status: 'failed', note: String((e as Error).message || e).slice(0, 300), finished_at: new Date().toISOString() }).eq('id', arc!.id);
  });
  // deno-lint-ignore no-explicit-any
  const er = (globalThis as any).EdgeRuntime; if (er?.waitUntil) er.waitUntil(job); else await job;
  return { ok: true, id: arc!.id, url: u.href };
}
async function archive(b: any, m: any) {
  const a = await accountFor(b, m, true);
  if (!a) return json({ error: 'not_found' }, 404);
  const { data: l } = await db.from('listings').select('website').eq('id', a.listing_id).maybeSingle();
  const url = clean(b.url, 500) || a.website_url || l?.website || '';
  if (!url) return json({ error: 'no_website', message: 'This business has no website on file. Paste its address.' }, 400);
  const r: any = await startArchive(a, url, m.id);
  if (r.error === 'running') return json({ error: 'running', message: 'An archive is already running for them.' }, 409);
  if (r.error) return json({ error: 'url', message: 'That does not look like a website address.' }, 400);
  return json(r);
}

// ---- The pitch: the presence-gap ranking and one personal page per business (canon canon-ve-front-of-house v1 and v3).
// Prepared, never dressed as an instant scan: "We looked at your business before we reached out." The page shows their latest
// full audit, a still of their home page on our frame, the two weeks, the price, and three choices that land in the Inbox.
const PITCH_LOOKS: Record<string, { name: string; c: Record<string, string>; h: [string, number]; b: string }> = {
  fresh: { name: 'Fresh neighborhood', c: { page: '#FBF5E6', text: '#1E4D2B', accent: '#2E7D32', soft: '#DCE8D2', highlight: '#E0A030', ink: '#1F2420' }, h: ['Nunito', 900], b: 'DM Sans' },
  island: { name: 'Island bright', c: { page: '#FFFFFF', text: '#0F3D3E', accent: '#0B7A64', soft: '#E3F5EF', highlight: '#FFB000', ink: '#1A1A1A' }, h: ['Fraunces', 800], b: 'Work Sans' },
  night: { name: 'Night lounge', c: { page: '#14201A', text: '#F3EBDD', accent: '#C8A15A', soft: '#22332A', highlight: '#C8A15A', ink: '#14201A' }, h: ['Playfair Display', 800], b: 'Lato' },
  street: { name: 'Street heat', c: { page: '#FFF8F0', text: '#2A1A14', accent: '#C2410C', soft: '#FDE7D3', highlight: '#FACC15', ink: '#1C1917' }, h: ['Archivo Black', 400], b: 'Inter' },
};
const PLAN = [
  { when: 'Day 1', title: 'A welcome call', text: 'We meet, you tell us what you want people to know, and we start your brand kit from what you already have.' },
  { when: 'Days 1 to 3', title: 'Your Google profile', text: 'Claimed, hours, photos, categories and the details people search for. Google\'s own verification can take longer; that part is theirs.' },
  { when: 'Days 2 to 5', title: 'Your logo and brand kit', text: 'A clean logo in every size, your colors, your type and your voice, written down so everything matches.' },
  { when: 'Days 3 to 7', title: 'Your starter photo shoot', text: 'Up to 15 dishes and your space, shot to one standard, so every photo of your food looks like it belongs together.' },
  { when: 'Days 5 to 10', title: 'Your new website', text: 'Built on our frame and fed by your Directory page: menu, hours, ordering and directions, ready for phones.' },
  { when: 'Days 10 to 14', title: 'Launch', text: 'Your site goes live, your Vegans Explore page and dashboard are ready, and we pick your first month\'s campaign together.' },
];
const AREA_NAMES: Record<string, string> = { google: 'Google', web: 'Your website', seo: 'Being found in search', social: 'Social' };
const pitchCode = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), (x) => 'abcdefghjkmnpqrstuvwxyz23456789'[x % 31]).join('');
const P_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const P_VEGAN: Record<string, string> = { fully_vegan: '100% Vegan', vegan_options: 'Vegan options', vegan_friendly: 'Vegan friendly' };
function pHours(h: any): Record<string, string> {
  let v = h; if (typeof v === 'string') { try { v = JSON.parse(v); } catch { v = null; } }
  const out: Record<string, string> = {};
  if (Array.isArray(v)) v.forEach((x: any) => { const d = x?.day || x?.name; if (d) out[d] = String(x.hours || x.openingHours || x.time || ''); });
  else if (v && typeof v === 'object') Object.keys(v).forEach((d) => { out[d] = String(v[d] ?? ''); });
  const tidy = (s: string) => s.replace(/\s*[–—-]\s*/g, ' to ').replace(/:00/g, '').replace(/ | /g, ' ').trim();
  return Object.fromEntries(P_DAYS.map((d) => [d, out[d] ? tidy(out[d]) : 'Closed']));
}
async function pitchListing(where: { slug?: string; id?: string }) {
  let q = db.from('listings').select('id, name, slug, category, vegan_status, cuisines, tagline, description, phone, website, instagram, facebook, tiktok, address_street, address_city, address_state, address_zip, google_hours_json, logo_url, gallery_urls, menu_crawl_url, status');
  q = where.id ? q.eq('id', where.id) : q.eq('slug', clean(where.slug, 120));
  const { data } = await q.eq('status', 'approved').maybeSingle();
  return data;
}
async function auditSummary(auditId: string | null) {
  if (!auditId) return null;
  const { data: a } = await db.from('ve_audits').select('id, score, max_score, areas, items, facts, created_at').eq('id', auditId).maybeSingle();
  if (!a || !a.max_score) return null;
  const { data: crit } = await db.from('ve_audit_criteria').select('key, label, area, weight, why').eq('active', true);
  const C = new Map((crit || []).map((c: any) => [c.key, c]));
  const items = (a.items || []).map((i: any) => ({ ...i, c: C.get(i.key) })).filter((i: any) => i.c);
  const fixes = items.filter((i: any) => i.state === 'fix').sort((x: any, y: any) => y.c.weight - x.c.weight);
  const goods = items.filter((i: any) => i.state === 'good').sort((x: any, y: any) => y.c.weight - x.c.weight);
  const g = a.facts?.google || {};
  return {
    looked_on: a.created_at, presence: Math.round(a.score * 100 / a.max_score),
    areas: Object.keys(AREA_NAMES).filter((k) => a.areas?.[k]?.max).map((k) => ({ key: k, name: AREA_NAMES[k], pct: Math.round(a.areas[k].score * 100 / a.areas[k].max) })),
    fixes: fixes.slice(0, 6).map((i: any) => ({ label: i.c.label, why: i.c.why, found: clean(i.found, 220), area: AREA_NAMES[i.c.area] || i.c.area })),
    fix_count: fixes.length, goods: goods.slice(0, 5).map((i: any) => i.c.label), good_count: goods.length,
    google: { rating: g.rating ?? null, reviews: g.reviews ?? null, photos: g.photos ?? null },
  };
}
async function pitchCartridge(l: any, look: string) {
  const L = PITCH_LOOKS[look] || PITCH_LOOKS.fresh;
  const { data: items } = await db.from('ve_menu_items').select('category, name, description, price_display, is_gluten_free, is_featured, sort_order').eq('listing_id', l.id).eq('is_available', true).order('sort_order').limit(200);
  const sections: any[] = [];
  (items || []).forEach((it: any) => {
    const name = clean(it.category, 60) || 'Menu';
    let s = sections.find((x) => x.name === name); if (!s) { s = { name, items: [] }; sections.push(s); }
    s.items.push({ name: clean(it.name, 80), price: clean(it.price_display, 20), tags: [it.is_gluten_free ? 'Gluten-free' : '', it.is_featured ? 'Favorite' : ''].filter(Boolean), copy: clean(it.description, 300), photo: { state: 'to_shoot' } });
  });
  const desc = clean(l.description, 1200), first = (desc.match(/^.*?[.!?](\s|$)/) || [desc])[0].trim();
  const photos = (Array.isArray(l.gallery_urls) ? l.gallery_urls : []).filter((u: any) => typeof u === 'string' && /^(https:\/\/|\/)/.test(u)).slice(0, 6);
  return {
    pitch: true, meta: { status: 'pitch' },
    business: { name: l.name, short: l.name, kind: l.category, vegan: P_VEGAN[l.vegan_status] || '', cuisines: l.cuisines || [], city: [l.address_city, l.address_state].filter(Boolean).join(', ') },
    brand: { logo: { primary: { src: l.logo_url || '' }, files: [] }, colors: Object.keys(L.c).map((role) => ({ role, hex: L.c[role] })),
      type: { heading: { family: L.h[0], weight: L.h[1] }, body: { family: L.b, weight: 400 } }, photo: {} },
    voice: { samples: { hero: clean(l.tagline, 120) || first || l.name } },
    story: { tagline: clean(l.tagline, 120) || l.name, short: first, long: desc ? [desc] : [] },
    menu: { sections },
    photos: { space: photos.map((src: string, i: number) => ({ shot: i ? 'Inside' : 'Outside', set: i ? 'inside' : 'outside', state: 'shot', src })) },
    info: { address: { street: l.address_street || '', city: l.address_city || '', state: l.address_state || '', zip: l.address_zip || '' }, phone: l.phone || '',
      hours: pHours(l.google_hours_json), details: [], map_query: [l.name, l.address_street, l.address_city, l.address_state].filter(Boolean).join(', '),
      links: { website: l.website || '', instagram: l.instagram ? 'https://instagram.com/' + String(l.instagram).replace(/^@/, '') : '', facebook: l.facebook || '', tiktok: l.tiktok || '', directory: '/directory/' + l.slug },
      ordering: { state: 'link', order_url: l.website || '', pos: '' } },
  };
}
async function pitchByCode(code: unknown) {
  const c = clean(code, 20).toLowerCase(); if (!/^[a-z0-9]{8,20}$/.test(c)) return null;
  const { data } = await db.from('ve_branddesk_pitches').select('*').eq('code', c).maybeSingle();
  return data && data.status !== 'closed' ? data : null;
}
async function emailSend(payload: Record<string, unknown>) {
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  const r = await fetch(`${SUPABASE_URL}/functions/v1/email-send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` }, body: JSON.stringify(payload) });
  return await r.json().catch(() => ({ ok: false, error: `email-send ${r.status}` }));
}
async function allowListing(slug: string, by: string | null) {
  const s = await settings(); if (s.allowed.includes(slug)) return;
  await db.from('ve_site_settings').update({ value: { live: s.live, allowed: s.allowed.concat([slug]) }, updated_at: new Date().toISOString(), updated_by: by }).eq('key', 'branddesk');
}

async function pitchAdmin(b: any, m: any) {
  if (!m?.is_superadmin) return json({ error: 'admin_only' }, 403);
  const action = String(b.action);
  if (action === 'ranking') {
    const { data, error } = await db.rpc('ve_branddesk_ranking', { p_chapter: b.chapter ? clean(b.chapter, 40) : null });
    if (error) return json({ error: 'ranking_failed', message: error.message }, 500);
    return json({ ok: true, rows: data || [] });
  }
  const l = await pitchListing({ slug: b.slug }); if (!l) return json({ error: 'not_found' }, 404);
  let { data: p } = await db.from('ve_branddesk_pitches').select('*').eq('listing_id', l.id).maybeSingle();
  if (action === 'pitch_admin') {
    const { data: rank } = await db.rpc('ve_branddesk_ranking', { p_chapter: null });
    const row = (rank || []).find((r: any) => r.listing_id === l.id) || null;
    const audit = p?.audit_id || row?.audit_id || null;
    return json({ ok: true, listing: { id: l.id, name: l.name, slug: l.slug, city: l.address_city, category: l.category }, pitch: p, rank: row,
      summary: await auditSummary(audit), looks: Object.fromEntries(Object.entries(PITCH_LOOKS).map(([k, v]) => [k, v.name])), plan: PLAN });
  }
  if (action === 'pitch_save') {
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { updated_at: now };
    if ('note' in b) patch.note = String(b.note ?? '').replace(/\r/g, '').trim().slice(0, 1500) || null;
    if ('look' in b && PITCH_LOOKS[b.look]) patch.look = b.look;
    if ('contact_name' in b) patch.contact_name = clean(b.contact_name, 120) || null;
    if ('contact_email' in b) { const e = clean(b.contact_email, 200).toLowerCase(); if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return json({ error: 'bad_email' }, 400); patch.contact_email = e || null; }
    if ('warm' in b) patch.warm = !!b.warm;
    if (['draft', 'ready', 'closed'].includes(b.status)) patch.status = b.status;
    if (!p) {
      const { data: rank } = await db.rpc('ve_branddesk_ranking', { p_chapter: null });
      const row = (rank || []).find((r: any) => r.listing_id === l.id);
      let auditId = row?.audit_id || null;
      if (!auditId) { const { data: a } = await db.from('ve_audits').select('id').eq('listing_id', l.id).eq('status', 'done').eq('tier', 'full').order('created_at', { ascending: false }).limit(1); auditId = a?.[0]?.id || null; }
      if (!('contact_email' in b) && row?.contact_email) patch.contact_email = row.contact_email;
      const ins = { listing_id: l.id, code: pitchCode(), audit_id: auditId, created_by: m.id, ...patch };
      const { data, error } = await db.from('ve_branddesk_pitches').insert(ins).select('*').single();
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      p = data;
    } else {
      if (b.refresh_audit) { const { data: a } = await db.from('ve_audits').select('id').eq('listing_id', l.id).eq('status', 'done').eq('tier', 'full').order('created_at', { ascending: false }).limit(1); if (a?.[0]) patch.audit_id = a[0].id; }
      const { data, error } = await db.from('ve_branddesk_pitches').update(patch).eq('id', p.id).select('*').single();
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      p = data;
    }
    return json({ ok: true, pitch: p });
  }
  if (action === 'pitch_send') {
    if (!p) return json({ error: 'no_pitch' }, 404);
    const test = b.test === true;
    const to = test ? String(m.email || '').toLowerCase() : String(p.contact_email || '');
    if (!to) return json({ error: 'no_email', message: 'Add their email first.' }, 400);
    if (!test && !p.audit_id) return json({ error: 'no_audit', message: 'This business has no audit yet.' }, 409);
    let code = p.link_code;
    const dest = `${SITE}/business/pitch?c=${p.code}`;
    if (!test && !code) {
      for (let i = 0; i < 4 && !code; i++) {
        const c = 'bd-' + pitchCode().slice(0, 7);
        const { error } = await db.from('ve_links').insert({ code: c, label: ('BrandDesk pitch: ' + l.name).slice(0, 120), destination: dest, initiative_slug: 'branddesk-pitch',
          tags: ['branddesk-pitch', 'branddesk'], channel: 'email', recipient_email: to.slice(0, 200), recipient_name: (p.contact_name || l.name).slice(0, 120), active: true });
        if (!error) code = c;
      }
      if (code) await db.from('ve_branddesk_pitches').update({ link_code: code }).eq('id', p.id);
    }
    const link = test ? dest + '&preview=1' : code ? `${SITE}/go/${code}` : dest;
    const first = clean(p.contact_name, 60).split(' ')[0];
    const paras = [
      `Hi ${first || 'there'},`,
      ...(p.note ? String(p.note).split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean) : []),
      `I'm Sean, I run Vegans Explore. We looked at ${l.name} online before I reached out, and I put together a short page for you: what we found, what your home page could look like on our frame, and what your first two weeks with us would be.`,
      `<a href="${link}">See what we put together for ${esc(l.name)}</a>`,
      `There's no pressure either way. If it's not the right time, the page says so too.`,
      `Sean A. Russell<br>Vegans Explore`,
    ];
    const why = `You are getting this because ${l.name} is listed in the Vegans Explore Directory`;
    const linkIdx = paras.length - 3;
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px">${paras.map((x, i) => `<p style="margin:0 0 16px">${i === linkIdx || i === paras.length - 1 ? x : esc(x)}</p>`).join('')}` +
      `<p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#777">${esc(why)}. <a href="{{unsubscribe_url}}" style="color:#777">Don't email me again</a>.<br>{{postal_address}}</p></div>`;
    const text = paras.map((x) => x.replace(/<a href="([^"]+)">([^<]+)<\/a>/, '$2: $1').replace(/<br>/g, '\n')).join('\n\n') + `\n\n--\n${why}.\nDon't email me again: {{unsubscribe_url}}\n{{postal_address}}`;
    const subject = (test ? '[Test] ' : '') + `We looked at ${l.name} before reaching out`;
    const res = await emailSend({ brand: 'lesaruss', campaign_ref: test ? `bd-pitch-test-${p.id}-${Date.now()}` : `bd-pitch-${p.id}`, list_ref: 'branddesk-pitch',
      subject, html, text, recipients: [{ email: to, first_name: first || undefined, name: p.contact_name || undefined }] });
    const result = res?.results?.[0]?.result || (res?.ok ? 'unknown' : 'failed');
    if (test) return json({ ok: result === 'sent' || result === 'already_sent', result, to, detail: res?.errors || res?.results?.[0]?.error || null });
    if (result !== 'sent' && result !== 'already_sent') return json({ error: 'send_failed', result, detail: res?.results?.[0]?.error || res?.error || res?.errors || null }, 502);
    await allowListing(l.slug, m.id);
    const { data } = await db.from('ve_branddesk_pitches').update({ status: 'sent', sent_at: new Date().toISOString(), sent_by: m.id, updated_at: new Date().toISOString() }).eq('id', p.id).select('*').single();
    return json({ ok: true, result, pitch: data });
  }
  return json({ error: 'unknown_action' }, 400);
}

async function pitchPublic(req: Request, b: any, m: any) {
  const p = await pitchByCode(b.code);
  if (!p) return json({ error: 'not_found' }, 404);
  const l = await pitchListing({ id: p.listing_id }); if (!l) return json({ error: 'not_found' }, 404);
  const action = String(b.action);
  if (action === 'pitch_site') return json({ ok: true, cartridge: await pitchCartridge(l, p.look) });
  if (action === 'pitch_view') {
    const team = !!m?.is_superadmin || b.preview === true;
    if (!team) {
      const now = new Date().toISOString();
      await db.from('ve_branddesk_pitches').update({ views: (p.views || 0) + 1, last_viewed_at: now, first_viewed_at: p.first_viewed_at || now,
        status: ['sent', 'ready', 'draft'].includes(p.status) ? 'viewed' : p.status }).eq('id', p.id);
    }
    const chapter = (await db.rpc('ve_chapter_of', { p_city: l.address_city || '', p_state: l.address_state || '' })).data || '';
    const { data: cm } = await db.from('members').select('name').eq('ve_role', 'community_manager').eq('membership_status', 'active').eq('home_community', chapter).limit(1);
    return json({ ok: true, team, business: { name: l.name, slug: l.slug, city: l.address_city, state: l.address_state || '', chapter, logo: l.logo_url || null, category: l.category,
        photos: (Array.isArray(l.gallery_urls) ? l.gallery_urls : []).filter((u: any) => typeof u === 'string').slice(0, 6) },
      contact: { name: p.contact_name || '', email: p.contact_email || '' }, note: p.note || '', look: p.look, look_name: (PITCH_LOOKS[p.look] || PITCH_LOOKS.fresh).name,
      summary: await auditSummary(p.audit_id), plan: Array.isArray(p.plan) && p.plan.length ? p.plan : PLAN,
      prices: { setup: AMOUNTS.setup, setup3: AMOUNTS.setup3, setup6: AMOUNTS.setup6, monthly: AMOUNTS.monthly, social: AMOUNTS.social },
      who: cm?.[0]?.name ? clean(cm[0].name, 60).split(' ')[0] : null, choice: p.choice, follow_up_on: p.follow_up_on, managed: `/business/managed?listing=${encodeURIComponent(l.slug)}` });
  }
  if (action === 'pitch_choice') {
    const choice = ['ready', 'think', 'talk', 'no'].includes(b.choice) ? b.choice : '';
    if (!choice) return json({ error: 'bad_choice' }, 400);
    if (p.choice_at && Date.now() - Date.parse(p.choice_at) < 20000) return json({ error: 'slow_down' }, 429);
    const team = !!m?.is_superadmin || b.preview === true;
    const date = choice === 'think' && /^\d{4}-\d{2}-\d{2}$/.test(String(b.follow_up_on || '')) ? String(b.follow_up_on) : null;
    if (choice === 'think' && !date) return json({ error: 'date_needed', message: 'Pick a day for us to check back.' }, 400);
    const note = String(b.note ?? '').replace(/\r/g, '').trim().slice(0, 1200) || null;
    const name = clean(b.name, 120) || p.contact_name || null;
    const email = clean(b.email, 200).toLowerCase() || p.contact_email || null;
    if (choice === 'talk' && !email && !clean(b.phone, 40)) return json({ error: 'contact_needed', message: 'Leave an email or phone so we can reach you.' }, 400);
    const phone = clean(b.phone, 40);
    if (team) return json({ ok: true, preview: true, next: choice === 'ready' ? `/business/managed?listing=${encodeURIComponent(l.slug)}&preview=plan` : null });
    await db.from('ve_branddesk_pitches').update({ choice, choice_at: new Date().toISOString(), choice_note: [note, phone ? 'Phone: ' + phone : ''].filter(Boolean).join('\n') || null,
      follow_up_on: date, contact_name: name, contact_email: email, status: 'chose', updated_at: new Date().toISOString() }).eq('id', p.id);
    if (choice === 'ready') await allowListing(l.slug, p.sent_by || p.created_by || null);
    const WORD: Record<string, string> = { ready: 'is ready to start', think: 'wants to think it over', talk: 'wants to talk to someone', no: 'says not now' };
    await mail(TEAM_EMAIL, `${l.name} ${WORD[choice]} (BrandDesk pitch)`,
      `<p><b>${esc(name || l.name)}</b>${email ? ' (' + esc(email) + ')' : ''}${phone ? ', ' + esc(phone) : ''} ${WORD[choice]} after their pitch page for <b>${esc(l.name)}</b>.</p>` +
      (date ? `<p>Check back on <b>${esc(date)}</b>.</p>` : '') + (note ? `<p>${esc(note).replace(/\n/g, '<br>')}</p>` : '') +
      `<p>It is in the Inbox, and in <a href="${SITE}/admin/depot/branddesk#pitch/${l.slug}">Depot &gt; BrandDesk</a>. Reply within 24 hours.</p>`, email || TEAM_EMAIL);
    if (email && choice !== 'ready') {
      const line = choice === 'think' ? `We'll check back with you on ${new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. Nothing changes before then.`
        : choice === 'talk' ? 'Someone from our team will reach out within a day.' : 'Thank you for looking. Your Vegans Explore page stays yours, free, whatever you decide.';
      await mail(email, `About ${l.name} and Vegans Explore`, `<p>${esc(name ? 'Hi ' + name.split(' ')[0] + ',' : 'Hi,')}</p><p>${esc(line)}</p><p>Vegans Explore</p>`);
    }
    return json({ ok: true, next: choice === 'ready' ? `/business/managed?listing=${encodeURIComponent(l.slug)}` : null });
  }
  return json({ error: 'unknown_action' }, 400);
}


// ---- The monthly check-in and report (canon-ve-front-of-house: "a monthly Community Manager check-in on a fixed question set").
// Logan's defaults, Sean's to change: the questions, opened on each client's month after the one they joined, reminder on the 10th.
const ROTATION = ['Influencer night', 'DJ night', 'Customer appreciation', 'Giveaway', 'Scavenger hunt stop', 'Community night', 'None this month'];
const CHECKIN_STEPS = [
  { key: 'month', title: 'How the month went', q: [
    { k: 'rating', label: 'How was the month for the business?', type: 'choice', options: ['Great', 'Good', 'Okay', 'Slow', 'Hard'], required: true },
    { k: 'busiest', label: 'When were they busiest, and when was it quiet?', type: 'text' },
    { k: 'sold_best', label: 'What sold best? Anything that did not move?', type: 'text', required: true },
    { k: 'heard', label: 'What did customers say (reviews, comments, at the counter)?', type: 'text' } ] },
  { key: 'coming', title: "What's coming", q: [
    { k: 'menu', label: 'Any menu changes coming? A new item gets its photo on the next shoot.', type: 'text' },
    { k: 'hours', label: 'Any change to hours, closures or holidays?', type: 'text' },
    { k: 'events', label: 'Anything they are hosting or taking part in?', type: 'text' } ] },
  { key: 'next', title: 'Next month', q: [
    { k: 'campaign', label: 'Which campaign do they want next month?', type: 'choice', options: ROTATION, required: true },
    { k: 'from_us', label: 'What did they like from us this month, and what should we do better?', type: 'text' },
    { k: 'needs', label: 'Anything they need from us?', type: 'text' } ] },
];
const CHECKIN_Q = CHECKIN_STEPS.flatMap((st) => st.q);
const TZ_ET = 'America/New_York';
function etParts(d = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: TZ_ET, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const [y, mo, da] = f.split('-').map(Number); return { y, mo, da };
}
const monthStart = (y: number, mo: number) => `${y}-${String(mo).padStart(2, '0')}-01`;
function monthBounds(month: string) {
  const [y, mo] = month.split('-').map(Number);
  const next = mo === 12 ? monthStart(y + 1, 1) : monthStart(y, mo + 1), prev = mo === 1 ? monthStart(y - 1, 12) : monthStart(y, mo - 1);
  return { from: month, to: next, prev };
}
const monthName = (month: string) => new Date(month + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
async function chapterOfListing(listingId: string) {
  const { data: l } = await db.from('listings').select('address_city, address_state').eq('id', listingId).maybeSingle();
  const { data: ch } = await db.rpc('ve_chapter_of', { p_city: l?.address_city || '', p_state: l?.address_state || '' });
  const c = String(ch || ''); return c === 'dc' ? 'washington-dc' : c;
}
async function chapterManager(listingId: string) {
  const ch = await chapterOfListing(listingId);
  if (!ch) return null;
  const { data } = await db.from('members').select('id, name, email').eq('ve_role', 'community_manager').eq('home_community', ch).eq('membership_status', 'active').limit(1);
  return data?.[0] || null;
}
async function checkinTeam(m: any, row: any) {
  if (!m) return false;
  if (m.is_superadmin || row.assigned_to === m.id) return true;
  const { data: me } = await db.from('members').select('ve_role, home_community').eq('id', m.id).maybeSingle();
  return me?.ve_role === 'community_manager' && !!me.home_community && me.home_community === await chapterOfListing(row.listing_id);
}
async function monthNumbers(listingId: string, month: string) {
  const b = monthBounds(month);
  const [{ data: now }, { data: before }] = await Promise.all([
    db.rpc('ve_branddesk_month_numbers', { p_listing: listingId, p_from: b.from, p_to: b.to }),
    db.rpc('ve_branddesk_month_numbers', { p_listing: listingId, p_from: b.prev, p_to: b.from }),
  ]);
  return { now: now || {}, before: before || {}, through: new Date().toISOString() };
}
const checkinLink = (id: string) => `${SITE}/business/checkin?id=${id}`;
async function openCheckin(a: any, month: string) {
  const { data: had } = await db.from('ve_branddesk_checkins').select('*').eq('account_id', a.id).eq('month', month).maybeSingle();
  if (had) return { row: had, made: false };
  const cm = await chapterManager(a.listing_id);
  const { data: row, error } = await db.from('ve_branddesk_checkins').insert({ account_id: a.id, listing_id: a.listing_id, month, assigned_to: cm?.id || null }).select('*').single();
  if (error) throw new Error(error.message);
  const { data: l } = await db.from('listings').select('name').eq('id', a.listing_id).maybeSingle();
  await mail(cm?.email || TEAM_EMAIL, `Monthly check-in: ${l?.name || 'a client'} (${monthName(month)})`,
    `<p>${cm ? 'Hi ' + esc(String(cm.name || '').split(' ')[0]) + ',' : 'Team,'}</p><p>It is time for <b>${esc(l?.name || '')}</b>'s monthly check-in for ${esc(monthName(month))}. ` +
    `Talk with the owner (a call or a visit), go through the questions with them, then write what the month meant and what we do next. Sending it puts their report on their dashboard.</p>` +
    `<p><a href="${checkinLink(row.id)}">Open the check-in</a>. Due by the 10th.</p>`);
  return { row, made: true };
}
function checkinShape(r: any) {
  return { id: r.id, account_id: r.account_id, month: r.month, month_name: monthName(r.month), status: r.status, assigned_to: r.assigned_to, answers: r.answers || {},
    summary: r.summary || '', next_month: r.next_month || '', numbers: r.numbers || null, sent_at: r.sent_at, updated_at: r.updated_at };
}
async function checkins(req: Request, b: any, m: any) {
  const act = String(b.action);
  if (act === 'checkin_sweep') {
    const sec = await secret('CRON_SECRET');
    if (!sec || req.headers.get('x-cron-secret') !== sec) return json({ error: 'forbidden' }, 403);
    const { y, mo, da } = etParts(), month = monthStart(y, mo);
    const { data: accts } = await db.from('ve_branddesk_accounts').select('*').in('status', ['active', 'canceling']).lt('activated_at', month + 'T05:00:00Z');
    let opened = 0, reminded = 0;
    for (const a of accts || []) {
      try {
        const { row, made } = await openCheckin(a, month); if (made) opened++;
        if (da >= 10 && row.status !== 'sent' && !row.reminded_at && !made) {
          const { data: who2 } = row.assigned_to ? await db.from('members').select('email, name').eq('id', row.assigned_to).maybeSingle() : { data: null };
          const { data: l } = await db.from('listings').select('name').eq('id', a.listing_id).maybeSingle();
          await mail(who2?.email || TEAM_EMAIL, `Reminder: ${l?.name || 'a client'}'s check-in is due`, `<p>${esc(l?.name || '')}'s monthly check-in for ${esc(monthName(month))} has not been sent yet. It was due by the 10th.</p><p><a href="${checkinLink(row.id)}">Open the check-in</a></p>`);
          await db.from('ve_branddesk_checkins').update({ reminded_at: new Date().toISOString() }).eq('id', row.id);
          reminded++;
        }
      } catch (e) { console.error('checkin_sweep', a.id, e); }
    }
    return json({ ok: true, month, accounts: (accts || []).length, opened, reminded });
  }
  if (!m) return json({ error: 'not_authenticated', message: 'Sign in first.' }, 401);
  if (act === 'checkin_start') {
    if (!m.is_superadmin) return json({ error: 'forbidden' }, 403);
    const a = await accountFor(b, m, true);
    if (!a || !LIVE_STATES.includes(a.status)) return json({ error: 'not_found', message: 'Only a live client gets a check-in.' }, 404);
    const { y, mo } = etParts();
    const { row } = await openCheckin(a, monthStart(y, mo));
    return json({ ok: true, id: row.id });
  }
  if (act === 'checkin_list') {
    let q = db.from('ve_branddesk_checkins').select('*, listings(name, slug)').order('month', { ascending: false }).limit(100);
    if (isId(b.account_id)) { if (!m.is_superadmin) return json({ error: 'forbidden' }, 403); q = q.eq('account_id', b.account_id); }
    else if (!m.is_superadmin) q = q.eq('assigned_to', m.id);
    const { data } = await q;
    return json({ ok: true, checkins: (data || []).map((r: any) => ({ ...checkinShape(r), listing: r.listings })) });
  }
  if (!isId(b.id)) return json({ error: 'bad_id' }, 400);
  const { data: row } = await db.from('ve_branddesk_checkins').select('*').eq('id', b.id).maybeSingle();
  if (!row) return json({ error: 'not_found' }, 404);
  const team = await checkinTeam(m, row);
  const { data: l } = await db.from('listings').select('id, name, slug, owner_member_id').eq('id', row.listing_id).maybeSingle();
  if (act === 'checkin_get') {
    if (!team) {
      const { data: a } = await db.from('ve_branddesk_accounts').select('member_id').eq('id', row.account_id).maybeSingle();
      if (row.status !== 'sent' || !(a?.member_id === m.id || l?.owner_member_id === m.id)) return json({ error: 'not_found' }, 404);
    }
    const out = checkinShape(row);
    if (!out.numbers) out.numbers = await monthNumbers(row.listing_id, row.month);
    const { data: by } = row.assigned_to ? await db.from('members').select('name').eq('id', row.assigned_to).maybeSingle() : { data: null };
    return json({ ok: true, team, checkin: out, listing: { name: l?.name, slug: l?.slug }, steps: CHECKIN_STEPS, assigned_name: by?.name || null });
  }
  if (!team) return json({ error: 'forbidden' }, 403);
  if (row.status === 'sent') return json({ error: 'sent', message: 'This report is sent and stays as it went.' }, 409);
  const answers: Record<string, string> = { ...(row.answers || {}) };
  const inA = b.answers && typeof b.answers === 'object' ? b.answers : {};
  for (const q of CHECKIN_Q) {
    if (!(q.k in inA)) continue;
    const v = String(inA[q.k] ?? '').replace(/\r/g, '').trim().slice(0, 1200);
    if (q.type === 'choice' && v && !(q.options || []).includes(v)) return json({ error: 'bad_choice', field: q.k }, 400);
    answers[q.k] = v;
  }
  const txt = (v: unknown, n: number) => String(v ?? '').replace(/\r/g, '').trim().slice(0, n);
  const patch: Record<string, unknown> = { answers, status: 'in_progress', updated_at: new Date().toISOString(), updated_by: m.id };
  if ('summary' in b) patch.summary = txt(b.summary, 4000) || null;
  if ('next_month' in b) patch.next_month = txt(b.next_month, 4000) || null;
  if (act === 'checkin_save') {
    await db.from('ve_branddesk_checkins').update(patch).eq('id', row.id);
    return json({ ok: true });
  }
  if (act === 'checkin_send') {
    const missing = CHECKIN_Q.filter((q) => q.required && !answers[q.k]).map((q) => q.k);
    if (missing.length) return json({ error: 'missing', fields: missing, message: 'Answer every question marked required first.' }, 400);
    const summary = String(patch.summary ?? row.summary ?? ''), next = String(patch.next_month ?? row.next_month ?? '');
    if (summary.length < 40) return json({ error: 'summary', message: 'Write what the month meant for them (a few sentences).' }, 400);
    if (next.length < 20) return json({ error: 'next_month', message: 'Say what we do next month.' }, 400);
    const numbers = await monthNumbers(row.listing_id, row.month);
    const at = new Date().toISOString();
    const { data: done } = await db.from('ve_branddesk_checkins').update({ ...patch, status: 'sent', numbers, sent_at: at, sent_by: m.id }).eq('id', row.id).neq('status', 'sent').select('id').maybeSingle();
    if (!done) return json({ error: 'sent', message: 'This report is already sent.' }, 409);
    const { data: a } = await db.from('ve_branddesk_accounts').select('member_id, test').eq('id', row.account_id).maybeSingle();
    const { data: owner } = a ? await db.from('members').select('name, email').eq('id', a.member_id).maybeSingle() : { data: null };
    const link = `${SITE}/directory/${l?.slug}?tab=brand&pd=managed&bd=reports&r=${row.id}`;
    if (owner?.email) await mail(owner.email, `Your ${monthName(row.month)} report from Vegans Explore`,
      `<p>Hi ${esc(String(owner.name || '').split(' ')[0] || 'there')},</p><p>Here is how ${esc(monthName(row.month))} went for <b>${esc(l?.name || '')}</b>.</p>` +
      summary.split(/\n{2,}/).map((x) => `<p>${esc(x).replace(/\n/g, '<br>')}</p>`).join('') +
      `<p><b>Next month:</b> ${esc(next).replace(/\n/g, '<br>')}</p><p><a href="${link}">See the full report and the numbers</a> on your dashboard.</p><p>Vegans Explore</p>`);
    return json({ ok: true, sent_at: at });
  }
  return json({ error: 'unknown_action' }, 400);
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
      case 'client': return await client(b, m);
      case 'step': return await stepSet(b, m);
      case 'archive': return await archive(b, m);
      case 'file_upload_url': return await fileUploadUrl(b, m);
      case 'file_done': return await fileDone(b, m);
      case 'file_remove': return await fileRemove(b, m);
      case 'ranking': case 'pitch_admin': case 'pitch_save': case 'pitch_send': return await pitchAdmin(b, m);
      case 'pitch_view': case 'pitch_site': case 'pitch_choice': return await pitchPublic(req, b, m);
      case 'checkin_sweep': case 'checkin_start': case 'checkin_list': case 'checkin_get': case 'checkin_save': case 'checkin_send': return await checkins(req, b, m);
      case 'ops_test_activate': return ops ? await opsTestActivate(b, m) : json({ error: 'ops_only' }, 403);
      default: return json({ error: 'unknown_action' }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: 'server', message: String((e as Error).message || e).slice(0, 300) }, 500);
  }
});
