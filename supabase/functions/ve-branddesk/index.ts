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
    cartridge: kit ? { status: kit.status, updated_at: kit.updated_at, data: kit.data } : null });
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
    `Your website, archived by Vegans Explore on ${when.slice(0, 10)}`, '', `Site: ${start.href}`, `Built with: ${platform}`,
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
    note: `${okPages.length} pages, ${savedAssets.length} files. Built with ${platform}.` }).select('id').single();
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
      case 'ops_test_activate': return ops ? await opsTestActivate(b, m) : json({ error: 'ops_only' }, 403);
      default: return json({ error: 'unknown_action' }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: 'server', message: String((e as Error).message || e).slice(0, 300) }, 500);
  }
});
